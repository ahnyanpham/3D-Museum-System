"""
Admin Order Management APIs
Add to api_routes_booking.py
"""

# ==================== ADMIN ORDER MANAGEMENT APIs ====================

@app.route('/api/admin/orders', methods=['GET'])
@permission_required('all')
def api_admin_get_orders():
    """Get all orders with filters (Admin only)"""
    status_filter = request.args.get('status', '')
    search = request.args.get('search', '')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    
    try:
        db = get_db_connection()
        cursor = db.cursor()
        
        # Build query
        query = """
            SELECT 
                o.ORDER_ID, o.ORDER_CODE, o.STATUS, o.QUANTITY,
                o.TOTAL_PRICE, o.CREATED_AT, o.UPDATED_AT, o.PAID_AT,
                o.PAYMENT_PROOF_PATH, o.TRANSACTION_REF,
                c.CUSTOMER_ID, c.FULLNAME, c.PHONE, c.EMAIL,
                tt.TYPE_NAME,
                u.USERNAME as CONFIRMED_BY_USERNAME,
                o.REJECTION_REASON
            FROM "ORDER" o
            JOIN CUSTOMER c ON o.CUSTOMER_ID = c.CUSTOMER_ID
            JOIN TICKET_TYPE tt ON o.TICKET_TYPE_ID = tt.TICKET_TYPE_ID
            LEFT JOIN USER u ON o.CONFIRMED_BY = u.USER_ID
            WHERE 1=1
        """
        params = []
        
        if status_filter:
            query += " AND o.STATUS = ?"
            params.append(status_filter)
        
        if search:
            query += """ AND (
                o.ORDER_CODE LIKE ? OR
                c.FULLNAME LIKE ? OR
                c.PHONE LIKE ? OR
                c.EMAIL LIKE ?
            )"""
            search_term = f'%{search}%'
            params.extend([search_term] * 4)
        
        # Count total
        count_query = f"SELECT COUNT(*) FROM ({query}) AS subquery"
        cursor.execute(count_query, params)
        total = cursor.fetchone()[0]
        
        # Add pagination
        query += " ORDER BY o.CREATED_AT DESC LIMIT ? OFFSET ?"
        params.extend([per_page, (page - 1) * per_page])
        
        cursor.execute(query, params)
        
        orders = []
        for row in cursor.fetchall():
            orders.append({
                'order_id': row[0],
                'order_code': row[1],
                'status': row[2],
                'quantity': row[3],
                'total_price': row[4],
                'created_at': row[5],
                'updated_at': row[6],
                'paid_at': row[7],
                'has_proof': bool(row[8]),
                'transaction_ref': row[9],
                'customer': {
                    'customer_id': row[10],
                    'fullname': row[11],
                    'phone': row[12],
                    'email': row[13]
                },
                'ticket_type': row[14],
                'confirmed_by': row[15],
                'rejection_reason': row[16]
            })
        
        db.close()
        
        return jsonify({
            'success': True,
            'data': orders,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        logger.error(f"Admin get orders error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Lỗi: {str(e)}'
        }), 500


@app.route('/api/admin/orders/<int:order_id>', methods=['GET'])
@permission_required('all')
def api_admin_get_order_detail(order_id):
    """Get order detail (Admin)"""
    try:
        db = get_db_connection()
        cursor = db.cursor()
        
        cursor.execute("""
            SELECT * FROM v_order_details WHERE ORDER_ID = ?
        """, (order_id,))
        
        row = cursor.fetchone()
        
        if not row:
            db.close()
            return jsonify({
                'success': False,
                'message': 'Không tìm thấy đơn hàng'
            }), 404
        
        # Get column names
        columns = [description[0] for description in cursor.description]
        order = dict(zip(columns, row))
        
        # Get payment logs
        cursor.execute("""
            SELECT LOG_ID, ACTION, OLD_STATUS, NEW_STATUS, 
                   PERFORMED_AT, NOTES
            FROM PAYMENT_LOG
            WHERE ORDER_ID = ?
            ORDER BY PERFORMED_AT DESC
        """, (order_id,))
        
        logs = []
        for log_row in cursor.fetchall():
            logs.append({
                'log_id': log_row[0],
                'action': log_row[1],
                'old_status': log_row[2],
                'new_status': log_row[3],
                'performed_at': log_row[4],
                'notes': log_row[5]
            })
        
        order['logs'] = logs
        
        db.close()
        
        return jsonify({
            'success': True,
            'data': order
        })
        
    except Exception as e:
        logger.error(f"Admin get order detail error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Lỗi: {str(e)}'
        }), 500


@app.route('/api/admin/orders/<int:order_id>/approve', methods=['POST'])
@permission_required('all')
def api_admin_approve_order(order_id):
    """Approve order and create tickets"""
    data = request.get_json()
    admin_note = data.get('admin_note', '')
    
    try:
        db = get_db_connection()
        cursor = db.cursor()
        
        # Get order details
        cursor.execute("""
            SELECT o.STATUS, o.CUSTOMER_ID, o.TICKET_TYPE_ID, o.QUANTITY,
                   o.ORDER_CODE, o.TOTAL_PRICE,
                   c.EMAIL, c.FULLNAME
            FROM "ORDER" o
            JOIN CUSTOMER c ON o.CUSTOMER_ID = c.CUSTOMER_ID
            WHERE o.ORDER_ID = ?
        """, (order_id,))
        
        order_row = cursor.fetchone()
        
        if not order_row:
            db.close()
            return jsonify({
                'success': False,
                'message': 'Không tìm thấy đơn hàng'
            }), 404
        
        status = order_row[0]
        
        if status != 'waiting_confirmation':
            db.close()
            return jsonify({
                'success': False,
                'message': f'Chỉ có thể duyệt đơn hàng có trạng thái "Chờ xác nhận". Trạng thái hiện tại: {status}'
            }), 400
        
        customer_id = order_row[1]
        ticket_type_id = order_row[2]
        quantity = order_row[3]
        order_code = order_row[4]
        total_price = order_row[5]
        customer_email = order_row[6]
        customer_name = order_row[7]
        
        # Update order status
        paid_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        cursor.execute("""
            UPDATE "ORDER"
            SET STATUS = 'paid',
                PAID_AT = ?,
                CONFIRMED_BY = ?,
                CONFIRMED_AT = ?,
                ADMIN_NOTE = ?,
                UPDATED_AT = CURRENT_TIMESTAMP
            WHERE ORDER_ID = ?
        """, (paid_at, session['user_id'], paid_at, admin_note, order_id))
        
        # Create tickets
        ticket_ids = []
        purchase_date = datetime.now().strftime('%Y-%m-%d')
        
        for i in range(quantity):
            # Generate ticket code
            ticket_code = f"T{order_code}{i+1:02d}"
            
            cursor.execute("""
                INSERT INTO TICKET (
                    CUSTOMER_ID, TICKET_TYPE_ID, TICKET_CODE,
                    STATUS, PURCHASE_DATE, VALID_DATE, ORDER_ID
                ) VALUES (?, ?, ?, 'active', ?, ?, ?)
            """, (
                customer_id, ticket_type_id, ticket_code,
                purchase_date, purchase_date, order_id
            ))
            
            ticket_ids.append(cursor.lastrowid)
        
        db.commit()
        db.close()
        
        # Send confirmation email to customer
        try:
            EmailService.send_order_approved_email(
                customer_email, customer_name, order_code, 
                quantity, total_price, ticket_ids
            )
        except Exception as e:
            logger.error(f"Failed to send approval email: {str(e)}")
        
        logger.info(f"Order {order_code} approved by admin {session['username']}, created {quantity} tickets")
        
        return jsonify({
            'success': True,
            'message': f'Đã duyệt đơn hàng và tạo {quantity} vé thành công',
            'data': {
                'ticket_ids': ticket_ids
            }
        })
        
    except Exception as e:
        logger.error(f"Admin approve order error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Lỗi: {str(e)}'
        }), 500


@app.route('/api/admin/orders/<int:order_id>/reject', methods=['POST'])
@permission_required('all')
def api_admin_reject_order(order_id):
    """Reject order"""
    data = request.get_json()
    rejection_reason = data.get('rejection_reason', 'Không rõ lý do')
    
    if not rejection_reason:
        return jsonify({
            'success': False,
            'message': 'Vui lòng nhập lý do từ chối'
        }), 400
    
    try:
        db = get_db_connection()
        cursor = db.cursor()
        
        # Get order info
        cursor.execute("""
            SELECT o.STATUS, o.ORDER_CODE, c.EMAIL, c.FULLNAME
            FROM "ORDER" o
            JOIN CUSTOMER c ON o.CUSTOMER_ID = c.CUSTOMER_ID
            WHERE o.ORDER_ID = ?
        """, (order_id,))
        
        order_row = cursor.fetchone()
        
        if not order_row:
            db.close()
            return jsonify({
                'success': False,
                'message': 'Không tìm thấy đơn hàng'
            }), 404
        
        status = order_row[0]
        
        if status != 'waiting_confirmation':
            db.close()
            return jsonify({
                'success': False,
                'message': f'Chỉ có thể từ chối đơn hàng có trạng thái "Chờ xác nhận"'
            }), 400
        
        order_code = order_row[1]
        customer_email = order_row[2]
        customer_name = order_row[3]
        
        # Update order
        cursor.execute("""
            UPDATE "ORDER"
            SET STATUS = 'rejected',
                REJECTION_REASON = ?,
                CONFIRMED_BY = ?,
                CONFIRMED_AT = CURRENT_TIMESTAMP,
                UPDATED_AT = CURRENT_TIMESTAMP
            WHERE ORDER_ID = ?
        """, (rejection_reason, session['user_id'], order_id))
        
        db.commit()
        db.close()
        
        # Send rejection email to customer
        try:
            EmailService.send_order_rejected_email(
                customer_email, customer_name, order_code, rejection_reason
            )
        except Exception as e:
            logger.error(f"Failed to send rejection email: {str(e)}")
        
        logger.info(f"Order {order_code} rejected by admin {session['username']}")
        
        return jsonify({
            'success': True,
            'message': 'Đã từ chối đơn hàng'
        })
        
    except Exception as e:
        logger.error(f"Admin reject order error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Lỗi: {str(e)}'
        }), 500


@app.route('/api/admin/orders/stats', methods=['GET'])
@permission_required('all')
def api_admin_order_stats():
    """Get order statistics"""
    try:
        db = get_db_connection()
        cursor = db.cursor()
        
        # Count by status
        cursor.execute("""
            SELECT STATUS, COUNT(*) as COUNT, SUM(TOTAL_PRICE) as REVENUE
            FROM "ORDER"
            GROUP BY STATUS
        """)
        
        stats_by_status = {}
        for row in cursor.fetchall():
            stats_by_status[row[0]] = {
                'count': row[1],
                'revenue': row[2] or 0
            }
        
        # Today's stats
        cursor.execute("""
            SELECT COUNT(*), SUM(TOTAL_PRICE)
            FROM "ORDER"
            WHERE DATE(CREATED_AT) = DATE('now')
        """)
        
        today_row = cursor.fetchone()
        today_stats = {
            'count': today_row[0],
            'revenue': today_row[1] or 0
        }
        
        # Pending approval count
        cursor.execute("""
            SELECT COUNT(*) FROM "ORDER" 
            WHERE STATUS = 'waiting_confirmation'
        """)
        
        pending_count = cursor.fetchone()[0]
        
        db.close()
        
        return jsonify({
            'success': True,
            'data': {
                'by_status': stats_by_status,
                'today': today_stats,
                'pending_approval': pending_count
            }
        })
        
    except Exception as e:
        logger.error(f"Admin order stats error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Lỗi: {str(e)}'
        }), 500

"""
API Routes for Customer Ticket Management
Add these routes to your app.py
"""

from flask import request, jsonify, session
from auth import login_required, permission_required
import sqlite3
from datetime import datetime

# ============================================================================
# CUSTOMER TICKET ROUTES
# ============================================================================

@app.route('/api/customer/tickets', methods=['GET'])
@login_required
@permission_required('my_tickets')
def api_get_customer_tickets():
    """Get customer's tickets with pagination"""
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    status_filter = request.args.get('status', '')  # active, checked_in, checked_out, completed
    
    try:
        db = get_db_connection()
        cursor = db.cursor()
        
        # Get customer_id from user_id
        cursor.execute("""
            SELECT CUSTOMER_ID FROM CUSTOMER WHERE USER_ID = ?
        """, (session['user_id'],))
        
        customer_row = cursor.fetchone()
        if not customer_row:
            return jsonify({
                'success': False,
                'message': 'Không tìm thấy thông tin khách hàng'
            }), 404
        
        customer_id = customer_row[0]
        
        # Build query
        query = """
            SELECT 
                t.TICKET_ID, t.TICKET_CODE, t.QUANTITY, t.TOTAL_PRICE,
                t.VALID_DATE, t.PURCHASE_DATE, t.STATUS, t.PAYMENT_METHOD,
                tt.TYPE_NAME, tt.PRICE,
                vh.CHECK_IN_TIME, vh.CHECK_OUT_TIME, vh.RATING, vh.FEEDBACK
            FROM TICKET t
            JOIN TICKET_TYPE tt ON t.TICKET_TYPE_ID = tt.TICKET_TYPE_ID
            LEFT JOIN VISIT_HISTORY vh ON t.TICKET_ID = vh.TICKET_ID
            WHERE t.CUSTOMER_ID = ?
        """
        params = [customer_id]
        
        if status_filter:
            query += " AND t.STATUS = ?"
            params.append(status_filter)
        
        # Count total
        count_query = f"SELECT COUNT(*) FROM ({query}) AS subquery"
        cursor.execute(count_query, params)
        total = cursor.fetchone()[0]
        
        # Add pagination
        query += " ORDER BY t.PURCHASE_DATE DESC LIMIT ? OFFSET ?"
        params.extend([per_page, (page - 1) * per_page])
        
        cursor.execute(query, params)
        
        tickets = []
        for row in cursor.fetchall():
            # Determine status label
            status = row[6]
            status_labels = {
                'active': 'Hoạt động',
                'checked_in': 'Check-in',
                'checked_out': 'Check-out',
                'completed': 'Hoàn thành',
                'expired': 'Hết hạn',
                'cancelled': 'Đã hủy'
            }
            
            tickets.append({
                'ticket_id': row[0],
                'ticket_code': row[1],
                'quantity': row[2],
                'total_price': row[3],
                'valid_date': row[4],
                'purchase_date': row[5],
                'status': status,
                'status_label': status_labels.get(status, status),
                'payment_method': row[7],
                'ticket_type_name': row[8],
                'unit_price': row[9],
                'check_in_time': row[10],
                'check_out_time': row[11],
                'rating': row[12],
                'feedback': row[13]
            })
        
        db.close()
        
        return jsonify({
            'success': True,
            'data': tickets,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Lỗi: {str(e)}'
        }), 500


@app.route('/api/customer/tickets/<int:ticket_id>', methods=['GET'])
@login_required
@permission_required('my_tickets')
def api_get_customer_ticket_detail(ticket_id):
    """Get detailed ticket information with QR code data"""
    try:
        db = get_db_connection()
        cursor = db.cursor()
        
        # Get customer_id
        cursor.execute("""
            SELECT CUSTOMER_ID FROM CUSTOMER WHERE USER_ID = ?
        """, (session['user_id'],))
        
        customer_row = cursor.fetchone()
        if not customer_row:
            return jsonify({
                'success': False,
                'message': 'Không tìm thấy thông tin khách hàng'
            }), 404
        
        customer_id = customer_row[0]
        
        # Get ticket details
        cursor.execute("""
            SELECT 
                t.TICKET_ID, t.TICKET_CODE, t.QUANTITY, t.TOTAL_PRICE,
                t.VALID_DATE, t.PURCHASE_DATE, t.STATUS, t.PAYMENT_METHOD, t.NOTES,
                tt.TYPE_NAME, tt.PRICE, tt.DESCRIPTION,
                c.FULLNAME, c.PHONE, c.EMAIL,
                vh.CHECK_IN_TIME, vh.CHECK_OUT_TIME, vh.DURATION_MINUTES,
                vh.RATING, vh.FEEDBACK
            FROM TICKET t
            JOIN TICKET_TYPE tt ON t.TICKET_TYPE_ID = tt.TICKET_TYPE_ID
            JOIN CUSTOMER c ON t.CUSTOMER_ID = c.CUSTOMER_ID
            LEFT JOIN VISIT_HISTORY vh ON t.TICKET_ID = vh.TICKET_ID
            WHERE t.TICKET_ID = ? AND t.CUSTOMER_ID = ?
        """, (ticket_id, customer_id))
        
        row = cursor.fetchone()
        db.close()
        
        if not row:
            return jsonify({
                'success': False,
                'message': 'Không tìm thấy vé'
            }), 404
        
        # Status labels
        status = row[6]
        status_labels = {
            'active': 'Hoạt động',
            'checked_in': 'Check-in',
            'checked_out': 'Check-out',
            'completed': 'Hoàn thành',
            'expired': 'Hết hạn',
            'cancelled': 'Đã hủy'
        }
        
        ticket = {
            'ticket_id': row[0],
            'ticket_code': row[1],
            'quantity': row[2],
            'total_price': row[3],
            'valid_date': row[4],
            'purchase_date': row[5],
            'status': status,
            'status_label': status_labels.get(status, status),
            'payment_method': row[7],
            'notes': row[8],
            'ticket_type': {
                'name': row[9],
                'price': row[10],
                'description': row[11]
            },
            'customer': {
                'fullname': row[12],
                'phone': row[13],
                'email': row[14]
            },
            'visit': {
                'check_in_time': row[15],
                'check_out_time': row[16],
                'duration_minutes': row[17],
                'rating': row[18],
                'feedback': row[19]
            },
            'qr_data': f"TICKET-{row[1]}"  # QR code data
        }
        
        return jsonify({
            'success': True,
            'data': ticket
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Lỗi: {str(e)}'
        }), 500


@app.route('/api/customer/tickets/stats', methods=['GET'])
@login_required
@permission_required('my_tickets')
def api_get_customer_ticket_stats():
    """Get customer ticket statistics"""
    try:
        db = get_db_connection()
        cursor = db.cursor()
        
        # Get customer_id
        cursor.execute("""
            SELECT CUSTOMER_ID FROM CUSTOMER WHERE USER_ID = ?
        """, (session['user_id'],))
        
        customer_row = cursor.fetchone()
        if not customer_row:
            return jsonify({
                'success': False,
                'message': 'Không tìm thấy thông tin khách hàng'
            }), 404
        
        customer_id = customer_row[0]
        
        # Get statistics
        cursor.execute("""
            SELECT 
                COUNT(*) as total_tickets,
                SUM(CASE WHEN STATUS = 'active' THEN 1 ELSE 0 END) as active_tickets,
                SUM(CASE WHEN STATUS = 'completed' THEN 1 ELSE 0 END) as completed_tickets,
                SUM(TOTAL_PRICE) as total_spent
            FROM TICKET
            WHERE CUSTOMER_ID = ?
        """, (customer_id,))
        
        stats_row = cursor.fetchone()
        db.close()
        
        stats = {
            'total_tickets': stats_row[0] or 0,
            'active_tickets': stats_row[1] or 0,
            'completed_tickets': stats_row[2] or 0,
            'total_spent': stats_row[3] or 0
        }
        
        return jsonify({
            'success': True,
            'data': stats
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Lỗi: {str(e)}'
        }), 500


# ============================================================================
# STAFF TICKET SALES ROUTES
# ============================================================================

@app.route('/api/staff/customers/search', methods=['GET'])
@permission_required('customers')
def api_search_customers():
    """Search customers by name or phone"""
    search = request.args.get('q', '')
    limit = int(request.args.get('limit', 10))
    
    if not search or len(search) < 2:
        return jsonify({
            'success': True,
            'data': []
        })
    
    try:
        db = get_db_connection()
        cursor = db.cursor()
        
        cursor.execute("""
            SELECT 
                CUSTOMER_ID, FULLNAME, PHONE, EMAIL,
                ID_NUMBER, NATIONALITY
            FROM CUSTOMER
            WHERE (FULLNAME LIKE ? OR PHONE LIKE ?)
            ORDER BY FULLNAME ASC
            LIMIT ?
        """, (f'%{search}%', f'%{search}%', limit))
        
        customers = []
        for row in cursor.fetchall():
            customers.append({
                'customer_id': row[0],
                'fullname': row[1],
                'phone': row[2],
                'email': row[3],
                'id_number': row[4],
                'nationality': row[5]
            })
        
        db.close()
        
        return jsonify({
            'success': True,
            'data': customers
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Lỗi: {str(e)}'
        }), 500


@app.route('/api/staff/tickets/sell', methods=['POST'])
@permission_required('tickets')
def api_sell_ticket():
    """Sell ticket at counter"""
    data = request.get_json()
    customer_id = data.get('customer_id')
    ticket_type_id = data.get('ticket_type_id')
    quantity = data.get('quantity', 1)
    payment_method = data.get('payment_method', 'Tiền mặt')
    
    if not customer_id or not ticket_type_id:
        return jsonify({
            'success': False,
            'message': 'Thiếu thông tin'
        }), 400
    
    try:
        db = get_db_connection()
        cursor = db.cursor()
        
        # Get ticket type price
        cursor.execute("""
            SELECT PRICE, TYPE_NAME FROM TICKET_TYPE WHERE TICKET_TYPE_ID = ?
        """, (ticket_type_id,))
        
        ticket_type_row = cursor.fetchone()
        if not ticket_type_row:
            return jsonify({
                'success': False,
                'message': 'Loại vé không tồn tại'
            }), 404
        
        price = ticket_type_row[0]
        type_name = ticket_type_row[1]
        total_price = price * quantity
        
        # Generate ticket code
        now = datetime.now()
        ticket_code = f"MT{now.strftime('%y%m%d')}{now.strftime('%H%M%S')[-4:]}"
        
        # Insert ticket
        cursor.execute("""
            INSERT INTO TICKET (
                TICKET_CODE, TICKET_TYPE_ID, CUSTOMER_ID, QUANTITY,
                TOTAL_PRICE, VALID_DATE, PURCHASE_DATE, STATUS,
                PAYMENT_METHOD, CREATED_AT, UPDATED_AT
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
        """, (
            ticket_code, ticket_type_id, customer_id, quantity,
            total_price, now.strftime('%Y-%m-%d'), now.strftime('%Y-%m-%d %H:%M:%S'),
            payment_method, now.strftime('%Y-%m-%d %H:%M:%S'), now.strftime('%Y-%m-%d %H:%M:%S')
        ))
        
        ticket_id = cursor.lastrowid
        
        # Create invoice
        invoice_code = f"INV{now.strftime('%y%m%d')}{ticket_id:04d}"
        cursor.execute("""
            INSERT INTO INVOICE (
                INVOICE_CODE, USER_ID, CUSTOMER_ID, TOTAL_AMOUNT,
                DISCOUNT, TAX, FINAL_AMOUNT, PAYMENT_METHOD,
                PAYMENT_STATUS, INVOICE_DATE, CREATED_AT, UPDATED_AT
            ) VALUES (?, ?, ?, ?, 0, 0, ?, ?, 'Paid', ?, ?, ?)
        """, (
            invoice_code, session['user_id'], customer_id, total_price,
            total_price, payment_method, now.strftime('%Y-%m-%d %H:%M:%S'),
            now.strftime('%Y-%m-%d %H:%M:%S'), now.strftime('%Y-%m-%d %H:%M:%S')
        ))
        
        invoice_id = cursor.lastrowid
        
        # Create invoice detail
        cursor.execute("""
            INSERT INTO INVOICE_DETAIL (
                INVOICE_ID, TICKET_ID, QUANTITY, UNIT_PRICE, SUBTOTAL
            ) VALUES (?, ?, ?, ?, ?)
        """, (invoice_id, ticket_id, quantity, price, total_price))
        
        db.commit()
        db.close()
        
        return jsonify({
            'success': True,
            'message': 'Bán vé thành công',
            'data': {
                'ticket_id': ticket_id,
                'ticket_code': ticket_code,
                'invoice_code': invoice_code,
                'total_price': total_price
            }
        })
        
    except Exception as e:
        db.rollback()
        return jsonify({
            'success': False,
            'message': f'Lỗi: {str(e)}'
        }), 500


# ============================================================================
# SECURITY/GUIDE CHECK-IN/OUT ROUTES
# ============================================================================

@app.route('/api/checkin/search', methods=['GET'])
@permission_required('checkin')
def api_search_tickets_for_checkin():
    """Search tickets for check-in by name or ticket code"""
    search = request.args.get('q', '')
    limit = int(request.args.get('limit', 10))
    
    if not search or len(search) < 2:
        return jsonify({
            'success': True,
            'data': []
        })
    
    try:
        db = get_db_connection()
        cursor = db.cursor()
        
        cursor.execute("""
            SELECT 
                t.TICKET_ID, t.TICKET_CODE, t.STATUS,
                c.FULLNAME, c.PHONE,
                tt.TYPE_NAME, t.VALID_DATE
            FROM TICKET t
            JOIN CUSTOMER c ON t.CUSTOMER_ID = c.CUSTOMER_ID
            JOIN TICKET_TYPE tt ON t.TICKET_TYPE_ID = tt.TICKET_TYPE_ID
            WHERE (t.TICKET_CODE LIKE ? OR c.FULLNAME LIKE ?)
                AND t.STATUS IN ('active', 'checked_in')
            ORDER BY t.PURCHASE_DATE DESC
            LIMIT ?
        """, (f'%{search}%', f'%{search}%', limit))
        
        tickets = []
        for row in cursor.fetchall():
            status_labels = {
                'active': 'Hoạt động',
                'checked_in': 'Check-in'
            }
            
            tickets.append({
                'ticket_id': row[0],
                'ticket_code': row[1],
                'status': row[2],
                'status_label': status_labels.get(row[2], row[2]),
                'customer_name': row[3],
                'customer_phone': row[4],
                'ticket_type': row[5],
                'valid_date': row[6]
            })
        
        db.close()
        
        return jsonify({
            'success': True,
            'data': tickets
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Lỗi: {str(e)}'
        }), 500


@app.route('/api/checkin/<int:ticket_id>', methods=['POST'])
@permission_required('checkin')
def api_checkin_ticket(ticket_id):
    """Check in a ticket"""
    try:
        db = get_db_connection()
        cursor = db.cursor()
        
        # Check if ticket exists and is active
        cursor.execute("""
            SELECT TICKET_ID, STATUS, CUSTOMER_ID FROM TICKET WHERE TICKET_ID = ?
        """, (ticket_id,))
        
        ticket_row = cursor.fetchone()
        if not ticket_row:
            return jsonify({
                'success': False,
                'message': 'Không tìm thấy vé'
            }), 404
        
        if ticket_row[1] != 'active':
            return jsonify({
                'success': False,
                'message': f'Vé không thể check-in (trạng thái: {ticket_row[1]})'
            }), 400
        
        customer_id = ticket_row[2]
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        # Create visit history
        cursor.execute("""
            INSERT INTO VISIT_HISTORY (
                TICKET_ID, CUSTOMER_ID, CHECK_IN_TIME,
                GUIDE_ID, CREATED_AT
            ) VALUES (?, ?, ?, ?, ?)
        """, (ticket_id, customer_id, now, session['user_id'], now))
        
        # Update ticket status
        cursor.execute("""
            UPDATE TICKET 
            SET STATUS = 'checked_in', UPDATED_AT = ?
            WHERE TICKET_ID = ?
        """, (now, ticket_id))
        
        db.commit()
        db.close()
        
        return jsonify({
            'success': True,
            'message': 'Check-in thành công'
        })
        
    except Exception as e:
        db.rollback()
        return jsonify({
            'success': False,
            'message': f'Lỗi: {str(e)}'
        }), 500


@app.route('/api/checkout/<int:ticket_id>', methods=['POST'])
@permission_required('checkout')
def api_checkout_ticket(ticket_id):
    """Check out a ticket"""
    try:
        db = get_db_connection()
        cursor = db.cursor()
        
        # Check if ticket is checked in
        cursor.execute("""
            SELECT vh.HISTORY_ID, vh.CHECK_IN_TIME, t.STATUS
            FROM VISIT_HISTORY vh
            JOIN TICKET t ON vh.TICKET_ID = t.TICKET_ID
            WHERE vh.TICKET_ID = ? AND vh.CHECK_OUT_TIME IS NULL
            ORDER BY vh.HISTORY_ID DESC
            LIMIT 1
        """, (ticket_id,))
        
        visit_row = cursor.fetchone()
        if not visit_row:
            return jsonify({
                'success': False,
                'message': 'Vé chưa được check-in hoặc đã check-out'
            }), 400
        
        history_id = visit_row[0]
        check_in_time = datetime.strptime(visit_row[1], '%Y-%m-%d %H:%M:%S')
        now = datetime.now()
        
        # Calculate duration
        duration = int((now - check_in_time).total_seconds() / 60)
        
        # Update visit history
        cursor.execute("""
            UPDATE VISIT_HISTORY 
            SET CHECK_OUT_TIME = ?, DURATION_MINUTES = ?
            WHERE HISTORY_ID = ?
        """, (now.strftime('%Y-%m-%d %H:%M:%S'), duration, history_id))
        
        # Update ticket status
        cursor.execute("""
            UPDATE TICKET 
            SET STATUS = 'checked_out', UPDATED_AT = ?
            WHERE TICKET_ID = ?
        """, (now.strftime('%Y-%m-%d %H:%M:%S'), ticket_id))
        
        db.commit()
        db.close()
        
        return jsonify({
            'success': True,
            'message': 'Check-out thành công',
            'data': {
                'duration_minutes': duration
            }
        })
        
    except Exception as e:
        db.rollback()
        return jsonify({
            'success': False,
            'message': f'Lỗi: {str(e)}'
        }), 500


@app.route('/api/rating/<int:ticket_id>', methods=['POST'])
@permission_required('rating')
def api_add_rating(ticket_id):
    """Add rating and feedback"""
    data = request.get_json()
    rating = data.get('rating')
    feedback = data.get('feedback', '')
    
    if not rating or rating < 1 or rating > 5:
        return jsonify({
            'success': False,
            'message': 'Đánh giá phải từ 1 đến 5 sao'
        }), 400
    
    try:
        db = get_db_connection()
        cursor = db.cursor()
        
        # Update visit history
        cursor.execute("""
            UPDATE VISIT_HISTORY 
            SET RATING = ?, FEEDBACK = ?
            WHERE TICKET_ID = ? AND CHECK_OUT_TIME IS NOT NULL
            ORDER BY HISTORY_ID DESC
            LIMIT 1
        """, (rating, feedback, ticket_id))
        
        if cursor.rowcount == 0:
            return jsonify({
                'success': False,
                'message': 'Vé chưa được check-out'
            }), 400
        
        # Update ticket status to completed
        cursor.execute("""
            UPDATE TICKET 
            SET STATUS = 'completed', UPDATED_AT = ?
            WHERE TICKET_ID = ?
        """, (datetime.now().strftime('%Y-%m-%d %H:%M:%S'), ticket_id))
        
        db.commit()
        db.close()
        
        return jsonify({
            'success': True,
            'message': 'Đánh giá thành công'
        })
        
    except Exception as e:
        db.rollback()
        return jsonify({
            'success': False,
            'message': f'Lỗi: {str(e)}'
        }), 500

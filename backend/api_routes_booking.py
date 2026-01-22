"""
Online Booking API Routes
Museum Management System - Option 2: Manual Admin Approval
"""

from flask import request, jsonify, session
from auth import login_required, permission_required
from datetime import datetime, timedelta
import os
import hashlib
from werkzeug.utils import secure_filename

# File upload configuration
UPLOAD_FOLDER = '/home/www/museum-system/uploads/payments'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ==================== CUSTOMER BOOKING APIs ====================

@app.route('/api/booking/ticket-types', methods=['GET'])
def api_get_ticket_types():
    """Get available ticket types with prices"""
    try:
        db = get_db_connection()
        cursor = db.cursor()
        
        cursor.execute("""
            SELECT TICKET_TYPE_ID, TYPE_NAME, PRICE, DESCRIPTION
            FROM TICKET_TYPE
            ORDER BY TICKET_TYPE_ID
        """)
        
        ticket_types = []
        for row in cursor.fetchall():
            ticket_types.append({
                'ticket_type_id': row[0],
                'type_name': row[1],
                'price': row[2],
                'description': row[3]
            })
        
        db.close()
        
        return jsonify({
            'success': True,
            'data': ticket_types
        })
        
    except Exception as e:
        logger.error(f"Get ticket types error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Lỗi: {str(e)}'
        }), 500


@app.route('/api/booking/create-order', methods=['POST'])
@login_required
@permission_required('purchase')
def api_create_order():
    """Create new order"""
    data = request.get_json()
    
    ticket_type_id = data.get('ticket_type_id')
    quantity = data.get('quantity', 1)
    customer_note = data.get('customer_note', '')
    
    if not ticket_type_id or quantity < 1:
        return jsonify({
            'success': False,
            'message': 'Thông tin không hợp lệ'
        }), 400
    
    try:
        db = get_db_connection()
        cursor = db.cursor()
        
        # Get customer_id from user_id
        cursor.execute("""
            SELECT CUSTOMER_ID FROM CUSTOMER WHERE USER_ID = ?
        """, (session['user_id'],))
        
        customer_row = cursor.fetchone()
        if not customer_row:
            db.close()
            return jsonify({
                'success': False,
                'message': 'Không tìm thấy thông tin khách hàng'
            }), 404
        
        customer_id = customer_row[0]
        
        # Get ticket type price
        cursor.execute("""
            SELECT PRICE, TYPE_NAME FROM TICKET_TYPE WHERE TICKET_TYPE_ID = ?
        """, (ticket_type_id,))
        
        ticket_row = cursor.fetchone()
        if not ticket_row:
            db.close()
            return jsonify({
                'success': False,
                'message': 'Loại vé không tồn tại'
            }), 404
        
        unit_price = ticket_row[0]
        type_name = ticket_row[1]
        total_price = unit_price * quantity
        
        # Calculate expiry (24 hours from now)
        expires_at = (datetime.now() + timedelta(hours=24)).strftime('%Y-%m-%d %H:%M:%S')
        
        # Create order
        cursor.execute("""
            INSERT INTO "ORDER" (
                CUSTOMER_ID, TICKET_TYPE_ID, QUANTITY, 
                UNIT_PRICE, TOTAL_PRICE, STATUS,
                CUSTOMER_NOTE, EXPIRES_AT
            ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
        """, (
            customer_id, ticket_type_id, quantity,
            unit_price, total_price, customer_note, expires_at
        ))
        
        order_id = cursor.lastrowid
        
        # Get generated ORDER_CODE
        cursor.execute("""
            SELECT ORDER_CODE, PAYMENT_REFERENCE 
            FROM "ORDER" WHERE ORDER_ID = ?
        """, (order_id,))
        
        order_row = cursor.fetchone()
        order_code = order_row[0]
        payment_reference = order_row[1]
        
        db.commit()
        db.close()
        
        logger.info(f"Order created: {order_code} by customer {customer_id}")
        
        return jsonify({
            'success': True,
            'message': 'Tạo đơn hàng thành công',
            'data': {
                'order_id': order_id,
                'order_code': order_code,
                'ticket_type': type_name,
                'quantity': quantity,
                'unit_price': unit_price,
                'total_price': total_price,
                'payment_reference': payment_reference,
                'bank_info': {
                    'bank_name': 'ACB',
                    'account_number': '018812398',
                    'account_name': 'Bảo Tàng Bến Nhà Rồng',
                    'content': payment_reference
                },
                'expires_at': expires_at
            }
        })
        
    except Exception as e:
        logger.error(f"Create order error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Lỗi: {str(e)}'
        }), 500


@app.route('/api/booking/upload-proof/<int:order_id>', methods=['POST'])
@login_required
@permission_required('purchase')
def api_upload_payment_proof(order_id):
    """Upload payment proof screenshot"""
    
    # Check file upload
    if 'file' not in request.files:
        return jsonify({
            'success': False,
            'message': 'Không có file được upload'
        }), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({
            'success': False,
            'message': 'Không có file được chọn'
        }), 400
    
    if not allowed_file(file.filename):
        return jsonify({
            'success': False,
            'message': 'Chỉ chấp nhận file ảnh (PNG, JPG, JPEG, GIF)'
        }), 400
    
    # Check file size
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    
    if file_size > MAX_FILE_SIZE:
        return jsonify({
            'success': False,
            'message': 'File quá lớn (tối đa 5MB)'
        }), 400
    
    try:
        db = get_db_connection()
        cursor = db.cursor()
        
        # Get customer_id
        cursor.execute("""
            SELECT CUSTOMER_ID FROM CUSTOMER WHERE USER_ID = ?
        """, (session['user_id'],))
        
        customer_row = cursor.fetchone()
        if not customer_row:
            db.close()
            return jsonify({
                'success': False,
                'message': 'Không tìm thấy thông tin khách hàng'
            }), 404
        
        customer_id = customer_row[0]
        
        # Verify order belongs to customer
        cursor.execute("""
            SELECT STATUS, ORDER_CODE FROM "ORDER" 
            WHERE ORDER_ID = ? AND CUSTOMER_ID = ?
        """, (order_id, customer_id))
        
        order_row = cursor.fetchone()
        
        if not order_row:
            db.close()
            return jsonify({
                'success': False,
                'message': 'Không tìm thấy đơn hàng'
            }), 404
        
        status = order_row[0]
        order_code = order_row[1]
        
        if status not in ['pending', 'waiting_confirmation']:
            db.close()
            return jsonify({
                'success': False,
                'message': f'Không thể upload cho đơn hàng có trạng thái: {status}'
            }), 400
        
        # Save file
        filename = secure_filename(file.filename)
        file_ext = filename.rsplit('.', 1)[1].lower()
        new_filename = f"order_{order_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.{file_ext}"
        file_path = os.path.join(UPLOAD_FOLDER, new_filename)
        
        file.save(file_path)
        
        # Get transaction ref from form
        transaction_ref = request.form.get('transaction_ref', '')
        
        # Update order
        cursor.execute("""
            UPDATE "ORDER"
            SET STATUS = 'waiting_confirmation',
                PAYMENT_PROOF_PATH = ?,
                TRANSACTION_REF = ?,
                UPDATED_AT = CURRENT_TIMESTAMP
            WHERE ORDER_ID = ?
        """, (file_path, transaction_ref, order_id))
        
        db.commit()
        db.close()
        
        # Send notification email to admin
        try:
            EmailService.send_new_order_notification(order_id, order_code)
        except Exception as e:
            logger.error(f"Failed to send admin notification: {str(e)}")
        
        logger.info(f"Payment proof uploaded for order {order_code}")
        
        return jsonify({
            'success': True,
            'message': 'Upload minh chứng thành công. Đơn hàng đang chờ xác nhận.'
        })
        
    except Exception as e:
        logger.error(f"Upload proof error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Lỗi: {str(e)}'
        }), 500


@app.route('/api/booking/my-orders', methods=['GET'])
@login_required
@permission_required('purchase')
def api_get_my_orders():
    """Get customer's orders"""
    status_filter = request.args.get('status', '')
    
    try:
        db = get_db_connection()
        cursor = db.cursor()
        
        # Get customer_id
        cursor.execute("""
            SELECT CUSTOMER_ID FROM CUSTOMER WHERE USER_ID = ?
        """, (session['user_id'],))
        
        customer_row = cursor.fetchone()
        if not customer_row:
            db.close()
            return jsonify({
                'success': False,
                'message': 'Không tìm thấy thông tin khách hàng'
            }), 404
        
        customer_id = customer_row[0]
        
        # Build query
        query = """
            SELECT 
                o.ORDER_ID, o.ORDER_CODE, o.STATUS, o.QUANTITY,
                o.TOTAL_PRICE, o.CREATED_AT, o.PAID_AT, o.PAYMENT_PROOF_PATH,
                tt.TYPE_NAME, tt.PRICE,
                CASE o.STATUS
                    WHEN 'pending' THEN 'Chờ thanh toán'
                    WHEN 'waiting_confirmation' THEN 'Chờ xác nhận'
                    WHEN 'paid' THEN 'Đã thanh toán'
                    WHEN 'cancelled' THEN 'Đã hủy'
                    WHEN 'rejected' THEN 'Bị từ chối'
                END as STATUS_LABEL,
                o.REJECTION_REASON
            FROM "ORDER" o
            JOIN TICKET_TYPE tt ON o.TICKET_TYPE_ID = tt.TICKET_TYPE_ID
            WHERE o.CUSTOMER_ID = ?
        """
        params = [customer_id]
        
        if status_filter:
            query += " AND o.STATUS = ?"
            params.append(status_filter)
        
        query += " ORDER BY o.CREATED_AT DESC"
        
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
                'paid_at': row[6],
                'has_proof': bool(row[7]),
                'ticket_type': row[8],
                'unit_price': row[9],
                'status_label': row[10],
                'rejection_reason': row[11]
            })
        
        db.close()
        
        return jsonify({
            'success': True,
            'data': orders
        })
        
    except Exception as e:
        logger.error(f"Get my orders error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Lỗi: {str(e)}'
        }), 500


@app.route('/api/booking/order/<int:order_id>', methods=['GET'])
@login_required
@permission_required('purchase')
def api_get_order_detail(order_id):
    """Get order details"""
    try:
        db = get_db_connection()
        cursor = db.cursor()
        
        # Get customer_id
        cursor.execute("""
            SELECT CUSTOMER_ID FROM CUSTOMER WHERE USER_ID = ?
        """, (session['user_id'],))
        
        customer_row = cursor.fetchone()
        if not customer_row:
            db.close()
            return jsonify({
                'success': False,
                'message': 'Không tìm thấy thông tin khách hàng'
            }), 404
        
        customer_id = customer_row[0]
        
        # Get order details
        cursor.execute("""
            SELECT 
                o.ORDER_ID, o.ORDER_CODE, o.STATUS, o.QUANTITY,
                o.UNIT_PRICE, o.TOTAL_PRICE, o.PAYMENT_REFERENCE,
                o.BANK_NAME, o.BANK_ACCOUNT, o.BANK_ACCOUNT_NAME,
                o.PAYMENT_PROOF_PATH, o.TRANSACTION_REF,
                o.CREATED_AT, o.UPDATED_AT, o.PAID_AT, o.EXPIRES_AT,
                o.CUSTOMER_NOTE, o.REJECTION_REASON,
                tt.TYPE_NAME, tt.DESCRIPTION,
                c.FULLNAME, c.PHONE, c.EMAIL
            FROM "ORDER" o
            JOIN TICKET_TYPE tt ON o.TICKET_TYPE_ID = tt.TICKET_TYPE_ID
            JOIN CUSTOMER c ON o.CUSTOMER_ID = c.CUSTOMER_ID
            WHERE o.ORDER_ID = ? AND o.CUSTOMER_ID = ?
        """, (order_id, customer_id))
        
        row = cursor.fetchone()
        
        if not row:
            db.close()
            return jsonify({
                'success': False,
                'message': 'Không tìm thấy đơn hàng'
            }), 404
        
        order = {
            'order_id': row[0],
            'order_code': row[1],
            'status': row[2],
            'quantity': row[3],
            'unit_price': row[4],
            'total_price': row[5],
            'payment_reference': row[6],
            'bank_info': {
                'bank_name': row[7],
                'account_number': row[8],
                'account_name': row[9]
            },
            'payment_proof_path': row[10],
            'transaction_ref': row[11],
            'created_at': row[12],
            'updated_at': row[13],
            'paid_at': row[14],
            'expires_at': row[15],
            'customer_note': row[16],
            'rejection_reason': row[17],
            'ticket_type': {
                'name': row[18],
                'description': row[19]
            },
            'customer': {
                'fullname': row[20],
                'phone': row[21],
                'email': row[22]
            }
        }
        
        db.close()
        
        return jsonify({
            'success': True,
            'data': order
        })
        
    except Exception as e:
        logger.error(f"Get order detail error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Lỗi: {str(e)}'
        }), 500


@app.route('/api/booking/cancel-order/<int:order_id>', methods=['POST'])
@login_required
@permission_required('purchase')
def api_cancel_order(order_id):
    """Cancel order (only if pending or waiting_confirmation)"""
    try:
        db = get_db_connection()
        cursor = db.cursor()
        
        # Get customer_id
        cursor.execute("""
            SELECT CUSTOMER_ID FROM CUSTOMER WHERE USER_ID = ?
        """, (session['user_id'],))
        
        customer_row = cursor.fetchone()
        if not customer_row:
            db.close()
            return jsonify({
                'success': False,
                'message': 'Không tìm thấy thông tin khách hàng'
            }), 404
        
        customer_id = customer_row[0]
        
        # Check order
        cursor.execute("""
            SELECT STATUS FROM "ORDER" 
            WHERE ORDER_ID = ? AND CUSTOMER_ID = ?
        """, (order_id, customer_id))
        
        order_row = cursor.fetchone()
        
        if not order_row:
            db.close()
            return jsonify({
                'success': False,
                'message': 'Không tìm thấy đơn hàng'
            }), 404
        
        status = order_row[0]
        
        if status not in ['pending', 'waiting_confirmation']:
            db.close()
            return jsonify({
                'success': False,
                'message': f'Không thể hủy đơn hàng có trạng thái: {status}'
            }), 400
        
        # Cancel order
        cursor.execute("""
            UPDATE "ORDER"
            SET STATUS = 'cancelled',
                UPDATED_AT = CURRENT_TIMESTAMP
            WHERE ORDER_ID = ?
        """, (order_id,))
        
        db.commit()
        db.close()
        
        logger.info(f"Order {order_id} cancelled by customer {customer_id}")
        
        return jsonify({
            'success': True,
            'message': 'Hủy đơn hàng thành công'
        })
        
    except Exception as e:
        logger.error(f"Cancel order error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Lỗi: {str(e)}'
        }), 500


# ==================== ADMIN ORDER MANAGEMENT APIs ====================

# (Continue in next message due to length...)

"""
API Routes for Authentication and User Management
Add these routes to your app.py

Usage:
1. Import the auth module and email_service at the top of app.py
2. Add these routes to your Flask app
3. Update SECRET_KEY for session management
"""

from flask import Flask, request, jsonify, session
from auth import AuthManager, login_required, permission_required, role_required
from email_service import EmailService
import sqlite3
from datetime import datetime

# ============================================================================
# AUTHENTICATION ROUTES
# ============================================================================

@app.route('/api/auth/login', methods=['POST'])
def api_login():
    """Login endpoint - handles both internal and customer users"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    user_type = data.get('user_type', 'internal')  # 'internal' or 'customer'
    
    if not username or not password:
        return jsonify({
            'success': False,
            'message': 'Vui lòng nhập tên đăng nhập và mật khẩu'
        }), 400
    
    try:
        db = get_db_connection()
        session_data, error = AuthManager.login_user(db, username, password, user_type)
        db.close()
        
        if error:
            return jsonify({
                'success': False,
                'message': error
            }), 401
        
        # Set session
        for key, value in session_data.items():
            session[key] = value
        
        return jsonify({
            'success': True,
            'message': 'Đăng nhập thành công',
            'data': {
                'username': session_data['username'],
                'fullname': session_data['fullname'],
                'role': session_data['role'],
                'permissions': session_data['permissions']
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Lỗi hệ thống: {str(e)}'
        }), 500


@app.route('/api/auth/logout', methods=['POST'])
@login_required
def api_logout():
    """Logout endpoint"""
    session.clear()
    return jsonify({
        'success': True,
        'message': 'Đăng xuất thành công'
    })


@app.route('/api/auth/session', methods=['GET'])
def api_check_session():
    """Check if user is logged in and return session data"""
    if 'user_id' in session:
        return jsonify({
            'success': True,
            'logged_in': True,
            'data': {
                'user_id': session.get('user_id'),
                'username': session.get('username'),
                'fullname': session.get('fullname'),
                'role': session.get('role'),
                'user_type': session.get('user_type'),
                'permissions': session.get('permissions', [])
            }
        })
    else:
        return jsonify({
            'success': True,
            'logged_in': False
        })


@app.route('/api/auth/register', methods=['POST'])
def api_register_customer():
    """Customer registration endpoint"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    fullname = data.get('fullname')
    phone = data.get('phone')
    email = data.get('email', '')
    
    try:
        db = get_db_connection()
        user_id, error = AuthManager.register_customer(
            db, username, password, fullname, phone, email
        )
        db.close()
        
        if error:
            return jsonify({
                'success': False,
                'message': error
            }), 400
        
        # Send confirmation email if email provided
        if email:
            EmailService.send_registration_confirmation(email, username, fullname)
        
        return jsonify({
            'success': True,
            'message': 'Đăng ký thành công! Vui lòng đăng nhập.',
            'data': {'user_id': user_id}
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Lỗi hệ thống: {str(e)}'
        }), 500


@app.route('/api/auth/forgot-password', methods=['POST'])
def api_forgot_password():
    """Request password reset"""
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({
            'success': False,
            'message': 'Vui lòng nhập email'
        }), 400
    
    try:
        db = get_db_connection()
        
        # Get username for email content
        cursor = db.cursor()
        cursor.execute("SELECT USERNAME FROM USER WHERE EMAIL = ?", (email,))
        user = cursor.fetchone()
        
        if not user:
            # Don't reveal if email exists or not for security
            return jsonify({
                'success': True,
                'message': 'Nếu email tồn tại, link đặt lại mật khẩu đã được gửi.'
            })
        
        username = user[0]
        
        # Create reset token
        token, error = AuthManager.create_password_reset_token(db, email)
        db.close()
        
        if error:
            return jsonify({
                'success': False,
                'message': error
            }), 500
        
        # Send email
        success, error = EmailService.send_password_reset_email(email, username, token)
        
        if not success:
            return jsonify({
                'success': False,
                'message': 'Không thể gửi email. Vui lòng thử lại sau.'
            }), 500
        
        return jsonify({
            'success': True,
            'message': 'Link đặt lại mật khẩu đã được gửi đến email của bạn.'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Lỗi hệ thống: {str(e)}'
        }), 500


@app.route('/api/auth/reset-password', methods=['POST'])
def api_reset_password():
    """Reset password with token"""
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('new_password')
    
    if not token or not new_password:
        return jsonify({
            'success': False,
            'message': 'Thiếu thông tin'
        }), 400
    
    try:
        db = get_db_connection()
        success, error = AuthManager.reset_password_with_token(db, token, new_password)
        db.close()
        
        if not success:
            return jsonify({
                'success': False,
                'message': error
            }), 400
        
        return jsonify({
            'success': True,
            'message': 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập.'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Lỗi hệ thống: {str(e)}'
        }), 500


@app.route('/api/auth/change-password', methods=['POST'])
@login_required
def api_change_password():
    """Change own password"""
    data = request.get_json()
    old_password = data.get('old_password')
    new_password = data.get('new_password')
    
    if not old_password or not new_password:
        return jsonify({
            'success': False,
            'message': 'Vui lòng nhập đầy đủ thông tin'
        }), 400
    
    try:
        db = get_db_connection()
        user_id = session['user_id']
        success, error = AuthManager.change_password(db, user_id, old_password, new_password)
        db.close()
        
        if not success:
            return jsonify({
                'success': False,
                'message': error
            }), 400
        
        return jsonify({
            'success': True,
            'message': 'Đổi mật khẩu thành công!'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Lỗi hệ thống: {str(e)}'
        }), 500


# ============================================================================
# USER MANAGEMENT ROUTES (Admin only)
# ============================================================================

@app.route('/api/admin/users', methods=['GET'])
@permission_required('all')
def api_get_all_users():
    """Get all users (internal or customers)"""
    user_type = request.args.get('type', 'internal')  # 'internal' or 'customer'
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    search = request.args.get('search', '')
    
    try:
        db = get_db_connection()
        cursor = db.cursor()
        
        # Build query
        query = """
            SELECT 
                u.USER_ID, u.USERNAME, u.FULLNAME, u.EMAIL, u.PHONE,
                u.IS_ACTIVE, u.LAST_LOGIN, u.CREATED_AT,
                r.ROLE_NAME, r.ROLE_ID
            FROM USER u
            LEFT JOIN USER_ROLE ur ON u.USER_ID = ur.USER_ID
            LEFT JOIN ROLE r ON ur.ROLE_ID = r.ROLE_ID
            WHERE u.USER_TYPE = ?
        """
        params = [user_type]
        
        if search:
            query += " AND (u.USERNAME LIKE ? OR u.FULLNAME LIKE ? OR u.EMAIL LIKE ?)"
            search_term = f'%{search}%'
            params.extend([search_term, search_term, search_term])
        
        # Count total
        count_query = f"SELECT COUNT(*) FROM ({query}) AS subquery"
        cursor.execute(count_query, params)
        total = cursor.fetchone()[0]
        
        # Add pagination
        query += " ORDER BY u.CREATED_AT DESC LIMIT ? OFFSET ?"
        params.extend([per_page, (page - 1) * per_page])
        
        cursor.execute(query, params)
        users = []
        for row in cursor.fetchall():
            users.append({
                'user_id': row[0],
                'username': row[1],
                'fullname': row[2],
                'email': row[3],
                'phone': row[4],
                'is_active': bool(row[5]),
                'last_login': row[6],
                'created_at': row[7],
                'role_name': row[8],
                'role_id': row[9]
            })
        
        db.close()
        
        return jsonify({
            'success': True,
            'data': users,
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


@app.route('/api/admin/users/<int:user_id>', methods=['GET'])
@permission_required('all')
def api_get_user(user_id):
    """Get user details"""
    try:
        db = get_db_connection()
        cursor = db.cursor()
        
        cursor.execute("""
            SELECT 
                u.USER_ID, u.USERNAME, u.FULLNAME, u.EMAIL, u.PHONE,
                u.IS_ACTIVE, u.USER_TYPE, u.LAST_LOGIN, u.CREATED_AT,
                r.ROLE_NAME, r.ROLE_ID
            FROM USER u
            LEFT JOIN USER_ROLE ur ON u.USER_ID = ur.USER_ID
            LEFT JOIN ROLE r ON ur.ROLE_ID = r.ROLE_ID
            WHERE u.USER_ID = ?
        """, (user_id,))
        
        row = cursor.fetchone()
        db.close()
        
        if not row:
            return jsonify({
                'success': False,
                'message': 'Không tìm thấy người dùng'
            }), 404
        
        user = {
            'user_id': row[0],
            'username': row[1],
            'fullname': row[2],
            'email': row[3],
            'phone': row[4],
            'is_active': bool(row[5]),
            'user_type': row[6],
            'last_login': row[7],
            'created_at': row[8],
            'role_name': row[9],
            'role_id': row[10]
        }
        
        return jsonify({
            'success': True,
            'data': user
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Lỗi: {str(e)}'
        }), 500


@app.route('/api/admin/users/<int:user_id>', methods=['PUT'])
@permission_required('all')
def api_update_user(user_id):
    """Update user information"""
    data = request.get_json()
    
    try:
        db = get_db_connection()
        cursor = db.cursor()
        
        # Build update query
        updates = []
        params = []
        
        if 'fullname' in data:
            updates.append('FULLNAME = ?')
            params.append(data['fullname'])
        
        if 'email' in data:
            updates.append('EMAIL = ?')
            params.append(data['email'])
        
        if 'phone' in data:
            updates.append('PHONE = ?')
            params.append(data['phone'])
        
        if 'is_active' in data:
            updates.append('IS_ACTIVE = ?')
            params.append(1 if data['is_active'] else 0)
        
        if updates:
            updates.append('UPDATED_AT = ?')
            params.append(datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
            
            updates.append('UPDATED_BY = ?')
            params.append(session['user_id'])
            
            params.append(user_id)
            
            query = f"UPDATE USER SET {', '.join(updates)} WHERE USER_ID = ?"
            cursor.execute(query, params)
            db.commit()
        
        db.close()
        
        return jsonify({
            'success': True,
            'message': 'Cập nhật thành công'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Lỗi: {str(e)}'
        }), 500


@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@permission_required('all')
def api_delete_user(user_id):
    """Delete user (soft delete by setting IS_ACTIVE = 0)"""
    # Prevent deleting self
    if user_id == session['user_id']:
        return jsonify({
            'success': False,
            'message': 'Không thể xóa tài khoản của chính mình'
        }), 400
    
    try:
        db = get_db_connection()
        cursor = db.cursor()
        
        cursor.execute("""
            UPDATE USER 
            SET IS_ACTIVE = 0, UPDATED_AT = ?, UPDATED_BY = ?
            WHERE USER_ID = ?
        """, (
            datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            session['user_id'],
            user_id
        ))
        
        db.commit()
        db.close()
        
        return jsonify({
            'success': True,
            'message': 'Xóa người dùng thành công'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Lỗi: {str(e)}'
        }), 500


@app.route('/api/admin/users/<int:user_id>/change-password', methods=['POST'])
@permission_required('all')
def api_admin_change_user_password(user_id):
    """Admin change user password"""
    data = request.get_json()
    new_password = data.get('new_password')
    
    if not new_password:
        return jsonify({
            'success': False,
            'message': 'Vui lòng nhập mật khẩu mới'
        }), 400
    
    # Validate password
    is_valid, message = AuthManager.validate_password(new_password)
    if not is_valid:
        return jsonify({
            'success': False,
            'message': message
        }), 400
    
    try:
        db = get_db_connection()
        cursor = db.cursor()
        
        hashed_pwd = AuthManager.hash_password(new_password)
        cursor.execute("""
            UPDATE USER 
            SET PASSWORD = ?, UPDATED_AT = ?, UPDATED_BY = ?
            WHERE USER_ID = ?
        """, (
            hashed_pwd,
            datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            session['user_id'],
            user_id
        ))
        
        db.commit()
        db.close()
        
        return jsonify({
            'success': True,
            'message': 'Đổi mật khẩu thành công'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Lỗi: {str(e)}'
        }), 500


@app.route('/api/admin/users/<int:user_id>/change-role', methods=['POST'])
@permission_required('all')
def api_admin_change_user_role(user_id):
    """Admin change user role"""
    data = request.get_json()
    new_role_id = data.get('role_id')
    
    if not new_role_id:
        return jsonify({
            'success': False,
            'message': 'Vui lòng chọn vai trò'
        }), 400
    
    try:
        db = get_db_connection()
        cursor = db.cursor()
        
        # Delete old role
        cursor.execute("DELETE FROM USER_ROLE WHERE USER_ID = ?", (user_id,))
        
        # Assign new role
        cursor.execute("""
            INSERT INTO USER_ROLE (USER_ID, ROLE_ID, ASSIGNED_AT)
            VALUES (?, ?, ?)
        """, (
            user_id, new_role_id,
            datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        ))
        
        db.commit()
        db.close()
        
        return jsonify({
            'success': True,
            'message': 'Thay đổi vai trò thành công'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Lỗi: {str(e)}'
        }), 500


@app.route('/api/roles', methods=['GET'])
@login_required
def api_get_roles():
    """Get all roles (for dropdown)"""
    user_type = request.args.get('type', 'internal')
    
    try:
        db = get_db_connection()
        cursor = db.cursor()
        
        if user_type == 'internal':
            # Exclude Customer role
            cursor.execute("""
                SELECT ROLE_ID, ROLE_NAME, DESCRIPTION 
                FROM ROLE 
                WHERE ROLE_ID != 6
                ORDER BY ROLE_ID
            """)
        else:
            # Only Customer role
            cursor.execute("""
                SELECT ROLE_ID, ROLE_NAME, DESCRIPTION 
                FROM ROLE 
                WHERE ROLE_ID = 6
            """)
        
        roles = []
        for row in cursor.fetchall():
            roles.append({
                'role_id': row[0],
                'role_name': row[1],
                'description': row[2]
            })
        
        db.close()
        
        return jsonify({
            'success': True,
            'data': roles
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Lỗi: {str(e)}'
        }), 500


# ============================================================================
# HELPER FUNCTION
# ============================================================================

def get_db_connection():
    """Get database connection"""
    db = sqlite3.connect('path/to/your/museum.db')  # Update this path
    return db

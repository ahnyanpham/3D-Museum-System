#!/usr/bin/env python3
"""
Reset passwords for all users in museum system
- Internal staff (USER_TYPE='internal'): p@ssw0rd
- Customers (USER_TYPE='customer'): p@ssw0rd
"""

from werkzeug.security import generate_password_hash
import sqlite3

DB_PATH = '/home/www/museum-system/data/museum_bennharong.db'

# Password for all users
INTERNAL_PASSWORD = 'p@ssw0rd'
CUSTOMER_PASSWORD = 'p@ssw0rd'

def reset_passwords():
    db = sqlite3.connect(DB_PATH)
    cursor = db.cursor()
    
    # Get all users with their type
    cursor.execute("""
        SELECT USER_ID, USERNAME, USER_TYPE, FULLNAME 
        FROM USER 
        ORDER BY USER_TYPE, USER_ID
    """)
    users = cursor.fetchall()
    
    print("=" * 70)
    print("RESETTING PASSWORDS FOR MUSEUM SYSTEM")
    print("=" * 70)
    print()
    
    internal_count = 0
    customer_count = 0
    
    for user_id, username, user_type, fullname in users:
        if user_type == 'internal':
            new_password = generate_password_hash(INTERNAL_PASSWORD)
            password_display = INTERNAL_PASSWORD
            internal_count += 1
        else:  # customer
            new_password = generate_password_hash(CUSTOMER_PASSWORD)
            password_display = CUSTOMER_PASSWORD
            customer_count += 1
        
        cursor.execute("""
            UPDATE USER 
            SET PASSWORD = ? 
            WHERE USER_ID = ?
        """, (new_password, user_id))
        
        user_display = f"{username} ({fullname or 'N/A'})"
        print(f"✓ [{user_type:8}] {user_display:40} → {password_display}")
    
    db.commit()
    db.close()
    
    print()
    print("=" * 70)
    print(f"✅ HOÀN TẤT!")
    print(f"   - Nhân viên nội bộ: {internal_count} users → password: {INTERNAL_PASSWORD}")
    print(f"   - Khách hàng:       {customer_count} users → password: {CUSTOMER_PASSWORD}")
    print("=" * 70)
    print()
    print("⚠️  LƯU Ý:")
    print("   1. Tất cả users nên đổi password ngay sau khi đăng nhập lần đầu")
    print("   2. Test login với admin:")
    print("      Username: admin")
    print("      Password: p@ssw0rd")
    print()

if __name__ == '__main__':
    try:
        reset_passwords()
    except Exception as e:
        print(f"❌ LỖI: {e}")
        import traceback
        traceback.print_exc()

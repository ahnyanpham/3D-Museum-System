#!/usr/bin/env python3
"""
Migration Script for museum_bennharong.db
Applies user management schema updates to existing database
"""

import sqlite3
import sys
from datetime import datetime
from pathlib import Path

# Database path
DB_PATH = Path(__file__).parent.parent / 'data' / 'museum_bennharong.db'

def check_database_exists():
    """Check if database file exists"""
    if not DB_PATH.exists():
        print(f"❌ Database not found: {DB_PATH}")
        return False
    print(f"✅ Database found: {DB_PATH}")
    return True

def backup_database():
    """Create backup of database"""
    import shutil
    backup_path = DB_PATH.parent / f"museum_bennharong_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
    try:
        shutil.copy(DB_PATH, backup_path)
        print(f"✅ Backup created: {backup_path}")
        return True, backup_path
    except Exception as e:
        print(f"❌ Backup failed: {e}")
        return False, None

def check_column_exists(cursor, table, column):
    """Check if column exists in table"""
    cursor.execute(f"PRAGMA table_info({table})")
    columns = [row[1] for row in cursor.fetchall()]
    return column in columns

def check_table_exists(cursor, table):
    """Check if table exists"""
    cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name=?
    """, (table,))
    return cursor.fetchone() is not None

def apply_migration(conn):
    """Apply migration to database"""
    cursor = conn.cursor()
    
    print("\n" + "="*60)
    print("APPLYING MIGRATION")
    print("="*60)
    
    try:
        # ================================================================
        # 1. Add USER_TYPE column if not exists
        # ================================================================
        print("\n1️⃣  Checking USER_TYPE column...")
        if not check_column_exists(cursor, 'USER', 'USER_TYPE'):
            print("   Adding USER_TYPE column...")
            cursor.execute("ALTER TABLE USER ADD COLUMN USER_TYPE TEXT DEFAULT 'internal'")
            cursor.execute("UPDATE USER SET USER_TYPE = 'internal'")
            print("   ✅ USER_TYPE column added")
        else:
            print("   ℹ️  USER_TYPE already exists")
        
        # ================================================================
        # 2. Add tracking columns to USER if not exists
        # ================================================================
        print("\n2️⃣  Checking USER tracking columns...")
        
        if not check_column_exists(cursor, 'USER', 'CREATED_BY'):
            cursor.execute("ALTER TABLE USER ADD COLUMN CREATED_BY INTEGER")
            print("   ✅ CREATED_BY added to USER")
        
        if not check_column_exists(cursor, 'USER', 'UPDATED_BY'):
            cursor.execute("ALTER TABLE USER ADD COLUMN UPDATED_BY INTEGER")
            print("   ✅ UPDATED_BY added to USER")
        
        # ================================================================
        # 3. Update ROLE permissions
        # ================================================================
        print("\n3️⃣  Updating ROLE permissions...")
        
        # Check current roles
        cursor.execute("SELECT ROLE_ID, ROLE_NAME FROM ROLE ORDER BY ROLE_ID")
        existing_roles = cursor.fetchall()
        print(f"   Current roles: {len(existing_roles)}")
        
        # Update permissions for existing roles
        role_permissions = {
            1: 'all',  # Admin
            2: 'dashboard,map,diagram,tour,customers,tickets,checkin,checkout,rating,export',  # Manager
            3: 'customers,tickets',  # Staff
            4: 'checkin,checkout,rating',  # Tour Guide
            5: 'checkin,checkout,rating'   # Security
        }
        
        for role_id, permissions in role_permissions.items():
            cursor.execute("""
                UPDATE ROLE SET PERMISSIONS = ? WHERE ROLE_ID = ?
            """, (permissions, role_id))
        
        # Add Customer role if not exists
        cursor.execute("SELECT ROLE_ID FROM ROLE WHERE ROLE_ID = 6")
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO ROLE (ROLE_ID, ROLE_NAME, DESCRIPTION, PERMISSIONS)
                VALUES (6, 'Customer', 'Khách hàng', 'map,diagram,tour,my_tickets,purchase')
            """)
            print("   ✅ Customer role added")
        else:
            print("   ℹ️  Customer role already exists")
        
        print("   ✅ ROLE permissions updated")
        
        # ================================================================
        # 4. Create PASSWORD_RESET table
        # ================================================================
        print("\n4️⃣  Creating PASSWORD_RESET table...")
        
        if not check_table_exists(cursor, 'PASSWORD_RESET'):
            cursor.execute("""
                CREATE TABLE PASSWORD_RESET (
                    RESET_ID INTEGER PRIMARY KEY AUTOINCREMENT,
                    USER_ID INTEGER NOT NULL,
                    RESET_TOKEN TEXT UNIQUE NOT NULL,
                    EXPIRES_AT TEXT NOT NULL,
                    USED INTEGER DEFAULT 0,
                    CREATED_AT TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (USER_ID) REFERENCES USER(USER_ID) ON DELETE CASCADE
                )
            """)
            
            # Create indexes
            cursor.execute("""
                CREATE INDEX idx_password_reset_token 
                ON PASSWORD_RESET(RESET_TOKEN)
            """)
            cursor.execute("""
                CREATE INDEX idx_password_reset_user 
                ON PASSWORD_RESET(USER_ID)
            """)
            
            print("   ✅ PASSWORD_RESET table created")
        else:
            print("   ℹ️  PASSWORD_RESET table already exists")
        
        # ================================================================
        # 5. Add USER_ID to CUSTOMER table
        # ================================================================
        print("\n5️⃣  Linking CUSTOMER to USER...")
        
        if not check_column_exists(cursor, 'CUSTOMER', 'USER_ID'):
            cursor.execute("ALTER TABLE CUSTOMER ADD COLUMN USER_ID INTEGER")
            cursor.execute("CREATE INDEX idx_customer_user ON CUSTOMER(USER_ID)")
            print("   ✅ USER_ID added to CUSTOMER")
        else:
            print("   ℹ️  USER_ID already exists in CUSTOMER")
        
        # Add tracking columns
        if not check_column_exists(cursor, 'CUSTOMER', 'CREATED_BY'):
            cursor.execute("ALTER TABLE CUSTOMER ADD COLUMN CREATED_BY INTEGER")
            print("   ✅ CREATED_BY added to CUSTOMER")
        
        if not check_column_exists(cursor, 'CUSTOMER', 'UPDATED_BY'):
            cursor.execute("ALTER TABLE CUSTOMER ADD COLUMN UPDATED_BY INTEGER")
            print("   ✅ UPDATED_BY added to CUSTOMER")
        
        # ================================================================
        # 6. Update TICKET statuses
        # ================================================================
        print("\n6️⃣  Updating TICKET statuses...")
        
        # Update old 'used' status to appropriate status
        cursor.execute("""
            UPDATE TICKET 
            SET STATUS = CASE
                WHEN EXISTS (
                    SELECT 1 FROM VISIT_HISTORY 
                    WHERE VISIT_HISTORY.TICKET_ID = TICKET.TICKET_ID 
                    AND CHECK_OUT_TIME IS NOT NULL
                    AND RATING IS NOT NULL
                ) THEN 'completed'
                WHEN EXISTS (
                    SELECT 1 FROM VISIT_HISTORY 
                    WHERE VISIT_HISTORY.TICKET_ID = TICKET.TICKET_ID 
                    AND CHECK_OUT_TIME IS NOT NULL
                ) THEN 'checked_out'
                WHEN EXISTS (
                    SELECT 1 FROM VISIT_HISTORY 
                    WHERE VISIT_HISTORY.TICKET_ID = TICKET.TICKET_ID 
                    AND CHECK_IN_TIME IS NOT NULL
                ) THEN 'checked_in'
                ELSE 'active'
            END
            WHERE STATUS = 'used' OR STATUS = 'valid'
        """)
        
        updated = cursor.rowcount
        print(f"   ✅ Updated {updated} ticket statuses")
        
        # ================================================================
        # 7. Create performance indexes
        # ================================================================
        print("\n7️⃣  Creating performance indexes...")
        
        indexes = [
            ("idx_user_username", "USER", "USERNAME"),
            ("idx_user_email", "USER", "EMAIL"),
            ("idx_user_type", "USER", "USER_TYPE"),
            ("idx_user_active", "USER", "IS_ACTIVE"),
            ("idx_customer_phone", "CUSTOMER", "PHONE"),
            ("idx_customer_email", "CUSTOMER", "EMAIL"),
            ("idx_customer_fullname", "CUSTOMER", "FULLNAME"),
            ("idx_ticket_customer", "TICKET", "CUSTOMER_ID"),
            ("idx_ticket_status", "TICKET", "STATUS"),
            ("idx_ticket_code", "TICKET", "TICKET_CODE"),
        ]
        
        created_count = 0
        for idx_name, table, column in indexes:
            try:
                cursor.execute(f"CREATE INDEX IF NOT EXISTS {idx_name} ON {table}({column})")
                created_count += 1
            except:
                pass
        
        print(f"   ✅ Created/verified {created_count} indexes")
        
        # ================================================================
        # 8. Create sample customer user (for testing)
        # ================================================================
        print("\n8️⃣  Creating sample customer account...")
        
        cursor.execute("SELECT USER_ID FROM USER WHERE USERNAME = 'customer_test'")
        if not cursor.fetchone():
            # Password: customer123 (MD5 hash)
            cursor.execute("""
                INSERT INTO USER (
                    USERNAME, PASSWORD, EMAIL, FULLNAME, PHONE, 
                    USER_TYPE, IS_ACTIVE, CREATED_AT, UPDATED_AT
                )
                VALUES (?, ?, ?, ?, ?, 'customer', 1, ?, ?)
            """, (
                'customer_test',
                '0192023a7bbd73250516f069df18b500',
                'customer@test.com',
                'Khách Hàng Test',
                '0900000001',
                datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            ))
            
            user_id = cursor.lastrowid
            
            # Assign Customer role
            cursor.execute("""
                INSERT INTO USER_ROLE (USER_ID, ROLE_ID, ASSIGNED_AT)
                VALUES (?, 6, ?)
            """, (user_id, datetime.now().strftime('%Y-%m-%d %H:%M:%S')))
            
            print("   ✅ Sample customer account created")
            print(f"      Username: customer_test")
            print(f"      Password: customer123")
        else:
            print("   ℹ️  Sample customer already exists")
        
        # Commit all changes
        conn.commit()
        
        print("\n" + "="*60)
        print("✅ MIGRATION COMPLETED SUCCESSFULLY")
        print("="*60)
        
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def verify_migration(conn):
    """Verify migration was successful"""
    cursor = conn.cursor()
    
    print("\n" + "="*60)
    print("VERIFICATION")
    print("="*60)
    
    checks = []
    
    # Check USER_TYPE column
    cursor.execute("PRAGMA table_info(USER)")
    columns = [row[1] for row in cursor.fetchall()]
    checks.append(('USER_TYPE column', 'USER_TYPE' in columns))
    
    # Check PASSWORD_RESET table
    cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='PASSWORD_RESET'
    """)
    checks.append(('PASSWORD_RESET table', cursor.fetchone() is not None))
    
    # Check Customer role
    cursor.execute("SELECT ROLE_ID FROM ROLE WHERE ROLE_ID = 6")
    checks.append(('Customer role', cursor.fetchone() is not None))
    
    # Check CUSTOMER.USER_ID column
    cursor.execute("PRAGMA table_info(CUSTOMER)")
    columns = [row[1] for row in cursor.fetchall()]
    checks.append(('CUSTOMER.USER_ID column', 'USER_ID' in columns))
    
    # Check roles count
    cursor.execute("SELECT COUNT(*) FROM ROLE")
    role_count = cursor.fetchone()[0]
    checks.append(('Total roles (should be 6)', role_count == 6))
    
    # Check ticket status updates
    cursor.execute("SELECT COUNT(*) FROM TICKET WHERE STATUS NOT IN ('used', 'valid')")
    updated_count = cursor.fetchone()[0]
    checks.append(('Ticket statuses updated', updated_count > 0))
    
    # Print results
    print()
    all_passed = True
    for check_name, passed in checks:
        status = "✅" if passed else "❌"
        print(f"{status} {check_name}")
        if not passed:
            all_passed = False
    
    print()
    if all_passed:
        print("✅ All verification checks passed!")
    else:
        print("⚠️  Some checks failed")
    
    return all_passed

def show_summary(conn):
    """Show database summary after migration"""
    cursor = conn.cursor()
    
    print("\n" + "="*60)
    print("DATABASE SUMMARY")
    print("="*60)
    
    # Users by type
    cursor.execute("""
        SELECT USER_TYPE, COUNT(*) 
        FROM USER 
        GROUP BY USER_TYPE
    """)
    print("\n👥 Users by type:")
    for user_type, count in cursor.fetchall():
        print(f"   {user_type}: {count}")
    
    # Roles
    cursor.execute("SELECT ROLE_NAME, COUNT(*) FROM ROLE GROUP BY ROLE_NAME")
    print("\n🔐 Roles:")
    for role_name, count in cursor.fetchall():
        print(f"   {role_name}")
    
    # Tickets by status
    cursor.execute("""
        SELECT STATUS, COUNT(*) 
        FROM TICKET 
        GROUP BY STATUS
    """)
    print("\n🎫 Tickets by status:")
    for status, count in cursor.fetchall():
        print(f"   {status}: {count}")
    
    # Total customers
    cursor.execute("SELECT COUNT(*) FROM CUSTOMER")
    print(f"\n👨‍👩‍👧‍👦 Total customers: {cursor.fetchone()[0]}")
    
    # Total constructions
    cursor.execute("SELECT COUNT(*) FROM CONSTRUCTION")
    print(f"🏛️  Total constructions: {cursor.fetchone()[0]}")
    
    print("\n" + "="*60)

def main():
    """Main migration script"""
    print("="*60)
    print("Museum Database Migration Script")
    print("="*60)
    print()
    
    # Check database exists
    if not check_database_exists():
        sys.exit(1)
    
    # Create backup
    print("\n📦 Creating backup...")
    success, backup_path = backup_database()
    if not success:
        print("\n⚠️  Warning: Could not create backup!")
        response = input("Continue anyway? (yes/no): ")
        if response.lower() != 'yes':
            print("Migration cancelled")
            sys.exit(1)
    
    # Connect to database
    print("\n🔌 Connecting to database...")
    try:
        conn = sqlite3.connect(str(DB_PATH))
        print("✅ Connected")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        sys.exit(1)
    
    # Apply migration
    success = apply_migration(conn)
    
    if success:
        # Verify migration
        verify_migration(conn)
        
        # Show summary
        show_summary(conn)
        
        print("\n✅ Migration completed successfully!")
        print(f"📁 Database: {DB_PATH}")
        if backup_path:
            print(f"💾 Backup: {backup_path}")
    else:
        print("\n❌ Migration failed!")
        if backup_path:
            print(f"\n💾 Restore from backup: {backup_path}")
    
    conn.close()
    print("\n" + "="*60)

if __name__ == '__main__':
    main()

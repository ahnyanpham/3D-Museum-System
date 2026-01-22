import sqlite3
from pathlib import Path
from datetime import datetime

# Database path - using museum_bennharong.db
DB_PATH = Path(__file__).parent.parent / 'data' / 'museum_bennharong.db'

def get_connection():
    """Get database connection with row factory"""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def get_db_connection():
    """Alias for get_connection - for compatibility with API routes"""
    return get_connection()

def dict_factory(cursor, row):
    """Convert row to dictionary"""
    return {col[0]: row[idx] for idx, col in enumerate(cursor.description)}

def fetch_all(query, params=()):
    """Fetch all rows as dictionaries"""
    conn = get_connection()
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    cursor.execute(query, params)
    results = cursor.fetchall()
    conn.close()
    return results

def fetch_one(query, params=()):
    """Fetch one row as dictionary"""
    conn = get_connection()
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    cursor.execute(query, params)
    result = cursor.fetchone()
    conn.close()
    return result

def execute_query(query, params=()):
    """Execute INSERT/UPDATE/DELETE query and return last insert id"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    conn.commit()
    last_id = cursor.lastrowid
    conn.close()
    return last_id

def execute_many(query, params_list):
    """Execute multiple INSERT/UPDATE/DELETE queries"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.executemany(query, params_list)
    conn.commit()
    conn.close()
    return True

def execute_script(script):
    """Execute SQL script"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.executescript(script)
    conn.commit()
    conn.close()
    return True

# ============================================================================
# DATABASE SCHEMA VERIFICATION
# ============================================================================

def verify_schema():
    """Verify that all required tables exist"""
    required_tables = [
        'CONSTRUCTION',
        'COORDINATES',
        'TRIP',
        'ORGANIZATION',
        'USER',
        'ROLE',
        'USER_ROLE',
        'TICKET_TYPE',
        'CUSTOMER',
        'TICKET',
        'VISIT_HISTORY',
        'USER_ACTIVITY_LOG',
        'INVOICE',
        'INVOICE_DETAIL',
        'PASSWORD_RESET'  # From migration
    ]
    
    conn = get_connection()
    cursor = conn.cursor()
    
    missing_tables = []
    for table in required_tables:
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name=?
        """, (table,))
        if not cursor.fetchone():
            missing_tables.append(table)
    
    conn.close()
    
    return len(missing_tables) == 0, missing_tables

# ============================================================================
# HELPER FUNCTIONS FOR COMMON QUERIES
# ============================================================================

def get_user_by_username(username):
    """Get user by username"""
    return fetch_one("""
        SELECT * FROM USER WHERE USERNAME = ?
    """, (username,))

def get_user_by_id(user_id):
    """Get user by ID"""
    return fetch_one("""
        SELECT * FROM USER WHERE USER_ID = ?
    """, (user_id,))

def get_user_role(user_id):
    """Get user's role"""
    return fetch_one("""
        SELECT r.ROLE_ID, r.ROLE_NAME, r.PERMISSIONS
        FROM USER_ROLE ur
        JOIN ROLE r ON ur.ROLE_ID = r.ROLE_ID
        WHERE ur.USER_ID = ?
    """, (user_id,))

def get_customer_by_phone(phone):
    """Get customer by phone number"""
    return fetch_one("""
        SELECT * FROM CUSTOMER WHERE PHONE = ?
    """, (phone,))

def get_customer_by_user_id(user_id):
    """Get customer by user_id"""
    return fetch_one("""
        SELECT * FROM CUSTOMER WHERE USER_ID = ?
    """, (user_id,))

def get_active_tickets(customer_id):
    """Get active tickets for customer"""
    return fetch_all("""
        SELECT 
            t.TICKET_ID, t.TICKET_CODE, t.STATUS,
            tt.TYPE_NAME, t.TOTAL_PRICE, t.PURCHASE_DATE
        FROM TICKET t
        JOIN TICKET_TYPE tt ON t.TICKET_TYPE_ID = tt.TICKET_TYPE_ID
        WHERE t.CUSTOMER_ID = ? AND t.STATUS = 'active'
        ORDER BY t.PURCHASE_DATE DESC
    """, (customer_id,))

def get_ticket_by_code(ticket_code):
    """Get ticket by code"""
    return fetch_one("""
        SELECT 
            t.*, tt.TYPE_NAME, c.FULLNAME, c.PHONE
        FROM TICKET t
        JOIN TICKET_TYPE tt ON t.TICKET_TYPE_ID = tt.TICKET_TYPE_ID
        JOIN CUSTOMER c ON t.CUSTOMER_ID = c.CUSTOMER_ID
        WHERE t.TICKET_CODE = ?
    """, (ticket_code,))

def get_ticket_types():
    """Get all active ticket types"""
    return fetch_all("""
        SELECT * FROM TICKET_TYPE 
        WHERE IS_ACTIVE = 1
        ORDER BY PRICE DESC
    """)

def get_constructions():
    """Get all active constructions"""
    return fetch_all("""
        SELECT * FROM CONSTRUCTION 
        WHERE IS_ACTIVE = 1
        ORDER BY SORT_ORDER
    """)

def get_construction_coordinates(construction_id):
    """Get coordinates for a construction"""
    return fetch_all("""
        SELECT * FROM COORDINATES 
        WHERE CONSTRUCTION_ID = ?
        ORDER BY SORT_ORDER
    """, (construction_id,))

# ============================================================================
# STATISTICS FUNCTIONS
# ============================================================================

def get_dashboard_stats():
    """Get dashboard statistics"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Total tickets sold
    cursor.execute("SELECT COUNT(*) FROM TICKET")
    total_tickets = cursor.fetchone()[0]
    
    # Total revenue
    cursor.execute("SELECT COALESCE(SUM(TOTAL_PRICE), 0) FROM TICKET")
    total_revenue = cursor.fetchone()[0]
    
    # Total customers
    cursor.execute("SELECT COUNT(*) FROM CUSTOMER")
    total_customers = cursor.fetchone()[0]
    
    # Total visits (checked in)
    cursor.execute("""
        SELECT COUNT(*) FROM VISIT_HISTORY 
        WHERE CHECK_IN_TIME IS NOT NULL
    """)
    total_visits = cursor.fetchone()[0]
    
    # Active tickets (today)
    cursor.execute("""
        SELECT COUNT(*) FROM TICKET 
        WHERE STATUS = 'active' 
        AND DATE(PURCHASE_DATE) = DATE('now')
    """)
    active_today = cursor.fetchone()[0]
    
    conn.close()
    
    return {
        'total_tickets': total_tickets,
        'total_revenue': total_revenue,
        'total_customers': total_customers,
        'total_visits': total_visits,
        'active_today': active_today
    }

def get_revenue_by_date(start_date=None, end_date=None):
    """Get revenue by date range"""
    query = """
        SELECT 
            DATE(PURCHASE_DATE) as date,
            COUNT(*) as ticket_count,
            SUM(TOTAL_PRICE) as revenue
        FROM TICKET
        WHERE 1=1
    """
    params = []
    
    if start_date:
        query += " AND DATE(PURCHASE_DATE) >= ?"
        params.append(start_date)
    
    if end_date:
        query += " AND DATE(PURCHASE_DATE) <= ?"
        params.append(end_date)
    
    query += " GROUP BY DATE(PURCHASE_DATE) ORDER BY date DESC"
    
    return fetch_all(query, tuple(params))

def get_ticket_status_count():
    """Get count of tickets by status"""
    return fetch_all("""
        SELECT STATUS, COUNT(*) as count
        FROM TICKET
        GROUP BY STATUS
    """)

def get_top_customers(limit=10):
    """Get top customers by total spent"""
    return fetch_all("""
        SELECT 
            c.CUSTOMER_ID, c.FULLNAME, c.PHONE,
            COUNT(t.TICKET_ID) as ticket_count,
            SUM(t.TOTAL_PRICE) as total_spent
        FROM CUSTOMER c
        JOIN TICKET t ON c.CUSTOMER_ID = t.CUSTOMER_ID
        GROUP BY c.CUSTOMER_ID
        ORDER BY total_spent DESC
        LIMIT ?
    """, (limit,))

# ============================================================================
# DATA VALIDATION FUNCTIONS
# ============================================================================

def validate_user_credentials(username, password_hash):
    """Validate user credentials"""
    user = fetch_one("""
        SELECT * FROM USER 
        WHERE USERNAME = ? AND PASSWORD = ? AND IS_ACTIVE = 1
    """, (username, password_hash))
    return user is not None

def check_duplicate_username(username, exclude_user_id=None):
    """Check if username already exists"""
    if exclude_user_id:
        user = fetch_one("""
            SELECT USER_ID FROM USER 
            WHERE USERNAME = ? AND USER_ID != ?
        """, (username, exclude_user_id))
    else:
        user = fetch_one("""
            SELECT USER_ID FROM USER WHERE USERNAME = ?
        """, (username,))
    return user is not None

def check_duplicate_email(email, exclude_user_id=None):
    """Check if email already exists"""
    if not email:
        return False
    
    if exclude_user_id:
        user = fetch_one("""
            SELECT USER_ID FROM USER 
            WHERE EMAIL = ? AND USER_ID != ?
        """, (email, exclude_user_id))
    else:
        user = fetch_one("""
            SELECT USER_ID FROM USER WHERE EMAIL = ?
        """, (email,))
    return user is not None

def check_duplicate_phone(phone, exclude_customer_id=None):
    """Check if phone already exists"""
    if not phone:
        return False
    
    if exclude_customer_id:
        customer = fetch_one("""
            SELECT CUSTOMER_ID FROM CUSTOMER 
            WHERE PHONE = ? AND CUSTOMER_ID != ?
        """, (phone, exclude_customer_id))
    else:
        customer = fetch_one("""
            SELECT CUSTOMER_ID FROM CUSTOMER WHERE PHONE = ?
        """, (phone,))
    return customer is not None

# ============================================================================
# ACTIVITY LOGGING
# ============================================================================

def log_user_activity(user_id, action_type, target_type=None, target_id=None, 
                     description=None, ip_address=None):
    """Log user activity"""
    return execute_query("""
        INSERT INTO USER_ACTIVITY_LOG (
            USER_ID, ACTION_TYPE, TARGET_TYPE, TARGET_ID,
            DESCRIPTION, IP_ADDRESS, CREATED_AT
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id, action_type, target_type, target_id,
        description, ip_address, 
        datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    ))

# ============================================================================
# DATABASE INITIALIZATION
# ============================================================================

def init_db():
    """
    Initialize database - checks if tables exist
    If museum_bennharong.db exists with data, this won't overwrite it
    """
    is_valid, missing = verify_schema()
    
    if is_valid:
        print("✅ Database schema is valid")
        print(f"📍 Database location: {DB_PATH}")
        
        # Show table counts
        conn = get_connection()
        cursor = conn.cursor()
        
        tables_info = []
        for table in ['USER', 'ROLE', 'CUSTOMER', 'TICKET', 'CONSTRUCTION']:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            tables_info.append(f"{table}: {count} rows")
        
        conn.close()
        
        print("📊 Table counts:")
        for info in tables_info:
            print(f"   {info}")
        
        return True
    else:
        print("❌ Database schema is incomplete")
        print(f"Missing tables: {', '.join(missing)}")
        print("\n⚠️  Please run migration script:")
        print("   sqlite3 museum_bennharong.db < migration_user_management.sql")
        return False

# ============================================================================
# EXPORT DATABASE INFO
# ============================================================================

def get_database_info():
    """Get database information"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Get all tables
    cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        ORDER BY name
    """)
    tables = [row[0] for row in cursor.fetchall()]
    
    # Get table counts
    table_counts = {}
    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        table_counts[table] = cursor.fetchone()[0]
    
    # Get database size
    import os
    db_size = os.path.getsize(str(DB_PATH))
    
    conn.close()
    
    return {
        'path': str(DB_PATH),
        'size_bytes': db_size,
        'size_kb': round(db_size / 1024, 2),
        'tables': tables,
        'table_counts': table_counts,
        'total_tables': len(tables)
    }

# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    print("=" * 60)
    print("Museum Database Manager")
    print("=" * 60)
    print()
    
    # Initialize and verify
    init_db()
    
    print()
    print("=" * 60)
    print("Database Information")
    print("=" * 60)
    
    # Show database info
    info = get_database_info()
    print(f"\n Path: {info['path']}")
    print(f" Size: {info['size_kb']} KB ({info['size_bytes']} bytes)")
    print(f" Total Tables: {info['total_tables']}")
    print("\n Table Details:")
    for table, count in sorted(info['table_counts'].items()):
        print(f"   {table:<25} {count:>6} rows")
    
    print("\n" + "=" * 60)
    print("Database ready!")
    print("=" * 60)

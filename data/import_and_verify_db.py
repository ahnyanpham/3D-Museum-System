#!/usr/bin/env python3
"""
Museum Bến Nhà Rồng Database Import & Verification Script
Usage: python3 import_and_verify_db.py [data_directory]
"""

import sqlite3
import os
import sys
from datetime import datetime

class DatabaseVerifier:
    def __init__(self, db_file="museum_bennharong.db"):
        self.db_file = db_file
        self.conn = None
        self.cursor = None
        self.errors = []
        self.warnings = []
        
        # Expected data counts from PDF
        self.expected_counts = {
            'CONSTRUCTION': 18,
            'COORDINATES': 21,
            'TRIP': 17,
            'ORGANIZATION': 1,
            'USER': 11,
            'ROLE': 5,
            'USER_ROLE': 11,
            'TICKET_TYPE': 5,
            'CUSTOMER': 13,
            'TICKET': 58,
            'VISIT_HISTORY': 60,
            'USER_ACTIVITY_LOG': 27,
            'INVOICE': 47,
            'INVOICE_DETAIL': 60
        }
        
    def connect(self):
        """Connect to database"""
        try:
            self.conn = sqlite3.connect(self.db_file)
            self.cursor = self.conn.cursor()
            return True
        except Exception as e:
            print(f"❌ Failed to connect to database: {e}")
            return False
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
    
    def execute_script(self, script_path, part_name):
        """Execute SQL script from file"""
        print(f"⏳ Executing {part_name}...")
        try:
            with open(script_path, 'r', encoding='utf-8') as f:
                script = f.read()
                self.cursor.executescript(script)
            self.conn.commit()
            print(f"✅ {part_name} completed successfully")
            return True
        except Exception as e:
            print(f"❌ Error in {part_name}: {e}")
            self.errors.append(f"{part_name}: {e}")
            return False
    
    def verify_table_count(self):
        """Verify number of tables"""
        print("\n" + "=" * 70)
        print("📊 TABLE COUNT VERIFICATION")
        print("=" * 70)
        
        self.cursor.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table'")
        actual_count = self.cursor.fetchone()[0]
        expected_count = 14
        
        print(f"Expected tables: {expected_count}")
        print(f"Actual tables:   {actual_count}")
        
        if actual_count == expected_count:
            print("✅ Table count matches!")
            return True
        else:
            print(f"❌ Table count mismatch! Difference: {expected_count - actual_count} tables")
            self.errors.append(f"Table count: expected {expected_count}, got {actual_count}")
            return False
    
    def verify_table_names(self):
        """Verify all expected tables exist"""
        print("\n" + "=" * 70)
        print("📋 TABLE NAMES VERIFICATION")
        print("=" * 70)
        
        self.cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        actual_tables = set(row[0] for row in self.cursor.fetchall())
        expected_tables = set(self.expected_counts.keys())
        
        missing_tables = expected_tables - actual_tables
        extra_tables = actual_tables - expected_tables
        
        if not missing_tables and not extra_tables:
            print("✅ All expected tables exist!")
            for table in sorted(expected_tables):
                print(f"  ✓ {table}")
            return True
        else:
            if missing_tables:
                print(f"❌ Missing tables: {', '.join(missing_tables)}")
                self.errors.append(f"Missing tables: {missing_tables}")
            if extra_tables:
                print(f"⚠️  Extra tables: {', '.join(extra_tables)}")
                self.warnings.append(f"Extra tables: {extra_tables}")
            return len(missing_tables) == 0
    
    def verify_row_counts(self):
        """Verify row counts for all tables"""
        print("\n" + "=" * 70)
        print("📊 ROW COUNT VERIFICATION")
        print("=" * 70)
        print(f"{'Table Name':<30} {'Expected':<12} {'Actual':<12} {'Status'}")
        print("-" * 70)
        
        all_match = True
        total_expected = 0
        total_actual = 0
        
        for table_name, expected_count in self.expected_counts.items():
            try:
                self.cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                actual_count = self.cursor.fetchone()[0]
                total_expected += expected_count
                total_actual += actual_count
                
                status = "✅" if actual_count == expected_count else "❌"
                if actual_count != expected_count:
                    all_match = False
                    self.errors.append(f"{table_name}: expected {expected_count}, got {actual_count}")
                
                print(f"{table_name:<30} {expected_count:<12} {actual_count:<12} {status}")
            except Exception as e:
                print(f"{table_name:<30} {expected_count:<12} {'ERROR':<12} ❌")
                self.errors.append(f"{table_name}: {e}")
                all_match = False
        
        print("-" * 70)
        print(f"{'TOTAL':<30} {total_expected:<12} {total_actual:<12}")
        print()
        
        if all_match:
            print("✅ All row counts match perfectly!")
            return True
        else:
            print("❌ Some row counts don't match!")
            return False
    
    def verify_sample_data(self):
        """Verify sample data from key tables"""
        print("\n" + "=" * 70)
        print("🔍 SAMPLE DATA VERIFICATION")
        print("=" * 70)
        
        verifications = []
        
        # 1. CONSTRUCTION
        print("\n1️⃣  CONSTRUCTION - First entry:")
        self.cursor.execute("""
            SELECT CONSTRUCTION_ID, CODE, NAME, TYPE 
            FROM CONSTRUCTION 
            WHERE CONSTRUCTION_ID = 1
        """)
        row = self.cursor.fetchone()
        if row and row[1] == 'VIEW_DRAGON' and row[2] == 'Toàn cảnh Bến Nhà Rồng':
            print(f"   ✅ ID: {row[0]}, Code: {row[1]}, Name: {row[2]}")
            verifications.append(True)
        else:
            print("   ❌ Data mismatch!")
            self.errors.append("CONSTRUCTION data verification failed")
            verifications.append(False)
        
        # 2. USER
        print("\n2️⃣  USER - Admin account:")
        self.cursor.execute("""
            SELECT USER_ID, USERNAME, FULLNAME, EMAIL 
            FROM USER 
            WHERE USERNAME = 'admin'
        """)
        row = self.cursor.fetchone()
        if row and row[2] == 'Quản trị viên':
            print(f"   ✅ Username: {row[1]}, Name: {row[2]}")
            verifications.append(True)
        else:
            print("   ❌ Data mismatch!")
            self.errors.append("USER data verification failed")
            verifications.append(False)
        
        # 3. TICKET_TYPE
        print("\n3️⃣  TICKET_TYPE - Adult ticket:")
        self.cursor.execute("""
            SELECT TICKET_TYPE_ID, TYPE_NAME, PRICE 
            FROM TICKET_TYPE 
            WHERE TICKET_TYPE_ID = 1
        """)
        row = self.cursor.fetchone()
        if row and row[1] == 'Vé người lớn' and row[2] == 40000:
            print(f"   ✅ Name: {row[1]}, Price: {row[2]}")
            verifications.append(True)
        else:
            print("   ❌ Data mismatch!")
            self.errors.append("TICKET_TYPE data verification failed")
            verifications.append(False)
        
        # 4. TICKET
        print("\n4️⃣  TICKET - First ticket:")
        self.cursor.execute("""
            SELECT TICKET_ID, TICKET_CODE, STATUS 
            FROM TICKET 
            WHERE TICKET_ID = 1
        """)
        row = self.cursor.fetchone()
        if row and row[1] == 'MT2512164E71':
            print(f"   ✅ Code: {row[1]}, Status: {row[2]}")
            verifications.append(True)
        else:
            print("   ❌ Data mismatch!")
            self.errors.append("TICKET data verification failed")
            verifications.append(False)
        
        # 5. INVOICE
        print("\n5️⃣  INVOICE - First invoice:")
        self.cursor.execute("""
            SELECT INVOICE_ID, INVOICE_CODE, FINAL_AMOUNT 
            FROM INVOICE 
            WHERE INVOICE_ID = 1
        """)
        row = self.cursor.fetchone()
        if row and row[1] == 'INV2512160001' and row[2] == 50000:
            print(f"   ✅ Code: {row[1]}, Amount: {row[2]}")
            verifications.append(True)
        else:
            print("   ❌ Data mismatch!")
            self.errors.append("INVOICE data verification failed")
            verifications.append(False)
        
        # 6. CUSTOMER - missing IDs
        print("\n6️⃣  CUSTOMER - Check missing IDs (8, 13):")
        self.cursor.execute("SELECT CUSTOMER_ID FROM CUSTOMER ORDER BY CUSTOMER_ID")
        customer_ids = [row[0] for row in self.cursor.fetchall()]
        expected_ids = [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 14, 15]
        if customer_ids == expected_ids:
            print(f"   ✅ IDs correct (missing 8, 13 as expected)")
            verifications.append(True)
        else:
            print(f"   ❌ ID mismatch!")
            self.errors.append("CUSTOMER IDs pattern incorrect")
            verifications.append(False)
        
        print()
        return all(verifications)
    
    def print_summary(self):
        """Print final summary"""
        print("\n" + "=" * 70)
        print("📋 VERIFICATION SUMMARY")
        print("=" * 70)
        
        print(f"\n❌ Errors: {len(self.errors)}")
        print(f"⚠️  Warnings: {len(self.warnings)}")
        
        if self.errors:
            print("\n❌ ERRORS:")
            for i, error in enumerate(self.errors, 1):
                print(f"   {i}. {error}")
        
        if self.warnings:
            print("\n⚠️  WARNINGS:")
            for i, warning in enumerate(self.warnings, 1):
                print(f"   {i}. {warning}")
        
        print("\n" + "=" * 70)
        if not self.errors:
            print("🎉 ALL VERIFICATIONS PASSED!")
            print("✅ Database matches PDF specifications!")
        else:
            print("❌ VERIFICATION FAILED")
        print("=" * 70)

def main():
    print("=" * 70)
    print("🏛️  MUSEUM BẾN NHÀ RỒNG - DATABASE IMPORTER")
    print("=" * 70)
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Get data directory from argument or use default
    if len(sys.argv) > 1:
        data_dir = sys.argv[1]
    else:
        data_dir = "."
    
    print(f"📁 Data directory: {data_dir}")
    print()
    
    db_file = "museum_bennharong_imported.db"
    
    sql_files = [
        ("db_script_part1.sql", "Part 1 (Tables 1-9)"),
        ("db_script_part2.sql", "Part 2 (Tables 10-12)"),
        ("db_script_part3.sql", "Part 3 (Tables 13-14)")
    ]
    
    # Check files
    print("🔍 Checking SQL files...")
    all_exist = True
    for filename, _ in sql_files:
        filepath = os.path.join(data_dir, filename)
        if os.path.exists(filepath):
            size = os.path.getsize(filepath)
            print(f"   ✅ {filename} ({size:,} bytes)")
        else:
            print(f"   ❌ {filename} NOT FOUND!")
            all_exist = False
    
    if not all_exist:
        print("\n❌ Missing files! Cannot proceed.")
        sys.exit(1)
    
    print()
    
    # Remove old db
    if os.path.exists(db_file):
        print(f"⚠️  Removing: {db_file}")
        os.remove(db_file)
    
    # Create database
    verifier = DatabaseVerifier(db_file)
    print(f"📦 Creating: {db_file}\n")
    
    if not verifier.connect():
        sys.exit(1)
    
    # Import scripts
    print("=" * 70)
    print("📥 IMPORTING")
    print("=" * 70)
    print()
    
    for filename, part_name in sql_files:
        filepath = os.path.join(data_dir, filename)
        if not verifier.execute_script(filepath, part_name):
            verifier.close()
            sys.exit(1)
        print()
    
    # Verify
    print("=" * 70)
    print("🔍 VERIFYING")
    print("=" * 70)
    
    verifier.verify_table_count()
    verifier.verify_table_names()
    verifier.verify_row_counts()
    verifier.verify_sample_data()
    verifier.print_summary()
    
    # Info
    size = os.path.getsize(db_file)
    print(f"\n📊 File: {db_file}")
    print(f"📏 Size: {size:,} bytes ({size/1024:.1f} KB)")
    
    verifier.close()
    sys.exit(0 if not verifier.errors else 1)

if __name__ == "__main__":
    main()

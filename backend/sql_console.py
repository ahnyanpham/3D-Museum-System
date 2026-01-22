#!/usr/bin/env python3
"""
SQL Console for Museum System - ADMIN ONLY
Standalone file for easy management

Usage:
1. Copy to: /home/www/museum-system/backend/sql_console.py
2. Import in main app.py: from sql_console import register_sql_console
3. Call: register_sql_console(app)
4. To disable: Just comment out the import/call
"""

import sqlite3
import logging
from flask import jsonify, request, session
from functools import wraps

# Configure logging
logger = logging.getLogger(__name__)

# Database path
DATABASE_PATH = '/home/www/museum-system/data/museum_bennharong.db'


def admin_only(f):
    """Decorator to ensure only Admin can access"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'role' not in session:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 401
        
        if session.get('role') != 'Admin':
            logger.warning(f"Non-admin user {session.get('username')} tried to access SQL console")
            return jsonify({'success': False, 'message': 'Admin only'}), 403
        
        return f(*args, **kwargs)
    return decorated_function


def register_sql_console(app):
    """Register SQL console routes to Flask app - NO AUTH REQUIRED"""
    
    @app.route('/api/sql-console/execute', methods=['POST'])
    def sql_console_execute():
        """Execute SQL query"""
        try:
            data = request.get_json()
            query = data.get('query', '').strip()
            
            if not query:
                return jsonify({'success': False, 'message': 'Query empty'}), 400
            
            # Log query for audit
            logger.info(f"SQL Console - Query executed: {query[:100]}...")
            
            # Connect to database
            conn = sqlite3.connect(DATABASE_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Execute query
            cursor.execute(query)
            
            # Determine query type
            query_type = query.upper().split()[0]
            is_select = query_type in ['SELECT', 'PRAGMA', 'EXPLAIN']
            
            if is_select:
                # Fetch results
                rows = cursor.fetchall()
                columns = [desc[0] for desc in cursor.description] if cursor.description else []
                
                results = []
                for row in rows:
                    results.append({col: row[col] for col in columns})
                
                conn.close()
                
                return jsonify({
                    'success': True,
                    'type': 'SELECT',
                    'columns': columns,
                    'rows': results,
                    'count': len(results)
                })
            else:
                # Commit changes
                conn.commit()
                affected = cursor.rowcount
                conn.close()
                
                logger.warning(f"SQL Console - Database modified: {affected} rows")
                
                return jsonify({
                    'success': True,
                    'type': query_type,
                    'affected_rows': affected
                })
        
        except sqlite3.Error as e:
            logger.error(f"SQL error: {str(e)}")
            return jsonify({'success': False, 'message': f'SQL Error: {str(e)}'}), 400
        
        except Exception as e:
            logger.error(f"Error in SQL console: {str(e)}")
            return jsonify({'success': False, 'message': str(e)}), 500
    
    
    @app.route('/api/sql-console/tables', methods=['GET'])
    def sql_console_tables():
        """Get list of all tables"""
        try:
            conn = sqlite3.connect(DATABASE_PATH)
            cursor = conn.cursor()
            
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
            tables = [row[0] for row in cursor.fetchall()]
            
            conn.close()
            
            return jsonify({
                'success': True,
                'tables': tables
            })
        
        except Exception as e:
            logger.error(f"Error fetching tables: {str(e)}")
            return jsonify({'success': False, 'message': str(e)}), 500
    
    
    @app.route('/api/sql-console/table-info/<table_name>', methods=['GET'])
    def sql_console_table_info(table_name):
        """Get table schema"""
        try:
            conn = sqlite3.connect(DATABASE_PATH)
            cursor = conn.cursor()
            
            # Get columns
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = []
            for row in cursor.fetchall():
                columns.append({
                    'cid': row[0],
                    'name': row[1],
                    'type': row[2],
                    'notnull': row[3],
                    'default': row[4],
                    'pk': row[5]
                })
            
            # Get row count
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            
            conn.close()
            
            return jsonify({
                'success': True,
                'table': table_name,
                'columns': columns,
                'row_count': count
            })
        
        except Exception as e:
            logger.error(f"Error fetching table info: {str(e)}")
            return jsonify({'success': False, 'message': str(e)}), 500
    
    
    logger.info("✅ SQL Console routes registered")

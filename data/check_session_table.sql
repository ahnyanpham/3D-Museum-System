#!/bin/bash

echo "=== CHECK: Có bảng SESSION không? ==="
sqlite3 /home/www/museum-system/data/museum_bennharong.db << 'SQL'
SELECT name FROM sqlite_master 
WHERE type='table' 
AND (name LIKE '%SESSION%' OR name LIKE '%session%' OR name LIKE '%LOGIN%');
SQL

echo ""
echo "=== LIST ALL TABLES ==="
sqlite3 /home/www/museum-system/data/museum_bennharong.db ".tables"

echo ""
echo "=== CHECK: USER_ACTIVITY_LOG có track login/logout? ==="
sqlite3 /home/www/museum-system/data/museum_bennharong.db << 'SQL'
SELECT DISTINCT ACTION_TYPE 
FROM USER_ACTIVITY_LOG 
LIMIT 20;
SQL

#!/bin/bash

echo "========================================="
echo "KIỂM TRA DATABASE - NHỮNG GÌ CÒN THIẾU"
echo "========================================="

cd /home/www/museum-system

sqlite3 data/museum.db << 'EOF'
.mode column
.headers on

-- 1. Kiểm tra bảng USERS/ROLES
SELECT '=== 1. QUẢN LÝ NGƯỜI DÙNG ===' as check_name;
SELECT 'users' as table_name, 
       CASE WHEN COUNT(*) > 0 THEN '✅ Có' ELSE '❌ Thiếu' END as status,
       COUNT(*) as records
FROM sqlite_master WHERE type='table' AND name='users'
UNION ALL
SELECT 'roles', 
       CASE WHEN COUNT(*) > 0 THEN '✅ Có' ELSE '❌ Thiếu' END,
       COUNT(*)
FROM sqlite_master WHERE type='table' AND name='roles'
UNION ALL
SELECT 'user_roles',
       CASE WHEN COUNT(*) > 0 THEN '✅ Có' ELSE '❌ Thiếu' END,
       COUNT(*)
FROM sqlite_master WHERE type='table' AND name='user_roles';

-- 2. Kiểm tra CỘT trong bảng TICKETS
SELECT '' as blank;
SELECT '=== 2. TRẠNG THÁI VÉ ===' as check_name;
PRAGMA table_info(tickets);

-- 3. Kiểm tra TIMESTAMP columns
SELECT '' as blank;
SELECT '=== 3. DỮ LIỆU THỜI GIAN ===' as check_name;
SELECT 
    'tickets' as table_name,
    GROUP_CONCAT(name, ', ') as timestamp_columns
FROM pragma_table_info('tickets')
WHERE name LIKE '%time%' OR name LIKE '%date%' OR name LIKE '%at%';

-- 4. Kiểm tra bảng VISIT_HISTORY
SELECT '' as blank;
SELECT '=== 4. VISIT_HISTORY STRUCTURE ===' as check_name;
PRAGMA table_info(visit_history);

-- 5. Kiểm tra bảng REVIEWS
SELECT '' as blank;
SELECT '=== 5. ĐÁNH GIÁ & PHẢN HỒI ===' as check_name;
SELECT 'reviews' as table_name,
       CASE WHEN COUNT(*) > 0 THEN '✅ Có' ELSE '❌ Thiếu' END as status,
       COUNT(*) as records
FROM sqlite_master WHERE type='table' AND name='reviews';

-- 6. Liệt kê TẤT CẢ BẢNG
SELECT '' as blank;
SELECT '=== 6. TẤT CẢ CÁC BẢNG HIỆN CÓ ===' as check_name;
SELECT name as table_name,
       (SELECT COUNT(*) FROM sqlite_master s WHERE s.tbl_name = m.name AND s.type='table') as exists
FROM sqlite_master m
WHERE type='table' 
ORDER BY name;

-- 7. Count records
SELECT '' as blank;
SELECT '=== 7. SỐ LƯỢNG RECORDS ===' as check_name;
EOF

# Count each table
for table in tickets customers visit_history attractions monuments ticket_types museum_info museum_corners monument_coordinates organizations
do
    count=$(sqlite3 data/museum.db "SELECT COUNT(*) FROM $table 2>/dev/null" 2>/dev/null || echo "0")
    printf "%-25s: %s records\n" "$table" "$count"
done

echo ""
echo "========================================="
echo "HOÀN TẤT KIỂM TRA"
echo "========================================="

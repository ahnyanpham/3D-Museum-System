-- ========================================
-- FIX ORDER TABLE - Complete Solution with Views
-- Import: sqlite3 /path/to/museum_bennharong.db < this_file.sql
-- ========================================

BEGIN TRANSACTION;

-- Step 1: Drop views that reference ORDER table
DROP VIEW IF EXISTS v_order_details;
DROP VIEW IF EXISTS v_customer_orders;

-- Step 2: Rename ORDER_NEW to ORDER
ALTER TABLE ORDER_NEW RENAME TO "ORDER";

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_customer ON "ORDER"(CUSTOMER_ID);
CREATE INDEX IF NOT EXISTS idx_order_status ON "ORDER"(STATUS);
CREATE INDEX IF NOT EXISTS idx_order_created ON "ORDER"(CREATED_AT DESC);
CREATE INDEX IF NOT EXISTS idx_order_code ON "ORDER"(ORDER_CODE);

-- Step 4: Create trigger to auto-generate ORDER_CODE
CREATE TRIGGER generate_order_code
AFTER INSERT ON "ORDER"
WHEN NEW.ORDER_CODE IS NULL
BEGIN
    UPDATE "ORDER" 
    SET ORDER_CODE = 'MT' || printf('%06d', NEW.ORDER_ID) || 'DEAD',
        PAYMENT_REFERENCE = 'MT' || printf('%06d', NEW.ORDER_ID) || 'DEAD'
    WHERE ORDER_ID = NEW.ORDER_ID;
END;

-- Step 5: Create trigger to auto-update UPDATED_AT timestamp
CREATE TRIGGER update_order_timestamp
AFTER UPDATE ON "ORDER"
BEGIN
    UPDATE "ORDER" 
    SET UPDATED_AT = CURRENT_TIMESTAMP
    WHERE ORDER_ID = NEW.ORDER_ID;
END;

-- Step 6: Create trigger to log status changes
CREATE TRIGGER log_order_status_change
AFTER UPDATE OF STATUS ON "ORDER"
WHEN OLD.STATUS != NEW.STATUS
BEGIN
    INSERT INTO PAYMENT_LOG (ORDER_ID, ACTION, OLD_STATUS, NEW_STATUS, NOTES)
    VALUES (
        NEW.ORDER_ID,
        'status_changed',
        OLD.STATUS,
        NEW.STATUS,
        'Status changed from ' || OLD.STATUS || ' to ' || NEW.STATUS
    );
END;

-- Step 7: Recreate views
CREATE VIEW v_order_details AS
SELECT 
    o.ORDER_ID,
    o.ORDER_CODE,
    o.STATUS,
    o.QUANTITY,
    o.TOTAL_PRICE,
    o.PAYMENT_PROOF_PATH,
    o.TRANSACTION_REF,
    o.CREATED_AT,
    o.UPDATED_AT,
    o.PAID_AT,
    c.CUSTOMER_ID,
    c.FULLNAME as CUSTOMER_NAME,
    c.PHONE as CUSTOMER_PHONE,
    c.EMAIL as CUSTOMER_EMAIL,
    tt.TYPE_NAME,
    tt.PRICE as UNIT_PRICE,
    u.USERNAME as CONFIRMED_BY_USERNAME,
    o.CONFIRMED_AT,
    o.REJECTION_REASON,
    o.CUSTOMER_NOTE,
    o.ADMIN_NOTE
FROM "ORDER" o
JOIN CUSTOMER c ON o.CUSTOMER_ID = c.CUSTOMER_ID
JOIN TICKET_TYPE tt ON o.TICKET_TYPE_ID = tt.TICKET_TYPE_ID
LEFT JOIN USER u ON o.CONFIRMED_BY = u.USER_ID;

CREATE VIEW v_customer_orders AS
SELECT 
    o.ORDER_ID,
    o.ORDER_CODE,
    o.STATUS,
    o.QUANTITY,
    o.TOTAL_PRICE,
    o.CREATED_AT,
    o.PAID_AT,
    tt.TYPE_NAME,
    tt.PRICE as UNIT_PRICE,
    CASE o.STATUS
        WHEN 'pending' THEN 'Chờ thanh toán'
        WHEN 'waiting_confirmation' THEN 'Chờ xác nhận'
        WHEN 'paid' THEN 'Đã thanh toán'
        WHEN 'cancelled' THEN 'Đã hủy'
        WHEN 'rejected' THEN 'Bị từ chối'
    END as STATUS_LABEL,
    COUNT(t.TICKET_ID) as TICKETS_CREATED
FROM "ORDER" o
JOIN TICKET_TYPE tt ON o.TICKET_TYPE_ID = tt.TICKET_TYPE_ID
LEFT JOIN TICKET t ON o.ORDER_ID = t.ORDER_ID
GROUP BY o.ORDER_ID;

COMMIT;

-- ========================================
-- VERIFICATION
-- ========================================

-- Test INSERT to verify trigger works
INSERT INTO "ORDER" (CUSTOMER_ID, TICKET_TYPE_ID, QUANTITY, UNIT_PRICE, TOTAL_PRICE, STATUS)
VALUES (1, 1, 1, 20000, 20000, 'pending');

-- Display result
SELECT '=== Test INSERT Result ===' as '';
SELECT ORDER_ID, ORDER_CODE, PAYMENT_REFERENCE, STATUS 
FROM "ORDER" 
ORDER BY ORDER_ID DESC LIMIT 1;

-- Clean up test data
DELETE FROM "ORDER" WHERE ORDER_ID = (SELECT MAX(ORDER_ID) FROM "ORDER");

-- Show all triggers
SELECT '' as '';
SELECT '=== Triggers Created ===' as '';
SELECT name FROM sqlite_master WHERE type='trigger' AND tbl_name='ORDER';

-- Show views
SELECT '' as '';
SELECT '=== Views Recreated ===' as '';
SELECT name FROM sqlite_master WHERE type='view' AND sql LIKE '%ORDER%';

SELECT '' as '';
SELECT '✅ ORDER table fixed successfully!' as '';
SELECT '   - ORDER_CODE is nullable' as '';
SELECT '   - Triggers auto-generate ORDER_CODE' as '';
SELECT '   - Indexes created' as '';
SELECT '   - Views recreated' as '';
SELECT '' as '';

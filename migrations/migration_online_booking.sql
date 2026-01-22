-- ========================================
-- ONLINE BOOKING SYSTEM - DATABASE MIGRATION
-- Museum Management System
-- Option 2: Manual Admin Approval
-- ========================================

-- 1. CREATE ORDER TABLE
CREATE TABLE IF NOT EXISTS "ORDER" (
    ORDER_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    ORDER_CODE TEXT UNIQUE NOT NULL, -- MT{ORDER_ID}DEAD
    CUSTOMER_ID INTEGER NOT NULL,
    TICKET_TYPE_ID INTEGER NOT NULL,
    QUANTITY INTEGER NOT NULL DEFAULT 1,
    UNIT_PRICE INTEGER NOT NULL,
    TOTAL_PRICE INTEGER NOT NULL,
    STATUS TEXT NOT NULL DEFAULT 'pending',
    -- Status values: 
    --   'pending' = Chờ thanh toán
    --   'waiting_confirmation' = Đã upload proof, chờ admin duyệt
    --   'paid' = Đã thanh toán, đã tạo vé
    --   'cancelled' = Đã hủy
    --   'rejected' = Admin từ chối
    
    -- Payment Information
    PAYMENT_METHOD TEXT DEFAULT 'bank_transfer',
    BANK_NAME TEXT DEFAULT 'ACB',
    BANK_ACCOUNT TEXT DEFAULT '018812398',
    BANK_ACCOUNT_NAME TEXT DEFAULT 'Bảo Tàng Bến Nhà Rồng',
    PAYMENT_REFERENCE TEXT, -- Nội dung CK: MT{ORDER_ID}DEAD
    PAYMENT_PROOF_PATH TEXT, -- Path to uploaded screenshot
    TRANSACTION_REF TEXT, -- Mã GD khách nhập (optional)
    
    -- Timestamps
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PAID_AT TIMESTAMP,
    EXPIRES_AT TIMESTAMP, -- Hết hạn sau 24h nếu không thanh toán
    
    -- Admin Actions
    CONFIRMED_BY INTEGER, -- Admin USER_ID who approved
    CONFIRMED_AT TIMESTAMP,
    REJECTION_REASON TEXT,
    
    -- Notes
    CUSTOMER_NOTE TEXT,
    ADMIN_NOTE TEXT,
    
    -- Foreign Keys
    FOREIGN KEY (CUSTOMER_ID) REFERENCES CUSTOMER(CUSTOMER_ID) ON DELETE CASCADE,
    FOREIGN KEY (TICKET_TYPE_ID) REFERENCES TICKET_TYPE(TICKET_TYPE_ID),
    FOREIGN KEY (CONFIRMED_BY) REFERENCES USER(USER_ID)
);

-- 2. UPDATE TICKET TABLE - Add ORDER_ID reference
ALTER TABLE TICKET ADD COLUMN ORDER_ID INTEGER REFERENCES "ORDER"(ORDER_ID);

-- 3. CREATE INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_order_customer ON "ORDER"(CUSTOMER_ID);
CREATE INDEX IF NOT EXISTS idx_order_status ON "ORDER"(STATUS);
CREATE INDEX IF NOT EXISTS idx_order_created ON "ORDER"(CREATED_AT DESC);
CREATE INDEX IF NOT EXISTS idx_order_code ON "ORDER"(ORDER_CODE);
CREATE INDEX IF NOT EXISTS idx_ticket_order ON TICKET(ORDER_ID);

-- 4. CREATE PAYMENT_LOG TABLE for tracking
CREATE TABLE IF NOT EXISTS PAYMENT_LOG (
    LOG_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    ORDER_ID INTEGER NOT NULL,
    ACTION TEXT NOT NULL, -- 'created', 'proof_uploaded', 'approved', 'rejected', 'cancelled'
    PERFORMED_BY INTEGER, -- USER_ID
    PERFORMED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    OLD_STATUS TEXT,
    NEW_STATUS TEXT,
    NOTES TEXT,
    IP_ADDRESS TEXT,
    FOREIGN KEY (ORDER_ID) REFERENCES "ORDER"(ORDER_ID) ON DELETE CASCADE,
    FOREIGN KEY (PERFORMED_BY) REFERENCES USER(USER_ID)
);

CREATE INDEX IF NOT EXISTS idx_payment_log_order ON PAYMENT_LOG(ORDER_ID);
CREATE INDEX IF NOT EXISTS idx_payment_log_time ON PAYMENT_LOG(PERFORMED_AT DESC);

-- 5. INSERT SAMPLE TICKET TYPES (if not exists)
INSERT OR IGNORE INTO TICKET_TYPE (TICKET_TYPE_ID, TYPE_NAME, PRICE, DESCRIPTION) VALUES
(1, 'Vé người lớn', 40000, 'Vé dành cho người lớn (từ 16 tuổi trở lên)'),
(2, 'Vé trẻ em', 20000, 'Vé dành cho trẻ em (từ 6-15 tuổi)'),
(3, 'Vé sinh viên', 25000, 'Vé dành cho sinh viên có thẻ'),
(4, 'Vé người cao tuổi', 15000, 'Vé dành cho người trên 60 tuổi'),
(5, 'Vé đoàn thể', 30000, 'Vé dành cho đoàn từ 20 người trở lên');

-- 6. CREATE TRIGGER to auto-generate ORDER_CODE
CREATE TRIGGER IF NOT EXISTS generate_order_code
AFTER INSERT ON "ORDER"
WHEN NEW.ORDER_CODE IS NULL
BEGIN
    UPDATE "ORDER" 
    SET ORDER_CODE = 'MT' || printf('%06d', NEW.ORDER_ID) || 'DEAD',
        PAYMENT_REFERENCE = 'MT' || printf('%06d', NEW.ORDER_ID) || 'DEAD'
    WHERE ORDER_ID = NEW.ORDER_ID;
END;

-- 7. CREATE TRIGGER to update UPDATED_AT on order change
CREATE TRIGGER IF NOT EXISTS update_order_timestamp
AFTER UPDATE ON "ORDER"
BEGIN
    UPDATE "ORDER" 
    SET UPDATED_AT = CURRENT_TIMESTAMP
    WHERE ORDER_ID = NEW.ORDER_ID;
END;

-- 8. CREATE TRIGGER to log payment actions
CREATE TRIGGER IF NOT EXISTS log_order_status_change
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

-- 9. CREATE VIEW for admin order management
CREATE VIEW IF NOT EXISTS v_order_details AS
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

-- 10. CREATE VIEW for customer order history
CREATE VIEW IF NOT EXISTS v_customer_orders AS
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

-- 11. Sample data for testing (optional)
-- Uncomment to insert test data

/*
-- Test customer order (pending)
INSERT INTO "ORDER" (CUSTOMER_ID, TICKET_TYPE_ID, QUANTITY, UNIT_PRICE, TOTAL_PRICE, STATUS)
VALUES (1, 1, 2, 40000, 80000, 'pending');

-- Test customer order (waiting confirmation)
INSERT INTO "ORDER" (CUSTOMER_ID, TICKET_TYPE_ID, QUANTITY, UNIT_PRICE, TOTAL_PRICE, STATUS, PAYMENT_PROOF_PATH)
VALUES (1, 2, 1, 20000, 20000, 'waiting_confirmation', '/uploads/payments/order_2.jpg');
*/

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check ORDER table structure
-- SELECT sql FROM sqlite_master WHERE name = 'ORDER';

-- Count orders by status
-- SELECT STATUS, COUNT(*) as COUNT FROM "ORDER" GROUP BY STATUS;

-- View all orders with details
-- SELECT * FROM v_order_details ORDER BY CREATED_AT DESC;

-- Check recent payment logs
-- SELECT * FROM PAYMENT_LOG ORDER BY PERFORMED_AT DESC LIMIT 10;

-- ========================================
-- MIGRATION COMPLETED
-- ========================================

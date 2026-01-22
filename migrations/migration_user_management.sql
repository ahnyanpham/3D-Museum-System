-- Museum System - User Management & Role-Based Access Control
-- Migration Script

-- ============================================================================
-- 1. Add USER_TYPE column to USER table
-- ============================================================================
ALTER TABLE USER ADD COLUMN USER_TYPE TEXT DEFAULT 'internal';

-- Update existing users as internal
UPDATE USER SET USER_TYPE = 'internal';

-- ============================================================================
-- 2. Update ROLE table with detailed permissions
-- ============================================================================
UPDATE ROLE SET PERMISSIONS = 'all' WHERE ROLE_ID = 1; -- Admin
UPDATE ROLE SET PERMISSIONS = 'dashboard,map,diagram,tour,customers,tickets,checkin,checkout,rating,export' WHERE ROLE_ID = 2; -- Manager
UPDATE ROLE SET PERMISSIONS = 'customers,tickets' WHERE ROLE_ID = 3; -- Staff
UPDATE ROLE SET PERMISSIONS = 'checkin,checkout,rating' WHERE ROLE_ID = 4; -- Tour Guide
UPDATE ROLE SET PERMISSIONS = 'checkin,checkout,rating' WHERE ROLE_ID = 5; -- Security

-- Add Customer role
INSERT INTO ROLE (ROLE_ID, ROLE_NAME, DESCRIPTION, PERMISSIONS) 
VALUES (6, 'Customer', 'Khách hàng', 'map,diagram,tour,my_tickets,purchase');

-- ============================================================================
-- 3. Create PASSWORD_RESET table
-- ============================================================================
CREATE TABLE IF NOT EXISTS PASSWORD_RESET (
    RESET_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    USER_ID INTEGER NOT NULL,
    RESET_TOKEN TEXT UNIQUE NOT NULL,
    EXPIRES_AT TEXT NOT NULL,
    USED INTEGER DEFAULT 0,
    CREATED_AT TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (USER_ID) REFERENCES USER(USER_ID) ON DELETE CASCADE
);

CREATE INDEX idx_password_reset_token ON PASSWORD_RESET(RESET_TOKEN);
CREATE INDEX idx_password_reset_user ON PASSWORD_RESET(USER_ID);

-- ============================================================================
-- 4. Create indexes for better performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_username ON USER(USERNAME);
CREATE INDEX IF NOT EXISTS idx_user_email ON USER(EMAIL);
CREATE INDEX IF NOT EXISTS idx_user_type ON USER(USER_TYPE);
CREATE INDEX IF NOT EXISTS idx_user_active ON USER(IS_ACTIVE);

CREATE INDEX IF NOT EXISTS idx_customer_phone ON CUSTOMER(PHONE);
CREATE INDEX IF NOT EXISTS idx_customer_email ON CUSTOMER(EMAIL);
CREATE INDEX IF NOT EXISTS idx_customer_fullname ON CUSTOMER(FULLNAME);

CREATE INDEX IF NOT EXISTS idx_ticket_customer ON TICKET(CUSTOMER_ID);
CREATE INDEX IF NOT EXISTS idx_ticket_status ON TICKET(STATUS);
CREATE INDEX IF NOT EXISTS idx_ticket_code ON TICKET(TICKET_CODE);

-- ============================================================================
-- 5. Update TICKET table - Add more detailed statuses
-- ============================================================================
-- Current status values should be:
-- 'active' - Mua chưa check-in (hoạt động)
-- 'checked_in' - Đã check-in
-- 'checked_out' - Đã check-out
-- 'completed' - Hoàn thành (after rating)
-- 'expired' - Hết hạn
-- 'cancelled' - Đã hủy

-- Update old 'used' status to appropriate status
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
WHERE STATUS = 'used';

-- ============================================================================
-- 6. Link CUSTOMER to USER for customer accounts
-- ============================================================================
-- Add USER_ID to CUSTOMER table to link customer accounts
ALTER TABLE CUSTOMER ADD COLUMN USER_ID INTEGER;

CREATE INDEX IF NOT EXISTS idx_customer_user ON CUSTOMER(USER_ID);

-- ============================================================================
-- 7. Create sample customer user account (for testing)
-- ============================================================================
-- Password: customer123 (hashed)
INSERT INTO USER (USERNAME, PASSWORD, EMAIL, FULLNAME, PHONE, USER_TYPE, IS_ACTIVE)
VALUES ('customer_test', '0192023a7bbd73250516f069df18b500', 'customer@test.com', 'Khách Hàng Test', '0900000001', 'customer', 1);

-- Assign Customer role
INSERT INTO USER_ROLE (USER_ID, ROLE_ID)
SELECT USER_ID, 6 FROM USER WHERE USERNAME = 'customer_test';

-- ============================================================================
-- 8. Add CREATED_BY and UPDATED_BY to track who made changes
-- ============================================================================
ALTER TABLE USER ADD COLUMN CREATED_BY INTEGER;
ALTER TABLE USER ADD COLUMN UPDATED_BY INTEGER;

ALTER TABLE CUSTOMER ADD COLUMN CREATED_BY INTEGER;
ALTER TABLE CUSTOMER ADD COLUMN UPDATED_BY INTEGER;

-- ============================================================================
-- 9. Verification Queries
-- ============================================================================
-- Check all roles
-- SELECT * FROM ROLE;

-- Check user types
-- SELECT USER_TYPE, COUNT(*) FROM USER GROUP BY USER_TYPE;

-- Check ticket statuses
-- SELECT STATUS, COUNT(*) FROM TICKET GROUP BY STATUS;

-- Check customer accounts
-- SELECT 
--     u.USERNAME, u.FULLNAME, u.EMAIL, u.USER_TYPE,
--     r.ROLE_NAME, r.PERMISSIONS
-- FROM USER u
-- LEFT JOIN USER_ROLE ur ON u.USER_ID = ur.USER_ID
-- LEFT JOIN ROLE r ON ur.ROLE_ID = r.ROLE_ID
-- WHERE u.USER_TYPE = 'customer';

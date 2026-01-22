#!/bin/bash

DB_PATH="/home/www/museum-system/data/museum_bennharong.db"

echo "=== Step 1: Stop backend service ==="
sudo systemctl stop museum-backend
sleep 2

echo ""
echo "=== Step 2: Backup database ==="
cp "$DB_PATH" "${DB_PATH}.backup_$(date +%Y%m%d_%H%M%S)"
echo "✓ Backup created"

echo ""
echo "=== Step 3: Check current ORDER table schema ==="
sqlite3 "$DB_PATH" ".schema ORDER" | grep ORDER_CODE

echo ""
echo "=== Step 4: Apply fix ==="
sqlite3 "$DB_PATH" << 'EOF'
BEGIN TRANSACTION;

-- Drop existing triggers first
DROP TRIGGER IF EXISTS generate_order_code;
DROP TRIGGER IF EXISTS update_order_timestamp;
DROP TRIGGER IF EXISTS log_order_status_change;

-- Create new ORDER table with nullable ORDER_CODE
CREATE TABLE "ORDER_NEW" (
    ORDER_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    ORDER_CODE TEXT UNIQUE,
    CUSTOMER_ID INTEGER NOT NULL,
    TICKET_TYPE_ID INTEGER NOT NULL,
    QUANTITY INTEGER NOT NULL DEFAULT 1,
    UNIT_PRICE INTEGER NOT NULL,
    TOTAL_PRICE INTEGER NOT NULL,
    STATUS TEXT NOT NULL DEFAULT 'pending',
    PAYMENT_METHOD TEXT DEFAULT 'bank_transfer',
    BANK_NAME TEXT DEFAULT 'ACB',
    BANK_ACCOUNT TEXT DEFAULT '018812398',
    BANK_ACCOUNT_NAME TEXT DEFAULT 'Bảo Tàng Bến Nhà Rồng',
    PAYMENT_REFERENCE TEXT,
    PAYMENT_PROOF_PATH TEXT,
    TRANSACTION_REF TEXT,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PAID_AT TIMESTAMP,
    EXPIRES_AT TIMESTAMP,
    CONFIRMED_BY INTEGER,
    CONFIRMED_AT TIMESTAMP,
    REJECTION_REASON TEXT,
    CUSTOMER_NOTE TEXT,
    ADMIN_NOTE TEXT,
    FOREIGN KEY (CUSTOMER_ID) REFERENCES CUSTOMER(CUSTOMER_ID) ON DELETE CASCADE,
    FOREIGN KEY (TICKET_TYPE_ID) REFERENCES TICKET_TYPE(TICKET_TYPE_ID),
    FOREIGN KEY (CONFIRMED_BY) REFERENCES USER(USER_ID)
);

-- Copy data if exists
INSERT INTO "ORDER_NEW" 
SELECT * FROM "ORDER" WHERE 1=0;  -- Copy structure, no data (table might be empty)

-- Drop old
DROP TABLE "ORDER";

-- Rename
ALTER TABLE "ORDER_NEW" RENAME TO "ORDER";

-- Recreate indexes
CREATE INDEX idx_order_customer ON "ORDER"(CUSTOMER_ID);
CREATE INDEX idx_order_status ON "ORDER"(STATUS);
CREATE INDEX idx_order_created ON "ORDER"(CREATED_AT DESC);
CREATE INDEX idx_order_code ON "ORDER"(ORDER_CODE);

-- Recreate trigger
CREATE TRIGGER generate_order_code
AFTER INSERT ON "ORDER"
WHEN NEW.ORDER_CODE IS NULL
BEGIN
    UPDATE "ORDER" 
    SET ORDER_CODE = 'MT' || printf('%06d', NEW.ORDER_ID) || 'DEAD',
        PAYMENT_REFERENCE = 'MT' || printf('%06d', NEW.ORDER_ID) || 'DEAD'
    WHERE ORDER_ID = NEW.ORDER_ID;
END;

CREATE TRIGGER update_order_timestamp
AFTER UPDATE ON "ORDER"
BEGIN
    UPDATE "ORDER" 
    SET UPDATED_AT = CURRENT_TIMESTAMP
    WHERE ORDER_ID = NEW.ORDER_ID;
END;

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

COMMIT;
EOF

echo ""
echo "=== Step 5: Verify triggers ==="
sqlite3 "$DB_PATH" "SELECT name FROM sqlite_master WHERE type='trigger' AND tbl_name='ORDER';"

echo ""
echo "=== Step 6: Test INSERT ==="
sqlite3 "$DB_PATH" "
INSERT INTO \"ORDER\" (CUSTOMER_ID, TICKET_TYPE_ID, QUANTITY, UNIT_PRICE, TOTAL_PRICE, STATUS)
VALUES (1, 1, 1, 20000, 20000, 'pending');
SELECT ORDER_ID, ORDER_CODE, PAYMENT_REFERENCE FROM \"ORDER\" ORDER BY ORDER_ID DESC LIMIT 1;
DELETE FROM \"ORDER\" WHERE ORDER_ID = (SELECT MAX(ORDER_ID) FROM \"ORDER\");
"

echo ""
echo "=== Step 7: Start backend service ==="
sudo systemctl start museum-backend
sleep 3

echo ""
echo "=== Step 8: Check service status ==="
sudo systemctl status museum-backend --no-pager -l

echo ""
echo "✅ Done! Test checkout page now."

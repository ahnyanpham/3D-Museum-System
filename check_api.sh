#!/bin/bash

echo "=== Testing Booking APIs ==="
echo ""

echo "1. Test ticket-types endpoint:"
curl -s http://localhost:5000/api/booking/ticket-types | python3 -m json.tool
echo ""
echo ""

echo "2. Test create-order endpoint (will fail without login):"
curl -s -X POST http://localhost:5000/api/booking/create-order \
  -H "Content-Type: application/json" \
  -d '{"ticket_type_id":1,"quantity":1}' | head -20
echo ""
echo ""

echo "3. Check if ORDER table exists:"
sqlite3 /home/www/museum-system/data/museum_bennharong.db \
  "SELECT name FROM sqlite_master WHERE type='table' AND name='ORDER';"
echo ""
echo ""

echo "4. Check gunicorn error log:"
tail -20 /home/www/log/gunicorn-error.log

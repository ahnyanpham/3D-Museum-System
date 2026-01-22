#!/bin/bash
# Run these commands ON THE SERVER

echo "========================================="
echo "CHECK app.js and api.js"
echo "========================================="

echo ""
echo "=== FULL app.js CONTENT ==="
cat /home/www/museum-system/frontend/js/app.js

echo ""
echo ""
echo "=== FULL api.js CONTENT ==="
cat /home/www/museum-system/frontend/js/api.js

echo ""
echo ""
echo "=== CHECK users/index.html for inline scripts ==="
cat /home/www/museum-system/frontend/web/admin/users/index.html | grep -A 20 "<script"

echo ""
echo "========================================="
echo "LOOK FOR THESE PATTERNS:"
echo "========================================="
echo "1. if (status === 401 || !response.ok)"
echo "2. window.location.href = "
echo "3. setInterval for auth checking"
echo "4. fetch().catch(() => redirect)"
echo "========================================="

#!/bin/bash
# Run this ON THE SERVER (not in container)

echo "========================================="
echo "FIND LOGOUT ISSUE IN FRONTEND"
echo "========================================="

BASE="/home/www/museum-system/frontend"

echo ""
echo "1. List all JavaScript files:"
ls -lh $BASE/js/

echo ""
echo "2. Check app.js for logout:"
echo "---"
cat $BASE/js/app.js | grep -B 5 -A 10 "logout"

echo ""
echo "3. Check api.js for 401 handling:"
echo "---"
cat $BASE/js/api.js | grep -B 5 -A 10 "401\|403"

echo ""
echo "4. Find ALL redirects to login:"
echo "---"
grep -rn "window.location.*login\|location.href.*login" $BASE/js/

echo ""
echo "5. Check dashboard.js full content:"
echo "---"
cat $BASE/js/dashboard.js

echo ""
echo "========================================="
echo "KEY SUSPECTS:"
echo "========================================="
echo "Look for:"
echo "  - if (response.status === 401) { redirect to login }"
echo "  - setInterval(() => checkAuth())"  
echo "  - window.location = '/web/admin/login/'"
echo "========================================="

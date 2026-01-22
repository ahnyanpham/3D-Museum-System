#!/bin/bash
# MANUAL INVESTIGATION - Run these commands on server

echo "========================================="
echo "FIND FRONTEND FILES LOCATION"
echo "========================================="

# 1. Find nginx config to see where files are served from
echo "1. Check nginx config:"
cat /opt/nginx/sites-enabled/bennharong_advance.conf | grep -A 5 "location /web/admin"

echo ""
echo "2. Find JavaScript files:"
find /opt/nginx -name "app.js" -o -name "dashboard.js" 2>/dev/null

echo ""
echo "3. Check /js/ directory from logs:"
# From logs we see: GET /js/app.js, /js/dashboard.js, etc
# These are served from nginx root

echo ""
echo "4. Find where /js/ maps to:"
cat /opt/nginx/sites-enabled/bennharong_advance.conf | grep -B 5 -A 5 "location /js"

echo ""
echo "========================================="
echo "MOST LIKELY PATHS:"
echo "========================================="
echo "Based on logs showing:"
echo "  - GET /js/app.js"
echo "  - GET /js/dashboard.js"  
echo "  - GET /css/style.css"
echo "  - GET /web/admin/users/"
echo ""
echo "Files are probably in:"
echo "  - /opt/nginx/html/js/"
echo "  - /opt/nginx/html/web/admin/"
echo "  - OR wherever nginx root is set to"
echo ""
echo "Run this to find:"
echo "  grep -r 'root ' /opt/nginx/sites-enabled/*.conf"
echo "========================================="

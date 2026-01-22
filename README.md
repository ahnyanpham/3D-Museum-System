# 🏛️ Museum Management System - Bảo Tàng Bến Nhà Rồng

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![Flask](https://img.shields.io/badge/Flask-3.0+-green.svg)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production-success.svg)](https://bennharong.servehttp.com)

Hệ thống quản lý toàn diện cho Bảo Tàng Hồ Chí Minh tại Bến Nhà Rồng, tích hợp công nghệ 3D GIS, quản lý vé online và hệ thống check-in QR code.

**🌐 Live Demo:** [bennharong.servehttp.com](https://bennharong.servehttp.com)

---

## 📋 Mục lục

- [Tính năng](#-tính-năng)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Cài đặt](#-cài-đặt)
- [Cấu hình](#️-cấu-hình)
- [Sử dụng](#-sử-dụng)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Database Schema](#-database-schema)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Tính năng

### 👨‍💼 Cho nhân viên
- ✅ **Dashboard thống kê** - Tổng quan doanh thu, vé bán, khách tham quan
- ✅ **Quản lý người dùng** - CRUD users, phân quyền theo vai trò
- ✅ **Quản lý vé** - Bán vé tại quầy, tìm kiếm, xuất Excel
- ✅ **Quản lý đơn hàng** - Duyệt đơn đặt vé online, xác nhận thanh toán
- ✅ **Quản lý khách hàng** - Database khách hàng, lịch sử tham quan
- ✅ **Báo cáo** - Xuất báo cáo Excel, thống kê theo thời gian

### 👥 Cho khách hàng
- 🎫 **Đặt vé online** - Đặt vé trước qua website
- 💳 **Upload chứng từ** - Tải ảnh chuyển khoản ngân hàng
- 📧 **Nhận vé email** - Tự động gửi QR code sau khi duyệt
- 🔍 **Tra cứu đơn hàng** - Kiểm tra trạng thái đơn hàng

### 🏛️ Cho khách tham quan
- 🌐 **Virtual Tour 3D** - Khám phá bảo tàng trong không gian 3D
- 🗺️ **Bản đồ tương tác** - Điều hướng giữa các công trình
- 📱 **QR Code Check-in** - Vào cửa nhanh chóng

---

## 🛠️ Công nghệ sử dụng

### Backend
- **Framework:** Flask 3.0+
- **Database:** SQLite 3
- **Authentication:** Werkzeug (pbkdf2:sha256)
- **Session:** Flask-Session
- **Excel Export:** openpyxl
- **QR Code:** qrcode, Pillow

### Frontend
- **Core:** HTML5, CSS3, Vanilla JavaScript (ES6+)
- **3D GIS:** ArcGIS JavaScript API 4.x
- **Charts:** Chart.js
- **Icons:** Font Awesome 6.4.0
- **QR:** QRCode.js

### 3D Modeling
- **Modeling:** Blender 3.6+
- **GIS:** QGIS 3.x
- **Format:** GLB/glTF (LOD 3 standard)

### Server
- **Web Server:** Nginx
- **WSGI:** Gunicorn
- **OS:** Ubuntu 24.04 LTS
- **SSL:** Let's Encrypt

---

## 💻 Yêu cầu hệ thống

### Môi trường Development
```
Python >= 3.9
Node.js >= 16 (optional, cho build tools)
SQLite3
Git
```

### Môi trường Production
```
Ubuntu 20.04+ / CentOS 8+
Python >= 3.9
Nginx
Gunicorn
SQLite3 hoặc PostgreSQL
Domain name + SSL certificate
```

---

## 🚀 Cài đặt

### 1️⃣ Clone repository

```bash
git clone https://github.com/yourusername/museum-management-system.git
cd museum-management-system
```

### 2️⃣ Tạo virtual environment

```bash
# Tạo virtual environment
python3 -m venv venv

# Kích hoạt virtual environment
# Linux/Mac:
source venv/bin/activate

# Windows:
venv\Scripts\activate
```

### 3️⃣ Cài đặt dependencies

```bash
# Cài đặt Python packages
pip install --upgrade pip
pip install -r requirements.txt

# Xác nhận cài đặt thành công
pip list
```

**Nội dung file `requirements.txt`:**
```txt
Flask==3.0.0
Flask-CORS==4.0.0
Werkzeug==3.0.1
python-dotenv==1.0.0
qrcode==7.4.2
Pillow==10.1.0
openpyxl==3.1.2
```

### 4️⃣ Thiết lập database

```bash
# Tạo thư mục data nếu chưa có
mkdir -p data

# Khởi tạo database
python3 backend/init_db.py

# Hoặc import từ schema SQL
sqlite3 data/museum_bennharong.db < backend/schema.sql
```

### 5️⃣ Cấu hình môi trường

```bash
# Tạo file .env
cp .env.example .env

# Chỉnh sửa cấu hình
nano .env
```

**Nội dung file `.env`:**
```env
# Flask Configuration
FLASK_APP=backend/app.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-here-change-in-production

# Database
DATABASE_PATH=data/museum_bennharong.db

# Server
HOST=0.0.0.0
PORT=5000

# Session
SESSION_TYPE=filesystem
PERMANENT_SESSION_LIFETIME=3600

# Upload
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=16777216

# Email (optional)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

### 6️⃣ Khởi động development server

```bash
# Chạy Flask development server
python3 backend/app.py

# Hoặc dùng Flask CLI
flask run --host=0.0.0.0 --port=5000
```

Truy cập: **http://localhost:5000**

**Default credentials:**
- Username: `admin`
- Password: `admin123`

⚠️ **Quan trọng:** Đổi password sau khi login lần đầu!

---

## ⚙️ Cấu hình

### Database Schema

```bash
# Xem cấu trúc database
sqlite3 data/museum_bennharong.db .schema

# Backup database
cp data/museum_bennharong.db data/museum_bennharong.db.backup

# Restore database
cp data/museum_bennharong.db.backup data/museum_bennharong.db
```

### Tạo admin user

```bash
# Vào Python shell
python3

>>> from werkzeug.security import generate_password_hash
>>> import sqlite3
>>> 
>>> # Tạo password hash
>>> password = generate_password_hash('your-password')
>>> 
>>> # Kết nối database
>>> conn = sqlite3.connect('data/museum_bennharong.db')
>>> cursor = conn.cursor()
>>> 
>>> # Insert admin user
>>> cursor.execute("""
...     INSERT INTO USER (USERNAME, PASSWORD, FULLNAME, EMAIL, USER_TYPE, IS_ACTIVE)
...     VALUES (?, ?, ?, ?, ?, ?)
... """, ('admin', password, 'Administrator', 'admin@museum.vn', 'internal', 1))
>>> 
>>> user_id = cursor.lastrowid
>>> 
>>> # Gán role Admin (giả sử ROLE_ID=1 là Admin)
>>> cursor.execute("""
...     INSERT INTO USER_ROLE (USER_ID, ROLE_ID)
...     VALUES (?, ?)
... """, (user_id, 1))
>>> 
>>> conn.commit()
>>> conn.close()
>>> print("Admin user created successfully!")
```

### Upload folder permissions

```bash
# Tạo thư mục uploads
mkdir -p uploads/payment_proofs
mkdir -p uploads/tickets

# Set permissions (Linux)
chmod 755 uploads
chmod 755 uploads/payment_proofs
chmod 755 uploads/tickets
```

---

## 📖 Sử dụng

### Chạy Development Server

```bash
# Activate virtual environment
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Chạy Flask
python3 backend/app.py

# Access:
# Frontend: http://localhost:5000
# Admin: http://localhost:5000/admin/
# API: http://localhost:5000/api/
```

### Testing API Endpoints

```bash
# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","user_type":"internal"}'

# Test get tickets
curl http://localhost:5000/api/admin/tickets/list \
  -H "Cookie: session=your-session-cookie"
```

### Logging

```bash
# Xem logs
tail -f logs/app.log

# Xem error logs
tail -f logs/error.log
```

---

## 📁 Cấu trúc dự án

```
museum-management-system/
├── backend/
│   ├── app.py                 # Main Flask application (3290 lines)
│   ├── init_db.py            # Database initialization
│   ├── schema.sql            # Database schema
│   └── utils/
│       ├── auth.py           # Authentication utilities
│       ├── qr_generator.py   # QR code generation
│       └── excel_export.py   # Excel export functions
│
├── frontend/
│   ├── index.html            # Dashboard
│   ├── login.html            # Login page
│   ├── users.html            # User management
│   ├── admin-tickets.html    # Ticket management
│   ├── orders.html           # Order management
│   ├── customers.html        # Customer management
│   ├── 3d-tour.html          # 3D virtual tour
│   │
│   ├── css/
│   │   ├── style.css         # Main stylesheet
│   │   └── responsive.css    # Responsive design
│   │
│   ├── js/
│   │   ├── main.js           # Core JavaScript
│   │   ├── users.js          # User management (525 lines)
│   │   ├── admin-tickets.js  # Ticket management
│   │   ├── orders.js         # Order management (520 lines)
│   │   ├── dashboard.js      # Dashboard logic
│   │   └── 3d-viewer.js      # 3D GIS integration
│   │
│   └── assets/
│       ├── images/
│       ├── models/           # GLB/glTF 3D models
│       └── icons/
│
├── data/
│   └── museum_bennharong.db  # SQLite database
│
├── uploads/
│   ├── payment_proofs/       # Customer payment images
│   └── tickets/              # Generated ticket PDFs
│
├── logs/
│   ├── app.log              # Application logs
│   └── error.log            # Error logs
│
├── tests/
│   ├── test_auth.py
│   ├── test_api.py
│   └── test_database.py
│
├── docs/
│   ├── API.md               # API documentation
│   ├── DATABASE.md          # Database schema
│   └── DEPLOYMENT.md        # Deployment guide
│
├── .env.example             # Environment template
├── .gitignore
├── requirements.txt         # Python dependencies
├── README.md               # This file
└── LICENSE
```

---

## 🗄️ Database Schema

### Core Tables (15 tables)

#### 1. USER
```sql
CREATE TABLE USER (
    USER_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    USERNAME TEXT UNIQUE NOT NULL,
    PASSWORD TEXT NOT NULL,
    FULLNAME TEXT,
    EMAIL TEXT,
    PHONE TEXT,
    USER_TYPE TEXT CHECK(USER_TYPE IN ('internal', 'customer')),
    IS_ACTIVE INTEGER DEFAULT 1,
    LAST_LOGIN TEXT,
    CREATED_AT TEXT DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TEXT DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. USER_SESSION (Session Tracking)
```sql
CREATE TABLE USER_SESSION (
    SESSION_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    USER_ID INTEGER NOT NULL,
    SESSION_TOKEN TEXT UNIQUE NOT NULL,
    LOGIN_TIME TEXT DEFAULT CURRENT_TIMESTAMP,
    LOGOUT_TIME TEXT,
    LAST_ACTIVITY TEXT DEFAULT CURRENT_TIMESTAMP,
    IP_ADDRESS TEXT,
    USER_AGENT TEXT,
    IS_ACTIVE INTEGER DEFAULT 1,
    CREATED_AT TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (USER_ID) REFERENCES USER(USER_ID)
);
```

#### 3. ROLE
```sql
CREATE TABLE ROLE (
    ROLE_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    ROLE_NAME TEXT UNIQUE NOT NULL,
    PERMISSIONS TEXT,
    DESCRIPTION TEXT
);
```

#### 4. TICKET
```sql
CREATE TABLE TICKET (
    TICKET_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    TICKET_CODE TEXT UNIQUE NOT NULL,
    TICKET_TYPE_ID INTEGER,
    CUSTOMER_ID INTEGER,
    ORDER_ID INTEGER,
    STATUS TEXT CHECK(STATUS IN ('active', 'used', 'expired', 'cancelled')),
    QR_CODE TEXT,
    ISSUE_DATE TEXT DEFAULT CURRENT_TIMESTAMP,
    VALID_DATE TEXT,
    USED_DATE TEXT,
    FOREIGN KEY (TICKET_TYPE_ID) REFERENCES TICKET_TYPE(TICKET_TYPE_ID),
    FOREIGN KEY (CUSTOMER_ID) REFERENCES CUSTOMER(CUSTOMER_ID),
    FOREIGN KEY (ORDER_ID) REFERENCES "ORDER"(ORDER_ID)
);
```

#### 5. ORDER (Online Bookings)
```sql
CREATE TABLE "ORDER" (
    ORDER_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    ORDER_CODE TEXT UNIQUE NOT NULL,
    CUSTOMER_ID INTEGER,
    TICKET_TYPE_ID INTEGER,
    QUANTITY INTEGER NOT NULL,
    UNIT_PRICE REAL NOT NULL,
    TOTAL_PRICE REAL NOT NULL,
    STATUS TEXT CHECK(STATUS IN ('pending', 'waiting_confirmation', 'paid', 'rejected', 'cancelled')),
    PAYMENT_PROOF_PATH TEXT,
    BANK_NAME TEXT,
    BANK_ACCOUNT TEXT,
    BANK_ACCOUNT_NAME TEXT,
    TRANSACTION_REF TEXT,
    CUSTOMER_NOTE TEXT,
    REJECTION_REASON TEXT,
    CONFIRMED_BY INTEGER,
    CONFIRMED_AT TEXT,
    CREATED_AT TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CUSTOMER_ID) REFERENCES CUSTOMER(CUSTOMER_ID),
    FOREIGN KEY (TICKET_TYPE_ID) REFERENCES TICKET_TYPE(TICKET_TYPE_ID),
    FOREIGN KEY (CONFIRMED_BY) REFERENCES USER(USER_ID)
);
```

**Xem full schema:** [docs/DATABASE.md](docs/DATABASE.md)

---

## 📡 API Documentation

### Authentication

#### POST `/api/auth/login`
Login user (internal staff hoặc customer)

**Request:**
```json
{
  "username": "admin",
  "password": "admin123",
  "user_type": "internal"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "username": "admin",
    "fullname": "Administrator",
    "role": "Admin",
    "permissions": ["all"]
  }
}
```

#### POST `/api/auth/logout`
Logout user

**Response:**
```json
{
  "success": true,
  "message": "Đăng xuất thành công"
}
```

### User Management

#### GET `/api/admin/users?user_type=internal`
Lấy danh sách users

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "user_id": 1,
      "username": "admin",
      "fullname": "Administrator",
      "email": "admin@museum.vn",
      "is_active": 1,
      "is_online": 1,
      "role_name": "Admin"
    }
  ]
}
```

#### POST `/api/admin/users/{user_id}/toggle-active`
Kích hoạt/Vô hiệu hóa user

**Response:**
```json
{
  "success": true,
  "message": "Đã vô hiệu hóa người dùng thành công",
  "new_status": 0
}
```

### Ticket Management

#### GET `/api/admin/tickets/list?status=active&page=1&page_size=15`
Lấy danh sách vé

#### POST `/api/admin/tickets/sell`
Bán vé tại quầy

#### GET `/api/admin/tickets/export-excel?status=all`
Xuất Excel danh sách vé

### Order Management

#### GET `/api/admin/orders/list?status=all`
Lấy danh sách đơn hàng

#### POST `/api/admin/orders/{order_id}/approve`
Duyệt đơn hàng

#### POST `/api/admin/orders/{order_id}/reject`
Từ chối đơn hàng

**Request:**
```json
{
  "reason": "Chứng từ không hợp lệ"
}
```

**Xem full API documentation:** [docs/API.md](docs/API.md)

---

## 🌐 Deployment

### Production Setup (Ubuntu + Nginx + Gunicorn)

#### 1️⃣ Cài đặt dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python
sudo apt install python3 python3-pip python3-venv -y

# Install Nginx
sudo apt install nginx -y

# Install Certbot (SSL)
sudo apt install certbot python3-certbot-nginx -y
```

#### 2️⃣ Setup project

```bash
# Tạo user
sudo useradd -m -s /bin/bash museum
sudo su - museum

# Clone project
git clone https://github.com/yourusername/museum-management-system.git
cd museum-management-system

# Setup venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Setup database
python3 backend/init_db.py

# Configure .env
cp .env.example .env
nano .env
```

#### 3️⃣ Gunicorn service

```bash
sudo nano /etc/systemd/system/museum-backend.service
```

**Nội dung:**
```ini
[Unit]
Description=Museum Management System Backend
After=network.target

[Service]
User=museum
Group=museum
WorkingDirectory=/home/museum/museum-management-system
Environment="PATH=/home/museum/museum-management-system/venv/bin"
ExecStart=/home/museum/museum-management-system/venv/bin/gunicorn \
    --workers 4 \
    --bind unix:/home/museum/museum-management-system/museum.sock \
    --access-logfile /home/museum/museum-management-system/logs/access.log \
    --error-logfile /home/museum/museum-management-system/logs/error.log \
    backend.app:app

[Install]
WantedBy=multi-user.target
```

```bash
# Start service
sudo systemctl start museum-backend
sudo systemctl enable museum-backend
sudo systemctl status museum-backend
```

#### 4️⃣ Nginx configuration

```bash
sudo nano /etc/nginx/sites-available/museum
```

**Nội dung:**
```nginx
server {
    listen 80;
    server_name bennharong.servehttp.com;

    location / {
        root /home/museum/museum-management-system/frontend;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        include proxy_params;
        proxy_pass http://unix:/home/museum/museum-management-system/museum.sock;
    }

    location /uploads {
        alias /home/museum/museum-management-system/uploads;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/museum /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5️⃣ SSL Certificate

```bash
sudo certbot --nginx -d bennharong.servehttp.com
```

#### 6️⃣ Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

**Xem chi tiết:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

## 🐛 Troubleshooting

### Database locked error
```bash
# Stop all processes using database
sudo systemctl stop museum-backend

# Backup and check database
cp data/museum_bennharong.db data/museum_bennharong.db.backup
sqlite3 data/museum_bennharong.db "PRAGMA integrity_check;"

# Restart
sudo systemctl start museum-backend
```

### Session not persisting
```bash
# Check session directory permissions
ls -la flask_session/

# Create if not exists
mkdir -p flask_session
chmod 755 flask_session
```

### 500 Internal Server Error
```bash
# Check logs
sudo journalctl -u museum-backend -n 50

# Check error log
tail -f logs/error.log

# Test directly
python3 backend/app.py
```

### Cannot login after deployment
```bash
# Reset admin password
python3 << EOF
from werkzeug.security import generate_password_hash
import sqlite3

conn = sqlite3.connect('data/museum_bennharong.db')
cursor = conn.cursor()

password = generate_password_hash('newpassword123')
cursor.execute("UPDATE USER SET PASSWORD = ? WHERE USERNAME = 'admin'", (password,))

conn.commit()
conn.close()
print("Password reset successfully!")
EOF
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- Python: Follow PEP 8
- JavaScript: Follow Airbnb Style Guide
- SQL: Uppercase keywords, lowercase table/column names

### Testing

```bash
# Run tests
python3 -m pytest tests/

# Run with coverage
python3 -m pytest --cov=backend tests/
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **AhnYanPham** - *Initial work* - Group 11
- Course: IE402 - Database Management System
- University: [Your University Name]

---

## 🙏 Acknowledgments

- **Anthropic Claude** - AI assistance for development
- **ArcGIS** - 3D GIS mapping platform
- **Flask** - Web framework
- **Bảo Tàng Bến Nhà Rồng** - Project inspiration

---

## 📞 Support

- **Email:** support@museum.vn
- **Documentation:** [docs/](docs/)
- **Issues:** [GitHub Issues](https://github.com/yourusername/museum-management-system/issues)

---

## 🗺️ Roadmap

### Version 1.1 (Q2 2026)
- [ ] Online payment gateway integration
- [ ] Mobile responsive improvements
- [ ] Advanced analytics dashboard
- [ ] Email marketing campaigns

### Version 2.0 (Q3 2026)
- [ ] Mobile app (React Native)
- [ ] PostgreSQL migration
- [ ] Redis caching
- [ ] Docker containerization
- [ ] CI/CD pipeline

---

<p align="center">Made with ❤️ by AhnYanPham & Team</p>
<p align="center">⭐ Star this repo if you find it helpful!</p>

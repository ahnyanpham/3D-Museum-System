#!/usr/bin/env python3
"""
Test email sending for Museum Backend
Run: python3 test_email.py
"""

from flask import Flask
from flask_mail import Mail, Message
import sys

app = Flask(__name__)

# Email configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'bennharong11@gmail.com'
app.config['MAIL_PASSWORD'] = 'auja nfqr ddnx xqdl'  # App Password
app.config['MAIL_DEFAULT_SENDER'] = 'bennharong11@gmail.com'

mail = Mail(app)

def test_email():
    """Test sending email to admin"""
    with app.app_context():
        try:
            print("🔄 Đang gửi test email...")
            print(f"   FROM: {app.config['MAIL_USERNAME']}")
            print(f"   TO: cloudking1304@gmail.com")
            print(f"   SERVER: {app.config['MAIL_SERVER']}:{app.config['MAIL_PORT']}")
            
            msg = Message(
                subject='[TEST] Xác nhận chuyển khoản vé tham quan',
                recipients=['cloudking1304@gmail.com']
            )
            
            msg.body = """
========================================
XÁC NHẬN CHUYỂN KHOẢN
BẢO TÀNG HỒ CHÍ MINH - BẾN NHÀ RỒNG
========================================

Mã vé: MT00000999TEST
ID vé: #999

THÔNG TIN KHÁCH HÀNG:
- Họ tên: Test Customer
- Số điện thoại: 0909123456
- Email: N/A

THÔNG TIN VÉ:
- Loại vé: Vé người lớn
- Số lượng: 1
- Tổng tiền: 40,000 VND
- Ngày tham quan: 2026-01-17
- Phương thức thanh toán: Chuyển khoản

THÔNG TIN CHUYỂN KHOẢN:
- Ngân hàng: ACB
- Số tài khoản: 0188123987
- Chủ tài khoản: Nhóm 11 UIT
- Nội dung: MT00000999TEST
- Số tiền: 40,000 VND

Vui lòng kiểm tra và xác nhận giao dịch!

----------------------------------
Hệ thống quản lý Bảo tàng Hồ Chí Minh
Email: bennharong11@gmail.com
========================================
            """
            
            mail.send(msg)
            
            print("✅ EMAIL GỬI THÀNH CÔNG!")
            print("   Check mailbox: cloudking1304@gmail.com")
            print("   Subject: [TEST] Xác nhận chuyển khoản vé tham quan")
            return True
            
        except Exception as e:
            print(f"❌ LỖI GỬI EMAIL: {e}")
            print(f"\nChi tiết lỗi:")
            print(f"  Type: {type(e).__name__}")
            print(f"  Message: {str(e)}")
            
            # Gợi ý fix
            if 'Username and Password' in str(e):
                print("\n💡 GIẢI PHÁP:")
                print("  1. Vào: https://myaccount.google.com/apppasswords")
                print("  2. Tạo App Password mới")
                print("  3. Update line 'MAIL_PASSWORD' trong code")
                
            elif 'Connection refused' in str(e):
                print("\n💡 GIẢI PHÁP:")
                print("  1. Check firewall: telnet smtp.gmail.com 587")
                print("  2. Cho phép port 587 outbound")
                
            elif 'timeout' in str(e).lower():
                print("\n💡 GIẢI PHÁP:")
                print("  1. Server có thể không kết nối được SMTP")
                print("  2. Check network/firewall settings")
            
            return False

if __name__ == '__main__':
    success = test_email()
    sys.exit(0 if success else 1)

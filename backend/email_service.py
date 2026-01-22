"""
Email Service Module
Museum Management System
Uses Flask-Mail (matching existing configuration)
"""

from flask_mail import Message
from datetime import datetime

class EmailService:
    """Handle email sending for password reset and notifications"""
    
    # Will be initialized with Flask Mail instance
    mail = None
    base_url = 'https://bennharong.servehttp.com'
    
    @staticmethod
    def init_app(mail_instance, base_url=None):
        """Initialize with Flask-Mail instance"""
        EmailService.mail = mail_instance
        if base_url:
            EmailService.base_url = base_url
    
    @staticmethod
    def send_email(to_email, subject, html_content, text_content=None):
        """Send email using Flask-Mail"""
        try:
            if not EmailService.mail:
                raise Exception("Email service not initialized. Call init_app() first.")
            
            msg = Message(
                subject=subject,
                recipients=[to_email],
                html=html_content,
                body=text_content
            )
            
            EmailService.mail.send(msg)
            return True, None
            
        except Exception as e:
            return False, f"Lỗi khi gửi email: {str(e)}"
    
    @staticmethod
    def send_password_reset_email(to_email, username, reset_token):
        """Send password reset email"""
        reset_link = f"{EmailService.base_url}/reset-password.html?token={reset_token}"
        
        subject = "Đặt lại mật khẩu - Bảo Tàng Hồ Chí Minh"
        
        # HTML content
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }}
        .container {{
            max-width: 600px;
            margin: 20px auto;
            background-color: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }}
        .header {{
            background: linear-gradient(135deg, #c41e3a 0%, #8b1429 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }}
        .header h1 {{
            margin: 0;
            font-size: 24px;
        }}
        .header p {{
            margin: 10px 0 0 0;
            font-size: 14px;
            opacity: 0.9;
        }}
        .content {{
            padding: 30px 20px;
        }}
        .button {{
            display: inline-block;
            padding: 14px 35px;
            background-color: #c41e3a;
            color: white !important;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
            transition: background-color 0.3s;
        }}
        .button:hover {{
            background-color: #8b1429;
        }}
        .link-box {{
            word-break: break-all;
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #c41e3a;
            font-size: 13px;
            margin: 15px 0;
        }}
        .warning {{
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        .warning ul {{
            margin: 10px 0;
            padding-left: 20px;
        }}
        .footer {{
            background-color: #f8f9fa;
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #dee2e6;
        }}
        .footer p {{
            margin: 5px 0;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏛️ Bảo Tàng Hồ Chí Minh</h1>
            <p>Bến Nhà Rồng - TP. Hồ Chí Minh</p>
        </div>
        <div class="content">
            <h2 style="color: #c41e3a; margin-top: 0;">Đặt lại mật khẩu</h2>
            
            <p>Xin chào <strong>{username}</strong>,</p>
            
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại Bảo Tàng Hồ Chí Minh.</p>
            
            <p>Vui lòng nhấn vào nút bên dưới để đặt lại mật khẩu:</p>
            
            <center>
                <a href="{reset_link}" class="button">Đặt lại mật khẩu</a>
            </center>
            
            <p style="margin-top: 25px;">Hoặc copy link sau vào trình duyệt:</p>
            <div class="link-box">
                {reset_link}
            </div>
            
            <div class="warning">
                <strong>⚠️ Lưu ý quan trọng:</strong>
                <ul>
                    <li>Link này chỉ có hiệu lực trong <strong>1 giờ</strong></li>
                    <li>Link chỉ có thể sử dụng <strong>một lần</strong></li>
                    <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
                    <li>Không chia sẻ link này với bất kỳ ai</li>
                </ul>
            </div>
            
            <p style="margin-top: 20px; color: #666; font-size: 14px;">
                Nếu bạn gặp vấn đề với nút trên, hãy copy và paste link vào trình duyệt của bạn.
            </p>
        </div>
        <div class="footer">
            <p><strong>Bảo Tàng Hồ Chí Minh - Bến Nhà Rồng</strong></p>
            <p>📍 Địa chỉ: 1 Nguyễn Tất Thành, Phường 12, Quận 4, TP. Hồ Chí Minh</p>
            <p>📞 Hotline: (028) 3821 0729</p>
            <p style="margin-top: 15px; font-size: 11px;">
                Email này được gửi tự động, vui lòng không trả lời.<br>
                © {datetime.now().year} Bảo Tàng Hồ Chí Minh. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
        """
        
        # Plain text content
        text_content = f"""
Xin chào {username},

Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại Bảo Tàng Hồ Chí Minh.

Vui lòng truy cập link sau để đặt lại mật khẩu:
{reset_link}

LƯU Ý QUAN TRỌNG:
- Link này chỉ có hiệu lực trong 1 giờ
- Link chỉ có thể sử dụng một lần
- Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này
- Không chia sẻ link này với bất kỳ ai

---
Bảo Tàng Hồ Chí Minh - Bến Nhà Rồng
Địa chỉ: 1 Nguyễn Tất Thành, Phường 12, Quận 4, TP. Hồ Chí Minh
Hotline: (028) 3821 0729
        """
        
        return EmailService.send_email(to_email, subject, html_content, text_content)
    
    @staticmethod
    def send_registration_confirmation(to_email, username, fullname):
        """Send registration confirmation email"""
        subject = "Chào mừng đến với Bảo Tàng Hồ Chí Minh"
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }}
        .container {{
            max-width: 600px;
            margin: 20px auto;
            background-color: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }}
        .header {{
            background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }}
        .header h1 {{
            margin: 0;
            font-size: 24px;
        }}
        .content {{
            padding: 30px 20px;
        }}
        .info-box {{
            background-color: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        .feature-list {{
            list-style: none;
            padding: 0;
        }}
        .feature-list li {{
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }}
        .feature-list li:last-child {{
            border-bottom: none;
        }}
        .button {{
            display: inline-block;
            padding: 14px 35px;
            background-color: #28a745;
            color: white !important;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
        }}
        .footer {{
            background-color: #f8f9fa;
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #dee2e6;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Chào mừng bạn!</h1>
            <p>Đăng ký thành công</p>
        </div>
        <div class="content">
            <p style="font-size: 16px;">Xin chào <strong>{fullname}</strong>,</p>
            
            <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>Bảo Tàng Hồ Chí Minh - Bến Nhà Rồng</strong>!</p>
            
            <div class="info-box">
                <strong>📋 Thông tin tài khoản của bạn:</strong><br><br>
                <strong>Tên đăng nhập:</strong> {username}<br>
                <strong>Email:</strong> {to_email}<br>
                <strong>Họ tên:</strong> {fullname}
            </div>
            
            <h3 style="color: #28a745;">🎫 Quyền lợi của thành viên:</h3>
            <ul class="feature-list">
                <li>🎫 <strong>Mua vé online</strong> - Tiện lợi, nhanh chóng</li>
                <li>📱 <strong>Quản lý vé</strong> - Xem lịch sử và vé hiện tại</li>
                <li>🗺️ <strong>Bản đồ 3D</strong> - Khám phá bảo tàng trước khi đến</li>
                <li>🏛️ <strong>Tham quan ảo</strong> - Trải nghiệm không gian trưng bày</li>
                <li>📸 <strong>Xem sơ đồ</strong> - Lên kế hoạch tham quan</li>
            </ul>
            
            <center>
                <a href="{EmailService.base_url}/" class="button">Khám phá ngay</a>
            </center>
            
            <div style="margin-top: 30px; padding: 15px; background-color: #fff3cd; border-radius: 5px;">
                <strong>💡 Mẹo:</strong> Bạn có thể mua vé trực tuyến và nhận mã QR ngay lập tức. 
                Chỉ cần xuất trình mã QR khi đến bảo tàng!
            </div>
        </div>
        <div class="footer">
            <p><strong>Bảo Tàng Hồ Chí Minh - Bến Nhà Rồng</strong></p>
            <p>📍 1 Nguyễn Tất Thành, Phường 12, Quận 4, TP. Hồ Chí Minh</p>
            <p>📞 Hotline: (028) 3821 0729</p>
            <p>🌐 Website: {EmailService.base_url}</p>
            <p style="margin-top: 15px; font-size: 11px;">
                © {datetime.now().year} Bảo Tàng Hồ Chí Minh. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
        """
        
        text_content = f"""
Xin chào {fullname},

Cảm ơn bạn đã đăng ký tài khoản tại Bảo Tàng Hồ Chí Minh - Bến Nhà Rồng!

THÔNG TIN TÀI KHOẢN:
Tên đăng nhập: {username}
Email: {to_email}
Họ tên: {fullname}

QUYỀN LỢI CỦA THÀNH VIÊN:
- Mua vé online - Tiện lợi, nhanh chóng
- Quản lý vé - Xem lịch sử và vé hiện tại
- Bản đồ 3D - Khám phá bảo tàng trước khi đến
- Tham quan ảo - Trải nghiệm không gian trưng bày
- Xem sơ đồ - Lên kế hoạch tham quan

Truy cập: {EmailService.base_url}

---
Bảo Tàng Hồ Chí Minh - Bến Nhà Rồng
1 Nguyễn Tất Thành, Phường 12, Quận 4, TP. Hồ Chí Minh
Hotline: (028) 3821 0729
        """
        
        return EmailService.send_email(to_email, subject, html_content, text_content)
    
    @staticmethod
    def send_ticket_purchase_confirmation(to_email, fullname, ticket_code, ticket_type, 
                                         quantity, total_price, valid_date):
        """Send ticket purchase confirmation email"""
        subject = f"Xác nhận mua vé thành công - {ticket_code}"
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }}
        .container {{
            max-width: 600px;
            margin: 20px auto;
            background-color: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }}
        .header {{
            background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }}
        .header h1 {{
            margin: 0;
            font-size: 28px;
        }}
        .content {{
            padding: 30px 20px;
        }}
        .ticket-box {{
            background: white;
            border: 3px solid #28a745;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }}
        .ticket-box h3 {{
            margin-top: 0;
            color: #28a745;
            border-bottom: 2px solid #28a745;
            padding-bottom: 10px;
        }}
        .ticket-info {{
            margin: 10px 0;
        }}
        .ticket-info strong {{
            display: inline-block;
            width: 130px;
            color: #555;
        }}
        .price {{
            font-size: 24px;
            color: #28a745;
            font-weight: bold;
        }}
        .button {{
            display: inline-block;
            padding: 14px 35px;
            background-color: #28a745;
            color: white !important;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
        }}
        .instructions {{
            background-color: #e3f2fd;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }}
        .instructions h4 {{
            margin-top: 0;
            color: #1976d2;
        }}
        .instructions ol {{
            margin: 10px 0;
            padding-left: 20px;
        }}
        .instructions li {{
            margin: 8px 0;
        }}
        .note {{
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        .footer {{
            background-color: #f8f9fa;
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #dee2e6;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Đặt vé thành công!</h1>
            <p>Cảm ơn bạn đã tin tưởng</p>
        </div>
        <div class="content">
            <p style="font-size: 16px;">Xin chào <strong>{fullname}</strong>,</p>
            
            <p>Cảm ơn bạn đã mua vé tham quan <strong>Bảo Tàng Hồ Chí Minh - Bến Nhà Rồng</strong>. 
            Đơn hàng của bạn đã được xác nhận thành công!</p>
            
            <div class="ticket-box">
                <h3>🎫 THÔNG TIN VÉ</h3>
                <div class="ticket-info">
                    <strong>Mã vé:</strong> <span style="color: #28a745; font-weight: bold; font-size: 18px;">{ticket_code}</span>
                </div>
                <div class="ticket-info">
                    <strong>Loại vé:</strong> {ticket_type}
                </div>
                <div class="ticket-info">
                    <strong>Số lượng:</strong> {quantity} vé
                </div>
                <div class="ticket-info">
                    <strong>Ngày sử dụng:</strong> {valid_date}
                </div>
                <div class="ticket-info" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                    <strong>Tổng tiền:</strong> <span class="price">{total_price:,.0f} VNĐ</span>
                </div>
            </div>
            
            <div class="instructions">
                <h4>📱 HƯỚNG DẪN SỬ DỤNG VÉ</h4>
                <ol>
                    <li>Đăng nhập vào tài khoản của bạn tại website</li>
                    <li>Vào mục <strong>"Vé của tôi"</strong></li>
                    <li>Nhấn vào vé để xem <strong>mã QR</strong></li>
                    <li>Xuất trình mã QR tại <strong>quầy check-in</strong> khi đến bảo tàng</li>
                </ol>
            </div>
            
            <center>
                <a href="{EmailService.base_url}/tickets.html" class="button">Xem vé của tôi</a>
            </center>
            
            <div class="note">
                <strong>📍 ĐỊA ĐIỂM:</strong><br>
                Bảo Tàng Hồ Chí Minh - Bến Nhà Rồng<br>
                1 Nguyễn Tất Thành, Phường 12, Quận 4, TP. Hồ Chí Minh
                <br><br>
                <strong>🕐 GIỜ MỞ CỬA:</strong><br>
                Thứ 2 - Chủ nhật: 7:30 - 11:30 và 13:30 - 17:00<br>
                (Đóng cửa thứ Hai đầu tháng)
                <br><br>
                <strong>⚠️ LƯU Ý:</strong><br>
                - Vé có hiệu lực theo ngày ghi trên vé<br>
                - Vui lòng đến đúng giờ để được phục vụ tốt nhất<br>
                - Mang theo CMND/CCCD nếu mua vé ưu đãi
            </div>
        </div>
        <div class="footer">
            <p><strong>Bảo Tàng Hồ Chí Minh - Bến Nhà Rồng</strong></p>
            <p>📍 1 Nguyễn Tất Thành, Phường 12, Quận 4, TP. Hồ Chí Minh</p>
            <p>📞 Hotline: (028) 3821 0729 | 🌐 {EmailService.base_url}</p>
            <p style="margin-top: 15px; font-size: 11px;">
                Email xác nhận tự động - Vui lòng không trả lời email này<br>
                © {datetime.now().year} Bảo Tàng Hồ Chí Minh. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
        """
        
        return EmailService.send_email(to_email, subject, html_content)


# Helper function to initialize email service
def init_email_service(app):
    """Initialize email service with Flask app"""
    from flask_mail import Mail
    mail = Mail(app)
    base_url = app.config.get('BASE_URL', 'https://bennharong.servehttp.com')
    EmailService.init_app(mail, base_url)
    return mail

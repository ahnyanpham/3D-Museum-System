"""
Email Service for Online Booking
Add these functions to email_service.py
"""

from flask_mail import Message
from flask import current_app

class EmailService:
    
    @staticmethod
    def send_new_order_notification(order_id, order_code):
        """Send email to admin when new payment proof uploaded"""
        try:
            admin_email = 'ahnyanpham180801@gmail.com'  # Change to your admin email
            
            subject = f'🔔 Đơn hàng mới chờ xác nhận - {order_code}'
            
            body = f"""
============================================
THÔNG BÁO ĐƠN HÀNG MỚI
============================================

Có đơn hàng mới cần xác nhận thanh toán:

Mã đơn hàng: {order_code}
Order ID: #{order_id}
Trạng thái: Chờ xác nhận

Khách hàng đã upload minh chứng chuyển khoản.
Vui lòng kiểm tra và xác nhận đơn hàng.

Link quản lý:
https://bennharong.servehttp.com/admin

============================================
Hệ thống Bảo Tàng Bến Nhà Rồng
============================================
            """
            
            msg = Message(
                subject=subject,
                recipients=[admin_email],
                body=body
            )
            
            mail.send(msg)
            return True, None
            
        except Exception as e:
            return False, str(e)
    
    
    @staticmethod
    def send_order_approved_email(customer_email, customer_name, order_code, quantity, total_price, ticket_ids):
        """Send confirmation email when order is approved"""
        try:
            subject = f'✅ Đơn hàng {order_code} đã được xác nhận'
            
            ticket_list = '\n'.join([f'  - Vé #{tid}' for tid in ticket_ids])
            
            body = f"""
Xin chào {customer_name},

============================================
ĐƠN HÀNG ĐÃ ĐƯỢC XÁC NHẬN
============================================

Mã đơn hàng: {order_code}
Số lượng vé: {quantity}
Tổng tiền: {total_price:,} VND
Trạng thái: Đã thanh toán ✅

CÁC VÉ ĐÃ TẠO:
{ticket_list}

Bạn có thể xem và tải vé tại:
https://bennharong.servehttp.com/tickets.html

Vé của bạn đã có mã QR để check-in tại bảo tàng.

Lưu ý:
- Vui lòng mang theo vé khi đến bảo tàng
- Vé có hiệu lực từ ngày thanh toán
- Liên hệ: 028-1234-5678 nếu cần hỗ trợ

Cảm ơn bạn đã tin tưởng sử dụng dịch vụ!

============================================
Bảo Tàng Hồ Chí Minh - Bến Nhà Rồng
============================================
            """
            
            msg = Message(
                subject=subject,
                recipients=[customer_email],
                body=body
            )
            
            mail.send(msg)
            return True, None
            
        except Exception as e:
            return False, str(e)
    
    
    @staticmethod
    def send_order_rejected_email(customer_email, customer_name, order_code, rejection_reason):
        """Send email when order is rejected"""
        try:
            subject = f'❌ Đơn hàng {order_code} không được xác nhận'
            
            body = f"""
Xin chào {customer_name},

============================================
THÔNG BÁO ĐƠN HÀNG
============================================

Rất tiếc, đơn hàng {order_code} của bạn không được xác nhận.

Lý do: {rejection_reason}

Vui lòng:
1. Kiểm tra lại thông tin chuyển khoản
2. Đảm bảo số tiền và nội dung chuyển khoản chính xác
3. Upload lại minh chứng thanh toán hợp lệ

Hoặc tạo đơn hàng mới nếu cần.

Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ:
- Hotline: 028-1234-5678
- Email: support@bennharong.com

Xin lỗi vì sự bất tiện này!

============================================
Bảo Tàng Hồ Chí Minh - Bến Nhà Rồng
============================================
            """
            
            msg = Message(
                subject=subject,
                recipients=[customer_email],
                body=body
            )
            
            mail.send(msg)
            return True, None
            
        except Exception as e:
            return False, str(e)
    
    
    @staticmethod
    def send_order_created_email(customer_email, customer_name, order_code, total_price, payment_reference, bank_info):
        """Send email with payment instructions when order is created"""
        try:
            subject = f'📝 Đơn hàng {order_code} - Hướng dẫn thanh toán'
            
            body = f"""
Xin chào {customer_name},

============================================
ĐƠN HÀNG ĐÃ TẠO THÀNH CÔNG
============================================

Mã đơn hàng: {order_code}
Tổng tiền: {total_price:,} VND

THÔNG TIN CHUYỂN KHOẢN:
----------------------------------------
Ngân hàng: {bank_info['bank_name']}
Số tài khoản: {bank_info['account_number']}
Tên tài khoản: {bank_info['account_name']}

Số tiền: {total_price:,} VND
Nội dung CK: {payment_reference}

⚠️ LƯU Ý QUAN TRỌNG:
- PHẢI ghi đúng nội dung: {payment_reference}
- Nội dung này dùng để hệ thống xác nhận thanh toán

SAU KHI CHUYỂN KHOẢN:
1. Chụp ảnh màn hình giao dịch thành công
2. Vào trang "Đơn Hàng Của Tôi"
3. Upload ảnh minh chứng
4. Chờ admin xác nhận (5-30 phút)
5. Nhận vé qua email và xem trong "Vé Của Tôi"

Đơn hàng sẽ tự động hủy sau 24 giờ nếu không thanh toán.

Link quản lý đơn hàng:
https://bennharong.servehttp.com/my-orders.html

Hotline hỗ trợ: 028-1234-5678

============================================
Bảo Tàng Hồ Chí Minh - Bến Nhà Rồng
============================================
            """
            
            msg = Message(
                subject=subject,
                recipients=[customer_email],
                body=body
            )
            
            mail.send(msg)
            return True, None
            
        except Exception as e:
            return False, str(e)

import re
from datetime import datetime
from typing import Dict, Any, List

class ValidationError(Exception):
    """Custom validation error"""
    def __init__(self, errors: List[str]):
        self.errors = errors
        super().__init__(str(errors))

class Validator:
    """Base validator class"""
    
    @classmethod
    def validate(cls, data: Dict[str, Any]) -> List[str]:
        """Validate data and return list of errors"""
        raise NotImplementedError

def validate_data(data_type: str, data: Dict[str, Any], is_update: bool = False) -> None:
    """Main validation function"""
    validators = {
        'customer': CustomerValidator,
        'ticket': TicketValidator,
        'ticket_type': TicketTypeValidator,
        'monument': MonumentValidator,
        'attraction': AttractionValidator,
        'visit_history': VisitHistoryValidator
    }
    
    validator_class = validators.get(data_type)
    if not validator_class:
        raise ValueError(f"Unknown data type: {data_type}")
    
    errors = validator_class.validate(data)
    if errors:
        raise ValidationError(errors)

class CustomerValidator(Validator):
    """Validator for Customer data"""
    
    @classmethod
    def validate(cls, data: Dict[str, Any]) -> List[str]:
        errors = []
        
        # Full name validation
        full_name = data.get('full_name', '').strip()
        if not full_name:
            errors.append('Ho va ten khong duoc de trong')
        elif len(full_name) < 2:
            errors.append('Ho va ten phai co it nhat 2 ky tu')
        elif len(full_name) > 100:
            errors.append('Ho va ten khong qua 100 ky tu')
        
        # Phone validation
        phone = data.get('phone', '').strip()
        if phone:
            if not re.match(r'^(0|\+84)[0-9]{9,10}$', phone):
                errors.append('So dien thoai khong hop le')
        
        # Email validation
        email = data.get('email', '').strip()
        if email:
            if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
                errors.append('Email khong hop le')
        
        # Gender validation
        gender = data.get('gender')
        if gender and gender not in ['Nam', 'Nữ', 'Nu', 'Khác', 'Khac']:
            errors.append('Gioi tinh phai la: Nam, Nu, hoac Khac')
        
        return errors

class TicketValidator(Validator):
    """Validator for Ticket data"""
    
    @classmethod
    def validate(cls, data: Dict[str, Any]) -> List[str]:
        errors = []
        
        # Customer ID validation
        customer_id = data.get('customer_id')
        if not customer_id:
            errors.append('Customer ID khong duoc de trong')
        
        # Ticket type ID validation
        ticket_type_id = data.get('ticket_type_id')
        if not ticket_type_id:
            errors.append('Ticket Type ID khong duoc de trong')
        
        # Quantity validation
        quantity = data.get('quantity')
        if not quantity or quantity < 1:
            errors.append('So luong phai lon hon 0')
        elif quantity > 50:
            errors.append('So luong khong vuot qua 50')
        
        # Price validation
        total_price = data.get('total_price')
        if total_price is None or total_price < 0:
            errors.append('Gia tien khong hop le')
        
        # Visit date validation
        visit_date = data.get('visit_date')
        if visit_date:
            try:
                visit_date_obj = datetime.strptime(str(visit_date), '%Y-%m-%d')
                if visit_date_obj.date() < datetime.now().date():
                    errors.append('Ngay tham quan khong the trong qua khu')
            except ValueError:
                errors.append('Dinh dang ngay tham quan khong hop le')
        
        # Payment method validation
        payment_method = data.get('payment_method')
        if payment_method and payment_method not in ['Tien mat', 'Tiền mặt', 'Chuyen khoan', 'Chuyển khoản', 'The', 'Thẻ', 'QR Code']:
            errors.append('Phuong thuc thanh toan khong hop le')
        
        return errors

class TicketTypeValidator(Validator):
    """Validator for Ticket Type data"""
    
    @classmethod
    def validate(cls, data: Dict[str, Any]) -> List[str]:
        errors = []
        
        # Name validation
        name = data.get('name', '').strip()
        if not name:
            errors.append('Ten loai ve khong duoc de trong')
        elif len(name) > 100:
            errors.append('Ten loai ve khong qua 100 ky tu')
        
        # Price validation
        price = data.get('price')
        if price is None:
            errors.append('Gia ve khong duoc de trong')
        elif price < 0:
            errors.append('Gia ve phai lon hon hoac bang 0')
        elif price > 10000000:
            errors.append('Gia ve khong qua 10,000,000 VND')
        
        return errors

class MonumentValidator(Validator):
    """Validator for Monument data"""
    
    @classmethod
    def validate(cls, data: Dict[str, Any]) -> List[str]:
        errors = []
        
        # Name validation
        name = data.get('name', '').strip()
        if not name:
            errors.append('Ten tuong dai khong duoc de trong')
        
        # Coordinates validation
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        
        if latitude is None or not (-90 <= latitude <= 90):
            errors.append('Vi do khong hop le (-90 den 90)')
        
        if longitude is None or not (-180 <= longitude <= 180):
            errors.append('Kinh do khong hop le (-180 den 180)')
        
        # Height validation
        height = data.get('height')
        if height is not None and (height < 0 or height > 1000):
            errors.append('Chieu cao khong hop le (0-1000m)')
        
        # Direction validation
        direction = data.get('direction')
        if direction is not None and (direction < 0 or direction > 360):
            errors.append('Huong khong hop le (0-360 do)')
        
        return errors

class AttractionValidator(Validator):
    """Validator for Attraction data"""
    
    @classmethod
    def validate(cls, data: Dict[str, Any]) -> List[str]:
        errors = []
        
        # Name validation
        name = data.get('name', '').strip()
        if not name:
            errors.append('Ten diem tham quan khong duoc de trong')
        elif len(name) > 200:
            errors.append('Ten diem tham quan khong qua 200 ky tu')
        
        # Floor validation
        floor_number = data.get('floor_number')
        if floor_number is not None and (floor_number < 0 or floor_number > 10):
            errors.append('So tang khong hop le (0-10)')
        
        return errors

class VisitHistoryValidator(Validator):
    """Validator for Visit History data"""
    
    @classmethod
    def validate(cls, data: Dict[str, Any]) -> List[str]:
        errors = []
        
        # Customer ID validation
        customer_id = data.get('customer_id')
        if not customer_id:
            errors.append('Customer ID khong duoc de trong')
        
        # Check-in time validation
        check_in_time = data.get('check_in_time')
        if not check_in_time:
            errors.append('Thoi gian check-in khong duoc de trong')
        
        # Rating validation
        rating = data.get('rating')
        if rating is not None and (rating < 1 or rating > 5):
            errors.append('Danh gia phai tu 1 den 5 sao')
        
        # Check-out validation
        check_out_time = data.get('check_out_time')
        if check_out_time and check_in_time:
            try:
                check_in = datetime.fromisoformat(check_in_time)
                check_out = datetime.fromisoformat(check_out_time)
                
                if check_out <= check_in:
                    errors.append('Thoi gian check-out phai sau check-in')
                
                duration_hours = (check_out - check_in).total_seconds() / 3600
                if duration_hours > 12:
                    errors.append('Thoi gian tham quan khong qua 12 gio')
            except ValueError:
                errors.append('Dinh dang thoi gian khong hop le')
        
        return errors

if __name__ == '__main__':
    # Test validators
    try:
        validate_data('customer', {'full_name': 'Test', 'phone': '0909123456'})
        print("Validation passed")
    except ValidationError as e:
        print(f"Validation errors: {e.errors}")

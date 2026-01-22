// ===== BIẾN TOÀN CỤC =====
let currentLanguage = 'vi'; // 'vi' hoặc 'en'
let currentFloor = 'overview';

// ===== CHUYỂN ĐỔI NGÔN NGỮ =====
function toggleLanguage() {
    currentLanguage = currentLanguage === 'vi' ? 'en' : 'vi';
    
    // Cập nhật nút ngôn ngữ
    const languageBtn = document.getElementById('languageBtn');
    languageBtn.textContent = currentLanguage === 'vi' ? 'English' : 'Tiếng Việt';
    
    // Cập nhật tiêu đề trang
    const pageTitle = document.getElementById('pageTitle');
    if (currentLanguage === 'vi') {
        pageTitle.textContent = 'HỆ THỐNG SƠ ĐỒ THAM QUAN – TRƯNG BÀY';
    } else {
        pageTitle.textContent = 'FLOOR PLAN AND EXHIBITION SYSTEM';
    }
    
    // Cập nhật tất cả nội dung
    updateAllContent();
}

// ===== CẬP NHẬT TẤT CẢ NỘI DUNG =====
function updateAllContent() {
    // Ẩn/hiện tiêu đề section
    const viTitles = document.querySelectorAll('.section-title-vi');
    const enTitles = document.querySelectorAll('.section-title-en');
    
    viTitles.forEach(el => el.style.display = currentLanguage === 'vi' ? 'block' : 'none');
    enTitles.forEach(el => el.style.display = currentLanguage === 'en' ? 'block' : 'none');
    
    // Ẩn/hiện mô tả
    const viDescriptions = document.querySelectorAll('.description-text-vi');
    const enDescriptions = document.querySelectorAll('.description-text-en');
    
    viDescriptions.forEach(el => el.style.display = currentLanguage === 'vi' ? 'block' : 'none');
    enDescriptions.forEach(el => el.style.display = currentLanguage === 'en' ? 'block' : 'none');
    
    // Ẩn/hiện caption hình ảnh
    const viCaptions = document.querySelectorAll('.image-caption-vi');
    const enCaptions = document.querySelectorAll('.image-caption-en');
    
    viCaptions.forEach(el => el.style.display = currentLanguage === 'vi' ? 'block' : 'none');
    enCaptions.forEach(el => el.style.display = currentLanguage === 'en' ? 'block' : 'none');
    
    // Ẩn/hiện text trong tabs
    const viTabTexts = document.querySelectorAll('.tab-text-vi');
    const enTabTexts = document.querySelectorAll('.tab-text-en');
    
    viTabTexts.forEach(el => el.style.display = currentLanguage === 'vi' ? 'inline' : 'none');
    enTabTexts.forEach(el => el.style.display = currentLanguage === 'en' ? 'inline' : 'none');
    
    // Ẩn/hiện text trong links
    const viLinkTexts = document.querySelectorAll('.link-text-vi');
    const enLinkTexts = document.querySelectorAll('.link-text-en');
    
    viLinkTexts.forEach(el => el.style.display = currentLanguage === 'vi' ? 'inline' : 'none');
    enLinkTexts.forEach(el => el.style.display = currentLanguage === 'en' ? 'inline' : 'none');
}

// ===== CHUYỂN ĐỔI TẦNG =====
function showFloor(floorId) {
    // Lưu tầng hiện tại
    currentFloor = floorId;
    
    // Ẩn tất cả các tầng
    const allFloors = document.querySelectorAll('.floor-content');
    allFloors.forEach(floor => {
        floor.style.display = 'none';
    });
    
    // Hiển thị tầng được chọn
    const selectedFloor = document.getElementById(floorId);
    if (selectedFloor) {
        selectedFloor.style.display = 'block';
    }
    
    // Cập nhật trạng thái active cho tabs
    const allTabs = document.querySelectorAll('.floor-tab');
    allTabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    const activeTab = document.querySelector(`[data-floor="${floorId}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // Scroll lên đầu trang
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// ===== KHỞI TẠO KHI TRANG LOAD =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('Floor Plans Page Loaded');
    
    // Hiển thị tầng đầu tiên
    showFloor('overview');
    
    // Cập nhật nội dung theo ngôn ngữ mặc định
    updateAllContent();
});

// ===== XỬ LÝ PHÍM TẮT =====
document.addEventListener('keydown', function(e) {
    // L = chuyển ngôn ngữ
    if (e.key === 'l' || e.key === 'L') {
        toggleLanguage();
    }
    
    // 1, 2, 3, 4 = chuyển tầng
    if (e.key === '1') showFloor('overview');
    if (e.key === '2') showFloor('floor1');
    if (e.key === '3') showFloor('floor2');
    if (e.key === '4') showFloor('floor3');
});

// ===== XỬ LÝ RESIZE =====
window.addEventListener('resize', function() {
    // Có thể thêm logic điều chỉnh layout khi resize
    console.log('Window resized');
});

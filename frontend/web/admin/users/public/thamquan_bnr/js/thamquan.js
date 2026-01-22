// ===== GLOBAL STATE =====
let currentTab = 'VIEW_DRAGON';
let currentFolder = 'VIEW';
let currentImageIndex = 0;
let currentImages = [];
let currentLanguage = 'vi';

// ===== ZOOM & PAN STATE =====
let currentZoom = 1;
let isDragging = false;
let startX = 0;
let startY = 0;
let translateX = 0;
let translateY = 0;

// ===== GALLERY DATA =====
const galleryData = {
    VIEW_DRAGON: {
        VIEW: ['VIEW.png', 'VIEW_1.jpg', 'VIEW_2.jpg'],
        CONG: ['CONG.jpg', 'CONG_1.jpg', 'CONG_2.png'],
        DAI: ['DAI.png'],
        TUONG: ['TUONG.jpg']
    },
    FLOOD_1: {
        HCM_ROOM: ['HCM.png', 'HCM_1.jpg', 'HCM_2.jpg'],
        HCM_HT: ['HCM_HT.png', 'HCM_HT_1.png', 'HCM_HT_2.png', 'HCM_HT_3.png', 'HCM_HT_5.png', 'HCM_HT_6.png', 'HCM_HT_7.png', 'HCM_HT_8.png', 'HCM_HT_9.png', 'HCM_HT_10.png'],
        HCM_MN: ['HCM_MN.png', 'HCM_MN_1.png', 'HCM_MN_2.png', 'HCM_MN_3.png', 'HCM_MN_4.png', 'HCM_MN_5.png', 'HCM_MN_6.png', 'HCM_MN_7.png'],
        TL: ['TL.png', 'TL_1.png', 'TL_2.png', 'TL_3.png'],
        TB_SG1910: ['TB_SG1910.png', 'TB_SG1910_1.png'],
        TB_VNTN: ['TB_VNTN.png', 'TB_VNTN_1.png'],
        TB_OTO: ['TB_OTO.png']
    },
    FLOOD_2: {
        DT: ['DT.png', 'DT_1.png', 'DT_2.png', 'DT_3.png', 'DT_4.png', 'DT_5.png', 'DT_6.png', 'DT_7.png'],
        TB_1: ['TB_1.png', 'TB_1_1.png', 'TB_1_2.png', 'TB_1_3.png', 'TB_1_4.png'],
        TB_2: ['TB_2.png', 'TB_2_1.png', 'TB_2_2.png'],
        TB_3: ['TB_3.png', 'TB_3_1.png', 'TB_3_2.png', 'TB_3_4.png'],
        TB_4: ['TB_4.png', 'TB_4_1.png', 'TB_4_2.png', 'TB_4_3.png'],
        CSDT: ['CSDT.png', 'CSDT_1.jpg', 'CSDT_2.png'],
        HCM_HOC: ['HCM_HOC.png', 'HCM_HOC_1.png', 'HCM_HOC_2.png', 'HCM_HOC_3.jpg', 'HCM_HOC_4.png']
    }
};

// ===== TOGGLE SECTION =====
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    const header = event.target.closest('.section-header');
    const icon = header.querySelector('.toggle-icon');

    // Close all other sections
    document.querySelectorAll('.section-items').forEach(otherSection => {
        if (otherSection.id !== sectionId && !otherSection.classList.contains('collapsed')) {
            otherSection.classList.add('collapsed');
            const otherHeader = otherSection.previousElementSibling;
            const otherIcon = otherHeader.querySelector('.toggle-icon');
            otherIcon.textContent = '▶';
            otherHeader.classList.remove('expanded');
        }
    });

    // Toggle current section
    section.classList.toggle('collapsed');
    header.classList.toggle('expanded');

    if (section.classList.contains('collapsed')) {
        icon.textContent = '▶';
    } else {
        icon.textContent = '▼';
    }
}

// ===== LOAD GALLERY =====
function loadGallery(tab, folder) {
    currentTab = tab;
    currentFolder = folder;
    currentImageIndex = 0;
    currentImages = galleryData[tab][folder];

    // Update active menu item
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.menu-item').classList.add('active');

    loadImage(0);
}

// ===== LOAD IMAGE =====
function loadImage(index) {
    if (index < 0 || index >= currentImages.length) return;

    currentImageIndex = index;
    const imagePath = `${currentTab}/${currentFolder}/${currentImages[index]}`;

    const mainImage = document.getElementById('mainImage');
    mainImage.src = imagePath;
    mainImage.alt = `${currentFolder} - Image ${index + 1}`;

    document.getElementById('imageCounter').textContent = `${currentImageIndex + 1} / ${currentImages.length}`;

    resetZoom();
}

// ===== NEXT/PREVIOUS IMAGE =====
function nextImage() {
    const newIndex = currentImageIndex + 1;
    if (newIndex < currentImages.length) {
        loadImage(newIndex);
    } else {
        loadImage(0);
    }
}

function previousImage() {
    const newIndex = currentImageIndex - 1;
    if (newIndex >= 0) {
        loadImage(newIndex);
    } else {
        loadImage(currentImages.length - 1);
    }
}

// ===== TOGGLE LANGUAGE =====
function toggleLanguage() {
    currentLanguage = currentLanguage === 'vi' ? 'en' : 'vi';

    const btn = document.querySelector('.language-toggle');
    btn.textContent = currentLanguage === 'vi' ? 'ENGLISH' : 'TIẾNG VIỆT';

    document.querySelectorAll('[data-vi][data-en]').forEach(element => {
        const viText = element.getAttribute('data-vi');
        const enText = element.getAttribute('data-en');
        element.textContent = currentLanguage === 'vi' ? viText : enText;
    });

    // Update guide content if open
    updateGuideContent();
}

// ===== TOGGLE INFO PANEL =====
function toggleInfo() {
    const infoPanel = document.getElementById('infoPanel');
    infoPanel.classList.toggle('active');
}

// ===== TOGGLE SIDEBAR =====
function toggleSidebar() {
    const sidebar = document.getElementById('sidebarMenu');
    const icon = document.getElementById('menuIcon');

    sidebar.classList.toggle('collapsed-sidebar');

    if (sidebar.classList.contains('collapsed-sidebar')) {
        icon.textContent = '≡';
    } else {
        icon.textContent = '×';
    }
}

// ===== TOGGLE FULLSCREEN =====
function toggleFullscreen() {
    const imageArea = document.querySelector('.image-area');

    if (!document.fullscreenElement) {
        imageArea.requestFullscreen().catch(err => {
            console.log('Fullscreen error:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

// ===== ZOOM =====
function zoomIn() {
    if (currentZoom < 1.5) {
        currentZoom += 0.1;
        applyZoom();
    }
}

function zoomOut() {
    if (currentZoom > 1) {
        currentZoom -= 0.1;
        applyZoom();
    }

    if (currentZoom === 1) {
        translateX = 0;
        translateY = 0;
    }
}

function applyZoom() {
    const img = document.getElementById('mainImage');
    img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;

    if (currentZoom > 1) {
        img.classList.add('zoomed');
    } else {
        img.classList.remove('zoomed');
    }
}

function resetZoom() {
    currentZoom = 1;
    translateX = 0;
    translateY = 0;
    applyZoom();
}

// ===== PAN (DRAG) =====
const imageArea = document.getElementById('imageArea');
const mainImage = document.getElementById('mainImage');

imageArea.addEventListener('mousedown', function(e) {
    if (currentZoom > 1) {
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
        imageArea.classList.add('dragging');
    }
});

imageArea.addEventListener('mousemove', function(e) {
    if (isDragging) {
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        applyZoom();
    }
});

imageArea.addEventListener('mouseup', function() {
    isDragging = false;
    imageArea.classList.remove('dragging');
});

imageArea.addEventListener('mouseleave', function() {
    isDragging = false;
    imageArea.classList.remove('dragging');
});

imageArea.addEventListener('wheel', function(e) {
    e.preventDefault();
    if (e.deltaY < 0) {
        zoomIn();
    } else {
        zoomOut();
    }
}, { passive: false });

// ===== KEYBOARD NAVIGATION =====
document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft') {
        previousImage();
    } else if (e.key === 'ArrowRight') {
        nextImage();
    } else if (e.key === 'i' || e.key === 'I') {
        toggleInfo();
    } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
    } else if (e.key === '+' || e.key === '=') {
        zoomIn();
    } else if (e.key === '-' || e.key === '_') {
        zoomOut();
    }
});

// ===== SHOW GUIDE =====
function showGuide() {
    updateGuideContent();
    toggleInfo();
}

// ===== UPDATE GUIDE CONTENT =====
function updateGuideContent() {
    const guideContent = document.getElementById('guideContent');
    
    const contentVi = `
<h2>HÀNH TRÌNH KHÁM PHÁ BẢO TÀNG HỒ CHÍ MINH – BẾN NHÀ RỒNG</h2>
<p style="font-style:italic">Trải nghiệm văn hóa – lịch sử đầy cảm xúc tại di tích quốc gia đặc biệt</p>
<p><strong>Địa điểm:</strong> Số 1 Nguyễn Tất Thành, Phường 12, Quận 4, TP. Hồ Chí Minh<br>
<strong>Thời gian tham quan:</strong> 2-3 giờ</p>
<p>Chào mừng quý khách đến với Bảo tàng Hồ Chí Minh – Bến Nhà Rồng! Hôm nay, chúng ta sẽ cùng nhau khám phá nơi ghi dấu sự kiện lịch sử trọng đại ngày 5/6/1911, khi thanh niên yêu nước Nguyễn Tất Thành lên đường tìm đường cứu nước.</p>

<h3>ĐIỂM ĐẾN 1: QUẦY VÉ VÀ KHU VỰC CHECK-IN</h3>
<p>Trước tiên, chúng ta sẽ đến quầy vé để làm thủ tục check-in. Quy trình mua vé tại đây rất nhanh chóng và thuận tiện.</p>
<p><strong>Bảng giá vé:</strong></p>
<table style="width:100%;border-collapse:collapse;margin:10px 0">
<tr style="background:#f0f0f0"><th style="border:1px solid #ddd;padding:8px">Loại vé</th><th style="border:1px solid #ddd;padding:8px">Giá vé</th></tr>
<tr><td style="border:1px solid #ddd;padding:8px">Người cao tuổi</td><td style="border:1px solid #ddd;padding:8px">15.000đ/Vé</td></tr>
<tr><td style="border:1px solid #ddd;padding:8px">Trẻ em</td><td style="border:1px solid #ddd;padding:8px">20.000đ/Vé</td></tr>
<tr><td style="border:1px solid #ddd;padding:8px">Sinh viên</td><td style="border:1px solid #ddd;padding:8px">25.000đ/Vé</td></tr>
<tr><td style="border:1px solid #ddd;padding:8px">Đoàn thể</td><td style="border:1px solid #ddd;padding:8px">30.000đ/Vé</td></tr>
<tr><td style="border:1px solid #ddd;padding:8px">Người lớn</td><td style="border:1px solid #ddd;padding:8px">40.000đ/Vé</td></tr>
</table>
<p><strong>Lưu ý:</strong> Sinh viên xuất trình thẻ sinh viên. Trẻ em dưới 6 tuổi miễn phí. Người cao tuổi trên 60 tuổi ưu đãi. Đoàn từ 20 người giảm giá.</p>
<p><strong>Check-in:</strong> Sau khi mua vé bạn sẽ nhận vé có mã QR, tờ rơi hướng dẫn song ngữ, bản đồ khu vực.</p>

<h3>ĐIỂM ĐẾN 2: CỔNG VÀO BẢO TÀNG</h3>
<img src="VIEW_DRAGON/CONG/CONG.jpg" alt="Cổng vào">
<p>Cổng vào được thiết kế trang trọng với hai trụ cổng màu trắng và biển tên bảo tàng.</p>
<p><strong>Quy định:</strong></p>
<ul>
<li>Không ăn uống trong khu vực trưng bày</li>
<li>Giữ trật tự, không la hét</li>
<li>Cởi mũ khi vào phòng tưởng niệm</li>
<li>Chụp ảnh không dùng flash tại khu vực có biển cấm</li>
</ul>

<h3>ĐIỂM ĐẾN 3: TOÀN CẢNH BẾN NHÀ RỒNG</h3>
<img src="VIEW_DRAGON/VIEW/VIEW.png" alt="Toàn cảnh">
<p>Từ đây, bạn có thể thấy toàn bộ khu di tích với kiến trúc Pháp cổ điển, tháp đồng hồ cao vút, đài phun nước và tượng đài Nguyễn Tất Thành hướng về phía sông Sài Gòn. Dành 5-10 phút tại đây để cảm nhận toàn cảnh và chụp ảnh lưu niệm.</p>

<h3>ĐIỂM ĐẾN 4: ĐÀI PHUN NƯỚC</h3>
<img src="VIEW_DRAGON/DAI/DAI.png" alt="Đài phun nước">
<p>Đài phun nước hình tròn, đường kính 10m, với hệ thống phun nước tạo dòng nước uốn lượn nghệ thuật. Xung quanh có băng ghế đá nghỉ chân. Vào các dịp lễ lớn, đài phun nước được trang trí đèn LED tạo màn trình diễn ánh sáng - nước rất đẹp.</p>

<h3>ĐIỂM ĐẾN 5: TƯỢNG ĐÀI NGUYỄN TẤT THÀNH</h3>
<img src="VIEW_DRAGON/TUONG/TUONG.jpg" alt="Tượng đài">
<p>Tượng đài "Nguyễn Tất Thành ra đi tìm đường cứu nước" cao 4m, đúc bằng đồng. Thanh niên Nguyễn Tất Thành trong bộ đồ tây lịch lãm, tay cầm cặp, ánh mắt kiên định hướng về sông Sài Gòn. Dưới chân tượng khắc: "Nguyễn Tất Thành ra đi tìm đường cứu nước – 05/6/1911"</p>

<h3>ĐIỂM ĐẾN 6: PHÒNG TƯỞNG NIỆM CHỦ TỊCH HỒ CHÍ MINH</h3>
<img src="FLOOD_1/HCM_ROOM/HCM.png" alt="Phòng tưởng niệm">
<p>Không gian trang nghiêm với ánh đèn vàng nhạt, nhạc nền du dương. Chân dung Chủ tịch Hồ Chí Minh đặt ở trung tâm, dưới là bàn thờ tượng trưng với hoa tươi và hương thơm. Tại đây cần giữ im lặng tuyệt đối, cởi mũ, cúi đầu chào.</p>

<h3>ĐIỂM ĐẾN 7: HỒ CHÍ MINH – CUỘC HÀNH TRÌNH CỦA THỜI ĐẠI</h3>
<img src="FLOOD_1/HCM_HT/HCM_HT.png" alt="Hành trình">
<p>Khu vực trưng bày hành trình 30 năm tìm đường cứu nước (1911-1941) với bản đồ tương tác hiển thị đầy đủ hành trình từ Sài Gòn qua Marseille, châu Phi, Mỹ, Pháp, Liên Xô, Trung Quốc và trở về Việt Nam. Hiện vật quý: bản sao hộ chiếu, ảnh làm việc, tác phẩm "Bản án chế độ thực dân Pháp" (1921). Video 10 phút tái hiện hành trình với lời thuyết minh song ngữ.</p>

<h3>ĐIỂM ĐẾN 8: BÁC HỒ VỚI MIỀN NAM, MIỀN NAM VỚI BÁC HỒ</h3>
<img src="FLOOD_1/HCM_MN/HCM_MN.png" alt="Bác Hồ với miền Nam">
<p>Mối quan hệ đặc biệt giữa Chủ tịch Hồ Chí Minh và đồng bào miền Nam qua thư từ, hình ảnh, hiện vật. Bức thư Bác viết: "Đồng bào miền Nam thân yêu, Bác luôn nhớ đến các cháu. Dù núi có cao, sông có sâu, miền Nam miền Bắc vẫn là một nhà..." Hình ảnh kháng chiến, chiến dịch lịch sử, và ảnh xe tăng 390 húc đổ cổng Dinh Độc Lập ngày 30/4/1975.</p>

<h3>ĐIỂM ĐẾN 9: TRIỂN LÃM "ĐI QUA CUỘC CHIẾN"</h3>
<img src="FLOOD_1/TL/TL.png" alt="Triển lãm">
<p>Tái hiện chiến tranh khốc liệt với tông màu tối, ánh sáng dịu. Kháng chiến chống Pháp (1945-1954) với chiến thắng Điện Biên Phủ, mô hình pháo đài. Kháng chiến chống Mỹ (1954-1975) với hình ảnh B-52, quân đội Mỹ và sự anh dũng của ta. Hậu quả chiến tranh: chất độc da cam, bom mìn sót lại. Hệ thống âm thanh chiến trường tạo không gian sống động.</p>

<h3>ĐIỂM ĐẾN 10: SÀI GÒN NHỮNG NĂM 1910</h3>
<img src="FLOOD_1/TB_SG1910/TB_SG1910.png" alt="Sài Gòn 1910">
<p>Tái hiện Sài Gòn đầu thế kỷ 20 với bản đồ cổ chi tiết, mô hình 3D Bến Nhà Rồng có thể xoay, phóng to. Hình ảnh đời sống: chợ búa, phố phường, xe ngựa, cảng biển. Màn hình cảm ứng mô phỏng đời sống Sài Gòn xưa, góc chụp ảnh với trang phục thời 1910.</p>

<h3>ĐIỂM ĐẾN 11: VIỆT NAM – NHỮNG TUYÊN NGÔN ĐỘC LẬP</h3>
<img src="FLOOD_1/TB_VNTN/TB_VNTN.png" alt="Tuyên ngôn">
<p>Bản sao Tuyên ngôn Độc lập 2/9/1945 do Chủ tịch Hồ Chí Minh đọc. Phân tích ý nghĩa lịch sử và giá trị nhân văn. Video cảnh Bác đọc tại Quảng trường Ba Đình. So sánh với Tuyên ngôn Nhân quyền Pháp (1789), Độc lập Mỹ (1776).</p>

<h3>ĐIỂM ĐẾN 12: XE Ô TÔ PEUGEOT 203</h3>
<img src="FLOOD_1/TB_OTO/TB_OTO.png" alt="Xe Peugeot">
<p>Peugeot 203 C sản xuất năm 1954, màu đen, được bảo quản trùng tu tốt. Chiếc xe từng phục vụ Chủ tịch Hồ Chí Minh trong các hoạt động công tác và ngoại giao quan trọng. Xe đặt trên bệ kính, chiếu sáng chuyên nghiệp. Có thể chụp ảnh nhưng không flash và không chạm vào xe.</p>

<h3>ĐIỂM ĐẾN 13: ĐỀN THỜ BÁC HỒ Ở NAM BỘ</h3>
<img src="FLOOD_2/DT/DT.png" alt="Đền thờ">
<p>Lịch sử hình thành tín ngưỡng thờ Bác ở Nam Bộ và ý nghĩa văn hóa - tâm linh. Bản đồ phân bố các đền thờ Bác Hồ trên địa bàn Nam Bộ.</p>

<h3>ĐIỂM ĐẾN 14-17: CÁC PHÒNG TRƯNG BÀY CHUYÊN ĐỀ</h3>
<img src="FLOOD_2/TB_1/TB_1.png" alt="Phòng 1">
<p><strong>Phòng 1:</strong> Giai đoạn 1911-1930 - Hành trình tìm đường cứu nước.</p>
<img src="FLOOD_2/TB_2/TB_2.png" alt="Phòng 2">
<p><strong>Phòng 2:</strong> Hoạt động cách mạng 1930-1945 - Xây dựng Đảng và chuẩn bị tổng khởi nghĩa.</p>
<img src="FLOOD_2/TB_3/TB_3.png" alt="Phòng 3">
<p><strong>Phòng 3:</strong> Tư tưởng và phong cách Hồ Chí Minh.</p>
<img src="FLOOD_2/TB_4/TB_4.png" alt="Phòng 4">
<p><strong>Phòng 4:</strong> Bác Hồ với sự nghiệp giáo dục và đào tạo nhân tài.</p>

<h3>ĐIỂM ĐẾN 18: HÌNH ẢNH CUỘC SỐNG ĐỜI THƯỜNG</h3>
<img src="FLOOD_2/CSDT/CSDT.png" alt="Cuộc sống">
<p>Những khoảnh khắc đời thường gần gũi của Bác: Bác với trẻ em, Bác trong vườn rau, Bác đọc sách, Bác làm việc. Những hình ảnh này cho thấy con người Hồ Chí Minh giản dị, gần gũi, luôn gắn bó với nhân dân.</p>

<h3>ĐIỂM ĐẾN 19: HỒ CHÍ MINH VÀ HỌC TẬP SUỐT ĐỜI</h3>
<img src="FLOOD_2/HCM_HOC/HCM_HOC.png" alt="Học tập">
<p>Tinh thần ham học hỏi không ngừng của Bác. Sách Bác đọc, ngôn ngữ Bác biết (Pháp, Anh, Nga, Trung, Thái...), lời dạy: "Học, học nữa, học mãi", "Học lý luận đi đôi với thực hành".</p>

<h3>KẾT THÚC HÀNH TRÌNH</h3>
<p>Cảm ơn quý khách đã đồng hành trong hành trình khám phá Bảo tàng Hồ Chí Minh – Bến Nhà Rồng.</p>
<p><em>"Không có gì quý hơn độc lập tự do" - Chủ tịch Hồ Chí Minh</em></p>
<p><strong>Liên hệ:</strong></p>
<ul>
<li>📍 Số 1 Nguyễn Tất Thành, P.12, Q.4, TP.HCM</li>
<li>📞 Hotline: (028) 3940 xxxx</li>
<li>📧 Email: info@baotanghcm.vn</li>
<li>🌐 Website: www.baotanghcm.vn</li>
</ul>
<p><strong>Giờ mở cửa:</strong> Thứ 3 – Chủ Nhật: 8:00 – 17:00 (Nghỉ thứ 2)</p>
    `;

    const contentEn = `
<h2>JOURNEY TO EXPLORE HO CHI MINH MUSEUM – NHA RONG WHARF</h2>
<p style="font-style:italic">A cultural-historical experience at a special national heritage site</p>
<p><strong>Location:</strong> No. 1 Nguyen Tat Thanh, Ward 12, District 4, HCMC<br>
<strong>Duration:</strong> 2-3 hours</p>
<p>Welcome to Ho Chi Minh Museum – Nha Rong Wharf! Today we will explore the place that marks the historic event of June 5, 1911, when young patriot Nguyen Tat Thanh departed to seek national salvation.</p>

<h3>DESTINATION 1: TICKET COUNTER & CHECK-IN</h3>
<p>First, we will go to the ticket counter for check-in procedures.</p>
<p><strong>Ticket prices:</strong></p>
<table style="width:100%;border-collapse:collapse;margin:10px 0">
<tr style="background:#f0f0f0"><th style="border:1px solid #ddd;padding:8px">Type</th><th style="border:1px solid #ddd;padding:8px">Price</th></tr>
<tr><td style="border:1px solid #ddd;padding:8px">Elderly</td><td style="border:1px solid #ddd;padding:8px">15,000 VND</td></tr>
<tr><td style="border:1px solid #ddd;padding:8px">Children</td><td style="border:1px solid #ddd;padding:8px">20,000 VND</td></tr>
<tr><td style="border:1px solid #ddd;padding:8px">Students</td><td style="border:1px solid #ddd;padding:8px">25,000 VND</td></tr>
<tr><td style="border:1px solid #ddd;padding:8px">Groups</td><td style="border:1px solid #ddd;padding:8px">30,000 VND</td></tr>
<tr><td style="border:1px solid #ddd;padding:8px">Adults</td><td style="border:1px solid #ddd;padding:8px">40,000 VND</td></tr>
</table>

<h3>DESTINATION 2: MUSEUM ENTRANCE</h3>
<img src="VIEW_DRAGON/CONG/CONG.jpg" alt="Entrance">
<p>Solemn entrance with two white pillars and museum sign.</p>
<p><strong>Regulations:</strong> No eating/drinking, keep order, remove hat in memorial room, no flash photography.</p>

<h3>DESTINATION 3: OVERVIEW</h3>
<img src="VIEW_DRAGON/VIEW/VIEW.png" alt="Overview">
<p>View of entire relic site with classic French architecture, clock tower, fountain, and monument facing Saigon River.</p>

<h3>DESTINATION 4: FOUNTAIN</h3>
<img src="VIEW_DRAGON/DAI/DAI.png" alt="Fountain">
<p>Round fountain (10m diameter) creating artistic water patterns. Stone benches for resting.</p>

<h3>DESTINATION 5: NGUYEN TAT THANH MONUMENT</h3>
<img src="VIEW_DRAGON/TUONG/TUONG.jpg" alt="Monument">
<p>4m bronze monument of young Nguyen Tat Thanh departing for national salvation (June 5, 1911).</p>

<h3>DESTINATION 6: MEMORIAL ROOM</h3>
<img src="FLOOD_1/HCM_ROOM/HCM.png" alt="Memorial">
<p>Solemn space with President Ho Chi Minh's portrait, soft lighting, gentle music. Keep silence, remove hat.</p>

<h3>DESTINATION 7: JOURNEY OF THE ERA</h3>
<img src="FLOOD_1/HCM_HT/HCM_HT.png" alt="Journey">
<p>30-year journey (1911-1941) seeking national salvation. Interactive map, precious artifacts, 10-minute documentary.</p>

<h3>DESTINATION 8: UNCLE HO AND THE SOUTH</h3>
<img src="FLOOD_1/HCM_MN/HCM_MN.png" alt="South">
<p>Special relationship through letters, images, artifacts. Historic campaigns, April 30, 1975 victory.</p>

<h3>DESTINATION 9: THROUGH THE WAR</h3>
<img src="FLOOD_1/TL/TL.png" alt="War">
<p>War exhibition: resistance against France (1945-1954), America (1954-1975), consequences of Agent Orange.</p>

<h3>DESTINATION 10: SAIGON 1910s</h3>
<img src="FLOOD_1/TB_SG1910/TB_SG1910.png" alt="Saigon">
<p>Early 20th century Saigon recreation. Old maps, 3D models, life images, touch screens, photo corners with period costumes.</p>

<h3>DESTINATION 11: DECLARATIONS OF INDEPENDENCE</h3>
<img src="FLOOD_1/TB_VNTN/TB_VNTN.png" alt="Declaration">
<p>Declaration of Independence (Sept 2, 1945). Video of Uncle Ho reading at Ba Dinh Square.</p>

<h3>DESTINATION 12: PEUGEOT 203</h3>
<img src="FLOOD_1/TB_OTO/TB_OTO.png" alt="Peugeot">
<p>1954 Peugeot 203 C that served President Ho Chi Minh. Well preserved on glass platform.</p>

<h3>DESTINATION 13: HO CHI MINH TEMPLES</h3>
<img src="FLOOD_2/DT/DT.png" alt="Temples">
<p>History of Uncle Ho worship in Southern Vietnam. Temple distribution map.</p>

<h3>DESTINATIONS 14-17: THEMATIC ROOMS</h3>
<img src="FLOOD_2/TB_1/TB_1.png" alt="Room 1">
<p><strong>Room 1:</strong> 1911-1930 period.</p>
<img src="FLOOD_2/TB_2/TB_2.png" alt="Room 2">
<p><strong>Room 2:</strong> 1930-1945 revolutionary activities.</p>
<img src="FLOOD_2/TB_3/TB_3.png" alt="Room 3">
<p><strong>Room 3:</strong> Ho Chi Minh's ideology and style.</p>
<img src="FLOOD_2/TB_4/TB_4.png" alt="Room 4">
<p><strong>Room 4:</strong> Education and talent training.</p>

<h3>DESTINATION 18: EVERYDAY LIFE</h3>
<img src="FLOOD_2/CSDT/CSDT.png" alt="Daily life">
<p>Intimate moments: with children, in garden, reading, working. Shows Ho Chi Minh's simple, close-to-people nature.</p>

<h3>DESTINATION 19: LIFELONG LEARNING</h3>
<img src="FLOOD_2/HCM_HOC/HCM_HOC.png" alt="Learning">
<p>Uncle Ho's learning spirit. Books read, languages known (French, English, Russian, Chinese, Thai...). Teaching: "Study, study more, study forever".</p>

<h3>END OF JOURNEY</h3>
<p>Thank you for exploring Ho Chi Minh Museum – Nha Rong Wharf with us.</p>
<p><em>"Nothing is more precious than independence and freedom" - President Ho Chi Minh</em></p>
<p><strong>Contact:</strong></p>
<ul>
<li>📍 No. 1 Nguyen Tat Thanh, Ward 12, Dist. 4, HCMC</li>
<li>📞 Hotline: (028) 3940 xxxx</li>
<li>📧 Email: info@baotanghcm.vn</li>
<li>🌐 Website: www.baotanghcm.vn</li>
</ul>
<p><strong>Hours:</strong> Tue – Sun: 8:00 AM – 5:00 PM (Closed Mon)</p>
    `;

    guideContent.innerHTML = currentLanguage === 'vi' ? contentVi : contentEn;
}

// ===== INIT ON LOAD =====
document.addEventListener('DOMContentLoaded', function() {
    loadGallery('VIEW_DRAGON', 'VIEW');

    const firstSection = document.getElementById('view-dragon');
    const firstHeader = document.querySelector('.section-header');
    const firstIcon = firstHeader.querySelector('.toggle-icon');

    firstSection.classList.remove('collapsed');
    firstHeader.classList.add('expanded');
    firstIcon.textContent = '▼';

    console.log('Museum guide system loaded');
});

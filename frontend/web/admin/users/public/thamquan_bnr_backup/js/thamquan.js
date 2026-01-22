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

// ===== TOGGLE SECTION (EXPAND/COLLAPSE) =====
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    const header = event.target.closest('.section-header');
    const icon = header.querySelector('.toggle-icon');
    
    // Close all other sections first
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
    
    // Update icon
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
    
    // Get images
    currentImages = galleryData[tab][folder];
    
    // Update active menu item
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.menu-item').classList.add('active');
    
    // Load first image
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
    
    // Update counter
    document.getElementById('imageCounter').textContent = 
        `${currentImageIndex + 1} / ${currentImages.length}`;
    
    // Reset zoom when changing image
    resetZoom();
}

// ===== NEXT/PREVIOUS IMAGE =====
function nextImage() {
    const newIndex = currentImageIndex + 1;
    if (newIndex < currentImages.length) {
        loadImage(newIndex);
    } else {
        loadImage(0); // Loop to first
    }
}

function previousImage() {
    const newIndex = currentImageIndex - 1;
    if (newIndex >= 0) {
        loadImage(newIndex);
    } else {
        loadImage(currentImages.length - 1); // Loop to last
    }
}

// ===== TOGGLE LANGUAGE =====
function toggleLanguage() {
    currentLanguage = currentLanguage === 'vi' ? 'en' : 'vi';
    
    // Update button
    const btn = document.querySelector('.language-toggle');
    btn.textContent = currentLanguage === 'vi' ? 'ENGLISH' : 'TIẾNG VIỆT';
    
    // Update all data-vi/data-en elements
    document.querySelectorAll('[data-vi][data-en]').forEach(element => {
        const viText = element.getAttribute('data-vi');
        const enText = element.getAttribute('data-en');
        element.textContent = currentLanguage === 'vi' ? viText : enText;
    });
    
    // Toggle info text
    const infoVi = document.querySelector('.info-vi');
    const infoEn = document.querySelector('.info-en');
    if (infoVi && infoEn) {
        if (currentLanguage === 'vi') {
            infoVi.style.display = 'block';
            infoEn.style.display = 'none';
        } else {
            infoVi.style.display = 'none';
            infoEn.style.display = 'block';
        }
    }
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

// ===== ZOOM IN/OUT =====
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
    
    // Reset position when zoom to 100%
    if (currentZoom === 1) {
        translateX = 0;
        translateY = 0;
    }
}

function applyZoom() {
    const img = document.getElementById('mainImage');
    img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
    
    // Add/remove zoomed class
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

// ===== PAN (DRAG) FUNCTIONALITY =====
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

// Mouse wheel zoom
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

// ===== INIT ON LOAD =====
document.addEventListener('DOMContentLoaded', function() {
    // Load default gallery
    loadGallery('VIEW_DRAGON', 'VIEW');
    
    // Expand first section by default
    const firstSection = document.getElementById('view-dragon');
    const firstHeader = document.querySelector('.section-header');
    const firstIcon = firstHeader.querySelector('.toggle-icon');
    
    firstSection.classList.remove('collapsed');
    firstHeader.classList.add('expanded');
    firstIcon.textContent = '▼';
    
    console.log('Tham quan v4 loaded');
});


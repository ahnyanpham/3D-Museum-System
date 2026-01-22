// ===== LANGUAGE STATE =====
let currentLanguage = 'vi';

// ===== TOGGLE LANGUAGE =====
function toggleLanguage() {
    currentLanguage = currentLanguage === 'vi' ? 'en' : 'vi';
    
    // Update button
    const btn = document.querySelector('.language-toggle');
    btn.textContent = currentLanguage === 'vi' ? 'ENGLISH' : 'TIẾNG VIỆT';
    
    // Update all elements with data-vi and data-en
    document.querySelectorAll('[data-vi][data-en]').forEach(element => {
        const viText = element.getAttribute('data-vi');
        const enText = element.getAttribute('data-en');
        element.textContent = currentLanguage === 'vi' ? viText : enText;
    });
    
    console.log('Language switched to:', currentLanguage);
}

// ===== SMOOTH SCROLL FOR NAVIGATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Log page loaded
    console.log('Hướng dẫn tham quan page loaded');
});


// ===== UTILITY FUNCTIONS =====
function showLoading() {
    document.getElementById('loading').classList.add('active');
}

function hideLoading() {
    document.getElementById('loading').classList.remove('active');
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.background = type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#fff';
    toast.style.color = type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#333';
    toast.classList.add('active');
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
}

// ===== NAVIGATION SYSTEM =====
function setupNavigation() {
    const sidebarItems = document.querySelectorAll('.sidebar-item[data-page]');
    const pages = document.querySelectorAll('.page');

    console.log('Setting up navigation...');
    console.log('Found', sidebarItems.length, 'sidebar items');
    console.log('Found', pages.length, 'pages');

    sidebarItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            const targetPage = this.getAttribute('data-page');
            console.log('Navigation clicked:', targetPage);

            // Remove active from all sidebar items
            sidebarItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            // Hide all pages
            pages.forEach(page => page.classList.remove('active'));

            // Show target page
            const targetPageElement = document.getElementById(targetPage + '-page');
            if (targetPageElement) {
                targetPageElement.classList.add('active');
                console.log('✓ Page shown:', targetPage);
            } else {
                console.error('✗ Page not found:', targetPage + '-page');
            }

            // Initialize page manager if exists
            const managerName = targetPage.charAt(0).toUpperCase() + targetPage.slice(1) + 'Manager';
            const pageManager = window[managerName];
            
            if (pageManager && typeof pageManager.init === 'function') {
                console.log('Initializing', managerName);
                pageManager.init();
            }

            // Close sidebar after navigation
            if (typeof toggleSidebar === 'function') {
                toggleSidebar();
            }
        });
    });

    console.log('✓ Navigation setup complete');
}

// ===== CLOSE SIDEBAR ON ESC KEY =====
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        const hamburger = document.getElementById('hamburgerBtn');

        if (sidebar && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
            if (overlay) overlay.classList.remove('active');
            if (hamburger) hamburger.classList.remove('active');
        }
    }
});

// ===== INITIALIZE APP =====
document.addEventListener('DOMContentLoaded', async () => {
    console.log('===== Museum System Initializing =====');

    // Setup navigation first
    setupNavigation();

    // Initialize all managers
    try {
        if (typeof DashboardManager !== 'undefined') {
            console.log('Initializing Dashboard...');
            await DashboardManager.init();
        }
        
        if (typeof TicketManager !== 'undefined') {
            console.log('Initializing Tickets...');
            await TicketManager.init();
        }
        
        if (typeof CustomerManager !== 'undefined') {
            console.log('Initializing Customers...');
            await CustomerManager.init();
        }
        
        if (typeof CheckinManager !== 'undefined') {
            console.log('Initializing Checkin...');
            await CheckinManager.init();
        }
        
        if (typeof CheckoutManager !== 'undefined') {
            console.log('Initializing Checkout...');
            await CheckoutManager.init();
        }
        
        if (typeof HistoryManager !== 'undefined') {
            console.log('Initializing History...');
            await HistoryManager.init();
        }
        
        if (typeof MapManager !== 'undefined') {
            console.log('Initializing Map...');
            await MapManager.init();
        }

        console.log('===== Museum System Ready! =====');
    } catch (error) {
        console.error('Error initializing managers:', error);
    }
});

console.log('App.js loaded successfully');

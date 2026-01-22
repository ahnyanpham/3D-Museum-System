// ==========================================
// CHECKIN.JS - FIXED VERSION WITH API_URL
// ==========================================

// Define API_URL if not already defined
const API_URL = window.API_URL || '/api';

const CheckinManager = {
    customers: [],
    currentPage: 1,
    itemsPerPage: 10,
    searchTerm: '',
    
    async init() {
        console.log('Checkin Manager initialized');
        this.setupEventListeners();
        await this.loadAvailableCheckin();
    },
    
    setupEventListeners() {
        // Check-in by code input
        const checkinBtn = document.getElementById('checkin-btn');
        const ticketCodeInput = document.getElementById('checkin-ticket-code');
        const reloadBtn = document.getElementById('reload-checkin');
        
        if (checkinBtn) {
            checkinBtn.addEventListener('click', () => this.performCheckin());
        }
        
        if (ticketCodeInput) {
            ticketCodeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performCheckin();
                }
            });
        }
        
        if (reloadBtn) {
            reloadBtn.addEventListener('click', () => this.loadAvailableCheckin());
        }
        
        // Search functionality
        const searchInput = document.getElementById('search-checkin');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.trim().toLowerCase();
                this.renderCustomerList();
            });
        }
    },
    
    async performCheckin() {
        const ticketCodeInput = document.getElementById('checkin-ticket-code');
        const resultDiv = document.getElementById('checkin-result');
        
        if (!ticketCodeInput || !resultDiv) return;
        
        const ticketCode = ticketCodeInput.value.trim();
        
        if (!ticketCode) {
            showToast('Vui lòng nhập mã vé', 'warning');
            return;
        }
        
        if (!confirm(`Xác nhận check-in vé ${ticketCode}?`)) {
            return;
        }
        
        showLoading();
        resultDiv.innerHTML = '';
        
        try {
            // ✅ FIXED: Gọi đúng API endpoint
            const response = await fetch(`${API_URL}/checkin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    ticket_code: ticketCode
                })
            });
            
            const data = await response.json();
            hideLoading();
            
            if (data.success) {
                resultDiv.innerHTML = `
                    <div style="padding:15px;background:#d4edda;border-radius:8px;border-left:4px solid #28a745">
                        <strong>✅ Check-in thành công!</strong><br>
                        Khách hàng: ${data.data.customer_name || 'N/A'}<br>
                        Loại vé: ${data.data.ticket_type || 'N/A'}<br>
                        Giờ check-in: ${this.formatDateTime(data.data.check_in_time)}
                    </div>
                `;
                showToast('Check-in thành công!', 'success');
                ticketCodeInput.value = '';
                
                // Reload list
                await this.loadAvailableCheckin();
                
                setTimeout(() => {
                    resultDiv.innerHTML = '';
                }, 5000);
            } else {
                throw new Error(data.message || 'Lỗi check-in');
            }
        } catch (error) {
            hideLoading();
            resultDiv.innerHTML = `
                <div style="padding:15px;background:#f8d7da;border-radius:8px;border-left:4px solid #dc3545">
                    <strong>❌ Lỗi!</strong><br>${error.message || 'Không thể check-in'}
                </div>
            `;
            showToast('Lỗi check-in: ' + error.message, 'error');
        }
    },
    
    async loadAvailableCheckin() {
        showLoading();
        try {
            // ✅ FIXED: Gọi API lấy danh sách vé chờ check-in (nhóm theo customer)
            const response = await fetch(`${API_URL}/checkin/available`, {
                credentials: 'include'
            });
            
            const data = await response.json();
            hideLoading();
            
            if (data.success) {
                this.customers = data.data || [];
                console.log('Loaded customers for check-in:', this.customers.length);
                this.currentPage = 1;
                this.renderCustomerList();
            } else {
                throw new Error(data.message || 'Lỗi tải danh sách');
            }
        } catch (error) {
            hideLoading();
            console.error('Error loading checkin list:', error);
            showToast('Lỗi tải danh sách: ' + error.message, 'error');
        }
    },
    
    renderCustomerList() {
        const container = document.getElementById('active-tickets-list');
        if (!container) return;
        
        // Filter by search term
        let filteredCustomers = this.customers;
        if (this.searchTerm) {
            filteredCustomers = this.customers.filter(c => 
                c.customer_name.toLowerCase().includes(this.searchTerm) ||
                (c.customer_phone && c.customer_phone.includes(this.searchTerm)) ||
                c.ticket_codes.toLowerCase().includes(this.searchTerm)
            );
        }
        
        if (filteredCustomers.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:60px;color:#999">
                    <i class="fas fa-ticket-alt" style="font-size:64px;opacity:0.3"></i>
                    <p style="margin-top:20px;font-size:18px">
                        ${this.searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có vé nào chờ check-in'}
                    </p>
                </div>
            `;
            return;
        }
        
        // Pagination
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageCustomers = filteredCustomers.slice(start, end);
        
        // Items per page selector
        let html = `
            <div style="margin-bottom:15px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
                <label style="font-weight:500">Hiển thị:</label>
                <select id="items-per-page-checkin" style="padding:8px;border:1px solid #ddd;border-radius:6px">
                    <option value="10"${this.itemsPerPage === 10 ? ' selected' : ''}>10</option>
                    <option value="30"${this.itemsPerPage === 30 ? ' selected' : ''}>30</option>
                    <option value="50"${this.itemsPerPage === 50 ? ' selected' : ''}>50</option>
                    <option value="100"${this.itemsPerPage === 100 ? ' selected' : ''}>100</option>
                </select>
                <span style="color:#666;margin-left:auto">
                    Tổng: ${filteredCustomers.length} khách hàng
                    (${this.customers.reduce((sum, c) => sum + c.ticket_count, 0)} vé)
                </span>
            </div>
        `;
        
        // Customer cards
        html += '<div class="customer-cards-container">';
        
        pageCustomers.forEach(customer => {
            const ticketCodes = customer.ticket_codes.split(', ');
            
            html += `
                <div class="customer-card" style="background:white;border-radius:12px;padding:20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
                    <div class="customer-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;padding-bottom:15px;border-bottom:2px solid #e2e8f0">
                        <div>
                            <h4 style="margin:0;color:#2d3748;font-size:18px">${customer.customer_name}</h4>
                            <p style="margin:5px 0;color:#718096;font-size:14px">
                                <i class="fas fa-phone"></i> ${customer.customer_phone || 'N/A'}
                            </p>
                        </div>
                        <span style="background:#667eea;color:white;padding:8px 16px;border-radius:12px;font-weight:600;font-size:14px">
                            ${customer.ticket_count} vé (${customer.total_quantity} người)
                        </span>
                    </div>
                    
                    <div style="margin:15px 0;padding:12px;background:#f7fafc;border-radius:8px">
                        <p style="margin:5px 0;color:#4a5568"><strong>Ngày tham quan:</strong> ${this.formatDate(customer.valid_date)}</p>
                    </div>
                    
                    <div style="display:grid;gap:10px;margin-top:15px">
            `;
            
            ticketCodes.forEach(code => {
                html += `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:#f7fafc;border-radius:8px;border-left:4px solid #667eea">
                        <span style="font-weight:600;font-family:monospace;color:#2d3748;font-size:15px">${code}</span>
                        <button onclick="CheckinManager.checkInTicket('${code}')" 
                                class="btn btn-primary btn-sm"
                                style="padding:8px 16px;font-size:14px">
                            <i class="fas fa-check"></i> Check-in
                        </button>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        html += '<div id="checkin-pagination" style="margin-top:20px"></div>';
        
        container.innerHTML = html;
        
        // Items per page change event
        const selectElement = document.getElementById('items-per-page-checkin');
        if (selectElement) {
            selectElement.addEventListener('change', (e) => {
                this.itemsPerPage = parseInt(e.target.value);
                this.currentPage = 1;
                this.renderCustomerList();
            });
        }
        
        this.renderPagination(filteredCustomers.length);
    },
    
    renderPagination(totalItems) {
        const container = document.getElementById('checkin-pagination');
        if (!container) return;
        
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }
        
        let html = '<div style="display:flex;gap:5px;justify-content:center;flex-wrap:wrap">';
        
        if (this.currentPage > 1) {
            html += `<button onclick="CheckinManager.goToPage(${this.currentPage - 1})" class="btn btn-sm">Trước</button>`;
        }
        
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                const activeClass = i === this.currentPage ? 'btn-primary' : 'btn-secondary';
                html += `<button onclick="CheckinManager.goToPage(${i})" class="btn btn-sm ${activeClass}">${i}</button>`;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                html += '<span style="padding:0 5px">...</span>';
            }
        }
        
        if (this.currentPage < totalPages) {
            html += `<button onclick="CheckinManager.goToPage(${this.currentPage + 1})" class="btn btn-sm">Sau</button>`;
        }
        
        html += '</div>';
        container.innerHTML = html;
    },
    
    goToPage(page) {
        this.currentPage = page;
        this.renderCustomerList();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    
    async checkInTicket(ticketCode) {
        const ticketCodeInput = document.getElementById('checkin-ticket-code');
        if (ticketCodeInput) {
            ticketCodeInput.value = ticketCode;
        }
        await this.performCheckin();
    },
    
    // Helper methods
    formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN');
    },
    
    formatDateTime(dateTimeStr) {
        if (!dateTimeStr) return 'N/A';
        const date = new Date(dateTimeStr);
        return date.toLocaleString('vi-VN');
    }
};

console.log('Checkin module loaded');

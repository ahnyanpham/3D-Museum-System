const CheckinManager = {
    activeTickets: [],
    currentPage: 1,
    itemsPerPage: 10,
    
    async init() {
        console.log('Checkin Manager initialized');
        this.setupEventListeners();
        await this.loadActiveTickets();
    },
    
    setupEventListeners() {
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
            reloadBtn.addEventListener('click', () => this.loadActiveTickets());
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
        
        showLoading();
        resultDiv.innerHTML = '';
        
        try {
            const response = await API.checkinTicket(ticketCode);
            hideLoading();
            
            if (response.success) {
                resultDiv.innerHTML = '<div style="padding:15px;background:#d4edda;border-radius:8px;border-left:4px solid #28a745"><strong>Check-in thành công!</strong><br>Khách hàng: ' + (response.data.customer_name || 'N/A') + '<br>Loại vé: ' + (response.data.ticket_type || 'N/A') + '</div>';
                showToast('Check-in thành công!', 'success');
                ticketCodeInput.value = '';
                await this.loadActiveTickets();
                
                setTimeout(() => {
                    resultDiv.innerHTML = '';
                }, 5000);
            }
        } catch (error) {
            hideLoading();
            resultDiv.innerHTML = '<div style="padding:15px;background:#f8d7da;border-radius:8px;border-left:4px solid #dc3545"><strong>Lỗi!</strong><br>' + (error.message || 'Không thể check-in') + '</div>';
            showToast('Lỗi check-in', 'error');
        }
    },
    
    async loadActiveTickets() {
        try {
            const response = await API.getTickets({ status: 'active' });
            if (response.success) {
                this.activeTickets = response.data || [];
                this.currentPage = 1;
                this.renderActiveTickets();
            }
        } catch (error) {
            console.error('Error loading active tickets:', error);
        }
    },
    
    renderActiveTickets() {
        const container = document.getElementById('active-tickets-list');
        if (!container) return;
        
        if (this.activeTickets.length === 0) {
            container.innerHTML = '<p style="text-align:center;padding:40px;color:#999">Chưa có vé hoạt động</p>';
            return;
        }
        
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageTickets = this.activeTickets.slice(start, end);
        
        let html = '<div style="margin-bottom:15px;display:flex;gap:10px;align-items:center">';
        html += '<label style="font-weight:500">Hiển thị:</label>';
        html += '<select id="items-per-page-checkin" style="padding:8px;border:1px solid #ddd;border-radius:6px">';
        html += '<option value="10"' + (this.itemsPerPage === 10 ? ' selected' : '') + '>10</option>';
        html += '<option value="30"' + (this.itemsPerPage === 30 ? ' selected' : '') + '>30</option>';
        html += '<option value="50"' + (this.itemsPerPage === 50 ? ' selected' : '') + '>50</option>';
        html += '<option value="100"' + (this.itemsPerPage === 100 ? ' selected' : '') + '>100</option>';
        html += '</select>';
        html += '<span style="color:#666;margin-left:auto">Tổng: ' + this.activeTickets.length + ' vé</span>';
        html += '</div>';
        
        html += '<div class="data-table-container"><table class="data-table"><thead><tr>';
        html += '<th>Mã vé</th><th>Khách hàng</th><th>SĐT</th><th>Loại vé</th><th>Ngày tham quan</th><th>Thao tác</th>';
        html += '</tr></thead><tbody>';
        
        pageTickets.forEach(ticket => {
            html += '<tr>';
            html += '<td><strong>' + ticket.ticket_code + '</strong></td>';
            html += '<td>' + ticket.full_name + '</td>';
            html += '<td>' + (ticket.phone || 'N/A') + '</td>';
            html += '<td>' + ticket.ticket_type_name + '</td>';
            html += '<td>' + formatDate(ticket.visit_date) + '</td>';
            html += '<td><button onclick="CheckinManager.quickCheckin(\'' + ticket.ticket_code + '\')" class="btn btn-sm btn-primary">Check-in</button></td>';
            html += '</tr>';
        });
        
        html += '</tbody></table></div>';
        html += '<div id="checkin-pagination" style="margin-top:15px"></div>';
        
        container.innerHTML = html;
        
        const selectElement = document.getElementById('items-per-page-checkin');
        if (selectElement) {
            selectElement.addEventListener('change', (e) => {
                this.itemsPerPage = parseInt(e.target.value);
                this.currentPage = 1;
                this.renderActiveTickets();
            });
        }
        
        this.renderPagination();
    },
    
    renderPagination() {
        const container = document.getElementById('checkin-pagination');
        if (!container) return;
        
        const totalPages = Math.ceil(this.activeTickets.length / this.itemsPerPage);
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }
        
        let html = '<div style="display:flex;gap:5px;justify-content:center">';
        
        if (this.currentPage > 1) {
            html += '<button onclick="CheckinManager.goToPage(' + (this.currentPage - 1) + ')" class="btn btn-sm">Trước</button>';
        }
        
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                const activeClass = i === this.currentPage ? 'btn-primary' : 'btn-secondary';
                html += '<button onclick="CheckinManager.goToPage(' + i + ')" class="btn btn-sm ' + activeClass + '">' + i + '</button>';
            }
        }
        
        if (this.currentPage < totalPages) {
            html += '<button onclick="CheckinManager.goToPage(' + (this.currentPage + 1) + ')" class="btn btn-sm">Sau</button>';
        }
        
        html += '</div>';
        container.innerHTML = html;
    },
    
    goToPage(page) {
        this.currentPage = page;
        this.renderActiveTickets();
    },
    
    async quickCheckin(ticketCode) {
        const ticketCodeInput = document.getElementById('checkin-ticket-code');
        if (ticketCodeInput) {
            ticketCodeInput.value = ticketCode;
        }
        await this.performCheckin();
    }
};

console.log('Checkin module loaded');

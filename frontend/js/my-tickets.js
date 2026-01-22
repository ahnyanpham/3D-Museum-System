// ==========================================
// MY-TICKETS.JS - USER TICKETS PAGE
// ==========================================

// Define API_URL
const API_URL = window.API_URL || '/api';

const MyTicketsManager = {
    tickets: [],
    currentFilter: 'all',
    
    async init() {
        console.log('My Tickets Manager initialized');
        this.setupEventListeners();
        await this.loadTickets();
    },
    
    setupEventListeners() {
        // Filter buttons
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.setFilter(filter);
            });
        });
        
        // Refresh button
        const refreshBtn = document.getElementById('refresh-tickets');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadTickets());
        }
    },
    
    async loadTickets() {
        showLoading();
        try {
            // ✅ FIXED: Correct API call without ticket_id
            const response = await fetch(`${API_URL}/customer/tickets`, {
                credentials: 'include'
            });
            
            const data = await response.json();
            hideLoading();
            
            if (data.success) {
                this.tickets = data.data || [];
                console.log('Loaded tickets:', this.tickets.length);
                this.renderTickets();
            } else {
                throw new Error(data.message || 'Lỗi tải vé');
            }
        } catch (error) {
            hideLoading();
            console.error('Load tickets error:', error);
            showToast('Lỗi tải danh sách vé: ' + error.message, 'error');
        }
    },
    
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });
        
        this.renderTickets();
    },
    
    renderTickets() {
        const container = document.getElementById('my-tickets-list');
        if (!container) return;
        
        // Filter tickets
        let filteredTickets = this.tickets;
        if (this.currentFilter !== 'all') {
            filteredTickets = this.tickets.filter(t => t.status === this.currentFilter);
        }
        
        if (filteredTickets.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:60px;color:#999">
                    <i class="fas fa-ticket-alt" style="font-size:64px;opacity:0.3"></i>
                    <p style="margin-top:20px;font-size:18px">
                        ${this.currentFilter === 'all' ? 'Bạn chưa có vé nào' : 'Không có vé ' + this.getStatusLabel(this.currentFilter)}
                    </p>
                </div>
            `;
            return;
        }
        
        // Render ticket cards
        container.innerHTML = filteredTickets.map(ticket => {
            const statusColors = {
                'valid': '#28a745',
                'used': '#6c757d',
                'cancelled': '#dc3545',
                'pending': '#ffc107'
            };
            
            const statusLabels = {
                'valid': 'Còn hạn',
                'used': 'Đã sử dụng',
                'cancelled': 'Đã hủy',
                'pending': 'Chờ thanh toán'
            };
            
            return `
                <div class="ticket-card" style="background:white;border-radius:12px;padding:20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.1);transition:transform 0.2s">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;padding-bottom:15px;border-bottom:2px solid #e2e8f0">
                        <h4 style="margin:0;font-family:monospace;color:#2d3748;font-size:18px">${ticket.ticket_code}</h4>
                        <span style="background:${statusColors[ticket.status] || '#6c757d'};color:white;padding:6px 12px;border-radius:12px;font-size:14px;font-weight:600">
                            ${statusLabels[ticket.status] || ticket.status}
                        </span>
                    </div>
                    
                    <div style="display:grid;gap:10px;margin-bottom:15px">
                        <p style="margin:0;color:#4a5568;display:flex;align-items:center">
                            <i class="fas fa-ticket-alt" style="width:20px;color:#667eea"></i>
                            <strong style="width:120px">Loại vé:</strong> ${ticket.ticket_type_name}
                        </p>
                        <p style="margin:0;color:#4a5568;display:flex;align-items:center">
                            <i class="fas fa-users" style="width:20px;color:#667eea"></i>
                            <strong style="width:120px">Số lượng:</strong> ${ticket.quantity} người
                        </p>
                        <p style="margin:0;color:#4a5568;display:flex;align-items:center">
                            <i class="fas fa-calendar" style="width:20px;color:#667eea"></i>
                            <strong style="width:120px">Ngày:</strong> ${this.formatDate(ticket.valid_date)}
                        </p>
                        <p style="margin:0;color:#4a5568;display:flex;align-items:center">
                            <i class="fas fa-money-bill-wave" style="width:20px;color:#667eea"></i>
                            <strong style="width:120px">Tổng tiền:</strong> ${this.formatCurrency((ticket.price || 0) * (ticket.quantity || 1))}
                        </p>
                        ${ticket.payment_method ? `
                            <p style="margin:0;color:#4a5568;display:flex;align-items:center">
                                <i class="fas fa-credit-card" style="width:20px;color:#667eea"></i>
                                <strong style="width:120px">Thanh toán:</strong> ${this.getPaymentLabel(ticket.payment_method)}
                            </p>
                        ` : ''}
                    </div>
                    
                    <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
                        ${ticket.status === 'valid' ? `
                            <button onclick="MyTicketsManager.viewQR('${ticket.ticket_code}')" 
                                    class="btn btn-primary btn-sm"
                                    style="padding:8px 16px">
                                <i class="fas fa-qrcode"></i> Xem QR
                            </button>
                        ` : ''}
                        ${ticket.ticket_id ? `
                            <button onclick="MyTicketsManager.viewDetails(${ticket.ticket_id})" 
                                    class="btn btn-secondary btn-sm"
                                    style="padding:8px 16px">
                                <i class="fas fa-info-circle"></i> Chi tiết
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        // Add hover effect
        const cards = document.querySelectorAll('.ticket-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-2px)';
                card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            });
        });
    },
    
    viewQR(ticketCode) {
        // Show QR modal
        const modal = document.getElementById('qr-modal');
        const modalBody = document.getElementById('qr-modal-body');
        
        if (!modal || !modalBody) {
            console.error('QR modal not found!');
            return;
        }
        
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(ticketCode)}`;
        
        modalBody.innerHTML = `
            <div style="text-align:center;padding:20px">
                <h3 style="color:#2d3748;margin-bottom:20px">Mã QR Vé</h3>
                <div style="background:#f7fafc;padding:20px;border-radius:12px;display:inline-block">
                    <img src="${qrUrl}" 
                         alt="QR Code" 
                         style="max-width:300px;border-radius:8px"
                         crossorigin="anonymous">
                </div>
                <p style="margin:20px 0;color:#4a5568;font-weight:600;font-family:monospace">${ticketCode}</p>
                <p style="color:#718096;margin-bottom:20px">
                    <i class="fas fa-info-circle"></i> 
                    Xuất trình QR này khi check-in tại cổng vào
                </p>
                <div style="display:flex;gap:10px;justify-content:center">
                    <button onclick="MyTicketsManager.downloadQR('${ticketCode}')" 
                            class="btn btn-primary">
                        <i class="fas fa-download"></i> Tải về
                    </button>
                    <button onclick="MyTicketsManager.closeQRModal()" 
                            class="btn btn-secondary">
                        <i class="fas fa-times"></i> Đóng
                    </button>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
    },
    
    downloadQR(ticketCode) {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(ticketCode)}`;
        
        // Create download link
        const link = document.createElement('a');
        link.href = qrUrl;
        link.download = `ve_${ticketCode}.png`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('Đang tải QR code...', 'success');
    },
    
    closeQRModal() {
        const modal = document.getElementById('qr-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    },
    
    viewDetails(ticketId) {
        // Navigate to detail page or show modal
        // For now, just show alert
        showToast('Chi tiết vé #' + ticketId, 'info');
    },
    
    // Helper methods
    formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    },
    
    formatCurrency(amount) {
        if (!amount && amount !== 0) return 'N/A';
        return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
    },
    
    getPaymentLabel(method) {
        const labels = {
            'cash': 'Tiền mặt',
            'bank_transfer': 'Chuyển khoản',
            'card': 'Thẻ',
            'momo': 'Ví MoMo',
            'zalopay': 'ZaloPay'
        };
        return labels[method] || method;
    },
    
    getStatusLabel(status) {
        const labels = {
            'all': 'tất cả',
            'valid': 'còn hạn',
            'used': 'đã sử dụng',
            'cancelled': 'đã hủy',
            'pending': 'chờ thanh toán'
        };
        return labels[status] || status;
    }
};

console.log('My Tickets module loaded');

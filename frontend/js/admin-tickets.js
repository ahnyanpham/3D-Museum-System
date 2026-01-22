// ==========================================
// ADMIN-TICKETS.JS - COMPLETE FINAL FIX
// No icons, correct payment logic
// ==========================================

const TicketManager = {
    ticketTypes: [],
    currentCustomer: null,
    lastTicketData: null,
    isSubmitting: false,
    currentPage: 1,
    itemsPerPage: 10,
    totalTickets: 0,
    allTickets: [],
    
    async init() {
        console.log('Ticket Manager initialized');
        await this.loadTicketTypes();
        this.setupEventListeners();
        this.setDefaultDate();
        await this.loadRecentTickets();
    },
    
    setupEventListeners() {
        const reloadTicketsBtn = document.getElementById("reload-tickets");
        if (reloadTicketsBtn) {
            reloadTicketsBtn.addEventListener("click", () => this.loadRecentTickets());
        }
        const searchBtn = document.getElementById('search-customer');
        const ticketForm = document.getElementById('ticket-form');
        const quantityInput = document.getElementById('quantity');
        const ticketTypeSelect = document.getElementById('ticket-type');
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.searchCustomer());
        }
        
        if (ticketForm) {
            ticketForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.sellTicket();
            });
        }
        
        if (quantityInput && ticketTypeSelect) {
            quantityInput.addEventListener('input', () => this.calculateTotal());
            ticketTypeSelect.addEventListener('change', () => this.calculateTotal());
        }
    },
    
    async loadTicketTypes() {
        try {
            const response = await API.getTicketTypes();
            if (response.success) {
                this.ticketTypes = response.data || [];
                this.renderTicketTypes();
            }
        } catch (error) {
            console.error('Error loading ticket types:', error);
        }
    },
    
    renderTicketTypes() {
        const select = document.getElementById('ticket-type');
        if (!select) return;
        
        select.innerHTML = '<option value="">-- Chon loai ve --</option>';
        this.ticketTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.id;
            option.textContent = type.name + ' - ' + formatCurrency(type.price);
            option.dataset.price = type.price;
            select.appendChild(option);
        });
    },
    
    calculateTotal() {
        const select = document.getElementById('ticket-type');
        const quantityInput = document.getElementById('quantity');
        const totalPriceElement = document.getElementById('total-price');
        
        if (!select || !quantityInput || !totalPriceElement) return;
        
        const selectedOption = select.options[select.selectedIndex];
        const price = selectedOption ? parseInt(selectedOption.dataset.price || 0) : 0;
        const quantity = parseInt(quantityInput.value) || 0;
        const total = price * quantity;
        
        totalPriceElement.textContent = formatCurrency(total);
    },
    
    async searchCustomer() {
        const phoneInput = document.getElementById('customer-phone');
        const customerInfo = document.getElementById('customer-info');
        
        if (!phoneInput || !customerInfo) return;
        
        const phone = phoneInput.value.trim();
        
        if (!phone) {
            showToast('Vui long nhap so dien thoai', 'warning');
            return;
        }
        
        showLoading();
        
        try {
            const response = await API.getCustomerByPhone(phone);
            hideLoading();
            
            if (response.success && response.data) {
                this.currentCustomer = response.data;
                customerInfo.innerHTML = '<div style="padding:10px;background:#e8f5e9;border-radius:6px;border-left:4px solid #4caf50"><strong>' + response.data.full_name + '</strong><br><small>Email: ' + (response.data.email || 'N/A') + ' | SDT: ' + (response.data.phone || 'N/A') + '</small></div>';
                showToast('Tim thay khach hang', 'success');
            }
        } catch (error) {
            hideLoading();
            this.currentCustomer = null;
            customerInfo.innerHTML = '<div style="padding:10px;background:#fff3cd;border-radius:6px;border-left:4px solid #ffc107">Khach hang chua ton tai. Vui long them khach hang moi o trang Khach hang.</div>';
            showToast('Khong tim thay khach hang', 'warning');
        }
    },
    
    async sellTicket() {
        if (this.isSubmitting) return;
        
        if (!this.currentCustomer) {
            showToast('Vui long tim khach hang truoc', 'warning');
            return;
        }
        
        const form = document.getElementById('ticket-form');
        if (!form) return;
        
        const ticketTypeSelect = document.getElementById('ticket-type');
        const quantityInput = document.getElementById('quantity');
        const visitDateInput = document.getElementById('visit-date');
        
        let paymentMethodSelect = document.getElementById('payment-method');
        if (!paymentMethodSelect) paymentMethodSelect = form.querySelector('[name="payment-method"]');
        if (!paymentMethodSelect) paymentMethodSelect = form.querySelector('select[name*="payment"]');
        if (!paymentMethodSelect) paymentMethodSelect = form.querySelectorAll('select')[1];
        
        const ticketTypeId = ticketTypeSelect ? ticketTypeSelect.value : '';
        const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
        const visitDate = visitDateInput ? visitDateInput.value : '';
        const paymentMethod = paymentMethodSelect ? paymentMethodSelect.value : '';
        
        console.log('=== SELL TICKET ===');
        console.log('Payment method value:', paymentMethod);
        console.log('Form data:', {ticketTypeId, quantity, visitDate, paymentMethod});
        
        if (!ticketTypeId || !visitDate || !paymentMethod) {
            const missing = [];
            if (!ticketTypeId) missing.push('Loai ve');
            if (!visitDate) missing.push('Ngay tham quan');
            if (!paymentMethod) missing.push('Phuong thuc thanh toan');
            
            showToast('Vui long chon: ' + missing.join(', '), 'warning');
            return;
        }
        
        this.isSubmitting = true;
        showLoading();
        
        try {
            const response = await API.request('/api/tickets', {
                method: 'POST',
                body: JSON.stringify({
                    customer_id: this.currentCustomer.id,
                    ticket_type_id: parseInt(ticketTypeId),
                    quantity: quantity,
                    visit_date: visitDate,
                    payment_method: paymentMethod
                })
            });
            
            hideLoading();
            this.isSubmitting = false;
            
            if (response.success) {
                this.lastTicketData = response.data;
                showToast('Ban ve thanh cong!', 'success');
                
                // Check BOTH English and Vietnamese values
                const isCash = (paymentMethod === 'cash' || 
                               paymentMethod === 'Tien mat' || 
                               paymentMethod === 'Tiền mặt' ||
                               paymentMethod.toLowerCase().includes('cash') ||
                               paymentMethod.toLowerCase().includes('tien'));
                
                console.log('Is cash payment?', isCash);
                
                if (isCash) {
                    this.showTicketQR();
                } else {
                    this.showBankingQR();
                }
                
                this.resetForm();
                await this.loadRecentTickets();
            } else {
                throw new Error(response.message || 'Loi ban ve');
            }
        } catch (error) {
            hideLoading();
            this.isSubmitting = false;
            console.error('Sell ticket error:', error);
            showToast('Loi ban ve: ' + (error.message || 'Vui long thu lai'), 'error');
        }
    },
    
    showTicketQR() {
        const modal = document.getElementById('ticket-modal');
        const detailsDiv = document.getElementById('ticket-details');
        
        if (!modal || !detailsDiv || !this.lastTicketData) return;
        
        const qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(this.lastTicketData.code);
        
        detailsDiv.innerHTML = `
            <div style="padding:20px;text-align:center">
                <div style="background:#28a745;color:white;padding:15px;border-radius:8px 8px 0 0;margin:-20px -20px 20px -20px">
                    <h3 style="margin:0">Ve Ban Thanh Cong!</h3>
                </div>
                <p><strong>Ma ve:</strong> ${this.lastTicketData.code}</p>
                <p><strong>Khach hang:</strong> ${this.currentCustomer.full_name}</p>
                <div style="margin:20px 0">
                    <img src="${qrCodeUrl}" 
                         id="qr-img-cash"
                         style="max-width:300px;border:4px solid #667eea;border-radius:8px" 
                         crossorigin="anonymous">
                </div>
                <p style="color:#666;font-size:14px">Quet QR Code de check-in</p>
                <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
                    <button id="btn-download-cash" class="btn btn-primary">Tai Ve</button>
                    <button id="btn-close-cash" class="btn btn-secondary">Dong</button>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
        
        setTimeout(() => {
            document.getElementById('btn-download-cash').onclick = () => {
                this.downloadQRImage('qr-img-cash', this.lastTicketData.code);
            };
            document.getElementById('btn-close-cash').onclick = () => {
                this.closeModal();
            };
        }, 100);
    },
    
    showBankingQR() {
        const modal = document.getElementById('ticket-modal');
        const detailsDiv = document.getElementById('ticket-details');
        
        if (!modal || !detailsDiv || !this.lastTicketData) return;
        
        const vietqrUrl = 'https://img.vietqr.io/image/970416-0188123987-compact2.png?amount=' + this.lastTicketData.total_price + '&addInfo=' + this.lastTicketData.code + '&accountName=Nhom%2011%20UIT';
        
        detailsDiv.innerHTML = `
            <div style="padding:20px;text-align:center">
                <h3 style="color:#667eea;margin-bottom:15px">Chuyen Khoan Thanh Toan</h3>
                <p><strong>Ma ve:</strong> ${this.lastTicketData.code}</p>
                <p><strong>Khach hang:</strong> ${this.currentCustomer.full_name}</p>
                <p><strong>Tong tien:</strong> ${formatCurrency(this.lastTicketData.total_price)}</p>
                <div style="margin:20px 0">
                    <img src="${vietqrUrl}" 
                         id="qr-img-banking"
                         style="max-width:300px;border-radius:8px" 
                         crossorigin="anonymous">
                </div>
                <div style="background:#f8f9fa;padding:15px;border-radius:8px;text-align:left;margin:20px 0">
                    <p><strong>Ngan hang:</strong> ACB</p>
                    <p><strong>STK:</strong> 0188123987</p>
                    <p><strong>Chu TK:</strong> Nhom 11 UIT</p>
                    <p><strong>Noi dung:</strong> ${this.lastTicketData.code}</p>
                </div>
                <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
                    <button id="btn-confirm-payment" class="btn btn-primary">Xac nhan da chuyen khoan</button>
                    <button id="btn-close-banking" class="btn btn-secondary">Dong</button>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
        
        setTimeout(() => {
            document.getElementById('btn-confirm-payment').onclick = async () => {
                const btn = document.getElementById('btn-confirm-payment');
                btn.disabled = true;
                btn.textContent = 'Dang gui email...';
                
                try {
                    const response = await API.request('/api/tickets/' + this.lastTicketData.id + '/send-email', {
                        method: 'POST'
                    });
                    
                    if (response.success) {
                        showToast(response.message || 'Da gui email!', 'success');
                        this.closeModal();
                        setTimeout(() => this.showTicketQR(), 300);
                        await this.loadRecentTickets();
                    } else {
                        throw new Error(response.message || 'Loi gui email');
                    }
                } catch (error) {
                    console.error('Email error:', error);
                    btn.disabled = false;
                    btn.textContent = 'Xac nhan da chuyen khoan';
                    showToast('Loi: ' + (error.message || 'Thu lai'), 'error');
                }
            };
            
            document.getElementById('btn-close-banking').onclick = () => {
                this.closeModal();
            };
        }, 100);
    },
    
    closeModal() {
        const modal = document.getElementById('ticket-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    },
    
    downloadQRImage(imgId, ticketCode) {
        const img = document.getElementById(imgId);
        if (!img) {
            showToast('Khong tim thay QR code', 'error');
            return;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 800;
        const ctx = canvas.getContext('2d');
        
        const tempImg = new Image();
        tempImg.crossOrigin = 'anonymous';
        tempImg.onload = () => {
            ctx.drawImage(tempImg, 0, 0, 800, 800);
            
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 've_' + ticketCode + '.png';
                link.click();
                URL.revokeObjectURL(url);
                showToast('Dang tai QR code...', 'success');
            });
        };
        tempImg.onerror = () => {
            const link = document.createElement('a');
            link.href = img.src.replace('300x300', '800x800');
            link.download = 've_' + ticketCode + '.png';
            link.target = '_blank';
            link.click();
            showToast('Dang tai QR code...', 'success');
        };
        tempImg.src = img.src.replace('300x300', '800x800');
    },
    
    async loadRecentTickets() {
        try {
            const response = await API.getTickets({ limit: 100 });
            if (response.success) {
                this.allTickets = response.data || [];
                this.totalTickets = this.allTickets.length;
                console.log('Loaded tickets:', this.totalTickets);
                this.renderTickets();
            }
        } catch (error) {
            console.error('Error loading tickets:', error);
        }
    },
    
    renderTickets() {
        const container = document.getElementById('recent-tickets');
        if (!container) return;
        
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageTickets = this.allTickets.slice(start, end);
        
        if (pageTickets.length === 0) {
            container.innerHTML = '<p style="text-align:center;padding:40px;color:#999">Chua co ve nao</p>';
            return;
        }
        
        let html = '<div class="data-table-container"><table class="data-table"><thead><tr>';
        html += '<th>Ma ve</th><th>Khach hang</th><th>Loai ve</th><th>SL</th><th>Tong tien</th><th>Ngay</th><th>Trang thai</th><th>Thao tac</th>';
        html += '</tr></thead><tbody>';
        
        pageTickets.forEach(ticket => {
            const statusClass = ticket.status === 'valid' ? 'active' : 'cancelled';
            const statusText = ticket.status === 'valid' ? 'Con han' : (ticket.status === 'used' ? 'Da dung' : 'Da huy');
            
            html += '<tr>';
            html += '<td><strong>' + (ticket.code || 'N/A') + '</strong></td>';
            html += '<td>' + (ticket.customer_name || ticket.full_name || 'N/A') + '</td>';
            html += '<td>' + (ticket.ticket_type_name || ticket.type || 'N/A') + '</td>';
            html += '<td>' + (ticket.quantity || 0) + '</td>';
            html += '<td>' + formatCurrency(ticket.total_price || 0) + '</td>';
            html += '<td>' + formatDate(ticket.valid_date || ticket.purchase_date) + '</td>';
            html += '<td><span class="status-badge ' + statusClass + '">' + statusText + '</span></td>';
            
            if (ticket.status === 'valid') {
                html += '<td>';
                html += '<button onclick="TicketManager.viewTicketQR(\'' + ticket.code + '\')" class="btn btn-sm btn-primary" style="margin-right:5px">QR</button>';
                html += '<button onclick="TicketManager.cancelTicket(' + ticket.id + ', \'' + (ticket.code || '') + '\')" class="btn btn-sm" style="background:#dc3545;color:white">Huy</button>';
                html += '</td>';
            } else {
                html += '<td>-</td>';
            }
            
            html += '</tr>';
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
        
        this.renderPagination();
    },
    
    viewTicketQR(ticketCode) {
        const modal = document.getElementById('ticket-modal');
        const detailsDiv = document.getElementById('ticket-details');
        
        if (!modal || !detailsDiv) return;
        
        const qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(ticketCode);
        
        detailsDiv.innerHTML = `
            <div style="padding:20px;text-align:center">
                <h3 style="color:#2d3748;margin-bottom:20px">Ma QR Ve</h3>
                <div style="background:#f7fafc;padding:20px;border-radius:12px;display:inline-block">
                    <img src="${qrCodeUrl}" 
                         id="qr-img-view"
                         style="max-width:300px;border-radius:8px" 
                         crossorigin="anonymous">
                </div>
                <p style="margin:20px 0;font-weight:600;font-family:monospace;font-size:18px">${ticketCode}</p>
                <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
                    <button id="btn-download-view" class="btn btn-primary">Tai ve</button>
                    <button id="btn-close-view" class="btn btn-secondary">Dong</button>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
        
        setTimeout(() => {
            document.getElementById('btn-download-view').onclick = () => {
                this.downloadQRImage('qr-img-view', ticketCode);
            };
            document.getElementById('btn-close-view').onclick = () => {
                this.closeModal();
            };
        }, 100);
    },
    
    async cancelTicket(ticketId, ticketCode) {
        if (!confirm('Ban co chac muon huy ve ' + ticketCode + '?\n\nThao tac nay khong the hoan tac!')) {
            return;
        }
        
        showLoading();
        
        try {
            const response = await API.request('/api/tickets/' + ticketId + '/cancel', {
                method: 'POST'
            });
            
            hideLoading();
            
            if (response.success) {
                showToast('Da huy ve thanh cong!', 'success');
                await this.loadRecentTickets();
            } else {
                throw new Error(response.message || 'Loi huy ve');
            }
        } catch (error) {
            hideLoading();
            showToast('Loi: ' + (error.message || 'Thu lai'), 'error');
            console.error('Cancel error:', error);
        }
    },
    
    renderPagination() {
        const container = document.getElementById('tickets-pagination');
        if (!container) return;
        
        const totalPages = Math.ceil(this.totalTickets / this.itemsPerPage);
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }
        
        let html = '<div style="display:flex;gap:5px;justify-content:center;margin-top:20px">';
        
        if (this.currentPage > 1) {
            html += '<button onclick="TicketManager.goToPage(' + (this.currentPage - 1) + ')" class="btn btn-sm">Truoc</button>';
        }
        
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                const activeClass = i === this.currentPage ? 'btn-primary' : 'btn-secondary';
                html += '<button onclick="TicketManager.goToPage(' + i + ')" class="btn btn-sm ' + activeClass + '">' + i + '</button>';
            }
        }
        
        if (this.currentPage < totalPages) {
            html += '<button onclick="TicketManager.goToPage(' + (this.currentPage + 1) + ')" class="btn btn-sm">Sau</button>';
        }
        
        html += '</div>';
        container.innerHTML = html;
    },
    
    goToPage(page) {
        this.currentPage = page;
        this.renderTickets();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    
    setDefaultDate() {
        const dateInput = document.getElementById('visit-date');
        if (!dateInput) return;
        
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        dateInput.value = dateStr;
        dateInput.min = dateStr;
    },
    
    resetForm() {
        const form = document.getElementById('ticket-form');
        const customerInfo = document.getElementById('customer-info');
        const totalPrice = document.getElementById('total-price');
        
        if (form) form.reset();
        if (customerInfo) customerInfo.innerHTML = '';
        if (totalPrice) totalPrice.textContent = '0 d';
        
        this.currentCustomer = null;
        this.setDefaultDate();
    }
};

console.log('Admin Tickets - Complete Final (No icons, correct payment logic)');

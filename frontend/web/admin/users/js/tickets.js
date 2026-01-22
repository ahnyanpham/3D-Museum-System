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
        
        select.innerHTML = '<option value="">-- Chọn loại vé --</option>';
        this.ticketTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.id;
            option.textContent = type.name + ' - ' + formatCurrency(type.price);
            option.dataset.price = type.price;
            select.appendChild(option);
        });
    },
    
    async searchCustomer() {
        const phoneInput = document.getElementById('customer-phone');
        const customerInfo = document.getElementById('customer-info');
        
        if (!phoneInput || !customerInfo) return;
        
        const phone = phoneInput.value.trim();
        
        if (!phone) {
            showToast('Vui lòng nhập số điện thoại', 'warning');
            return;
        }
        
        showLoading();
        
        try {
            const response = await API.getCustomerByPhone(phone);
            hideLoading();
            
            if (response.success && response.data) {
                this.currentCustomer = response.data;
                customerInfo.innerHTML = '<div style="padding:10px;background:#e8f5e9;border-radius:6px;border-left:4px solid #4caf50"><strong>' + response.data.full_name + '</strong><br><small>Email: ' + (response.data.email || 'N/A') + ' | SĐT: ' + (response.data.phone || 'N/A') + '</small></div>';
                showToast('Tìm thấy khách hàng', 'success');
            }
        } catch (error) {
            hideLoading();
            this.currentCustomer = null;
            customerInfo.innerHTML = '<div style="padding:10px;background:#fff3cd;border-radius:6px;border-left:4px solid #ffc107">Khách hàng chưa tồn tại. Vui lòng thêm khách hàng mới ở trang Khách hàng.</div>';
            showToast('Không tìm thấy khách hàng', 'warning');
        }
    },
    
    calculateTotal() {
        const ticketTypeSelect = document.getElementById('ticket-type');
        const quantityInput = document.getElementById('quantity');
        const totalPriceDiv = document.getElementById('total-price');
        
        if (!ticketTypeSelect || !quantityInput || !totalPriceDiv) return;
        
        const selectedOption = ticketTypeSelect.options[ticketTypeSelect.selectedIndex];
        const price = parseFloat(selectedOption.dataset.price || 0);
        const quantity = parseInt(quantityInput.value) || 0;
        const total = price * quantity;
        
        totalPriceDiv.textContent = formatCurrency(total);
    },
    
    async sellTicket() {
        if (this.isSubmitting) return;
        
        if (!this.currentCustomer) {
            showToast('Vui lòng tìm khách hàng trước', 'warning');
            return;
        }
        
        const ticketTypeId = document.getElementById('ticket-type').value;
        const quantity = parseInt(document.getElementById('quantity').value);
        const visitDate = document.getElementById('visit-date').value;
        const paymentMethod = document.getElementById('payment-method').value;
        
        if (!ticketTypeId || !quantity || !visitDate || !paymentMethod) {
            showToast('Vui lòng điền đầy đủ thông tin', 'warning');
            return;
        }
        
        const selectedOption = document.getElementById('ticket-type').options[document.getElementById('ticket-type').selectedIndex];
        const price = parseFloat(selectedOption.dataset.price);
        const totalPrice = price * quantity;
        
        this.isSubmitting = true;
        showLoading();
        
        try {
            const response = await API.createTicket({
                customer_id: this.currentCustomer.id,
                ticket_type_id: ticketTypeId,
                quantity: quantity,
                total_price: totalPrice,
                visit_date: visitDate,
                payment_method: paymentMethod
            });
            
            hideLoading();
            
            if (response.success) {
                this.lastTicketData = {
                    ticketCode: response.data.ticket_code,
                    ticketId: response.data.id,
                    customerName: this.currentCustomer.full_name,
                    totalPrice: totalPrice,
                    paymentMethod: paymentMethod
                };
                
                showToast('Bán vé thành công!', 'success');
                
                if (paymentMethod === 'Chuyển khoản') {
                    this.showBankingQR();
                } else {
                    this.showTicketQR();
                }
                
                this.resetForm();
                await this.loadRecentTickets();
            }
        } catch (error) {
            hideLoading();
            console.error('Error selling ticket:', error);
        } finally {
            this.isSubmitting = false;
        }
    },
    
    showBankingQR() {
        const modal = document.getElementById('ticket-modal');
        const detailsDiv = document.getElementById('ticket-details');
        
        if (!modal || !detailsDiv || !this.lastTicketData) return;
        
        const vietqrUrl = 'https://img.vietqr.io/image/970416-0188123987-compact2.png?amount=' + this.lastTicketData.totalPrice + '&addInfo=' + this.lastTicketData.ticketCode + '&accountName=Nhom%2011%20UIT';
        
        detailsDiv.innerHTML = '<div style="padding:20px;text-align:center"><h3 style="color:#667eea;margin-bottom:15px">Chuyển Khoản Thanh Toán</h3><p><strong>Mã vé:</strong> ' + this.lastTicketData.ticketCode + '</p><p><strong>Khách hàng:</strong> ' + this.lastTicketData.customerName + '</p><p><strong>Tổng tiền:</strong> ' + formatCurrency(this.lastTicketData.totalPrice) + '</p><div style="margin:20px 0"><img id="vietqr-img" src="' + vietqrUrl + '" style="max-width:300px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15)" crossorigin="anonymous"></div><div style="background:#f8f9fa;padding:15px;border-radius:8px;text-align:left;margin:20px 0"><p><strong>Ngân hàng:</strong> ACB</p><p><strong>Số tài khoản:</strong> 0188123987</p><p><strong>Chủ tài khoản:</strong> Nhóm 11 UIT</p><p><strong>Nội dung:</strong> ' + this.lastTicketData.ticketCode + '</p></div><button id="download-vietqr" class="btn btn-secondary" style="margin:10px">Tải QR</button><button id="confirm-payment" class="btn btn-primary">Xác nhận đã chuyển khoản</button></div>';
        
        modal.classList.add('active');
        
        setTimeout(() => {
            const downloadBtn = document.getElementById('download-vietqr');
            if (downloadBtn) {
                downloadBtn.onclick = () => {
                    const img = document.getElementById('vietqr-img');
                    if (!img) return;
                    
                    fetch(img.src)
                        .then(res => res.blob())
                        .then(blob => {
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = 'qr-chuyen-khoan-' + this.lastTicketData.ticketCode + '.png';
                            link.click();
                            URL.revokeObjectURL(url);
                            showToast('Tải QR thành công!', 'success');
                        })
                        .catch(err => {
                            console.error('Download error:', err);
                            showToast('Lỗi tải QR', 'error');
                        });
                };
            }
            
            const confirmBtn = document.getElementById('confirm-payment');
            if (confirmBtn) {
                confirmBtn.onclick = async () => {
                    confirmBtn.disabled = true;
                    confirmBtn.textContent = 'Đang gửi email...';
                    
                    try {
                        await API.request('/api/tickets/' + this.lastTicketData.ticketId + '/send-email', { method: 'POST' });
                        showToast('Đã gửi email xác nhận!', 'success');
                        this.showTicketQR();
                    } catch (error) {
                        confirmBtn.disabled = false;
                        confirmBtn.textContent = 'Xác nhận đã chuyển khoản';
                        showToast('Lỗi gửi email', 'error');
                    }
                };
            }
        }, 100);
        
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.onclick = () => modal.classList.remove('active');
        }
    },
    
    showTicketQR() {
        const modal = document.getElementById('ticket-modal');
        const detailsDiv = document.getElementById('ticket-details');
        
        if (!modal || !detailsDiv || !this.lastTicketData) return;
        
        detailsDiv.innerHTML = '<div style="padding:20px;text-align:center"><h3 style="color:#28a745;margin-bottom:15px">Vé Bán Thành Công!</h3><p style="font-size:18px"><strong>Mã vé:</strong> ' + this.lastTicketData.ticketCode + '</p><p><strong>Khách hàng:</strong> ' + this.lastTicketData.customerName + '</p><div id="qrcode-container" style="margin:20px auto;display:inline-block"></div><div style="margin-top:20px"><button id="download-ticket-btn" class="btn btn-primary" style="margin-right:10px">Tải Vé</button><button id="close-ticket-modal" class="btn btn-secondary">Đóng</button></div></div>';
        
        modal.classList.add('active');
        
        setTimeout(() => {
            const container = document.getElementById('qrcode-container');
            
            if (container && typeof QRCode !== 'undefined') {
                container.innerHTML = '';
                
                try {
                    new QRCode(container, {
                        text: this.lastTicketData.ticketCode,
                        width: 200,
                        height: 200,
                        colorDark: '#000000',
                        colorLight: '#ffffff',
                        correctLevel: QRCode.CorrectLevel.H
                    });
                    console.log('QR Code generated');
                } catch (err) {
                    console.error('QR error:', err);
                    container.innerHTML = '<p style="color:red">Lỗi tạo QR code</p>';
                }
            } else {
                console.error('QRCode not loaded');
                if (container) {
                    container.innerHTML = '<p style="color:red">Chưa tải thư viện QR Code</p>';
                }
            }
            
            const downloadBtn = document.getElementById('download-ticket-btn');
            if (downloadBtn) {
                downloadBtn.onclick = () => this.downloadTicketImage();
            }
            
            const closeBtn = document.getElementById('close-ticket-modal');
            if (closeBtn) {
                closeBtn.onclick = () => modal.classList.remove('active');
            }
        }, 300);
        
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.onclick = () => modal.classList.remove('active');
        }
    },
    
    downloadTicketImage() {
        const qrCanvas = document.querySelector('#qrcode-container canvas');
        
        if (!qrCanvas) {
            showToast('Không tìm thấy QR code', 'error');
            return;
        }
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 400;
        canvas.height = 500;
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#667eea';
        ctx.fillRect(0, 0, canvas.width, 80);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BẢO TÀNG HỒ CHÍ MINH', canvas.width / 2, 40);
        ctx.font = '16px Arial';
        ctx.fillText('VÉ THAM QUAN', canvas.width / 2, 65);
        
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 20px monospace';
        ctx.fillText(this.lastTicketData.ticketCode, canvas.width / 2, 120);
        
        const qrX = (canvas.width - 200) / 2;
        ctx.drawImage(qrCanvas, qrX, 150, 200, 200);
        
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Khách hàng: ' + this.lastTicketData.customerName, canvas.width / 2, 380);
        ctx.fillText('ID vé: #' + this.lastTicketData.ticketId, canvas.width / 2, 410);
        
        ctx.fillStyle = '#999999';
        ctx.font = '12px Arial';
        ctx.fillText('Vui lòng lưu mã vé để check-in', canvas.width / 2, 450);
        ctx.fillText('Cảm ơn quý khách!', canvas.width / 2, 475);
        
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = 've-tham-quan-' + this.lastTicketData.ticketCode + '.png';
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
            showToast('Tải vé thành công!', 'success');
        });
    },
    
    async loadRecentTickets() {
        try {
            const response = await API.getTickets({ limit: 100 });
            if (response.success) {
                this.allTickets = response.data || [];
                this.totalTickets = this.allTickets.length;
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
            container.innerHTML = '<p style="text-align:center;padding:40px;color:#999">Chưa có vé nào</p>';
            return;
        }
        
        let html = '<div class="data-table-container"><table class="data-table"><thead><tr>';
        html += '<th>Mã vé</th><th>Khách hàng</th><th>Loại vé</th><th>SL</th><th>Tổng tiền</th><th>Ngày</th><th>Trạng thái</th>';
        html += '</tr></thead><tbody>';
        
        pageTickets.forEach(ticket => {
            const statusClass = ticket.status === 'active' ? 'active' : 'cancelled';
            const statusText = ticket.status === 'active' ? 'Hoạt động' : 'Đã hủy';
            
            html += '<tr>';
            html += '<td><strong>' + ticket.ticket_code + '</strong></td>';
            html += '<td>' + ticket.full_name + '</td>';
            html += '<td>' + ticket.ticket_type_name + '</td>';
            html += '<td>' + ticket.quantity + '</td>';
            html += '<td>' + formatCurrency(ticket.total_price) + '</td>';
            html += '<td>' + formatDate(ticket.visit_date) + '</td>';
            html += '<td><span class="status-badge ' + statusClass + '">' + statusText + '</span></td>';
            html += '</tr>';
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
        
        this.renderPagination();
    },
    
    renderPagination() {
        const container = document.getElementById('tickets-pagination');
        if (!container) return;
        
        const totalPages = Math.ceil(this.totalTickets / this.itemsPerPage);
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }
        
        let html = '<div style="display:flex;gap:5px;justify-content:center">';
        
        if (this.currentPage > 1) {
            html += '<button onclick="TicketManager.goToPage(' + (this.currentPage - 1) + ')" class="btn btn-sm">Trước</button>';
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
        if (totalPrice) totalPrice.textContent = '0 đ';
        
        this.currentCustomer = null;
        this.setDefaultDate();
    }
};

console.log('Tickets module loaded');

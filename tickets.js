// ==================== TICKET MANAGER ====================
const TicketManager = {
    currentCustomer: null,
    ticketTypes: [],
    
    async init() {
        console.log('Ticket Manager initialized');
        await this.loadTicketTypes();
        this.setupEventListeners();
        this.loadRecentTickets();
        this.setDefaultDate();
    },
    
    async loadTicketTypes() {
        try {
            const response = await API.getTicketTypes();
            if (response.success && response.data) {
                this.ticketTypes = response.data;
                this.renderTicketTypeOptions();
                console.log('Loaded ticket types:', this.ticketTypes);
            }
        } catch (error) {
            console.error('Error loading ticket types:', error);
        }
    },
    
    renderTicketTypeOptions() {
        const select = document.getElementById('ticket-type');
        if (!select) return;
        
        let html = '<option value="">-- Chọn loại vé --</option>';
        this.ticketTypes.forEach(type => {
            html += `<option value="${type.id}" data-price="${type.price}">
                ${type.name} - ${formatCurrency(type.price)}
            </option>`;
        });
        select.innerHTML = html;
    },
    
    setupEventListeners() {
        const searchBtn = document.getElementById('search-customer');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.searchCustomer());
        }
        
        const phoneInput = document.getElementById('customer-phone');
        if (phoneInput) {
            phoneInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.searchCustomer();
                }
            });
        }
        
        const ticketTypeSelect = document.getElementById('ticket-type');
        if (ticketTypeSelect) {
            ticketTypeSelect.addEventListener('change', () => this.calculateTotal());
        }
        
        const quantityInput = document.getElementById('quantity');
        if (quantityInput) {
            quantityInput.addEventListener('input', () => this.calculateTotal());
        }
        
        const ticketForm = document.getElementById('ticket-form');
        if (ticketForm) {
            ticketForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.sellTicket();
            });
        }
        
        const resetBtn = document.getElementById('reset-ticket-form');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetForm());
        }
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
        
        try {
            const response = await API.getCustomerByPhone(phone);
            
            console.log('Customer search response:', response);
            
            if (response.success && response.data) {
                this.currentCustomer = response.data;
                customerInfo.innerHTML = `
                    <span style="color: var(--success-color);">
                        <i class="fas fa-check-circle"></i> 
                        Tìm thấy: <strong>${response.data.full_name}</strong>
                    </span>
                `;
                console.log('Current customer set:', this.currentCustomer);
            } else {
                this.currentCustomer = null;
                customerInfo.innerHTML = `
                    <span style="color: var(--warning-color);">
                        <i class="fas fa-info-circle"></i> 
                        Không tìm thấy khách hàng. Vui lòng tạo mới tại tab "Khách hàng"
                    </span>
                `;
            }
        } catch (error) {
            this.currentCustomer = null;
            customerInfo.innerHTML = `
                <span style="color: var(--danger-color);">
                    <i class="fas fa-times-circle"></i> 
                    Không tìm thấy khách hàng
                </span>
            `;
        }
    },
    
    calculateTotal() {
        const ticketTypeSelect = document.getElementById('ticket-type');
        const quantityInput = document.getElementById('quantity');
        const totalPriceDiv = document.getElementById('total-price');
        
        if (!ticketTypeSelect || !quantityInput || !totalPriceDiv) return;
        
        const selectedOption = ticketTypeSelect.options[ticketTypeSelect.selectedIndex];
        const price = parseFloat(selectedOption.dataset.price || 0);
        const quantity = parseInt(quantityInput.value || 1);
        
        const total = price * quantity;
        totalPriceDiv.textContent = formatCurrency(total);
    },
    
    setDefaultDate() {
        const dateInput = document.getElementById('visit-date');
        if (!dateInput) return;
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        dateInput.value = dateStr;
        dateInput.min = dateStr;
    },
    
    async sellTicket() {
        console.log('=== SELLING TICKET ===');
        
        // Validate customer
        if (!this.currentCustomer) {
            showToast('Vui lòng tìm kiếm khách hàng trước', 'warning');
            return;
        }
        
        console.log('Current customer:', this.currentCustomer);
        
        const ticketTypeSelect = document.getElementById('ticket-type');
        const quantityInput = document.getElementById('quantity');
        const visitDateInput = document.getElementById('visit-date');
        const paymentMethodSelect = document.getElementById('payment-method');
        
        if (!ticketTypeSelect || !quantityInput || !visitDateInput || !paymentMethodSelect) {
            showToast('Lỗi form', 'error');
            return;
        }
        
        const ticketTypeId = parseInt(ticketTypeSelect.value);
        if (!ticketTypeId) {
            showToast('Vui lòng chọn loại vé', 'warning');
            return;
        }
        
        const quantity = parseInt(quantityInput.value);
        if (quantity < 1 || quantity > 50) {
            showToast('Số lượng vé phải từ 1-50', 'warning');
            return;
        }
        
        const visitDate = visitDateInput.value;
        if (!visitDate) {
            showToast('Vui lòng chọn ngày tham quan', 'warning');
            return;
        }
        
        const selectedOption = ticketTypeSelect.options[ticketTypeSelect.selectedIndex];
        const price = parseFloat(selectedOption.dataset.price || 0);
        const totalPrice = price * quantity;
        
        const ticketData = {
            customer_id: this.currentCustomer.id,
            ticket_type_id: ticketTypeId,
            quantity: quantity,
            total_price: totalPrice,
            visit_date: visitDate,
            payment_method: paymentMethodSelect.value
        };
        
        console.log('Ticket data to send:', ticketData);
        
        try {
            const response = await API.createTicket(ticketData);
            
            console.log('Create ticket response:', response);
            
            if (response.success) {
                showToast('Bán vé thành công!', 'success');
                this.showTicketDetails(response.data);
                this.resetForm();
                this.loadRecentTickets();
            } else {
                showToast(response.message || 'Có lỗi xảy ra', 'error');
            }
        } catch (error) {
            console.error('Error selling ticket:', error);
        }
    },
    
    showTicketDetails(data) {
        const modal = document.getElementById('ticket-modal');
        const detailsDiv = document.getElementById('ticket-details');
        
        if (!modal || !detailsDiv) return;
        
        detailsDiv.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 48px; margin-bottom: 20px;">
                    <i class="fas fa-check-circle" style="color: var(--success-color);"></i>
                </div>
                <h3 style="color: var(--success-color); margin-bottom: 20px;">Bán vé thành công!</h3>
                
                <div style="background: var(--light-color); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                    <div style="font-size: 24px; font-weight: 700; color: var(--primary-color); margin-bottom: 10px;">
                        ${data.ticket_code}
                    </div>
                    <div style="font-size: 14px; color: var(--text-secondary);">Mã vé</div>
                </div>
                
                <div style="text-align: left; margin-top: 20px;">
                    <p style="margin: 10px 0;"><strong>Khách hàng:</strong> ${this.currentCustomer.full_name}</p>
                    <p style="margin: 10px 0;"><strong>Số điện thoại:</strong> ${this.currentCustomer.phone || 'N/A'}</p>
                    <p style="margin: 10px 0;"><strong>ID vé:</strong> #${data.id}</p>
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <small style="color: var(--text-secondary);">
                        Vui lòng lưu mã vé để check-in
                    </small>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
        
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.onclick = () => modal.classList.remove('active');
        }
        
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        };
    },
    
    async loadRecentTickets() {
        try {
            const response = await API.getTickets();
            if (response.success && response.data) {
                this.renderRecentTickets(response.data.slice(0, 10));
            }
        } catch (error) {
            console.error('Error loading recent tickets:', error);
        }
    },
    
    renderRecentTickets(tickets) {
        const container = document.getElementById('recent-tickets');
        if (!container) return;
        
        if (!tickets || tickets.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">Chưa có vé nào</p>';
            return;
        }
        
        let html = `
            <div class="data-table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Mã vé</th>
                            <th>Khách hàng</th>
                            <th>Loại vé</th>
                            <th>Số lượng</th>
                            <th>Tổng tiền</th>
                            <th>Ngày tham quan</th>
                            <th>Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        tickets.forEach(ticket => {
            html += `
                <tr>
                    <td><strong>${ticket.ticket_code}</strong></td>
                    <td>${ticket.full_name || ticket.customer_name || 'N/A'}</td>
                    <td>${ticket.ticket_type_name}</td>
                    <td>${ticket.quantity}</td>
                    <td>${formatCurrency(ticket.total_price)}</td>
                    <td>${formatDate(ticket.visit_date)}</td>
                    <td>
                        <span class="status-badge ${ticket.status}">
                            ${ticket.status === 'active' ? 'Hoạt động' : 'Đã hủy'}
                        </span>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
    },
    
    resetForm() {
        const form = document.getElementById('ticket-form');
        if (form) form.reset();
        
        this.currentCustomer = null;
        
        const customerInfo = document.getElementById('customer-info');
        if (customerInfo) customerInfo.innerHTML = '';
        
        const totalPrice = document.getElementById('total-price');
        if (totalPrice) totalPrice.textContent = '0 đ';
        
        this.setDefaultDate();
    }
};

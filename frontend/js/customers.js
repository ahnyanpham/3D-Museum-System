const CustomerManager = {
    allCustomers: [],
    filteredCustomers: [],
    currentPage: 1,
    itemsPerPage: 10,
    searchTimeout: null,
    
    async init() {
        console.log('Customer Manager initialized');
        this.setupEventListeners();
        await this.loadCustomers();
    },
    
    setupEventListeners() {
        const form = document.getElementById('customer-form');
        const searchInput = document.getElementById('search-customers');
        const reloadBtn = document.getElementById('reload-customers');
        
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addCustomer();
            });
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.searchCustomers(e.target.value);
                }, 300);
            });
        }
        
        if (reloadBtn) {
            reloadBtn.addEventListener('click', () => this.loadCustomers());
        }
    },
    
    async addCustomer() {
        const form = document.getElementById('customer-form');
        if (!form) return;
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        showLoading();
        
        try {
            const response = await API.createCustomer(data);
            hideLoading();
            
            if (response.success) {
                showToast('Thêm khách hàng thành công!', 'success');
                form.reset();
                await this.loadCustomers();
            }
        } catch (error) {
            hideLoading();
            console.error('Error adding customer:', error);
        }
    },
    
    async loadCustomers() {
        showLoading();
        
        try {
            const response = await API.getCustomers();
            hideLoading();
            
            if (response.success) {
                this.allCustomers = response.data || [];
                this.filteredCustomers = [...this.allCustomers];
                this.currentPage = 1;
                this.renderCustomers();
            }
        } catch (error) {
            hideLoading();
            console.error('Error loading customers:', error);
        }
    },
    
    searchCustomers(term) {
        if (!term) {
            this.filteredCustomers = [...this.allCustomers];
        } else {
            const searchTerm = term.toLowerCase();
            this.filteredCustomers = this.allCustomers.filter(customer => {
                return (
                    (customer.full_name && customer.full_name.toLowerCase().includes(searchTerm)) ||
                    (customer.phone && customer.phone.includes(searchTerm)) ||
                    (customer.email && customer.email.toLowerCase().includes(searchTerm))
                );
            });
        }
        
        this.currentPage = 1;
        this.renderCustomers();
    },
    
    renderCustomers() {
        const container = document.getElementById('customers-list');
        if (!container) return;
        
        if (this.filteredCustomers.length === 0) {
            container.innerHTML = '<p style="text-align:center;padding:40px;color:#999">Chưa có khách hàng nào</p>';
            return;
        }
        
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageCustomers = this.filteredCustomers.slice(start, end);
        
        let html = '<div class="data-table-container"><table class="data-table"><thead><tr>';
        html += '<th>ID</th><th>Họ tên</th><th>SĐT</th><th>Email</th><th>Giới tính</th><th>Quốc tịch</th><th>Ngày tạo</th><th>Thao tác</th>';
        html += '</tr></thead><tbody>';
        
        pageCustomers.forEach(customer => {
            html += '<tr>';
            html += '<td>' + customer.id + '</td>';
            html += '<td>' + customer.full_name + '</td>';
            html += '<td>' + (customer.phone || 'N/A') + '</td>';
            html += '<td>' + (customer.email || 'N/A') + '</td>';
            html += '<td>' + (customer.gender || 'N/A') + '</td>';
            html += '<td>' + (customer.nationality || 'N/A') + '</td>';
            html += '<td>' + formatDate(customer.created_at) + '</td>';
            html += '<td><button onclick="CustomerManager.deleteCustomer(' + customer.id + ', \'' + customer.full_name + '\')" class="btn btn-sm" style="background:#dc3545;color:white">Xóa</button></td>';
            html += '</tr>';
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
        
        this.renderPagination();
    },
    
    renderPagination() {
        const container = document.getElementById('customers-pagination');
        if (!container) return;
        
        const totalPages = Math.ceil(this.filteredCustomers.length / this.itemsPerPage);
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }
        
        let html = '<div style="display:flex;gap:5px;justify-content:center">';
        
        if (this.currentPage > 1) {
            html += '<button onclick="CustomerManager.goToPage(' + (this.currentPage - 1) + ')" class="btn btn-sm">Trước</button>';
        }
        
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                const activeClass = i === this.currentPage ? 'btn-primary' : 'btn-secondary';
                html += '<button onclick="CustomerManager.goToPage(' + i + ')" class="btn btn-sm ' + activeClass + '">' + i + '</button>';
            }
        }
        
        if (this.currentPage < totalPages) {
            html += '<button onclick="CustomerManager.goToPage(' + (this.currentPage + 1) + ')" class="btn btn-sm">Sau</button>';
        }
        
        html += '</div>';
        container.innerHTML = html;
    },
    
    goToPage(page) {
        this.currentPage = page;
        this.renderCustomers();
    },
    
    async deleteCustomer(customerId, customerName) {
        if (!confirm('Bạn có chắc muốn xóa khách hàng "' + customerName + '"?\n\nLưu ý: Thao tác này không thể hoàn tác!')) {
            return;
        }
        
        showLoading();
        
        try {
            const response = await API.request('/api/customers/' + customerId, {
                method: 'DELETE'
            });
            
            hideLoading();
            
            if (response.success) {
                showToast('Đã xóa khách hàng!', 'success');
                await this.loadCustomers();
            }
        } catch (error) {
            hideLoading();
            showToast('Lỗi xóa khách hàng: ' + (error.message || 'Unknown error'), 'error');
            console.error('Error deleting customer:', error);
        }
    }
};

console.log('Customers module loaded');

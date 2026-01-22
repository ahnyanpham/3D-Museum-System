const OrderManager = {
    currentStatus: 'all',
    allOrders: [],
    currentOrder: null,
    currentRejectOrderId: null,
    currentPage: 1,
    pageSize: 15,
    totalPages: 1,

    init() {
        this.setupEventListeners();
        this.loadOrders();
        this.loadStatistics();
        this.checkSession();
    },

    async checkSession() {
        try {
            const response = await fetch('/api/auth/session', {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success && data.logged_in) {
                const userName = document.getElementById('user-name');
                if (userName) {
                    userName.textContent = data.data.fullname || data.data.username;
                }

                const permissions = data.data.permissions || [];
                if (!permissions.includes('all') && !permissions.includes('dashboard')) {
                    window.location.href = '/admin/';
                    return;
                }
            } else {
                window.location.href = '/login.html';
            }
        } catch (error) {
            console.error('Session check error:', error);
        }
    },

    setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const status = e.target.dataset.status;
                this.currentPage = 1; // Reset to page 1 when filtering
                this.filterOrders(status);
            });
        });

        // Refresh button
        const refreshBtn = document.getElementById('refresh-orders');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.currentPage = 1;
                this.loadOrders();
                this.loadStatistics();
            });
        }
    },

    async loadStatistics() {
        try {
            const response = await fetch('/api/admin/orders/statistics', {
                credentials: 'include'
            });
            const data = await response.json();

            if (data.success) {
                const stats = data.data;

                document.getElementById('stat-pending').textContent = 
                    stats.pending_count || 0;

                document.getElementById('stat-today').textContent = 
                    stats.today?.count || 0;

                const revenue = stats.this_month?.total_amount || 0;
                document.getElementById('stat-revenue').textContent = 
                    this.formatCurrency(revenue);
            }
        } catch (error) {
            console.error('Load statistics error:', error);
        }
    },

    async loadOrders() {
        showLoading();
        try {
            const response = await fetch('/api/admin/orders/list?status=all', {
                credentials: 'include'
            });
            const data = await response.json();

            if (data.success) {
                this.allOrders = data.data || [];
                this.filterOrders(this.currentStatus);
            } else {
                showToast(data.message || 'Không thể tải dữ liệu', 'error');
            }
        } catch (error) {
            console.error('Load orders error:', error);
            showToast('Lỗi kết nối', 'error');
        } finally {
            hideLoading();
        }
    },

    filterOrders(status) {
        this.currentStatus = status;

        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.status === status);
        });

        // Filter orders
        const filtered = status === 'all' 
            ? this.allOrders
            : this.allOrders.filter(order => order.status === status);

        // Calculate pagination
        this.totalPages = Math.ceil(filtered.length / this.pageSize);
        if (this.currentPage > this.totalPages) {
            this.currentPage = Math.max(1, this.totalPages);
        }

        // Get orders for current page
        const startIdx = (this.currentPage - 1) * this.pageSize;
        const endIdx = startIdx + this.pageSize;
        const pageOrders = filtered.slice(startIdx, endIdx);

        this.renderOrders(pageOrders);
        this.renderPagination(filtered.length);
        this.updateCount(filtered.length);
    },

    renderOrders(orders) {
        const tbody = document.getElementById('orders-tbody');
        
        if (orders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="empty-state">
                        <i class="fas fa-shopping-cart"></i>
                        <p>Không có đơn hàng</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = orders.map(order => `
            <tr>
                <td><strong>${order.order_code}</strong></td>
                <td>${order.customer_name}</td>
                <td>${order.customer_phone || '-'}</td>
                <td>${order.ticket_type}</td>
                <td style="text-align:center">${order.quantity}</td>
                <td style="text-align:right"><strong>${this.formatCurrency(order.total_price)}</strong></td>
                <td style="text-align:center">
                    ${order.payment_proof_path ? 
                        `<button class="btn-view-image" onclick="OrderManager.viewImage('${order.payment_proof_path}')">
                            <i class="fas fa-image"></i> Xem ảnh
                        </button>` 
                        : '<span style="color:#999">-</span>'}
                </td>
                <td style="text-align:center">${this.formatDate(order.created_at)}</td>
                <td style="text-align:center">${this.renderStatusBadge(order.status)}</td>
                <td style="text-align:center">
                    <button class="btn-detail" onclick="OrderManager.viewOrderDetail(${order.order_id})">
                        <i class="fas fa-eye"></i> Chi tiết
                    </button>
                </td>
            </tr>
        `).join('');
    },

    renderStatusBadge(status) {
        const statusMap = {
            'pending': { text: 'Chờ thanh toán', class: 'status-pending' },
            'waiting_confirmation': { text: 'Chờ xác nhận', class: 'status-waiting' },
            'paid': { text: 'Đã duyệt', class: 'status-paid' },
            'rejected': { text: 'Đã từ chối', class: 'status-rejected' },
            'cancelled': { text: 'Đã hủy', class: 'status-cancelled' }
        };

        const statusInfo = statusMap[status] || { text: status, class: 'status-pending' };
        return `<span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>`;
    },

    renderPagination(totalOrders) {
        const paginationDiv = document.getElementById('pagination');
        if (!paginationDiv) return;

        if (this.totalPages <= 1) {
            paginationDiv.innerHTML = '';
            return;
        }

        let html = `
            <button ${this.currentPage === 1 ? 'disabled' : ''} 
                    onclick="OrderManager.goToPage(${this.currentPage - 1})">
                <i class="fas fa-chevron-left"></i> Trước
            </button>
        `;

        // Page numbers
        const maxButtons = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(this.totalPages, startPage + maxButtons - 1);

        if (endPage - startPage < maxButtons - 1) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        if (startPage > 1) {
            html += `<button onclick="OrderManager.goToPage(1)">1</button>`;
            if (startPage > 2) {
                html += `<span class="pagination-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="${i === this.currentPage ? 'active' : ''}" 
                        onclick="OrderManager.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                html += `<span class="pagination-ellipsis">...</span>`;
            }
            html += `<button onclick="OrderManager.goToPage(${this.totalPages})">${this.totalPages}</button>`;
        }

        html += `
            <button ${this.currentPage === this.totalPages ? 'disabled' : ''} 
                    onclick="OrderManager.goToPage(${this.currentPage + 1})">
                Sau <i class="fas fa-chevron-right"></i>
            </button>
        `;

        html += `<div class="page-info">Trang ${this.currentPage}/${this.totalPages} (${totalOrders} đơn)</div>`;

        paginationDiv.innerHTML = html;
    },

    goToPage(page) {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.filterOrders(this.currentStatus);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    updateCount(count) {
        const countElem = document.getElementById('orders-count');
        if (countElem) {
            countElem.textContent = `Tổng: ${count} đơn`;
        }
    },

    viewImage(imagePath) {
        const modal = document.getElementById('imageModal');
        const img = document.getElementById('modalImage');
        
        if (modal && img) {
            img.src = imagePath;
            modal.classList.add('active');
        }
    },

    closeImageModal() {
        const modal = document.getElementById('imageModal');
        if (modal) {
            modal.classList.remove('active');
        }
    },

    async viewOrderDetail(orderId) {
        const order = this.allOrders.find(o => o.order_id === orderId);
        if (!order) return;

        this.currentOrder = order;

        document.getElementById('modal-order-code').textContent = order.order_code;
        document.getElementById('detail-customer-name').textContent = order.customer_name;
        document.getElementById('detail-customer-phone').textContent = order.customer_phone || '-';
        document.getElementById('detail-customer-email').textContent = order.customer_email || '-';
        document.getElementById('detail-customer-note').textContent = order.customer_note || '-';
        
        document.getElementById('detail-ticket-type').textContent = order.ticket_type;
        document.getElementById('detail-quantity').textContent = order.quantity;
        document.getElementById('detail-unit-price').textContent = this.formatCurrency(order.unit_price);
        document.getElementById('detail-total-price').textContent = this.formatCurrency(order.total_price);
        
        document.getElementById('detail-bank-name').textContent = order.bank_name || '-';
        document.getElementById('detail-bank-account').textContent = order.bank_account || '-';
        document.getElementById('detail-bank-account-name').textContent = order.bank_account_name || '-';
        document.getElementById('detail-transaction-ref').textContent = order.transaction_ref || order.order_code;

        const proofImg = document.getElementById('payment-proof-img');
        if (order.payment_proof_path) {
            proofImg.src = order.payment_proof_path;
            proofImg.style.display = 'block';
        } else {
            proofImg.style.display = 'none';
        }

        const actionsContainer = document.getElementById('order-actions');
        if (order.status === 'waiting_confirmation') {
            actionsContainer.innerHTML = `
                <button type="button" class="btn btn-secondary" onclick="closeModal()">
                    Đóng
                </button>
                <button type="button" class="btn btn-danger" onclick="OrderManager.openRejectModal(${order.order_id})">
                    Từ chối
                </button>
                <button type="button" class="btn btn-success" onclick="OrderManager.approveOrder(${order.order_id})">
                    Duyệt đơn hàng
                </button>
            `;
        } else {
            let statusText = '';
            if (order.status === 'paid') {
                statusText = `<p style="color:#28a745;font-weight:600">Đơn hàng đã được duyệt bởi ${order.confirmed_by || 'Admin'}</p>`;
            } else if (order.status === 'rejected') {
                statusText = `<p style="color:#dc3545;font-weight:600">Đã từ chối: ${order.rejection_reason || 'Không có lý do'}</p>`;
            }

            actionsContainer.innerHTML = `
                ${statusText}
                <button type="button" class="btn btn-secondary" onclick="closeModal()">
                    Đóng
                </button>
            `;
        }

        openModal('order-detail-modal');
    },

    async approveOrder(orderId) {
        if (!confirm('Xác nhận duyệt đơn hàng này?\n\nHệ thống sẽ tự động tạo vé và gửi email cho khách hàng.')) {
            return;
        }

        showLoading();
        try {
            const response = await fetch(`/api/admin/orders/${orderId}/approve`, {
                method: 'POST',
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                showToast('Đã duyệt đơn hàng thành công', 'success');
                closeModal();
                this.loadOrders();
                this.loadStatistics();
            } else {
                showToast(data.message || 'Duyệt đơn hàng thất bại', 'error');
            }
        } catch (error) {
            console.error('Approve order error:', error);
            showToast('Lỗi kết nối', 'error');
        } finally {
            hideLoading();
        }
    },

    openRejectModal(orderId) {
        this.currentRejectOrderId = orderId;
        
        const reasonInput = document.getElementById('rejection-reason');
        if (reasonInput) {
            reasonInput.value = '';
        }
        
        closeModal();
        
        setTimeout(() => {
            openModal('reject-modal');
        }, 100);
    },

    async confirmReject() {
        const orderId = this.currentRejectOrderId;
        const reasonInput = document.getElementById('rejection-reason');
        
        if (!orderId) {
            showToast('Lỗi: Không tìm thấy mã đơn hàng', 'error');
            return;
        }
        
        if (!reasonInput) {
            showToast('Lỗi: Không tìm thấy input lý do', 'error');
            return;
        }
        
        const reason = reasonInput.value.trim();

        if (!reason) {
            showToast('Vui lòng nhập lý do từ chối', 'error');
            return;
        }

        if (!confirm('Xác nhận từ chối đơn hàng này?')) {
            return;
        }

        showLoading();
        try {
            const response = await fetch(`/api/admin/orders/${orderId}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ reason })
            });

            const data = await response.json();

            if (data.success) {
                showToast('Đã từ chối đơn hàng', 'success');
                closeRejectModal();
                this.loadOrders();
                this.loadStatistics();
                this.currentRejectOrderId = null;
            } else {
                showToast(data.message || 'Từ chối đơn hàng thất bại', 'error');
            }
        } catch (error) {
            console.error('Reject order error:', error);
            showToast('Lỗi kết nối', 'error');
        } finally {
            hideLoading();
        }
    },

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    },

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
};

// Global functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal() {
    const modal = document.getElementById('order-detail-modal');
    if (modal) modal.classList.remove('active');
}

function closeRejectModal() {
    const modal = document.getElementById('reject-modal');
    if (modal) modal.classList.remove('active');
}

function closeImageModal() {
    OrderManager.closeImageModal();
}

function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.classList.add('active');
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.classList.remove('active');
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    if (toast && toastMessage) {
        toast.className = `toast ${type} active`;
        toastMessage.textContent = message;
        
        setTimeout(() => {
            toast.classList.remove('active');
        }, 3000);
    } else {
        alert(message);
    }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    OrderManager.init();
});

console.log('Orders Manager with Pagination loaded');

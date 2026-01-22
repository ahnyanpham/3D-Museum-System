// ==========================================
// CHECKOUT.JS - OPTION C (2 TABS)
// Tab 1: Nhanh (Radio + Checkbox)
// Tab 2: Tùy chỉnh (Textarea + Gợi ý)
// Chỉ có icon sao, không icon khác
// ==========================================

const CheckoutManager = {
    customers: [],
    groupedVisits: {},
    itemsPerPage: 10,
    searchTerm: '',
    currentPage: 1,
    currentRating: 0,
    currentTicketCode: null,
    currentMode: 'quick', // 'quick' or 'custom'

    async init() {
        console.log('Checkout Manager initialized - Option C');
        this.setupEventListeners();
        await this.loadActiveCheckouts();
    },

    setupEventListeners() {
        const refreshBtn = document.getElementById('refresh-active-visits');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadActiveCheckouts();
            });
        }

        const searchInput = document.getElementById('search-checkout-customers');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.trim().toLowerCase();
                this.renderCustomerList();
            });
        }
    },

    async loadActiveCheckouts() {
        showLoading();
        try {
            const response = await fetch(`/api/checkout/active`, {
                credentials: 'include'
            });
            
            const data = await response.json();
            hideLoading();

            if (data.success) {
                this.customers = data.data || [];
                console.log('Loaded customers:', this.customers.length);
                this.currentPage = 1;
                this.renderCustomerList();
            } else {
                throw new Error(data.message || 'Lỗi tải danh sách');
            }
        } catch (error) {
            hideLoading();
            console.error('Load error:', error);
            showToast('Lỗi tải dữ liệu: ' + error.message, 'error');
        }
    },

    renderCustomerList() {
        const container = document.getElementById('active-visits-list');
        if (!container) return;

        let filteredCustomers = this.customers;
        if (this.searchTerm) {
            filteredCustomers = this.customers.filter(c =>
                c.customer_name.toLowerCase().includes(this.searchTerm) ||
                (c.customer_phone && c.customer_phone.includes(this.searchTerm)) ||
                c.ticket_codes.toLowerCase().includes(this.searchTerm)
            );
        }

        if (filteredCustomers.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:60px;color:#999"><p style="font-size:18px">' + 
                (this.searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có khách nào đang tham quan') + '</p></div>';
            return;
        }

        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageCustomers = filteredCustomers.slice(start, end);

        let html = '<div style="margin-bottom:15px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">';
        html += '<label style="font-weight:500">Hiển thị:</label>';
        html += '<select id="items-per-page-checkout" style="padding:8px;border:1px solid #ddd;border-radius:6px">';
        html += '<option value="10"' + (this.itemsPerPage === 10 ? ' selected' : '') + '>10</option>';
        html += '<option value="30"' + (this.itemsPerPage === 30 ? ' selected' : '') + '>30</option>';
        html += '<option value="50"' + (this.itemsPerPage === 50 ? ' selected' : '') + '>50</option>';
        html += '</select>';
        html += '<span style="color:#666;margin-left:auto">Tổng: ' + filteredCustomers.length + ' khách hàng</span>';
        html += '</div>';

        html += '<div class="customer-cards-container">';

        pageCustomers.forEach(customer => {
            const ticketCodes = customer.ticket_codes.split(', ');
            const checkInTime = customer.check_in_time ? this.formatDateTime(customer.check_in_time) : 'N/A';
            const duration = customer.check_in_time ? this.calculateDuration(customer.check_in_time) : 'N/A';
            const visitCount = customer.visit_count || ticketCodes.length;

            html += '<div class="customer-card" style="background:white;border-radius:12px;padding:20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.1)">';
            html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;padding-bottom:15px;border-bottom:2px solid #e2e8f0">';
            html += '<div><h4 style="margin:0;color:#2d3748;font-size:18px">' + customer.customer_name + '</h4>';
            html += '<p style="margin:5px 0;color:#718096;font-size:14px">' + (customer.customer_phone || 'N/A') + '</p></div>';
            html += '<span style="background:#48bb78;color:white;padding:8px 16px;border-radius:12px;font-weight:600;font-size:14px">' + visitCount + ' lượt</span>';
            html += '</div>';
            
            html += '<div style="margin:15px 0;padding:12px;background:#f7fafc;border-radius:8px">';
            html += '<p style="margin:5px 0;color:#4a5568"><strong>Giờ vào:</strong> ' + checkInTime + '</p>';
            html += '<p style="margin:5px 0;color:#4a5568"><strong>Thời gian:</strong> <span style="color:#e53e3e;font-weight:600">' + duration + '</span></p>';
            html += '</div>';
            
            html += '<div style="display:grid;gap:10px;margin-top:15px">';
            ticketCodes.forEach(code => {
                const cleanCode = code.trim();
                const cleanName = customer.customer_name.replace(/'/g, "\\'");
                html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:#f7fafc;border-radius:8px;border-left:4px solid #48bb78">';
                html += '<span style="font-weight:600;font-family:monospace;color:#2d3748;font-size:15px">' + cleanCode + '</span>';
                html += '<button onclick="CheckoutManager.showCheckoutModal(\'' + cleanCode + '\', \'' + cleanName + '\')" ';
                html += 'class="btn btn-success btn-sm" style="padding:8px 16px;font-size:14px">Check-out</button>';
                html += '</div>';
            });
            html += '</div></div>';
        });

        html += '</div>';
        html += '<div id="checkout-pagination" style="margin-top:20px"></div>';

        container.innerHTML = html;

        const selectElement = document.getElementById('items-per-page-checkout');
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
        const container = document.getElementById('checkout-pagination');
        if (!container) return;

        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '<div style="display:flex;gap:5px;justify-content:center;flex-wrap:wrap">';
        
        if (this.currentPage > 1) {
            html += '<button onclick="CheckoutManager.goToPage(' + (this.currentPage - 1) + ')" class="btn btn-sm">Trước</button>';
        }

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                const activeClass = i === this.currentPage ? 'btn-primary' : 'btn-secondary';
                html += '<button onclick="CheckoutManager.goToPage(' + i + ')" class="btn btn-sm ' + activeClass + '">' + i + '</button>';
            }
        }

        if (this.currentPage < totalPages) {
            html += '<button onclick="CheckoutManager.goToPage(' + (this.currentPage + 1) + ')" class="btn btn-sm">Sau</button>';
        }

        html += '</div>';
        container.innerHTML = html;
    },

    goToPage(page) {
        this.currentPage = page;
        this.renderCustomerList();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    calculateDuration(checkInTime) {
        const now = new Date();
        const checkIn = new Date(checkInTime);
        const diffMs = now - checkIn;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (diffHours > 0) {
            return diffHours + ' giờ ' + diffMins + ' phút';
        }
        return diffMins + ' phút';
    },

    showCheckoutModal(ticketCode, customerName) {
        this.currentTicketCode = ticketCode;
        this.currentRating = 0;
        this.currentMode = 'quick';
        
        let modal = document.getElementById('checkout-modal');
        if (!modal) {
            const modalHTML = '<div id="checkout-modal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999">' +
                '<div id="checkout-modal-body" style="background:white;border-radius:12px;max-width:550px;width:90%;max-height:90vh;overflow-y:auto"></div></div>';
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            modal = document.getElementById('checkout-modal');
        }
        
        const modalBody = document.getElementById('checkout-modal-body');
        if (!modalBody) return;
        
        modal.style.display = 'flex';

        modalBody.innerHTML = '<div style="padding:30px">' +
            '<h3 style="color:#2d3748;margin-bottom:10px;text-align:center">Check-out</h3>' +
            '<p style="color:#718096;margin-bottom:20px;text-align:center"><strong>Mã vé:</strong> ' + ticketCode + '<br><strong>Khách hàng:</strong> ' + customerName + '</p>' +
            
            // Tabs
            '<div style="display:flex;gap:10px;margin-bottom:20px;border-bottom:2px solid #e2e8f0">' +
            '<button id="quick-tab-btn" onclick="CheckoutManager.switchTab(\'quick\')" style="flex:1;padding:12px;border:none;background:none;border-bottom:3px solid #667eea;color:#667eea;font-weight:600;cursor:pointer">Nhanh</button>' +
            '<button id="custom-tab-btn" onclick="CheckoutManager.switchTab(\'custom\')" style="flex:1;padding:12px;border:none;background:none;border-bottom:3px solid transparent;color:#718096;font-weight:600;cursor:pointer">Tùy chỉnh</button>' +
            '</div>' +
            
            // Star Rating
            '<div style="margin:20px 0;padding:20px;background:#f7fafc;border-radius:12px">' +
            '<h4 style="margin-bottom:15px;color:#2d3748;text-align:center">Đánh giá</h4>' +
            '<div class="star-rating" style="text-align:center;margin:20px 0;font-size:40px">' +
            '<span class="star" data-rating="1" onclick="CheckoutManager.setRating(1)" style="cursor:pointer;color:#d1d5db;margin:0 8px;transition:all 0.2s">★</span>' +
            '<span class="star" data-rating="2" onclick="CheckoutManager.setRating(2)" style="cursor:pointer;color:#d1d5db;margin:0 8px;transition:all 0.2s">★</span>' +
            '<span class="star" data-rating="3" onclick="CheckoutManager.setRating(3)" style="cursor:pointer;color:#d1d5db;margin:0 8px;transition:all 0.2s">★</span>' +
            '<span class="star" data-rating="4" onclick="CheckoutManager.setRating(4)" style="cursor:pointer;color:#d1d5db;margin:0 8px;transition:all 0.2s">★</span>' +
            '<span class="star" data-rating="5" onclick="CheckoutManager.setRating(5)" style="cursor:pointer;color:#d1d5db;margin:0 8px;transition:all 0.2s">★</span>' +
            '</div>' +
            '<p id="rating-text" style="text-align:center;color:#667eea;font-weight:600;min-height:24px">Chọn số sao để đánh giá</p>' +
            '</div>' +
            
            // Quick Mode Content
            '<div id="quick-mode-content" style="margin:20px 0">' +
            '<h5 style="margin-bottom:10px;color:#2d3748">Chọn nhanh (chỉ 1):</h5>' +
            '<div id="radio-suggestions" style="display:grid;gap:8px;margin-bottom:20px"><p style="color:#999;text-align:center;padding:20px">Vui lòng chọn sao trước</p></div>' +
            '<h5 style="margin-bottom:10px;color:#2d3748">Hoặc chọn nhiều:</h5>' +
            '<div id="checkbox-suggestions" style="display:grid;gap:8px"><p style="color:#999;text-align:center;padding:20px">Vui lòng chọn sao trước</p></div>' +
            '</div>' +
            
            // Custom Mode Content
            '<div id="custom-mode-content" style="margin:20px 0;display:none">' +
            '<label style="display:block;margin-bottom:10px;font-weight:600;color:#2d3748">Nhận xét của bạn:</label>' +
            '<textarea id="checkout-feedback-custom" rows="5" style="width:100%;padding:12px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px" placeholder="Chia sẻ trải nghiệm của bạn..."></textarea>' +
            '<div id="quick-add-buttons" style="margin-top:15px;display:none"><h5 style="margin-bottom:10px;color:#2d3748">Gợi ý nhanh (click để thêm):</h5><div id="add-suggestion-buttons" style="display:flex;flex-wrap:wrap;gap:8px"></div></div>' +
            '</div>' +
            
            // Buttons
            '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px">' +
            '<button onclick="CheckoutManager.closeCheckoutModal()" class="btn btn-secondary" style="padding:12px 24px;border:none;border-radius:8px;cursor:pointer;font-weight:600;background:#6c757d;color:white">Hủy</button>' +
            '<button onclick="CheckoutManager.confirmCheckout()" class="btn btn-success" style="padding:12px 24px;border:none;border-radius:8px;cursor:pointer;font-weight:600;background:#48bb78;color:white">Xác nhận</button>' +
            '</div>' +
            '</div>';
    },

    switchTab(mode) {
        this.currentMode = mode;
        
        const quickTab = document.getElementById('quick-tab-btn');
        const customTab = document.getElementById('custom-tab-btn');
        const quickContent = document.getElementById('quick-mode-content');
        const customContent = document.getElementById('custom-mode-content');
        
        if (mode === 'quick') {
            quickTab.style.borderBottom = '3px solid #667eea';
            quickTab.style.color = '#667eea';
            customTab.style.borderBottom = '3px solid transparent';
            customTab.style.color = '#718096';
            quickContent.style.display = 'block';
            customContent.style.display = 'none';
        } else {
            customTab.style.borderBottom = '3px solid #667eea';
            customTab.style.color = '#667eea';
            quickTab.style.borderBottom = '3px solid transparent';
            quickTab.style.color = '#718096';
            customContent.style.display = 'block';
            quickContent.style.display = 'none';
        }
    },

    setRating(rating) {
        this.currentRating = rating;
        
        // Update stars
        const stars = document.querySelectorAll('.star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.style.color = '#fbbf24';
            } else {
                star.style.color = '#d1d5db';
            }
        });
        
        const ratingMessages = {
            1: 'Rất không hài lòng',
            2: 'Không hài lòng',
            3: 'Bình thường',
            4: 'Hài lòng',
            5: 'Rất hài lòng'
        };
        
        const ratingText = document.getElementById('rating-text');
        if (ratingText) {
            ratingText.textContent = rating + ' sao - ' + ratingMessages[rating];
        }
        
        // Suggestions for each rating
        const suggestions = {
            1: ['Không gian chưa sạch sẽ', 'Nhân viên thiếu nhiệt tình', 'Triển lãm chưa hấp dẫn', 'Giá vé không xứng đáng'],
            2: ['Cần cải thiện vệ sinh', 'Dịch vụ chưa tốt', 'Hiện vật ít', 'Thiếu hướng dẫn viên'],
            3: ['Giá cả hợp lý', 'Vị trí thuận tiện', 'Nội dung đạt yêu cầu', 'Phù hợp tham quan'],
            4: ['Không gian đẹp', 'Nhân viên thân thiện', 'Nội dung phong phú', 'Đáng để tham quan'],
            5: ['Trải nghiệm tuyệt vời', 'Nhân viên xuất sắc', 'Triển lãm rất hay', 'Sẽ giới thiệu cho bạn bè']
        };
        
        const currentSuggestions = suggestions[rating] || [];
        
        // Radio buttons
        const radioDiv = document.getElementById('radio-suggestions');
        if (radioDiv) {
            radioDiv.innerHTML = currentSuggestions.map((text, i) => 
                '<label style="padding:12px;background:white;border:1px solid #e2e8f0;border-radius:8px;cursor:pointer;display:flex;align-items:center;transition:all 0.2s" ' +
                'onmouseover="this.style.background=\'#f7fafc\'" onmouseout="this.style.background=\'white\'">' +
                '<input type="radio" name="quick-feedback-radio" value="' + text.replace(/'/g, '&#39;') + '" style="margin-right:10px"> ' + text +
                '</label>'
            ).join('');
        }
        
        // Checkboxes
        const checkboxDiv = document.getElementById('checkbox-suggestions');
        if (checkboxDiv) {
            checkboxDiv.innerHTML = currentSuggestions.map((text, i) =>
                '<label style="padding:12px;background:white;border:1px solid #e2e8f0;border-radius:8px;cursor:pointer;display:flex;align-items:center;transition:all 0.2s" ' +
                'onmouseover="this.style.background=\'#f7fafc\'" onmouseout="this.style.background=\'white\'">' +
                '<input type="checkbox" name="quick-feedback-checkbox" value="' + text.replace(/'/g, '&#39;') + '" style="margin-right:10px"> ' + text +
                '</label>'
            ).join('');
        }
        
        // Custom mode add buttons
        const quickAddDiv = document.getElementById('quick-add-buttons');
        const addButtonsDiv = document.getElementById('add-suggestion-buttons');
        if (quickAddDiv && addButtonsDiv) {
            quickAddDiv.style.display = 'block';
            addButtonsDiv.innerHTML = currentSuggestions.map(text =>
                '<button type="button" onclick="CheckoutManager.addToTextarea(\'' + text.replace(/'/g, "\\'") + '\')" ' +
                'style="padding:8px 12px;background:#f7fafc;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;font-size:13px;transition:all 0.2s" ' +
                'onmouseover="this.style.background=\'#edf2f7\'" onmouseout="this.style.background=\'#f7fafc\'">+ ' + text + '</button>'
            ).join('');
        }
    },

    addToTextarea(text) {
        const textarea = document.getElementById('checkout-feedback-custom');
        if (textarea) {
            const current = textarea.value.trim();
            if (current) {
                textarea.value = current + '\n- ' + text;
            } else {
                textarea.value = '- ' + text;
            }
            showToast('Đã thêm gợi ý', 'success');
        }
    },

    async confirmCheckout() {
        if (!this.currentRating) {
            showToast('Vui lòng chọn đánh giá trước', 'warning');
            return;
        }

        let feedback = '';
        
        if (this.currentMode === 'quick') {
            // Get radio selection
            const radioSelected = document.querySelector('input[name="quick-feedback-radio"]:checked');
            if (radioSelected) {
                feedback = radioSelected.value;
            } else {
                // Get checkbox selections
                const checkboxes = document.querySelectorAll('input[name="quick-feedback-checkbox"]:checked');
                if (checkboxes.length > 0) {
                    feedback = Array.from(checkboxes).map(cb => cb.value).join('\n- ');
                    feedback = '- ' + feedback;
                }
            }
            
            if (!feedback) {
                showToast('Vui lòng chọn ít nhất 1 nhận xét', 'warning');
                return;
            }
        } else {
            feedback = document.getElementById('checkout-feedback-custom').value.trim();
        }

        if (!confirm('Xác nhận checkout vé ' + this.currentTicketCode + '?')) {
            return;
        }

        showLoading();
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    ticket_code: this.currentTicketCode,
                    rating: this.currentRating,
                    feedback: feedback
                })
            });

            const data = await response.json();

            if (data.success) {
                showToast('Check-out thành công!', 'success');
                this.closeCheckoutModal();
                await this.loadActiveCheckouts();
            } else {
                throw new Error(data.message || 'Lỗi checkout');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            showToast('Lỗi: ' + error.message, 'error');
        } finally {
            hideLoading();
        }
    },

    closeCheckoutModal() {
        const modal = document.getElementById('checkout-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.remove();
        }
        this.currentRating = 0;
        this.currentTicketCode = null;
    },
    
    formatDateTime(dateTimeStr) {
        if (!dateTimeStr) return 'N/A';
        const date = new Date(dateTimeStr);
        return date.toLocaleString('vi-VN');
    }
};

function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'flex';
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
}

function showToast(message, type) {
    console.log('Toast (' + type + '):', message);
    alert(message);
}

document.addEventListener('DOMContentLoaded', () => {
    CheckoutManager.init();
});

console.log('Checkout Manager loaded - Option C (2 tabs, star icons only)');

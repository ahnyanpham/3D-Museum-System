const CheckoutManager = {
    activeVisits: [],
    groupedVisits: {},
    itemsPerPage: 10,
    searchTerm: '',

    async init() {
        console.log('Checkout Manager initialized');
        this.setupEventListeners();
        await this.loadActiveVisits();
    },

    setupEventListeners() {
        // ===== NÚT RELOAD =====
        const refreshBtn = document.getElementById('refresh-active-visits');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                console.log('Reloading active visits...');
                this.loadActiveVisits();
            });
        }

        // ===== Ô TÌM KIẾM =====
        const searchInput = document.getElementById('search-checkout-customers');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.trim();
                console.log('Search term:', this.searchTerm);
                this.filterAndRender();
            });
        }
    },

    async loadActiveVisits() {
        showLoading();
        try {
            const response = await API.getActiveVisits();
            hideLoading();

            if (response.success) {
                this.activeVisits = response.data || [];
                console.log('Loaded active visits:', this.activeVisits.length);
                this.filterAndRender();
            }
        } catch (error) {
            hideLoading();
            console.error('Error loading active visits:', error);
            showToast('Lỗi tải dữ liệu', 'error');
        }
    },

    filterAndRender() {
        // Filter by search term
        let filtered = this.activeVisits;

        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filtered = this.activeVisits.filter(visit => {
                const name = (visit.customer_name || visit.full_name || '').toLowerCase();
                const phone = (visit.customer_phone || visit.phone || '').toLowerCase();
                const ticketCode = (visit.ticket_code || '').toLowerCase();
                
                return name.includes(term) || 
                       phone.includes(term) || 
                       ticketCode.includes(term);
            });
            console.log('Filtered visits:', filtered.length);
        }

        // Group by customer
        this.groupedVisits = {};
        filtered.forEach(visit => {
            const customerId = visit.customer_id;

            if (!this.groupedVisits[customerId]) {
                this.groupedVisits[customerId] = {
                    customer_name: visit.customer_name || visit.full_name || 'N/A',
                    customer_phone: visit.customer_phone || visit.phone || 'N/A',
                    visits: []
                };
            }

            this.groupedVisits[customerId].visits.push(visit);
        });

        this.renderActiveVisits();
    },

    renderActiveVisits() {
        const container = document.getElementById('active-visits-list');
        if (!container) return;

        if (Object.keys(this.groupedVisits).length === 0) {
            const msg = this.searchTerm 
                ? 'Không tìm thấy kết quả phù hợp' 
                : 'Không có khách đang tham quan';
            container.innerHTML = '<p style="text-align:center;padding:40px;color:#999">' + msg + '</p>';
            return;
        }

        let html = '<div style="margin-bottom:15px;display:flex;gap:10px;align-items:center">';
        html += '<label style="font-weight:500">Hiển thị:</label>';
        html += '<select id="items-per-page-checkout" style="padding:8px;border:1px solid #ddd;border-radius:6px">';
        html += '<option value="10"' + (this.itemsPerPage === 10 ? ' selected' : '') + '>10</option>';
        html += '<option value="50"' + (this.itemsPerPage === 50 ? ' selected' : '') + '>50</option>';
        html += '<option value="100"' + (this.itemsPerPage === 100 ? ' selected' : '') + '>100</option>';
        html += '</select>';
        html += '<span style="color:#666;margin-left:auto">Tổng: ' + Object.keys(this.groupedVisits).length + ' khách</span>';
        html += '</div>';

        const customers = Object.keys(this.groupedVisits);
        customers.forEach(customerId => {
            const group = this.groupedVisits[customerId];
            const visitCount = group.visits.length;
            const customerName = group.customer_name;
            const customerPhone = group.customer_phone;

            html += '<div class="card" style="margin-bottom:15px">';
            html += '<div class="card-header" style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white">';
            html += '<strong>' + customerName + '</strong> - ' + customerPhone + ' | ' + visitCount + ' vé đang tham quan';
            html += '</div>';
            html += '<div class="card-body">';
            html += '<table class="data-table"><thead><tr>';
            html += '<th>Mã vé</th><th>Thời gian vào</th><th>Thời lượng</th><th>Thao tác</th>';
            html += '</tr></thead><tbody>';

            group.visits.forEach(visit => {
                const duration = this.calculateDuration(visit.check_in_time);

                html += '<tr>';
                html += '<td><strong>' + visit.ticket_code + '</strong></td>';
                html += '<td>' + formatDateTime(visit.check_in_time) + '</td>';
                html += '<td>' + duration + '</td>';
                html += '<td><button onclick="CheckoutManager.showCheckoutModal(' + visit.id + ')" class="btn btn-sm btn-danger">Check-out</button></td>';
                html += '</tr>';
            });

            html += '</tbody></table>';
            html += '</div>';
            html += '</div>';
        });

        container.innerHTML = html;

        const selectElement = document.getElementById('items-per-page-checkout');
        if (selectElement) {
            selectElement.addEventListener('change', (e) => {
                this.itemsPerPage = parseInt(e.target.value);
                this.renderActiveVisits();
            });
        }
    },

    calculateDuration(checkInTime) {
        if (!checkInTime) return 'N/A';

        const checkIn = new Date(checkInTime);
        const now = new Date();
        const diffMs = now - checkIn;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 60) {
            return diffMins + ' phút';
        } else {
            const hours = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            return hours + ' giờ ' + mins + ' phút';
        }
    },

    showCheckoutModal(visitId) {
        const visit = this.activeVisits.find(v => v.id === visitId);
        if (!visit) return;

        const customerName = visit.customer_name || visit.full_name || 'N/A';

        const modal = document.getElementById('ticket-modal');
        const detailsDiv = document.getElementById('ticket-details');

        if (!modal || !detailsDiv) return;

        // ===== MODAL HTML với GỢI Ý ĐÁNH GIÁ =====
        detailsDiv.innerHTML = `
            <div style="padding:20px">
                <h3 style="color:#667eea;margin-bottom:20px">Check-out Khách Tham Quan</h3>
                
                <p><strong>Khách hàng:</strong> ${customerName}</p>
                <p><strong>Mã vé:</strong> ${visit.ticket_code}</p>
                <p><strong>Thời gian vào:</strong> ${formatDateTime(visit.check_in_time)}</p>

                <!-- GỢI Ý ĐÁNH GIÁ NHANH -->
                <div style="margin-top:25px;background:#f8f9fa;padding:15px;border-radius:8px;border:1px solid #dee2e6">
                    <label style="display:block;margin-bottom:10px;font-weight:600;color:#333">⚡ Gợi ý đánh giá nhanh:</label>
                    <div style="display:flex;gap:10px;flex-wrap:wrap">
                        <button type="button" class="quick-rating-btn" data-rating="5" data-comment="Rất hài lòng với dịch vụ và không gian trưng bày. Nhân viên nhiệt tình, tận tâm."
                            style="flex:1;min-width:140px;padding:12px;background:white;border:2px solid #dee2e6;border-radius:8px;cursor:pointer;transition:all 0.3s;text-align:center">
                            <span style="color:#fbbf24;font-size:1.3em;display:block">⭐⭐⭐⭐⭐</span>
                            <span style="font-size:0.85em;margin-top:4px;color:#495057;display:block;font-weight:500">Rất hài lòng</span>
                        </button>
                        
                        <button type="button" class="quick-rating-btn" data-rating="3" data-comment="Trải nghiệm ổn, có thể cải thiện thêm về cơ sở vật chất và dịch vụ hỗ trợ."
                            style="flex:1;min-width:140px;padding:12px;background:white;border:2px solid #dee2e6;border-radius:8px;cursor:pointer;transition:all 0.3s;text-align:center">
                            <span style="color:#fbbf24;font-size:1.3em;display:block">⭐⭐⭐</span>
                            <span style="font-size:0.85em;margin-top:4px;color:#495057;display:block;font-weight:500">Bình thường</span>
                        </button>
                        
                        <button type="button" class="quick-rating-btn" data-rating="1" data-comment="Rất không hài lòng. Cần cải thiện nhiều về chất lượng dịch vụ và cơ sở vật chất."
                            style="flex:1;min-width:140px;padding:12px;background:white;border:2px solid #dee2e6;border-radius:8px;cursor:pointer;transition:all 0.3s;text-align:center">
                            <span style="color:#fbbf24;font-size:1.3em;display:block">⭐</span>
                            <span style="font-size:0.85em;margin-top:4px;color:#495057;display:block;font-weight:500">Không hài lòng</span>
                        </button>
                    </div>
                </div>

                <!-- ĐÁNH GIÁ THỦ CÔNG -->
                <div class="form-group" style="margin-top:20px">
                    <label>Đánh giá (1-5 sao) <span style="color:red">*</span></label>
                    <div id="rating-stars" style="font-size:32px;margin:10px 0;cursor:pointer">
                        <span data-rating="1" style="color:#ddd">★</span>
                        <span data-rating="2" style="color:#ddd">★</span>
                        <span data-rating="3" style="color:#ddd">★</span>
                        <span data-rating="4" style="color:#ddd">★</span>
                        <span data-rating="5" style="color:#ddd">★</span>
                    </div>
                </div>

                <div class="form-group">
                    <label>Nhận xét</label>
                    <textarea id="checkout-feedback" class="form-control" rows="3" placeholder="Nhận xét của khách..."></textarea>
                </div>

                <div style="margin-top:20px">
                    <button id="confirm-checkout" class="btn btn-primary" style="width:100%">Xác nhận check-out</button>
                </div>
            </div>
        `;

        modal.classList.add('active');

        let selectedRating = 0;

        // ===== XỬ LÝ GỢI Ý ĐÁNH GIÁ NHANH =====
        const quickBtns = document.querySelectorAll('.quick-rating-btn');
        quickBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const rating = parseInt(this.getAttribute('data-rating'));
                const comment = this.getAttribute('data-comment');

                quickBtns.forEach(b => {
                    b.style.borderColor = '#dee2e6';
                    b.style.background = 'white';
                    b.style.transform = 'none';
                    b.style.boxShadow = 'none';
                });

                this.style.borderColor = '#667eea';
                this.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                this.style.color = 'white';
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 4px 12px rgba(102,126,234,0.3)';
                
                const spans = this.querySelectorAll('span');
                spans.forEach(s => s.style.color = 'white');

                selectedRating = rating;
                updateStarDisplay();

                document.getElementById('checkout-feedback').value = comment;
            });

            btn.addEventListener('mouseenter', function() {
                if (this.style.background !== 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)') {
                    this.style.borderColor = '#667eea';
                    this.style.background = '#f0f0ff';
                    this.style.transform = 'translateY(-2px)';
                    this.style.boxShadow = '0 4px 12px rgba(102,126,234,0.15)';
                }
            });

            btn.addEventListener('mouseleave', function() {
                if (this.style.background !== 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)') {
                    this.style.borderColor = '#dee2e6';
                    this.style.background = 'white';
                    this.style.transform = 'none';
                    this.style.boxShadow = 'none';
                }
            });
        });

        // ===== XỬ LÝ SAO THỦ CÔNG =====
        const stars = document.querySelectorAll('#rating-stars span');
        
        function updateStarDisplay() {
            stars.forEach((s, idx) => {
                s.style.color = idx < selectedRating ? '#fbbf24' : '#ddd';
            });
        }

        stars.forEach(star => {
            star.addEventListener('click', () => {
                selectedRating = parseInt(star.dataset.rating);
                updateStarDisplay();
                
                quickBtns.forEach(b => {
                    b.style.borderColor = '#dee2e6';
                    b.style.background = 'white';
                    b.style.transform = 'none';
                    b.style.boxShadow = 'none';
                    const spans = b.querySelectorAll('span');
                    spans.forEach(s => {
                        if (s.textContent.includes('⭐')) {
                            s.style.color = '#fbbf24';
                        } else {
                            s.style.color = '#495057';
                        }
                    });
                });
            });

            star.addEventListener('mouseenter', () => {
                const rating = parseInt(star.dataset.rating);
                stars.forEach((s, idx) => {
                    s.style.color = idx < rating ? '#fbbf24' : '#ddd';
                });
            });
        });

        document.getElementById('rating-stars').addEventListener('mouseleave', () => {
            updateStarDisplay();
        });

        // ===== XÁC NHẬN CHECKOUT =====
        document.getElementById('confirm-checkout').onclick = async () => {
            if (selectedRating === 0) {
                showToast('Vui lòng chọn đánh giá', 'warning');
                return;
            }

            const feedback = document.getElementById('checkout-feedback').value.trim();

            showLoading();

            try {
                const response = await API.checkoutVisit(visitId, {
                    rating: selectedRating,
                    feedback: feedback
                });

                hideLoading();

                if (response.success) {
                    showToast('Check-out thành công!', 'success');
                    modal.classList.remove('active');
                    await this.loadActiveVisits();
                }
            } catch (error) {
                hideLoading();
                console.error('Checkout error:', error);
                showToast('Lỗi check-out', 'error');
            }
        };

        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.onclick = () => modal.classList.remove('active');
        }
    }
};

console.log('Checkout module loaded');

const HistoryManager = {
    allHistory: [],
    filteredHistory: [],
    currentRating: 'all',
    currentPage: 1,
    itemsPerPage: 10,

    async init() {
        console.log('History Manager initialized');
        this.setupEventListeners();
        await this.loadHistory();
    },

    setupEventListeners() {
        const reloadBtn = document.getElementById('reload-history');
        if (reloadBtn) {
            reloadBtn.addEventListener('click', () => this.loadHistory());
        }

        // ===== SỬA: THÊM EVENT LISTENER CHO DATE INPUT =====
        const dateFromInput = document.getElementById('history-date-from');
        if (dateFromInput) {
            dateFromInput.addEventListener('change', () => {
                console.log('Date changed:', dateFromInput.value);
                this.loadHistory();
            });
        }

        // ===== SỬA: THÊM EVENT LISTENER CHO LIMIT SELECT =====
        const limitSelect = document.getElementById('history-limit');
        if (limitSelect) {
            limitSelect.addEventListener('change', () => {
                console.log('Limit changed:', limitSelect.value);
                this.loadHistory();
            });
        }

        const ratingBtns = document.querySelectorAll('.rating-filter-btn');
        ratingBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                ratingBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterByRating(btn.dataset.rating);
            });
        });
    },

    async loadHistory() {
        const dateFrom = document.getElementById('history-date-from');
        const limit = document.getElementById('history-limit');

        const params = {};
        if (dateFrom && dateFrom.value) {
            params.date_from = dateFrom.value;
            console.log('Loading history from date:', dateFrom.value);
        }
        if (limit && limit.value) {
            params.limit = parseInt(limit.value);
            console.log('Loading history with limit:', limit.value);
        }

        showLoading();

        try {
            const response = await API.getVisitHistory(params);
            hideLoading();

            if (response.success) {
                // CHỈ LẤY VISITS ĐÃ CHECKOUT
                this.allHistory = (response.data || []).filter(v => v.check_out_time);
                this.filteredHistory = [...this.allHistory];

                console.log('Loaded history:', this.allHistory.length, 'visits');

                this.currentRating = 'all';
                this.currentPage = 1;

                // Reset rating filter
                const ratingBtns = document.querySelectorAll('.rating-filter-btn');
                ratingBtns.forEach(btn => {
                    if (btn.dataset.rating === 'all') {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });

                this.renderHistory();
                this.renderStats();
            } else {
                console.error('Failed to load history:', response);
                showToast('Lỗi tải dữ liệu', 'error');
            }
        } catch (error) {
            hideLoading();
            console.error('Error loading history:', error);
            showToast('Lỗi kết nối API', 'error');
        }
    },

    filterByRating(rating) {
        this.currentRating = rating;
        this.currentPage = 1;

        if (rating === 'all') {
            this.filteredHistory = [...this.allHistory];
        } else {
            const ratingNum = parseInt(rating);
            this.filteredHistory = this.allHistory.filter(v => v.rating === ratingNum);
        }

        console.log('Filtered by rating:', rating, '→', this.filteredHistory.length, 'visits');

        this.renderHistory();
        this.renderStats();
    },

    renderHistory() {
        const container = document.getElementById('history-table');
        if (!container) return;

        if (this.filteredHistory.length === 0) {
            container.innerHTML = '<p style="text-align:center;padding:40px;color:#999">Chưa có lịch sử tham quan</p>';
            return;
        }

        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageHistory = this.filteredHistory.slice(start, end);

        let html = '<div style="margin-bottom:15px;display:flex;gap:10px;align-items:center">';
        html += '<label style="font-weight:500">Hiển thị:</label>';
        html += '<select id="items-per-page-history" style="padding:8px;border:1px solid #ddd;border-radius:6px">';
        html += '<option value="10"' + (this.itemsPerPage === 10 ? ' selected' : '') + '>10</option>';
        html += '<option value="50"' + (this.itemsPerPage === 50 ? ' selected' : '') + '>50</option>';
        html += '<option value="100"' + (this.itemsPerPage === 100 ? ' selected' : '') + '>100</option>';
        html += '</select>';
        html += '<span style="color:#666;margin-left:auto">Tổng: ' + this.filteredHistory.length + ' lượt</span>';
        html += '</div>';

        html += '<div class="data-table-container"><table class="data-table"><thead><tr>';
        html += '<th>Mã vé</th><th>Khách hàng</th><th>SĐT</th><th>Loại vé</th><th>Check-in</th><th>Check-out</th><th>Thời lượng</th><th>Đánh giá</th><th>Nhận xét</th>';
        html += '</tr></thead><tbody>';

        pageHistory.forEach(visit => {
            const duration = this.calculateDuration(visit.check_in_time, visit.check_out_time);
            const rating = visit.rating || 0;
            const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);

            html += '<tr>';
            html += '<td><strong>' + (visit.ticket_code || visit.ticket_id || 'N/A') + '</strong></td>';
            html += '<td>' + (visit.customer_name || visit.full_name || 'N/A') + '</td>';
            html += '<td>' + (visit.customer_phone || visit.phone || 'N/A') + '</td>';
            html += '<td>' + (visit.ticket_type_name || visit.ticket_type || 'N/A') + '</td>';
            html += '<td>' + formatDateTime(visit.check_in_time) + '</td>';
            html += '<td>' + formatDateTime(visit.check_out_time) + '</td>';
            html += '<td>' + duration + '</td>';
            html += '<td><span style="color:#fbbf24;font-size:16px">' + stars + '</span></td>';
            html += '<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + (visit.feedback || '-') + '">' + (visit.feedback || '-') + '</td>';
            html += '</tr>';
        });

        html += '</tbody></table></div>';
        html += '<div id="history-pagination" style="margin-top:15px"></div>';

        container.innerHTML = html;

        const selectElement = document.getElementById('items-per-page-history');
        if (selectElement) {
            selectElement.addEventListener('change', (e) => {
                this.itemsPerPage = parseInt(e.target.value);
                this.currentPage = 1;
                this.renderHistory();
            });
        }

        this.renderPagination();
    },

    renderPagination() {
        const container = document.getElementById('history-pagination');
        if (!container) return;

        const totalPages = Math.ceil(this.filteredHistory.length / this.itemsPerPage);

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '<div style="display:flex;gap:5px;justify-content:center">';

        if (this.currentPage > 1) {
            html += '<button onclick="HistoryManager.goToPage(' + (this.currentPage - 1) + ')" class="btn btn-sm">Trước</button>';
        }

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                const activeClass = i === this.currentPage ? 'btn-primary' : 'btn-secondary';
                html += '<button onclick="HistoryManager.goToPage(' + i + ')" class="btn btn-sm ' + activeClass + '">' + i + '</button>';
            }
        }

        if (this.currentPage < totalPages) {
            html += '<button onclick="HistoryManager.goToPage(' + (this.currentPage + 1) + ')" class="btn btn-sm">Sau</button>';
        }

        html += '</div>';
        container.innerHTML = html;
    },

    goToPage(page) {
        this.currentPage = page;
        this.renderHistory();
    },

    renderStats() {
        const statsDiv = document.getElementById('history-stats');
        if (!statsDiv) return;

        const totalVisits = this.filteredHistory.length;

        let avgRating = 0;
        const ratedVisits = this.filteredHistory.filter(v => v.rating);
        if (ratedVisits.length > 0) {
            const totalRating = ratedVisits.reduce((sum, v) => sum + v.rating, 0);
            avgRating = (totalRating / ratedVisits.length).toFixed(1);
        }

        statsDiv.innerHTML = '<div class="stats-grid" style="margin:20px 0"><div class="stat-card"><div class="stat-label">Tổng lượt</div><div class="stat-value">' + totalVisits + '</div></div><div class="stat-card"><div class="stat-label">Hoàn thành</div><div class="stat-value">' + totalVisits + '</div></div><div class="stat-card"><div class="stat-label">Đánh giá TB</div><div class="stat-value">' + avgRating + ' <span style="color:#fbbf24;font-size:20px">★</span></div></div></div>';
    },

    calculateDuration(checkIn, checkOut) {
        if (!checkIn || !checkOut) return 'N/A';

        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const diffMs = end - start;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 60) {
            return diffMins + ' phút';
        } else {
            const hours = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            return hours + ' giờ ' + mins + ' phút';
        }
    }
};

console.log('History module loaded');

const DashboardManager = {
    revenueChart: null,
    ticketTypesChart: null,
    currentTimePeriod: 7,
    
    async init() {
        console.log('Dashboard Manager initialized');
        this.setupTimeFilters();
        await this.loadStatistics();
        await this.loadCharts();
    },
    
    setupTimeFilters() {
        const filterBtns = document.querySelectorAll('.time-filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTimePeriod = parseInt(btn.dataset.days);
                this.loadRevenueChart();
            });
        });
    },
    
    async loadStatistics() {
        try {
            const response = await API.getStatistics();
            console.log('Statistics response:', response);
            
            if (response.success && response.data && response.data.overview) {
                const stats = response.data.overview;
                
                document.getElementById('total-tickets').textContent = stats.total_tickets || 0;
                document.getElementById('total-revenue').textContent = formatCurrency(stats.total_revenue || 0);
                document.getElementById('total-customers').textContent = stats.total_customers || 0;
                document.getElementById('total-visits').textContent = stats.total_visits || 0;
            }
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    },
    
    async loadCharts() {
        await this.loadRevenueChart();
        await this.loadTicketTypesChart();
    },
    
    async loadRevenueChart() {
        try {
            const response = await API.getStatistics();
            
            const ctx = document.getElementById('revenue-chart');
            if (!ctx) return;
            
            if (this.revenueChart) {
                this.revenueChart.destroy();
            }
            
            const labels = [];
            const data = [];
            
            if (response.success && response.data && response.data.daily_stats) {
                const dailyStats = response.data.daily_stats.slice().reverse();
                const limitedStats = dailyStats.slice(-this.currentTimePeriod);
                
                limitedStats.forEach(item => {
                    const date = new Date(item.date);
                    if (this.currentTimePeriod === 1) {
                        labels.push('Hôm nay');
                    } else if (this.currentTimePeriod <= 30) {
                        labels.push(date.getDate() + '/' + (date.getMonth() + 1));
                    } else {
                        labels.push(date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear().toString().substr(-2));
                    }
                    data.push(item.revenue || 0);
                });
            }
            
            if (labels.length === 0) {
                for (let i = this.currentTimePeriod - 1; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    if (this.currentTimePeriod === 1) {
                        labels.push('Hôm nay');
                    } else {
                        labels.push(date.getDate() + '/' + (date.getMonth() + 1));
                    }
                    data.push(0);
                }
            }
            
            this.revenueChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Doanh thu (VNĐ)',
                        data: data,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        pointBackgroundColor: '#667eea',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return 'Doanh thu: ' + formatCurrency(context.parsed.y);
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    if (value >= 1000000) {
                                        return (value / 1000000).toFixed(1) + 'M';
                                    } else if (value >= 1000) {
                                        return (value / 1000) + 'k';
                                    }
                                    return value;
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error loading revenue chart:', error);
        }
    },
    
    async loadTicketTypesChart() {
        try {
            const response = await API.getStatistics();
            
            const ctx = document.getElementById('ticket-types-chart');
            if (!ctx) return;
            
            if (this.ticketTypesChart) {
                this.ticketTypesChart.destroy();
            }
            
            let labels = [];
            let data = [];
            const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];
            
            if (response.success && response.data && response.data.ticket_stats) {
                response.data.ticket_stats.forEach(item => {
                    labels.push(item.ticket_type);
                    data.push(item.count);
                });
            }
            
            if (labels.length === 0) {
                labels = ['Chưa có dữ liệu'];
                data = [1];
            }
            
            this.ticketTypesChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: colors.slice(0, labels.length),
                        borderWidth: 3,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 15,
                                font: {
                                    size: 13
                                },
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                    return label + ': ' + value + ' vé (' + percentage + '%)';
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error loading ticket types chart:', error);
        }
    }
};

console.log('Dashboard module loaded');

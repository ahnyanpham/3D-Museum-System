const API = {
    async request(endpoint, options = {}) {
        const url = CONFIG.API_BASE_URL + endpoint;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Lỗi kết nối');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            showToast(error.message || 'Lỗi kết nối server', 'error');
            throw error;
        }
    },

    getMuseumInfo() {
        return this.request('/api/museum-info');
    },

    getTicketTypes() {
        return this.request('/api/ticket-types');
    },

    getCustomers(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request('/api/customers?' + query);
    },

    getCustomerByPhone(phone) {
        return this.request('/api/customers/search?phone=' + encodeURIComponent(phone));
    },

    createCustomer(data) {
        return this.request('/api/customers', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    getTickets(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request('/api/tickets?' + query);
    },

    createTicket(data) {
        return this.request('/api/tickets', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    checkinTicket(ticketCode) {
        return this.request('/api/tickets/' + ticketCode + '/checkin', {
            method: 'POST'
        });
    },

    getActiveVisits() {
        return this.request('/api/visits/active');
    },

    checkoutVisit(visitId, data) {
        return this.request('/api/visits/' + visitId + '/checkout', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    getVisitHistory(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request('/api/visit-history?' + query);
    },

    getMonuments() {
        return this.request('/api/monuments');
    },

    getAttractions(floor = null) {
        const query = floor ? '?floor=' + floor : '';
        return this.request('/api/attractions' + query);
    },

    getStatistics() {
        return this.request('/api/statistics');
    }
};

console.log('API module loaded');

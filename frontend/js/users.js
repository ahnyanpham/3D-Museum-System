const UserManager = {
    currentTab: 'internal',
    currentFilter: '',
    allUsers: [],
    roles: [],

    init() {
        this.setupEventListeners();
        this.loadRoles();
        this.loadUsers('internal');
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

                if (!data.data.permissions.includes('all')) {
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
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        document.getElementById('search-internal').addEventListener('input', (e) => {
            this.filterUsers('internal', e.target.value);
        });

        document.getElementById('search-customer').addEventListener('input', (e) => {
            this.filterUsers('customer', e.target.value);
        });

        document.getElementById('refresh-internal').addEventListener('click', () => {
            this.loadUsers('internal');
        });

        document.getElementById('refresh-customer').addEventListener('click', () => {
            this.loadUsers('customer');
        });

        document.getElementById('change-role-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitRoleChange();
        });

        document.getElementById('change-password-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitPasswordChange();
        });
    },

    switchTab(tab) {
        this.currentTab = tab;

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tab}-tab`);
        });

        this.loadUsers(tab);
    },

    async loadRoles() {
        try {
            const response = await fetch('/api/roles', {
                credentials: 'include'
            });
            const data = await response.json();

            if (data.success) {
                this.roles = data.data;
            }
        } catch (error) {
            console.error('Load roles error:', error);
        }
    },

    async loadUsers(userType) {
        showLoading();
        try {
            const response = await fetch(`/api/admin/users?user_type=${userType}`, {
                credentials: 'include'
            });
            const data = await response.json();

            if (data.success) {
                this.allUsers = data.data || [];
                this.renderUsers(userType, this.allUsers);
                this.updateCount(userType, this.allUsers.length);
            } else {
                showToast(data.message || 'Không thể tải dữ liệu', 'error');
            }
        } catch (error) {
            console.error('Load users error:', error);
            showToast('Lỗi kết nối', 'error');
        } finally {
            hideLoading();
        }
    },

    filterUsers(userType, searchText) {
        const filtered = this.allUsers.filter(user => {
            const searchLower = searchText.toLowerCase();
            return (
                (user.username || '').toLowerCase().includes(searchLower) ||
                (user.fullname || '').toLowerCase().includes(searchLower) ||
                (user.email || '').toLowerCase().includes(searchLower)
            );
        });

        this.renderUsers(userType, filtered);
        this.updateCount(userType, filtered.length);
    },

    renderUsers(userType, users) {
        const tbody = document.getElementById(`${userType}-users-tbody`);
        
        if (users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="${userType === 'internal' ? 8 : 7}" class="empty-state">
                        <i class="fas fa-users"></i>
                        <p>Không có dữ liệu</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = users.map(user => {
            if (userType === 'internal') {
                return `
                    <tr>
                        <td>${user.user_id}</td>
                        <td>${user.username}</td>
                        <td>${user.fullname || '-'}</td>
                        <td>${user.email || '-'}</td>
                        <td>${user.phone || '-'}</td>
                        <td>${this.renderRoleBadge(user.role_name)}</td>
                        <td>${this.renderStatusBadge(user.is_active, user.is_online)}</td>
                        <td>
                            <button class="dropdown-btn" onclick="UserManager.openActionsMenu(${user.user_id}, '${user.username}', ${user.role_id}, ${user.is_active})">
                                Thao tác
                            </button>
                        </td>
                    </tr>
                `;
            } else {
                return `
                    <tr>
                        <td>${user.user_id}</td>
                        <td>${user.username}</td>
                        <td>${user.fullname || '-'}</td>
                        <td>${user.email || '-'}</td>
                        <td>${user.phone || '-'}</td>
                        <td>${this.renderStatusBadge(user.is_active, user.is_online)}</td>
                        <td>
                            <button class="dropdown-btn" onclick="UserManager.openActionsMenu(${user.user_id}, '${user.username}', ${user.role_id}, ${user.is_active})">
                                Thao tác
                            </button>
                        </td>
                    </tr>
                `;
            }
        }).join('');
    },

    renderRoleBadge(roleName) {
        const roleMap = {
            'Admin': 'role-admin',
            'Manager': 'role-manager',
            'Staff': 'role-staff',
            'Tour Guide': 'role-guide',
            'Security': 'role-security',
            'Customer': 'role-customer'
        };

        const className = roleMap[roleName] || 'role-customer';
        return `<span class="role-badge ${className}">${roleName || 'Unknown'}</span>`;
    },

    renderStatusBadge(isActive, isOnline) {
        // Handle multiple possible types: number, string, boolean
        const active = parseInt(isActive);
        
        // 3 states:
        // 1. Đang hoạt động (IS_ACTIVE=1 + online) - Green
        // 2. Chưa đăng nhập (IS_ACTIVE=1 + offline) - Yellow
        // 3. Đã vô hiệu hóa (IS_ACTIVE=0) - Red
        
        if (active === 1 || isActive === true || isActive === '1') {
            if (isOnline) {
                return '<span class="status-badge status-online">🟢 Đang hoạt động</span>';
            } else {
                return '<span class="status-badge status-offline">🟡 Chưa đăng nhập</span>';
            }
        } else {
            return '<span class="status-badge status-inactive">🔴 Đã vô hiệu hóa</span>';
        }
    },

    updateCount(userType, count) {
        const countElem = document.getElementById(`${userType}-count`);
        if (countElem) {
            const label = userType === 'internal' ? 'người dùng' : 'khách hàng';
            countElem.textContent = `Tổng: ${count} ${label}`;
        }
    },

    openActionsMenu(userId, username, roleId, isActive) {
        // Convert isActive to number (may come as string from onclick)
        const activeStatus = parseInt(isActive);
        
        // Build actions based on user status
        const actions = [
            { label: 'Thay đổi vai trò', action: () => this.openChangeRoleModal(userId, username, roleId) },
            { label: 'Đổi mật khẩu', action: () => this.openChangePasswordModal(userId, username) }
        ];
        
        // Add toggle active/inactive option
        if (activeStatus === 1) {
            actions.push({ 
                label: '🔴 Vô hiệu hóa', 
                action: () => this.toggleUserActive(userId, username, 1),
                style: 'color: #dc3545; font-weight: 600'
            });
        } else {
            actions.push({ 
                label: '🟢 Kích hoạt', 
                action: () => this.toggleUserActive(userId, username, 0),
                style: 'color: #28a745; font-weight: 600'
            });
        }
        
        actions.push({ 
            label: '🗑️ Xóa người dùng', 
            action: () => this.openDeleteModal(userId, username),
            style: 'color: #dc3545'
        });

        // Check if menu already exists - if so, close it with slide up
        const existingMenu = document.querySelector('[data-action-menu]');
        if (existingMenu) {
            // Slide up animation before removing
            existingMenu.style.animation = 'slideUp 0.2s ease-out';
            setTimeout(() => existingMenu.remove(), 200);
            return; // Don't open new menu if clicking same button
        }

        const actionMenu = document.createElement('div');
        actionMenu.style.cssText = `
            position: fixed;
            background: white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border-radius: 8px;
            padding: 0.5rem;
            z-index: 1000;
            min-width: 200px;
            animation: slideDown 0.2s ease-out;
            transform-origin: top;
        `;
        
        actions.forEach(item => {
            const btn = document.createElement('button');
            btn.textContent = item.label;
            btn.style.cssText = `display:block;width:100%;padding:0.7rem 1rem;border:none;background:none;text-align:left;cursor:pointer;border-radius:6px;transition:all 0.3s;font-size:14px;${item.style || ''}`;
            btn.onmouseover = () => btn.style.background = '#f0f0f0';
            btn.onmouseout = () => btn.style.background = 'none';
            btn.onclick = () => {
                item.action();
                // Slide up before closing
                actionMenu.style.animation = 'slideUp 0.2s ease-out';
                setTimeout(() => actionMenu.remove(), 200);
            };
            actionMenu.appendChild(btn);
        });

        actionMenu.dataset.actionMenu = true;
        document.body.appendChild(actionMenu);

        // Position dropdown below button
        const rect = event.target.getBoundingClientRect();
        actionMenu.style.top = `${rect.bottom + 5}px`;
        actionMenu.style.left = `${rect.left}px`;

        // Close menu when clicking outside with slide up animation
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!actionMenu.contains(e.target) && e.target !== event.target) {
                    // Slide up animation
                    actionMenu.style.animation = 'slideUp 0.2s ease-out';
                    setTimeout(() => actionMenu.remove(), 200);
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 0);
    },

    openChangeRoleModal(userId, username, currentRoleId) {
        document.getElementById('role-user-id').value = userId;
        document.getElementById('role-username').value = username;

        const roleSelect = document.getElementById('new-role');
        roleSelect.innerHTML = '<option value="">-- Chọn vai trò --</option>';

        const filteredRoles = this.currentTab === 'internal' 
            ? this.roles.filter(r => r.role_id !== 6)
            : this.roles.filter(r => r.role_id === 6);

        filteredRoles.forEach(role => {
            const option = document.createElement('option');
            option.value = role.role_id;
            option.textContent = `${role.role_name} - ${role.description}`;
            if (role.role_id === currentRoleId) {
                option.selected = true;
            }
            roleSelect.appendChild(option);
        });

        openModal('change-role-modal');
    },

    async submitRoleChange() {
        const userId = document.getElementById('role-user-id').value;
        const newRoleId = document.getElementById('new-role').value;

        if (!newRoleId) {
            showToast('Vui lòng chọn vai trò', 'error');
            return;
        }

        showLoading();
        try {
            const response = await fetch(`/api/admin/users/${userId}/change-role`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ role_id: parseInt(newRoleId) })
            });

            const data = await response.json();

            if (data.success) {
                showToast('Thay đổi vai trò thành công', 'success');
                closeModal('change-role-modal');
                this.loadUsers(this.currentTab);
            } else {
                showToast(data.message || 'Thay đổi vai trò thất bại', 'error');
            }
        } catch (error) {
            console.error('Change role error:', error);
            showToast('Lỗi kết nối', 'error');
        } finally {
            hideLoading();
        }
    },

    async toggleUserActive(userId, username, currentStatus) {
        const action = currentStatus === 1 ? 'vô hiệu hóa' : 'kích hoạt';
        const confirm = window.confirm(`Bạn có chắc muốn ${action} người dùng "${username}"?`);
        
        if (!confirm) return;
        
        showLoading();
        try {
            const response = await fetch(`/api/admin/users/${userId}/toggle-active`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                showToast(`Đã ${action} người dùng thành công`, 'success');
                this.loadUsers(this.currentTab);
            } else {
                showToast(data.message || `${action} thất bại`, 'error');
            }
        } catch (error) {
            console.error('Toggle active error:', error);
            showToast('Lỗi kết nối', 'error');
        } finally {
            hideLoading();
        }
    },

    openChangePasswordModal(userId, username) {
        document.getElementById('password-user-id').value = userId;
        document.getElementById('password-username').value = username;
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';

        openModal('change-password-modal');
    },

    async submitPasswordChange() {
        const userId = document.getElementById('password-user-id').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (newPassword.length < 6) {
            showToast('Mật khẩu phải có ít nhất 6 ký tự', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('Mật khẩu xác nhận không khớp', 'error');
            return;
        }

        showLoading();
        try {
            const response = await fetch(`/api/admin/users/${userId}/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ new_password: newPassword })
            });

            const data = await response.json();

            if (data.success) {
                showToast('Đổi mật khẩu thành công', 'success');
                closeModal('change-password-modal');
            } else {
                showToast(data.message || 'Đổi mật khẩu thất bại', 'error');
            }
        } catch (error) {
            console.error('Change password error:', error);
            showToast('Lỗi kết nối', 'error');
        } finally {
            hideLoading();
        }
    },

    openDeleteModal(userId, username) {
        document.getElementById('delete-user-id').value = userId;
        document.getElementById('delete-username').textContent = username;
        openModal('delete-modal');
    }
};

async function confirmDelete() {
    const userId = document.getElementById('delete-user-id').value;

    showLoading();
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
            showToast('Xóa người dùng thành công', 'success');
            closeModal('delete-modal');
            UserManager.loadUsers(UserManager.currentTab);
        } else {
            showToast(data.message || 'Xóa người dùng thất bại', 'error');
        }
    } catch (error) {
        console.error('Delete user error:', error);
        showToast('Lỗi kết nối', 'error');
    } finally {
        hideLoading();
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
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
    if (!toast || !toastMessage) return;
    
    toast.className = `toast ${type} active`;
    toastMessage.textContent = message;
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

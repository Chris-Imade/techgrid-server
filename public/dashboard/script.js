// Dashboard JavaScript
class TechGridDashboard {
    constructor() {
        this.currentSection = 'overview';
        this.currentPage = { contacts: 1, registrations: 1, newsletter: 1 };
        this.currentFilters = { contacts: {}, registrations: {}, newsletter: {} };
        this.editingRecord = null;
        this.confirmCallback = null;
        
        this.init();
    }

    init() {
        try {
            console.log('🚀 Initializing TechGrid Dashboard...');
            this.setupEventListeners();
            this.loadOverview();
            this.updateLastUpdated();
            console.log('✅ Dashboard initialization complete');
        } catch (error) {
            console.error('❌ Dashboard initialization failed:', error);
            this.showError('Dashboard initialization failed');
        }
    }

    setupEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.switchSection(section);
            });
        });

        // Search inputs
        ['contacts', 'registrations', 'newsletter'].forEach(section => {
            const searchInput = document.getElementById(`${section}-search`);
            if (searchInput) {
                searchInput.addEventListener('input', this.debounce(() => {
                    this.currentPage[section] = 1;
                    this.loadSectionData(section);
                }, 500));
            }

            // Filter selects
            const filters = document.querySelectorAll(`#${section}-section select`);
            filters.forEach(filter => {
                filter.addEventListener('change', () => {
                    this.currentPage[section] = 1;
                    this.loadSectionData(section);
                });
            });
        });

        // Modal close events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
                this.closeConfirmModal();
            }
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeConfirmModal();
            }
        });
    }

    switchSection(section) {
        // Update sidebar
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.remove('active');
        });
        document.getElementById(`${section}-section`).classList.add('active');

        // Page title removed per user request

        this.currentSection = section;

        // Load section data
        if (section !== 'overview') {
            this.loadSectionData(section);
        }
    }

    async loadOverview() {
        console.log('📊 Loading dashboard overview...');
        this.showLoading();
        try {
            const response = await fetch('/dashboard/api/overview');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();

            if (data.success && data.data) {
                console.log('✅ Overview data loaded successfully');
                this.updateOverviewStats(data.data.statistics);
                this.updateRecentActivity(data.data.recentActivity);
                this.updateSidebarCounts(data.data.statistics);
            } else {
                console.error('❌ Invalid response data:', data);
                this.showError('Failed to load dashboard data', 'Loading Error');
            }
        } catch (error) {
            console.error('❌ Failed to load overview:', error);
            this.showError('Failed to load dashboard overview. Please refresh the page.', 'Connection Error');
        } finally {
            this.hideLoading();
        }
    }

    updateOverviewStats(stats) {
        try {
            const totalEmails = (stats.contacts?.total || 0) + (stats.newsletter?.total || 0);
            
            const elements = {
                'total-contacts': stats.contacts?.total || 0,
                'pending-contacts': stats.contacts?.pending || 0,
                'processed-contacts': stats.contacts?.processed || 0,
                'total-registrations': stats.registrations?.total || 0,
                'registered-count': stats.registrations?.registered || 0,
                'confirmed-count': stats.registrations?.confirmed || 0,
                'total-newsletter': stats.newsletter?.total || 0,
                'active-subscribers': stats.newsletter?.active || 0,
                'unsubscribed-count': stats.newsletter?.unsubscribed || 0,
                'total-emails': totalEmails,
                'confirmations-sent': stats.registrations?.confirmationsSent || 0,
                'welcomes-sent': stats.newsletter?.welcomesSent || 0
            };
            
            Object.entries(elements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = value || 0;
                } else {
                    console.warn(`Element with ID '${id}' not found in DOM`);
                }
            });
        } catch (error) {
            console.error('Error updating overview stats:', error);
        }
    }

    updateSidebarCounts(stats) {
        try {
            const contactsCount = document.getElementById('contacts-count');
            const registrationsCount = document.getElementById('registrations-count');
            const newsletterCount = document.getElementById('newsletter-count');
            
            if (contactsCount) contactsCount.textContent = stats.contacts?.total || 0;
            if (registrationsCount) registrationsCount.textContent = stats.registrations?.total || 0;
            if (newsletterCount) newsletterCount.textContent = stats.newsletter?.total || 0;
        } catch (error) {
            console.error('Error updating sidebar counts:', error);
        }
    }

    updateRecentActivity(activity) {
        // Recent contacts
        const contactsContainer = document.getElementById('recent-contacts');
        if (contactsContainer) {
            contactsContainer.innerHTML = '';
            activity.contacts.forEach(contact => {
                const item = this.createActivityItem(
                    contact.name,
                    contact.email,
                    contact.subject,
                    contact.status,
                    new Date(contact.metadata.timestamp)
                );
                contactsContainer.appendChild(item);
            });
        }

        // Recent registrations
        const registrationsContainer = document.getElementById('recent-registrations');
        if (registrationsContainer) {
            registrationsContainer.innerHTML = '';
            activity.registrations.forEach(reg => {
                const item = this.createActivityItem(
                    `${reg.firstName} ${reg.lastName}`,
                    reg.email,
                    reg.registrationNumber,
                    reg.metadata.status,
                    new Date(reg.metadata.timestamp)
                );
                registrationsContainer.appendChild(item);
            });
        }

        // Recent newsletter
        const newsletterContainer = document.getElementById('recent-newsletter');
        if (newsletterContainer) {
            newsletterContainer.innerHTML = '';
            activity.newsletter.forEach(sub => {
                const item = this.createActivityItem(
                    sub.email,
                    '',
                    sub.metadata.sourcePage || 'Direct',
                    sub.metadata.status,
                    new Date(sub.metadata.timestamp)
                );
                newsletterContainer.appendChild(item);
            });
        }
    }

    createActivityItem(title, subtitle, detail, status, date) {
        const item = document.createElement('div');
        item.className = 'activity-item';
        
        item.innerHTML = `
            <div class="activity-info">
                <strong>${title}</strong>
                <small>${subtitle}</small>
                <small>${detail} • ${this.formatDate(date)}</small>
            </div>
            <span class="activity-status status-${status}">${status}</span>
        `;
        
        return item;
    }

    async loadSectionData(section) {
        this.showLoading();
        try {
            const params = new URLSearchParams({
                page: this.currentPage[section],
                limit: 10,
                ...this.getCurrentFilters(section)
            });

            const response = await fetch(`/dashboard/api/${section}?${params}`);
            const data = await response.json();

            if (data.success) {
                this.renderTable(section, data.data);
                this.renderPagination(section, data.pagination);
            }
        } catch (error) {
            console.error(`Failed to load ${section}:`, error);
            this.showError(`Failed to load ${section} data`);
        } finally {
            this.hideLoading();
        }
    }

    getCurrentFilters(section) {
        const filters = {};
        const sectionElement = document.getElementById(`${section}-section`);
        
        // Search
        const searchInput = sectionElement.querySelector(`#${section}-search`);
        if (searchInput && searchInput.value) {
            filters.search = searchInput.value;
        }

        // Other filters
        const filterSelects = sectionElement.querySelectorAll('select');
        filterSelects.forEach(select => {
            if (select.value) {
                const filterName = select.id.replace(`${section}-`, '').replace('-filter', '');
                filters[filterName] = select.value;
            }
        });

        return filters;
    }

    renderTable(section, data) {
        const tbody = document.getElementById(`${section}-tbody`);
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="100%" class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <h3>No records found</h3>
                        <p>No ${section} match your current filters.</p>
                    </td>
                </tr>
            `;
            return;
        }

        data.forEach(record => {
            const row = this.createTableRow(section, record);
            tbody.appendChild(row);
        });
    }

    createTableRow(section, record) {
        const row = document.createElement('tr');
        
        switch (section) {
            case 'contacts':
                row.innerHTML = `
                    <td>${record.name}</td>
                    <td>${record.email}</td>
                    <td>${record.phone}</td>
                    <td title="${record.message}">${this.truncate(record.subject, 30)}</td>
                    <td><span class="status-badge status-${record.status}">${record.status}</span></td>
                    <td>${this.formatDate(new Date(record.metadata.timestamp))}</td>
                    <td class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="editRecord('contacts', '${record.contactId}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteRecord('contacts', '${record.contactId}', '${record.name.replace(/'/g, "\\'")}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                `;
                break;

            case 'registrations':
                const isInNewsletter = record.metadata.inNewsletter;
                row.innerHTML = `
                    <td>${record.registrationNumber}</td>
                    <td>${record.firstName} ${record.lastName}</td>
                    <td>${record.email}</td>
                    <td>${record.company || 'N/A'}</td>
                    <td><span class="status-badge status-${record.experience}">${record.experience}</span></td>
                    <td><span class="status-badge status-${record.metadata.status}">${record.metadata.status}</span></td>
                    <td>${this.formatDate(new Date(record.metadata.timestamp))}</td>
                    <td class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="editRecord('registrations', '${record.registrationId}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="updateStatus('registrations', '${record.registrationId}')">
                            <i class="fas fa-flag"></i> Status
                        </button>
                        ${!isInNewsletter ? 
                            `<button class="btn btn-sm btn-success" onclick="addToNewsletter('${record.registrationId}', '${record.email}')">
                                <i class="fas fa-plus"></i> Add to Newsletter
                            </button>` : 
                            `<span class="badge bg-success"><i class="fas fa-check"></i> In Newsletter</span>`
                        }
                        <button class="btn btn-sm btn-danger" onclick="deleteRecord('registrations', '${record.registrationId}', '${record.firstName} ${record.lastName}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                `;
                break;

            case 'newsletter':
                row.innerHTML = `
                    <td>${record.email}</td>
                    <td><span class="status-badge status-${record.metadata.status}">${record.metadata.status}</span></td>
                    <td><span class="bool-badge bool-${record.isActive}">${record.isActive ? 'Yes' : 'No'}</span></td>
                    <td>${record.metadata.sourcePage || 'Direct'}</td>
                    <td>${this.formatDate(new Date(record.metadata.timestamp))}</td>
                    <td class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="editRecord('newsletter', '${record.subscriptionId}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        ${record.isActive ? 
                            `<button class="btn btn-sm btn-warning" onclick="unsubscribeNewsletter('${record.subscriptionId}', '${record.email}')">
                                <i class="fas fa-user-times"></i> Unsubscribe
                            </button>` : 
                            `<button class="btn btn-sm btn-success" onclick="resubscribeNewsletter('${record.subscriptionId}', '${record.email}')">
                                <i class="fas fa-user-plus"></i> Resubscribe
                            </button>`
                        }
                        <button class="btn btn-sm btn-danger" onclick="deleteRecord('newsletter', '${record.subscriptionId}', '${record.email}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                `;
                break;
        }

        return row;
    }

    renderPagination(section, pagination) {
        const container = document.getElementById(`${section}-pagination`);
        container.innerHTML = '';

        if (pagination.pages <= 1) return;

        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.textContent = 'Previous';
        prevBtn.disabled = pagination.page === 1;
        prevBtn.onclick = () => this.changePage(section, pagination.page - 1);
        container.appendChild(prevBtn);

        // Page numbers
        const startPage = Math.max(1, pagination.page - 2);
        const endPage = Math.min(pagination.pages, pagination.page + 2);

        if (startPage > 1) {
            const firstBtn = document.createElement('button');
            firstBtn.textContent = '1';
            firstBtn.onclick = () => this.changePage(section, 1);
            container.appendChild(firstBtn);

            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.className = 'pagination-ellipsis';
                container.appendChild(ellipsis);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = i === pagination.page ? 'active' : '';
            pageBtn.onclick = () => this.changePage(section, i);
            container.appendChild(pageBtn);
        }

        if (endPage < pagination.pages) {
            if (endPage < pagination.pages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.className = 'pagination-ellipsis';
                container.appendChild(ellipsis);
            }

            const lastBtn = document.createElement('button');
            lastBtn.textContent = pagination.pages;
            lastBtn.onclick = () => this.changePage(section, pagination.pages);
            container.appendChild(lastBtn);
        }

        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Next';
        nextBtn.disabled = pagination.page === pagination.pages;
        nextBtn.onclick = () => this.changePage(section, pagination.page + 1);
        container.appendChild(nextBtn);

        // Page info
        const info = document.createElement('div');
        info.className = 'pagination-info';
        info.textContent = `Showing ${((pagination.page - 1) * pagination.limit) + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} records`;
        container.appendChild(info);
    }

    changePage(section, page) {
        this.currentPage[section] = page;
        this.loadSectionData(section);
    }

    async editRecord(section, id) {
        this.showLoading();
        try {
            const response = await fetch(`/dashboard/api/${section}/${id}`);
            const data = await response.json();

            if (data.success) {
                this.editingRecord = { section, id, data: data.data };
                this.showEditModal(section, data.data);
            }
        } catch (error) {
            console.error('Failed to load record:', error);
            this.showError('Failed to load record for editing');
        } finally {
            this.hideLoading();
        }
    }

    showEditModal(section, record) {
        const modal = document.getElementById('edit-modal');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');

        title.textContent = `Edit ${section.slice(0, -1).charAt(0).toUpperCase() + section.slice(1, -1)}`;
        body.innerHTML = this.generateEditForm(section, record);
        
        modal.classList.add('show');
    }

    showAddModal(section) {
        const modal = document.getElementById('edit-modal');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');

        title.textContent = `Add New ${section.slice(0, -1).charAt(0).toUpperCase() + section.slice(1, -1)}`;
        body.innerHTML = this.generateAddForm(section);
        
        modal.classList.add('show');
    }

    generateEditForm(section, record) {
        switch (section) {
            case 'contacts':
                return `
                    <div class="form-row">
                        <div class="form-group">
                            <label>Name</label>
                            <input type="text" id="edit-name" value="${record.name}" required>
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="edit-email" value="${record.email}" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Phone</label>
                            <input type="text" id="edit-phone" value="${record.phone}" required>
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <select id="edit-status">
                                <option value="pending" ${record.status === 'pending' ? 'selected' : ''}>Pending</option>
                                <option value="processed" ${record.status === 'processed' ? 'selected' : ''}>Processed</option>
                                <option value="responded" ${record.status === 'responded' ? 'selected' : ''}>Responded</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Subject</label>
                        <input type="text" id="edit-subject" value="${record.subject}" required>
                    </div>
                    <div class="form-group">
                        <label>Message</label>
                        <textarea id="edit-message" required>${record.message}</textarea>
                    </div>
                `;

            case 'registrations':
                return `
                    <div class="form-row">
                        <div class="form-group">
                            <label>First Name</label>
                            <input type="text" id="edit-firstName" value="${record.firstName}" required>
                        </div>
                        <div class="form-group">
                            <label>Last Name</label>
                            <input type="text" id="edit-lastName" value="${record.lastName}" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="edit-email" value="${record.email}" required>
                        </div>
                        <div class="form-group">
                            <label>Phone</label>
                            <input type="text" id="edit-phone" value="${record.phone}" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Company</label>
                            <input type="text" id="edit-company" value="${record.company || ''}">
                        </div>
                        <div class="form-group">
                            <label>Job Title</label>
                            <input type="text" id="edit-jobTitle" value="${record.jobTitle || ''}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Experience Level</label>
                        <select id="edit-experience" required>
                            <option value="beginner" ${record.experience === 'beginner' ? 'selected' : ''}>Beginner</option>
                            <option value="intermediate" ${record.experience === 'intermediate' ? 'selected' : ''}>Intermediate</option>
                            <option value="advanced" ${record.experience === 'advanced' ? 'selected' : ''}>Advanced</option>
                            <option value="expert" ${record.experience === 'expert' ? 'selected' : ''}>Expert</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Interests</label>
                        <div class="checkbox-group">
                            ${['ai-trading', 'risk-management', 'fraud-detection', 'robo-advisors', 'regulatory-compliance'].map(interest => `
                                <div class="checkbox-item">
                                    <input type="checkbox" id="interest-${interest}" value="${interest}" ${record.interests.includes(interest) ? 'checked' : ''}>
                                    <label for="interest-${interest}">${interest.replace('-', ' ').toUpperCase()}</label>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Expectations</label>
                        <textarea id="edit-expectations">${record.expectations || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <div class="checkbox-item">
                            <input type="checkbox" id="edit-newsletter" ${record.newsletter ? 'checked' : ''}>
                            <label for="edit-newsletter">Subscribe to Newsletter</label>
                        </div>
                    </div>
                `;

            case 'newsletter':
                return `
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="edit-email" value="${record.email}" required>
                    </div>
                    <div class="form-group">
                        <div class="checkbox-item">
                            <input type="checkbox" id="edit-isActive" ${record.isActive ? 'checked' : ''}>
                            <label for="edit-isActive">Active Subscription</label>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Email Frequency</label>
                        <select id="edit-frequency">
                            <option value="daily" ${record.preferences?.frequency === 'daily' ? 'selected' : ''}>Daily</option>
                            <option value="weekly" ${record.preferences?.frequency === 'weekly' ? 'selected' : ''}>Weekly</option>
                            <option value="monthly" ${record.preferences?.frequency === 'monthly' ? 'selected' : ''}>Monthly</option>
                        </select>
                    </div>
                `;
        }
    }

    generateAddForm(section) {
        switch (section) {
            case 'contacts':
                return `
                    <div class="form-row">
                        <div class="form-group">
                            <label>Name</label>
                            <input type="text" id="edit-name" value="" required>
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="edit-email" value="" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Phone</label>
                            <input type="text" id="edit-phone" value="" required>
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <select id="edit-status">
                                <option value="pending" selected>Pending</option>
                                <option value="processed">Processed</option>
                                <option value="responded">Responded</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Subject</label>
                        <input type="text" id="edit-subject" value="" required>
                    </div>
                    <div class="form-group">
                        <label>Message</label>
                        <textarea id="edit-message" required></textarea>
                    </div>
                `;

            case 'registrations':
                return `
                    <div class="form-row">
                        <div class="form-group">
                            <label>First Name</label>
                            <input type="text" id="edit-firstName" value="" required>
                        </div>
                        <div class="form-group">
                            <label>Last Name</label>
                            <input type="text" id="edit-lastName" value="" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="edit-email" value="" required>
                        </div>
                        <div class="form-group">
                            <label>Phone</label>
                            <input type="text" id="edit-phone" value="" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Company</label>
                            <input type="text" id="edit-company" value="">
                        </div>
                        <div class="form-group">
                            <label>Job Title</label>
                            <input type="text" id="edit-jobTitle" value="">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Experience Level</label>
                        <select id="edit-experience" required>
                            <option value="beginner" selected>Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                            <option value="expert">Expert</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Interests</label>
                        <div class="checkbox-group">
                            ${['ai-trading', 'risk-management', 'fraud-detection', 'robo-advisors', 'regulatory-compliance'].map(interest => `
                                <div class="checkbox-item">
                                    <input type="checkbox" id="interest-${interest}" value="${interest}">
                                    <label for="interest-${interest}">${interest.replace('-', ' ').toUpperCase()}</label>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Expectations</label>
                        <textarea id="edit-expectations"></textarea>
                    </div>
                    <div class="form-group">
                        <div class="checkbox-item">
                            <input type="checkbox" id="edit-newsletter">
                            <label for="edit-newsletter">Subscribe to Newsletter</label>
                        </div>
                    </div>
                `;

            case 'newsletter':
                return `
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="edit-email" value="" required>
                    </div>
                    <div class="form-group">
                        <div class="checkbox-item">
                            <input type="checkbox" id="edit-isActive" checked>
                            <label for="edit-isActive">Active Subscription</label>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Email Frequency</label>
                        <select id="edit-frequency">
                            <option value="daily">Daily</option>
                            <option value="weekly" selected>Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>
                `;
        }
    }

    async saveRecord() {
        if (!this.editingRecord) return;

        const { section, id, isNew } = this.editingRecord;
        const formData = this.collectFormData(section);

        this.showLoading();
        try {
            let response;
            if (isNew) {
                // Create new record
                response = await fetch(`/dashboard/api/${section}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
            } else {
                // Update existing record
                response = await fetch(`/dashboard/api/${section}/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
            }

            const data = await response.json();

            if (data.success) {
                this.closeModal();
                this.loadSectionData(section);
                this.showSuccess(isNew ? 'Record has been created successfully!' : 'Record has been updated successfully!', isNew ? 'Record Created' : 'Record Updated');
                
                // Refresh overview if needed
                if (this.currentSection === 'overview') {
                    this.loadOverview();
                }
            } else {
                this.showError(data.message || `Failed to ${isNew ? 'create' : 'update'} record`, isNew ? 'Creation Error' : 'Update Error');
            }
        } catch (error) {
            console.error('Failed to save record:', error);
        } finally {
            this.hideLoading();
        }
    }

    collectFormData(section) {
        const data = {};

        switch (section) {
            case 'contacts':
                data.name = document.getElementById('edit-name').value;
                data.email = document.getElementById('edit-email').value;
                data.phone = document.getElementById('edit-phone').value;
                data.subject = document.getElementById('edit-subject').value;
                data.message = document.getElementById('edit-message').value;
                data.status = document.getElementById('edit-status').value;
                break;

            case 'registrations':
                data.firstName = document.getElementById('edit-firstName').value;
                data.lastName = document.getElementById('edit-lastName').value;
                data.email = document.getElementById('edit-email').value;
                data.phone = document.getElementById('edit-phone').value;
                data.company = document.getElementById('edit-company').value;
                data.jobTitle = document.getElementById('edit-jobTitle').value;
                data.experience = document.getElementById('edit-experience').value;
                data.expectations = document.getElementById('edit-expectations').value;
                data.newsletter = document.getElementById('edit-newsletter').checked;
                data.terms = true; // Always true for existing records
                
                // Collect interests
                data.interests = [];
                document.querySelectorAll('[id^="interest-"]:checked').forEach(checkbox => {
                    data.interests.push(checkbox.value);
                });
                break;

            case 'newsletter':
                data.email = document.getElementById('edit-email').value;
                data.isActive = document.getElementById('edit-isActive').checked;
                data.preferences = {
                    frequency: document.getElementById('edit-frequency').value
                };
                break;
        }

        return data;
    }

    async updateStatus(section, id) {
        // Show status update modal
        const modal = document.getElementById('edit-modal');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');

        title.textContent = 'Update Status';
        body.innerHTML = `
            <div class="form-group">
                <label>Registration Status</label>
                <select id="status-select">
                    <option value="registered">Registered</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="attended">Attended</option>
                </select>
            </div>
        `;

        this.editingRecord = { section, id, statusUpdate: true };
        modal.classList.add('show');
    }

    async deleteRecord(section, id, name) {
        this.confirmCallback = async () => {
            this.showLoading();
            try {
                const response = await fetch(`/dashboard/api/${section}/${id}`, {
                    method: 'DELETE'
                });

                const data = await response.json();

                if (data.success) {
                    this.loadSectionData(section);
                    this.showSuccess('Record has been deleted successfully!', 'Record Deleted');
                    
                    // Refresh overview if needed
                    if (this.currentSection === 'overview') {
                        this.loadOverview();
                    }
                } else {
                    this.showError(data.message || 'Failed to delete record', 'Delete Error');
                }
            } catch (error) {
                console.error('Failed to delete record:', error);
                this.showError('Failed to delete record. Please check your connection and try again.', 'Network Error');
            } finally {
                this.hideLoading();
            }
        };

        this.showConfirmModal(`Are you sure you want to delete the record for "${name}"? This action cannot be undone.`);
    }

    showConfirmModal(message) {
        document.getElementById('confirm-message').textContent = message;
        document.getElementById('confirm-modal').classList.add('show');
    }

    closeModal() {
        document.getElementById('edit-modal').classList.remove('show');
        this.editingRecord = null;
    }

    closeConfirmModal() {
        document.getElementById('confirm-modal').classList.remove('show');
        this.confirmCallback = null;
    }

    confirmAction() {
        if (this.confirmCallback) {
            this.confirmCallback();
            this.closeConfirmModal();
        }
    }

    showLoading() {
        document.getElementById('loading-overlay').classList.add('show');
    }

    hideLoading() {
        document.getElementById('loading-overlay').classList.remove('show');
    }

    showError(message, title = 'Error') {
        console.error('Dashboard Error:', message);
        this.showToast(message, 'error', title);
    }

    showSuccess(message, title = 'Success') {
        console.log('Dashboard Success:', message);
        this.showToast(message, 'success', title);
    }

    showWarning(message, title = 'Warning') {
        console.warn('Dashboard Warning:', message);
        this.showToast(message, 'warning', title);
    }

    showInfo(message, title = 'Info') {
        console.info('Dashboard Info:', message);
        this.showToast(message, 'info', title);
    }

    showToast(message, type = 'info', title = '', duration = 5000) {
        const container = document.getElementById('toast-container');
        if (!container) {
            console.error('Toast container not found');
            return;
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        // Generate unique ID for this toast
        const toastId = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        toast.id = toastId;

        // Get appropriate icon based on type
        const icons = {
            success: 'bi bi-check-circle-fill',
            error: 'bi bi-x-circle-fill',
            warning: 'bi bi-exclamation-triangle-fill',
            info: 'bi bi-info-circle-fill'
        };

        // Get appropriate title if not provided
        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Information'
        };

        const finalTitle = title || titles[type];
        const icon = icons[type] || icons.info;

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${icon}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${finalTitle}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="window.dashboard.closeToast('${toastId}')">
                <i class="bi bi-x"></i>
            </button>
            <div class="toast-progress" style="width: 100%;"></div>
        `;

        // Add to container
        container.appendChild(toast);

        // Trigger show animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Auto-hide after duration
        if (duration > 0) {
            const progressBar = toast.querySelector('.toast-progress');
            if (progressBar) {
                progressBar.style.transition = `width ${duration}ms linear`;
                setTimeout(() => {
                    progressBar.style.width = '0%';
                }, 100);
            }

            setTimeout(() => {
                this.closeToast(toastId);
            }, duration);
        }
    }

    closeToast(toastId) {
        const toast = document.getElementById(toastId);
        if (toast) {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }

    // Test function for toast notifications (can be called from console)
    testToasts() {
        setTimeout(() => this.showSuccess('This is a success message!', 'Success Test'), 500);
        setTimeout(() => this.showError('This is an error message!', 'Error Test'), 1000);
        setTimeout(() => this.showWarning('This is a warning message!', 'Warning Test'), 1500);
        setTimeout(() => this.showInfo('This is an info message!', 'Info Test'), 2000);
    }

    // Rich text editor functions
    formatText(command, value = null) {
        const editor = document.getElementById('email-editor');
        if (!editor) {
            console.warn('Email editor not found');
            return;
        }

        editor.focus();
        
        try {
            document.execCommand(command, false, value);
        } catch (error) {
            console.error('Error executing format command:', error);
            this.showWarning(`Could not apply formatting: ${command}`, 'Editor Warning');
        }
    }

    formatBulkText(command, value = null) {
        const editor = document.getElementById('bulk-email-editor');
        if (!editor) {
            console.warn('Bulk email editor not found');
            return;
        }

        editor.focus();
        
        try {
            if (command === 'createLink') {
                const selection = window.getSelection();
                const selectedText = selection.toString();
                const url = prompt('Enter the URL:', 'https://');
                
                if (url && url.trim() !== '' && url !== 'https://') {
                    if (selectedText) {
                        document.execCommand(command, false, url);
                    } else {
                        const linkText = prompt('Enter link text:', url);
                        if (linkText) {
                            const link = `<a href="${url}" target="_blank">${linkText}</a>`;
                            document.execCommand('insertHTML', false, link);
                        }
                    }
                }
            } else {
                document.execCommand(command, false, value);
            }
        } catch (error) {
            console.error('Error executing format command:', error);
            this.showWarning(`Could not apply formatting: ${command}`, 'Editor Warning');
        }
    }

    formatDate(date) {
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    truncate(text, length) {
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    updateLastUpdated() {
        try {
            const element = document.getElementById('last-updated-time');
            if (element) {
                element.textContent = new Date().toLocaleTimeString();
            } else {
                console.warn('last-updated-time element not found');
            }
        } catch (error) {
            console.error('Error updating last updated time:', error);
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Global functions for onclick handlers
window.dashboard = null;

function refreshData() {
    if (!window.dashboard) return;
    
    if (window.dashboard.currentSection === 'overview') {
        window.dashboard.loadOverview();
    } else {
        window.dashboard.loadSectionData(window.dashboard.currentSection);
    }
    window.dashboard.updateLastUpdated();
}

function closeModal() {
    if (window.dashboard) {
        window.dashboard.closeModal();
    }
}

function closeConfirmModal() {
    if (window.dashboard) {
        window.dashboard.closeConfirmModal();
    }
}

function saveRecord() {
    if (!window.dashboard) return;
    
    if (window.dashboard.editingRecord && window.dashboard.editingRecord.statusUpdate) {
        // Handle status update
        const status = document.getElementById('status-select').value;
        const { section, id } = window.dashboard.editingRecord;
        
        window.dashboard.showLoading();
        fetch(`/dashboard/api/${section}/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.dashboard.closeModal();
                window.dashboard.loadSectionData(section);
                window.dashboard.showSuccess('Status updated successfully');
            } else {
                window.dashboard.showError(data.message || 'Failed to update status');
            }
        })
        .catch(error => {
            console.error('Failed to update status:', error);
            window.dashboard.showError('Failed to update status');
        })
        .finally(() => {
            window.dashboard.hideLoading();
        });
    } else {
        window.dashboard.saveRecord();
    }
}

function confirmAction() {
    if (window.dashboard) {
        window.dashboard.confirmAction();
    }
}

function editRecord(section, id) {
    if (window.dashboard) {
        window.dashboard.editRecord(section, id);
    }
}

function deleteRecord(section, id, name) {
    if (window.dashboard) {
        window.dashboard.deleteRecord(section, id, name);
    }
}

function updateStatus(section, id) {
    if (window.dashboard) {
        window.dashboard.updateStatus(section, id);
    }
}

function unsubscribeNewsletter(subscriptionId, email) {
    if (!window.dashboard) return;
    
    window.dashboard.confirmCallback = async () => {
        window.dashboard.showLoading();
        try {
            const response = await fetch(`/dashboard/api/newsletter/${subscriptionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    isActive: false,
                    preferences: {}
                })
            });

            const data = await response.json();

            if (data.success) {
                window.dashboard.loadSectionData('newsletter');
                window.dashboard.showSuccess('Newsletter unsubscribed successfully');
                
                // Refresh overview if needed
                if (window.dashboard.currentSection === 'overview') {
                    window.dashboard.loadOverview();
                }
            } else {
                window.dashboard.showError(data.message || 'Failed to unsubscribe');
            }
        } catch (error) {
            console.error('Failed to unsubscribe:', error);
            window.dashboard.showError('Failed to unsubscribe');
        } finally {
            window.dashboard.hideLoading();
        }
    };

    window.dashboard.showConfirmModal(`Are you sure you want to unsubscribe "${email}" from the newsletter?`);
}

function resubscribeNewsletter(subscriptionId, email) {
    if (!window.dashboard) return;
    
    window.dashboard.confirmCallback = async () => {
        window.dashboard.showLoading();
        try {
            const response = await fetch(`/dashboard/api/newsletter/${subscriptionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    isActive: true,
                    preferences: { frequency: 'weekly' }
                })
            });

            const data = await response.json();

            if (data.success) {
                window.dashboard.loadSectionData('newsletter');
                window.dashboard.showSuccess('Newsletter resubscribed successfully');
                
                // Refresh overview if needed
                if (window.dashboard.currentSection === 'overview') {
                    window.dashboard.loadOverview();
                }
            } else {
                window.dashboard.showError(data.message || 'Failed to resubscribe');
            }
        } catch (error) {
            console.error('Failed to resubscribe:', error);
            window.dashboard.showError('Failed to resubscribe');
        } finally {
            window.dashboard.hideLoading();
        }
    };

    window.dashboard.showConfirmModal(`Are you sure you want to resubscribe "${email}" to the newsletter?`);
}

function addNewRecord(section) {
    if (!window.dashboard) return;
    
    window.dashboard.editingRecord = { section, id: null, data: null, isNew: true };
    window.dashboard.showAddModal(section);
}

// Newsletter Functions
async function addToNewsletter(registrationId, email) {
    if (!window.dashboard) return;
    
    window.dashboard.confirmCallback = async () => {
        window.dashboard.showLoading();
        try {
            const response = await fetch(`/dashboard/api/registrations/${registrationId}/add-to-newsletter`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                window.dashboard.showSuccess(`${email} has been successfully added to the newsletter!`, 'Newsletter Subscription');
                window.dashboard.loadData('registrations');
                window.dashboard.loadData('newsletter');
                window.dashboard.loadOverview();
            } else {
                window.dashboard.showError(data.message || 'Failed to add to newsletter', 'Newsletter Error');
            }
        } catch (error) {
            console.error('Failed to add to newsletter:', error);
            window.dashboard.showError('Failed to add to newsletter. Please try again.', 'Network Error');
        } finally {
            window.dashboard.hideLoading();
        }
    };
    
    window.dashboard.showConfirmModal(`Add ${email} to the newsletter?`);
}

async function unsubscribeNewsletter(subscriptionId, email) {
    if (!window.dashboard) return;
    
    window.dashboard.confirmCallback = async () => {
        window.dashboard.showLoading();
        try {
            const response = await fetch(`/dashboard/api/newsletter/${subscriptionId}/unsubscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                window.dashboard.showSuccess(`${email} has been unsubscribed from the newsletter`);
                window.dashboard.loadData('newsletter');
                window.dashboard.loadOverview();
            } else {
                window.dashboard.showError(data.message || 'Failed to unsubscribe');
            }
        } catch (error) {
            console.error('Failed to unsubscribe:', error);
            window.dashboard.showError('Failed to unsubscribe');
        } finally {
            window.dashboard.hideLoading();
        }
    };
    
    window.dashboard.showConfirmModal(`Unsubscribe ${email} from the newsletter?`);
}

async function resubscribeNewsletter(subscriptionId, email) {
    if (!window.dashboard) return;
    
    window.dashboard.confirmCallback = async () => {
        window.dashboard.showLoading();
        try {
            const response = await fetch(`/dashboard/api/newsletter/${subscriptionId}/resubscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                window.dashboard.showSuccess(`${email} has been resubscribed to the newsletter`);
                window.dashboard.loadData('newsletter');
                window.dashboard.loadOverview();
            } else {
                window.dashboard.showError(data.message || 'Failed to resubscribe');
            }
        } catch (error) {
            console.error('Failed to resubscribe:', error);
            window.dashboard.showError('Failed to resubscribe');
        } finally {
            window.dashboard.hideLoading();
        }
    };
    
    window.dashboard.showConfirmModal(`Resubscribe ${email} to the newsletter?`);
}

// Bulk Email Functions
async function openBulkEmailModal() {
    try {
        // Get active subscriber count
        const response = await fetch('/dashboard/api/newsletter?active=true');
        const data = await response.json();
        
        if (data.success) {
            const activeCount = data.data.filter(sub => sub.isActive && sub.metadata.status === 'subscribed').length;
            document.getElementById('bulk-email-count').textContent = activeCount;
            document.getElementById('bulk-email-modal').classList.add('show');
            
            // Clear previous content
            document.getElementById('bulk-email-subject').value = '';
            document.getElementById('bulk-email-editor').innerHTML = '';
        } else {
            console.error('Failed to load subscriber count');
            document.getElementById('bulk-email-count').textContent = '0';
            document.getElementById('bulk-email-modal').classList.add('show');
        }
    } catch (error) {
        console.error('Error opening bulk email modal:', error);
        document.getElementById('bulk-email-count').textContent = '0';
        document.getElementById('bulk-email-modal').classList.add('show');
    }
}

function closeBulkEmailModal() {
    document.getElementById('bulk-email-modal').classList.remove('show');
}

async function sendBulkEmail() {
    const subject = document.getElementById('bulk-email-subject').value.trim();
    const body = document.getElementById('bulk-email-editor').innerHTML.trim();
    
    // Validate required fields
    if (!subject) {
        window.dashboard.showError('Please enter an email subject', 'Missing Subject');
        document.getElementById('bulk-email-subject').focus();
        return;
    }
    
    if (!body || body === '<br>' || body === '<div><br></div>') {
        window.dashboard.showError('Please enter an email message', 'Missing Message');
        document.getElementById('bulk-email-editor').focus();
        return;
    }
    
    if (!window.dashboard) return;
    
    // Show confirmation
    const subscriberCount = document.getElementById('bulk-email-count').textContent;
    window.dashboard.confirmCallback = async () => {
        // Show progress modal
        showBulkEmailProgress();
        
        try {
            const response = await fetch('/dashboard/api/newsletter/bulk-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ subject, body })
            });
            
            const data = await response.json();
            
            if (data.success) {
                updateBulkEmailProgress(100, `Successfully sent to ${data.count} subscribers!`, true);
                setTimeout(() => {
                    hideBulkEmailProgress();
                    closeBulkEmailModal();
                    window.dashboard.showSuccess(`Bulk email sent to ${data.count} subscribers!`, 'Email Campaign Complete');
                    // Refresh newsletter data
                    if (window.dashboard.currentSection === 'newsletter') {
                        window.dashboard.loadData('newsletter');
                    }
                }, 2000);
            } else {
                updateBulkEmailProgress(0, data.message || 'Failed to send bulk email', false);
                setTimeout(() => {
                    hideBulkEmailProgress();
                    window.dashboard.showError(data.message || 'Failed to send bulk email', 'Email Campaign Failed');
                }, 2000);
            }
        } catch (error) {
            console.error('Failed to send bulk email:', error);
            updateBulkEmailProgress(0, 'Network error occurred', false);
            setTimeout(() => {
                hideBulkEmailProgress();
                window.dashboard.showError('Failed to send bulk email. Please check your connection and try again.', 'Network Error');
            }, 2000);
        }
    };
    
    window.dashboard.showConfirmModal(`Send this email to ${subscriberCount} subscribers?`);
}

// Bulk Email Progress Functions
function showBulkEmailProgress() {
    const progressModal = document.getElementById('bulk-email-progress-modal');
    if (progressModal) {
        progressModal.classList.add('show');
        updateBulkEmailProgress(0, 'Preparing to send emails...', null);
        
        // Simulate progress updates
        setTimeout(() => updateBulkEmailProgress(25, 'Validating subscriber list...', null), 500);
        setTimeout(() => updateBulkEmailProgress(50, 'Sending emails...', null), 1000);
        setTimeout(() => updateBulkEmailProgress(75, 'Processing delivery...', null), 1500);
    }
}

function updateBulkEmailProgress(percentage, message, isComplete) {
    const progressBar = document.getElementById('bulk-progress-bar');
    const progressText = document.getElementById('bulk-progress-text');
    const progressIcon = document.getElementById('bulk-progress-icon');
    
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
        progressBar.setAttribute('aria-valuenow', percentage);
    }
    
    if (progressText) {
        progressText.textContent = message;
    }
    
    if (progressIcon && isComplete !== null) {
        if (isComplete) {
            progressIcon.className = 'bi bi-check-circle-fill text-success';
            progressBar.classList.remove('bg-danger');
            progressBar.classList.add('bg-success');
        } else if (isComplete === false) {
            progressIcon.className = 'bi bi-x-circle-fill text-danger';
            progressBar.classList.remove('bg-success');
            progressBar.classList.add('bg-danger');
        }
    }
}

function hideBulkEmailProgress() {
    const progressModal = document.getElementById('bulk-email-progress-modal');
    if (progressModal) {
        progressModal.classList.remove('show');
        // Reset progress after hiding
        setTimeout(() => {
            updateBulkEmailProgress(0, 'Preparing to send emails...', null);
            const progressBar = document.getElementById('bulk-progress-bar');
            const progressIcon = document.getElementById('bulk-progress-icon');
            if (progressBar) {
                progressBar.classList.remove('bg-success', 'bg-danger');
            }
            if (progressIcon) {
                progressIcon.className = 'bi bi-send-fill text-primary';
            }
        }, 300);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new TechGridDashboard();
    
    // Make functions globally available
    window.openBulkEmailModal = openBulkEmailModal;
    window.closeBulkEmailModal = closeBulkEmailModal;
    window.sendBulkEmail = sendBulkEmail;
    window.refreshData = refreshData;
    window.closeModal = closeModal;
    window.closeConfirmModal = closeConfirmModal;
    window.saveRecord = saveRecord;
    window.confirmAction = confirmAction;
    window.editRecord = editRecord;
    window.deleteRecord = deleteRecord;
    window.updateStatus = updateStatus;
    window.addToNewsletter = addToNewsletter;
    window.unsubscribeNewsletter = unsubscribeNewsletter;
    window.resubscribeNewsletter = resubscribeNewsletter;
    window.addNewRecord = addNewRecord;
    
    // Rich text editor functions
    window.formatText = (command, value) => window.dashboard.formatText(command, value);
    window.formatBulkText = (command, value) => window.dashboard.formatBulkText(command, value);
    
    // Bulk email progress functions
    window.showBulkEmailProgress = showBulkEmailProgress;
    window.updateBulkEmailProgress = updateBulkEmailProgress;
    window.hideBulkEmailProgress = hideBulkEmailProgress;
});

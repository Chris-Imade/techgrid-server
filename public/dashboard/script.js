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
        this.setupEventListeners();
        this.loadOverview();
        this.updateLastUpdated();
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

        // Update page title
        const titles = {
            overview: 'Dashboard Overview',
            contacts: 'Contact Form Submissions',
            registrations: 'Conference Registrations',
            newsletter: 'Newsletter Subscriptions'
        };
        document.getElementById('page-title').textContent = titles[section];

        this.currentSection = section;

        // Load section data
        if (section !== 'overview') {
            this.loadSectionData(section);
        }
    }

    async loadOverview() {
        this.showLoading();
        try {
            const response = await fetch('/dashboard/api/overview');
            const data = await response.json();

            if (data.success) {
                this.updateOverviewStats(data.data.statistics);
                this.updateRecentActivity(data.data.recentActivity);
                this.updateSidebarCounts(data.data.statistics);
            }
        } catch (error) {
            console.error('Failed to load overview:', error);
            this.showError('Failed to load dashboard overview');
        } finally {
            this.hideLoading();
        }
    }

    updateOverviewStats(stats) {
        // Contacts
        document.getElementById('total-contacts').textContent = stats.contacts.total;
        document.getElementById('pending-contacts').textContent = stats.contacts.pending;
        document.getElementById('processed-contacts').textContent = stats.contacts.processed;

        // Registrations
        document.getElementById('total-registrations').textContent = stats.registrations.total;
        document.getElementById('registered-count').textContent = stats.registrations.registered;
        document.getElementById('confirmed-count').textContent = stats.registrations.confirmed;

        // Newsletter
        document.getElementById('total-newsletter').textContent = stats.newsletter.total;
        document.getElementById('active-subscribers').textContent = stats.newsletter.active;
        document.getElementById('unsubscribed-count').textContent = stats.newsletter.unsubscribed;

        // Emails
        const totalEmails = stats.contacts.emailsSent + stats.registrations.confirmationsSent + stats.newsletter.welcomesSent;
        document.getElementById('total-emails').textContent = totalEmails;
        document.getElementById('confirmations-sent').textContent = stats.registrations.confirmationsSent;
        document.getElementById('welcomes-sent').textContent = stats.newsletter.welcomesSent;
    }

    updateSidebarCounts(stats) {
        document.getElementById('contacts-count').textContent = stats.contacts.total;
        document.getElementById('registrations-count').textContent = stats.registrations.total;
        document.getElementById('newsletter-count').textContent = stats.newsletter.total;
    }

    updateRecentActivity(activity) {
        // Recent contacts
        const contactsContainer = document.getElementById('recent-contacts');
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

        // Recent registrations
        const registrationsContainer = document.getElementById('recent-registrations');
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

        // Recent newsletter
        const newsletterContainer = document.getElementById('recent-newsletter');
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
                this.showSuccess(isNew ? 'Record created successfully' : 'Record updated successfully');
                
                // Refresh overview if needed
                if (this.currentSection === 'overview') {
                    this.loadOverview();
                }
            } else {
                this.showError(data.message || `Failed to ${isNew ? 'create' : 'update'} record`);
            }
        } catch (error) {
            console.error('Failed to save record:', error);
            this.showError('Failed to save record');
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
                    this.showSuccess('Record deleted successfully');
                    
                    // Refresh overview if needed
                    if (this.currentSection === 'overview') {
                        this.loadOverview();
                    }
                } else {
                    this.showError(data.message || 'Failed to delete record');
                }
            } catch (error) {
                console.error('Failed to delete record:', error);
                this.showError('Failed to delete record');
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

    showError(message) {
        // Simple error display - you could enhance this with a toast system
        alert('Error: ' + message);
    }

    showSuccess(message) {
        // Simple success display - you could enhance this with a toast system
        alert('Success: ' + message);
    }

    formatDate(date) {
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    truncate(text, length) {
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    updateLastUpdated() {
        document.getElementById('last-updated-time').textContent = new Date().toLocaleTimeString();
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
    if (dashboard.currentSection === 'overview') {
        dashboard.loadOverview();
    } else {
        dashboard.loadSectionData(dashboard.currentSection);
    }
    dashboard.updateLastUpdated();
}

function closeModal() {
    dashboard.closeModal();
}

function closeConfirmModal() {
    dashboard.closeConfirmModal();
}

function saveRecord() {
    if (dashboard.editingRecord && dashboard.editingRecord.statusUpdate) {
        // Handle status update
        const status = document.getElementById('status-select').value;
        const { section, id } = dashboard.editingRecord;
        
        dashboard.showLoading();
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
                dashboard.closeModal();
                dashboard.loadSectionData(section);
                dashboard.showSuccess('Status updated successfully');
            } else {
                dashboard.showError(data.message || 'Failed to update status');
            }
        })
        .catch(error => {
            console.error('Failed to update status:', error);
            dashboard.showError('Failed to update status');
        })
        .finally(() => {
            dashboard.hideLoading();
        });
    } else {
        dashboard.saveRecord();
    }
}

function confirmAction() {
    dashboard.confirmAction();
}

function editRecord(section, id) {
    dashboard.editRecord(section, id);
}

function deleteRecord(section, id, name) {
    dashboard.deleteRecord(section, id, name);
}

function updateStatus(section, id) {
    dashboard.updateStatus(section, id);
}

function unsubscribeNewsletter(subscriptionId, email) {
    dashboard.confirmCallback = async () => {
        dashboard.showLoading();
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
                dashboard.loadSectionData('newsletter');
                dashboard.showSuccess('Newsletter unsubscribed successfully');
                
                // Refresh overview if needed
                if (dashboard.currentSection === 'overview') {
                    dashboard.loadOverview();
                }
            } else {
                dashboard.showError(data.message || 'Failed to unsubscribe');
            }
        } catch (error) {
            console.error('Failed to unsubscribe:', error);
            dashboard.showError('Failed to unsubscribe');
        } finally {
            dashboard.hideLoading();
        }
    };

    dashboard.showConfirmModal(`Are you sure you want to unsubscribe "${email}" from the newsletter?`);
}

function resubscribeNewsletter(subscriptionId, email) {
    dashboard.confirmCallback = async () => {
        dashboard.showLoading();
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
                dashboard.loadSectionData('newsletter');
                dashboard.showSuccess('Newsletter resubscribed successfully');
                
                // Refresh overview if needed
                if (dashboard.currentSection === 'overview') {
                    dashboard.loadOverview();
                }
            } else {
                dashboard.showError(data.message || 'Failed to resubscribe');
            }
        } catch (error) {
            console.error('Failed to resubscribe:', error);
            dashboard.showError('Failed to resubscribe');
        } finally {
            dashboard.hideLoading();
        }
    };

    dashboard.showConfirmModal(`Are you sure you want to resubscribe "${email}" to the newsletter?`);
}

function addNewRecord(section) {
    dashboard.editingRecord = { section, id: null, data: null, isNew: true };
    dashboard.showAddModal(section);
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new TechGridDashboard();
});

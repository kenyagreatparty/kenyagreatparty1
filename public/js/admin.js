// Admin Panel JavaScript
let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAdminAuth();
    
    // Set up navigation
    setupAdminNavigation();
    
    // Load dashboard data
    loadDashboardData();
});

// Check Admin Authentication
function checkAdminAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        window.location.href = '/login.html';
        return;
    }
    
    currentUser = JSON.parse(user);
    
    // Check if user is admin
    if (currentUser.role !== 'admin') {
        Utils.showAlert('Access denied. Admin privileges required.', 'danger');
        window.location.href = '/';
        return;
    }
    
    // Update UI with user info
    document.getElementById('admin-name').textContent = currentUser.name;
}

// Setup Admin Navigation
function setupAdminNavigation() {
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    const contentSections = document.querySelectorAll('.content-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Hide all content sections
            contentSections.forEach(section => {
                section.style.display = 'none';
            });
            
            // Show selected section
            const sectionId = this.getAttribute('data-section') + '-section';
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.style.display = 'block';
                
                // Update page title
                const pageTitle = this.textContent.trim();
                document.getElementById('page-title').textContent = pageTitle;
                
                // Load section data
                loadSectionData(this.getAttribute('data-section'));
            }
        });
    });
}

// Load Dashboard Data
async function loadDashboardData() {
    try {
        const [news, events, contacts, memberships] = await Promise.all([
            API.getNews(),
            API.getEvents(),
            API.getContacts(),
            API.getMemberships()
        ]);
        
        // Update stats
        document.getElementById('news-count').textContent = news.length;
        document.getElementById('events-count').textContent = events.length;
        document.getElementById('contacts-count').textContent = contacts.length;
        document.getElementById('memberships-count').textContent = memberships.length;
        
        // Update recent items
        updateRecentContacts(contacts.slice(0, 5));
        updateRecentMemberships(memberships.slice(0, 5));
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        Utils.showAlert('Error loading dashboard data.', 'danger');
    }
}

// Update Recent Contacts
function updateRecentContacts(contacts) {
    const container = document.getElementById('recent-contacts');
    
    if (contacts.length === 0) {
        container.innerHTML = '<p class="text-muted">No recent contacts.</p>';
        return;
    }
    
    const html = contacts.map(contact => `
        <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
                <strong>${contact.name}</strong><br>
                <small class="text-muted">${contact.subject}</small>
            </div>
            <small class="text-muted">${Utils.formatDate(contact.date)}</small>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// Update Recent Memberships
function updateRecentMemberships(memberships) {
    const container = document.getElementById('recent-memberships');
    
    if (memberships.length === 0) {
        container.innerHTML = '<p class="text-muted">No recent applications.</p>';
        return;
    }
    
    const html = memberships.map(membership => `
        <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
                <strong>${membership.fullName}</strong><br>
                <small class="text-muted">${membership.county}</small>
            </div>
            <span class="badge bg-${getStatusColor(membership.status)}">${membership.status}</span>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// Get Status Color
function getStatusColor(status) {
    switch (status) {
        case 'approved': return 'success';
        case 'pending': return 'warning';
        case 'rejected': return 'danger';
        default: return 'secondary';
    }
}

// Load Section Data
async function loadSectionData(section) {
    switch (section) {
        case 'news':
            await loadNewsTable();
            break;
        case 'events':
            await loadEventsTable();
            break;
        case 'contacts':
            await loadContactsTable();
            break;
        case 'memberships':
            await loadMembershipsTable();
            break;
        case 'users':
            await loadUsersTable();
            break;
    }
}

// Load News Table
async function loadNewsTable() {
    try {
        const news = await API.getNews();
        const tbody = document.getElementById('news-table');
        
        if (news.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">No news articles found.</td></tr>';
            return;
        }
        
        const html = news.map(article => `
            <tr>
                <td>${article.title}</td>
                <td>${article.author}</td>
                <td>${Utils.formatDate(article.date)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary btn-action" onclick="editNews('${article._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-action" onclick="deleteNews('${article._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        tbody.innerHTML = html;
    } catch (error) {
        console.error('Error loading news:', error);
        Utils.showAlert('Error loading news articles.', 'danger');
    }
}

// Load Events Table
async function loadEventsTable() {
    try {
        const events = await API.getEvents();
        const tbody = document.getElementById('events-table');
        
        if (events.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">No events found.</td></tr>';
            return;
        }
        
        const html = events.map(event => `
            <tr>
                <td>${event.title}</td>
                <td>${Utils.formatDate(event.date)}</td>
                <td>${event.location}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary btn-action" onclick="editEvent('${event._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-action" onclick="deleteEvent('${event._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        tbody.innerHTML = html;
    } catch (error) {
        console.error('Error loading events:', error);
        Utils.showAlert('Error loading events.', 'danger');
    }
}

// Load Contacts Table
async function loadContactsTable() {
    try {
        const contacts = await API.getContacts();
        const tbody = document.getElementById('contacts-table');
        
        if (contacts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No contact messages found.</td></tr>';
            return;
        }
        
        const html = contacts.map(contact => `
            <tr>
                <td>${contact.name}</td>
                <td>${contact.email}</td>
                <td>${contact.subject}</td>
                <td>${Utils.formatDate(contact.date)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-info btn-action" onclick="viewContact('${contact._id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        tbody.innerHTML = html;
    } catch (error) {
        console.error('Error loading contacts:', error);
        Utils.showAlert('Error loading contact messages.', 'danger');
    }
}

// Load Memberships Table
async function loadMembershipsTable() {
    try {
        const memberships = await API.getMemberships();
        const tbody = document.getElementById('memberships-table');
        
        if (memberships.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No membership applications found.</td></tr>';
            return;
        }
        
        const html = memberships.map(membership => `
            <tr>
                <td>${membership.fullName}</td>
                <td>${membership.email}</td>
                <td>${membership.county}</td>
                <td><span class="badge bg-${getStatusColor(membership.status)}">${membership.status}</span></td>
                <td>${Utils.formatDate(membership.date)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-info btn-action" onclick="viewMembership('${membership._id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success btn-action" onclick="updateMembershipStatus('${membership._id}', 'approved')">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-action" onclick="updateMembershipStatus('${membership._id}', 'rejected')">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        tbody.innerHTML = html;
    } catch (error) {
        console.error('Error loading memberships:', error);
        Utils.showAlert('Error loading membership applications.', 'danger');
    }
}

// Load Users Table
async function loadUsersTable() {
    try {
        const users = await API.getUsers();
        const tbody = document.getElementById('users-table');
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No users found.</td></tr>';
            return;
        }
        
        const html = users.map(user => `
            <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span class="badge bg-${user.role === 'admin' ? 'danger' : 'primary'}">${user.role}</span></td>
                <td><span class="badge bg-success">Active</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary btn-action" onclick="editUser('${user._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-action" onclick="deleteUser('${user._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        tbody.innerHTML = html;
    } catch (error) {
        console.error('Error loading users:', error);
        Utils.showAlert('Error loading users.', 'danger');
    }
}

// News Management Functions
function showNewsForm(articleId = null) {
    const modal = new bootstrap.Modal(document.getElementById('newsModal'));
    const form = document.getElementById('news-form');
    
    if (articleId) {
        // Edit mode - load article data
        loadNewsArticle(articleId);
    } else {
        // Add mode - clear form
        form.reset();
        document.getElementById('news-id').value = '';
    }
    
    modal.show();
}

async function loadNewsArticle(id) {
    try {
        const article = await API.getNewsById(id);
        document.getElementById('news-id').value = article._id;
        document.getElementById('news-title').value = article.title;
        document.getElementById('news-content').value = article.content;
        document.getElementById('news-image').value = article.image || '';
    } catch (error) {
        console.error('Error loading article:', error);
        Utils.showAlert('Error loading article.', 'danger');
    }
}

async function saveNews() {
    const form = document.getElementById('news-form');
    const formData = new FormData(form);
    
    const newsData = {
        title: formData.get('news-title'),
        content: formData.get('news-content'),
        image: formData.get('news-image'),
        author: currentUser.name
    };
    
    try {
        const articleId = document.getElementById('news-id').value;
        
        if (articleId) {
            await API.updateNews(articleId, newsData);
            Utils.showAlert('News article updated successfully!', 'success');
        } else {
            await API.createNews(newsData);
            Utils.showAlert('News article created successfully!', 'success');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('newsModal')).hide();
        loadNewsTable();
        loadDashboardData(); // Refresh dashboard stats
        
    } catch (error) {
        console.error('Error saving news:', error);
        Utils.showAlert('Error saving news article.', 'danger');
    }
}

function editNews(id) {
    showNewsForm(id);
}

async function deleteNews(id) {
    if (confirm('Are you sure you want to delete this news article?')) {
        try {
            await API.deleteNews(id);
            Utils.showAlert('News article deleted successfully!', 'success');
            loadNewsTable();
            loadDashboardData(); // Refresh dashboard stats
        } catch (error) {
            console.error('Error deleting news:', error);
            Utils.showAlert('Error deleting news article.', 'danger');
        }
    }
}

// Event Management Functions
function showEventForm(eventId = null) {
    const modal = new bootstrap.Modal(document.getElementById('eventModal'));
    const form = document.getElementById('event-form');
    
    if (eventId) {
        // Edit mode - load event data
        loadEvent(eventId);
    } else {
        // Add mode - clear form
        form.reset();
        document.getElementById('event-id').value = '';
    }
    
    modal.show();
}

async function loadEvent(id) {
    try {
        const event = await API.getEventById(id);
        document.getElementById('event-id').value = event._id;
        document.getElementById('event-title').value = event.title;
        document.getElementById('event-description').value = event.description;
        document.getElementById('event-date').value = event.date.split('T')[0];
        document.getElementById('event-time').value = event.time;
        document.getElementById('event-location').value = event.location;
        document.getElementById('event-image').value = event.image || '';
    } catch (error) {
        console.error('Error loading event:', error);
        Utils.showAlert('Error loading event.', 'danger');
    }
}

async function saveEvent() {
    const form = document.getElementById('event-form');
    const formData = new FormData(form);
    
    const eventData = {
        title: formData.get('event-title'),
        description: formData.get('event-description'),
        date: formData.get('event-date'),
        time: formData.get('event-time'),
        location: formData.get('event-location'),
        image: formData.get('event-image')
    };
    
    try {
        const eventId = document.getElementById('event-id').value;
        
        if (eventId) {
            await API.updateEvent(eventId, eventData);
            Utils.showAlert('Event updated successfully!', 'success');
        } else {
            await API.createEvent(eventData);
            Utils.showAlert('Event created successfully!', 'success');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('eventModal')).hide();
        loadEventsTable();
        loadDashboardData(); // Refresh dashboard stats
        
    } catch (error) {
        console.error('Error saving event:', error);
        Utils.showAlert('Error saving event.', 'danger');
    }
}

function editEvent(id) {
    showEventForm(id);
}

async function deleteEvent(id) {
    if (confirm('Are you sure you want to delete this event?')) {
        try {
            await API.deleteEvent(id);
            Utils.showAlert('Event deleted successfully!', 'success');
            loadEventsTable();
            loadDashboardData(); // Refresh dashboard stats
        } catch (error) {
            console.error('Error deleting event:', error);
            Utils.showAlert('Error deleting event.', 'danger');
        }
    }
}

// Contact Management Functions
function viewContact(id) {
    // Implement contact view modal
    Utils.showAlert('Contact view functionality coming soon!', 'info');
}

// Membership Management Functions
function viewMembership(id) {
    // Implement membership view modal
    Utils.showAlert('Membership view functionality coming soon!', 'info');
}

async function updateMembershipStatus(id, status) {
    try {
        await API.updateMembership(id, status);
        Utils.showAlert(`Membership application ${status} successfully!`, 'success');
        loadMembershipsTable();
        loadDashboardData(); // Refresh dashboard stats
    } catch (error) {
        console.error('Error updating membership status:', error);
        Utils.showAlert('Error updating membership status.', 'danger');
    }
}

// User Management Functions
function editUser(id) {
    // Implement user edit functionality
    Utils.showAlert('User edit functionality coming soon!', 'info');
}

async function deleteUser(id) {
    if (confirm('Are you sure you want to delete this user?')) {
        try {
            await API.deleteUser(id);
            Utils.showAlert('User deleted successfully!', 'success');
            loadUsersTable();
        } catch (error) {
            console.error('Error deleting user:', error);
            Utils.showAlert('Error deleting user.', 'danger');
        }
    }
}

// Logout Function
async function logout() {
    try {
        await API.logout();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
        // Still clear local storage even if API call fails
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    }
}

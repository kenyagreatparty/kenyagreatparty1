// API Configuration
const API_BASE_URL = window.location.origin + '/api';

// API Helper Functions
class API {
    static async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add auth token if available
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'An error occurred');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Authentication
    static async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    static async login(credentials) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }

    static async logout() {
        return this.request('/auth/logout', {
            method: 'POST'
        });
    }

    // Contact Form
    static async submitContact(contactData) {
        return this.request('/contact', {
            method: 'POST',
            body: JSON.stringify(contactData)
        });
    }

    // Membership
    static async submitMembership(membershipData) {
        return this.request('/membership', {
            method: 'POST',
            body: JSON.stringify(membershipData)
        });
    }

    // News
    static async getNews() {
        return this.request('/news');
    }

    static async getNewsById(id) {
        return this.request(`/news/${id}`);
    }

    static async createNews(newsData) {
        return this.request('/news', {
            method: 'POST',
            body: JSON.stringify(newsData)
        });
    }

    static async updateNews(id, newsData) {
        return this.request(`/news/${id}`, {
            method: 'PUT',
            body: JSON.stringify(newsData)
        });
    }

    static async deleteNews(id) {
        return this.request(`/news/${id}`, {
            method: 'DELETE'
        });
    }

    // Events
    static async getEvents() {
        return this.request('/events');
    }

    static async getEventById(id) {
        return this.request(`/events/${id}`);
    }

    static async createEvent(eventData) {
        return this.request('/events', {
            method: 'POST',
            body: JSON.stringify(eventData)
        });
    }

    static async updateEvent(id, eventData) {
        return this.request(`/events/${id}`, {
            method: 'PUT',
            body: JSON.stringify(eventData)
        });
    }

    static async deleteEvent(id) {
        return this.request(`/events/${id}`, {
            method: 'DELETE'
        });
    }

    // File Upload
    static async uploadFile(file, type = 'image') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        return this.request('/upload', {
            method: 'POST',
            headers: {
                // Don't set Content-Type for FormData
            },
            body: formData
        });
    }

    // User Management
    static async getProfile() {
        return this.request('/users/profile');
    }

    static async updateProfile(userData) {
        return this.request('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    // Admin Functions
    static async getUsers() {
        return this.request('/admin/users');
    }

    static async updateUser(id, userData) {
        return this.request(`/admin/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    static async deleteUser(id) {
        return this.request(`/admin/users/${id}`, {
            method: 'DELETE'
        });
    }

    static async getContacts() {
        return this.request('/admin/contacts');
    }

    static async getMemberships() {
        return this.request('/admin/memberships');
    }

    static async updateMembership(id, status) {
        return this.request(`/admin/memberships/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    }
}

// Utility Functions
class Utils {
    static showAlert(message, type = 'success') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const container = document.querySelector('.container') || document.body;
        container.insertBefore(alertDiv, container.firstChild);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    static showLoading(element) {
        const loading = element.querySelector('.loading');
        if (loading) {
            loading.classList.add('show');
        }
    }

    static hideLoading(element) {
        const loading = element.querySelector('.loading');
        if (loading) {
            loading.classList.remove('show');
        }
    }

    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    static validatePhone(phone) {
        const re = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        return re.test(phone);
    }
}

// Export for use in other scripts
window.API = API;
window.Utils = Utils;

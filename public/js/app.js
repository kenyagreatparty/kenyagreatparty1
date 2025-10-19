// Main Application JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initializeApp();
});

function initializeApp() {
    // Set up form handlers
    setupContactForm();
    setupMembershipForm();
    setupLoginForm();
    setupRegisterForm();
    
    // Load dynamic content
    loadNews();
    loadEvents();
    
    // Set up navigation
    setupNavigation();
    
    // Check authentication status
    checkAuthStatus();
}

// Contact Form Handler
function setupContactForm() {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(contactForm);
            const contactData = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                subject: formData.get('subject'),
                message: formData.get('message')
            };

            // Validate form data
            if (!contactData.name || !contactData.email || !contactData.message) {
                Utils.showAlert('Please fill in all required fields.', 'danger');
                return;
            }

            if (!Utils.validateEmail(contactData.email)) {
                Utils.showAlert('Please enter a valid email address.', 'danger');
                return;
            }

            try {
                Utils.showLoading(contactForm);
                await API.submitContact(contactData);
                Utils.showAlert('Thank you for your message! We will get back to you soon.', 'success');
                contactForm.reset();
            } catch (error) {
                Utils.showAlert('Error sending message. Please try again.', 'danger');
            } finally {
                Utils.hideLoading(contactForm);
            }
        });
    }
}

// Membership Form Handler
function setupMembershipForm() {
    const membershipForm = document.getElementById('membership-form');
    if (membershipForm) {
        membershipForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(membershipForm);
            const membershipData = {
                fullName: formData.get('fullName'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                idNumber: formData.get('idNumber'),
                county: formData.get('county'),
                message: formData.get('message')
            };

            // Validate form data
            if (!membershipData.fullName || !membershipData.email || !membershipData.phone || !membershipData.idNumber || !membershipData.county) {
                Utils.showAlert('Please fill in all required fields.', 'danger');
                return;
            }

            if (!Utils.validateEmail(membershipData.email)) {
                Utils.showAlert('Please enter a valid email address.', 'danger');
                return;
            }

            if (!Utils.validatePhone(membershipData.phone)) {
                Utils.showAlert('Please enter a valid phone number.', 'danger');
                return;
            }

            try {
                Utils.showLoading(membershipForm);
                await API.submitMembership(membershipData);
                Utils.showAlert('Thank you for your membership application! We will review it and get back to you.', 'success');
                membershipForm.reset();
            } catch (error) {
                Utils.showAlert('Error submitting application. Please try again.', 'danger');
            } finally {
                Utils.hideLoading(membershipForm);
            }
        });
    }
}

// Login Form Handler
function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(loginForm);
            const credentials = {
                email: formData.get('email'),
                password: formData.get('password')
            };

            if (!credentials.email || !credentials.password) {
                Utils.showAlert('Please fill in all fields.', 'danger');
                return;
            }

            try {
                Utils.showLoading(loginForm);
                const response = await API.login(credentials);
                localStorage.setItem('token', response.token);
                localStorage.setItem('user', JSON.stringify(response.user));
                Utils.showAlert('Login successful!', 'success');
                
                // Redirect to admin panel or dashboard
                setTimeout(() => {
                    window.location.href = '/admin.html';
                }, 1000);
            } catch (error) {
                Utils.showAlert('Invalid credentials. Please try again.', 'danger');
            } finally {
                Utils.hideLoading(loginForm);
            }
        });
    }
}

// Register Form Handler
function setupRegisterForm() {
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(registerForm);
            const userData = {
                name: formData.get('name'),
                email: formData.get('email'),
                password: formData.get('password'),
                confirmPassword: formData.get('confirmPassword')
            };

            if (!userData.name || !userData.email || !userData.password || !userData.confirmPassword) {
                Utils.showAlert('Please fill in all fields.', 'danger');
                return;
            }

            if (userData.password !== userData.confirmPassword) {
                Utils.showAlert('Passwords do not match.', 'danger');
                return;
            }

            if (userData.password.length < 6) {
                Utils.showAlert('Password must be at least 6 characters long.', 'danger');
                return;
            }

            try {
                Utils.showLoading(registerForm);
                await API.register(userData);
                Utils.showAlert('Registration successful! You can now login.', 'success');
                registerForm.reset();
            } catch (error) {
                Utils.showAlert('Registration failed. Please try again.', 'danger');
            } finally {
                Utils.hideLoading(registerForm);
            }
        });
    }
}

// Load News
async function loadNews() {
    const newsContainer = document.getElementById('news-container');
    if (newsContainer) {
        try {
            const news = await API.getNews();
            displayNews(news);
        } catch (error) {
            console.error('Error loading news:', error);
        }
    }
}

function displayNews(news) {
    const newsContainer = document.getElementById('news-container');
    if (!newsContainer || !news.length) return;

    const newsHTML = news.map(article => `
        <div class="col-lg-4 col-md-6">
            <div class="blog-card">
                <div class="blog-card__image">
                    <img src="${article.image || 'assets/images/blog/blog-standard-img1.jpg'}" alt="${article.title}">
                </div>
                <div class="blog-card__content">
                    <div class="blog-card__date">
                        <span>${Utils.formatDate(article.date)}</span>
                    </div>
                    <h3><a href="/news-detail.html?id=${article._id}">${article.title}</a></h3>
                    <p>${article.content.substring(0, 100)}...</p>
                    <a href="/news-detail.html?id=${article._id}" class="blog-card__link">Read More</a>
                </div>
            </div>
        </div>
    `).join('');

    newsContainer.innerHTML = newsHTML;
}

// Load Events
async function loadEvents() {
    const eventsContainer = document.getElementById('events-container');
    if (eventsContainer) {
        try {
            const events = await API.getEvents();
            displayEvents(events);
        } catch (error) {
            console.error('Error loading events:', error);
        }
    }
}

function displayEvents(events) {
    const eventsContainer = document.getElementById('events-container');
    if (!eventsContainer || !events.length) return;

    const eventsHTML = events.map(event => `
        <div class="col-lg-6 col-md-6">
            <div class="event-card">
                <div class="event-card__image">
                    <img src="${event.image || 'assets/images/blog/blog-standard-img1.jpg'}" alt="${event.title}">
                </div>
                <div class="event-card__content">
                    <div class="event-card__date">
                        <span>${Utils.formatDate(event.date)}</span>
                    </div>
                    <h3>${event.title}</h3>
                    <p>${event.description.substring(0, 150)}...</p>
                    <div class="event-card__meta">
                        <span><i class="fas fa-clock"></i> ${event.time}</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${event.location}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    eventsContainer.innerHTML = eventsHTML;
}

// Navigation Setup
function setupNavigation() {
    // Handle active navigation links
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });

    // Handle dropdown menus
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            const dropdown = this.nextElementSibling;
            dropdown.classList.toggle('show');
        });
    });
}

// Check Authentication Status
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        // User is logged in
        const userData = JSON.parse(user);
        updateUIForLoggedInUser(userData);
    } else {
        // User is not logged in
        updateUIForGuest();
    }
}

function updateUIForLoggedInUser(user) {
    // Show admin links if user is admin
    if (user.role === 'admin') {
        const adminLinks = document.querySelectorAll('.admin-only');
        adminLinks.forEach(link => {
            link.style.display = 'block';
        });
    }

    // Update user menu
    const userMenu = document.getElementById('user-menu');
    if (userMenu) {
        userMenu.innerHTML = `
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown">
                    ${user.name}
                </a>
                <ul class="dropdown-menu">
                    <li><a class="dropdown-item" href="/profile.html">Profile</a></li>
                    ${user.role === 'admin' ? '<li><a class="dropdown-item" href="/admin.html">Admin Panel</a></li>' : ''}
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" onclick="logout()">Logout</a></li>
                </ul>
            </li>
        `;
    }
}

function updateUIForGuest() {
    // Hide admin links
    const adminLinks = document.querySelectorAll('.admin-only');
    adminLinks.forEach(link => {
        link.style.display = 'none';
    });
}

// Logout Function
async function logout() {
    try {
        await API.logout();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        Utils.showAlert('Logged out successfully.', 'success');
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    } catch (error) {
        console.error('Logout error:', error);
        // Still clear local storage even if API call fails
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    }
}

// File Upload Handler
function setupFileUpload(inputElement, previewElement) {
    if (inputElement && previewElement) {
        inputElement.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewElement.src = e.target.result;
                    previewElement.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

// Search Functionality
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    
    if (searchInput && searchButton) {
        searchButton.addEventListener('click', function() {
            const query = searchInput.value.trim();
            if (query) {
                performSearch(query);
            }
        });

        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query) {
                    performSearch(query);
                }
            }
        });
    }
}

async function performSearch(query) {
    try {
        // Search in news and events
        const [news, events] = await Promise.all([
            API.getNews(),
            API.getEvents()
        ]);

        const results = {
            news: news.filter(article => 
                article.title.toLowerCase().includes(query.toLowerCase()) ||
                article.content.toLowerCase().includes(query.toLowerCase())
            ),
            events: events.filter(event => 
                event.title.toLowerCase().includes(query.toLowerCase()) ||
                event.description.toLowerCase().includes(query.toLowerCase())
            )
        };

        displaySearchResults(results, query);
    } catch (error) {
        console.error('Search error:', error);
        Utils.showAlert('Error performing search. Please try again.', 'danger');
    }
}

function displaySearchResults(results, query) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;

    let resultsHTML = `<h3>Search Results for "${query}"</h3>`;

    if (results.news.length > 0) {
        resultsHTML += '<h4>News Articles</h4>';
        resultsHTML += results.news.map(article => `
            <div class="search-result-item">
                <h5><a href="/news-detail.html?id=${article._id}">${article.title}</a></h5>
                <p>${article.content.substring(0, 200)}...</p>
            </div>
        `).join('');
    }

    if (results.events.length > 0) {
        resultsHTML += '<h4>Events</h4>';
        resultsHTML += results.events.map(event => `
            <div class="search-result-item">
                <h5>${event.title}</h5>
                <p>${event.description.substring(0, 200)}...</p>
                <small>Date: ${Utils.formatDate(event.date)} | Location: ${event.location}</small>
            </div>
        `).join('');
    }

    if (results.news.length === 0 && results.events.length === 0) {
        resultsHTML += '<p>No results found.</p>';
    }

    resultsContainer.innerHTML = resultsHTML;
}

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupSearch();
});

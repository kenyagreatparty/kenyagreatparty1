# Kenya Great Party (KGP) - Full-Stack Web Application

A comprehensive full-stack web application for the Kenya Great Party, featuring a modern frontend with complete backend functionality including user authentication, content management, and administrative capabilities.

## 🚀 Features

### Frontend
- **Responsive Design**: Modern, mobile-first design with Bootstrap 5
- **Dynamic Content**: Real-time news and events display
- **Interactive Forms**: Contact form and membership application with validation
- **Admin Panel**: Complete administrative interface for content management
- **User Authentication**: Secure login system with JWT tokens

### Backend
- **RESTful API**: Complete API endpoints for all functionality
- **Database Integration**: MongoDB with Mongoose ODM
- **User Management**: Registration, authentication, and role-based access
- **Content Management**: CRUD operations for news and events
- **File Upload**: Image and document upload capabilities
- **Email Notifications**: Automated email responses for form submissions
- **Security**: Rate limiting, CORS, helmet, and input validation

## 🛠️ Technology Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Bootstrap 5
- Font Awesome Icons
- jQuery
- Swiper.js (for sliders)
- Custom CSS animations

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT (JSON Web Tokens)
- bcrypt (password hashing)
- Multer (file uploads)
- Nodemailer (email notifications)
- Express Rate Limit
- Helmet (security)
- CORS

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kenyagreatparty1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory with the following variables:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/kenya-great-party
   JWT_SECRET=your-super-secret-jwt-key
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-email-password
   FRONTEND_URL=http://localhost:5000
   ```

4. **Database Setup**
   - For local MongoDB: Make sure MongoDB is running on your system
   - For MongoDB Atlas: Update the MONGODB_URI in your .env file

5. **Start the application**
   ```bash
   npm start
   ```

   The application will be available at `http://localhost:5000`

## 📁 Project Structure

```
kenyagreatparty1/
├── public/                 # Frontend files
│   ├── assets/            # CSS, JS, images, and vendor files
│   ├── js/                # Custom JavaScript files
│   │   ├── api.js         # API integration
│   │   ├── app.js         # Main application logic
│   │   └── admin.js       # Admin panel functionality
│   ├── uploads/           # File uploads directory
│   ├── index.html         # Homepage
│   ├── about.html         # About page
│   ├── contact.html       # Contact page
│   ├── join.html          # Membership application
│   ├── news.html          # News page
│   ├── downloads.html     # Downloads page
│   ├── admin.html         # Admin panel
│   └── login.html         # Login page
├── models/                # Database models
│   ├── User.js           # User model
│   ├── News.js           # News model
│   ├── Event.js          # Event model
│   ├── Contact.js        # Contact model
│   └── Membership.js     # Membership model
├── routes/                # API routes
│   ├── auth.js           # Authentication routes
│   ├── users.js          # User management routes
│   ├── news.js           # News management routes
│   ├── events.js         # Event management routes
│   ├── contact.js        # Contact form routes
│   ├── membership.js     # Membership routes
│   ├── upload.js         # File upload routes
│   └── admin.js          # Admin routes
├── middleware/            # Custom middleware
│   ├── auth.js           # Authentication middleware
│   └── validation.js     # Input validation middleware
├── utils/                 # Utility functions
│   └── email.js          # Email service
├── server.js             # Main server file
├── package.json          # Dependencies and scripts
├── .env.example          # Environment variables template
└── README.md             # This file
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### News Management
- `GET /api/news` - Get all news articles
- `GET /api/news/:id` - Get specific news article
- `POST /api/news` - Create news article (Admin only)
- `PUT /api/news/:id` - Update news article (Admin only)
- `DELETE /api/news/:id` - Delete news article (Admin only)

### Events Management
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get specific event
- `POST /api/events` - Create event (Admin only)
- `PUT /api/events/:id` - Update event (Admin only)
- `DELETE /api/events/:id` - Delete event (Admin only)

### Contact & Membership
- `POST /api/contact` - Submit contact form
- `POST /api/membership` - Submit membership application

### File Upload
- `POST /api/upload` - Upload files (images/documents)

### Admin Panel
- `GET /api/admin/users` - Get all users (Admin only)
- `GET /api/admin/contacts` - Get all contact messages (Admin only)
- `GET /api/admin/memberships` - Get all membership applications (Admin only)
- `PUT /api/admin/memberships/:id` - Update membership status (Admin only)

## 👥 User Roles

### Regular User
- View news and events
- Submit contact forms
- Apply for membership
- Access public content

### Admin User
- All regular user permissions
- Manage news articles
- Manage events
- View and manage contact messages
- Review and approve membership applications
- Manage user accounts
- Access admin dashboard

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Configurable cross-origin resource sharing
- **Helmet**: Security headers for protection against common vulnerabilities
- **File Upload Security**: Type and size validation for uploads

## 📧 Email Notifications

The application includes automated email notifications for:
- Contact form submissions
- Membership applications
- User registration confirmations

Configure your email settings in the `.env` file to enable email functionality.

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
EMAIL_USER=your-production-email
EMAIL_PASS=your-production-email-password
FRONTEND_URL=https://your-domain.com
```

### Deployment Steps
1. Set up a production MongoDB database (MongoDB Atlas recommended)
2. Configure environment variables for production
3. Deploy to your preferred hosting platform (Heroku, DigitalOcean, AWS, etc.)
4. Set up file storage for uploads (AWS S3, Cloudinary, etc.)
5. Configure email service for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions, please contact:
- Email: info@kenyagreatparty.org
- Phone: +254 729 554 475

## 🙏 Acknowledgments

- Bootstrap for the responsive framework
- Font Awesome for the icon library
- MongoDB for the database solution
- Express.js for the web framework
- All contributors and supporters of the Kenya Great Party

---

**Kenya Great Party** - Building a Brighter Future for Kenya 🇰🇪

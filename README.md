# Tech Grid Series - Backend Server

A robust Node.js backend server for handling form submissions and email notifications for The Tech Grid Series website. Built with Express.js, MongoDB, and Nodemailer with IONOS SMTP integration.

## 🚀 Features

- **Contact Form Processing** - Handle contact inquiries with auto-replies and admin notifications
- **Conference Registration** - Manage event registrations with confirmation emails
- **Newsletter Subscription** - Handle newsletter subscriptions with welcome emails
- **Email Integration** - IONOS SMTP configuration with Nodemailer
- **Data Validation** - Comprehensive input validation and sanitization
- **Rate Limiting** - Prevent spam and abuse with configurable rate limits
- **Security** - Built-in security middleware (Helmet, CORS, XSS protection)
- **Logging** - Comprehensive logging system with file and console output
- **MongoDB Integration** - Robust data models with validation and indexing

## 📋 Prerequisites

- Node.js (v16.0.0 or higher)
- MongoDB (v4.4 or higher)
- IONOS email account for SMTP

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd techgrid-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Update the `.env` file with your specific values:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   APP_URL=http://localhost:3000

   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/techgrid_events
   DB_NAME=techgrid_events

   # Email Configuration (IONOS SMTP)
   SMTP_HOST=smtp.ionos.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your_email@domain.com
   SMTP_PASS=your_password

   # Email Addresses
   FROM_EMAIL=your_email@domain.com
   ADMIN_EMAIL_1=admin1@domain.com
   ADMIN_EMAIL_2=admin2@domain.com
   NOREPLY_EMAIL=noreply@domain.com

   # Security Configuration
   JWT_SECRET=your_jwt_secret_here
   CSRF_SECRET=your_csrf_secret_here
   ```

4. **Start MongoDB**
   ```bash
   # Using MongoDB service
   sudo systemctl start mongod

   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Start the server**
   ```bash
   # Development mode with auto-restart
   npm run dev

   # Production mode
   npm start
   ```

## 📡 API Endpoints

### Contact Form
- **POST** `/api/contact` - Submit contact form
- **GET** `/api/contact/health` - Health check
- **GET** `/api/contact/stats` - Get statistics (admin)

### Registration
- **POST** `/api/register` - Submit conference registration
- **GET** `/api/register/verify/:registrationId` - Verify registration
- **GET** `/api/register/health` - Health check
- **GET** `/api/register/stats` - Get statistics (admin)

### Newsletter
- **POST** `/api/newsletter` - Subscribe to newsletter
- **GET** `/api/newsletter/unsubscribe` - Unsubscribe from newsletter
- **POST** `/api/newsletter/resubscribe` - Resubscribe to newsletter
- **GET** `/api/newsletter/health` - Health check
- **GET** `/api/newsletter/stats` - Get statistics (admin)

### General
- **GET** `/health` - Server health check
- **GET** `/` - API information

## 📝 Request Examples

### Contact Form Submission
```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+234123456789",
    "subject": "Conference Inquiry",
    "message": "I would like to know more about the conference."
  }'
```

### Conference Registration
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+234123456789",
    "company": "Tech Corp",
    "jobTitle": "Software Engineer",
    "experience": "intermediate",
    "interests": ["ai-trading", "fraud-detection"],
    "expectations": "Learn about AI applications in finance",
    "newsletter": true,
    "terms": true
  }'
```

### Newsletter Subscription
```bash
curl -X POST http://localhost:3000/api/newsletter \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment mode | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/techgrid_events |
| `SMTP_HOST` | SMTP server host | smtp.ionos.com |
| `SMTP_PORT` | SMTP server port | 587 |
| `SMTP_USER` | SMTP username | - |
| `SMTP_PASS` | SMTP password | - |
| `CONTACT_RATE_LIMIT` | Contact form rate limit | 5 |
| `REGISTRATION_RATE_LIMIT` | Registration rate limit | 3 |
| `NEWSLETTER_RATE_LIMIT` | Newsletter rate limit | 10 |

### Rate Limiting

- **Contact Form**: 5 requests per 15 minutes per IP
- **Registration**: 3 requests per hour per IP
- **Newsletter**: 10 requests per hour per IP
- **General API**: 100 requests per 15 minutes per IP

### Email Templates

The server uses Handlebars templates for emails. Templates are located in the `templates/` directory:

- `contact_auto_reply.html` - Auto-reply for contact form
- `contact_admin_notification.html` - Admin notification for contact
- `registration_confirmation.html` - Registration confirmation
- `registration_admin_notification.html` - Admin notification for registration
- `newsletter_welcome.html` - Newsletter welcome email
- `newsletter_admin_notification.html` - Admin notification for newsletter

If templates are not found, the server uses built-in default templates.

## 🔒 Security Features

- **Input Validation**: Comprehensive validation using express-validator
- **Rate Limiting**: Configurable rate limits per endpoint
- **CORS Protection**: Configurable CORS settings
- **XSS Protection**: Input sanitization and XSS prevention
- **Helmet**: Security headers middleware
- **MongoDB Injection Protection**: Query sanitization
- **Parameter Pollution Protection**: HPP middleware

## 📊 Logging

The server includes comprehensive logging:

- **Console Output**: Real-time logging to console
- **File Logging**: Separate log files for different levels
- **Request Logging**: HTTP request logging with Morgan
- **Error Tracking**: Detailed error logging with stack traces

Log files are stored in the `logs/` directory:
- `error.log` - Error messages
- `warn.log` - Warning messages
- `info.log` - Info messages
- `app.log` - General application logs

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint
```

## 📦 Database Schema

### Contact Collection
```javascript
{
  contactId: String (UUID),
  name: String,
  email: String,
  phone: String,
  subject: String,
  message: String,
  metadata: {
    timestamp: Date,
    userAgent: String,
    ipAddress: String,
    source: String
  },
  status: String,
  emailSent: Boolean,
  adminNotified: Boolean
}
```

### Registration Collection
```javascript
{
  registrationId: String (UUID),
  firstName: String,
  lastName: String,
  email: String (unique),
  phone: String,
  company: String,
  jobTitle: String,
  experience: String,
  interests: [String],
  expectations: String,
  newsletter: Boolean,
  terms: Boolean,
  registrationNumber: String (unique),
  metadata: {
    timestamp: Date,
    userAgent: String,
    ipAddress: String,
    eventId: String,
    status: String
  },
  confirmationEmailSent: Boolean,
  adminNotified: Boolean
}
```

### Newsletter Collection
```javascript
{
  subscriptionId: String (UUID),
  email: String (unique),
  metadata: {
    timestamp: Date,
    userAgent: String,
    ipAddress: String,
    sourcePage: String,
    status: String
  },
  isActive: Boolean,
  welcomeEmailSent: Boolean,
  adminNotified: Boolean
}
```

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure production MongoDB URI
- [ ] Set up proper SMTP credentials
- [ ] Configure production domain in `APP_URL`
- [ ] Set up SSL/TLS certificates
- [ ] Configure reverse proxy (nginx)
- [ ] Set up monitoring and logging
- [ ] Configure backup procedures
- [ ] Test email delivery
- [ ] Set up process manager (PM2)

### PM2 Deployment
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name "techgrid-server"

# Save PM2 configuration
pm2 save

# Set up auto-restart on system reboot
pm2 startup
```

## 🐛 Troubleshooting

### Common Issues

1. **SMTP Connection Failed**
   - Verify SMTP credentials
   - Check firewall settings
   - Ensure TLS is properly configured

2. **MongoDB Connection Error**
   - Verify MongoDB is running
   - Check connection string
   - Ensure database permissions

3. **Rate Limiting Issues**
   - Adjust rate limit settings in `.env`
   - Check IP address detection
   - Consider using Redis for distributed rate limiting

4. **Email Delivery Issues**
   - Check spam folders
   - Verify DNS settings
   - Test SMTP connection manually

## 📞 Support

For technical support, contact:
- **Email**: events@surfspotonline.com
- **Backup**: events@surfspot.com.ng
- **Organization**: SurfSpot Communications Limited

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

*Built with ❤️ for The Tech Grid Series*

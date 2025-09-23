# Tech Grid Series API Integration Guide

## 📡 Base Configuration

**Base URL:** `http://localhost:3000` (Development)  
**Content-Type:** `application/json`  
**CORS:** Enabled for all origins in development  

## 🔗 Available API Endpoints

### 🏥 Health & Status Endpoints

#### Server Health Check
```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "Tech Grid Series API Server is running",
  "timestamp": "2025-09-23T17:30:00.000Z",
  "environment": "development"
}
```

#### Service-Specific Health Checks
```http
GET /api/contact/health
GET /api/register/health  
GET /api/newsletter/health
```

---

## 📧 Contact Form API

### Submit Contact Form
```http
POST /api/contact
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "subject": "Inquiry about AI Trading",
  "message": "I'm interested in learning more about your conference."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Contact form submitted successfully",
  "data": {
    "contactId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "status": "pending",
    "emailSent": true,
    "metadata": {
      "timestamp": "2025-09-23T17:30:00.000Z",
      "source": "website"
    }
  }
}
```

**Validation Errors (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    },
    {
      "field": "name",
      "message": "Name must be between 2 and 100 characters"
    }
  ]
}
```

**Rate Limit Error (429):**
```json
{
  "success": false,
  "message": "Too many contact form submissions. Please try again in 15 minutes.",
  "retryAfter": 900
}
```

### Contact Statistics (Admin)
```http
GET /api/contact/stats
```

---

## 🎫 Registration API

### Submit Conference Registration
```http
POST /api/register
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "company": "Tech Corp",
  "jobTitle": "Software Engineer",
  "experience": "intermediate",
  "interests": ["ai-trading", "risk-management"],
  "expectations": "Learn about AI applications in finance",
  "newsletter": true,
  "terms": true
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "registrationId": "550e8400-e29b-41d4-a716-446655440001",
    "registrationNumber": "TGS20251234",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "confirmationEmailSent": true,
    "metadata": {
      "timestamp": "2025-09-23T17:30:00.000Z",
      "status": "registered",
      "eventId": "tech_grid_ai_finance_2025"
    }
  }
}
```

**Duplicate Registration Error (409):**
```json
{
  "success": false,
  "message": "Email address is already registered for this event",
  "existingRegistration": {
    "registrationNumber": "TGS20251123",
    "registeredDate": "2025-09-20T10:30:00.000Z"
  }
}
```

**Validation Errors (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "experience",
      "message": "Experience must be one of: beginner, intermediate, advanced, expert"
    },
    {
      "field": "terms",
      "message": "You must accept the terms and conditions"
    }
  ]
}
```

### Verify Registration
```http
GET /api/register/verify/:registrationId
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "registrationNumber": "TGS20251234",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "status": "confirmed",
    "registeredDate": "2025-09-23T17:30:00.000Z"
  }
}
```

**Not Found Error (404):**
```json
{
  "success": false,
  "message": "Registration not found"
}
```

### Registration Statistics (Admin)
```http
GET /api/register/stats
```

---

## 📰 Newsletter API

### Subscribe to Newsletter
```http
POST /api/newsletter
```

**Request Body:**
```json
{
  "email": "subscriber@example.com",
  "preferences": {
    "frequency": "weekly"
  },
  "source": "website"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Successfully subscribed to newsletter",
  "data": {
    "subscriptionId": "550e8400-e29b-41d4-a716-446655440002",
    "email": "subscriber@example.com",
    "isActive": true,
    "welcomeEmailSent": true,
    "metadata": {
      "timestamp": "2025-09-23T17:30:00.000Z",
      "status": "subscribed",
      "sourcePage": "website"
    }
  }
}
```

**Already Subscribed Error (409):**
```json
{
  "success": false,
  "message": "Email address is already subscribed to our newsletter",
  "existingSubscription": {
    "subscriptionId": "550e8400-e29b-41d4-a716-446655440002",
    "subscribedDate": "2025-09-20T10:30:00.000Z",
    "isActive": true
  }
}
```

### Unsubscribe from Newsletter
```http
GET /api/newsletter/unsubscribe?email=subscriber@example.com&token=abc123
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Successfully unsubscribed from newsletter"
}
```

### Resubscribe to Newsletter
```http
POST /api/newsletter/resubscribe
```

**Request Body:**
```json
{
  "email": "subscriber@example.com"
}
```

### Newsletter Statistics (Admin)
```http
GET /api/newsletter/stats
```

---

## 🎛️ Dashboard API (Admin)

### Dashboard Overview
```http
GET /dashboard/api/overview
```

**Response:**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "contacts": {
        "total": 150,
        "pending": 45,
        "processed": 80,
        "responded": 25,
        "emailsSent": 145
      },
      "registrations": {
        "total": 89,
        "registered": 60,
        "confirmed": 25,
        "cancelled": 2,
        "attended": 2,
        "confirmationsSent": 87
      },
      "newsletter": {
        "total": 234,
        "active": 220,
        "subscribed": 225,
        "unsubscribed": 9,
        "welcomesSent": 230
      }
    },
    "recentActivity": {
      "contacts": [...],
      "registrations": [...],
      "newsletter": [...]
    }
  }
}
```

### CRUD Operations

#### Get Records with Pagination
```http
GET /dashboard/api/{contacts|registrations|newsletter}?page=1&limit=10&search=john&status=pending
```

#### Get Single Record
```http
GET /dashboard/api/{contacts|registrations|newsletter}/:id
```

#### Create New Record
```http
POST /dashboard/api/{contacts|registrations|newsletter}
```

#### Update Record
```http
PUT /dashboard/api/{contacts|registrations|newsletter}/:id
```

#### Delete Record
```http
DELETE /dashboard/api/{contacts|registrations|newsletter}/:id
```

#### Update Registration Status
```http
PATCH /dashboard/api/registrations/:id/status
```

**Request Body:**
```json
{
  "status": "confirmed"
}
```

---

## 🚨 Error Handling Guide

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data or validation errors |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource (email already exists) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Standard Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Specific field error"
    }
  ],
  "code": "ERROR_CODE",
  "timestamp": "2025-09-23T17:30:00.000Z"
}
```

### Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/contact` | 5 requests | 15 minutes |
| `/api/register` | No limit | - |
| `/api/newsletter` | 10 requests | 1 hour |
| Dashboard APIs | 100 requests | 15 minutes |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1695484200
```

---

## 🔧 Frontend Integration Examples

### JavaScript/Fetch Example

```javascript
// Contact Form Submission
async function submitContactForm(formData) {
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });

    const result = await response.json();

    if (result.success) {
      // Handle success
      showSuccessMessage('Thank you! Your message has been sent.');
      return result.data;
    } else {
      // Handle validation errors
      displayValidationErrors(result.errors);
      throw new Error(result.message);
    }
  } catch (error) {
    // Handle network errors
    console.error('Submission failed:', error);
    showErrorMessage('Something went wrong. Please try again.');
    throw error;
  }
}

// Registration with Error Handling
async function registerForEvent(registrationData) {
  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrationData)
    });

    const result = await response.json();

    if (response.status === 409) {
      // Handle duplicate registration
      showWarningMessage(`You're already registered! Your registration number is ${result.existingRegistration.registrationNumber}`);
      return;
    }

    if (result.success) {
      // Handle successful registration
      showSuccessMessage(`Registration successful! Your number is ${result.data.registrationNumber}`);
      return result.data;
    } else {
      // Handle validation errors
      displayValidationErrors(result.errors);
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Registration failed:', error);
    showErrorMessage('Registration failed. Please try again.');
    throw error;
  }
}

// Newsletter Subscription
async function subscribeToNewsletter(email) {
  try {
    const response = await fetch('/api/newsletter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        preferences: { frequency: 'weekly' },
        source: 'website'
      })
    });

    const result = await response.json();

    if (response.status === 409) {
      // Already subscribed
      showInfoMessage('You are already subscribed to our newsletter!');
      return;
    }

    if (result.success) {
      showSuccessMessage('Successfully subscribed to newsletter!');
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Newsletter subscription failed:', error);
    showErrorMessage('Subscription failed. Please try again.');
    throw error;
  }
}
```

### React Hook Example

```javascript
import { useState } from 'react';

function useApiSubmission(endpoint) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (data) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { submit, loading, error };
}

// Usage
function ContactForm() {
  const { submit, loading, error } = useApiSubmission('/api/contact');

  const handleSubmit = async (formData) => {
    try {
      const result = await submit(formData);
      // Handle success
    } catch (err) {
      // Error is already set in the hook
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}
```

---

## 🔒 Security Considerations

### Input Validation
- All inputs are sanitized to prevent XSS attacks
- Email addresses are validated and normalized
- Phone numbers are validated for format
- HTML content is stripped from text fields

### Rate Limiting
- Implement client-side rate limiting awareness
- Show appropriate messages when limits are reached
- Cache rate limit headers for better UX

### CORS Policy
- Development: All origins allowed
- Production: Configure specific domains only

### Data Privacy
- Email addresses are stored in lowercase
- No sensitive data is exposed in error messages

---

## 📋 Field Validation Rules

### Contact Form
| Field | Required | Min Length | Max Length | Format |
|-------|----------|------------|------------|--------|
| name | Yes | 2 | 100 | Letters, spaces, hyphens, apostrophes |
| email | Yes | - | 320 | Valid email (flexible format) |
| phone | Yes | 7 | 25 | Numbers, spaces, dashes, parentheses, dots |
| subject | Yes | 5 | 200 | Text |
| message | Yes | 10 | 2000 | Text |

### Registration Form
| Field | Required | Options/Format |
|-------|----------|----------------|
| firstName | Yes | 2-50 characters |
| lastName | Yes | 2-50 characters |
| email | Yes | Valid email (flexible format), unique |
| phone | Yes | 7-25 characters, flexible format |
| company | No | 0-100 characters |
| jobTitle | No | 0-100 characters |
| experience | Yes | beginner, intermediate, advanced, expert |
| interests | No | Array of predefined options |
| expectations | No | 0-1000 characters |
| newsletter | No | Boolean |
| terms | Yes | Must be true |

### Newsletter Subscription
| Field | Required | Format |
|-------|----------|--------|
| email | Yes | Valid email (flexible format), unique |
| preferences.frequency | No | daily, weekly, monthly |

---

## 🧪 Testing Endpoints

### Health Check Test
```bash
curl -X GET http://localhost:3000/health
```

### Contact Form Test
```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+1234567890",
    "subject": "Test Subject",
    "message": "This is a test message."
  }'
```

### Registration Test
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "experience": "intermediate",
    "terms": true
  }'
```

---

## 📞 Support & Contact

**Technical Support:** events@surfspotonline.com  
**Backup Contact:** events@surfspot.com.ng  
**Organization:** SurfSpot Communications Limited

**Dashboard Access:** http://localhost:3000/dashboard  
**API Documentation:** This document  
**Server Status:** http://localhost:3000/health

---

*Last Updated: September 23, 2025*  
*API Version: 1.0.0*

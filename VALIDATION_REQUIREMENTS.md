# 📋 VALIDATION REQUIREMENTS FOR CONTACT FORM

## 🔧 **Current Validation Error**

The POST request failed because of strict validation rules in the Contact model:

```
ValidationError: Contact validation failed: 
- phone: Please provide a valid phone number
- subject: Subject must be at least 5 characters  
- message: Message must be at least 10 characters
```

## ✅ **Validation Rules**

### **Name:**
- Required
- 2-100 characters
- Only letters, spaces, apostrophes, hyphens
- Pattern: `/^[a-zA-Z\s'-]+$/`

### **Email:**
- Required
- Valid email format
- Max 255 characters
- Pattern: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

### **Phone:**
- Required
- 10-20 characters
- **Must start with 1-9 (not 0)**
- Pattern: `/^[\+]?[1-9][\d]{0,15}$/`
- Examples:
  - ✅ `+2348080896901` (with country code)
  - ✅ `2348080896901` (without +)
  - ✅ `8080896901` (starts with 8)
  - ❌ `07080896901` (starts with 0)

### **Subject:**
- Required
- **Minimum 5 characters**
- Max 200 characters
- Examples:
  - ✅ `"Hello there"` (5+ chars)
  - ❌ `"TEST"` (only 4 chars)

### **Message:**
- Required
- **Minimum 10 characters**
- Max 2000 characters
- Examples:
  - ✅ `"This is a test message"` (10+ chars)
  - ❌ `"Test"` (only 4 chars)

## 🔧 **Fixed Backend Response**

Now returns proper validation errors:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "phone": "Please provide a valid phone number",
    "subject": "Subject must be at least 5 characters",
    "message": "Message must be at least 10 characters"
  }
}
```

## 📋 **Test With Valid Data**

Try creating a contact with:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+2348080896901",
  "subject": "Test Subject Here",
  "message": "This is a test message with more than 10 characters",
  "status": "pending"
}
```

## 🚀 **Server Updated**

- ✅ Better error handling for validation
- ✅ Returns specific field errors
- ✅ 400 status for validation errors (not 500)

**Now when you try to create a contact, you'll get clear validation error messages instead of generic 500 errors.**

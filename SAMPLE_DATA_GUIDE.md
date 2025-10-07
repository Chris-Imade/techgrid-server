# Sample Data Guide

## Quick Start

Run the seeding script to populate your database with test data:

```bash
node seed-sample-data.js
```

## What Gets Created

### 📧 **5 Sample Contacts**
- **1 Pending** - John Smith (General inquiry about event)
- **2 Processed** - Sarah Johnson (Partnership), David Okonkwo (Group registration)
- **1 Responded** - Michael Chen (Speaking opportunity - already replied to)
- **1 Pending** - Emily Williams (Sponsorship inquiry)

**Perfect for testing:**
- Contact list view and filtering
- Contact detail view
- Reply functionality (try replying to pending/processed ones)
- Status badges

---

### 👥 **8 Sample Registrations**

**By Experience Level:**
- 2 Beginners (Fatima Ibrahim, Grace Okeke)
- 2 Intermediate (Chioma Nwosu, Chukwudi Nnaji)
- 2 Advanced (Oluwaseun Adeyemi, Blessing Chukwuma)
- 2 Experts (Amara Eze, Ifeanyi Okafor)

**By Status:**
- 4 Confirmed (Amara, Oluwaseun, Ifeanyi, Blessing)
- 4 Registered (Chioma, Fatima, Grace, Chukwudi)

**Newsletter Status:**
- **5 Subscribed** to newsletter (Amara, Chioma, Ifeanyi, Grace, Blessing)
- **3 Not Subscribed** (Oluwaseun, Fatima, Chukwudi) ⭐ **Test "Add to Newsletter" on these!**

**Perfect for testing:**
- Registration list view
- Experience and status filters
- **Add to Newsletter button** (on Oluwaseun, Fatima, Chukwudi)
- Newsletter badge for already subscribed users
- Edit and status update features

---

### 📰 **8 Sample Newsletter Subscriptions**

**From Registrations (5):**
- amara.eze@techbank.ng (confirmed attendee)
- chioma.nwosu@fintechstartup.com
- ifeanyi.okafor@digitalbank.ng (confirmed attendee)
- grace.okeke@student.edu.ng (student)
- blessing.c@insurancetech.ng (CTO, confirmed attendee)

**Direct Subscriptions (2):**
- newsletter.subscriber1@gmail.com
- newsletter.subscriber2@yahoo.com

**Unsubscribed (1):**
- former.subscriber@outlook.com (unsubscribed reason: "Too many emails")

**Preferences:**
- 6 Weekly frequency
- 2 Monthly frequency
- Various topic preferences

**Perfect for testing:**
- Newsletter list view
- Active/inactive filter
- Status filter (subscribed/unsubscribed)
- Source tracking (registration vs direct)
- Unsubscribe/resubscribe functionality

---

## Testing Scenarios

### ✅ **Scenario 1: Reply to a Contact**
1. Go to Contacts section
2. Click "View" on **John Smith** (pending status)
3. Click "Reply" button
4. Compose a reply using the rich text editor
5. Send and verify:
   - Status changes to "responded"
   - Reply timestamp appears
   - Email sent successfully

### ✅ **Scenario 2: Add Registration to Newsletter**
1. Go to Registrations section
2. Find **Oluwaseun Adeyemi** (not subscribed)
3. Click green "Newsletter" button
4. Confirm action
5. Verify:
   - Button changes to "In Newsletter" badge
   - Go to Newsletter section - new subscription appears
   - Check newsletter field in registration (should be true)

### ✅ **Scenario 3: Test Filters**
1. **Contacts:**
   - Filter by "Pending" - should show 2
   - Filter by "Responded" - should show 1
   - Search for "Partnership" - finds Sarah Johnson

2. **Registrations:**
   - Filter by "Beginner" experience - shows 2
   - Filter by "Confirmed" status - shows 4
   - Search for "Digital Bank" - finds Ifeanyi

3. **Newsletter:**
   - Filter "Active" - shows 7
   - Filter "Inactive" - shows 1
   - Filter "Subscribed" status - shows 7

### ✅ **Scenario 4: View Dashboard Analytics**
1. Go to Dashboard Overview
2. Verify counts:
   - Total Contacts: 5
   - Total Registrations: 8
   - Newsletter Subscribers: 8
3. Check recent activity shows latest entries
4. Click section names to navigate

### ✅ **Scenario 5: Test Already Subscribed**
1. Go to Registrations
2. Find **Amara Eze** (already subscribed)
3. Verify "In Newsletter" badge shows (not button)
4. Try adding again - should see error message

---

## Database State After Seeding

```
📊 Summary:
   ✓ 5 Contacts (2 pending, 2 processed, 1 responded)
   ✓ 8 Registrations (4 confirmed, 4 registered)
   ✓ 8 Newsletter Subscriptions (7 active, 1 inactive)
   ✓ 3 Registrations available for newsletter addition
   ✓ 5 Registrations already linked to newsletter
```

---

## Re-running the Seeder

**⚠️ Warning:** Running the seeder again will **delete all existing data** and create fresh sample data.

To re-seed:
```bash
node seed-sample-data.js
```

---

## Sample Data Details

### Contact Examples
- **Tech inquiries** (John Smith)
- **Business partnerships** (Sarah Johnson)
- **Speaking opportunities** (Michael Chen)
- **Sponsorships** (Emily Williams)
- **Group registrations** (David Okonkwo)

### Registration Examples
- **Corporate professionals** (various companies)
- **Students** (Grace Okeke)
- **Consultants** (Fatima Ibrahim)
- **CTOs/Leaders** (Ifeanyi Okafor, Blessing Chukwuma)
- **Researchers** (Amara Eze)

### Realistic Data Features
- ✅ Nigerian phone numbers (+234...)
- ✅ Nigerian companies and organizations
- ✅ Various experience levels
- ✅ Multiple interest combinations
- ✅ Realistic expectations/messages
- ✅ Different IP addresses
- ✅ Various timestamps (spread across September)
- ✅ Different user agents (Windows, Mac, iPhone)

---

## Clearing Data Only

If you want to clear all data without reseeding:

```javascript
// Create clear-data.js
const mongoose = require('mongoose');
require('dotenv').config();

const Contact = require('./models/Contact');
const Registration = require('./models/Registration');
const Newsletter = require('./models/Newsletter');

async function clearData() {
  await mongoose.connect(process.env.MONGODB_URI);
  await Contact.deleteMany({});
  await Registration.deleteMany({});
  await Newsletter.deleteMany({});
  console.log('✅ All data cleared');
  await mongoose.connection.close();
  process.exit(0);
}

clearData();
```

Then run: `node clear-data.js`

---

## Email Addresses for Testing

All sample emails use example/test domains to prevent accidentally sending to real addresses:

**Contacts:**
- john.smith@example.com
- sarah.j@techcorp.com
- mchen@financeai.io
- emily.williams@startup.ng
- david.okonkwo@bankng.com

**Registrations:**
- amara.eze@techbank.ng
- chioma.nwosu@fintechstartup.com
- seun.adeyemi@investcorp.ng ⭐ Test newsletter addition
- fatima.ibrahim@consultant.com ⭐ Test newsletter addition
- ifeanyi.okafor@digitalbank.ng
- grace.okeke@student.edu.ng
- chukwudi.nnaji@cryptofund.io ⭐ Test newsletter addition
- blessing.c@insurancetech.ng

---

## Tips for Testing

1. **Start with Overview** - See all statistics at once
2. **Test Contact Reply** - Use John Smith (pending) for clean test
3. **Add to Newsletter** - Try all 3 non-subscribed registrations
4. **Test Filters** - Each section has different filter options
5. **Search Functionality** - Try searching names, emails, companies
6. **Status Updates** - Change registration statuses
7. **Delete Operations** - Test with confirmation dialogs
8. **Mobile View** - Resize browser to test responsive design

---

## Expected Behavior

After seeding, the dashboard should:
- ✅ Show correct counts (not zeros)
- ✅ Display all records in tables
- ✅ Show recent activity
- ✅ Sidebar badges show totals
- ✅ Filters work correctly
- ✅ Search finds records
- ✅ All CRUD operations work
- ✅ Email features functional (with SMTP configured)

---

## Need More Data?

To add more records, either:
1. **Manually add** through dashboard "Add New" buttons
2. **Modify the seeder** - add more objects to arrays
3. **Run API endpoints** - use your existing form endpoints

---

🎉 **Happy Testing!**

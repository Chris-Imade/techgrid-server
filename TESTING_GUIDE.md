# Dashboard Testing Guide

## Prerequisites
- MongoDB running (either local or cloud connection in .env)
- Node.js installed
- All dependencies installed (`npm install`)

## Starting the Server

```bash
cd /Users/henryjohntech/Documents/Builds/backendProjects/techgrid-server
node server.js
```

You should see:
```
MongoDB Connected: [your-connection]
Server running in production mode on port 3000
```

## Testing Checklist

### 1. Dashboard Access
- [ ] Open browser to `http://localhost:3000/dashboard`
- [ ] Verify white TechGrid logo appears in sidebar (not text)
- [ ] Verify sidebar has blue-to-green gradient background
- [ ] Verify sidebar menu items use official colors

### 2. Overview Page
- [ ] Check all stat cards show actual numbers (not zeros)
- [ ] Verify "Total Contacts" displays correct count
- [ ] Verify "Total Registrations" displays correct count
- [ ] Verify "Newsletter Subscribers" displays correct count
- [ ] Check "Recent Activity" section shows latest 5 items from each category
- [ ] Verify clicking section names in sidebar navigates correctly

### 3. Contact Management

#### List View
- [ ] Navigate to Contacts section
- [ ] Verify all contacts from database are displayed
- [ ] Test search functionality
- [ ] Test status filter (pending, processed, responded)
- [ ] Verify pagination works if more than 10 contacts

#### Detail View
- [ ] Click "View" button on any contact
- [ ] Verify all contact details display correctly:
  - Name, Email, Phone
  - Status badge with color
  - Submitted date
  - Source
- [ ] Verify subject and full message display
- [ ] Check "Back to Contacts" button returns to list

#### Reply Functionality
- [ ] From contact detail view, click "Reply" button
- [ ] Verify reply modal opens
- [ ] Check "To:" field shows contact's email
- [ ] Check "Re:" field shows subject
- [ ] Type a test message in editor
- [ ] Test formatting buttons:
  - [ ] Bold
  - [ ] Italic
  - [ ] Underline
  - [ ] Bullet list
  - [ ] Numbered list
- [ ] Click "Send Reply"
- [ ] Verify success message appears
- [ ] Check contact's email inbox for reply
- [ ] Verify contact status changed to "responded"
- [ ] Verify reply timestamp appears on detail page

### 4. Registration Management

#### List View
- [ ] Navigate to Registrations section
- [ ] Verify all registrations display
- [ ] Check registration numbers display correctly
- [ ] Test search functionality
- [ ] Test status filter
- [ ] Test experience level filter

#### Add to Newsletter
- [ ] Find a registration without newsletter subscription
- [ ] Verify "Newsletter" button is green with plus icon
- [ ] Click "Newsletter" button
- [ ] Verify confirmation dialog appears
- [ ] Confirm action
- [ ] Verify success message
- [ ] Check button changes to "In Newsletter" badge with checkmark
- [ ] Navigate to Newsletter section
- [ ] Verify new subscription was created
- [ ] Check email inbox for welcome email

#### Already Subscribed
- [ ] Find a registration that's already subscribed
- [ ] Verify "In Newsletter" badge shows instead of button
- [ ] Badge should be green with checkmark icon

### 5. Newsletter Section
- [ ] Navigate to Newsletter section
- [ ] Verify all subscriptions display
- [ ] Check subscriptions added from registrations have:
  - Source: "dashboard_registration"
  - Tag: "from-registration"
- [ ] Test active/inactive filter
- [ ] Test status filter

### 6. Visual/UI Tests
- [ ] Verify all buttons use official colors:
  - Primary (blue): #2b3eb3
  - Success (green): #13cb13
- [ ] Check sidebar active menu item has green border (#13cb13)
- [ ] Verify count badges in sidebar are green
- [ ] Test responsive design by resizing browser
- [ ] Check mobile view (< 768px width)

### 7. Error Handling
- [ ] Try adding a registration to newsletter twice (should show error)
- [ ] Try sending reply with empty message (should show error)
- [ ] Try replying to non-existent contact (should handle gracefully)

### 8. Email Testing

#### Check Reply Email Format
The email should contain:
- [ ] "Response to Your Message" heading in blue (#2b3eb3)
- [ ] Greeting with contact's name
- [ ] Admin's reply message with formatting
- [ ] Green-bordered box with reply content
- [ ] Original message in gray box
- [ ] Professional signature
- [ ] Subject line starts with "Re:"

#### Check Newsletter Welcome Email
- [ ] Professional welcome message
- [ ] List of topics subscriber will receive
- [ ] Unsubscribe link at bottom
- [ ] TechGrid branding

## Common Issues & Solutions

### Issue: Dashboard shows zeros
**Solution**: Check MongoDB connection string in `.env` file

### Issue: Logo doesn't appear
**Solution**: Verify `/public/assets/logo-white.png` exists and server is serving static files

### Issue: Email not sending
**Solution**: 
1. Check SMTP credentials in `.env`
2. Verify `SMTP_HOST=smtp.ionos.com`
3. Check `SMTP_USER=events@surfspotonline.com`
4. Verify password is correct

### Issue: Colors don't match
**Solution**: Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+F5) to clear CSS cache

### Issue: Reply button doesn't work
**Solution**: Check browser console for JavaScript errors

## API Testing (Optional)

Use Postman or curl to test endpoints directly:

### Test Reply Endpoint
```bash
curl -X POST http://localhost:3000/dashboard/api/contacts/[CONTACT_ID]/reply \
  -H "Content-Type: application/json" \
  -d '{"replyMessage": "<p>Test reply message</p>"}'
```

### Test Add to Newsletter Endpoint
```bash
curl -X POST http://localhost:3000/dashboard/api/registrations/[REG_ID]/add-to-newsletter \
  -H "Content-Type: application/json"
```

### Test Overview Stats
```bash
curl http://localhost:3000/dashboard/api/overview
```

## Success Criteria

✅ All database records are visible
✅ Logo displays instead of text
✅ Colors match official palette
✅ Contact detail view works
✅ Reply modal opens and sends emails
✅ Rich text formatting works
✅ Add to newsletter creates subscriptions
✅ Welcome emails are sent
✅ All filters and search work
✅ No console errors
✅ Mobile responsive

## Performance Notes

- Initial load should be < 2 seconds
- Modal animations should be smooth
- Table rendering with 100+ records should be responsive
- Pagination keeps load times fast

## Security Verification

- [ ] XSS protection working (try entering HTML in forms)
- [ ] SQL injection protection (try SQL in search)
- [ ] CSRF tokens if implemented
- [ ] Rate limiting active
- [ ] Email validation working

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Quick Visual Test

**Expected Dashboard Appearance:**
- Sidebar: Blue-to-green gradient (#2b3eb3 → #063306)
- Logo: White TechGrid logo at top
- Active menu item: Green left border (#13cb13)
- Count badges: Light green background (#13cb13)
- Primary buttons: Blue (#2b3eb3)
- Success buttons: Light green (#13cb13)
- All stat cards showing real numbers
- Recent activity populated with actual data

If everything matches, you're production ready! 🎉

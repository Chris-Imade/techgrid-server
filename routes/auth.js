const express = require('express');
const path = require('path');
const router = express.Router();

// Auth page (login form)
router.get('/', (req, res) => {
  // If already logged in, redirect to dashboard
  if (req.session && req.session.loggedIn) {
    return res.redirect('/dashboard');
  }
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// Login endpoint
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  
  // Simple credential check
  const validEmail = 'scomprojects@gmail.com';
  const validPassword = '7m3NAqrYNEr@7Az';
  
  if (email === validEmail && password === validPassword) {
    // Set session
    req.session.loggedIn = true;
    req.session.loginTime = Date.now();
    
    // Explicitly save session
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ success: false, message: 'Session error' });
      }
      
      res.json({ success: true, message: 'Login successful' });
    });
  } else {
    res.status(401).json({ success: false, message: 'Invalid email or password' });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Could not log out' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Session test endpoint
router.get('/session-test', (req, res) => {
  res.json({
    hasSession: !!req.session,
    isLoggedIn: req.session?.loggedIn || false,
    loginTime: req.session?.loginTime || null,
    sessionId: req.sessionID
  });
});

module.exports = router;

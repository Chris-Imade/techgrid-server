// Test email setup script - Run this to get test email credentials
const nodemailer = require('nodemailer');

async function createTestAccount() {
  try {
    // Create a test account with Ethereal Email
    const testAccount = await nodemailer.createTestAccount();
    
    console.log('🧪 Test Email Account Created!');
    console.log('Copy these values to your .env file:\n');
    
    console.log('SMTP_HOST=smtp.ethereal.email');
    console.log('SMTP_PORT=587');
    console.log('SMTP_SECURE=false');
    console.log(`SMTP_USER=${testAccount.user}`);
    console.log(`SMTP_PASS=${testAccount.pass}`);
    console.log(`FROM_EMAIL=${testAccount.user}`);
    
    console.log('\n📧 All emails will be captured at: https://ethereal.email/');
    console.log('You can view sent emails there instead of receiving real emails.');
    
    // Test the connection
    const transporter = nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    
    await transporter.verify();
    console.log('\n✅ Test email configuration verified successfully!');
    
  } catch (error) {
    console.error('❌ Failed to create test account:', error);
  }
}

createTestAccount();

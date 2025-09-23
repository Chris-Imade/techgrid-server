// Email configuration test script
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmailConfig() {
  console.log('🧪 Testing Email Configuration...\n');
  
  // Check if all required environment variables are set
  const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'FROM_EMAIL'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('❌ Missing environment variables:');
    missingVars.forEach(varName => console.log(`   - ${varName}`));
    console.log('\nPlease add these to your .env file.');
    return;
  }
  
  console.log('✅ All environment variables are set');
  console.log(`📧 SMTP Host: ${process.env.SMTP_HOST}`);
  console.log(`🔌 SMTP Port: ${process.env.SMTP_PORT}`);
  console.log(`👤 SMTP User: ${process.env.SMTP_USER}`);
  console.log(`📨 From Email: ${process.env.FROM_EMAIL}\n`);
  
  try {
    // Create transporter
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    console.log('🔧 Testing SMTP connection...');
    
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');
    
    // Send test email
    console.log('📤 Sending test email...');
    
    const testEmail = {
      from: `"Tech Grid Test" <${process.env.FROM_EMAIL}>`,
      to: process.env.SMTP_USER, // Send to yourself
      subject: 'Tech Grid Email Test - Success!',
      html: `
        <h2>🎉 Email Configuration Test Successful!</h2>
        <p>Your Tech Grid Series email service is working correctly.</p>
        <p><strong>Test Details:</strong></p>
        <ul>
          <li>SMTP Host: ${process.env.SMTP_HOST}</li>
          <li>SMTP Port: ${process.env.SMTP_PORT}</li>
          <li>From Email: ${process.env.FROM_EMAIL}</li>
          <li>Test Time: ${new Date().toLocaleString()}</li>
        </ul>
        <p>You can now receive contact form submissions and registration confirmations!</p>
      `
    };
    
    const result = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log(`📧 Message ID: ${result.messageId}`);
    
    if (process.env.SMTP_HOST === 'smtp.ethereal.email') {
      console.log(`🔗 View email at: ${nodemailer.getTestMessageUrl(result)}`);
    }
    
  } catch (error) {
    console.log('❌ Email configuration test failed:');
    console.log(`   Error: ${error.message}`);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 Authentication failed. Check:');
      console.log('   - Email address is correct');
      console.log('   - Password is correct (use App Password for Gmail)');
      console.log('   - 2FA is enabled for Gmail');
      console.log('   - Less secure apps enabled for other providers');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n💡 Connection failed. Check:');
      console.log('   - SMTP host and port are correct');
      console.log('   - Internet connection is working');
      console.log('   - Firewall is not blocking the connection');
    }
  }
}

testEmailConfig();

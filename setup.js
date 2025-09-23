#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Tech Grid Server Setup Script');
console.log('================================\n');

// Check Node.js version
function checkNodeVersion() {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  console.log(`📋 Checking Node.js version: ${nodeVersion}`);
  
  if (majorVersion < 16) {
    console.error('❌ Node.js version 16.0.0 or higher is required');
    process.exit(1);
  }
  
  console.log('✅ Node.js version is compatible\n');
}

// Check if MongoDB is running
function checkMongoDB() {
  console.log('🗄️  Checking MongoDB connection...');
  
  try {
    // Try to connect to MongoDB using mongosh or mongo
    execSync('mongosh --eval "db.runCommand({ ping: 1 })" --quiet', { stdio: 'pipe' });
    console.log('✅ MongoDB is running and accessible\n');
    return true;
  } catch (error) {
    try {
      // Fallback to legacy mongo client
      execSync('mongo --eval "db.runCommand({ ping: 1 })" --quiet', { stdio: 'pipe' });
      console.log('✅ MongoDB is running and accessible\n');
      return true;
    } catch (fallbackError) {
      console.log('⚠️  MongoDB connection test failed');
      console.log('   Please ensure MongoDB is installed and running:');
      console.log('   - Install: https://docs.mongodb.com/manual/installation/');
      console.log('   - Start: sudo systemctl start mongod');
      console.log('   - Or use Docker: docker run -d -p 27017:27017 mongo:latest\n');
      return false;
    }
  }
}

// Create necessary directories
function createDirectories() {
  console.log('📁 Creating necessary directories...');
  
  const directories = [
    'logs',
    'templates',
    'assets',
    'assets/documents'
  ];
  
  directories.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`   Created: ${dir}/`);
    } else {
      console.log(`   Exists: ${dir}/`);
    }
  });
  
  console.log('✅ Directories created\n');
}

// Check environment variables
function checkEnvironmentVariables() {
  console.log('🔧 Checking environment variables...');
  
  const requiredVars = [
    'SMTP_USER',
    'SMTP_PASS',
    'ADMIN_EMAIL_1',
    'FROM_EMAIL'
  ];
  
  const missingVars = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName] || process.env[varName].includes('your_') || process.env[varName].includes('_here')) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.log('⚠️  The following environment variables need to be configured:');
    missingVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log('\n   Please update your .env file with the correct values\n');
    return false;
  } else {
    console.log('✅ Environment variables are configured\n');
    return true;
  }
}

// Install dependencies
function installDependencies() {
  console.log('📦 Installing dependencies...');
  
  try {
    console.log('   Running npm install...');
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully\n');
    return true;
  } catch (error) {
    console.error('❌ Failed to install dependencies');
    console.error('   Please run "npm install" manually\n');
    return false;
  }
}

// Create sample email templates
function createSampleTemplates() {
  console.log('📧 Creating sample email templates...');
  
  const templatesDir = path.join(__dirname, 'templates');
  
  // Simple template example
  const sampleTemplate = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{subject}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8f9fa; }
        .footer { padding: 10px; font-size: 12px; color: #666; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>The Tech Grid Series</h1>
        </div>
        <div class="content">
            <p>This is a sample template. Customize as needed.</p>
            <p>Template variables like {{name}} will be replaced with actual values.</p>
        </div>
        <div class="footer">
            <p>© 2025 SurfSpot Communications Limited</p>
        </div>
    </div>
</body>
</html>`;

  const templateFile = path.join(templatesDir, 'sample_template.html');
  
  if (!fs.existsSync(templateFile)) {
    fs.writeFileSync(templateFile, sampleTemplate);
    console.log('   Created: sample_template.html');
  }
  
  console.log('✅ Sample templates created\n');
}

// Display next steps
function displayNextSteps() {
  console.log('🎉 Setup Complete!');
  console.log('==================\n');
  
  console.log('📋 Next Steps:');
  console.log('1. Update your .env file with correct SMTP credentials');
  console.log('2. Start the server: npm run dev');
  console.log('3. Test the API: npm run test:api');
  console.log('4. Check the logs in the logs/ directory');
  console.log('5. Customize email templates in the templates/ directory\n');
  
  console.log('🔗 Useful Commands:');
  console.log('   npm run dev      - Start development server');
  console.log('   npm start        - Start production server');
  console.log('   npm run test:api - Test API endpoints');
  console.log('   npm run lint     - Check code style\n');
  
  console.log('📚 Documentation:');
  console.log('   README.md        - Complete documentation');
  console.log('   FORM_SCHEMAS.md  - Form specifications');
  console.log('   test-api.js      - API testing examples\n');
  
  console.log('🌐 Default URLs:');
  console.log('   Server:          http://localhost:3000');
  console.log('   Health Check:    http://localhost:3000/health');
  console.log('   Contact API:     http://localhost:3000/api/contact');
  console.log('   Registration:    http://localhost:3000/api/register');
  console.log('   Newsletter:      http://localhost:3000/api/newsletter\n');
}

// Main setup function
async function runSetup() {
  try {
    checkNodeVersion();
    
    const mongoRunning = checkMongoDB();
    
    createDirectories();
    
    const envConfigured = checkEnvironmentVariables();
    
    const depsInstalled = installDependencies();
    
    createSampleTemplates();
    
    displayNextSteps();
    
    // Summary
    console.log('📊 Setup Summary:');
    console.log(`   Node.js:      ✅ Compatible`);
    console.log(`   MongoDB:      ${mongoRunning ? '✅' : '⚠️'} ${mongoRunning ? 'Running' : 'Needs attention'}`);
    console.log(`   Dependencies: ${depsInstalled ? '✅' : '❌'} ${depsInstalled ? 'Installed' : 'Failed'}`);
    console.log(`   Environment:  ${envConfigured ? '✅' : '⚠️'} ${envConfigured ? 'Configured' : 'Needs configuration'}`);
    
    if (!mongoRunning || !envConfigured) {
      console.log('\n⚠️  Please address the warnings above before starting the server.');
    } else {
      console.log('\n🚀 Ready to start! Run: npm run dev');
    }
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  runSetup();
}

module.exports = { runSetup };

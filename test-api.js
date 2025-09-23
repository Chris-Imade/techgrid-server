const axios = require('axios');

// Configuration
const BASE_URL = process.env.APP_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Test data
const testData = {
  contact: {
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+234123456789",
    subject: "Test Contact Form",
    message: "This is a test message from the API test script."
  },
  registration: {
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@example.com",
    phone: "+234987654321",
    company: "Tech Corp",
    jobTitle: "Software Engineer",
    experience: "intermediate",
    interests: ["ai-trading", "fraud-detection"],
    expectations: "Learn about AI applications in finance",
    newsletter: true,
    terms: true
  },
  newsletter: {
    email: "newsletter.test@example.com"
  }
};

// Helper function to make API requests
async function makeRequest(method, url, data = null) {
  try {
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TechGrid-API-Test/1.0'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 0,
      error: error.response?.data || error.message
    };
  }
}

// Test functions
async function testHealthEndpoints() {
  console.log('\n🏥 Testing Health Endpoints...');
  
  const endpoints = [
    `${BASE_URL}/health`,
    `${API_BASE}/contact/health`,
    `${API_BASE}/register/health`,
    `${API_BASE}/newsletter/health`
  ];

  for (const endpoint of endpoints) {
    const result = await makeRequest('GET', endpoint);
    console.log(`  ${endpoint}: ${result.success ? '✅' : '❌'} (${result.status})`);
    if (!result.success) {
      console.log(`    Error: ${JSON.stringify(result.error)}`);
    }
  }
}

async function testContactForm() {
  console.log('\n📧 Testing Contact Form...');
  
  const result = await makeRequest('POST', `${API_BASE}/contact`, testData.contact);
  
  if (result.success) {
    console.log('  ✅ Contact form submission successful');
    console.log(`  📝 Contact ID: ${result.data.data?.id}`);
  } else {
    console.log('  ❌ Contact form submission failed');
    console.log(`  Error: ${JSON.stringify(result.error)}`);
  }
  
  return result;
}

async function testRegistration() {
  console.log('\n🎫 Testing Registration Form...');
  
  const result = await makeRequest('POST', `${API_BASE}/register`, testData.registration);
  
  if (result.success) {
    console.log('  ✅ Registration submission successful');
    console.log(`  🎟️  Registration Number: ${result.data.data?.registrationNumber}`);
    console.log(`  🆔 Registration ID: ${result.data.data?.registrationId}`);
    
    // Test registration verification
    if (result.data.data?.registrationId) {
      console.log('\n🔍 Testing Registration Verification...');
      const verifyResult = await makeRequest('GET', `${API_BASE}/register/verify/${result.data.data.registrationId}`);
      
      if (verifyResult.success) {
        console.log('  ✅ Registration verification successful');
        console.log(`  👤 Name: ${verifyResult.data.data?.name}`);
      } else {
        console.log('  ❌ Registration verification failed');
      }
    }
  } else {
    console.log('  ❌ Registration submission failed');
    console.log(`  Error: ${JSON.stringify(result.error)}`);
  }
  
  return result;
}

async function testNewsletter() {
  console.log('\n📰 Testing Newsletter Subscription...');
  
  const result = await makeRequest('POST', `${API_BASE}/newsletter`, testData.newsletter);
  
  if (result.success) {
    console.log('  ✅ Newsletter subscription successful');
    console.log(`  📧 Subscription ID: ${result.data.data?.subscriptionId}`);
    
    // Test unsubscribe
    if (result.data.data?.subscriptionId) {
      console.log('\n🚫 Testing Newsletter Unsubscribe...');
      const unsubResult = await makeRequest('GET', `${API_BASE}/newsletter/unsubscribe?token=${result.data.data.subscriptionId}`);
      
      if (unsubResult.success) {
        console.log('  ✅ Newsletter unsubscribe successful');
      } else {
        console.log('  ❌ Newsletter unsubscribe failed');
      }
      
      // Test resubscribe
      console.log('\n🔄 Testing Newsletter Resubscribe...');
      const resubResult = await makeRequest('POST', `${API_BASE}/newsletter/resubscribe`, { email: testData.newsletter.email });
      
      if (resubResult.success) {
        console.log('  ✅ Newsletter resubscribe successful');
      } else {
        console.log('  ❌ Newsletter resubscribe failed');
      }
    }
  } else {
    console.log('  ❌ Newsletter subscription failed');
    console.log(`  Error: ${JSON.stringify(result.error)}`);
  }
  
  return result;
}

async function testValidation() {
  console.log('\n🛡️  Testing Validation...');
  
  // Test invalid contact form
  const invalidContact = {
    name: "A", // Too short
    email: "invalid-email", // Invalid format
    phone: "123", // Too short
    subject: "", // Empty
    message: "Hi" // Too short
  };
  
  const result = await makeRequest('POST', `${API_BASE}/contact`, invalidContact);
  
  if (!result.success && result.status === 400) {
    console.log('  ✅ Validation working correctly - rejected invalid data');
    console.log(`  📋 Validation errors: ${Object.keys(result.error.errors || {}).length} fields`);
  } else {
    console.log('  ❌ Validation not working - accepted invalid data');
  }
}

async function testRateLimit() {
  console.log('\n⏱️  Testing Rate Limiting...');
  
  console.log('  Making multiple rapid requests...');
  
  const promises = [];
  for (let i = 0; i < 3; i++) {
    promises.push(makeRequest('POST', `${API_BASE}/contact`, {
      ...testData.contact,
      email: `test${i}@example.com`
    }));
  }
  
  const results = await Promise.all(promises);
  const successful = results.filter(r => r.success).length;
  const rateLimited = results.filter(r => r.status === 429).length;
  
  console.log(`  📊 Results: ${successful} successful, ${rateLimited} rate limited`);
  
  if (rateLimited > 0) {
    console.log('  ✅ Rate limiting is working');
  } else {
    console.log('  ⚠️  Rate limiting may not be active (or limit not reached)');
  }
}

async function testStats() {
  console.log('\n📊 Testing Statistics Endpoints...');
  
  const endpoints = [
    `${API_BASE}/contact/stats`,
    `${API_BASE}/register/stats`,
    `${API_BASE}/newsletter/stats`
  ];

  for (const endpoint of endpoints) {
    const result = await makeRequest('GET', endpoint);
    console.log(`  ${endpoint.split('/').pop()}: ${result.success ? '✅' : '❌'} (${result.status})`);
    
    if (result.success && result.data.data) {
      const stats = result.data.data.statistics;
      if (stats) {
        const statKeys = Object.keys(stats);
        console.log(`    📈 Available stats: ${statKeys.join(', ')}`);
      }
    }
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Tech Grid Server API Tests');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log('=' .repeat(50));
  
  try {
    await testHealthEndpoints();
    await testValidation();
    await testContactForm();
    await testRegistration();
    await testNewsletter();
    await testRateLimit();
    await testStats();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests completed!');
    console.log('\n📝 Notes:');
    console.log('  - Check your email for test notifications');
    console.log('  - Review server logs for detailed information');
    console.log('  - Verify MongoDB collections have been created');
    console.log('  - Test email delivery with real SMTP credentials');
    
  } catch (error) {
    console.error('\n❌ Test runner failed:', error.message);
  }
}

// Check if server is running before starting tests
async function checkServer() {
  console.log('🔍 Checking if server is running...');
  
  const result = await makeRequest('GET', `${BASE_URL}/health`);
  
  if (result.success) {
    console.log('✅ Server is running, starting tests...');
    return true;
  } else {
    console.log('❌ Server is not responding. Please start the server first:');
    console.log('   npm run dev');
    console.log('   or');
    console.log('   npm start');
    return false;
  }
}

// Run the tests
async function main() {
  const serverRunning = await checkServer();
  
  if (serverRunning) {
    await runTests();
  }
  
  process.exit(0);
}

// Handle command line execution
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  runTests,
  testHealthEndpoints,
  testContactForm,
  testRegistration,
  testNewsletter,
  testValidation,
  testRateLimit,
  testStats
};

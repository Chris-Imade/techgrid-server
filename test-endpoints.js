#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/dashboard/api';

async function testEndpoint(method, url, data = null, expectedStatus = 200) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      timeout: 5000
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    console.log(`✅ ${method.toUpperCase()} ${url} - ${response.status} ${response.statusText}`);
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    const status = error.response?.status || 'TIMEOUT';
    const statusText = error.response?.statusText || error.message;
    console.log(`❌ ${method.toUpperCase()} ${url} - ${status} ${statusText}`);
    return { success: false, status, error: error.response?.data || error.message };
  }
}

async function runTests() {
  console.log('🧪 Testing TechGrid Dashboard API Endpoints\n');
  
  // Test Overview
  console.log('📊 OVERVIEW ENDPOINTS:');
  await testEndpoint('GET', '/overview');
  console.log('');
  
  // Test Contacts
  console.log('📧 CONTACT ENDPOINTS:');
  await testEndpoint('GET', '/contacts');
  await testEndpoint('GET', '/contacts?page=1&limit=5');
  
  // Test with sample data
  const contactData = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '+2348080896901',
    subject: 'Test Subject Here',
    message: 'This is a test message with more than 10 characters for validation',
    status: 'pending'
  };
  
  const createResult = await testEndpoint('POST', '/contacts', contactData, 201);
  
  if (createResult.success && createResult.data?.data?.contactId) {
    const contactId = createResult.data.data.contactId;
    console.log(`📝 Created contact with ID: ${contactId}`);
    
    // Test GET single contact
    await testEndpoint('GET', `/contacts/${contactId}`);
    
    // Test UPDATE contact
    await testEndpoint('PUT', `/contacts/${contactId}`, {
      ...contactData,
      subject: 'Updated Test Subject'
    });
    
    // Test DELETE contact
    await testEndpoint('DELETE', `/contacts/${contactId}`);
  }
  console.log('');
  
  // Test Registrations
  console.log('👥 REGISTRATION ENDPOINTS:');
  await testEndpoint('GET', '/registrations');
  await testEndpoint('GET', '/registrations?page=1&limit=5');
  
  // Get first registration to test individual endpoints
  const regListResult = await testEndpoint('GET', '/registrations?limit=1');
  if (regListResult.success && regListResult.data?.data?.length > 0) {
    const regId = regListResult.data.data[0].registrationId;
    console.log(`📝 Testing with registration ID: ${regId}`);
    await testEndpoint('GET', `/registrations/${regId}`);
  }
  console.log('');
  
  // Test Newsletter
  console.log('📰 NEWSLETTER ENDPOINTS:');
  await testEndpoint('GET', '/newsletter');
  await testEndpoint('GET', '/newsletter?page=1&limit=5');
  
  // Get first newsletter to test individual endpoints
  const newsListResult = await testEndpoint('GET', '/newsletter?limit=1');
  if (newsListResult.success && newsListResult.data?.data?.length > 0) {
    const newsId = newsListResult.data.data[0]._id;
    console.log(`📝 Testing with newsletter ID: ${newsId}`);
    await testEndpoint('GET', `/newsletter/${newsId}`);
  }
  console.log('');
  
  // Test Email Templates
  console.log('📄 EMAIL TEMPLATE ENDPOINTS:');
  await testEndpoint('GET', '/email-templates');
  
  const templateData = {
    subject: 'Test Template Subject',
    body: '<p>This is a test email template</p>'
  };
  
  const templateResult = await testEndpoint('POST', '/email-templates', templateData, 201);
  console.log('');
  
  console.log('🎉 API Endpoint Testing Complete!');
  console.log('');
  console.log('📋 Summary:');
  console.log('- ✅ = Working correctly');
  console.log('- ❌ = Has issues (check error details above)');
  console.log('');
  console.log('🔧 If you see any ❌ errors, those endpoints need fixing.');
}

// Run the tests
runTests().catch(console.error);

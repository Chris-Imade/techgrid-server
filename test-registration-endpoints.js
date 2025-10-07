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

async function runRegistrationTests() {
  console.log('🧪 Testing Registration Endpoints\n');
  
  // Get first registration to test with
  const regListResult = await testEndpoint('GET', '/registrations?limit=1');
  
  if (!regListResult.success || !regListResult.data?.data?.length) {
    console.log('❌ No registrations found to test with');
    return;
  }
  
  const regId = regListResult.data.data[0].registrationId;
  const regEmail = regListResult.data.data[0].email;
  
  console.log(`📝 Testing with registration ID: ${regId}`);
  console.log(`📧 Registration email: ${regEmail}\n`);
  
  // Test all registration endpoints
  console.log('👥 REGISTRATION CRUD ENDPOINTS:');
  await testEndpoint('GET', `/registrations/${regId}`);
  
  // Test UPDATE registration
  const updateData = {
    firstName: 'Updated',
    lastName: 'Name',
    email: regEmail,
    phone: '+2348080896901',
    company: 'Test Company Updated',
    jobTitle: 'Updated Title',
    experience: 'intermediate',
    interests: ['ai-trading', 'risk-management'],
    expectations: 'Updated expectations for the event',
    newsletter: true,
    terms: true
  };
  
  await testEndpoint('PUT', `/registrations/${regId}`, updateData);
  
  // Test STATUS update
  await testEndpoint('PATCH', `/registrations/${regId}/status`, { status: 'confirmed' });
  
  // Test ADD TO NEWSLETTER
  await testEndpoint('POST', `/registrations/${regId}/add-to-newsletter`);
  
  console.log('\n🎉 Registration Endpoint Testing Complete!');
  console.log('\n📋 Summary:');
  console.log('- ✅ = Working correctly');
  console.log('- ❌ = Has issues (check error details above)');
}

// Run the tests
runRegistrationTests().catch(console.error);

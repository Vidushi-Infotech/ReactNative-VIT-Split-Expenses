/**
 * WATI Endpoint Tester
 * Test different WATI API endpoints to find the correct one
 */

const WATI_CONFIG = {
  baseUrl: 'https://app-server.wati.io/api/v1',
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxNDNkYzZmNC1kYjVhLTQ2YWEtOTZiMy1iODM2ODJiMjJiODIiLCJ1bmlxdWVfbmFtZSI6InN1cHBvcnRAdmlkdXNoaWluZm90ZWNoLmNvbSIsIm5hbWVpZCI6InN1cHBvcnRAdmlkdXNoaWluZm90ZWNoLmNvbSIsImVtYWlsIjoic3VwcG9ydEB2aWR1c2hpaW5mb3RlY2guY29tIiwiYXV0aF90aW1lIjoiMDgvMDUvMjAyNSAxNTo1NDowNCIsImRiX25hbWUiOiJ3YXRpX2FwcF90cmlhbCIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6WyJUUklBTCIsIlRSSUFMUEFJRCJdLCJleHAiOjI1MzQwMjMwMDgwMCwiaXNzIjoiQ2xhcmVfQUkiLCJhdWQiOiJDbGFyZV9BSSJ9.QmZCDBxW9roMcaD2-rJjPhAqpoe9fd9KQ0vsGJ0UiEE',
  testNumber: '917744847294',
};

/**
 * Test different WATI endpoints
 */
export const testWatiEndpoints = async () => {
  const endpoints = [
    // Common WATI endpoints to try
    '/sendMessage',
    '/sendSessionMessage', 
    '/sendTextMessage',
    '/send-message',
    '/api/sendMessage',
    '/messages/send',
    '/message/send',
    '/whatsapp/send',
    '/send',
  ];

  const requestFormats = [
    // Different request body formats to try
    {
      name: 'Format 1: whatsappNumber + messageText',
      body: {
        whatsappNumber: WATI_CONFIG.testNumber,
        messageText: '🧪 WATI Endpoint Test'
      }
    },
    {
      name: 'Format 2: phone + message',
      body: {
        phone: WATI_CONFIG.testNumber,
        message: '🧪 WATI Endpoint Test'
      }
    },
    {
      name: 'Format 3: number + text',
      body: {
        number: WATI_CONFIG.testNumber,
        text: '🧪 WATI Endpoint Test'
      }
    },
    {
      name: 'Format 4: to + body',
      body: {
        to: WATI_CONFIG.testNumber,
        body: '🧪 WATI Endpoint Test'
      }
    }
  ];

  console.log('🧪 Testing WATI Endpoints and Formats...\n');
  
  const results = [];

  for (let endpoint of endpoints) {
    console.log(`--- Testing Endpoint: ${endpoint} ---`);
    
    for (let format of requestFormats) {
      console.log(`  📝 ${format.name}`);
      
      try {
        const response = await fetch(`${WATI_CONFIG.baseUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${WATI_CONFIG.accessToken}`,
          },
          body: JSON.stringify(format.body),
        });

        const responseText = await response.text();
        
        console.log(`     Status: ${response.status}`);
        console.log(`     Response: ${responseText.substring(0, 100)}`);
        
        const result = {
          endpoint,
          format: format.name,
          status: response.status,
          ok: response.ok,
          response: responseText,
          success: response.ok && responseText && !responseText.includes('error')
        };
        
        results.push(result);
        
        if (result.success) {
          console.log(`     ✅ SUCCESS! Found working combination`);
          return result; // Return first successful combination
        } else if (response.status !== 404) {
          console.log(`     ⚠️ Endpoint exists but failed (not 404)`);
        }
        
      } catch (error) {
        console.log(`     ❌ Request failed: ${error.message}`);
        results.push({
          endpoint,
          format: format.name,
          error: error.message,
          success: false
        });
      }
    }
    console.log('');
  }
  
  console.log('📊 All combinations tested. Results:');
  results.forEach(r => {
    if (r.success) {
      console.log(`✅ SUCCESS: ${r.endpoint} with ${r.format}`);
    } else if (r.status && r.status !== 404) {
      console.log(`⚠️ EXISTS: ${r.endpoint} (${r.status}) with ${r.format}`);
    }
  });
  
  return results;
};

/**
 * Test authentication by trying a simple endpoint
 */
export const testAuthentication = async () => {
  console.log('🔐 Testing WATI Authentication...');
  
  // Try to get account info or any GET endpoint
  const testEndpoints = [
    '/account',
    '/profile', 
    '/me',
    '/info',
    '/status',
    '/contacts',
    '/templates',
  ];
  
  for (let endpoint of testEndpoints) {
    try {
      console.log(`  Testing GET ${endpoint}...`);
      
      const response = await fetch(`${WATI_CONFIG.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${WATI_CONFIG.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`    Status: ${response.status}`);
      
      if (response.status === 401) {
        console.log('❌ Authentication failed - Invalid token');
        return { success: false, error: 'Invalid access token' };
      } else if (response.status === 403) {
        console.log('❌ Authentication failed - Access denied');
        return { success: false, error: 'Access denied' };
      } else if (response.status < 500) {
        console.log('✅ Authentication OK - Token is valid');
        return { success: true, message: 'Token is valid' };
      }
      
    } catch (error) {
      console.log(`    Error: ${error.message}`);
    }
  }
  
  return { success: false, error: 'Could not verify authentication' };
};

/**
 * Run complete endpoint test
 */
export const runCompleteEndpointTest = async () => {
  console.log('🚀 Starting Complete WATI Endpoint Test...\n');
  
  // Test 1: Authentication
  console.log('=== Test 1: Authentication ===');
  const authResult = await testAuthentication();
  console.log('Auth Result:', authResult);
  console.log('');
  
  if (!authResult.success) {
    console.log('❌ Authentication failed. Check your WATI access token.');
    return { success: false, step: 'authentication', result: authResult };
  }
  
  // Test 2: Find working endpoint
  console.log('=== Test 2: Find Working Endpoint ===');
  const endpointResult = await testWatiEndpoints();
  
  if (endpointResult && endpointResult.success) {
    console.log(`🎉 Found working WATI endpoint!`);
    console.log(`📍 Endpoint: ${endpointResult.endpoint}`);
    console.log(`📝 Format: ${endpointResult.format}`);
    return { success: true, result: endpointResult };
  } else {
    console.log('❌ No working endpoint found');
    return { success: false, step: 'endpoints', results: endpointResult };
  }
};

// Usage:
// import { runCompleteEndpointTest } from '../utils/watiEndpointTester';
// runCompleteEndpointTest();
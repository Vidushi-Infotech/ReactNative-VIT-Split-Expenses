/**
 * WATI API Diagnostics
 * Direct API testing to identify the exact issue
 */

const WATI_CONFIG = {
  baseUrl: 'https://app-server.wati.io/api/v1',
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxNDNkYzZmNC1kYjVhLTQ2YWEtOTZiMy1iODM2ODJiMjJiODIiLCJ1bmlxdWVfbmFtZSI6InN1cHBvcnRAdmlkdXNoaWluZm90ZWNoLmNvbSIsIm5hbWVpZCI6InN1cHBvcnRAdmlkdXNoaWluZm90ZWNoLmNvbSIsImVtYWlsIjoic3VwcG9ydEB2aWR1c2hpaW5mb3RlY2guY29tIiwiYXV0aF90aW1lIjoiMDgvMDUvMjAyNSAxNTo1NDowNCIsImRiX25hbWUiOiJ3YXRpX2FwcF90cmlhbCIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6WyJUUklBTCIsIlRSSUFMUEFJRCJdLCJleHAiOjI1MzQwMjMwMDgwMCwiaXNzIjoiQ2xhcmVfQUkiLCJhdWQiOiJDbGFyZV9BSSJ9.QmZCDBxW9roMcaD2-rJjPhAqpoe9fd9KQ0vsGJ0UiEE',
  senderNumber: '14798024855',
};

/**
 * Test WATI API Authentication
 */
export const testAuthentication = async () => {
  console.log('🔐 Testing WATI Authentication...');
  
  try {
    // Try to make a simple request to check auth
    const response = await fetch(`${WATI_CONFIG.baseUrl}/sendSessionMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WATI_CONFIG.accessToken}`,
      },
      body: JSON.stringify({
        whatsappNumber: WATI_CONFIG.senderNumber,
        messageText: 'Auth test'
      }),
    });

    console.log('📊 Auth Status:', response.status);
    console.log('📊 Auth Headers:', [...response.headers.entries()]);

    const text = await response.text();
    console.log('📊 Auth Response:', text);

    if (response.status === 401) {
      return { success: false, error: 'Invalid or expired access token' };
    } else if (response.status === 403) {
      return { success: false, error: 'Account suspended or limited' };
    } else if (response.status >= 200 && response.status < 300) {
      return { success: true, message: 'Authentication successful' };
    } else {
      return { success: false, error: `HTTP ${response.status}: ${text}` };
    }
  } catch (error) {
    console.error('💥 Auth Test Error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Test specific phone number format
 */
export const testPhoneNumberFormat = async (phoneNumber) => {
  console.log(`📱 Testing phone number format: ${phoneNumber}`);
  
  const formats = [
    phoneNumber, // Original
    phoneNumber.replace(/^\+/, ''), // Remove +
    phoneNumber.replace(/[\s\-\(\)]/g, ''), // Remove spaces/dashes
    phoneNumber.replace(/^\+/, '').replace(/[\s\-\(\)]/g, ''), // Both
  ];

  for (let format of formats) {
    console.log(`🧪 Trying format: "${format}"`);
    
    try {
      const response = await fetch(`${WATI_CONFIG.baseUrl}/sendSessionMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WATI_CONFIG.accessToken}`,
        },
        body: JSON.stringify({
          whatsappNumber: format,
          messageText: `Test message to ${format}`
        }),
      });

      const responseText = await response.text();
      console.log(`📊 Format "${format}" - Status:`, response.status);
      console.log(`📊 Format "${format}" - Response:`, responseText);

      if (response.ok) {
        try {
          const result = JSON.parse(responseText);
          if (result.result === true || result.success === true) {
            return { success: true, format: format, response: result };
          }
        } catch (e) {
          // Response might not be JSON, but that's ok if status is ok
          if (response.status >= 200 && response.status < 300) {
            return { success: true, format: format, response: responseText };
          }
        }
      }
    } catch (error) {
      console.error(`❌ Format "${format}" failed:`, error);
    }
  }

  return { success: false, error: 'All phone number formats failed' };
};

/**
 * Test different API endpoints
 */
export const testAPIEndpoints = async () => {
  console.log('🔍 Testing different WATI API endpoints...');
  
  const endpoints = [
    '/sendSessionMessage',
    '/sendTemplateMessage', 
    '/checkPhoneNumberStatus',
  ];

  const results = {};

  for (let endpoint of endpoints) {
    console.log(`🧪 Testing endpoint: ${endpoint}`);
    
    try {
      let requestBody = {};
      
      if (endpoint === '/sendSessionMessage') {
        requestBody = {
          whatsappNumber: WATI_CONFIG.senderNumber,
          messageText: 'Endpoint test'
        };
      } else if (endpoint === '/sendTemplateMessage') {
        requestBody = {
          whatsappNumber: WATI_CONFIG.senderNumber,
          templateName: 'test_template',
          bodyValues: ['Test']
        };
      }

      const response = await fetch(`${WATI_CONFIG.baseUrl}${endpoint}`, {
        method: endpoint === '/checkPhoneNumberStatus' ? 'GET' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WATI_CONFIG.accessToken}`,
        },
        body: endpoint !== '/checkPhoneNumberStatus' ? JSON.stringify(requestBody) : undefined,
      });

      const responseText = await response.text();
      
      results[endpoint] = {
        status: response.status,
        ok: response.ok,
        response: responseText,
        error: !response.ok ? `HTTP ${response.status}` : null
      };

      console.log(`📊 ${endpoint} - Status:`, response.status);
      console.log(`📊 ${endpoint} - Response:`, responseText.substring(0, 200));

    } catch (error) {
      results[endpoint] = {
        status: 'ERROR',
        error: error.message
      };
      console.error(`❌ ${endpoint} failed:`, error);
    }
  }

  return results;
};

/**
 * Complete diagnostic check
 */
export const runDiagnostics = async (testPhoneNumber = '+917744847294') => {
  console.log('🚀 Starting WATI API Diagnostics...\n');

  // Test 1: Authentication
  console.log('=== Test 1: Authentication ===');
  const authResult = await testAuthentication();
  console.log('Auth Result:', authResult);
  console.log('');

  if (!authResult.success) {
    console.log('❌ Authentication failed. Cannot proceed with other tests.');
    return { success: false, step: 'authentication', result: authResult };
  }

  // Test 2: Phone number formats
  console.log('=== Test 2: Phone Number Formats ===');
  const formatResult = await testPhoneNumberFormat(testPhoneNumber);
  console.log('Format Result:', formatResult);
  console.log('');

  // Test 3: API endpoints
  console.log('=== Test 3: API Endpoints ===');
  const endpointResults = await testAPIEndpoints();
  console.log('Endpoint Results:', endpointResults);
  console.log('');

  // Summary
  console.log('=== Diagnostic Summary ===');
  console.log('✅ Authentication:', authResult.success ? 'PASS' : 'FAIL');
  console.log('✅ Phone Format:', formatResult.success ? 'PASS' : 'FAIL');
  console.log('✅ Send Message:', endpointResults['/sendSessionMessage']?.ok ? 'PASS' : 'FAIL');
  console.log('✅ Template Message:', endpointResults['/sendTemplateMessage']?.ok ? 'PASS' : 'FAIL');
  console.log('✅ Check Number:', endpointResults['/checkPhoneNumberStatus']?.ok ? 'PASS' : 'FAIL');

  return {
    success: authResult.success && formatResult.success,
    results: {
      auth: authResult,
      format: formatResult,
      endpoints: endpointResults
    }
  };
};

// Usage:
// import { runDiagnostics } from '../utils/watiDiagnostics';
// runDiagnostics('+917744847294');
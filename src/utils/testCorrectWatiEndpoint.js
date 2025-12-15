/**
 * Test Correct WATI Endpoint
 * Using the official WATI API documentation format
 */

const WATI_CONFIG = {
  baseUrl: 'https://app-server.wati.io',
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxNDNkYzZmNC1kYjVhLTQ2YWEtOTZiMy1iODM2ODJiMjJiODIiLCJ1bmlxdWVfbmFtZSI6InN1cHBvcnRAdmlkdXNoaWluZm90ZWNoLmNvbSIsIm5hbWVpZCI6InN1cHBvcnRAdmlkdXNoaWluZm90ZWNoLmNvbSIsImVtYWlsIjoic3VwcG9ydEB2aWR1c2hpaW5mb3RlY2guY29tIiwiYXV0aF90aW1lIjoiMDgvMDUvMjAyNSAxNTo1NDowNCIsImRiX25hbWUiOiJ3YXRpX2FwcF90cmlhbCIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6WyJUUklBTCIsIlRSSUFMUEFJRCJdLCJleHAiOjI1MzQwMjMwMDgwMCwiaXNzIjoiQ2xhcmVfQUkiLCJhdWQiOiJDbGFyZV9BSSJ9.QmZCDBxW9roMcaD2-rJjPhAqpoe9fd9KQ0vsGJ0UiEE',
  testNumber: '917744847294',
};

/**
 * Test the correct WATI endpoint format
 */
export const testCorrectWatiEndpoint = async (phoneNumber = WATI_CONFIG.testNumber) => {
  console.log('🧪 Testing Correct WATI Endpoint...');
  console.log('📱 Phone Number:', phoneNumber);
  
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log('🔐 Generated OTP:', otp);
  
  const message = `🔐 Your Splitzy verification code is: *${otp}*\n\nValid for 5 minutes. Don't share this code with anyone.\n\n- Team Splitzy`;
  
  // Use the correct WATI API format from documentation
  const endpoint = `/api/v1/sendSessionMessage/${phoneNumber}`;
  const fullUrl = `${WATI_CONFIG.baseUrl}${endpoint}`;
  
  console.log('🌐 Full URL:', fullUrl);
  
  try {
    console.log('📤 Sending request...');
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WATI_CONFIG.accessToken}`,
      },
      body: JSON.stringify({
        messageText: message
      }),
    });

    console.log('📥 Response Status:', response.status);
    console.log('📥 Response OK:', response.ok);
    console.log('📥 Response Headers:', JSON.stringify([...response.headers.entries()], null, 2));

    const responseText = await response.text();
    console.log('📥 Raw Response:', responseText);
    console.log('📥 Response Length:', responseText.length);

    // Try to parse as JSON
    let parsedResponse = null;
    try {
      if (responseText && responseText.trim()) {
        parsedResponse = JSON.parse(responseText);
        console.log('📥 Parsed JSON:', JSON.stringify(parsedResponse, null, 2));
      }
    } catch (parseError) {
      console.log('⚠️ Response is not valid JSON or empty');
    }

    // Analyze the response
    if (response.ok) {
      console.log('✅ HTTP Request Successful!');
      
      if (parsedResponse) {
        if (parsedResponse.result === true || parsedResponse.success === true) {
          console.log('🎉 WATI Message Sent Successfully!');
          console.log(`📱 Check WhatsApp +${phoneNumber} for OTP: ${otp}`);
          return { success: true, otp, response: parsedResponse, endpoint };
        } else {
          console.log('⚠️ WATI API returned success=false');
          console.log('Error details:', parsedResponse);
          return { success: false, error: parsedResponse.info || parsedResponse.message || 'API returned false', endpoint };
        }
      } else {
        // Even if not JSON, if HTTP 200, it might be successful
        console.log('⚠️ Non-JSON response but HTTP OK - might be success');
        console.log(`📱 Check WhatsApp +${phoneNumber} for OTP: ${otp}`);
        return { success: true, otp, response: responseText, endpoint };
      }
    } else {
      console.log('❌ HTTP Request Failed');
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.status === 404) {
        console.log('💡 404 means endpoint still not found. Check WATI documentation.');
      } else if (response.status === 401) {
        console.log('💡 401 means authentication failed. Check access token.');
      } else if (response.status === 403) {
        console.log('💡 403 means forbidden. Check account status/billing.');
      } else if (response.status === 400) {
        console.log('💡 400 means bad request. Check request format.');
      }
      
      return { success: false, status: response.status, error: responseText, endpoint };
    }

  } catch (error) {
    console.error('💥 Request failed:', error);
    return { success: false, error: error.message, endpoint };
  }
};

/**
 * Test different phone number formats with correct endpoint
 */
export const testPhoneFormatsWithCorrectEndpoint = async () => {
  const testNumbers = [
    '917744847294',    // Indian format
    '14798024855',     // US format  
  ];

  console.log('🧪 Testing Phone Formats with Correct Endpoint...\n');
  
  for (let number of testNumbers) {
    console.log(`--- Testing: +${number} ---`);
    const result = await testCorrectWatiEndpoint(number);
    console.log(`Result: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (result.success) {
      console.log(`🎉 Working! Check WhatsApp +${number} for OTP: ${result.otp}`);
      return result;
    } else {
      console.log(`Error: ${result.error || result.status}`);
    }
    console.log('');
  }
  
  return { success: false, error: 'No working phone format found' };
};

// Usage:
// import { testCorrectWatiEndpoint } from '../utils/testCorrectWatiEndpoint';
// testCorrectWatiEndpoint('917744847294');
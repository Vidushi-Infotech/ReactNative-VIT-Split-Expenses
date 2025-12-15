/**
 * Simple WATI Test - Direct API Call
 * Use this to test your WATI credentials without complex error handling
 */

const WATI_CONFIG = {
  baseUrl: 'https://app-server.wati.io/api/v1',
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxNDNkYzZmNC1kYjVhLTQ2YWEtOTZiMy1iODM2ODJiMjJiODIiLCJ1bmlxdWVfbmFtZSI6InN1cHBvcnRAdmlkdXNoaWluZm90ZWNoLmNvbSIsIm5hbWVpZCI6InN1cHBvcnRAdmlkdXNoaWluZm90ZWNoLmNvbSIsImVtYWlsIjoic3VwcG9ydEB2aWR1c2hpaW5mb3RlY2guY29tIiwiYXV0aF90aW1lIjoiMDgvMDUvMjAyNSAxNTo1NDowNCIsImRiX25hbWUiOiJ3YXRpX2FwcF90cmlhbCIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6WyJUUklBTCIsIlRSSUFMUEFJRCJdLCJleHAiOjI1MzQwMjMwMDgwMCwiaXNzIjoiQ2xhcmVfQUkiLCJhdWQiOiJDbGFyZV9BSSJ9.QmZCDBxW9roMcaD2-rJjPhAqpoe9fd9KQ0vsGJ0UiEE',
  senderNumber: '14798024855',
};

/**
 * Test basic connection to WATI API
 */
export const testWatiConnection = async () => {
  console.log('🧪 Testing WATI API Connection...');
  console.log('📍 URL:', WATI_CONFIG.baseUrl);
  console.log('🔑 Token:', WATI_CONFIG.accessToken.substring(0, 20) + '...');
  
  try {
    // Try a simple text message to your own number
    const response = await fetch(`${WATI_CONFIG.baseUrl}/sendSessionMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WATI_CONFIG.accessToken}`,
      },
      body: JSON.stringify({
        whatsappNumber: WATI_CONFIG.senderNumber,
        messageText: '🧪 WATI Test Message - Connection Working!'
      }),
    });

    console.log('📥 Response Status:', response.status);
    console.log('📥 Response Headers:', JSON.stringify([...response.headers.entries()], null, 2));

    const responseText = await response.text();
    console.log('📥 Raw Response:', responseText);

    if (response.ok && responseText) {
      try {
        const result = JSON.parse(responseText);
        console.log('✅ WATI Connection Successful!');
        console.log('📨 Result:', JSON.stringify(result, null, 2));
        return { success: true, result };
      } catch (e) {
        console.log('⚠️ Response is not JSON, but request was successful');
        return { success: true, response: responseText };
      }
    } else {
      console.log('❌ WATI Connection Failed');
      return { success: false, status: response.status, response: responseText };
    }
  } catch (error) {
    console.error('💥 Connection Error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Test sending OTP to a specific number
 */
export const testSendOTP = async (phoneNumber) => {
  console.log(`📱 Testing OTP send to: ${phoneNumber}`);
  
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`🔐 Generated OTP: ${otp}`);
  
  try {
    const response = await fetch(`${WATI_CONFIG.baseUrl}/sendSessionMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WATI_CONFIG.accessToken}`,
      },
      body: JSON.stringify({
        whatsappNumber: phoneNumber.replace(/^\+/, ''),
        messageText: `🔐 Your Splitzy verification code is: *${otp}*\n\nValid for 5 minutes. Don't share this code with anyone.\n\n- Team Splitzy`
      }),
    });

    console.log('📥 OTP Response Status:', response.status);

    const responseText = await response.text();
    console.log('📥 OTP Raw Response:', responseText);

    if (response.ok) {
      console.log('✅ OTP sent successfully!');
      return { success: true, otp, response: responseText };
    } else {
      console.log('❌ Failed to send OTP');
      return { success: false, status: response.status, response: responseText };
    }
  } catch (error) {
    console.error('💥 OTP Send Error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Run all tests
 */
export const runSimpleTests = async () => {
  console.log('🚀 Starting Simple WATI Tests...\n');
  
  // Test 1: Basic connection
  console.log('--- Test 1: Basic Connection ---');
  const connectionResult = await testWatiConnection();
  console.log('');
  
  if (connectionResult.success) {
    // Test 2: Send OTP to your number
    console.log('--- Test 2: Send OTP ---');
    const otpResult = await testSendOTP('+14798024855');
    console.log('');
    
    if (otpResult.success) {
      console.log('🎉 All tests passed!');
      console.log(`📱 Check your WhatsApp (+1 479-802-4855) for the OTP: ${otpResult.otp}`);
      return { success: true, otp: otpResult.otp };
    } else {
      console.log('❌ OTP test failed');
      return { success: false, step: 'otp' };
    }
  } else {
    console.log('❌ Connection test failed');
    return { success: false, step: 'connection' };
  }
};

// Usage:
// import { runSimpleTests } from '../utils/simpleWatiTest';
// runSimpleTests();
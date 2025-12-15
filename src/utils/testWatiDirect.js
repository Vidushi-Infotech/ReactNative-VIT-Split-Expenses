/**
 * Direct WATI API Test
 * Test exact WATI API calls to understand the correct format
 */

const WATI_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxNDNkYzZmNC1kYjVhLTQ2YWEtOTZiMy1iODM2ODJiMjJiODIiLCJ1bmlxdWVfbmFtZSI6InN1cHBvcnRAdmlkdXNoaWluZm90ZWNoLmNvbSIsIm5hbWVpZCI6InN1cHBvcnRAdmlkdXNoaWluZm90ZWNoLmNvbSIsImVtYWlsIjoic3VwcG9ydEB2aWR1c2hpaW5mb3RlY2guY29tIiwiYXV0aF90aW1lIjoiMDgvMDUvMjAyNSAxNTo1NDowNCIsImRiX25hbWUiOiJ3YXRpX2FwcF90cmlhbCIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6WyJUUklBTCIsIlRSSUFMUEFJRCJdLCJleHAiOjI1MzQwMjMwMDgwMCwiaXNzIjoiQ2xhcmVfQUkiLCJhdWQiOiJDbGFyZV9BSSJ9.QmZCDBxW9roMcaD2-rJjPhAqpoe9fd9KQ0vsGJ0UiEE';

/**
 * Test basic WATI message sending
 */
export const testWatiMessage = async (phoneNumber = '917744847294') => {
  console.log('🧪 Testing Direct WATI Message...');
  console.log('📞 Phone Number:', phoneNumber);
  
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log('🔐 Generated OTP:', otp);
  
  const message = `🔐 Your Splitzy verification code is: *${otp}*\n\nValid for 5 minutes. Don't share this code with anyone.\n\n- Team Splitzy`;
  
  try {
    console.log('📤 Sending request to WATI...');
    
    const response = await fetch('https://app-server.wati.io/api/v1/sendSessionMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WATI_TOKEN}`,
      },
      body: JSON.stringify({
        whatsappNumber: phoneNumber,
        messageText: message
      }),
    });

    console.log('📥 Response Status:', response.status);
    console.log('📥 Response Headers:', JSON.stringify([...response.headers.entries()], null, 2));

    const responseText = await response.text();
    console.log('📥 Raw Response Text:', responseText);
    console.log('📥 Response Length:', responseText.length);

    // Try to parse as JSON
    let parsedResponse = null;
    try {
      parsedResponse = JSON.parse(responseText);
      console.log('📥 Parsed JSON:', JSON.stringify(parsedResponse, null, 2));
    } catch (parseError) {
      console.log('⚠️ Response is not valid JSON');
    }

    // Analyze the response
    if (response.ok) {
      console.log('✅ HTTP Request Successful');
      
      if (parsedResponse) {
        if (parsedResponse.result === true || parsedResponse.success === true) {
          console.log('🎉 WATI Message Sent Successfully!');
          return { success: true, otp, response: parsedResponse };
        } else {
          console.log('❌ WATI API returned success=false');
          console.log('Error details:', parsedResponse);
          return { success: false, error: parsedResponse.info || parsedResponse.message || 'API returned false' };
        }
      } else {
        // Even if not JSON, if HTTP 200, it might be successful
        console.log('⚠️ Non-JSON response but HTTP OK - assuming success');
        return { success: true, otp, response: responseText };
      }
    } else {
      console.log('❌ HTTP Request Failed');
      return { success: false, status: response.status, error: responseText };
    }

  } catch (error) {
    console.error('💥 Request failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Test different phone number formats
 */
export const testPhoneFormats = async () => {
  const testNumbers = [
    '917744847294',    // Indian format without +
    '+917744847294',   // Indian format with +
    '14798024855',     // US format without +
    '+14798024855',    // US format with +
  ];

  console.log('🧪 Testing different phone number formats...');
  
  for (let number of testNumbers) {
    console.log(`\n--- Testing: ${number} ---`);
    const result = await testWatiMessage(number.replace(/^\+/, ''));
    console.log(`Result for ${number}:`, result.success ? '✅ SUCCESS' : '❌ FAILED');
    
    if (result.success) {
      console.log(`🎉 Working format found: ${number}`);
      return { success: true, workingFormat: number, result };
    }
  }
  
  return { success: false, error: 'No working phone format found' };
};

/**
 * Run complete WATI test
 */
export const runWatiTest = async () => {
  console.log('🚀 Starting Complete WATI Test...\n');
  
  // Test 1: Basic message to Indian number
  console.log('=== Test 1: Indian Number ===');
  const indianResult = await testWatiMessage('917744847294');
  
  if (indianResult.success) {
    console.log('✅ WATI working with Indian number!');
    console.log(`📱 Check WhatsApp +91 7744847294 for OTP: ${indianResult.otp}`);
    return indianResult;
  }
  
  // Test 2: Basic message to US number
  console.log('\n=== Test 2: US Number ===');
  const usResult = await testWatiMessage('14798024855');
  
  if (usResult.success) {
    console.log('✅ WATI working with US number!');
    console.log(`📱 Check WhatsApp +1 479-802-4855 for OTP: ${usResult.otp}`);
    return usResult;
  }
  
  // Test 3: Try different formats
  console.log('\n=== Test 3: Format Testing ===');
  const formatResult = await testPhoneFormats();
  
  return formatResult;
};

// Usage:
// import { runWatiTest } from '../utils/testWatiDirect';
// runWatiTest();
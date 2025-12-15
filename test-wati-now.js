/**
 * Quick WATI Test - CommonJS version
 */

const WATI_CONFIG = {
  baseUrl: 'https://app-server.wati.io',
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxNDNkYzZmNC1kYjVhLTQ2YWEtOTZiMy1iODM2ODJiMjJiODIiLCJ1bmlxdWVfbmFtZSI6InN1cHBvcnRAdmlkdXNoaWluZm90ZWNoLmNvbSIsIm5hbWVpZCI6InN1cHBvcnRAdmlkdXNoaWluZm90ZWNoLmNvbSIsImVtYWlsIjoic3VwcG9ydEB2aWR1c2hpaW5mb3RlY2guY29tIiwiYXV0aF90aW1lIjoiMDgvMDUvMjAyNSAxNTo1NDowNCIsImRiX25hbWUiOiJ3YXRpX2FwcF90cmlhbCIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6WyJUUklBTCIsIlRSSUFMUEFJRCJdLCJleHAiOjI1MzQwMjMwMDgwMCwiaXNzIjoiQ2xhcmVfQUkiLCJhdWQiOiJDbGFyZV9BSSJ9.QmZCDBxW9roMcaD2-rJjPhAqpoe9fd9KQ0vsGJ0UiEE',
};

async function testWatiEndpoint(phoneNumber = '14798024855') {
  console.log('🧪 Testing WATI Endpoint with Official Format...');
  console.log('📱 Phone Number:', phoneNumber);
  
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log('🔐 Generated OTP:', otp);
  
  // Try simple message without emojis/formatting first
  const message = `Your Splitzy verification code is: ${otp}. Valid for 5 minutes.`;
  
  // Use the EXACT format from WATI documentation
  const endpoint = `/api/v1/sendSessionMessage/${phoneNumber}`;
  const fullUrl = `${WATI_CONFIG.baseUrl}${endpoint}`;
  
  console.log('🌐 Full URL:', fullUrl);
  
  try {
    console.log('📤 Sending request...');
    
    // Try just messageText as per original approach
    const requestBody = {
      messageText: message
    };
    
    console.log('📤 Request Body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WATI_CONFIG.accessToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📥 Response Status:', response.status);
    console.log('📥 Response StatusText:', response.statusText);
    console.log('📥 Response OK:', response.ok);

    const responseText = await response.text();
    console.log('📥 Raw Response:', responseText);
    console.log('📥 Response Length:', responseText.length);

    // Analyze the response
    if (response.ok) {
      console.log('✅ HTTP Request Successful! No more 404 errors!');
      console.log(`📱 Check WhatsApp +${phoneNumber} for OTP: ${otp}`);
      return { success: true, otp, status: response.status };
    } else {
      console.log('❌ HTTP Request Failed');
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.status === 404) {
        console.log('💡 Still getting 404 - endpoint issue persists');
      } else if (response.status === 401) {
        console.log('💡 401 - Authentication issue with token');
      } else if (response.status === 403) {
        console.log('💡 403 - Account access/permissions issue');
      } else if (response.status === 400) {
        console.log('💡 400 - Request format issue (but endpoint found!)');
      }
      
      return { success: false, status: response.status, error: responseText };
    }

  } catch (error) {
    console.error('💥 Request failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
testWatiEndpoint().then(result => {
  console.log('\n🎯 FINAL RESULT:');
  console.log(JSON.stringify(result, null, 2));
}).catch(err => {
  console.error('Test Error:', err);
});
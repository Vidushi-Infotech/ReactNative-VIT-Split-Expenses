/**
 * Alternative WATI Test - Try different endpoint formats
 */

const WATI_CONFIG = {
  baseUrl: 'https://app-server.wati.io',
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxNDNkYzZmNC1kYjVhLTQ2YWEtOTZiMy1iODM2ODJiMjJiODIiLCJ1bmlxdWVfbmFtZSI6InN1cHBvcnRAdmlkdXNoaWluZm90ZWNoLmNvbSIsIm5hbWVpZCI6InN1cHBvcnRAdmlkdXNoaWluZm90ZWNoLmNvbSIsImVtYWlsIjoic3VwcG9ydEB2aWR1c2hpaW5mb3RlY2guY29tIiwiYXV0aF90aW1lIjoiMDgvMDUvMjAyNSAxNTo1NDowNCIsImRiX25hbWUiOiJ3YXRpX2FwcF90cmlhbCIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6WyJUUklBTCIsIlRSSUFMUEFJRCJdLCJleHAiOjI1MzQwMjMwMDgwMCwiaXNzIjoiQ2xhcmVfQUkiLCJhdWQiOiJDbGFyZV9BSSJ9.QmZCDBxW9roMcaD2-rJjPhAqpoe9fd9KQ0vsGJ0UiEE',
};

async function testAlternativeFormats(phoneNumber = '917744847294') {
  // First, let's test account status
  console.log('🔍 Checking WATI Account Status...');
  
  try {
    const statusResponse = await fetch(`${WATI_CONFIG.baseUrl}/api/v1/getContacts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${WATI_CONFIG.accessToken}`,
      },
    });
    
    console.log('Account Status Check:', statusResponse.status);
    const statusText = await statusResponse.text();
    console.log('Account Response:', statusText.substring(0, 200) + '...');
    
    if (statusResponse.status === 401) {
      console.log('❌ Token might be expired or invalid');
    }
  } catch (e) {
    console.log('Account check error:', e.message);
  }
  console.log('🧪 Testing Alternative WATI Formats...');
  
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const message = `Your Splitzy verification code is: ${otp}. Valid for 5 minutes.`;
  
  const tests = [
    {
      name: 'Format 1: Original with phone in URL',
      endpoint: `/api/v1/sendSessionMessage/${phoneNumber}`,
      body: { messageText: message }
    },
    {
      name: 'Format 2: Phone in body instead',
      endpoint: `/api/v1/sendSessionMessage`,
      body: { 
        whatsappNumber: phoneNumber,
        messageText: message 
      }
    },
    {
      name: 'Format 3: Different parameter names',
      endpoint: `/api/v1/sendSessionMessage/${phoneNumber}`,
      body: { 
        message: message,
        text: message
      }
    },
    {
      name: 'Format 4: Using sendTemplateMessage instead',
      endpoint: `/api/v1/sendTemplateMessage`,
      body: {
        whatsappNumber: phoneNumber,
        templateName: 'hello_world', // Default template
        bodyValues: [message]
      }
    }
  ];
  
  for (let test of tests) {
    console.log(`\n--- ${test.name} ---`);
    console.log('Endpoint:', test.endpoint);
    console.log('Body:', JSON.stringify(test.body, null, 2));
    
    try {
      const response = await fetch(`${WATI_CONFIG.baseUrl}${test.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WATI_CONFIG.accessToken}`,
        },
        body: JSON.stringify(test.body),
      });

      console.log('Status:', response.status, response.statusText);
      const responseText = await response.text();
      console.log('Response:', responseText);
      
      if (response.ok) {
        try {
          const parsed = JSON.parse(responseText);
          if (parsed.result === true || parsed.success === true) {
            console.log('🎉 SUCCESS! This format works!');
            console.log(`📱 Check WhatsApp +${phoneNumber} for OTP: ${otp}`);
            return { success: true, format: test.name, otp };
          }
        } catch (e) {
          // Non-JSON response but 200 status might still be success
          if (response.status === 200) {
            console.log('🎉 SUCCESS! (Non-JSON response but 200 status)');
            return { success: true, format: test.name, otp };
          }
        }
      }
      
    } catch (error) {
      console.log('Error:', error.message);
    }
  }
  
  return { success: false, message: 'No working format found' };
}

// Run the test
testAlternativeFormats().then(result => {
  console.log('\n🎯 FINAL RESULT:');
  console.log(JSON.stringify(result, null, 2));
}).catch(err => {
  console.error('Test Error:', err);
});
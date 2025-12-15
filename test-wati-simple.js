/**
 * Simple WATI Test - Focus on parameter format
 */

const WATI_CONFIG = {
  baseUrl: 'https://app-server.wati.io',
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxNDNkYzZmNC1kYjVhLTQ2YWEtOTZiMy1iODM2ODJiMjJiODIiLCJ1bmlxdWVfbmFtZSI6InN1cHBvcnRAdmlkdXNoaWluZm90ZWNoLmNvbSIsIm5hbWVpZCI6InN1cHBvcnRAdmlkdXNoaWluZm90ZWNoLmNvbSIsImVtYWlsIjoic3VwcG9ydEB2aWR1c2hpaW5mb3RlY2guY29tIiwiYXV0aF90aW1lIjoiMDgvMDUvMjAyNSAxNTo1NDowNCIsImRiX25hbWUiOiJ3YXRpX2FwcF90cmlhbCIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6WyJUUklBTCIsIlRSSUFMUEFJRCJdLCJleHAiOjI1MzQwMjMwMDgwMCwiaXNzIjoiQ2xhcmVfQUkiLCJhdWQiOiJDbGFyZV9BSSJ9.QmZCDBxW9roMcaD2-rJjPhAqpoe9fd9KQ0vsGJ0UiEE',
};

async function testParameterFormats() {
  console.log('🧪 Testing Different Parameter Names...');
  
  const phoneNumber = '917744847294';
  const message = 'Test message 123';
  const endpoint = `/api/v1/sendSessionMessage/${phoneNumber}`;
  
  const parameterTests = [
    { name: 'messageText', body: { messageText: message } },
    { name: 'text', body: { text: message } },
    { name: 'message', body: { message: message } },
    { name: 'body', body: { body: message } },
    { name: 'content', body: { content: message } },
  ];
  
  for (let test of parameterTests) {
    console.log(`\n--- Testing parameter: ${test.name} ---`);
    console.log('Body:', JSON.stringify(test.body, null, 2));
    
    try {
      const response = await fetch(`${WATI_CONFIG.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WATI_CONFIG.accessToken}`,
        },
        body: JSON.stringify(test.body),
      });

      console.log('Status:', response.status);
      const responseText = await response.text();
      console.log('Response:', responseText);
      
      if (response.ok) {
        try {
          const parsed = JSON.parse(responseText);
          if (parsed.result === true || parsed.success === true) {
            console.log('🎉 SUCCESS! Parameter name works:', test.name);
            return { success: true, parameter: test.name };
          } else if (!responseText.includes('message text can not be empty')) {
            console.log('🟡 Different error - might be progress:', test.name);
          }
        } catch (e) {
          // Non-JSON response
          if (response.status === 200) {
            console.log('🎉 SUCCESS! (Non-JSON 200 response)');
            return { success: true, parameter: test.name };
          }
        }
      }
      
    } catch (error) {
      console.log('Error:', error.message);
    }
  }
  
  return { success: false };
}

testParameterFormats().then(result => {
  console.log('\n🎯 RESULT:', JSON.stringify(result, null, 2));
}).catch(err => {
  console.error('Error:', err);
});
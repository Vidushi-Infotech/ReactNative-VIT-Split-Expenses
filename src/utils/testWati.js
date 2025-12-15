/**
 * WATI Integration Test Utility
 * Use this to test your WATI setup before integrating with the main app
 */

import watiService from '../services/watiService';

/**
 * Test WATI Configuration
 */
export const testWatiConfig = () => {
  const config = watiService.config;
  
  console.log('🔧 WATI Configuration Test:');
  console.log('✅ Base URL:', config.baseUrl);
  console.log('✅ Access Token:', config.accessToken ? 'Configured' : '❌ Missing');
  console.log('✅ Sender Number:', config.senderNumber);
  console.log('✅ Template Name:', config.templates.otp);
  console.log('✅ Debug Mode:', config.debug);
  
  return {
    configured: !!(config.baseUrl && config.accessToken && config.senderNumber),
    config: config
  };
};

/**
 * Test WhatsApp Number Availability
 * @param {string} phoneNumber - Phone number to test (with country code)
 */
export const testPhoneAvailability = async (phoneNumber) => {
  try {
    console.log(`🔍 Testing WhatsApp availability for: ${phoneNumber}`);
    
    const result = await watiService.checkWhatsAppAvailability(phoneNumber);
    
    console.log('📋 Availability Result:', result);
    
    if (result.whatsappExists) {
      console.log('✅ WhatsApp is available for this number');
    } else {
      console.log('❌ WhatsApp is not available for this number');
    }
    
    return result;
  } catch (error) {
    console.error('💥 Error testing phone availability:', error);
    return { available: false, whatsappExists: false, error: error.message };
  }
};

/**
 * Test OTP Sending (Text Message)
 * @param {string} phoneNumber - Phone number to test
 */
export const testSendTextOTP = async (phoneNumber) => {
  try {
    console.log(`📱 Testing text OTP sending to: ${phoneNumber}`);
    
    const otp = watiService.generateOTP();
    console.log(`🔐 Generated OTP: ${otp}`);
    
    const result = await watiService.sendWhatsAppTextOTP(phoneNumber, otp);
    
    console.log('📤 Send Result:', result);
    
    if (result.success) {
      console.log('✅ Text OTP sent successfully');
      console.log('📨 Message ID:', result.messageId);
    } else {
      console.log('❌ Failed to send text OTP');
    }
    
    return { ...result, otp: otp };
  } catch (error) {
    console.error('💥 Error sending text OTP:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Test Template OTP Sending
 * @param {string} phoneNumber - Phone number to test
 */
export const testSendTemplateOTP = async (phoneNumber) => {
  try {
    console.log(`📄 Testing template OTP sending to: ${phoneNumber}`);
    
    const otp = watiService.generateOTP();
    console.log(`🔐 Generated OTP: ${otp}`);
    
    const result = await watiService.sendWhatsAppOTP(phoneNumber, otp);
    
    console.log('📤 Template Send Result:', result);
    
    if (result.success) {
      console.log('✅ Template OTP sent successfully');
      console.log('📨 Message ID:', result.messageId);
    } else {
      console.log('❌ Failed to send template OTP');
    }
    
    return { ...result, otp: otp };
  } catch (error) {
    console.error('💥 Error sending template OTP:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Full Integration Test
 * @param {string} testPhoneNumber - Your phone number for testing
 */
export const runFullTest = async (testPhoneNumber) => {
  console.log('🚀 Starting WATI Full Integration Test...\n');
  
  // Test 1: Configuration
  console.log('--- Test 1: Configuration ---');
  const configTest = testWatiConfig();
  if (!configTest.configured) {
    console.log('❌ Configuration incomplete. Please check your WATI credentials.');
    return { success: false, step: 'configuration' };
  }
  console.log('✅ Configuration looks good!\n');
  
  // Test 2: Phone Availability
  console.log('--- Test 2: Phone Availability ---');
  const availabilityTest = await testPhoneAvailability(testPhoneNumber);
  if (availabilityTest.error) {
    console.log('⚠️ Availability check failed, but continuing...\n');
  }
  
  // Test 3: Text Message
  console.log('--- Test 3: Text Message OTP ---');
  const textTest = await testSendTextOTP(testPhoneNumber);
  
  // Test 4: Template Message (if text works)
  if (textTest.success) {
    console.log('--- Test 4: Template Message OTP ---');
    const templateTest = await testSendTemplateOTP(testPhoneNumber);
    
    return {
      success: true,
      results: {
        config: configTest,
        availability: availabilityTest,
        textMessage: textTest,
        templateMessage: templateTest,
      }
    };
  } else {
    console.log('❌ Text message failed, skipping template test');
    return {
      success: false,
      step: 'text_message',
      results: {
        config: configTest,
        availability: availabilityTest,
        textMessage: textTest,
      }
    };
  }
};

/**
 * Quick Test Function
 * Call this from your component or console to test WATI integration
 */
export const quickTest = async () => {
  // Replace with your phone number for testing
  const testNumber = '+14798024855'; // Your WATI number
  
  console.log('🧪 WATI Quick Test Starting...');
  
  const result = await runFullTest(testNumber);
  
  if (result.success) {
    console.log('🎉 All tests passed! WATI integration is working correctly.');
  } else {
    console.log(`❌ Test failed at step: ${result.step}`);
    console.log('Please check the error messages above and fix the issues.');
  }
  
  return result;
};

// Usage examples:
// import { quickTest, testSendTextOTP } from '../utils/testWati';
// 
// // Quick test
// quickTest();
// 
// // Test specific phone number
// testSendTextOTP('+1234567890');
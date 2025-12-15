/**
 * WATI Configuration
 * Update these values with your WATI account details
 */

export const WATI_CONFIG = {
  // Your WATI API Base URL
  baseUrl: 'https://app-server.wati.io/api/v1',
  
  // Your WATI Access Token
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxNDNkYzZmNC1kYjVhLTQ2YWEtOTZiMy1iODM2ODJiMjJiODIiLCJ1bmlxdWVfbmFtZSI6InN1cHBvcnRAdmlkdXNoaWluZm90ZWNoLmNvbSIsIm5hbWVpZCI6InN1cHBvcnRAdmlkdXNoaWluZm90ZWNoLmNvbSIsImVtYWlsIjoic3VwcG9ydEB2aWR1c2hpaW5mb3RlY2guY29tIiwiYXV0aF90aW1lIjoiMDgvMDUvMjAyNSAxNTo1NDowNCIsImRiX25hbWUiOiJ3YXRpX2FwcF90cmlhbCIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6WyJUUklBTCIsIlRSSUFMUEFJRCJdLCJleHAiOjI1MzQwMjMwMDgwMCwiaXNzIjoiQ2xhcmVfQUkiLCJhdWQiOiJDbGFyZV9BSSJ9.QmZCDBxW9roMcaD2-rJjPhAqpoe9fd9KQ0vsGJ0UiEE',
  
  // Your verified WhatsApp Business phone number (without +)
  // US number: +1 479-802-4855 = 14798024855
  senderNumber: '14798024855',
  
  // WhatsApp Template Names (create these in WATI dashboard)
  templates: {
    // OTP Template - needs to be approved by WhatsApp
    otp: 'otp_verification',
    
    // Welcome Template (optional)
    welcome: 'welcome_message',
  },
  
  // WATI API Endpoints (Official Documentation 2024)
  endpoints: {
    sendTemplate: '/api/v1/sendTemplateMessage',
    sendSessionMessage: '/api/v1/sendSessionMessage', // Needs /{whatsappNumber} appended
    sendTemplateMessages: '/api/v1/sendTemplateMessages',
    sendInteractiveList: '/api/v1/sendInteractiveListMessage',
    sendInteractiveButtons: '/api/v1/sendInteractiveButtonsMessage',
    checkNumber: '/api/v1/checkPhoneNumberStatus',
  },
};

/**
 * Template Structure for WATI
 * 
 * OTP Template Example:
 * ------------------------
 * Template Name: otp_verification
 * Template Content: 
 * "🔐 Your {{1}} verification code is: *{{2}}*
 * 
 * Valid for {{3}} minutes. Don't share this code with anyone.
 * 
 * - Team {{1}}"
 * 
 * Parameters:
 * {{1}} = App Name (Splitzy)
 * {{2}} = OTP Code (123456)
 * {{3}} = Validity (5)
 * 
 * How to create in WATI:
 * 1. Go to WATI Dashboard > Broadcast > Templates
 * 2. Create new template with above content
 * 3. Submit for WhatsApp approval
 * 4. Update template name in config above
 */

export const OTP_TEMPLATE_PARAMS = {
  appName: 'Splitzy',
  validityMinutes: '5',
};

// Environment-specific configurations
export const ENV_CONFIG = {
  development: {
    ...WATI_CONFIG,
    // Override for development if needed
    debug: true,
    logRequests: true,
  },
  production: {
    ...WATI_CONFIG,
    debug: false,
    logRequests: false,
  },
};

// Get config based on environment
export const getWatiConfig = () => {
  const isDevelopment = __DEV__;
  return isDevelopment ? ENV_CONFIG.development : ENV_CONFIG.production;
};
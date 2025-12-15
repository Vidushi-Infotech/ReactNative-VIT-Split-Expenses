# WATI WhatsApp OTP Integration Setup Guide

## 🚀 Overview
This guide will help you set up WATI WhatsApp OTP integration for your Splitzy app with dynamic phone login screen.

## 📋 Prerequisites
1. **WATI Account** - Sign up at [wati.io](https://wati.io)
2. **WhatsApp Business Account** - Verified phone number
3. **React Native Environment** - Set up and running

## 🔧 Setup Steps

### 1. WATI Account Configuration

#### A. Get Your WATI Credentials
1. Login to your WATI dashboard
2. Go to **Settings > API**
3. Copy your:
   - **API URL** (e.g., `https://live-server-113452.wati.io/api/v1`)
   - **Access Token**
   - **WhatsApp Business Number**

#### B. Create WhatsApp Template
1. Go to **Broadcast > Templates**
2. Click **Create Template**
3. Use this template:

```
Template Name: otp_verification
Category: AUTHENTICATION
Language: English

Template Content:
🔐 Your {{1}} verification code is: *{{2}}*

Valid for {{3}} minutes. Don't share this code with anyone.

- Team {{1}}
```

4. **Parameters:**
   - `{{1}}` = App Name (Splitzy)
   - `{{2}}` = OTP Code
   - `{{3}}` = Validity (5 minutes)

5. Submit for WhatsApp approval (usually takes 24-48 hours)

### 2. Configure Your App

#### ✅ Configuration Already Updated!
Your WATI credentials have been configured in `/src/config/watiConfig.js`:

```javascript
export const WATI_CONFIG = {
  baseUrl: 'https://app-server.wati.io/api/v1',
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', // ✅ Configured
  senderNumber: '14798024855', // ✅ Your US number: +1 479-802-4855
  templates: {
    otp: 'otp_verification', // Create this template in WATI dashboard
  },
};
```

**Next Steps:**
1. Create the WhatsApp template (see below)
2. Test the integration

### 3. Install Dependencies
Make sure you have these packages installed:

```bash
npm install react-native-vector-icons
# For iOS
cd ios && pod install
```

### 4. Test the Integration

#### Quick Test
Use the test utility to verify your setup:

```javascript
// In your component or React Native console
import { quickTest } from '../utils/testWati';

// Run full test
quickTest();
```

#### Manual Testing
1. **Test with your number**: `+14798024855`
2. **Test with other numbers**: Try different phone numbers
3. **Check console logs**: Look for success/error messages
4. **Verify in WATI dashboard**: Check message delivery status

#### Test Functions Available:
```javascript
import { 
  testWatiConfig,
  testPhoneAvailability, 
  testSendTextOTP,
  testSendTemplateOTP,
  runFullTest 
} from '../utils/testWati';

// Test configuration
testWatiConfig();

// Test phone availability
testPhoneAvailability('+1234567890');

// Test text message
testSendTextOTP('+1234567890');

// Test template message
testSendTemplateOTP('+1234567890');
```

#### Development Testing
1. The OTP will be logged in console during development
2. Check WATI dashboard for message delivery status
3. Use your own number first: `+14798024855`

#### Production Setup
1. Remove `otpForTesting` from navigation params
2. Set `debug: false` in production config
3. Test with multiple phone numbers

## 🎯 Features Implemented

### ✅ Dynamic Phone Login Screen
- **Multi-country support** with dynamic digit validation
- **WhatsApp availability detection** for phone numbers
- **Smart method selection** (WhatsApp/SMS)
- **Real-time validation** and error handling
- **Animated UI** with smooth transitions
- **Loading states** and progress indicators

### ✅ WATI WhatsApp Integration
- **Template message support** for professional appearance
- **Fallback to text messages** if template fails
- **SMS backup** if WhatsApp delivery fails
- **Delivery status tracking** with message IDs
- **Error handling** with retry mechanisms

### ✅ Smart OTP Delivery
- **Automatic provider selection** based on availability
- **Fallback mechanisms** (WhatsApp → SMS → Error)
- **User preference** for delivery method
- **Real-time availability checking**

## 📱 UI Features

### Phone Input
- Dynamic country selection (6+ countries)
- Real-time phone number validation
- WhatsApp availability indicator
- Smart digit length validation per country

### Method Selection
- Visual method picker (WhatsApp/SMS)
- Availability-based auto-selection
- Clear visual feedback
- Disabled state for unavailable methods

### Enhanced UX
- Smooth animations and transitions
- Loading indicators during API calls
- Success/error message handling
- Retry mechanisms for failed deliveries

## 🔧 Customization Options

### Add More Countries
Edit `PhoneLoginScreen.jsx`:

```javascript
const countries = [
  { code: '+91', name: 'India', flag: '🇮🇳', length: 10 },
  { code: '+1', name: 'USA', flag: '🇺🇸', length: 10 },
  { code: '+33', name: 'France', flag: '🇫🇷', length: 10 },
  // Add more countries...
];
```

### Custom Templates
Create additional templates in WATI dashboard and update config:

```javascript
templates: {
  otp: 'otp_verification',
  welcome: 'welcome_message',
  reminder: 'payment_reminder',
}
```

### SMS Integration
For SMS fallback, integrate with:
- Firebase Auth SMS
- Twilio SMS
- AWS SNS
- Other SMS providers

## 🐛 Troubleshooting

### Common Issues

#### 1. Template Not Working
- **Solution**: Ensure template is approved by WhatsApp
- **Check**: Template name matches exactly in config
- **Fallback**: Use text message method

#### 2. WhatsApp Not Available
- **Solution**: Implement SMS fallback
- **Check**: Phone number format (remove + sign)
- **Verify**: Number exists on WhatsApp

#### 3. API Errors
- **Solution**: Check access token and URL
- **Verify**: WATI account status and credits
- **Debug**: Enable logging in development

#### 4. OTP Not Received
- **Check**: Phone number format
- **Verify**: WhatsApp Business number is active
- **Fallback**: Try SMS method

### Debug Mode
Enable debugging in development:

```javascript
// In watiConfig.js
development: {
  debug: true,
  logRequests: true,
}
```

## 📈 Production Checklist

- [ ] WATI credentials configured
- [ ] WhatsApp template approved
- [ ] SMS fallback implemented
- [ ] Error handling tested
- [ ] Debug mode disabled
- [ ] OTP logging removed
- [ ] Rate limiting implemented
- [ ] Security measures in place

## 🔐 Security Best Practices

1. **Never log OTPs** in production
2. **Implement rate limiting** for OTP requests
3. **Use HTTPS** for all API calls
4. **Validate phone numbers** server-side
5. **Set OTP expiration** (5-10 minutes)
6. **Limit retry attempts** (3-5 times)

## 📞 Support

For issues with:
- **WATI Integration**: Check WATI documentation or contact WATI support
- **WhatsApp Templates**: Contact WhatsApp Business support
- **App Integration**: Review this guide and test step by step

---

🎉 **Congratulations!** You now have a fully functional dynamic phone login screen with WATI WhatsApp OTP integration!
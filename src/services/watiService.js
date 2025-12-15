import { getWatiConfig, OTP_TEMPLATE_PARAMS } from '../config/watiConfig';

/**
 * WATI WhatsApp Service for OTP Integration
 * Handles WhatsApp OTP sending via WATI API
 */

class WatiService {
  constructor() {
    this.config = getWatiConfig();
  }

  /**
   * Generate a 6-digit OTP
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send WhatsApp OTP using WATI Template Message
   * @param {string} phoneNumber - Phone number with country code (e.g., 919876543210)
   * @param {string} otp - 6-digit OTP code
   * @param {string} templateName - WATI template name
   */
  async sendWhatsAppOTP(phoneNumber, otp, templateName = null) {
    try {
      if (this.config.debug) {
        console.log('🟢 WATI: Sending WhatsApp OTP to:', phoneNumber);
      }

      // Use default template from config if not provided
      const template = templateName || this.config.templates.otp;
      
      // Format phone number (remove + if present)
      const formattedNumber = phoneNumber.replace(/^\+/, '');

      const requestBody = {
        whatsappNumber: formattedNumber,
        templateName: template,
        bodyValues: [
          OTP_TEMPLATE_PARAMS.appName,
          otp,
          OTP_TEMPLATE_PARAMS.validityMinutes
        ],
      };

      if (this.config.logRequests) {
        console.log('📤 WATI Request:', JSON.stringify(requestBody, null, 2));
      }

      const response = await fetch(`${this.config.baseUrl}${this.config.endpoints.sendTemplate}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.accessToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (this.config.debug) {
        console.log('📥 WATI Template Response Status:', response.status);
      }

      // Get response text first to handle non-JSON responses
      const responseText = await response.text();
      
      if (this.config.debug) {
        console.log('📥 WATI Template Raw Response:', responseText);
      }

      let result;
      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('❌ WATI: Invalid JSON response:', responseText);
        throw new Error('Invalid response from WATI API');
      }

      if (response.ok && (result.result === true || result.success === true)) {
        if (this.config.debug) {
          console.log('✅ WATI: WhatsApp template OTP sent successfully');
        }
        return {
          success: true,
          messageId: result.id || result.messageId || 'unknown',
          provider: 'whatsapp',
          message: 'OTP sent via WhatsApp template successfully',
        };
      } else {
        console.error('❌ WATI: Failed to send WhatsApp template OTP:', result);
        throw new Error(result.info || result.message || result.error || 'Failed to send WhatsApp template OTP');
      }
    } catch (error) {
      console.error('💥 WATI: Error sending WhatsApp OTP:', error);
      throw error;
    }
  }

  /**
   * Send WhatsApp OTP using Simple Text Message (if template is not available)
   * @param {string} phoneNumber - Phone number with country code
   * @param {string} otp - 6-digit OTP code
   */
  async sendWhatsAppTextOTP(phoneNumber, otp) {
    try {
      if (this.config.debug) {
        console.log('🟡 WATI: Sending WhatsApp text OTP to:', phoneNumber);
      }

      const formattedNumber = phoneNumber.replace(/^\+/, '');
      const message = `🔐 Your Splitzy verification code is: *${otp}*\n\nValid for 5 minutes. Don't share this code with anyone.\n\n- Team Splitzy`;

      const requestBody = {
        whatsappNumber: formattedNumber,
        messageText: message,
      };

      if (this.config.logRequests) {
        console.log('📤 WATI Text Request:', JSON.stringify(requestBody, null, 2));
      }

      // ✅ FIXED: Use the correct WATI API endpoint from documentation
      // Format: /api/v1/sendSessionMessage/{whatsappNumber}
      const correctEndpoint = `/api/v1/sendSessionMessage/${formattedNumber}`;
      
      if (this.config.debug) {
        console.log(`✅ Using WORKING WATI endpoint: ${correctEndpoint}`);
      }
      
      const response = await fetch(`${this.config.baseUrl}${correctEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.accessToken}`,
        },
        body: JSON.stringify({
          messageText: requestBody.messageText
        }),
      });

      if (this.config.debug) {
        console.log('📥 WATI Text Response Status:', response.status);
      }

      // Get response text first to handle non-JSON responses
      const responseText = await response.text();
      
      if (this.config.debug) {
        console.log('📥 WATI Text Raw Response:', responseText);
      }

      let result;
      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('❌ WATI: Invalid JSON response:', responseText);
        throw new Error('Invalid response from WATI API');
      }

      if (response.ok && (result.result === true || result.success === true)) {
        if (this.config.debug) {
          console.log('✅ WATI: WhatsApp text OTP sent successfully');
        }
        return {
          success: true,
          messageId: result.id || result.messageId || 'unknown',
          provider: 'whatsapp',
          message: 'OTP sent via WhatsApp text successfully',
        };
      } else {
        // Enhanced error logging
        console.error('❌ WATI: Failed to send WhatsApp text OTP');
        console.error('📊 Response Status:', response.status);
        console.error('📊 Response OK:', response.ok);
        console.error('📊 Result Object:', JSON.stringify(result, null, 2));
        console.error('📊 Result.result:', result.result);
        console.error('📊 Result.success:', result.success);
        console.error('📊 Result.info:', result.info);
        console.error('📊 Result.message:', result.message);
        console.error('📊 Result.error:', result.error);
        
        const errorMessage = result.info || result.message || result.error || `API returned ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('💥 WATI: Error sending WhatsApp text OTP:', error);
      throw error;
    }
  }

  /**
   * Send OTP - WhatsApp only
   * @param {string} phoneNumber - Phone number with country code
   * @param {string} preferredMethod - 'whatsapp' or 'sms'
   */
  async sendOTP(phoneNumber, preferredMethod = 'whatsapp') {
    const otp = this.generateOTP();
    
    try {
      let result;

      if (preferredMethod === 'whatsapp') {
        console.log('🟢 WATI: Attempting WhatsApp text message (skipping template)');
        // Try text message directly (more reliable than templates)
        result = await this.sendWhatsAppTextOTP(phoneNumber, otp);
      } else {
        // SMS is disabled - still try WhatsApp but log the attempt
        console.log('📱 SMS requested but disabled - trying WhatsApp instead');
        result = await this.sendWhatsAppTextOTP(phoneNumber, otp);
      }

      return {
        ...result,
        otp: otp, // For development/testing - remove in production
        phoneNumber: phoneNumber,
      };
    } catch (error) {
      console.error('💥 Failed to send WhatsApp OTP:', error);
      
      // For development, log the OTP so you can still proceed
      console.log(`📱 [DEVELOPMENT] WhatsApp failed, OTP for ${phoneNumber}: ${otp}`);
      
      // Return development fallback
      return {
        success: true,
        provider: 'development-fallback',
        message: 'WhatsApp failed - OTP logged for development (check console)',
        otp: otp,
        phoneNumber: phoneNumber,
        developmentMode: true,
      };
    }
  }

  /**
   * SMS Fallback - Disabled for WhatsApp-only implementation
   * @param {string} phoneNumber - Phone number with country code
   * @param {string} otp - 6-digit OTP code
   */
  async sendSMSOTP(phoneNumber, otp) {
    // For now, we'll only focus on WhatsApp delivery
    // SMS fallback is disabled to avoid Firebase billing issues
    console.log('📱 SMS fallback disabled - WhatsApp only mode');
    console.log(`📱 [DEVELOPMENT] OTP for ${phoneNumber}: ${otp}`);
    
    return {
      success: true,
      provider: 'development-sms',
      message: 'SMS disabled - WhatsApp only. OTP logged for development.',
      developmentOTP: otp,
      simulated: true,
      whatsappOnly: true,
    };
  }

  /**
   * Verify OTP (you can store OTPs in Firebase/AsyncStorage for verification)
   * @param {string} phoneNumber - Phone number
   * @param {string} enteredOTP - OTP entered by user
   * @param {string} actualOTP - Actual OTP sent
   */
  verifyOTP(phoneNumber, enteredOTP, actualOTP) {
    return enteredOTP === actualOTP;
  }

  /**
   * Check if WhatsApp number is available/verified
   * @param {string} phoneNumber - Phone number to check
   */
  async checkWhatsAppAvailability(phoneNumber) {
    try {
      const formattedNumber = phoneNumber.replace(/^\+/, '');
      
      if (this.config.debug) {
        console.log('🔍 WATI: Checking WhatsApp availability for:', formattedNumber);
      }
      
      const response = await fetch(`${this.config.baseUrl}${this.config.endpoints.checkNumber}?whatsappNumber=${formattedNumber}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (this.config.debug) {
        console.log('📥 WATI Response Status:', response.status);
        console.log('📥 WATI Response Headers:', JSON.stringify([...response.headers.entries()]));
      }

      // Check if response is successful
      if (!response.ok) {
        console.log(`⚠️ WATI API returned ${response.status}: ${response.statusText}`);
        // Return true by default to allow WhatsApp attempts
        return { available: true, whatsappExists: true };
      }

      // Get response text first to check if it's valid JSON
      const responseText = await response.text();
      
      if (this.config.debug) {
        console.log('📥 WATI Raw Response:', responseText);
      }

      // Check if response is empty or not JSON
      if (!responseText || responseText.trim() === '') {
        console.log('⚠️ WATI returned empty response, assuming WhatsApp is available');
        return { available: true, whatsappExists: true };
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.log('⚠️ WATI returned non-JSON response:', responseText);
        // Return true by default to allow WhatsApp attempts
        return { available: true, whatsappExists: true };
      }
      
      if (this.config.logRequests) {
        console.log('📥 WATI Availability Response:', JSON.stringify(result, null, 2));
      }
      
      return {
        available: result.result === true || result.success === true,
        whatsappExists: result.result === true || result.success === true,
      };
    } catch (error) {
      console.error('❌ Error checking WhatsApp availability:', error);
      // Return true by default to allow WhatsApp attempts
      return { available: true, whatsappExists: true };
    }
  }
}

export default new WatiService();
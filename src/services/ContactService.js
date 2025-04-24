import { Platform, NativeModules, PermissionsAndroid } from 'react-native';
import { PERMISSIONS, RESULTS, check, request } from 'react-native-permissions';

// Import the contacts module directly
import RNContacts from 'react-native-contacts';

// More robust way to import and initialize Contacts
let Contacts = RNContacts;

// Function to initialize the Contacts module
const initializeContacts = () => {
  if (Contacts !== null) {
    console.log('Contacts module already initialized');
    return true; // Already initialized
  }

  try {
    // Check if the native module is available
    const ContactsManager = NativeModules.ContactsManager;
    if (!ContactsManager) {
      console.warn('ContactsManager native module is not available');
      console.log('Native modules available:', Object.keys(NativeModules));
      return false;
    }

    // We already imported the module at the top, but double-check it's available
    if (!Contacts) {
      console.warn('react-native-contacts module could not be imported');
      // Try to import it again as a fallback
      try {
        Contacts = require('react-native-contacts').default;
      } catch (importError) {
        console.error('Failed to import react-native-contacts:', importError);
      }

      if (!Contacts) {
        return false;
      }
    }

    console.log('Contacts module successfully initialized');
    return true;
  } catch (error) {
    console.warn('Error initializing react-native-contacts:', error);
    return false;
  }
};

/**
 * Service for handling device contact operations
 */
class ContactService {
  /**
   * Get all contacts from device
   * @returns {Promise<Array>} - Array of contacts
   */
  static async getAllContacts() {
    try {
      console.log('=== CONTACT SERVICE DEBUG START ===');
      console.log('Platform:', Platform.OS, Platform.Version);
      console.log('Available native modules:', Object.keys(NativeModules));

      // Initialize the Contacts module if not already done
      console.log('Initializing Contacts module...');
      const isInitialized = initializeContacts();
      console.log('Contacts module initialization result:', isInitialized);

      if (!isInitialized) {
        console.warn('Failed to initialize Contacts module');
        return [];
      }

      // Double-check that Contacts is available
      const hasGetAll = Contacts && typeof Contacts.getAll === 'function';
      console.log('Contacts.getAll available:', hasGetAll);

      if (!hasGetAll) {
        console.warn('Contacts module is not properly initialized');
        return [];
      }

      // Handle permissions based on platform
      let permissionGranted = false;

      console.log(`Checking contacts permission on ${Platform.OS}`);

      if (Platform.OS === 'android') {
        try {
          // First check if we already have permission
          const checkResult = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_CONTACTS);
          console.log(`Android permission check result: ${checkResult}`);

          if (checkResult) {
            console.log('Android contacts permission already granted');
            permissionGranted = true;
          } else {
            // Request permission if we don't have it
            console.log('Requesting Android contacts permission...');
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
              {
                title: 'Contacts Permission',
                message: 'VitSplit needs access to your contacts to help you find and add friends to groups more easily.',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
              }
            );
            console.log(`Android permission request result: ${granted}`);
            permissionGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
          }

          // If the built-in method failed, try react-native-permissions as a fallback
          if (!permissionGranted) {
            console.log('Trying react-native-permissions as fallback...');
            const permission = PERMISSIONS.ANDROID.READ_CONTACTS;
            const permissionStatus = await check(permission);
            console.log(`react-native-permissions check result: ${permissionStatus}`);

            if (permissionStatus !== RESULTS.GRANTED) {
              console.log('Requesting permission with react-native-permissions...');
              const requestResult = await request(permission);
              console.log(`react-native-permissions request result: ${requestResult}`);
              permissionGranted = requestResult === RESULTS.GRANTED;
            } else {
              permissionGranted = true;
            }
          }
        } catch (err) {
          console.warn('Error requesting Android contacts permission:', err);
          // One more attempt with react-native-contacts's own permission method
          try {
            console.log('Trying Contacts.requestPermission() as last resort...');
            const contactsPermission = await Contacts.requestPermission();
            console.log(`Contacts.requestPermission result: ${contactsPermission}`);
            permissionGranted = contactsPermission === 'authorized';
          } catch (contactsErr) {
            console.error('Failed to request permission with Contacts.requestPermission():', contactsErr);
          }
        }
      } else if (Platform.OS === 'ios') {
        // iOS permission handling
        try {
          console.log('Checking iOS contacts permission...');
          const permission = PERMISSIONS.IOS.CONTACTS;
          const permissionStatus = await check(permission);
          console.log(`iOS permission check result: ${permissionStatus}`);

          if (permissionStatus !== RESULTS.GRANTED && permissionStatus !== RESULTS.LIMITED) {
            console.log('Requesting iOS contacts permission...');
            const requestResult = await request(permission);
            console.log(`iOS permission request result: ${requestResult}`);
            permissionGranted = requestResult === RESULTS.GRANTED || requestResult === RESULTS.LIMITED;
          } else {
            permissionGranted = true;
          }

          // If react-native-permissions failed, try react-native-contacts's own permission method
          if (!permissionGranted) {
            console.log('Trying Contacts.requestPermission() for iOS...');
            const contactsPermission = await Contacts.requestPermission();
            console.log(`Contacts.requestPermission result: ${contactsPermission}`);
            permissionGranted = contactsPermission === 'authorized' || contactsPermission === 'limited';
          }
        } catch (err) {
          console.warn('Error requesting iOS contacts permission:', err);
        }
      }

      if (!permissionGranted) {
        console.log('Contacts permission denied - ABORTING CONTACT RETRIEVAL');
        return [];
      }

      console.log('✅ Contacts permission granted, proceeding to get contacts');
      console.log('=== PERMISSION CHECK PASSED ===');

      // Get all contacts with proper error handling
      let contacts = [];

      // Try multiple methods to get contacts
      try {
        console.log('=== ATTEMPTING CONTACT RETRIEVAL ===');
        console.log('Method 1: Calling Contacts.getAll()...');
        console.log('Contacts object type:', typeof Contacts);
        console.log('Available methods on Contacts:', Object.keys(Contacts));
        contacts = await Contacts.getAll();
        console.log(`✅ SUCCESS! Retrieved ${contacts.length} raw contacts from device`);
      } catch (getallError) {
        console.error('Error with Contacts.getAll():', getallError);

        // Try alternative method
        try {
          console.log('Method 2: Trying alternative method with Contacts.getAllWithoutPhotos()...');
          contacts = await Contacts.getAllWithoutPhotos();
          console.log(`✅ SUCCESS with Method 2! Retrieved ${contacts.length} contacts without photos`);
        } catch (alternativeError) {
          console.error('Error with alternative method:', alternativeError);

          // One last attempt with a timeout
          try {
            console.log('Method 3: Trying with a timeout wrapper (last resort)...');
            contacts = await new Promise((resolve, reject) => {
              console.log('Setting up timeout promise...');
              const timeout = setTimeout(() => {
                console.log('TIMEOUT reached after 10 seconds');
                reject(new Error('Contacts retrieval timed out'));
              }, 10000); // 10 second timeout

              console.log('Calling Contacts.getAll() with timeout wrapper...');
              Contacts.getAll()
                .then(result => {
                  console.log('Contacts.getAll() resolved inside timeout wrapper');
                  clearTimeout(timeout);
                  resolve(result);
                })
                .catch(err => {
                  console.log('Contacts.getAll() rejected inside timeout wrapper:', err);
                  clearTimeout(timeout);
                  reject(err);
                });
            });
            console.log(`✅ SUCCESS with Method 3! Retrieved ${contacts.length} contacts with timeout wrapper`);
          } catch (timeoutError) {
            console.error('Error with timeout wrapper:', timeoutError);
            return [];
          }
        }
      }

      // If we still don't have contacts, return empty array
      if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
        console.log('❌ No contacts retrieved after all attempts');
        console.log('=== CONTACT SERVICE DEBUG END (NO CONTACTS) ===');
        return [];
      }

      console.log('=== CONTACT RETRIEVAL SUCCESSFUL ===');
      console.log(`Total contacts retrieved: ${contacts.length}`);

      // Log a sample contact for debugging
      if (contacts.length > 0) {
        console.log('Sample contact structure:', JSON.stringify(contacts[0], null, 2));
      }

      // Count contacts with phone numbers
      const contactsWithPhones = contacts.filter(c => c.phoneNumbers && c.phoneNumbers.length > 0).length;
      console.log(`Contacts with phone numbers: ${contactsWithPhones} out of ${contacts.length}`);

      // Format contacts for easier use
      try {
        const formattedContacts = contacts.map(contact => {
          // Skip contacts without phone numbers
          if (!contact.phoneNumbers || !Array.isArray(contact.phoneNumbers) || contact.phoneNumbers.length === 0) {
            return null;
          }

          const phoneNumbers = contact.phoneNumbers.map(phone => ({
            label: phone.label || 'other',
            number: phone.number || '',
            // Clean the phone number (remove any non-digit characters)
            cleanNumber: (phone.number || '').replace(/\D/g, '')
          })).filter(phone => phone.number && phone.cleanNumber);

          // Skip contacts that ended up with no valid phone numbers after cleaning
          if (phoneNumbers.length === 0) {
            return null;
          }

          // Log contact details for debugging
          const contactName = `${contact.givenName || ''} ${contact.familyName || ''}`.trim() || 'Unknown';
          console.log(`Contact: ${contactName}, ID: ${contact.recordID || 'unknown'}`);
          console.log(`  Phone numbers: ${phoneNumbers.map(p => p.number).join(', ')}`);

          return {
            contactId: contact.recordID || `temp-${Math.random().toString(36).substring(2, 9)}`,
            name: contactName,
            phoneNumbers: phoneNumbers,
            // Use the first phone number as default
            primaryPhone: phoneNumbers[0].number,
            primaryPhoneClean: phoneNumbers[0].cleanNumber,
            thumbnail: contact.thumbnailPath || null,
            hasThumbnail: !!contact.hasThumbnail,
            // Add raw data for debugging
            rawGivenName: contact.givenName || '',
            rawFamilyName: contact.familyName || ''
          };
        }).filter(Boolean); // Remove null entries

        console.log(`Formatted ${formattedContacts.length} valid contacts with phone numbers`);
        console.log('=== CONTACT SERVICE DEBUG END (SUCCESS) ===');
        return formattedContacts;
      } catch (formattingError) {
        console.error('Error formatting contacts:', formattingError);
        console.log('=== CONTACT SERVICE DEBUG END (FORMATTING ERROR) ===');
        return [];
      }
    } catch (error) {
      console.error('Error in getAllContacts:', error);
      console.log('=== CONTACT SERVICE DEBUG END (GENERAL ERROR) ===');
      return [];
    }
  }

  /**
   * Find registered app users among device contacts
   * @param {Array} deviceContacts - Array of device contacts
   * @param {Array} appUsers - Array of app users
   * @param {Object} currentUser - Current user profile (optional) to exclude from results
   * @returns {Array} - Array of matched contacts with app user data
   */
  static findRegisteredContacts(deviceContacts, appUsers, currentUser = null) {
    // Check for null or empty arrays to avoid errors
    if (!deviceContacts || !deviceContacts.length || !appUsers || !appUsers.length) {
      console.log('No device contacts or app users to match');
      return [];
    }

    console.log(`Matching ${deviceContacts.length} device contacts with ${appUsers.length} app users`);
    const registeredContacts = [];

    // Create a map of app users by clean phone number for faster lookup
    const appUserMap = {};
    appUsers.forEach(user => {
      if (user && user.phoneNumber) {
        // Clean the phone number (remove any non-digit characters)
        const cleanPhone = user.phoneNumber.replace(/\D/g, '');
        console.log(`App user: ${user.name}, Phone: ${user.phoneNumber}, Clean: ${cleanPhone}`);

        // Handle different phone number formats (with or without country code)
        // Store both the full number and the last 10 digits for matching
        appUserMap[cleanPhone] = user;

        // Also store the last 10 digits for matching numbers with/without country code
        if (cleanPhone.length > 10) {
          const last10Digits = cleanPhone.slice(-10);
          appUserMap[last10Digits] = user;
          console.log(`  Also storing last 10 digits: ${last10Digits}`);
        }
      }
    });

    // Log the app user map keys for debugging
    console.log('App user map keys:', Object.keys(appUserMap));

    // For each device contact, check if any of their phone numbers is registered
    deviceContacts.forEach(contact => {
      if (contact && contact.phoneNumbers && contact.phoneNumbers.length) {
        let matched = false;

        console.log(`Checking contact: ${contact.name}`);
        for (const phone of contact.phoneNumbers) {
          if (!phone || !phone.cleanNumber) continue;

          console.log(`  Phone: ${phone.number}, Clean: ${phone.cleanNumber}`);

          // Try to match with the full clean number
          let appUser = appUserMap[phone.cleanNumber];
          if (appUser) {
            console.log(`  MATCH FOUND with full number: ${phone.cleanNumber}`);
          }

          // If no match, try with the last 10 digits
          if (!appUser && phone.cleanNumber.length >= 10) {
            const last10Digits = phone.cleanNumber.slice(-10);
            appUser = appUserMap[last10Digits];
            if (appUser) {
              console.log(`  MATCH FOUND with last 10 digits: ${last10Digits}`);
            }
          }

          if (appUser && !matched) {
            console.log(`  Adding match: Contact ${contact.name} matches app user ${appUser.name}`);
            // Combine contact and app user data
            registeredContacts.push({
              ...contact,
              ...appUser,
              contactName: contact.name, // Keep original contact name
              appUserId: appUser.id,
              isRegistered: true,
              matchedPhoneNumber: phone.number, // Store the matched phone number
              matchedWith: appUser.phoneNumber // Store what it matched with
            });

            matched = true; // Mark as matched to avoid duplicates
            break; // Found a match, stop checking other numbers
          }
        }
      }
    });

    console.log(`Found ${registeredContacts.length} registered contacts before deduplication`);

    // Deduplicate contacts by app user ID to avoid duplicate keys
    // and filter out the current user if provided
    const uniqueAppUserIds = new Set();
    const uniqueRegisteredContacts = registeredContacts.filter(contact => {
      // Filter out duplicates
      if (contact.appUserId && uniqueAppUserIds.has(contact.appUserId)) {
        console.log(`  Removing duplicate app user: ${contact.name} (${contact.appUserId})`);
        return false;
      }

      // Filter out current user if provided
      if (currentUser && contact.appUserId) {
        if (contact.appUserId === currentUser.id ||
            (contact.phoneNumber && currentUser.phoneNumber &&
             contact.phoneNumber.replace(/\D/g, '') === currentUser.phoneNumber.replace(/\D/g, ''))) {
          console.log(`  Removing current user from results: ${contact.name}`);
          return false;
        }
      }

      if (contact.appUserId) {
        uniqueAppUserIds.add(contact.appUserId);
      }
      return true;
    });

    console.log(`Returning ${uniqueRegisteredContacts.length} unique registered contacts`);
    if (uniqueRegisteredContacts.length > 0) {
      console.log('Unique registered contacts:', uniqueRegisteredContacts.map(c => `${c.name} (${c.matchedPhoneNumber} -> ${c.matchedWith})`));
    }
    return uniqueRegisteredContacts;
  }
}

export default ContactService;
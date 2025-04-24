// Standard country codes (without area codes)
const standardCountryCodes = [
  "+1", "+7", "+20", "+27", "+30", "+31", "+32", "+33", "+34", "+36", "+39",
  "+40", "+41", "+43", "+44", "+45", "+46", "+47", "+48", "+49", "+51", "+52",
  "+53", "+54", "+55", "+56", "+57", "+58", "+60", "+61", "+62", "+63", "+64",
  "+65", "+66", "+81", "+82", "+84", "+86", "+90", "+91", "+92", "+93", "+94",
  "+95", "+98", "+211", "+212", "+213", "+216", "+218", "+220", "+221", "+222",
  "+223", "+224", "+225", "+226", "+227", "+228", "+229", "+230", "+231",
  "+232", "+233", "+234", "+235", "+236", "+237", "+238", "+239", "+240",
  "+241", "+242", "+243", "+244", "+245", "+246", "+247", "+248", "+249",
  "+250", "+251", "+252", "+253", "+254", "+255", "+256", "+257", "+258",
  "+260", "+261", "+262", "+263", "+264", "+265", "+266", "+267", "+268",
  "+269", "+290", "+291", "+297", "+298", "+299", "+350", "+351", "+352",
  "+353", "+354", "+355", "+356", "+357", "+358", "+359", "+370", "+371",
  "+372", "+373", "+374", "+375", "+376", "+377", "+378", "+379", "+380",
  "+381", "+382", "+383", "+385", "+386", "+387", "+389", "+420", "+421",
  "+423", "+500", "+501", "+502", "+503", "+504", "+505", "+506", "+507",
  "+508", "+509", "+590", "+591", "+592", "+593", "+594", "+595", "+596",
  "+597", "+598", "+599", "+670", "+672", "+673", "+674", "+675", "+676",
  "+677", "+678", "+679", "+680", "+681", "+682", "+683", "+685", "+686",
  "+687", "+688", "+689", "+690", "+691", "+692", "+850", "+852", "+853",
  "+855", "+856", "+880", "+886", "+960", "+961", "+962", "+963", "+964",
  "+965", "+966", "+967", "+968", "+970", "+971", "+972", "+973", "+974",
  "+975", "+976", "+977", "+992", "+993", "+994", "+995", "+996", "+998"
];

/**
 * Extracts the country code and phone number from a full phone number
 * @param {string} fullPhoneNumber - The full phone number including country code (e.g., "+917988580975")
 * @returns {Object} An object with countryCode and phoneNumber properties
 */
export const extractCountryCodeAndNumber = (fullPhoneNumber) => {
  // Default values
  let countryCode = "";
  let phoneNumber = fullPhoneNumber;

  // Check if the phone number starts with a plus sign
  if (fullPhoneNumber && fullPhoneNumber.startsWith('+')) {
    // Try to match with standard country codes
    // Sort by length (longest first) to avoid partial matches
    const sortedCodes = [...standardCountryCodes].sort((a, b) => b.length - a.length);

    for (const code of sortedCodes) {
      if (fullPhoneNumber.startsWith(code)) {
        countryCode = code;
        phoneNumber = fullPhoneNumber.substring(code.length);
        break;
      }
    }

    // Special handling for North American Numbering Plan (NANP) countries that use +1
    // For +1, we want to extract just +1 as the country code, not +1XXX
    if (fullPhoneNumber.startsWith('+1') && countryCode.length > 2) {
      countryCode = '+1';
      phoneNumber = fullPhoneNumber.substring(2);
    }

    // If no match found with standard country codes, use the generic regex approach as fallback
    if (!countryCode) {
      const countryCodeMatch = fullPhoneNumber.match(/^(\+\d{1,3})/);
      if (countryCodeMatch) {
        countryCode = countryCodeMatch[1];
        phoneNumber = fullPhoneNumber.substring(countryCode.length);
      }
    }
  }

  return {
    countryCode,
    phoneNumber
  };
};

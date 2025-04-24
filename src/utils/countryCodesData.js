// Country codes data with formatting information
export const countryCodes = [
  // North America
  {
    country: "United States",
    code: "+1",
    format: "XXX-XXX-XXXX",
    example: "+1 212-555-1234",
    regex: /^\d{3}-\d{3}-\d{4}$/,
    flag: "🇺🇸"
  },
  {
    country: "Canada",
    code: "+1",
    format: "XXX-XXX-XXXX",
    example: "+1 416-555-1234",
    regex: /^\d{3}-\d{3}-\d{4}$/,
    flag: "🇨🇦"
  },
  {
    country: "Mexico",
    code: "+52",
    format: "XX XXXX XXXX",
    example: "+52 55 1234 5678",
    regex: /^\d{2} \d{4} \d{4}$/,
    flag: "🇲🇽"
  },

  // Europe
  {
    country: "United Kingdom",
    code: "+44",
    format: "XXXX XXXXXX",
    example: "+44 2071 234567",
    regex: /^\d{4} \d{6}$/,
    flag: "🇬🇧"
  },
  {
    country: "France",
    code: "+33",
    format: "X XX XX XX XX",
    example: "+33 1 23 45 67 89",
    regex: /^\d{1} \d{2} \d{2} \d{2} \d{2}$/,
    flag: "🇫🇷"
  },
  {
    country: "Germany",
    code: "+49",
    format: "XXX XXXXXXX",
    example: "+49 030 12345678",
    regex: /^\d{3} \d{7}$/,
    flag: "🇩🇪"
  },
  {
    country: "Italy",
    code: "+39",
    format: "XXX XXXXXXX",
    example: "+39 02 12345678",
    regex: /^\d{2,3} \d{7,8}$/,
    flag: "🇮🇹"
  },
  {
    country: "Spain",
    code: "+34",
    format: "XXX XXX XXX",
    example: "+34 911 234 567",
    regex: /^\d{3} \d{3} \d{3}$/,
    flag: "🇪🇸"
  },

  // Asia
  {
    country: "China",
    code: "+86",
    format: "XXX XXXX XXXX",
    example: "+86 10 1234 5678",
    regex: /^\d{2,3} \d{4} \d{4}$/,
    flag: "🇨🇳"
  },
  {
    country: "Japan",
    code: "+81",
    format: "XX XXXX XXXX",
    example: "+81 3 1234 5678",
    regex: /^\d{1,2} \d{4} \d{4}$/,
    flag: "🇯🇵"
  },
  {
    country: "India",
    code: "+91",
    format: "XXXXX XXXXX",
    example: "+91 98765 43210",
    regex: /^\d{5} \d{5}$/,
    flag: "🇮🇳"
  },
  {
    country: "South Korea",
    code: "+82",
    format: "XX XXXX XXXX",
    example: "+82 2 1234 5678",
    regex: /^\d{1,2} \d{4} \d{4}$/,
    flag: "🇰🇷"
  },

  // Middle East
  {
    country: "Israel",
    code: "+972",
    format: "X XXX XXXX",
    example: "+972 2 123 4567",
    regex: /^\d{1} \d{3} \d{4}$/,
    flag: "🇮🇱"
  },
  {
    country: "United Arab Emirates",
    code: "+971",
    format: "X XXX XXXX",
    example: "+971 4 123 4567",
    regex: /^\d{1} \d{3} \d{4}$/,
    flag: "🇦🇪"
  },

  // Africa
  {
    country: "South Africa",
    code: "+27",
    format: "XX XXX XXXX",
    example: "+27 11 123 4567",
    regex: /^\d{2} \d{3} \d{4}$/,
    flag: "🇿🇦"
  },

  // Oceania
  {
    country: "Australia",
    code: "+61",
    format: "X XXXX XXXX",
    example: "+61 2 1234 5678",
    regex: /^\d{1} \d{4} \d{4}$/,
    flag: "🇦🇺"
  },
  {
    country: "New Zealand",
    code: "+64",
    format: "X XXX XXXX",
    example: "+64 4 123 4567",
    regex: /^\d{1} \d{3} \d{4}$/,
    flag: "🇳🇿"
  },

  // South America
  {
    country: "Brazil",
    code: "+55",
    format: "XX XXXX XXXX",
    example: "+55 11 1234 5678",
    regex: /^\d{2} \d{4} \d{4}$/,
    flag: "🇧🇷"
  },
  {
    country: "Argentina",
    code: "+54",
    format: "XX XXXX XXXX",
    example: "+54 11 1234 5678",
    regex: /^\d{2} \d{4} \d{4}$/,
    flag: "🇦🇷"
  }
];

/**
 * Get country code data by code
 * @param {string} code - The country code (e.g., "+91")
 * @returns {Object|null} The country code data or null if not found
 */
export const getCountryByCode = (code) => {
  return countryCodes.find(country => country.code === code) || null;
};

/**
 * Format a phone number according to the country format
 * @param {string} phoneNumber - The raw phone number digits
 * @param {string} countryCode - The country code (e.g., "+91")
 * @returns {string} The formatted phone number
 */
export const formatPhoneNumber = (phoneNumber, countryCode) => {
  // Remove any non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');

  const country = getCountryByCode(countryCode);
  if (!country) return digitsOnly;

  // Get the format pattern
  const format = country.format;

  // Apply the format
  let formattedNumber = '';
  let digitIndex = 0;

  for (let i = 0; i < format.length; i++) {
    if (format[i] === 'X') {
      formattedNumber += digitIndex < digitsOnly.length ? digitsOnly[digitIndex] : '';
      digitIndex++;
    } else {
      formattedNumber += format[i];
    }
  }

  return formattedNumber;
};

/**
 * Validate a phone number according to the country format
 * @param {string} phoneNumber - The formatted phone number
 * @param {string} countryCode - The country code (e.g., "+91")
 * @returns {boolean} Whether the phone number is valid
 */
export const validatePhoneNumber = (phoneNumber, countryCode) => {
  const country = getCountryByCode(countryCode);
  if (!country) return false;

  return country.regex.test(phoneNumber);
};

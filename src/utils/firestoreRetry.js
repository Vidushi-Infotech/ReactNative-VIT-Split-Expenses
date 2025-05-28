/**
 * Utility for retrying Firestore operations with exponential backoff
 */

/**
 * Retry a Firestore operation with exponential backoff
 * @param {Function} operation - The Firestore operation to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} initialDelay - Initial delay in milliseconds
 * @returns {Promise<any>} - Result of the operation
 */
export const retryOperation = async (operation, maxRetries = 3, initialDelay = 1000) => {
  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Attempt the operation
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Log the error
      console.warn(`Firestore operation failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error.message);
      
      // Check if we've reached max retries
      if (attempt === maxRetries) {
        console.error(`Max retries (${maxRetries}) reached. Giving up.`);
        throw error;
      }
      
      // Check if the error is retryable
      if (!isRetryableError(error)) {
        console.error('Non-retryable error. Giving up:', error.message);
        throw error;
      }
      
      // Wait before retrying with exponential backoff
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Exponential backoff with jitter
      delay = Math.min(delay * 2, 30000) * (0.8 + Math.random() * 0.4);
    }
  }
  
  // This should never happen, but just in case
  throw lastError;
};

/**
 * Check if an error is retryable
 * @param {Error} error - The error to check
 * @returns {boolean} - Whether the error is retryable
 */
const isRetryableError = (error) => {
  // Firebase error codes that are retryable
  const retryableCodes = [
    'unavailable', // Server is unavailable
    'resource-exhausted', // Rate limited
    'deadline-exceeded', // Request timeout
    'cancelled', // Request cancelled
    'internal', // Internal server error
    'unknown', // Unknown error
  ];
  
  // Check if it's a Firebase error with a code
  if (error && error.code) {
    // Firebase errors have codes like 'firestore/unavailable'
    const errorCode = error.code.split('/').pop();
    return retryableCodes.includes(errorCode);
  }
  
  // Network errors
  if (error && error.message) {
    const message = error.message.toLowerCase();
    return message.includes('network') || 
           message.includes('timeout') || 
           message.includes('connection') ||
           message.includes('unavailable');
  }
  
  // Default to retryable for unknown errors
  return true;
};

export default retryOperation;

import { Platform } from 'react-native';
import { collection, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { getFirestoreDb, isFirebaseInitialized } from '../config/firebase';
import RNFS from 'react-native-fs';

/**
 * Service for handling image operations with Firebase
 */
class ImageService {
  /**
   * Convert an image URI to base64 string
   * @param {string} imageUri - The URI of the image to convert
   * @returns {Promise<string>} - Base64 string of the image
   */
  static async imageUriToBase64(imageUri) {
    try {
      if (!imageUri) return null;

      // Handle different URI formats for different platforms
      let filePath = imageUri;
      
      // For iOS, convert file:// URLs
      if (Platform.OS === 'ios' && imageUri.startsWith('file://')) {
        filePath = imageUri.replace('file://', '');
      }

      // Read the file as base64
      const base64Data = await RNFS.readFile(filePath, 'base64');
      
      // Determine the image type from the URI
      let imageType = 'image/jpeg'; // Default
      if (imageUri.toLowerCase().endsWith('.png')) {
        imageType = 'image/png';
      } else if (imageUri.toLowerCase().endsWith('.gif')) {
        imageType = 'image/gif';
      }

      // Return the complete base64 string with data URI prefix
      return base64Data;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return null;
    }
  }

  /**
   * Save an image as base64 string to Firestore
   * @param {string} collectionName - The collection to save to (e.g., 'Users', 'Groups')
   * @param {string} documentId - The document ID to save to
   * @param {string} fieldName - The field name to save the image to (e.g., 'avatar', 'groupImage')
   * @param {string} imageUri - The URI of the image to save
   * @returns {Promise<boolean>} - Success status
   */
  static async saveImageToFirestore(collectionName, documentId, fieldName, imageUri) {
    try {
      if (!isFirebaseInitialized()) {
        console.error('Firebase is not initialized. Cannot save image to Firestore.');
        return false;
      }

      if (!collectionName || !documentId || !fieldName || !imageUri) {
        console.error('Missing required parameters for saveImageToFirestore');
        return false;
      }

      // Get Firestore instance
      const db = getFirestoreDb();
      if (!db) {
        console.error('Failed to get Firestore instance');
        return false;
      }

      // Convert image to base64
      const base64Image = await this.imageUriToBase64(imageUri);
      if (!base64Image) {
        console.error('Failed to convert image to base64');
        return false;
      }

      // Get document reference
      const docRef = doc(db, collectionName, documentId);

      // Check if document exists
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        // Update existing document
        await updateDoc(docRef, {
          [fieldName]: base64Image,
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Create new document
        await setDoc(docRef, {
          [fieldName]: base64Image,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      console.log(`Image saved to ${collectionName}/${documentId}/${fieldName}`);
      return true;
    } catch (error) {
      console.error('Error saving image to Firestore:', error);
      return false;
    }
  }

  /**
   * Get an image as base64 string from Firestore
   * @param {string} collectionName - The collection to get from (e.g., 'Users', 'Groups')
   * @param {string} documentId - The document ID to get from
   * @param {string} fieldName - The field name to get the image from (e.g., 'avatar', 'groupImage')
   * @returns {Promise<string>} - Base64 string of the image or null if not found
   */
  static async getImageFromFirestore(collectionName, documentId, fieldName) {
    try {
      if (!isFirebaseInitialized()) {
        console.error('Firebase is not initialized. Cannot get image from Firestore.');
        return null;
      }

      if (!collectionName || !documentId || !fieldName) {
        console.error('Missing required parameters for getImageFromFirestore');
        return null;
      }

      // Get Firestore instance
      const db = getFirestoreDb();
      if (!db) {
        console.error('Failed to get Firestore instance');
        return null;
      }

      // Get document reference
      const docRef = doc(db, collectionName, documentId);

      // Get document
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data[fieldName] || null;
      }

      return null;
    } catch (error) {
      console.error('Error getting image from Firestore:', error);
      return null;
    }
  }

  /**
   * Convert a base64 string to a displayable image URI
   * @param {string} base64String - The base64 string to convert
   * @param {string} imageType - The image type (default: 'image/jpeg')
   * @returns {string} - Data URI for the image
   */
  static base64ToDisplayableUri(base64String, imageType = 'image/jpeg') {
    if (!base64String) return null;
    
    // If the string already has a data URI prefix, return it as is
    if (base64String.startsWith('data:image/')) {
      return base64String;
    }
    
    // Add the data URI prefix
    return `data:${imageType};base64,${base64String}`;
  }
}

export default ImageService;

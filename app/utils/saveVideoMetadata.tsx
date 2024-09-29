import { doc, setDoc, deleteDoc, getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// import { firestore } from '../../firebaseConfig'; // Adjust this import based on your Firebase setup
const firestore = getFirestore();


export async function saveVideoMetadata(downloadURL: string): Promise<void> {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) {
        throw new Error('User not authenticated');
      }
  try {
    const videoId = generateUniqueId(); // You'll need to implement this function
    const videoRef = doc(firestore, `videos/${encodeURIComponent(downloadURL)}`, videoId);
    
    await setDoc(videoRef, {
      url: downloadURL,
      uploadedBy: userId,
      uploadedAt: new Date(),
      // Add any other metadata fields you want to store
    });

    console.log('Video metadata saved successfully');
  } catch (error) {
    console.error('Error saving video metadata:', error);
    throw error; // Re-throw the error so the caller can handle it if needed
  }
}

// Helper function to generate a unique ID (you can use a library like uuid instead)
function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export const deleteVideoMetadata = async (url: string) => {
    try {
        const videoRef = doc(firestore, 'videos', encodeURIComponent(url));
        await deleteDoc(videoRef);
        console.log('Video metadata deleted successfully');
    } catch (error) {
        console.error('Error deleting video metadata:', error);
        throw error;
    }
  };
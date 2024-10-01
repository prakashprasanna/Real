import { storage } from '../firebaseConfig';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { collection, getFirestore, query, where, getDocs } from 'firebase/firestore';

export interface Video {
  id: string;
  name: string;
  downloadURL: string;
}

export interface Destination {
  id: string;
  name: string;
  description: string;
  image: string;
}

export const fetchDestinations = async (page: number, limit: number): Promise<Destination[]> => {
  try {
    const response = await fetch(`https://randomuser.me/api/?results=${limit}&seed=${page}`);
    const data = await response.json();
    
    return data.results.map((user: any, index: number) => ({
      id: `${page}-${index}`,
      name: `${user.name.first} ${user.name.last}`,
      description: `This is ${user.name.first}'s shopping item. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
      image: user.picture.large,
    }));
  } catch (error) {
    console.error('Error fetching destinations:', error);
    throw error;
  }
};

export const fetchVideos = async (userId: string): Promise<Video[]> => {
  try {
    const db = getFirestore();
    const videosRef = collection(db, 'videos');
    const q = query(videosRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    const videosPromises = querySnapshot.docs.map(async (doc: any) => {
      const data = doc.data();
      const storageRef = ref(storage, data.storagePath);
      const downloadURL = await getDownloadURL(storageRef);
      return {
        id: doc.id,
        name: data.name,
        downloadURL: downloadURL,
      };
    });

    const videos = await Promise.all(videosPromises);
    return videos;
  } catch (error) {
    console.error('Error fetching videos:', error);
    throw error;
  }
};
import { storage } from '../firebaseConfig'; // Adjust the import path as needed
import { ref, listAll, getDownloadURL } from 'firebase/storage';

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
  
  export const fetchDestinations = (page: number, limit: number): Promise<Destination[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const destinations = Array.from({ length: limit }, (_, i) => ({
          id: `${page}-${i}`,
          name: `Shopping Item ${page * limit + i + 1}`,
          description: `This item is of good quality ${page * limit + i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
          image: `https://picsum.photos/id/${(page * limit + i) % 100}/300/200`,
        }));
        resolve(destinations);
      }, 1000); // Simulate network delay
    });
  };

  export const fetchVideos = async (): Promise<Video[]> => {
    try {
      const videosRef = ref(storage, 'videos');
      const videosList = await listAll(videosRef);
      
      const videosPromises = videosList.items.map(async (item) => {
        const downloadURL = await getDownloadURL(item);
        return {
          id: item.name,
          name: item.name,
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
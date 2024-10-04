import { storage } from '../firebaseConfig';
import { ref, listAll, getDownloadURL, getStorage } from 'firebase/storage';
import { collection, getFirestore, query, where, getDocs, QueryDocumentSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export interface Video {
  id: string;
  filename: string;
  downloadURL: string;
  uploadedBy: string;
  uploadedAt: string | null;
  authorizedViewers: string[];
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

export const fetchVideos = async (): Promise<Video[]> => {
  console.log('[fetchVideos] Starting to fetch videos');
  const startTime = Date.now();

  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('[fetchVideos] No user logged in');
      return [];
    }
    console.log('[fetchVideos] Current user:', currentUser.uid);

    const db = getFirestore();
    const storage = getStorage();
    console.log('[fetchVideos] Firestore and Storage instances obtained');

    const videosRef = collection(db, 'videos');
    const userVideosQuery = query(videosRef, where('uploadedBy', '==', currentUser.uid));
    console.log('[fetchVideos] User videos query created');

    const querySnapshot = await getDocs(userVideosQuery);
    console.log('[fetchVideos] Query snapshot obtained. Size:', querySnapshot.size);

    if (querySnapshot.empty) {
      console.log('[fetchVideos] No videos found for this user.');
      return [];
    }

    const videos: Video[] = [];
    for (const doc of querySnapshot.docs) {
      console.log('[fetchVideos] Processing document:', doc.id);
      const data = doc.data();
      console.log('[fetchVideos] Document data:', JSON.stringify(data, null, 2));

      if (data.filename) {
        try {
          const storageRef = ref(storage, `videos/${currentUser.uid}/${data.filename}`);
          const downloadURL = await getDownloadURL(storageRef);

          videos.push({
            id: doc.id,
            filename: data.filename,
            downloadURL: downloadURL,
            uploadedBy: currentUser.uid,
            uploadedAt: data.uploadedAt ? data.uploadedAt.toDate().toISOString() : null,
            authorizedViewers: data.authorizedViewers || [],
          });
          console.log('[fetchVideos] Video added:', doc.id);
        } catch (error) {
          console.error(`[fetchVideos] Error getting download URL for ${data.filename}:`, error);
        }
      } else {
        console.warn('[fetchVideos] Skipping document due to missing filename:', doc.id);
      }
    }

    console.log('[fetchVideos] Processed videos count:', videos.length);
    console.log('[fetchVideos] Fetch operation completed in', Date.now() - startTime, 'ms');
    return videos;
  } catch (error) {
    console.error('[fetchVideos] Error fetching videos:', error);
    if (error instanceof Error) {
      console.error('[fetchVideos] Error name:', error.name);
      console.error('[fetchVideos] Error message:', error.message);
      console.error('[fetchVideos] Error stack:', error.stack);
    }
    throw error;
  }
};
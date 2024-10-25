import { storage } from '../firebaseConfig';
import { ref, listAll, getDownloadURL, getStorage, deleteObject } from 'firebase/storage';
import { collection, getFirestore, query, where, getDocs, QueryDocumentSnapshot, deleteDoc, doc, getDoc, limit, startAfter, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export interface Video {
  id: string;
  filename: string;
  downloadURL: string;
  uploadedBy: string;
  uploadedAt: string | null;
  authorizedViewers: string[];
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string;
}

export const fetchUsers = async (page: number, pageSize: number): Promise<User[]> => {
  console.log(`[fetchUsers] Starting to fetch users. Page: ${page}, PageSize: ${pageSize}`);
  const startTime = Date.now();

  // Add validation for page and pageSize
  if (page < 1) {
    console.error('[fetchUsers] Invalid page number:', page);
    return [];
  }
  if (pageSize < 1) {
    console.error('[fetchUsers] Invalid page size:', pageSize);
    return [];
  }

  try {
    const db = getFirestore();
    const usersRef = collection(db, 'users');
    let usersQuery;

    if (page === 1) {
      usersQuery = query(usersRef, orderBy('firstName'), limit(pageSize));
      console.log('[fetchUsers] First page query created');
    } else {
      const lastVisibleUser = await getLastVisibleUser(page - 1, pageSize);
      if (!lastVisibleUser) {
        console.log('[fetchUsers] No more users to fetch');
        return [];
      }
      console.log('[fetchUsers] Last visible user:', lastVisibleUser.id);
      usersQuery = query(usersRef, orderBy('name'), startAfter(lastVisibleUser), limit(pageSize));
      console.log('[fetchUsers] Subsequent page query created');
    }

    const querySnapshot = await getDocs(usersQuery);
    console.log('[fetchUsers] Query snapshot obtained. Size:', querySnapshot.size);

    if (querySnapshot.empty) {
      console.log('[fetchUsers] No users found for this query.');
      return [];
    }

    const users: User[] = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('[fetchUsers] Processing user:', doc.id, data);
      return {
        id: doc.id,
        firstName: data.firstName || 'Unknown',
        lastName: data.lastName || '',
        profileImageUrl: data.profileImageUrl || '',
      };
    });

    console.log('[fetchUsers] Processed users count:', users.length);
    console.log('[fetchUsers] Fetch operation completed in', Date.now() - startTime, 'ms');
    return users;
  } catch (error) {
    console.error('[fetchUsers] Error fetching users:', error);
    if (error instanceof Error) {
      console.error('[fetchUsers] Error name:', error.name);
      console.error('[fetchUsers] Error message:', error.message);
      console.error('[fetchUsers] Error stack:', error.stack);
    }
    throw error;
  }
};

const getLastVisibleUser = async (page: number, pageSize: number): Promise<QueryDocumentSnapshot | null> => {
  const db = getFirestore();
  const usersRef = collection(db, 'users');
  const q = query(usersRef, orderBy('name'), limit(page * pageSize));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return null;
  }
  return querySnapshot.docs[querySnapshot.docs.length - 1];
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

export const deleteVideoAPI = async (videoId: string): Promise<void> => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    const db = getFirestore();
    const storage = getStorage();

    // Delete document from Firestore
    const videoRef = doc(db, 'videos', videoId);
    const videoDoc = await getDoc(videoRef);
    
    if (!videoDoc.exists()) {
      throw new Error('Video not found');
    }

    const videoData = videoDoc.data();
    if (videoData.uploadedBy !== currentUser.uid) {
      throw new Error('Unauthorized to delete this video');
    }

    await deleteDoc(videoRef);

    // Delete file from Storage
    const storageRef = ref(storage, `videos/${currentUser.uid}/${videoData.filename}`);
    await deleteObject(storageRef);

    console.log('Video deleted successfully');
  } catch (error) {
    console.error('Error deleting video:', error);
    throw error;
  }
};
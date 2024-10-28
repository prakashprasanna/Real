import { ref, listAll, getDownloadURL, getStorage, deleteObject } from 'firebase/storage';
import { getFirestore, where, QueryDocumentSnapshot, deleteDoc, orderBy, documentId, arrayRemove } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { auth, firestore } from '../firebaseConfig';
import { 
  collection, 
  doc, 
  updateDoc, 
  arrayUnion, 
  getDoc, 
  getDocs, 
  query, 
  limit, 
  startAfter,
  DocumentSnapshot
} from 'firebase/firestore';
import { debounce } from 'lodash'; // Make sure to install and import lodash

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
  isFollowed?: boolean;
}

export interface FollowData {
  followers: User[];
  following: User[];
}


let hasFetchedUsers = false;
let cachedUsers: User[] = [];

const createQuery = (usersRef: any, onlyFollowing: boolean, following: string[], pageSize: number) => {
  if (onlyFollowing) {
    return query(usersRef, where(documentId(), 'in', following.slice(0, 10)), limit(pageSize));
  }
  return query(usersRef, limit(pageSize));
};

const fetchCurrentUserFollowing = async (currentUser: any): Promise<string[]> => {
  const currentUserDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
  if (!currentUserDoc.exists()) {
    console.error('[fetchCurrentUserFollowing] Current user document does not exist');
    return [];
  }
  console.log('[fetchCurrentUserFollowing] Current user document exists - ', currentUserDoc.data()?.following);
  return currentUserDoc.data()?.following || [];
};

const fetchUsersFromFirestore = async (q: any): Promise<User[]> => {
  const querySnapshot = await getDocs(q);
  console.log(`[fetchUsersFromFirestore] Query snapshot size: ${querySnapshot.size}`);
  
  return querySnapshot.docs.map(doc => {
    const userData = doc.data() as User;
    return {
      id: doc.id,
      firstName: userData.firstName,
      lastName: userData.lastName,
      profileImageUrl: userData.profileImageUrl,
      isFollowed: true, // Assuming this is for following users
    };
  });
};

let userCache: { data: User[], timestamp: number } | null = null;
const CACHE_EXPIRATION = 50000; // 50 seconds

export const fetchUsers = async (
  page: number, 
  pageSize: number, 
  onlyFollowing: boolean = false,
  search: boolean = false
): Promise<User[]> => {
  console.log(`[fetchUsers] Starting. Page: ${page}, PageSize: ${pageSize}, OnlyFollowing: ${onlyFollowing}`);

  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error('[fetchUsers] No authenticated user');
    return [];
  }

  try {
    const usersRef = collection(firestore, 'users');
    let following: string[] = [];

    if (onlyFollowing) {
      following = await fetchCurrentUserFollowing(currentUser);
      if (following.length === 0) {
        console.log('[fetchUsers] User is not following anyone, returning empty array');
        return [];
      }
    }
    console.log('[fetchUsers] Following array:', following, 'onlyFollowing:', onlyFollowing, 'pageSize:', pageSize);
    let q = createQuery(usersRef, onlyFollowing, following, pageSize);

    if (page > 1) {
      const lastVisibleDoc = await getLastVisibleDoc(page - 1, pageSize, onlyFollowing);
      if (lastVisibleDoc) {
        q = query(q, startAfter(lastVisibleDoc));
        console.log('[fetchUsers] Query updated with startAfter');
      } else {
        console.log('[fetchUsers] No last visible document found, returning empty array');
        return [];
      }
    }
    console.log('[fetchUsers] Query:', q);
    const querySnapshot = await getDocs(q);
    console.log(`[fetchUsers] Query snapshot size: ${querySnapshot.size}`);

    const users = querySnapshot.docs.map(doc => {
      const userData = doc.data() as User;
      return {
        id: doc.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
        isFollowed: following.includes(doc.id)
      };
    });

    console.log(`[fetchUsers] Returning ${users.length} users`);
    return users;
  } catch (error) {
    console.error('[fetchUsers] Error fetching users:', error);
    if (error instanceof Error) {
      console.error('[fetchUsers] Error name:', error.name);
      console.error('[fetchUsers] Error message:', error.message);
      console.error('[fetchUsers] Error stack:', error.stack);
    }
    return [];
  }
};

const getLastVisibleDoc = async (page: number, pageSize: number, onlyFollowing: boolean): Promise<DocumentSnapshot | null> => {
  console.log(`[getLastVisibleDoc] Starting. Page: ${page}, PageSize: ${pageSize}, OnlyFollowing: ${onlyFollowing}`);
  
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.log('[getLastVisibleDoc] No authenticated user');
    return null;
  }

  const usersRef = collection(firestore, 'users');
  let q;

  if (onlyFollowing) {
    console.log('[getLastVisibleDoc] Fetching only following users');
    const currentUserDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
    const following = currentUserDoc.data()?.following || [];
    console.log(`[getLastVisibleDoc] Following array:`, following);
    
    if (following.length === 0) {
      console.log('[getLastVisibleDoc] User is not following anyone, returning null');
      return null;
    }

    q = query(usersRef, where(documentId(), 'in', following), limit(page * pageSize));
    console.log('[getLastVisibleDoc] Query created for following users');
  } else {
    q = query(usersRef, limit(page * pageSize));
    console.log('[getLastVisibleDoc] Query created for all users');
  }

  console.log('[getLastVisibleDoc] Executing query');
  const querySnapshot = await getDocs(q);
  console.log(`[getLastVisibleDoc] Query snapshot size: ${querySnapshot.size}`);

  const lastDoc = querySnapshot.docs[(page - 1) * pageSize - 1] || null;
  console.log(`[getLastVisibleDoc] Last document: ${lastDoc ? 'found' : 'not found'}`);
  
  return lastDoc;
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


export const fetchVideosUser = async (userId: string): Promise<Video[]> => {
  console.log(`[fetchVideosUser] Starting to fetch videos for user: ${userId}`);
  const startTime = Date.now();

  try {
    const db = getFirestore();
    const storage = getStorage();
    console.log('[fetchVideosUser] Firestore and Storage instances obtained');

    const videosRef = collection(db, 'videos');
    const userVideosQuery = query(videosRef, where('uploadedBy', '==', userId));
    console.log('[fetchVideosUser] User videos query created');

    const querySnapshot = await getDocs(userVideosQuery);
    console.log('[fetchVideosUser] Query snapshot obtained. Size:', querySnapshot.size);

    if (querySnapshot.empty) {
      console.log('[fetchVideosUser] No videos found for this user.');
      return [];
    }

    const videos: Video[] = [];
    for (const doc of querySnapshot.docs) {
      console.log('[fetchVideosUser] Processing document:', doc.id);
      const data = doc.data();
      console.log('[fetchVideosUser] Document data:', JSON.stringify(data, null, 2));

      if (data.filename) {
        try {
          const storageRef = ref(storage, `videos/${userId}/${data.filename}`);
          const downloadURL = await getDownloadURL(storageRef);

          videos.push({
            id: doc.id,
            filename: data.filename,
            downloadURL: downloadURL,
            uploadedBy: userId,
            uploadedAt: data.uploadedAt ? data.uploadedAt.toDate().toISOString() : null,
            authorizedViewers: data.authorizedViewers || [],
          });
          console.log('[fetchVideosUser] Video added:', doc.id);
        } catch (error) {
          console.error(`[fetchVideosUser] Error getting download URL for ${data.filename}:`, error);
        }
      } else {
        console.warn('[fetchVideosUser] Skipping document due to missing filename:', doc.id);
      }
    }

    console.log('[fetchVideosUser] Processed videos count:', videos.length);
    console.log('[fetchVideosUser] Fetch operation completed in', Date.now() - startTime, 'ms');
    return videos;
  } catch (error) {
    console.error('[fetchVideosUser] Error fetching videos:', error);
    if (error instanceof Error) {
      console.error('[fetchVideosUser] Error name:', error.name);
      console.error('[fetchVideosUser] Error message:', error.message);
      console.error('[fetchVideosUser] Error stack:', error.stack);
    }
    throw error;
  }
};

export const followUser = async (userId: string) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No authenticated user');
  }

  const userRef = doc(firestore, 'users', userId);
  const currentUserRef = doc(firestore, 'users', currentUser.uid);

  try {
    // Add the current user to the followed user's followers list
    await updateDoc(userRef, {
      followers: arrayUnion(currentUser.uid)
    });

    // Add the followed user to the current user's following list
    await updateDoc(currentUserRef, {
      following: arrayUnion(userId)
    });

    // Clear the user cache to ensure fresh data on next fetch
    userCache = null;

    return true;
  } catch (error) {
    console.error('Error following user:', error);
    throw error;
  }
};

export const unfollowUser = async (userId: string) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No authenticated user');
  }

  const userRef = doc(firestore, 'users', userId);
  const currentUserRef = doc(firestore, 'users', currentUser.uid);

  try {
    // Remove the current user from the unfollowed user's followers list
    await updateDoc(userRef, {
      followers: arrayRemove(currentUser.uid)
    });

    // Remove the unfollowed user from the current user's following list
    await updateDoc(currentUserRef, {
      following: arrayRemove(userId)
    });

    // Clear the user cache to ensure fresh data on next fetch
    userCache = null;

    return true;
  } catch (error) {
    console.error('Error unfollowing user:', error);
    throw error;
  }
};

export const checkIfFollowing = async (userId: string): Promise<boolean> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No authenticated user');
  }

  const currentUserDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
  const following = currentUserDoc.data()?.following || [];

  return following.includes(userId);
};

export const fetchFollowData = async (): Promise<FollowData> => {
  if (!auth.currentUser) {
    throw new Error('No authenticated user');
  }

  try {
    // Get current user document
    const currentUserDoc = await getDoc(doc(firestore, 'users', auth.currentUser.uid));
    if (!currentUserDoc.exists()) {
      throw new Error('Current user document not found');
    }

    const userData = currentUserDoc.data();
    const followingIds = userData.following || [];
    const followerIds = userData.followers || [];

    console.log('Found following IDs:', followingIds);
    console.log('Found follower IDs:', followerIds);

    // Fetch user details for followers
    const followersUsers = followerIds.length > 0 ? await fetchUsersByIds(followerIds) : [];
    console.log('Fetched followers:', followersUsers);
    
    // Fetch user details for following
    const followingUsers = followingIds.length > 0 ? await fetchUsersByIds(followingIds) : [];
    console.log('Fetched following:', followingUsers);

    return {
      followers: followersUsers,
      following: followingUsers
    };
  } catch (error) {
    console.error('Error fetching follow data:', error);
    throw error;
  }
};

const fetchUsersByIds = async (userIds: string[]): Promise<User[]> => {
  try {
    // Fetch users in batches of 10 (Firestore limitation for 'in' queries)
    const users: User[] = [];
    for (let i = 0; i < userIds.length; i += 10) {
      const batch = userIds.slice(i, i + 10);
      const usersQuery = query(
        collection(firestore, 'users'),
        where(documentId(), 'in', batch)
      );
      const usersSnapshot = await getDocs(usersQuery);
      const batchUsers = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        firstName: doc.data().firstName,
        lastName: doc.data().lastName,
        profileImageUrl: doc.data().profileImageUrl,
        isFollowed: true
      }));
      users.push(...batchUsers);
    }
    return users;
  } catch (error) {
    console.error('Error fetching users by IDs:', error);
    return [];
  }
};
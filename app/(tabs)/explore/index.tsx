import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocation } from '../../../hooks/useLocation';
import StackHeader from '@/app/components/StackHeader';
import { VideoList } from '../../components/VideoComponents/VideoList'; 
import { useRouter } from 'expo-router';
import { fetchVideos, Video, deleteVideoAPI } from '../../../api/destinationsApi';
import { useDispatch, useSelector } from 'react-redux';
import { setVideos, deleteVideo, setCurrentIndex } from '../../../Redux/videosSlice';
import { RootState } from '../../../Redux/store';
import { auth } from '@/firebaseConfig';
import UsersContainer from '../../components/UsersContainer';

export default function Explore() {
  const { location, errorMsg } = useLocation();
  const router = useRouter();
  const dispatch = useDispatch();
  const userId = auth.currentUser?.uid;
  const videos = useSelector((state: RootState) => state.videos.videos);

  useEffect(() => {
    if (userId) {
      loadVideos();
    }
  }, [userId]);

  const loadVideos = async () => {
    if (!userId) return;
    try {
      const fetchedVideos = await fetchVideos();
      if (fetchedVideos) {
        dispatch(setVideos(fetchedVideos));
        console.log('Videos loaded:', fetchedVideos);
      }
    } catch (error) {
      console.error('Failed to load videos:', error);
    }
  };

  const handleRefresh = async () => {
    console.log("Starting video refresh...");
    if (!userId) return;
    try {
      const refreshedVideos = await fetchVideos();
      if (refreshedVideos) {
        dispatch(setVideos(refreshedVideos));
        console.log('Videos refreshed:', refreshedVideos);
      }
    } catch (error) {
      console.error('Failed to refresh videos:', error);
    }
  };

  const handleVideoPress = (video: Video) => {
    console.log("handleVideoPress called in Explore with video:", video.id);
    const index = videos.findIndex(v => v.id === video.id);
    console.log("Video index:", index);
    dispatch(setCurrentIndex(index));
    
    const params = {
      isLoggedInUser: 'true',
      initialIndex: index.toString(),
    };
    console.log("Navigating to SwipeableVideoFeedScreen with params:", params);
    
    try {
      router.push({
        pathname: '/(tabs)/explore/SwipeableVideoFeedScreen',
        params: params,
      });
      console.log("Navigation completed");
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    try {
      await deleteVideoAPI(videoId);
      dispatch(deleteVideo(videoId));
      console.log('Video deleted:', videoId);
    } catch (error) {
      console.error('Failed to delete video:', error);
    }
  };

  return (
    <>
      <StackHeader detail={'Explore'} />
      <View style={styles.container}>
        <UsersContainer />
        <VideoList 
          videos={videos} 
          onVideoPress={handleVideoPress}  
          onRefresh={handleRefresh}
          onDeleteVideo={handleDeleteVideo}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
    backgroundColor: '#f0f0f0',
  },
});
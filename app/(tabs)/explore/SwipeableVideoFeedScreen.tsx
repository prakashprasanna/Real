import React, { useEffect } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { SwipeableVideoFeed } from '../../components/VideoComponents/SwipeableVideoFeed';
import { useLocalSearchParams } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/Redux/store';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function SwipeableVideoFeedScreen() {
  console.log("SwipeableVideoFeedScreen component rendered");

  const { isLoggedInUser, initialIndex } = useLocalSearchParams<{ isLoggedInUser: string, initialIndex: string }>();
  
  const { videos, userVideos, currentIndex } = useSelector((state: RootState) => state.videos);
  
  const videosToUse = isLoggedInUser === 'true' ? videos : userVideos;
  const videoUrls = videosToUse.map(video => video.downloadURL);

  useEffect(() => {
    console.log("SwipeableVideoFeedScreen mounted");
    console.log("IS LOGGED IN USER:", isLoggedInUser);
    console.log("INITIAL INDEX:", initialIndex);
    console.log("VIDEOS:", videos.length);
    console.log("USER VIDEOS:", userVideos.length);
    console.log("VIDEOS TO USE:", videosToUse.length);
    console.log("VIDEO URLS:", videoUrls.length);
  }, [isLoggedInUser, initialIndex, videos, userVideos]);

  return (
    <View style={styles.container}>
      {videoUrls.length > 0 ? (
        <View style={styles.feedContainer}>
          <SwipeableVideoFeed 
            videos={videoUrls} 
            initialIndex={Math.min(parseInt(initialIndex) || 0, videoUrls.length - 1)} 
          />
        </View>
      ) : (
        <Text style={styles.noVideosText}>No videos available</Text>
      )}
    </View>
  );
}

// ... (styles remain the same)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedContainer: {
    width: screenWidth,
    height: screenHeight,
  },
  noVideosText: {
    color: 'white',
    fontSize: 18,
  },
});
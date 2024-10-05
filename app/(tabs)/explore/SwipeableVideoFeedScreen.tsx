import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SwipeableVideoFeed } from '../../components/VideoComponents/SwipeableVideoFeed';
import { useLocalSearchParams } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/Redux/store';
import { useDispatch } from 'react-redux';


export default function SwipeableVideoFeedScreen() {
  const { videos, initialIndex } = useLocalSearchParams<{ videos: string, initialIndex: string }>();
  console.log("SwipeableVideoFeedScreen params VIDEOS:", videos);
  console.log("SwipeableVideoFeedScreen params INITIAL INDEX:", initialIndex);

  const { videos: storeVideos, currentIndex } = useSelector((state: RootState) => state.videos);
  console.log("SwipeableVideoFeedScreen STORE VIDEOS:", storeVideos.length);
  console.log("SwipeableVideoFeedScreen CURRENT INDEX:", currentIndex);

  const videoUrls = storeVideos.map(video => video.downloadURL);

  const dispatch = useDispatch();

  // const handleReorder = (index: number) => {
  //   dispatch(reorderVideos(index));
  // };


  return (
    <View style={styles.container}>
      {videoUrls.length > 0 ? (
        <SwipeableVideoFeed 
          videos={videoUrls} 
          initialIndex={Math.min(currentIndex, videoUrls.length - 1)} 
          // onReorder={handleReorder}
        />
      ) : (
        <Text style={styles.noVideosText}>No videos available</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noVideosText: {
    color: 'white',
    fontSize: 18,
  },
});
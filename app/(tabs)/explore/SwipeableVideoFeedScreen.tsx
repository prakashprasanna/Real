import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SwipeableVideoFeed } from '../../components/VideoComponents/SwipeableVideoFeed';
import { RouteProp } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import { Video } from '../../../api/destinationsApi';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../Redux/store';
import { setCurrentIndex } from '../../../Redux/videosSlice';

type SwipeableVideoFeedParams = {
  videos: Video[];
  initialIndex: number;
};

type SwipeableVideoFeedScreenProps = {
  route: RouteProp<Record<string, SwipeableVideoFeedParams>, string>;
};

export default function SwipeableVideoFeedScreen({ route }: SwipeableVideoFeedScreenProps) {
  const { videos, initialIndex } = useLocalSearchParams();
  console.log("SwipeableVideoFeedScreen VIDEOS ", videos.length)
  const dispatch = useDispatch();
  const { allVideos, currentIndex } = useSelector((state: RootState) => state.videos);
  console.log("SwipeableVideoFeedScreen ALL VIDEOS ", allVideos)
  return (
<View style={styles.container}>
  {allVideos.length > 0 ? (
    <SwipeableVideoFeed 
      videos={allVideos.map(video => video.downloadURL)} 
      initialIndex={Math.min(Number(currentIndex) || 0, allVideos.length - 1)} 
    />
  ) : (
    <Text>No videos available</Text>
    )}
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:'black'
  },
});
import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { VideoPreview } from './VideoPreview';
import { Video } from '../../../api/destinationsApi';

interface VideoListProps {
  videos: Video[];
  onVideoPress: (video: Video) => void;
  onRefresh: () => Promise<void>;
}

export const VideoList: React.FC<VideoListProps> = ({ videos, onVideoPress, onRefresh }) => {
  const [refreshing, setRefreshing] = useState(false);
  console.log("VIDEOLIST VIDEOS ", videos)

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };
  return (
    <FlatList
      data={videos}
      renderItem={({ item }) => (
        <VideoPreview
          uri={item.downloadURL}
          onPress={() => onVideoPress(item)}
          allVideos={videos}
        />
      )}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#6bb2be']} // You can customize the color
          tintColor="#6bb2be" // For iOS
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 5,
    
  },
});
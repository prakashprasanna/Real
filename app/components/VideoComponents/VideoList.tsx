import React, { useState, useEffect } from 'react';
import { FlatList, RefreshControl, StyleSheet, View, ScrollView, Text } from 'react-native';
import { VideoPreview } from './VideoPreview';
import { Video } from '../../../api/destinationsApi';

interface VideoListProps {
  videos: Video[];
  onVideoPress: (video: Video) => void;
  onRefresh: () => Promise<void>;
}

export const VideoList: React.FC<VideoListProps> = ({ videos, onVideoPress, onRefresh }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());

  useEffect(() => {
    console.log("VideoList received new videos:", videos.length);
    videos.forEach((video, index) => {
      console.log(`Video ${index + 1}:`, video.id, video.downloadURL);
    });
  }, [videos]);

  const handleRefresh = async () => {
    console.log("Starting refresh...");
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
    setLastRefreshTime(new Date());
    console.log("Refresh completed");
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollViewContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#6bb2be']}
          tintColor="#6bb2be"
        />
      }
    >
      <Text style={styles.debugInfo}>
        Videos: {videos.length} | Last Refreshed: {lastRefreshTime.toLocaleTimeString()}
      </Text>
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
        contentContainerStyle={styles.flatListContent}
        scrollEnabled={false}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
  },
  flatListContent: {
    padding: 5,
  },
  debugInfo: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    fontSize: 12,
  },
});
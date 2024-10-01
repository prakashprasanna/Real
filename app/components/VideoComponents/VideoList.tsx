import React, { useState, useEffect, useCallback } from 'react';
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
  const [orderedVideos, setOrderedVideos] = useState<Video[]>(videos);

  useEffect(() => {
    setOrderedVideos(videos);
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

  const handleVideoPress = useCallback((video: Video) => {
    // Reorder videos to put the clicked one first
    const newOrderedVideos = [
      video,
      ...orderedVideos.filter(v => v.id !== video.id)
    ];
    setOrderedVideos(newOrderedVideos);
    onVideoPress(video);
  }, [orderedVideos, onVideoPress]);

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
      {videos.length === 0 ? (
        <Text style={styles.emptyMessage}>No videos available. Pull down to refresh.</Text>
      ) : (
        <FlatList
          data={videos}
          renderItem={({ item, index }) => (
            <VideoPreview
              uri={item.downloadURL}
              index={index}
            />
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.flatListContent}
          scrollEnabled={false}
        />
      )}
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
  emptyMessage: {
    padding: 20,
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
});
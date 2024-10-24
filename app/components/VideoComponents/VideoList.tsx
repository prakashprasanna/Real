import React, { useState, useEffect, useCallback } from 'react';
import { RefreshControl, StyleSheet, View, Text, TouchableOpacity, Alert, ListRenderItem } from 'react-native';
import { VideoPreview } from './VideoPreview';
import { Video } from '../../../api/destinationsApi';
import { MaterialIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';

interface VideoListProps {
  videos: Video[];
  onVideoPress: (video: Video) => void;
  onRefresh: () => Promise<void>;
  onDeleteVideo: (videoId: string) => Promise<void>;
}

export const VideoList: React.FC<VideoListProps> = ({ videos, onVideoPress, onRefresh, onDeleteVideo }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);

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

  const toggleVideoSelection = (videoId: string) => {
    setSelectedVideos(prev => 
      prev.includes(videoId) 
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  const handleLongPress = (videoId: string) => {
    console.log('Long press detected on video:', videoId);
    toggleVideoSelection(videoId);
  };

  const handleDeleteSelected = () => {
    Alert.alert(
      "Delete Videos",
      `Are you sure you want to delete ${selectedVideos.length} selected video(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            for (const videoId of selectedVideos) {
              await onDeleteVideo(videoId);
            }
            setSelectedVideos([]);
            await onRefresh();
          }
        }
      ]
    );
  };

  const renderItem: ListRenderItem<Video> = useCallback(({ item, index }) => (
    <VideoPreview
      uri={item.downloadURL}
      index={index}
      isSelected={selectedVideos.includes(item.id)}
      onLongPress={() => handleLongPress(item.id)}
      onPress={() => selectedVideos.length > 0 ? toggleVideoSelection(item.id) : onVideoPress(item)}
    />
  ), [selectedVideos, onVideoPress]);

  return (
    <View style={styles.container}>
      <Text style={styles.debugInfo}>
        Videos: {videos.length} | Last Refreshed: {lastRefreshTime.toLocaleTimeString()}
      </Text>
      {selectedVideos.length > 0 && (
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteSelected}>
          <MaterialIcons name="delete" size={24} color="white" />
          <Text style={styles.deleteButtonText}>Delete Selected ({selectedVideos.length})</Text>
        </TouchableOpacity>
      )}
      {videos.length === 0 ? (
        <Text style={styles.emptyMessage}>No videos available. Pull down to refresh.</Text>
      ) : (
        <FlashList
          data={videos}
          renderItem={renderItem}
          estimatedItemSize={200}
          numColumns={2}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#6bb2be']}
              tintColor="#6bb2be"
            />
          }
          contentContainerStyle={styles.flashListContent} 
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flashListContent: {
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4444',
    padding: 10,
    margin: 10,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: 'white',
    marginLeft: 10,
    fontSize: 16,
  },
});
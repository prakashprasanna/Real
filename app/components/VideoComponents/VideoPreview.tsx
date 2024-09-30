import React, { useRef, useEffect, useState } from 'react';
import { TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../Redux/store';
import { setCurrentIndex, reorderVideos } from '../../../Redux/videosSlice';

interface VideoPreviewProps {
  uri: string;
  index: number;
}

const { width } = Dimensions.get('window');

export const VideoPreview: React.FC<VideoPreviewProps> = ({ uri, index }) => {
  const videoRef = useRef<Video>(null);
  const router = useRouter();
  const dispatch = useDispatch();
  const { allVideos } = useSelector((state: RootState) => state.videos);

  useEffect(() => {
    const playVideo = async () => {
      if (videoRef.current) {
        await videoRef.current.playAsync();
        setTimeout(() => {
          videoRef.current?.stopAsync();
        }, 5000);
      }
    };
    playVideo();
  }, []);

  const handlePress = () => {
    console.log('Video clicked:', index);
    console.log('Current allVideos:', allVideos);

    // Reorder videos to put the clicked one first
    dispatch(reorderVideos(index));
    
    // Set the current index to 0 (the first video, which is now the clicked one)
    dispatch(setCurrentIndex(0));

    // Get the updated allVideos after reordering
    const updatedAllVideos = [
      allVideos[index],
      ...allVideos.slice(0, index),
      ...allVideos.slice(index + 1)
    ];

    console.log('Reordered videos:', updatedAllVideos);

    // Navigate to the SwipeableVideoFeedScreen
    router.push({
      pathname: '/(tabs)/explore/SwipeableVideoFeedScreen',
      params: {
        videos: updatedAllVideos.map(video => video.downloadURL),
        initialIndex: 0,
      },
    });
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      <Video
        ref={videoRef}
        source={{ uri }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        isLooping={true}
        shouldPlay={true}
        isMuted={true}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width / 2 - 15,
    height: (width / 2 - 15) * (29 / 16),
    margin: 5,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#6bb2be',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});
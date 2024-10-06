import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Dimensions, View } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/Redux/store';
import { setCurrentIndex } from '@/Redux/videosSlice';
import { MaterialIcons } from '@expo/vector-icons';

interface VideoPreviewProps {
  uri: string;
  index: number;
  isSelected?: boolean;
  onLongPress?: () => void;
  onPress: () => void;

}

const { width } = Dimensions.get('window');

export const VideoPreview: React.FC<VideoPreviewProps> = ({ uri, index, isSelected, onLongPress, onPress }) => {
  const videoRef = useRef<Video>(null);
  const router = useRouter();
  const dispatch = useDispatch();
  const videos = useSelector((state: RootState) => state.videos.videos);

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
    console.log('Video clicked:', index, isSelected);
    if (isSelected) {
      // If in selection mode, don't navigate
      return;
    }

    console.log('Video clicked:', index);
    console.log('Current videos:', videos);

    dispatch(setCurrentIndex(index));

    const reorderedVideos = [
      videos[index],
      ...videos.slice(0, index),
      ...videos.slice(index + 1)
    ];

    console.log('Reordered videos:', reorderedVideos);

    router.push({
      pathname: '/(tabs)/explore/SwipeableVideoFeedScreen',
      params: {
        videos: reorderedVideos.map(video => video.downloadURL),
        initialIndex: 0,
      },
    });
  };


  return (
    <TouchableOpacity 
      onPress={handlePress} 
      onLongPress={onLongPress}
      style={[styles.container, isSelected && styles.selectedContainer]}
    >
      <Video
        ref={videoRef}
        source={{ uri }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        isLooping={true}
        shouldPlay={true}
        isMuted={true}
      />
      {isSelected && (
        <View style={styles.selectedOverlay}>
          <MaterialIcons name="check-circle" size={40} color="#6bb2be" />
        </View>
      )}
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
  selectedContainer: {
    borderColor: '#6bb2be',
    borderWidth: 3,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VideoPreview;
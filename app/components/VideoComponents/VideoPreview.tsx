import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Dimensions, View } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
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
  console.log("VideoPreview component rendered");
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    const playVideo = async () => {
      if (videoRef.current) {
        await videoRef.current.playAsync();
      }
    };
    playVideo();

    return () => {
      if (videoRef.current) {
        videoRef.current.stopAsync();
      }
    };
  }, []);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded && status.positionMillis >= 5000) {
      videoRef.current?.setPositionAsync(0);
    }
  };

  return (
    <TouchableOpacity 
      onPress={onPress} 
      onLongPress={onLongPress}
      style={[styles.container, isSelected && styles.selectedContainer]}
    >
      <Video
        ref={videoRef}
        source={{ uri }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        isLooping={false}
        shouldPlay={true}
        isMuted={true}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
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
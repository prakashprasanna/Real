import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useIsFocused } from '@react-navigation/native';

interface FullVideoScreenProps {
  uri: string;
  screen: 'Swipe' | null;
  isActive?: boolean;
}

export default function FullVideoScreen({ uri, screen, isActive = true }: FullVideoScreenProps) {
  const videoRef = useRef<Video>(null);
  const isFocused = useIsFocused();
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup function to stop and unload video when component unmounts
      if (videoRef.current) {
        videoRef.current.stopAsync();
        videoRef.current.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive && isFocused) {
        videoRef.current.playAsync();
      } else {
        videoRef.current.pauseAsync();
      }
    }
  }, [isActive, isFocused]);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    setStatus(status);
  };

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={{ uri }}
        style={styles.video}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        isLooping
        shouldPlay={isActive && isFocused}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        onError={(error) => console.error('Video Error:', error)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  video: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});
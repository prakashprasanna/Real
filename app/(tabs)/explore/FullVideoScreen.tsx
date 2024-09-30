import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity } from 'react-native';
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
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

  const handleVideoError = (error: string) => {
    console.error('Video Error:', error);
    setError('Failed to play video. Please try again later.');
  };

  const retryPlayback = () => {
    setError(null);
    if (videoRef.current) {
      videoRef.current.loadAsync({ uri }, {}, false);
    }
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={retryPlayback}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        onError={(error: any) => handleVideoError(error && typeof error === 'object' && 'message' in error ? error.message : String(error))}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6bb2be',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
  },
});
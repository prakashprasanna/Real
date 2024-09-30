import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface FullVideoScreenProps {
  uri: string;
  screen: 'Swipe' | null;
  isActive?: boolean;
  style?: ViewStyle;
  onSwipe: () => void;
}

export default function FullVideoScreen({ uri, screen, isActive = true, style, onSwipe }: FullVideoScreenProps) {
  const videoRef = useRef<Video>(null);
  const isFocused = useIsFocused();
  const navigation = useNavigation();
  const router = useRouter();
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: { display: 'none' },
    });

    return () => {
      if (videoRef.current) {
        videoRef.current.stopAsync();
        videoRef.current.unloadAsync();
      }
      navigation.setOptions({
        tabBarStyle: { display: 'flex', backgroundColor: '#6bb2be' },
      });
    };
  }, [navigation]);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive && isFocused) {
        videoRef.current.playAsync();
        videoRef.current.setIsMutedAsync(isMuted);
      } else {
        videoRef.current.pauseAsync();
        videoRef.current.setIsMutedAsync(true);
      }
    }
  }, [isActive, isFocused, isMuted]);

  useEffect(() => {
    // This effect will run when a swipe occurs
    if (!isActive) {
      setIsMuted(true);
      if (videoRef.current) {
        videoRef.current.setIsMutedAsync(true);
      }
    }
  }, [isActive]);

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

  const handleBackPress = () => {
    router.back();
  };

  const toggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    if (videoRef.current) {
      videoRef.current.setIsMutedAsync(newMuteState);
    }
    onSwipe();  // Notify parent component about the mute change
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
    <View style={[styles.container, style]}>
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.muteButton} onPress={toggleMute}>
        <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={24} color="white" />
      </TouchableOpacity>
      <Video
        ref={videoRef}
        source={{ uri }}
        style={styles.video}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        isLooping
        shouldPlay={isActive && isFocused}
        isMuted={isMuted || !isActive || !isFocused}
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
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
  muteButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
});
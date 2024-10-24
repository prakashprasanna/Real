import React, { forwardRef, useImperativeHandle, useEffect, useCallback, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, ViewStyle } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface FullVideoScreenProps {
  uri: string;
  screen: 'Swipe' | null;
  isActive: boolean;
  style?: ViewStyle;
  onSwipe: () => void;
  index: number;
  activeIndex: number;
  globalMute: boolean;
  onMuteChange: (isMuted: boolean) => void;
}

const FullVideoScreen = forwardRef<Video, FullVideoScreenProps>(({ 
  uri, 
  screen, 
  isActive, 
  style, 
  onSwipe, 
  index, 
  activeIndex, 
  globalMute,
  onMuteChange
}, ref) => {
  const videoRef = useRef<Video>(null);
  const isFocused = useIsFocused();
  const navigation = useNavigation();
  const router = useRouter();
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [localMute, setLocalMute] = useState(globalMute);

  useImperativeHandle(ref, () => ({
    playAsync: () => videoRef.current?.playAsync(),
    pauseAsync: () => videoRef.current?.pauseAsync(),
    setIsMutedAsync: (muted: boolean) => videoRef.current?.setIsMutedAsync(muted),
  }));

  useEffect(() => {
    setLocalMute(globalMute);
  }, [globalMute]);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive && isFocused && index === activeIndex) {
        videoRef.current.playAsync();
      } else {
        videoRef.current.pauseAsync();
      }
      videoRef.current.setIsMutedAsync(localMute);
    }
  }, [isActive, isFocused, index, activeIndex, localMute]);

  const handleVideoState = useCallback(async () => {
    if (videoRef.current) {
      if (isActive && isFocused && index === activeIndex) {
        await videoRef.current.playAsync();
      } else {
        await videoRef.current.pauseAsync();
      }
      await videoRef.current.setIsMutedAsync(localMute);
    }
  }, [isActive, isFocused, index, activeIndex, localMute]);

  useEffect(() => {
    handleVideoState();
  }, [handleVideoState]);

  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: { display: 'none' },
    });

    return () => {
      navigation.setOptions({
        tabBarStyle: { display: 'flex', backgroundColor: '#6bb2be' },
      });
    };
  }, [navigation]);

  const handleBackPress = () => {
    router.back();
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    setStatus(status);
  };

  const handleToggleMute = useCallback(() => {
    const newMuteState = !localMute;
    setLocalMute(newMuteState);
    onMuteChange(newMuteState);
    if (videoRef.current) {
      videoRef.current.setIsMutedAsync(newMuteState);
    }
  }, [localMute, onMuteChange]);

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.muteButton} onPress={handleToggleMute}>
        <Ionicons name={localMute ? "volume-mute" : "volume-high"} size={24} color="white" />
      </TouchableOpacity>
      <Video
        ref={videoRef}
        source={{ uri }}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        isLooping
        shouldPlay={isActive && isFocused && index === activeIndex}
        isMuted={localMute}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
      />
    </View>
  );
});
  

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

export default FullVideoScreen;
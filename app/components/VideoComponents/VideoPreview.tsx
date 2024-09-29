import React, { useRef, useEffect, useState } from 'react';
import { TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Video as VideoType } from '../../../api/destinationsApi';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../Redux/store';
import { setCurrentIndex } from '../../../Redux/videosSlice';

interface VideoPreviewProps {
  uri: string;
}

const { width } = Dimensions.get('window');

export const VideoPreview: React.FC<VideoPreviewProps> = ({ uri }) => {
  const videoRef = useRef<Video>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const dispatch = useDispatch();
  const { allVideos, currentIndex } = useSelector((state: RootState) => state.videos);
  console.log("VIDEO PREVIEW ALL VIDEOS ", allVideos)


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
    router.push({
      pathname: '/(tabs)/explore/SwipeableVideoFeedScreen',
      params: {
        videos: allVideos.map(video => video.downloadURL),
        initialIndex: currentIndex,
      },
    });
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      <Video
        ref={videoRef}
        source={{ uri }}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        isLooping={false}
        shouldPlay={false}
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
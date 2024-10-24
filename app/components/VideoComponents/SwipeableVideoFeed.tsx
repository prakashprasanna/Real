import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ViewToken, Dimensions, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Video } from 'expo-av';
import FullVideoScreen from '../../(tabs)/explore/FullVideoScreen';

interface SwipeableVideoFeedProps {
  videos: string[];
  initialIndex: number;
}

export const SwipeableVideoFeed: React.FC<SwipeableVideoFeedProps> = ({ videos, initialIndex }) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const flashListRef = useRef<FlashList<string>>(null);
  const videoRefs = useRef<{ [key: number]: Video | null }>({});
  const [globalMute, setGlobalMute] = useState(true);
  const { height: screenHeight } = Dimensions.get('window');

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 300,
  });

  const onViewableItemsChanged = useCallback(({ changed }: { changed: ViewToken[] }) => {
    changed.forEach((change) => {
      const index = change.index;
      if (index !== null && change.isViewable) {
        setActiveIndex(index);
        playVideo(index);
      } else if (index !== null && !change.isViewable) {
        pauseVideo(index);
      }
    });
  }, []);

  const playVideo = useCallback(async (index: number) => {
    const video = videoRefs.current[index];
    if (video) {
      await video.playAsync();
    }
  }, []);

  const pauseVideo = useCallback(async (index: number) => {
    const video = videoRefs.current[index];
    if (video) {
      await video.pauseAsync();
    }
  }, []);

  const handleMuteChange = useCallback((isMuted: boolean) => {
    setGlobalMute(isMuted);
  }, []);

  useEffect(() => {
    flashListRef.current?.scrollToIndex({ index: initialIndex, animated: false });
    playVideo(initialIndex);
  }, [initialIndex, playVideo]);

  const renderItem = useCallback(({ item, index }: { item: string; index: number }) => (
    <View style={styles.itemContainer}>
      <FullVideoScreen
        uri={item}
        screen='Swipe'
        isActive={index === activeIndex}
        onSwipe={() => {}}
        style={styles.video}
        index={index}
        activeIndex={activeIndex}
        globalMute={globalMute}
        onMuteChange={handleMuteChange}
        ref={(ref) => {
          if (ref) {
            videoRefs.current[index] = ref;
          }
        }}
      />
    </View>
  ), [activeIndex, globalMute, handleMuteChange]);

  return (
    <View style={styles.container}>
      <FlashList
        ref={flashListRef}
        data={videos}
        renderItem={renderItem}
        estimatedItemSize={screenHeight}
        keyExtractor={(item, index) => index.toString()}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        viewabilityConfig={viewabilityConfig.current}
        onViewableItemsChanged={onViewableItemsChanged}
        initialScrollIndex={initialIndex}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  itemContainer: {
    height: Dimensions.get('window').height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
import React, { useRef, useEffect } from 'react';
import { FlatList, ViewToken, Text, Dimensions } from 'react-native';
import FullVideoScreen from '../../(tabs)/explore/FullVideoScreen';

interface SwipeableVideoFeedProps {
  videos: string[];
  initialIndex: number;
}

export const SwipeableVideoFeed: React.FC<SwipeableVideoFeedProps> = ({ videos, initialIndex }) => {
  console.log("SwipeableVideoFeed VIDEOS ", videos);

  if (!Array.isArray(videos) || videos.length === 0) {
    console.log("Videos array is empty or not an array");
    return <Text>No videos available</Text>;
  }

  const flatListRef = useRef<FlatList>(null);
  const screenHeight = Dimensions.get('window').height;

  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };
  const onViewableItemsChanged = useRef(({ changed }: { changed: ViewToken[] }) => {
    // You can add logic here if needed when the visible item changes
  });

  useEffect(() => {
    // Scroll to the initial index when the component mounts
    flatListRef.current?.scrollToIndex({ index: initialIndex, animated: false });
  }, [initialIndex]);

  return (
    <FlatList
      ref={flatListRef}
      data={videos}
      renderItem={({ item }) => (
        <FullVideoScreen 
          uri={item} 
          screen='Swipe' 
          style={{ height: screenHeight }}
        />
      )}
      keyExtractor={(item, index) => index.toString()}
      pagingEnabled
      horizontal={false}
      showsVerticalScrollIndicator={false}
      viewabilityConfig={viewabilityConfig}
      onViewableItemsChanged={onViewableItemsChanged.current}
      getItemLayout={(data, index) => ({
        length: screenHeight,
        offset: screenHeight * index,
        index,
      })}
      snapToInterval={screenHeight}
      snapToAlignment="start"
      decelerationRate="fast"
    />
  );
};
import React, { useRef, useEffect, useState } from 'react';
import { FlatList, ViewToken, Dimensions } from 'react-native';
import FullVideoScreen from '../../(tabs)/explore/FullVideoScreen';

interface SwipeableVideoFeedProps {
  videos: string[];
  initialIndex: number;
  //onReorder: (index: number) => void;
}

export const SwipeableVideoFeed: React.FC<SwipeableVideoFeedProps> = ({ videos, initialIndex }) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);
  const screenHeight = Dimensions.get('window').height;

  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };
  const onViewableItemsChanged = useRef(({ changed }: { changed: ViewToken[] }) => {
    if (changed && changed.length > 0) {
      setActiveIndex(changed[0].index || 0);
    }
  });

  const handleSwipe = () => {
    setActiveIndex(prev => prev);  // Trigger a re-render
  };

  useEffect(() => {
    flatListRef.current?.scrollToIndex({ index: initialIndex, animated: false });
  }, [initialIndex]);

  return (
    <FlatList
      ref={flatListRef}
      data={videos}
      renderItem={({ item, index }) => (
        <FullVideoScreen 
          uri={item} 
          screen='Swipe' 
          isActive={index === activeIndex}
          onSwipe={handleSwipe}
          //onReorder={onReorder}
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
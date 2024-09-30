import React, { useRef, useEffect, useState } from 'react';
import { FlatList, ViewToken } from 'react-native';
import FullVideoScreen from '../../(tabs)/explore/FullVideoScreen';

interface SwipeableVideoFeedProps {
  videos: string[];
  initialIndex: number;
}

export const SwipeableVideoFeed: React.FC<SwipeableVideoFeedProps> = ({ videos, initialIndex }) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);

  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };
  const onViewableItemsChanged = useRef(({ changed }: { changed: ViewToken[] }) => {
    if (changed && changed.length > 0) {
      setActiveIndex(changed[0].index || 0);
    }
  });

  const handleSwipe = () => {
    // This function will be called when a swipe occurs or when mute is toggled
    setActiveIndex(prev => prev);  // This will trigger a re-render
  };

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
          style={{ height: '100%' }}
        />
      )}
      keyExtractor={(item, index) => index.toString()}
      pagingEnabled
      horizontal={false}
      showsVerticalScrollIndicator={false}
      viewabilityConfig={viewabilityConfig}
      onViewableItemsChanged={onViewableItemsChanged.current}
    />
  );
};
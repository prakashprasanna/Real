import React, { useRef, useEffect, useState } from 'react';
import { ViewToken, Dimensions, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import FullVideoScreen from '../../(tabs)/explore/FullVideoScreen';

interface SwipeableVideoFeedProps {
  videos: string[];
  initialIndex: number;
}

export const SwipeableVideoFeed: React.FC<SwipeableVideoFeedProps> = ({ videos, initialIndex }) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const flashListRef = useRef<FlashList<string>>(null);
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
    flashListRef.current?.scrollToIndex({ index: initialIndex, animated: false });
  }, [initialIndex]);

  const renderItem = ({ item, index }: { item: string; index: number }) => (
    <View style={styles.itemContainer}>
      <FullVideoScreen 
        uri={item} 
        screen='Swipe' 
        isActive={index === activeIndex}
        onSwipe={handleSwipe}
        style={styles.video}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlashList
        ref={flashListRef}
        data={videos}
        renderItem={renderItem}
        estimatedItemSize={screenHeight}
        keyExtractor={(item, index) => index.toString()}
        pagingEnabled
        horizontal={false}
        showsVerticalScrollIndicator={false}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged.current}
        snapToInterval={screenHeight}
        snapToAlignment="start"
        decelerationRate="fast"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    height: Dimensions.get('window').height, 
  },
  listContent: {
    flexGrow: 1,
  },
  itemContainer: {
    height: Dimensions.get('window').height,
    width: Dimensions.get('window').width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
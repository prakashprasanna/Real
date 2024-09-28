import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import SearchBar from '../../components/SearchBar';
import DestinationList from '../../components/DestinationList';
import LocationDisplay from '../../components/LocationDisplay';
import { useLocation } from '../../../hooks/useLocation';
import { Destination, fetchDestinations } from '../../../api/destinationsApi';
import StackHeader from '@/app/components/StackHeader';

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const { location, errorMsg } = useLocation();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDestinations();
  }, []);

  const loadDestinations = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const newDestinations = await fetchDestinations(page, 10);
      setDestinations([...destinations, ...newDestinations]);
      setPage(page + 1);
    } catch (error) {
      console.error('Error fetching destinations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <StackHeader detail={'Explore'} />
    <View style={styles.container}>
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
      {/* <LocationDisplay location={location} errorMsg={errorMsg} /> */}
      <DestinationList
        destinations={destinations}
        onLoadMore={loadDestinations}
        loading={loading}
      />
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    //flex: 1,
    height: '50%',
    paddingTop: 10,
    backgroundColor: '#f0f0f0',
  },
});

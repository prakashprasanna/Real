import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';

interface FilterButtonsProps {
  filters: string[];
  activeFilter: string;
  onFilterPress: (filter: string) => void;
}

export default function FilterButtons({ filters, activeFilter, onFilterPress }: FilterButtonsProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {filters.map((filter) => (
        <TouchableOpacity
          key={filter}
          style={[
            styles.filterButton,
            activeFilter === filter && styles.activeFilterButton
          ]}
          onPress={() => onFilterPress(filter)}
        >
          <Text style={[
            styles.filterText,
            activeFilter === filter && styles.activeFilterText
          ]}>
            {filter}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
    marginBottom: 10,
    marginLeft: 10,
    height: Platform.OS === 'ios' ? undefined : 35,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  activeFilterButton: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#333',
  },
  activeFilterText: {
    color: '#fff',
  },
});
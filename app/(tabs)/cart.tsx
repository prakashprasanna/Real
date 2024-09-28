import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CartList } from '../components/CartList';

export default function Cart() {
  return (
    <View style={styles.container}>
      <CartList />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
});
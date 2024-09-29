import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CartList } from '../components/CartList';
import { PickAndUploadVideo } from '../components/PickAndUploadVideo';
export default function Cart() {
  return (
    <View style={styles.container}>
      {/* <CartList /> */}
      <PickAndUploadVideo />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
});
import React, { useCallback } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useCart } from '@/hooks/useCart';
import { AntDesign } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';


export const CartList: React.FC = () => {
  const { cart, removeFromCart, updateCartItemQuantity, loadCart } = useCart();


  useFocusEffect(
    useCallback(() => {
      loadCart();
    }, [loadCart])
  );


  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.item}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.itemDetails}>
        <Text style={styles.name}>{item.name}</Text>
        {/* <Text style={styles.price}>${item.price.toFixed(2)}</Text> */}
        <View style={styles.quantityContainer}>
          <TouchableOpacity onPress={() => updateCartItemQuantity(item.id, item.quantity - 1)}>
            <AntDesign name="minuscircleo" size={24} color="#6bb2be" />
          </TouchableOpacity>
          <Text style={styles.quantity}>{item.quantity}</Text>
          <TouchableOpacity onPress={() => updateCartItemQuantity(item.id, item.quantity + 1)}>
            <AntDesign name="pluscircleo" size={24} color="#6bb2be" />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.removeButton}>
        <AntDesign name="delete" size={24} color="red" />
      </TouchableOpacity>
    </View>
  );

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <View style={styles.container}>
      <FlatList
        data={cart}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>Your cart is empty</Text>}
      />
      {/* <Text style={styles.total}>Total: ${totalPrice.toFixed(2)}</Text> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  image: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  itemDetails: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  price: {
    fontSize: 14,
    color: '#888',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  quantity: {
    marginHorizontal: 10,
    fontSize: 16,
  },
  removeButton: {
    justifyContent: 'center',
  },
  total: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 10,
    textAlign: 'right',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
});
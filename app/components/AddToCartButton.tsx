import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useCart } from '@/hooks/useCart';
import { ShoppingItem } from '@/api/shoppingApi';
import { AntDesign } from '@expo/vector-icons';

interface AddToCartButtonProps {
  item: ShoppingItem;
}

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({ item }) => {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(item);
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleAddToCart}>
      <AntDesign name="shoppingcart" size={24} color="white" />
      <Text style={styles.buttonText}>Add to Cart</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
    button: {
        marginTop: 20,
        backgroundColor: '#F4C430',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        width: '45%',
        alignSelf: 'center',
        flexDirection: 'row',
      },
      buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
      },
});
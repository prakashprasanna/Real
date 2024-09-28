import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, FlatList, Image } from 'react-native';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string; 
}

interface AddToCartModalProps {
  visible: boolean;
  onClose: () => void;
  onCheckout: () => void;
  cartItems: CartItem[];
}

const AddToCartModal: React.FC<AddToCartModalProps> = ({ visible, onClose, onCheckout, cartItems }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Your Cart</Text>
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <Image source={{ uri: item.image }} style={styles.itemImage} />
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>$10</Text>
              </View>
            )}
          />
          <TouchableOpacity onPress={onCheckout} style={styles.checkoutButton}>
            <Text style={styles.checkoutButtonText}>Checkout</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    height: '50%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    height: '50%',
    width: '100%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
  },
  checkoutButton: {
    backgroundColor: '#6bb2be',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    color: '#6bb2be',
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    alignSelf: 'center',
    marginRight:5
  },
  itemPrice: {  
    fontSize: 16,
    fontWeight: 'bold',
    alignSelf: 'center',
  },
});

export default AddToCartModal;
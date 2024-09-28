import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShoppingItem } from '../api/shoppingApi';

export interface CartItem extends ShoppingItem {
  quantity: number;
}

const CART_STORAGE_KEY = 'shopping_cart';

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const cartJson = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (cartJson) setCart(JSON.parse(cartJson));
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const saveCart = async (newCart: CartItem[]) => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart));
      setCart(newCart);
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const addToCart = (item: ShoppingItem, quantity: number = 1) => {
    const newCart = [...cart];
    const existingItem = newCart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      newCart.push({ ...item, quantity });
    }
    saveCart(newCart);
  };

  const removeFromCart = (itemId: string) => {
    const newCart = cart.filter(item => item.id !== itemId);
    saveCart(newCart);
  };

  const updateCartItemQuantity = (itemId: string, quantity: number) => {
    const newCart = cart.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    );
    saveCart(newCart);
  };

  const clearCart = () => saveCart([]);

  return { cart, addToCart, removeFromCart, updateCartItemQuantity, clearCart,loadCart };
};
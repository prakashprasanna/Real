import { Platform } from "react-native";

export const API_URL = __DEV__ 
  ? Platform.OS === 'android'
    ? 'http://10.0.2.2:3000'
    : 'http://localhost:3000'
  : 'https://your-production-api-url.com';

export async function checkHealth() {
    try {
      const response = await fetch(`${API_URL}/health`);
      if (!response.ok) throw new Error('HTTP error ' + response.status);
      const data = await response.text();
      return data === 'OK';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
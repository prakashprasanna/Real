import { Platform } from "react-native";

export const API_URL = __DEV__ 
  ? Platform.OS === 'android'
    ? 'http://192.168.68.115:8080'
    : 'http://localhost:8080'
  : 'https://real-9f3b8.ts.r.appspot.com';

export const checkHealth = async (): Promise<boolean> => {
  try {
    console.log('Checking server health...');
    console.log('API_URL:', API_URL);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 5 second timeout

    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('Health check response status:', response.status);

    if (response.ok) {
      const data = await response.text();
      console.log('Health check response:', data);
      return data === 'OK'; // Assuming the server responds with 'OK' for a healthy state
    } else {
      console.error('Health check failed. Status:', response.status);
      return false;
    }
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      console.error('Health check timed out');
    } else {
      console.error('Health check error:', error);
    }
    return false;
  }
};
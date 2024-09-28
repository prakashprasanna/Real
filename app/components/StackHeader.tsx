import { Stack } from 'expo-router';

export default function StackHeader(props:any) {
  return (
    <Stack.Screen
      options={{
        headerTitle: props.detail,
        headerStyle: { backgroundColor: '#6bb2be' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    />
  );
}
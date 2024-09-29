import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '@/hooks/useCart';
import { View, Text, TouchableOpacity } from 'react-native';

export default function TabLayout() {
  const { cart } = useCart();
  const router = useRouter();

  const handleCartPress = () => {
    // @ts-ignore: Object is possibly 'undefined'
    router.push('/cart');
  };

  const handleExplorePress = () => {
    // @ts-ignore: Object is possibly 'undefined'
    router.push('/(tabs)/explore');

  };

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
  return (
    <Tabs
    screenOptions={{
      tabBarStyle: { backgroundColor: '#6bb2be' }, // Change this color as needed
      tabBarActiveTintColor: '#ffffff', // Color for active tab
      tabBarInactiveTintColor: '#cccccc', // Color for inactive tabs
    }}
    >
      <Tabs.Screen
        name="explore/index"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <Ionicons name="search" size={24} color={'#fff'} />,
          tabBarButton: (props) => (
            <TouchableOpacity {...props} onPress={handleExplorePress} />
          ),
        }}
      />
      <Tabs.Screen
        name="Favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color }) => <Ionicons name="star" size={24} color={'#fff'} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Add Video',
          tabBarIcon: ({ color }) => <Ionicons name="videocam" size={24} color={'#fff'} />,
          tabBarButton: (props) => (
            <TouchableOpacity {...props} onPress={handleCartPress} />
          ),
        }}
      />
      {/* <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color }) => (
            <View>
              <Ionicons name="cart" size={24} color={'#fff'} />
              {cartItemCount > 0 && (
                <View style={{
                  position: 'absolute',
                  right: -6,
                  top: -3,
                  backgroundColor: 'red',
                  borderRadius: 7,
                  width: 14,
                  height: 14,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                    {cartItemCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      /> */}
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color }) => <Ionicons name="mail" size={24} color={'#fff'} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={'#fff'} />,
        }}
      />
      <Tabs.Screen name="explore/DestinationDetailScreen" options={{ href: null }} />
      <Tabs.Screen name="PaymentScreen" options={{ href: null }} />
      <Tabs.Screen name="explore/FullVideoScreen" options={{ href: null,headerShown: false }} />
      <Tabs.Screen name="explore/SwipeableVideoFeedScreen" options={{ href: null,headerShown: false }} />
    </Tabs>
  );
}

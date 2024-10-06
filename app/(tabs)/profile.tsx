import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Image, Platform, View, Text, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export default function Profile() {
  const [user, setUser] = useState({ firstName: '', lastName: '', email: '', mobile: '', profileImageUrl: ''  });
  const { refresh } = useLocalSearchParams();

  useEffect(() => {
    fetchUserData();
  }, [refresh]);

  const fetchUserData = async () => {
    const auth = getAuth();
    const db = getFirestore();
    const userId = getAuth().currentUser?.uid;
    if (userId) {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUser({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          mobile: userData.mobile || '',
          profileImageUrl: userData.profileImageUrl || ''
        });
      }
    }
  };

  return (
    <View style={styles.container}>
            <View style={styles.imageContainer}>
        <Image
          source={{ uri: user.profileImageUrl || 'https://via.placeholder.com/150' }}
          style={styles.profileImage}
        />
      </View>
      <View style={styles.userInfoContainer}>
        <View style={styles.userInfoField}>
          <Text style={styles.label}>First Name:</Text>
          <Text style={styles.value}>{user.firstName}</Text>
        </View>
        <View style={styles.userInfoField}>
          <Text style={styles.label}>Last Name:</Text>
          <Text style={styles.value}>{user.lastName}</Text>
        </View>
        <View style={styles.userInfoField}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user.email}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.editButton} onPress={() => router.replace({
        pathname: '/EditProfile',
        params: { refresh: Date.now() }
      })}>
        <Text style={styles.buttonText}>Edit Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutButton} onPress={() => router.push({ pathname: '/' })}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  imageContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: '#fff',
  },
  userInfoContainer: {
    width: '100%',
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfoField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  label: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  value: {
    fontSize: 16,
    color: '#666',
    fontWeight: '400',
  },
  editButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 25,
    width: '80%',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: '#6bb2be',
    padding: 12,
    borderRadius: 25,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
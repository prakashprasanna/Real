import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export default function EditProfile() {
  const [user, setUser] = useState({ firstName: '', lastName: '', email: '', mobile: '', profileImageUrl: '' });
  const userId = getAuth().currentUser?.uid;
  const { refresh } = useLocalSearchParams();
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, [refresh]);

  const fetchUserData = async () => {
    const auth = getAuth();
    const db = getFirestore();
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

  const updateUser = async () => {
    const db = getFirestore();
    if (userId) {
      await updateDoc(doc(db, 'users', userId), user);
      router.replace({
        pathname: '/profile',
        params: { refresh: Date.now() }
      })
    } else {
      console.error('User ID is undefined');
    }
  };

  const pickImage = async () => {
    Alert.alert(
      "Choose Image Source",
      "Would you like to take a photo or choose from your library?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Take Photo",
          onPress: () => launchCamera()
        },
        {
          text: "Choose from Library",
          onPress: () => launchImageLibrary()
        }
      ]
    );
  };

  const launchCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your camera!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
        setIsUploading(true);
        try {
          const uploadUrl = await uploadImageAsync(result.assets[0].uri);
          setUser({ ...user, profileImageUrl: uploadUrl });
        } finally {
          setIsUploading(false);
        }
      }
    };

  const launchImageLibrary = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your photos!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
        setIsUploading(true);
        try {
          const uploadUrl = await uploadImageAsync(result.assets[0].uri);
          setUser({ ...user, profileImageUrl: uploadUrl });
        } finally {
          setIsUploading(false);
        }
      }
    };


  const uploadImageAsync = async (uri: string) => {
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function (e) {
        console.log(e);
        reject(new TypeError('Network request failed'));
      };
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    });

    try {
      const storage = getStorage();
      const fileRef = ref(storage, `profileImages/${userId}`);
      
      // Ensure blob is of type Blob before uploading
      if (blob instanceof Blob) {
        await uploadBytes(fileRef, blob);
        // We're done with the blob, no need to close it as Blob doesn't have a close method
        // The blob will be automatically garbage collected when it's no longer referenced
      } else {
        throw new Error('Invalid blob type');
      }

      return await getDownloadURL(fileRef);
    } catch (error) {
      console.log('Error:', error);
      throw error;
    }
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.imageContainer}>
          <TouchableOpacity onPress={pickImage} disabled={isUploading}>
            {isUploading ? (
              <View style={[styles.profileImage, styles.uploadingContainer]}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.uploadingText}>Uploading...</Text>
              </View>
            ) : (
              <Image 
                source={{ uri: user.profileImageUrl || 'https://via.placeholder.com/150' }} 
                style={styles.profileImage} 
              />
            )}
          </TouchableOpacity>
          <Text style={styles.imageHint}>
            {isUploading ? 'Please wait...' : 'Tap to change profile picture'}
          </Text>
        </View>
      <View style={styles.userInfoContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>First Name:</Text>
          <TextInput
            style={styles.input}
            value={user.firstName}
            onChangeText={(text) => setUser({ ...user, firstName: text })}
            placeholder="Enter your first name"
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Last Name:</Text>
          <TextInput
            style={styles.input}
            value={user.lastName}
            onChangeText={(text) => setUser({ ...user, lastName: text })}
            placeholder="Enter your last name"
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email:</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={user.email}
            editable={false}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Mobile Number:</Text>
          <TextInput
            style={styles.input}
            value={user.mobile}
            onChangeText={(text) => setUser({ ...user, mobile: text })}
            placeholder="Enter your mobile number"
            keyboardType="phone-pad"
          />
        </View>
      </View>
      <TouchableOpacity style={styles.updateButton} onPress={updateUser}>
        <Text style={styles.buttonText}>Update Profile</Text>
      </TouchableOpacity>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    marginTop: 50,
  },
header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },    
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
    },
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    paddingTop: 100,
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
  imageHint: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  userInfoContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  updateButton: {
    backgroundColor: '#4CAF50',
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
  uploadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  uploadingText: {
    marginTop: 10,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});
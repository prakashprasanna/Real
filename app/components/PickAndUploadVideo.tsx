import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { storage, firestore } from '../../firebaseConfig';
import { uploadBytesResumable, getDownloadURL, ref, deleteObject } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';

// Function to generate a unique ID
const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export function PickAndUploadVideo() {
  const [video, setVideo] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadURL, setDownloadURL] = useState<string | null>(null);
  const auth = getAuth();
  const [isDeleted, setIsDeleted] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const videoRef = useRef<Video>(null);

  const pickVideo = async () => {
    setDownloadURL(null);
    setVideo(null);
    setUploadProgress(0);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setVideo(result.assets[0].uri);
      setIsPreviewVisible(true);
    }
  };

  const handleUpload = async () => {
    if (!video) {
      console.log('No video selected');
      Alert.alert('Error', 'Please select a video first.');
      return;
    }
  
    console.log('Uploading video:', video);
    setUploadProgress(0);
  
    try {
      const response = await fetch(video);
      console.log('Fetch response:', response);
  
      const blob = await response.blob();
      console.log('Blob created');
  
      const filename = `${generateUniqueId()}.mp4`;
      const metadata = {
        customMetadata: {
          uploadedBy: auth.currentUser?.uid || 'anonymous'
        }
      };
  
      const storageRef = ref(storage, `videos/${filename}`);
      const uploadTask = uploadBytesResumable(storageRef, blob, metadata);
  
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
          console.log('Upload progress:', progress.toFixed(2) + '%');
        },
        (error) => {
          console.error('Upload error:', error);
          Alert.alert('Error', 'Failed to upload video. Please try again.');
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            setDownloadURL(url);
            console.log('Download URL obtained:', url);
            
            const videoId = generateUniqueId();
            const videoRef = doc(firestore, 'videos', videoId);
            await setDoc(videoRef, {
              downloadURL: url,
              filename,
              uploadedBy: auth.currentUser?.uid || 'anonymous',
              uploadedAt: serverTimestamp(),
              email: auth.currentUser?.email || 'anonymous'
            });
            
            console.log('Video metadata saved successfully');
            Alert.alert('Success', 'Video uploaded successfully');
          } catch (error) {
            console.error('Error saving video metadata:', error);
            Alert.alert('Error', 'Failed to save video metadata. Please try again.');
          }
        }
      );
    } catch (error) {
      console.error('Error in handleUpload:', error);
      Alert.alert('Error', 'Failed to prepare video for upload. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!downloadURL || !auth.currentUser) {
      Alert.alert('Error', 'You must be logged in to delete videos.');
      return;
    }
  
    Alert.alert(
      "Delete Video",
      "Are you sure you want to delete this video?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "OK", 
          onPress: async () => {
            // Set isDeleted to true to trigger useEffect
            setIsDeleted(true);
            try {
              // Find the video document in Firestore
              const videosRef = collection(firestore, 'videos');
              const q = query(videosRef, where('downloadURL', '==', downloadURL));
              const querySnapshot = await getDocs(q);
  
              if (querySnapshot.empty) {
                Alert.alert('Error', 'Video not found in the database.');
                return;
              }
  
              const videoDoc = querySnapshot.docs[0];
              const videoData = videoDoc.data();
  
              if (videoData.uploadedBy !== auth.currentUser?.uid) {
                Alert.alert('Error', 'You do not have permission to delete this video.');
                return;
              }

              // Log the full path before deletion
              const fileRef = ref(storage, `videos/${videoData.filename}`);
              console.log('Attempting to delete file at path:', fileRef.fullPath);

              // Delete the file from Firebase Storage
              await deleteObject(fileRef);
  
              // Delete the document from Firestore
              await deleteDoc(videoDoc.ref);
  
  
            } catch (error) {
              console.error('Error deleting video:', error);
              Alert.alert('Error', 'Failed to delete the video. Please try again.');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    if (isDeleted) {
      // Show success alert
      Alert.alert('Success', 'Video deleted successfully', [
        { 
          text: 'OK', 
          onPress: () => {
            console.log('Delete success alert closed');
            // Reset the state
            setDownloadURL(null);
            setVideo(null);
            setUploadProgress(0);
            setIsDeleted(false);
          }
        }
      ]);
    }
  }, [isDeleted]);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded && status.didJustFinish) {
      videoRef.current?.replayAsync();
    }
  };


  return (
    <View style={styles.container}>
      {downloadURL ? (
        <View style={styles.videoContainer}>
          <Text style={styles.title}>Uploaded Video:</Text>
          <Video
            source={{ uri: downloadURL }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
          />
        </View>
      ) : isPreviewVisible && video ? (
        <View style={styles.videoContainer}>
          <Text style={styles.title}>Preview:</Text>
          <Video
            ref={videoRef}
            source={{ uri: video }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />
        </View>
      ) : (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>No video selected</Text>
        </View>
      )}

      {uploadProgress > 0 && uploadProgress < 100 && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
          <Text style={styles.progressText}>{uploadProgress.toFixed(2)}%</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={pickVideo}>
          <Text style={styles.buttonText}>Pick Video</Text>
        </TouchableOpacity>
        {video && !downloadURL && (
          <TouchableOpacity style={styles.button} onPress={handleUpload}>
            <Text style={styles.buttonText}>Upload Video</Text>
          </TouchableOpacity>
        )}
        {downloadURL && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.buttonText}>Delete Video</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      backgroundColor: '#f5f5f5',
    },
    videoContainer: {
      width: '100%',
      aspectRatio: 16 / 9,
      marginBottom: 20,
      borderRadius: 10,
      overflow: 'hidden',
      backgroundColor: '#000',
      height:'80%'
    },
    video: {
      width: '100%',
      height: '100%',
    },
    placeholderContainer: {
      width: '100%',
      aspectRatio: 16 / 9,
      marginBottom: 20,
      borderRadius: 10,
      backgroundColor: '#e0e0e0',
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderText: {
      fontSize: 16,
      color: '#757575',
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
      color: '#333',
    },
    progressContainer: {
      width: '100%',
      height: 20,
      backgroundColor: '#e0e0e0',
      borderRadius: 10,
      marginBottom: 20,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: '#4CAF50',
    },
    progressText: {
      position: 'absolute',
      width: '100%',
      textAlign: 'center',
      lineHeight: 20,
      color: '#fff',
      fontWeight: 'bold',
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
    },
    button: {
      backgroundColor: '#6bb2be',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 5,
      elevation: 2,
      paddingRight:5

    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
      alignSelf:'center'
    },
    deleteButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 5,
    elevation: 2,
    //marginTop: 10,
  },
  });
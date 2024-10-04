import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, setDoc, serverTimestamp, deleteDoc, Timestamp, getDoc, connectFirestoreEmulator, runTransaction } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import * as FileSystem from 'expo-file-system';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { API_URL, checkHealth } from '../../api/CheckHealth';
import { getApp, setLogLevel } from 'firebase/app';
import { firestore } from '@/firebaseConfig';

// Set Firebase log level to error
setLogLevel('error');

const generateUniqueId = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

export function PickAndUploadVideo() {
  const [video, setVideo] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const videoRef = useRef<Video>(null);

  const storage = getStorage();
  const auth = getAuth();


  const pickVideo = async () => {
    setUploadProgress(0);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setVideo(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video. Please try again.');
    }
  };

  const uploadVideo = async (videoUri: string, videoId: string) => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.error('No user ID found');
      Alert.alert('Error', 'You must be logged in to upload a video.');
      return;
    }
  
    const filename = `${videoId}.mp4`;
    const storageRef = ref(storage, `videos/${userId}/${filename}`);
    const videoRef = doc(firestore, 'videos', videoId);
  
    console.log('Starting video upload process...');
    console.log('Video URI:', videoUri);
    console.log('Video ID:', videoId);
    console.log('User ID:', userId);
  
    try {
      console.log('Creating initial Firestore document...');
      const initialData = {
        filename,
        uploadedBy: userId,
        uploadedAt: Timestamp.now(),
        authorizedViewers: [userId],
        uploadStatus: 'pending',
        email: auth.currentUser?.email
      };
      console.log('Initial data:', JSON.stringify(initialData));
  
      console.log('Starting Firestore write operation...');
      const setDocPromise = setDoc(doc(firestore, 'videos', videoId), initialData);
      const timeoutPromise = new Promise((_, reject) => {
        const timeout = 60000; // 60 seconds
        const interval = 5000; // Log every 5 seconds
        let elapsed = 0;
        const timer = setInterval(() => {
          elapsed += interval;
          console.log(`Firestore write operation in progress... (${elapsed / 1000}s elapsed)`);
          if (elapsed >= timeout) {
            clearInterval(timer);
            reject(new Error('Firestore write operation timed out'));
          }
        }, interval);
        setDocPromise.then(() => clearInterval(timer));
      });
  
      try {
        await Promise.race([setDocPromise, timeoutPromise]);
        console.log('Firestore write operation completed successfully');
      } catch (error) {
        console.error('Firestore write operation failed:', error);
        throw error;
      }
  
      console.log('Fetching video data...');
      const response = await fetch(videoUri);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      console.log('Video data fetched successfully');
  
      console.log('Creating blob...');
      const blob = await response.blob();
      console.log('Blob created, size:', blob.size);
  
      console.log('Starting upload task...');
      const uploadTask = uploadBytesResumable(storageRef, blob);
  
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
          console.log(`Upload progress: ${progress.toFixed(2)}%`);
        },
        (error) => {
          console.error('Upload error:', error);
          Alert.alert('Upload Error', `Failed to upload video: ${error.message}`);
          setUploadProgress(0);
          setDoc(videoRef, { uploadStatus: 'error', errorMessage: error.message }, { merge: true });
        },
        async () => {
          console.log('Upload completed successfully');
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log('Download URL obtained:', downloadURL);
          await setDoc(videoRef, { 
            downloadURL, 
            uploadStatus: 'complete' 
          }, { merge: true });
          console.log('Video metadata updated with ID:', videoId);
          Alert.alert('Success', 'Video uploaded successfully');
        }
      );
  
      console.log('Upload task initiated');
    } catch (error) {
      console.error('Error in uploadVideo:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      Alert.alert('Upload Error', `Failed to process video for upload: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setUploadProgress(0);
      try {
        await setDoc(videoRef, { 
          uploadStatus: 'error', 
          errorMessage: error instanceof Error ? error.message : 'Unknown error' 
        }, { merge: true });
        console.log('Error status updated in Firestore');
      } catch (firestoreError) {
        console.error('Failed to update error status in Firestore:', firestoreError);
      }
    }
  };

  const handleUpload = async (videoUri: string) => {
    const isHealthy = await checkHealth();
    if (!isHealthy) {
      console.error('Server is not healthy');
      Alert.alert('Error', 'Server is not healthy. Please try again later.');
      return;
    }

    if (!videoUri) {
      console.log('No video selected');
      Alert.alert('Error', 'Please select a video first.');
      return;
    }

    const videoId = generateUniqueId();
    setIsCompressing(true);
    setIsUploading(true);
    console.log('Starting upload process...');
    console.log('Video URI:', videoUri);

    try {
      // Send the video to the server for compression
      console.log('Sending video to server for compression...');
      const serverUrl = `${API_URL}/compress-video`;
      console.log('Full server URL:', serverUrl);

      const response = await FileSystem.uploadAsync(serverUrl, videoUri, {
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'video',
        mimeType: 'video/mp4',
      });

      console.log('Response status:', response.status);
      console.log('Response body:', response.body);

      if (response.status !== 200) {
        throw new Error(`Server compression failed with status ${response.status}`);
      }

      const responseData = JSON.parse(response.body);
      const compressedVideoFilename = responseData.compressedVideoFilename;

      console.log('Video compressed successfully on server');
      console.log('Compressed video filename:', compressedVideoFilename);

      // Download the compressed video from the server
      const compressedVideoUri = `${FileSystem.documentDirectory}compressed_video.mp4`;
      console.log('Downloading compressed video to:', compressedVideoUri);

      const downloadResult = await FileSystem.downloadAsync(
        `${API_URL}/compressed/${compressedVideoFilename}`,
        compressedVideoUri
      );

      console.log('Download result:', downloadResult);

      if (downloadResult.status !== 200) {
        throw new Error(`Failed to download compressed video. Status: ${downloadResult.status}`);
      }

      console.log('Compressed video downloaded successfully');

      // Generate a thumbnail
      console.log('Attempting to generate thumbnail...');
      let thumbnailUri = null;
      try {
        const thumbnailResult = await VideoThumbnails.getThumbnailAsync(compressedVideoUri, {
          time: 1500,
        });
        thumbnailUri = thumbnailResult.uri;
        console.log('Thumbnail generated:', thumbnailUri);
      } catch (thumbnailError) {
        console.warn('Failed to generate thumbnail:', thumbnailError);
        // Continue without a thumbnail
      }

      // Upload the compressed video to Firebase
      console.log('Uploading compressed video to Firebase...');
      await uploadVideo(compressedVideoUri, videoId);

      console.log('Video uploaded successfully to Firebase');
      setUploadProgress(0);

      // Clean up the local compressed video file
      console.log('Cleaning up local compressed video file...');
      await FileSystem.deleteAsync(compressedVideoUri);
      console.log('Local compressed video file deleted');

    } catch (error) {
      console.error('Error in handleUpload:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      Alert.alert('Upload Error', `Failed to upload video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCompressing(false);
      setIsUploading(false);
      setVideo(null);
      console.log('Upload process completed');
    }
  };

  return (
    <View style={styles.container}>
      {video ? (
        <Video
          ref={videoRef}
          source={{ uri: video }}
          style={styles.video}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          isLooping
        />
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
        <TouchableOpacity style={[styles.button, { marginRight: 30 }]} onPress={pickVideo}>
          <Text style={styles.buttonText}>Pick Video</Text>
        </TouchableOpacity>
        {video && (
          <TouchableOpacity 
            style={[styles.button, (isCompressing || isUploading) && styles.disabledButton]} 
            onPress={() => handleUpload(video)}
            disabled={isCompressing || isUploading}
          >
            <Text style={styles.buttonText}>
              {isCompressing ? 'Compressing...' : isUploading ? 'Uploading...' : 'Upload Video'}
            </Text>
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
  video: {
    width: '100%',
    height: '80%',
    aspectRatio: 16 / 9,
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  placeholderContainer: {
    width: '100%',
    height: '80%',
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
  progressContainer: {
    width: '100%',
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
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
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
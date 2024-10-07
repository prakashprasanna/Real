import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import * as FileSystem from 'expo-file-system';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { API_URL, checkHealth } from '../../api/CheckHealth';
import { setLogLevel } from 'firebase/app';
import { firestore } from '@/firebaseConfig';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { setLoading, setVideos } from '@/Redux/videosSlice';
import { fetchVideos } from '@/api/destinationsApi';
import { Asset } from 'expo-asset';

setLogLevel('error');

const generateUniqueId = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

export function PickAndUploadVideo() {
  const [video, setVideo] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCheckingFileSize, setIsCheckingFileSize] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const videoRef = useRef<Video>(null);
  const router = useRouter();
  const dispatch = useDispatch();

  const storage = getStorage();
  const auth = getAuth();

  const copyVideoToLocalUri = async (uri: string): Promise<string> => {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    console.log('Original file info:', fileInfo);
  
    if (!fileInfo.exists) {
      throw new Error(`File does not exist: ${uri}`);
    }
  
    const newUri = FileSystem.documentDirectory + 'tempVideo.mp4';
    await FileSystem.copyAsync({
      from: uri,
      to: newUri
    });
  
    const newFileInfo = await FileSystem.getInfoAsync(newUri);
    console.log('New file info:', newFileInfo);
  
    return newUri;
  };

  const checkVideoPlayability = async (uri: string): Promise<boolean> => {
    try {
      const asset = await Asset.fromURI(uri);
      await asset.downloadAsync();
      return true; // If download is successful, assume the video is loaded
    } catch (error) {
      console.error('Error checking video playability:', error);
      return false;
    }
  };

  const pickVideo = async () => {
    setUploadProgress(0);
    setCompressionProgress(0);
    setIsCheckingFileSize(true);
    setVideoError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const videoUri = result.assets[0].uri;
        
        const fileInfo = await FileSystem.getInfoAsync(videoUri);
        const fileSizeInBytes = 'size' in fileInfo ? fileInfo.size : 0;
        const fileSizeInMB = fileSizeInBytes / (1024 * 1024);
        
        console.log(`Selected video size: ${fileSizeInMB.toFixed(2)} MB`);
        const MAX_FILE_SIZE_MB = 500;
        if (fileSizeInMB > MAX_FILE_SIZE_MB) {
          Alert.alert('File Too Large', `The selected video is ${fileSizeInMB.toFixed(2)} MB. Please choose a video smaller than ${MAX_FILE_SIZE_MB} MB.`);
          return;
        }

        const isPlayable = await checkVideoPlayability(videoUri);
        if (!isPlayable) {
          setVideoError('The selected video format is not supported or the file may be corrupted.');
          Alert.alert('Video Error', 'The selected video cannot be played. Please choose another video.');
          return;
        }

        const localUri = await copyVideoToLocalUri(videoUri);
        console.log('Copied video to local URI:', localUri);
    
        setVideo(localUri);
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video. Please try again.');
    } finally {
      setIsCheckingFileSize(false);
    }
  };

  const fetchVideosIfNeeded = useCallback(async () => {
    try {
      const refreshedVideos = await fetchVideos();
      dispatch(setVideos(refreshedVideos));
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    }
  }, [dispatch]);

  const uploadVideo = async (videoUri: string, videoId: string) => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('No user ID found');
    }
  
    const filename = `${videoId}.mp4`;
    const storageRef = ref(storage, `videos/${userId}/${filename}`);
    const videoRef = doc(firestore, 'videos', videoId);
  
    try {
      const initialData = {
        filename,
        uploadedBy: userId,
        uploadedAt: Timestamp.now(),
        authorizedViewers: [userId],
        uploadStatus: 'pending',
        email: auth.currentUser?.email
      };
  
      await setDoc(doc(firestore, 'videos', videoId), initialData);
  
      const response = await fetch(videoUri);
      const blob = await response.blob();
  
      const uploadTask = uploadBytesResumable(storageRef, blob);
  
      return new Promise<string>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            console.error('Upload error:', error);
            setUploadProgress(0);
            setDoc(videoRef, { uploadStatus: 'error', errorMessage: error.message }, { merge: true });
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            await setDoc(videoRef, { 
              downloadURL, 
              uploadStatus: 'complete' 
            }, { merge: true });
            resolve(downloadURL);
          }
        );
      });
    } catch (error) {
      console.error('Error in uploadVideo:', error);
      setUploadProgress(0);
      await setDoc(videoRef, { 
        uploadStatus: 'error', 
        errorMessage: error instanceof Error ? error.message : 'Unknown error' 
      }, { merge: true });
      throw error;
    }
  };

  const getUploadUrl = async (filename: string) => {
    try {
      const response = await fetch(`${API_URL}/get-upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      if (!response.ok) {
        throw new Error(`Failed to get upload URL: ${response.status} ${response.statusText}`);
      }
      
      try {
        const data = JSON.parse(responseText);
        console.log('Parsed response:', data);
        return data;
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        throw new Error('Failed to parse server response');
      }
    } catch (error) {
      console.error('Error getting upload URL:', error);
      throw error;
    }
  };

  const uploadToCloudStorage = async (uploadUrl: string, videoUri: string) => {
    console.log('uploadToCloudStorage uploadUrl', uploadUrl);
    console.log('uploadToCloudStorage videoUri', videoUri);
    try {
      console.log('Starting upload to Cloud Storage...');
      console.log('Upload URL:', uploadUrl);
      console.log('Video URI:', videoUri);
  
      const fileInfo = await FileSystem.getInfoAsync(videoUri);
      console.log('File info:', fileInfo);
  
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }
  
      const uploadResult = await FileSystem.uploadAsync(uploadUrl, videoUri, {
        httpMethod: 'PUT',
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: {
          'Content-Type': 'video/mp4',
        },
      });
  
      console.log('Upload result:', uploadResult);
  
      if (uploadResult.status !== 200) {
        throw new Error(`Upload failed with status ${uploadResult.status}`);
      }
  
      console.log('Upload to Cloud Storage complete');

      const fileInfoAfterUpload = await FileSystem.getInfoAsync(videoUri);
      console.log('File info after upload:', fileInfoAfterUpload);
    
      if (!fileInfoAfterUpload.exists) {
        throw new Error(`File no longer exists after upload: ${videoUri}`);
      }
    
      return videoUri;
    } catch (error) {
      console.error('Error uploading to Cloud Storage:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  };

  const generateThumbnail = async (videoUri: string): Promise<string> => {
    console.log('Starting thumbnail generation for:', videoUri);
    try {
      const thumbnail = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: 0,
      });
      console.log('Thumbnail generated successfully:', thumbnail.uri);
      return thumbnail.uri;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      throw error;
    }
  };

  const compressVideo = async (videoFile: string) => {
    console.log('Starting video compression...', videoFile);
    const formData = new FormData();
    
    formData.append('video', {
      uri: videoFile,
      type: 'video/mp4',
      name: 'video.mp4',
    } as any);
  
    try {
      console.log('Sending compression request to:', `${API_URL}/compress-video`);
      const response = await fetch(`${API_URL}/compress-video`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      console.log('Compression response status:', response.status);
      console.log('Compression response headers:', response.headers);
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
  
      // Handle the response as text instead of using a reader
      const responseText = await response.text();
      console.log('Full response text:', responseText);
  
      const events = responseText.split('\n\n');
      let lastEvent;
  
      for (const event of events) {
        if (event.startsWith('data: ')) {
          try {
            const eventData = JSON.parse(event.slice(6));
            console.log('Received event:', eventData);
            lastEvent = eventData;
  
            switch (eventData.status) {
              case 'started':
                console.log('Compression started');
                break;
              case 'progress':
                console.log(`Compression progress: ${eventData.percent}%`);
                setCompressionProgress(eventData.percent);
                break;
              case 'completed':
                console.log('Compression completed', eventData.compressedVideoUrl);
                return eventData.compressedVideoUrl;
              case 'error':
                console.error('Compression error:', eventData.error);
                throw new Error(eventData.error);
            }
          } catch (parseError) {
            console.error('Error parsing event data:', parseError, 'Raw data:', event);
          }
        }
      }
  
      if (lastEvent && lastEvent.status === 'completed') {
        return lastEvent.compressedVideoUrl;
      }
  
      throw new Error('Compression did not complete successfully');
    } catch (error) {
      console.error('Error during compression:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  };
  
  const generateThumbnailWithTimeout = async (videoUri: string, timeoutMs = 30000): Promise<string> => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Thumbnail generation timed out'));
      }, timeoutMs);
  
      generateThumbnail(videoUri)
        .then((thumbnailUri) => {
          clearTimeout(timeoutId);
          resolve(thumbnailUri);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  };
  
  const handleUpload = async (videoUri: string) => {
    setIsUploading(true);
    setUploadProgress(0);
    setCompressionProgress(0);
  
    try {
      console.log('Starting upload process...');
      console.log('Original video URI:', videoUri);
  
      const isHealthy = await checkHealth();
      if (!isHealthy) {
        throw new Error('Server is not healthy');
      }
  
      const videoId = generateUniqueId();
      console.log('Generated video ID:', videoId);
  
      const { uploadUrl, filename } = await getUploadUrl(videoId);
      console.log('Got upload URL:', uploadUrl);
  
      const uploadedVideoUri = await uploadToCloudStorage(uploadUrl, videoUri);
      console.log('Video uploaded to Cloud Storage');
  
      console.log('Starting video compression...');
      let thumbnailUri = null;
      const compressedVideoUrl = await compressVideo(uploadedVideoUri);
      console.log('Video compressed successfully');
      console.log('Compressed video URL:', compressedVideoUrl);
      
      console.log('Uploading compressed video to Firebase...');
      try {
        const downloadURL = await uploadVideo(compressedVideoUrl, videoId);
        console.log('Compressed video uploaded to Firebase');
        console.log('Download URL:', downloadURL);
  
        console.log('Updating Firestore document...');
        await updateFirestoreDocument(videoId, downloadURL, thumbnailUri);
        console.log('Firestore document updated successfully');
  
        console.log('Fetching updated video list...');
        dispatch(setLoading(true));
        await fetchVideosIfNeeded();
        dispatch(setLoading(false));
        setVideo(null); 
  
        Alert.alert(
          'Success', 
          'Video uploaded successfully',
          [
            {
              text: 'OK',
              onPress: () => {
                dispatch(setLoading(true));
                router.push('/(tabs)/explore');
                setTimeout(() => {
                  fetchVideosIfNeeded().then(() => {
                    dispatch(setLoading(false));
                  });
                }, 0);
              }
            }
          ]
        );
      } catch (uploadError) {
        console.error('Error uploading to Firebase:', uploadError);
        Alert.alert('Upload Error', `Failed to upload video to Firebase: ${uploadError.message}`);
      }
  
    } catch (error) {
      console.error('Error in handleUpload:', error);
      Alert.alert('Upload Error', `Failed to upload video: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setCompressionProgress(0);
    }
  };

  const updateFirestoreDocument = async (videoId: string, downloadURL: string, thumbnailUri: string | null) => {
    const videoRef = doc(firestore, 'videos', videoId);
    try {
      await updateDoc(videoRef, {
        downloadURL,
        thumbnailURL: thumbnailUri,
        updatedAt: Timestamp.now(),
        uploadStatus: 'complete',
        processingStatus: 'complete',
      });
    } catch (error) {
      console.error('Error updating Firestore document:', error);
      throw error;
    }
  };

  return (
    <View style={styles.container}>
      {isCheckingFileSize && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#6bb2be" />
          <Text style={styles.overlayText}>Checking file size...</Text>
        </View>
      )}

      {video ? (
        <>
          <Video
            ref={videoRef}
            source={{ uri: video }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            onError={(error) => {
              console.error('Video playback error:', error);
              setVideoError('Error playing the video. The file may be corrupted or in an unsupported format.');
            }}
          />
          {videoError && (
            <Text style={styles.errorText}>{videoError}</Text>
          )}
        </>
      ) : (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>No video selected</Text>
        </View>
      )}

      {compressionProgress > 0 && compressionProgress < 100 && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${compressionProgress}%` }]} />
          <Text style={styles.progressText}>Compressing: {compressionProgress.toFixed(2)}%</Text>
        </View>
      )}

      {uploadProgress > 0 && uploadProgress < 100 && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
          <Text style={styles.progressText}>Uploading: {uploadProgress.toFixed(2)}%</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, isCheckingFileSize && styles.disabledButton]} 
          onPress={pickVideo}
          disabled={isCheckingFileSize}
        >
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlayText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 10,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
});
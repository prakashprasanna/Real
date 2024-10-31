import React, { useState, useRef, useCallback, useEffect } from 'react';
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
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';

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
  const [overallProgress, setOverallProgress] = useState(0);
  const [localVideoUri, setLocalVideoUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean>(false);
  const [showCamera, setShowCamera] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(10);
  
  const camera = useRef<Camera>(null);
  const devices = useCameraDevices();
  const device = devices[0]; 

  const videoRef = useRef<Video>(null);
  const router = useRouter();
  const dispatch = useDispatch();

  const storage = getStorage();
  const auth = getAuth();

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const cameraPermission = await Camera.requestCameraPermission();
    const microphonePermission = await Camera.requestMicrophonePermission();
    setCameraPermission(
      cameraPermission === 'granted' && microphonePermission === 'granted'
    );
  };

  const startRecording = async () => {
    if (!camera.current) return;
    
    setIsRecording(true);
    setRecordingTimer(10);
    
    try {
      const video = await camera.current.startRecording({
        flash: 'off',
        onRecordingFinished: (video) => {
          console.log('Recording finished:', video);
          processRecordedVideo(video.path);
        },
        onRecordingError: (error) => {
          console.error('Recording error:', error);
          Alert.alert('Error', 'Failed to record video');
        },
      });
      
      // Start countdown timer
      const timer = setInterval(() => {
        setRecordingTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!camera.current) return;
    
    try {
      await camera.current.stopRecording();
      setIsRecording(false);
      setShowCamera(false);
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const processRecordedVideo = async (videoPath: string) => {
    try {
      // Save to camera roll
      await CameraRoll.save(`file://${videoPath}`, {
        type: 'video',
      });
      
      // Set the video for preview
      setVideo(`file://${videoPath}`);
      setLocalVideoUri(`file://${videoPath}`);
    } catch (error) {
      console.error('Error processing recorded video:', error);
      Alert.alert('Error', 'Failed to process recorded video');
    }
  };

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
        setLocalVideoUri(localUri);
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

  const uploadToCloudStorage = async (uploadUrl: string, videoUri: string, onProgress: (progress: number) => void) => {
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
        sessionType: FileSystem.FileSystemSessionType.BACKGROUND,
        uploadTaskCallback: (totalBytesSent: number, totalBytesExpectedToSend: number) => {
          const progress = (totalBytesSent / totalBytesExpectedToSend) * 100;
          onProgress(progress);
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

  const deleteLocalVideo = async (uri: string) => {
    console.log('deleteLocalVideo uri', uri);
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
      console.log('Local video file deleted successfully');
    } catch (error) {
      console.error('Error deleting local video file:', error);
    }
  };
  
  const uploadVideo = async (videoUrl: string, videoId: string, onProgress: (progress: number) => void) => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('No user ID found');
    }
  
    const filename = `${videoId}.mp4`;
    const storageRef = ref(storage, `videos/${userId}/${filename}`);
    const videoRef = doc(firestore, 'videos', videoId);
  
    try {
      console.log('Starting Firebase upload...');
      console.log('Video URL:', videoUrl);
      console.log('Video ID:', videoId);
  
      const initialData = {
        filename,
        uploadedBy: userId,
        uploadedAt: Timestamp.now(),
        authorizedViewers: [userId],
        uploadStatus: 'pending',
        email: auth.currentUser?.email
      };
  
      await setDoc(doc(firestore, 'videos', videoId), initialData);
      console.log('Initial Firestore document created');
  
      console.log('Fetching video content...');
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      console.log('Video content fetched successfully');
  
      const uploadTask = uploadBytesResumable(storageRef, blob);
  
      return new Promise<string>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Upload progress: ${progress.toFixed(2)}%`);
            onProgress(progress);
          },
          (error) => {
            console.error('Upload error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            setDoc(videoRef, { uploadStatus: 'error', errorMessage: error.message }, { merge: true });
            reject(error);
          },
          async () => {
            console.log('Upload completed successfully');
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('Download URL:', downloadURL);
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
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
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

  const compressVideo = async (filename: string, onProgress?: (progress: number) => void) => {
    console.log('Starting video compression...', filename);
    try {
      console.log('Sending compression request to:', `${API_URL}/compress-video`);
      const response = await fetch(`${API_URL}/compress-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
      });
  
      console.log('Compression response status:', response.status);
      console.log('Compression response headers:', response.headers);
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
  
      // Use response.text() instead of streaming
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
                onProgress?.(eventData.percent);
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
    setOverallProgress(0);
  
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

      // Upload to Cloud Storage
      await uploadToCloudStorage(uploadUrl, videoUri, (progress) => {
        updateOverallProgress(progress, 0, 0);
      });
      console.log('Video uploaded to Cloud Storage');

      // Compress video
      console.log('Starting compression...');
      const compressedVideoUrl = await compressVideo(filename, (progress: number) => {
        setCompressionProgress(progress);
        updateOverallProgress(100, progress, 0);
      });
      console.log('Compression completed. Compressed video URL:', compressedVideoUrl);

      if (!compressedVideoUrl) {
        throw new Error('Compression failed: No compressed video URL returned');
      }

      // Upload to Firebase
      console.log('Starting Firebase upload...');
      const firebaseDownloadURL = await uploadVideo(compressedVideoUrl, videoId, (progress) => {
        setUploadProgress(progress);
        updateOverallProgress(100, 100, progress);
      });

      console.log('Video compressed and uploaded to Firebase');
      console.log('Compressed video URL:', compressedVideoUrl);
      console.log('Firebase Download URL:', firebaseDownloadURL);

      // // Delete the compressed video from Google Cloud Storage
      // const compressedFilename = compressedVideoUrl.split('/').pop()?.split('?')[0];
      // if (compressedFilename) {
      //   await deleteCompressedVideo(compressedFilename);
      // }
  
      // Generate thumbnail
      let thumbnailUri = null;
      try {
        thumbnailUri = await generateThumbnailWithTimeout(compressedVideoUrl);
      } catch (thumbnailError) {
        console.error('Error generating thumbnail:', thumbnailError);
      }
  
      console.log('Updating Firestore document...');
      await updateFirestoreDocument(videoId, firebaseDownloadURL, thumbnailUri);
      console.log('Firestore document updated successfully');
  
      console.log('Fetching updated video list...');
      dispatch(setLoading(true));
      await fetchVideosIfNeeded();
      dispatch(setLoading(false));
      setVideo(null);

      if (localVideoUri) {
        await deleteLocalVideo(localVideoUri);
        setLocalVideoUri(null);
      }
  
      Alert.alert(
        'Success', 
        'Video uploaded and processed successfully',
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
    } catch (error) {
      console.error('Error in handleUpload:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      Alert.alert('Upload Error', `Failed to upload video: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setCompressionProgress(0);
      setOverallProgress(0);
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

  const updateOverallProgress = (cloudStorageProgress: number, compressionProgress: number, firebaseProgress: number) => {
    // Assuming each step is weighted equally
    const overallProgress = (cloudStorageProgress + compressionProgress + firebaseProgress) / 3;
    setOverallProgress(overallProgress);
  };

  const deleteCompressedVideo = async (filename: string) => {
    try {
      const response = await fetch(`${API_URL}/delete-file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete compressed video: ${response.status} ${response.statusText}`);
      }

      console.log('Compressed video deleted from Google Cloud Storage');
    } catch (error) {
      console.error('Error deleting compressed video:', error);
      // We don't throw here to avoid interrupting the main process
    }
  };

  if (showCamera && device) {
    return (
      <View style={styles.container}>
        <Camera
          ref={camera}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          video={true}
          audio={true}
        />
        <View style={styles.cameraOverlay}>
          {isRecording && (
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>{recordingTimer}s</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordingButton]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <View style={styles.recordButtonInner} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowCamera(false)}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
            onError={(error: any) => {
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
  
      {isUploading && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${overallProgress}%` }]} />
          <Text style={styles.progressText}>Overall Progress: {overallProgress.toFixed(2)}%</Text>
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
          <Text style={styles.progressText}>Uploading to Firebase: {uploadProgress.toFixed(2)}%</Text>
        </View>
      )}
  
      <View style={styles.buttonsWrapper}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, isCheckingFileSize && styles.disabledButton]} 
            onPress={pickVideo}
            disabled={isCheckingFileSize}
          >
            <Text style={styles.buttonText}>Pick Video</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, !cameraPermission && styles.disabledButton]} 
            onPress={() => setShowCamera(true)}
            disabled={!cameraPermission}
          >
            <Text style={styles.buttonText}>Use Camera</Text>
          </TouchableOpacity>
        </View>
        
        {video && (
          <View style={styles.uploadButtonContainer}>
            <TouchableOpacity 
              style={[styles.uploadButton, (isCompressing || isUploading) && styles.disabledButton]} 
              onPress={() => handleUpload(video)}
              disabled={isCompressing || isUploading}
            >
              <Text style={styles.buttonText}>
                {isCompressing ? 'Compressing...' : isUploading ? 'Uploading...' : 'Upload Video'}
              </Text>
            </TouchableOpacity>
          </View>
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
    minWidth: 120,
  },
  uploadButtonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  uploadButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 5,
    elevation: 2,
    minWidth: 200,
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
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 20,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  recordingButton: {
    backgroundColor: 'red',
  },
  recordButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'red',
  },
  timerContainer: {
    position: 'absolute',
    top: 40,
    alignSelf: 'center',
  },
  timerText: {
    fontSize: 40,
    color: 'white',
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  buttonsWrapper: {
    width: '100%',
    gap: 15,
  },
});
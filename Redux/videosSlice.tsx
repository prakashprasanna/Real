import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Video } from '../api/destinationsApi';

interface VideosState {
  videos: Video[];
  userVideos: Video[];
  isLoading: boolean;
  lastFetchTime: number | null;
  currentIndex: number;
}

const initialState: VideosState = {
  videos: [],
  userVideos: [],
  isLoading: false,
  lastFetchTime: null,
  currentIndex: 0,
};

const videosSlice = createSlice({
  name: 'videos',
  initialState,
  reducers: {
    setVideos: (state, action: PayloadAction<Video[]>) => {
      state.videos = action.payload;
      state.lastFetchTime = Date.now();
      state.currentIndex = 0;
    },
    setVideosUser: (state, action: PayloadAction<Video[]>) => {
      state.userVideos = action.payload;
      state.lastFetchTime = Date.now();
      state.currentIndex = 0;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setCurrentIndex: (state, action: PayloadAction<number>) => {
      state.currentIndex = action.payload;
    },
    deleteVideo: (state, action: PayloadAction<string>) => {
      state.videos = state.videos.filter(video => video.id !== action.payload);
      state.userVideos = state.userVideos.filter(video => video.id !== action.payload);
      if (state.currentIndex >= state.videos.length) {
        state.currentIndex = Math.max(0, state.videos.length - 1);
      }
    },
  },
});

export const { setVideos, setVideosUser, setLoading, setCurrentIndex, deleteVideo } = videosSlice.actions;
export default videosSlice.reducer;
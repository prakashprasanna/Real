import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Video } from '../api/destinationsApi';

interface VideosState {
  allVideos: Video[];
  currentIndex: number;
  lastFetchTime: number | null;
  isLoading: boolean;
}

const initialState: VideosState = {
  allVideos: [],
  currentIndex: 0,
  lastFetchTime: null,
  isLoading: false,
};

const videosSlice = createSlice({
  name: 'videos',
  initialState,
  reducers: {
    setVideos: (state, action: PayloadAction<Video[]>) => {
      state.allVideos = action.payload;
      state.lastFetchTime = Date.now();
    },
    setCurrentIndex: (state, action: PayloadAction<number>) => {
      state.currentIndex = action.payload;
    },
    reorderVideos: (state, action: PayloadAction<number>) => {
      const clickedIndex = action.payload;
      const clickedVideo = state.allVideos[clickedIndex];
      state.allVideos = [
        clickedVideo,
        ...state.allVideos.slice(0, clickedIndex),
        ...state.allVideos.slice(clickedIndex + 1)
      ];
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setVideos, setCurrentIndex, reorderVideos, setLoading } = videosSlice.actions;
export default videosSlice.reducer;
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Video } from '../api/destinationsApi';

interface VideosState {
  allVideos: Video[];
  currentIndex: number;
}

const initialState: VideosState = {
  allVideos: [],
  currentIndex: 0,
};

const videosSlice = createSlice({
  name: 'videos',
  initialState,
  reducers: {
    setVideos: (state, action: PayloadAction<Video[]>) => {
      state.allVideos = action.payload;
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
  },
});

export const { setVideos, setCurrentIndex, reorderVideos } = videosSlice.actions;
export default videosSlice.reducer;
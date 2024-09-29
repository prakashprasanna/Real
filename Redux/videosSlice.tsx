import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Video {
  id: string;
  name: string;
  downloadURL: string;
}

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
  },
});

export const { setVideos, setCurrentIndex } = videosSlice.actions;
export default videosSlice.reducer;
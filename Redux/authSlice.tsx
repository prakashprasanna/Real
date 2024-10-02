import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './store'; // Adjust the import path as needed

interface AuthState {
  userId: string | null;
  // Add other auth-related state as needed
}

export const selectUserId = (state: RootState) => state.auth.userId;

const initialState: AuthState = {
  userId: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUserId: (state, action: PayloadAction<string>) => {
      state.userId = action.payload;
    },
    clearUserId: (state) => {
      state.userId = null;
    },
  },
});

export const { setUserId, clearUserId } = authSlice.actions;
export default authSlice.reducer;
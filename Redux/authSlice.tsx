import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  userId: string | null;
  // Add other auth-related state as needed
}

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
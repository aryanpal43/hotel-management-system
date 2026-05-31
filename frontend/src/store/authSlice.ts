import { createSlice } from '@reduxjs/toolkit';

const cachedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
const cachedToken = localStorage.getItem('accessToken') || null;
const cachedTheme = localStorage.getItem('themeMode') || 'dark';
const cachedActiveHotelId = localStorage.getItem('activeHotelId') || null;

const initialState = {
  user: cachedUser,
  accessToken: cachedToken,
  themeMode: cachedTheme,
  isAuthenticated: !!cachedToken,
  license: null,
  activeHotelId: cachedActiveHotelId,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.isAuthenticated = true;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('accessToken', accessToken);
      
      // Auto-set scoping if they are a regular hotel admin or staff
      if (user.hotelId) {
        state.activeHotelId = user.hotelId;
        localStorage.setItem('activeHotelId', user.hotelId);
      }
    },
    logOut: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.license = null;
      state.activeHotelId = null;
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('activeHotelId');
    },
    toggleThemeMode: (state) => {
      const newMode = state.themeMode === 'dark' ? 'light' : 'dark';
      state.themeMode = newMode;
      localStorage.setItem('themeMode', newMode);
    },
    updateLicense: (state, action) => {
      state.license = action.payload;
    },
    setActiveHotelId: (state, action) => {
      state.activeHotelId = action.payload;
      if (action.payload) {
        localStorage.setItem('activeHotelId', action.payload);
      } else {
        localStorage.removeItem('activeHotelId');
      }
    },
  },
});

export const { setCredentials, logOut, toggleThemeMode, updateLicense, setActiveHotelId } = authSlice.actions;
export default authSlice.reducer;

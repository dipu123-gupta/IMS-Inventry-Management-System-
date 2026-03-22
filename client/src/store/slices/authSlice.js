import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

// Load user from localStorage
const user = JSON.parse(localStorage.getItem('user') || 'null');

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await API.post('/auth/login', credentials);
    if (!data.twoFactorRequired) {
      localStorage.setItem('user', JSON.stringify(data));
    }
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Login failed');
  }
});

export const verify2FALogin = createAsyncThunk('auth/verify2FALogin', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await API.post('/auth/verify-2fa', payload);
    localStorage.setItem('user', JSON.stringify(data));
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Invalid 2FA token');
  }
});

export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await API.post('/auth/register', userData);
    localStorage.setItem('user', JSON.stringify(data));
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Registration failed');
  }
});

export const loadUser = createAsyncThunk('auth/loadUser', async (_, { rejectWithValue }) => {
  try {
    const { data } = await API.get('/auth/me');
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to load user');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: user || null,
    isLoading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      localStorage.removeItem('user');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.isLoading = true; state.error = null; state.twoFactorRequired = false; })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.twoFactorRequired) {
          state.twoFactorRequired = true;
          state.tempUserId = action.payload.userId;
        } else {
          state.user = action.payload;
        }
      })
      .addCase(login.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(verify2FALogin.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(verify2FALogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.twoFactorRequired = false;
        state.tempUserId = null;
      })
      .addCase(verify2FALogin.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(register.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(register.fulfilled, (state, action) => { state.isLoading = false; state.user = action.payload; })
      .addCase(register.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.user = { ...state.user, ...action.payload };
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;

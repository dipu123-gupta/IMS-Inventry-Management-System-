import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

export const fetchUsers = createAsyncThunk('users/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await API.get('/users');
    return data.users;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
  }
});

export const addUser = createAsyncThunk('users/add', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await API.post('/users', userData);
    return data.user;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to add user');
  }
});

export const deleteUser = createAsyncThunk('users/delete', async (id, { rejectWithValue }) => {
  try {
    await API.delete(`/users/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete user');
  }
});

const userSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],
    isLoading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => { state.isLoading = true; })
      .addCase(fetchUsers.fulfilled, (state, action) => { state.isLoading = false; state.users = action.payload; })
      .addCase(fetchUsers.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(addUser.fulfilled, (state, action) => { state.users.push(action.payload); })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter(u => u._id !== action.payload);
      });
  },
});

export default userSlice.reducer;

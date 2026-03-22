import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

export const fetchProductBatches = createAsyncThunk('batches/fetchByProduct', async (productId, { rejectWithValue }) => {
  try {
    const { data } = await API.get(`/batches/product/${productId}`);
    return data.batches;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch batches');
  }
});

export const fetchExpiringBatches = createAsyncThunk('batches/fetchExpiring', async (_, { rejectWithValue }) => {
  try {
    const { data } = await API.get('/batches/expiring');
    return data.batches;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch expiring batches');
  }
});

export const addBatch = createAsyncThunk('batches/add', async (batchData, { rejectWithValue }) => {
  try {
    const { data } = await API.post('/batches', batchData);
    return data.batch;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to add batch');
  }
});

const batchSlice = createSlice({
  name: 'batches',
  initialState: {
    batches: [],
    expiringBatches: [],
    isLoading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductBatches.pending, (state) => { state.isLoading = true; })
      .addCase(fetchProductBatches.fulfilled, (state, action) => { state.isLoading = false; state.batches = action.payload; })
      .addCase(fetchProductBatches.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(fetchExpiringBatches.fulfilled, (state, action) => { state.expiringBatches = action.payload; })
      .addCase(addBatch.fulfilled, (state, action) => { state.batches.push(action.payload); });
  },
});

export default batchSlice.reducer;

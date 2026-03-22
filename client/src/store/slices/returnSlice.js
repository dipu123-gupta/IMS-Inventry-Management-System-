import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

export const fetchReturns = createAsyncThunk('returns/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await API.get('/returns');
    return data.returns;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch returns');
  }
});

export const createReturn = createAsyncThunk('returns/create', async (returnData, { rejectWithValue }) => {
  try {
    const { data } = await API.post('/returns', returnData);
    return data.return;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create return');
  }
});

export const completeReturn = createAsyncThunk('returns/complete', async (id, { rejectWithValue }) => {
  try {
    const { data } = await API.put(`/returns/${id}/complete`);
    return data.return;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to complete return');
  }
});

const returnSlice = createSlice({
  name: 'returns',
  initialState: {
    returns: [],
    isLoading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReturns.pending, (state) => { state.isLoading = true; })
      .addCase(fetchReturns.fulfilled, (state, action) => { state.isLoading = false; state.returns = action.payload; })
      .addCase(fetchReturns.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(createReturn.fulfilled, (state, action) => { state.returns.unshift(action.payload); })
      .addCase(completeReturn.fulfilled, (state, action) => {
        const index = state.returns.findIndex(r => r._id === action.payload._id);
        if (index !== -1) state.returns[index] = action.payload;
      });
  },
});

export default returnSlice.reducer;

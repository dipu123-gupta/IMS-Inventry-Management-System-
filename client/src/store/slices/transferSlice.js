import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

export const fetchTransfers = createAsyncThunk('transfers/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const { data } = await API.get('/transfers', { params });
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch transfers');
  }
});

export const createTransfer = createAsyncThunk('transfers/create', async (transferData, { rejectWithValue }) => {
  try {
    const { data } = await API.post('/transfers', transferData);
    return data.transfer;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create transfer');
  }
});

export const approveTransfer = createAsyncThunk('transfers/approve', async (id, { rejectWithValue }) => {
  try {
    const { data } = await API.put(`/transfers/${id}/approve`);
    return data.transfer;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to approve transfer');
  }
});

export const receiveTransfer = createAsyncThunk('transfers/receive', async (id, { rejectWithValue }) => {
  try {
    const { data } = await API.put(`/transfers/${id}/receive`);
    return data.transfer;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to receive transfer');
  }
});

const transferSlice = createSlice({
  name: 'transfers',
  initialState: { items: [], total: 0, isLoading: false, error: null },
  reducers: {
    clearError: (state) => { state.error = null; },
    socketUpdate: (state, action) => {
      const { action: socketAction, data } = action.payload;
      const transfer = data.transfer;
      if (!transfer) return;

      const idx = state.items.findIndex(t => t._id === transfer._id);
      if (socketAction === 'created' || socketAction === 'received' || socketAction === 'approved') {
        if (idx !== -1) {
          state.items[idx] = transfer;
        } else if (socketAction === 'created') {
          state.items.unshift(transfer);
          state.total++;
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransfers.pending, (state) => { state.isLoading = true; })
      .addCase(fetchTransfers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.transfers;
        state.total = action.payload.count;
      })
      .addCase(fetchTransfers.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(createTransfer.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.total++;
      })
      .addCase(approveTransfer.fulfilled, (state, action) => {
        const idx = state.items.findIndex(t => t._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(receiveTransfer.fulfilled, (state, action) => {
        const idx = state.items.findIndex(t => t._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      });
  },
});

export const { clearError, socketUpdate: transferSocketUpdate } = transferSlice.actions;
export default transferSlice.reducer;

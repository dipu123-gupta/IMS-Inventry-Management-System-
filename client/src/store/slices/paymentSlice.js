import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

export const fetchPayments = createAsyncThunk('payments/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await API.get('/payments');
    return data.payments;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch payments');
  }
});

export const recordPayment = createAsyncThunk('payments/record', async (paymentData, { rejectWithValue }) => {
  try {
    const { data } = await API.post('/payments', paymentData);
    return data.payment;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to record payment');
  }
});

const paymentSlice = createSlice({
  name: 'payments',
  initialState: {
    payments: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    socketUpdate: (state, action) => {
      const { action: socketAction, data } = action.payload;
      if (socketAction === 'recorded') {
        if (!state.payments.find(p => p._id === data._id)) {
          state.payments.unshift(data);
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayments.pending, (state) => { state.isLoading = true; })
      .addCase(fetchPayments.fulfilled, (state, action) => { state.isLoading = false; state.payments = action.payload || []; })
      .addCase(fetchPayments.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(recordPayment.fulfilled, (state, action) => { state.payments.unshift(action.payload); });
  },
});

export const { socketUpdate: paymentSocketUpdate } = paymentSlice.actions;
export default paymentSlice.reducer;

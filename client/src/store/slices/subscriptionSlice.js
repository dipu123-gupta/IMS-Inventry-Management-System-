import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

export const fetchSubscriptionStatus = createAsyncThunk(
  'subscription/fetchStatus',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.get('/subscriptions/status');
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch subscription status');
    }
  }
);

export const createCheckoutSession = createAsyncThunk(
  'subscription/createCheckout',
  async (priceId, { rejectWithValue }) => {
    try {
      const { data } = await API.post('/subscriptions/checkout', { priceId });
      return data.url;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to initiate checkout');
    }
  }
);

export const createPortalSession = createAsyncThunk(
  'subscription/createPortal',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.post('/subscriptions/portal');
      return data.url;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to initiate billing portal');
    }
  }
);

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState: {
    status: null, // plan name, currentPeriodEnd, etc.
    isLoading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubscriptionStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchSubscriptionStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.status = action.payload;
      })
      .addCase(fetchSubscriptionStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export default subscriptionSlice.reducer;

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

export const fetchOrders = createAsyncThunk('orders/fetch', async (params, { rejectWithValue }) => {
  try {
    const { data } = await API.get('/orders', { params });
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
  }
});

export const createOrder = createAsyncThunk('orders/create', async (orderData, { rejectWithValue }) => {
  try {
    const { data } = await API.post('/orders', orderData);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create order');
  }
});

export const updateOrderStatus = createAsyncThunk('orders/updateStatus', async ({ id, status }, { rejectWithValue }) => {
  try {
    const { data } = await API.put(`/orders/${id}/status`, { status });
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update order status');
  }
});

const orderSlice = createSlice({
  name: 'orders',
  initialState: { items: [], total: 0, pages: 0, page: 1, isLoading: false, error: null },
  reducers: {
    socketUpdate: (state, action) => {
      const { action: socketAction, data } = action.payload;
      switch (socketAction) {
        case 'created':
          if (!state.items.find(o => o._id === data._id)) {
            state.items.unshift(data);
            state.total++;
          }
          break;
        case 'statusChanged':
        case 'updated':
          const idx = state.items.findIndex((o) => o._id === data._id);
          if (idx !== -1) state.items[idx] = { ...state.items[idx], ...data };
          break;
        case 'cancelled':
        case 'deleted':
          state.items = state.items.filter((o) => o._id !== data._id);
          state.total = Math.max(0, state.total - 1);
          break;
        default:
          break;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => { state.isLoading = true; })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.orders;
        state.total = action.payload.total;
        state.pages = action.payload.pages;
        state.page = action.payload.page;
      })
      .addCase(fetchOrders.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(createOrder.fulfilled, (state, action) => { state.items.unshift(action.payload); state.total++; })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const idx = state.items.findIndex((o) => o._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      });
  },
});

export const { socketUpdate: orderSocketUpdate } = orderSlice.actions;
export default orderSlice.reducer;

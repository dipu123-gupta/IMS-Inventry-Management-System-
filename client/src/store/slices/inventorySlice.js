import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

export const fetchInventoryLogs = createAsyncThunk('inventory/fetchLogs', async (params, { rejectWithValue }) => {
  try {
    const { data } = await API.get('/inventory/logs', { params });
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch logs');
  }
});

export const fetchLowStock = createAsyncThunk('inventory/lowStock', async (_, { rejectWithValue }) => {
  try {
    const { data } = await API.get('/inventory/low-stock');
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch low stock');
  }
});

export const adjustStock = createAsyncThunk('inventory/adjust', async (adjustData, { rejectWithValue }) => {
  try {
    const { data } = await API.post('/inventory/adjust', adjustData);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to adjust stock');
  }
});

const inventorySlice = createSlice({
  name: 'inventory',
  initialState: { logs: [], lowStockItems: [], total: 0, pages: 0, isLoading: false, error: null },
  reducers: {
    socketUpdate: (state, action) => {
      const { action: socketAction, data } = action.payload;
      if (socketAction === 'stockAdjusted') {
        state.logs.unshift(data.log);
        // Also update low stock status locally if it's in the list
        const idx = state.lowStockItems.findIndex(p => p._id === data.product._id);
        const isNowLow = data.product.totalQuantity <= data.product.lowStockThreshold;
        
        if (isNowLow && idx === -1) {
          state.lowStockItems.unshift(data.product);
        } else if (!isNowLow && idx !== -1) {
          state.lowStockItems.splice(idx, 1);
        } else if (idx !== -1) {
          state.lowStockItems[idx] = data.product;
        }
      } else if (socketAction === 'lowStock') {
        if (!state.lowStockItems.find(p => p._id === data.product._id)) {
          state.lowStockItems.unshift(data.product);
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventoryLogs.pending, (state) => { state.isLoading = true; })
      .addCase(fetchInventoryLogs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.logs = action.payload.logs;
        state.total = action.payload.total;
        state.pages = action.payload.pages;
      })
      .addCase(fetchInventoryLogs.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(fetchLowStock.fulfilled, (state, action) => { state.lowStockItems = action.payload; })
      .addCase(adjustStock.fulfilled, (state, action) => { state.logs.unshift(action.payload.log); });
  },
});

export const { socketUpdate: inventorySocketUpdate } = inventorySlice.actions;
export default inventorySlice.reducer;

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

export const fetchWarehouses = createAsyncThunk('warehouse/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await API.get('/warehouses');
    return response.data.warehouses;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch warehouses');
  }
});

export const createWarehouse = createAsyncThunk('warehouse/create', async (data, { rejectWithValue }) => {
  try {
    const response = await API.post('/warehouses', data);
    return response.data.warehouse;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create warehouse');
  }
});

export const deleteWarehouse = createAsyncThunk('warehouse/delete', async (id, { rejectWithValue }) => {
  try {
    await API.delete(`/warehouses/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete warehouse');
  }
});

const warehouseSlice = createSlice({
  name: 'warehouse',
  initialState: {
    warehouses: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWarehouses.pending, (state) => { state.isLoading = true; })
      .addCase(fetchWarehouses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.warehouses = action.payload;
      })
      .addCase(fetchWarehouses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createWarehouse.fulfilled, (state, action) => {
        state.isLoading = false;
        state.warehouses.push(action.payload);
      })
      .addCase(createWarehouse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteWarehouse.fulfilled, (state, action) => {
        state.warehouses = state.warehouses.filter(w => w._id !== action.payload);
      });
  },
});

export default warehouseSlice.reducer;

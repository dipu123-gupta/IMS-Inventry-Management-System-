import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

export const fetchVendors = createAsyncThunk('vendors/fetch', async (params, { rejectWithValue }) => {
  try {
    const { data } = await API.get('/vendors', { params });
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch vendors');
  }
});

export const createVendor = createAsyncThunk('vendors/create', async (vendorData, { rejectWithValue }) => {
  try {
    const { data } = await API.post('/vendors', vendorData);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create vendor');
  }
});

export const updateVendor = createAsyncThunk('vendors/update', async ({ id, vendorData }, { rejectWithValue }) => {
  try {
    const { data } = await API.put(`/vendors/${id}`, vendorData);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update vendor');
  }
});

export const deleteVendor = createAsyncThunk('vendors/delete', async (id, { rejectWithValue }) => {
  try {
    await API.delete(`/vendors/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete vendor');
  }
});

const vendorSlice = createSlice({
  name: 'vendors',
  initialState: { items: [], total: 0, pages: 0, page: 1, isLoading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVendors.pending, (state) => { state.isLoading = true; })
      .addCase(fetchVendors.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.vendors;
        state.total = action.payload.total;
        state.pages = action.payload.pages;
        state.page = action.payload.page;
      })
      .addCase(fetchVendors.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(createVendor.fulfilled, (state, action) => { state.items.unshift(action.payload); state.total++; })
      .addCase(updateVendor.fulfilled, (state, action) => {
        const idx = state.items.findIndex((s) => s._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteVendor.fulfilled, (state, action) => {
        state.items = state.items.filter((s) => s._id !== action.payload);
        state.total--;
      });
  },
});

export default vendorSlice.reducer;

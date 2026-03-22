import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

export const fetchProducts = createAsyncThunk('products/fetch', async (params, { rejectWithValue }) => {
  try {
    const { data } = await API.get('/products', { params });
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
  }
});

export const createProduct = createAsyncThunk('products/create', async (productData, { rejectWithValue }) => {
  try {
    const { data } = await API.post('/products', productData);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create product');
  }
});

export const updateProduct = createAsyncThunk('products/update', async ({ id, productData }, { rejectWithValue }) => {
  try {
    const { data } = await API.put(`/products/${id}`, productData);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update product');
  }
});

export const deleteProduct = createAsyncThunk('products/delete', async (id, { rejectWithValue }) => {
  try {
    await API.delete(`/products/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete product');
  }
});

const productSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    total: 0,
    pages: 0,
    page: 1,
    isLoading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
    socketUpdate: (state, action) => {
      const { action: socketAction, data } = action.payload;
      switch (socketAction) {
        case 'created':
          // Check if already exists (optimistic UI might have added it)
          if (!state.items.find(p => p._id === data._id)) {
            state.items.unshift(data);
            state.total++;
          }
          break;
        case 'updated':
          const idx = state.items.findIndex((p) => p._id === data._id);
          if (idx !== -1) state.items[idx] = { ...state.items[idx], ...data };
          break;
        case 'deleted':
          state.items = state.items.filter((p) => p._id !== data._id);
          state.total = Math.max(0, state.total - 1);
          break;
        default:
          break;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => { state.isLoading = true; })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.products;
        state.total = action.payload.total;
        state.pages = action.payload.pages;
        state.page = action.payload.page;
      })
      .addCase(fetchProducts.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(createProduct.fulfilled, (state, action) => { state.items.unshift(action.payload); state.total++; })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const idx = state.items.findIndex((p) => p._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p._id !== action.payload);
        state.total--;
      });
  },
});

export const { clearError: clearProductError, socketUpdate: productSocketUpdate } = productSlice.actions;
export default productSlice.reducer;

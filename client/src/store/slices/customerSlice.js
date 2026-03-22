import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

export const fetchCustomers = createAsyncThunk('customer/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await API.get('/customers');
    return response.data.customers;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch customers');
  }
});

export const createCustomer = createAsyncThunk('customer/create', async (data, { rejectWithValue }) => {
  try {
    const response = await API.post('/customers', data);
    return response.data.customer;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create customer');
  }
});

export const deleteCustomer = createAsyncThunk('customers/delete', async (id, { rejectWithValue }) => {
  try {
    await API.delete(`/customers/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete customer');
  }
});

const customerSlice = createSlice({
  name: 'customers',
  initialState: { customers: [], isLoading: false, error: null },
  reducers: {
    clearError: (state) => { state.error = null; }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => { state.isLoading = true; })
      .addCase(fetchCustomers.fulfilled, (state, action) => { state.isLoading = false; state.customers = action.payload; })
      .addCase(fetchCustomers.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(createCustomer.fulfilled, (state, action) => { state.customers.unshift(action.payload); })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.customers = state.customers.filter(c => c._id !== action.payload);
      });
  },
});

export const { clearError } = customerSlice.actions;
export default customerSlice.reducer;

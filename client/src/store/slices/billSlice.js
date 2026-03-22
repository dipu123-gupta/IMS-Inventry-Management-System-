import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

export const fetchBills = createAsyncThunk('bills/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await API.get('/bills');
    return data.bills;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch bills');
  }
});

export const createBill = createAsyncThunk('bills/create', async (billData, { rejectWithValue }) => {
  try {
    const { data } = await API.post('/bills', billData);
    return data.bill;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create bill');
  }
});

export const updateBill = createAsyncThunk('bills/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const { data: result } = await API.put(`/bills/${id}`, data);
    return result.bill;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update bill');
  }
});

export const deleteBill = createAsyncThunk('bills/delete', async (id, { rejectWithValue }) => {
  try {
    await API.delete(`/bills/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete bill');
  }
});

const billSlice = createSlice({
  name: 'bills',
  initialState: {
    bills: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    socketUpdate: (state, action) => {
      const { action: socketAction, data, bill, billId } = action.payload;
      const billData = data || bill;
      if (socketAction === 'created') {
        if (!state.bills.find(b => b._id === billData._id)) {
          state.bills.unshift(billData);
        }
      } else if (socketAction === 'updated' || socketAction === 'paid') {
        const idx = state.bills.findIndex(b => b._id === billData._id);
        if (idx !== -1) state.bills[idx] = { ...state.bills[idx], ...billData };
      } else if (socketAction === 'deleted') {
        const id = billId || action.payload._id;
        state.bills = state.bills.filter(b => b._id !== id);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBills.pending, (state) => { state.isLoading = true; })
      .addCase(fetchBills.fulfilled, (state, action) => { state.isLoading = false; state.bills = action.payload || []; })
      .addCase(fetchBills.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(createBill.fulfilled, (state, action) => { state.bills.unshift(action.payload); })
      .addCase(updateBill.fulfilled, (state, action) => {
        const idx = state.bills.findIndex(b => b._id === action.payload._id);
        if (idx !== -1) state.bills[idx] = action.payload;
      })
      .addCase(deleteBill.fulfilled, (state, action) => {
        state.bills = state.bills.filter(b => b._id !== action.payload);
      });
  },
});

export const { socketUpdate: billSocketUpdate } = billSlice.actions;
export default billSlice.reducer;

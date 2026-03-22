import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

export const fetchInvoices = createAsyncThunk('invoices/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const { data } = await API.get('/invoices', { params });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch invoices');
  }
});

export const createInvoiceFromOrder = createAsyncThunk('invoices/createFromOrder', async (orderId, { rejectWithValue }) => {
  try {
    const { data } = await API.post(`/orders/${orderId}/convert`);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to convert order to invoice');
  }
});

export const createInvoice = createAsyncThunk('invoices/create', async (data, { rejectWithValue }) => {
  try {
    const { data: result } = await API.post('/invoices', data);
    return result;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create invoice');
  }
});

export const updateInvoice = createAsyncThunk('invoices/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const { data: result } = await API.put(`/invoices/${id}`, data);
    return result;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update invoice');
  }
});

export const deleteInvoice = createAsyncThunk('invoices/delete', async (id, { rejectWithValue }) => {
  try {
    await API.delete(`/invoices/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete invoice');
  }
});

const invoiceSlice = createSlice({
  name: 'invoices',
  initialState: {
    items: [],
    total: 0,
    pages: 1,
    isLoading: false,
    error: null,
  },
  reducers: {
    invoiceSocketUpdate: (state, action) => {
      const { action: socketAction, invoice } = action.payload;
      if (socketAction === 'created') {
        const exists = state.items.find(i => i._id === invoice._id);
        if (!exists) {
          state.items = [invoice, ...state.items];
          state.total += 1;
        }
      } else if (socketAction === 'updated') {
        const index = state.items.findIndex((p) => p._id === invoice._id);
        if (index !== -1) state.items[index] = invoice;
      } else if (socketAction === 'deleted') {
        const id = action.payload.invoiceId || action.payload._id;
        state.items = state.items.filter(i => i._id !== id);
        state.total -= 1;
      }
    },
    clearInvoiceError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoices.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.invoices;
        state.total = action.payload.total;
        state.pages = action.payload.pages;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createInvoiceFromOrder.fulfilled, (state, action) => {
        state.items = [action.payload.invoice, ...state.items];
      })
      .addCase(createInvoice.fulfilled, (state, action) => {
        state.items = [action.payload.invoice, ...state.items];
        state.total += 1;
      })
      .addCase(updateInvoice.fulfilled, (state, action) => {
        const index = state.items.findIndex(i => i._id === action.payload.invoice._id);
        if (index !== -1) state.items[index] = action.payload.invoice;
      })
      .addCase(deleteInvoice.fulfilled, (state, action) => {
        state.items = state.items.filter(i => i._id !== action.payload);
        state.total -= 1;
      });
  },
});

export const { invoiceSocketUpdate, clearInvoiceError } = invoiceSlice.actions;
export default invoiceSlice.reducer;

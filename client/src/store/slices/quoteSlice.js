import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

export const fetchQuotes = createAsyncThunk('quotes/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await API.get('/quotes');
    return data.quotes;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch quotes');
  }
});

export const createQuote = createAsyncThunk('quotes/create', async (quoteData, { rejectWithValue }) => {
  try {
    const { data } = await API.post('/quotes', quoteData);
    return data.quote;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create quote');
  }
});

export const updateQuoteStatus = createAsyncThunk('quotes/updateStatus', async ({ id, status }, { rejectWithValue }) => {
  try {
    const { data } = await API.put(`/quotes/${id}/status`, { status });
    return data.quote;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update quote status');
  }
});

const quoteSlice = createSlice({
  name: 'quotes',
  initialState: {
    quotes: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    socketUpdate: (state, action) => {
      const { action: socketAction, data } = action.payload;
      switch (socketAction) {
        case 'created':
          if (!state.quotes.find(q => q._id === data._id)) {
            state.quotes.unshift(data);
          }
          break;
        case 'updated':
        case 'statusChanged':
        case 'accepted':
        case 'converted':
          const idx = state.quotes.findIndex(q => q._id === data._id);
          if (idx !== -1) state.quotes[idx] = { ...state.quotes[idx], ...data };
          break;
        default:
          break;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuotes.pending, (state) => { state.isLoading = true; })
      .addCase(fetchQuotes.fulfilled, (state, action) => { state.isLoading = false; state.quotes = action.payload || []; })
      .addCase(fetchQuotes.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(createQuote.fulfilled, (state, action) => { state.quotes.unshift(action.payload); })
      .addCase(updateQuoteStatus.fulfilled, (state, action) => {
        const idx = state.quotes.findIndex(q => q._id === action.payload._id);
        if (idx !== -1) state.quotes[idx] = action.payload;
      });
  },
});

export const { socketUpdate: quoteSocketUpdate } = quoteSlice.actions;
export default quoteSlice.reducer;

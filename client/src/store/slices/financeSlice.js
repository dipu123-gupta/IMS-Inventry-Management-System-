import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

export const fetchFinanceSummary = createAsyncThunk('finance/fetchSummary', async (params, { rejectWithValue }) => {
  try {
    const { data } = await API.get('/finance/summary', { params });
    return data.summary;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch finance summary');
  }
});

export const fetchFinanceChart = createAsyncThunk('finance/fetchChart', async (_, { rejectWithValue }) => {
  try {
    const { data } = await API.get('/finance/chart');
    return data.chartData;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch chart data');
  }
});

const financeSlice = createSlice({
  name: 'finance',
  initialState: {
    summary: null,
    chartData: [],
    isLoading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFinanceSummary.pending, (state) => { state.isLoading = true; })
      .addCase(fetchFinanceSummary.fulfilled, (state, action) => { state.isLoading = false; state.summary = action.payload; })
      .addCase(fetchFinanceSummary.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(fetchFinanceChart.fulfilled, (state, action) => { state.chartData = action.payload; });
  },
});

export default financeSlice.reducer;

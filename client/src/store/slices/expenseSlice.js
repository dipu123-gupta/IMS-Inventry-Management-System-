import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

export const fetchExpenses = createAsyncThunk('expenses/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await API.get('/expenses');
    return data.expenses;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch expenses');
  }
});

export const addExpense = createAsyncThunk('expenses/add', async (expenseData, { rejectWithValue }) => {
  try {
    const { data } = await API.post('/expenses', expenseData);
    return data.expense;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to add expense');
  }
});

export const deleteExpense = createAsyncThunk('expenses/delete', async (id, { rejectWithValue }) => {
  try {
    await API.delete(`/expenses/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete expense');
  }
});

const expenseSlice = createSlice({
  name: 'expenses',
  initialState: {
    expenses: [],
    isLoading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, (state) => { state.isLoading = true; })
      .addCase(fetchExpenses.fulfilled, (state, action) => { state.isLoading = false; state.expenses = action.payload; })
      .addCase(fetchExpenses.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(addExpense.fulfilled, (state, action) => { state.expenses.unshift(action.payload); })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.expenses = state.expenses.filter(e => e._id !== action.payload);
      });
  },
});

export default expenseSlice.reducer;

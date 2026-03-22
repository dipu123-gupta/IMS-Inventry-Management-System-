import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import productReducer from './slices/productSlice';
import vendorReducer from './slices/vendorSlice';
import orderReducer from './slices/orderSlice';
import inventoryReducer from './slices/inventorySlice';
import notificationReducer from './slices/notificationSlice';

import warehouseReducer from './slices/warehouseSlice';
import customerReducer from './slices/customerSlice';
import transferReducer from './slices/transferSlice';
import subscriptionReducer from './slices/subscriptionSlice';
import userReducer from './slices/userSlice';
import expenseReducer from './slices/expenseSlice';
import financeReducer from './slices/financeSlice';
import returnReducer from './slices/returnSlice';
import batchReducer from './slices/batchSlice';
import quoteReducer from './slices/quoteSlice';
import billReducer from './slices/billSlice';
import paymentReducer from './slices/paymentSlice';
import invoiceReducer from './slices/invoiceSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    vendors: vendorReducer,
    orders: orderReducer,
    inventory: inventoryReducer,
    notifications: notificationReducer,
    warehouses: warehouseReducer,
    customers: customerReducer,
    transfers: transferReducer,
    subscription: subscriptionReducer,
    users: userReducer,
    expenses: expenseReducer,
    finance: financeReducer,
    returns: returnReducer,
    batches: batchReducer,
    quotes: quoteReducer,
    bills: billReducer,
    payments: paymentReducer,
    invoices: invoiceReducer,
  },
});

export default store;

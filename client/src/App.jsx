import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { loadUser } from './store/slices/authSlice';
import { Toaster } from 'react-hot-toast';

// Layout
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Vendors from './pages/Vendors';
import Inventory from './pages/Inventory';
import PurchaseOrders from './pages/PurchaseOrders';
import SalesOrders from './pages/SalesOrders';
import Reports from './pages/Reports';
import ActivityLogs from './pages/ActivityLogs';
import Notifications from './pages/Notifications';
import Warehouses from './pages/Warehouses';
import Customers from './pages/Customers';
import Transfers from './pages/Transfers';
import Billing from './pages/Billing';
import Quotes from './pages/Quotes';
import Invoices from './pages/Invoices';
import Bills from './pages/Bills';
import Users from './pages/Users';
import Expenses from './pages/Expenses';
import Finance from './pages/Finance';
import Returns from './pages/Returns';
import ExpiryMonitoring from './pages/ExpiryMonitoring';
import CustomerPortal from './pages/CustomerPortal';
import VendorPortal from './pages/VendorPortal';
import PartnerDashboard from './pages/PartnerDashboard';
import TwoFactorSetup from './pages/TwoFactorSetup';

function App() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (localStorage.getItem('user')) {
      dispatch(loadUser());
    }
  }, [dispatch]);

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="vendors" element={<Vendors />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="purchase-orders" element={<PurchaseOrders />} />
          <Route path="sales-orders" element={<SalesOrders />} />
          <Route path="quotes" element={<Quotes />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="reports" element={<Reports />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="warehouses" element={<Warehouses />} />
          <Route path="customers" element={<Customers />} />
          <Route path="transfers" element={<Transfers />} />
          <Route path="billing" element={<ProtectedRoute roles={['admin', 'manager']}><Bills /></ProtectedRoute>} />
          <Route path="users" element={<ProtectedRoute roles={['admin', 'partner']}><Users /></ProtectedRoute>} />
          <Route path="expenses" element={<ProtectedRoute roles={['admin', 'manager']}><Expenses /></ProtectedRoute>} />
          <Route path="finance" element={<ProtectedRoute roles={['admin', 'manager']}><Finance /></ProtectedRoute>} />
          <Route path="returns" element={<ProtectedRoute roles={['admin', 'manager']}><Returns /></ProtectedRoute>} />
          <Route path="expiry" element={<ProtectedRoute roles={['admin', 'manager']}><ExpiryMonitoring /></ProtectedRoute>} />
          <Route path="portal/customer" element={<ProtectedRoute roles={['customer']}><CustomerPortal /></ProtectedRoute>} />
          <Route path="portal/vendor" element={<ProtectedRoute roles={['vendor']}><VendorPortal /></ProtectedRoute>} />
          <Route path="portal/partner" element={<ProtectedRoute roles={['partner']}><PartnerDashboard /></ProtectedRoute>} />
          <Route path="security" element={<ProtectedRoute><TwoFactorSetup /></ProtectedRoute>} />
          <Route path="activity-logs" element={<ProtectedRoute roles={['admin', 'manager']}><ActivityLogs /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

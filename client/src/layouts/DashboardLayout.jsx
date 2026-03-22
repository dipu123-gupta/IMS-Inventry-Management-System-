import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import socketService from '../services/socketService';
import toast from 'react-hot-toast';
import { addNotification } from '../store/slices/notificationSlice';

const DashboardLayout = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (user) {
      const socket = socketService.connect(user._id);
      
      socketService.subscribeToNotifications((notification) => {
        toast(notification.message, {
          icon: notification.type === 'error' ? '🚫' : '🔔',
          duration: 5000,
        });
        dispatch(addNotification(notification));
      });
    }

    return () => {
      socketService.disconnect();
    };
  }, [user, dispatch]);

  return (
    <div className="min-h-screen bg-base-200/30 flex">
      {/* Sidebar handles its own mobile overlay */}
      <Sidebar 
        collapsed={collapsed} 
        onToggle={() => setCollapsed(!collapsed)} 
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${collapsed ? 'lg:ml-[76px]' : 'lg:ml-64'}`}>
        <Navbar onMenuToggle={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-full overflow-x-hidden">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default DashboardLayout;

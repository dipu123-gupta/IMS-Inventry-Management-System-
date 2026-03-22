import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bell, Moon, Sun, Menu, LogOut, Settings, User as UserIcon, Search } from 'lucide-react';
import { logout } from '../store/slices/authSlice';
import { fetchNotifications, markAllAsRead } from '../store/slices/notificationSlice';
import { useEffect, useState } from 'react';

const Navbar = ({ onMenuToggle }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.notifications);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (user) dispatch(fetchNotifications({ limit: 5 }));
  }, [dispatch, user]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="bg-base-100/80 backdrop-blur-xl border-b border-base-200/60 h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 transition-all duration-300">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <button onClick={onMenuToggle} className="btn btn-ghost btn-sm btn-square lg:hidden hover:bg-base-200/50 text-base-content/70 hover:text-base-content transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex flex-col">
          <h1 className="text-lg font-extrabold tracking-tight text-base-content">
            {user?.organization?.name || 'IMS Pro'}
          </h1>
          <span className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest -mt-1">Workspace</span>
        </div>
      </div>

      {/* Center section: Global Search */}
      <div className="hidden md:flex flex-1 justify-center px-6">
        <div className="relative w-full max-w-lg">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-base-content/40" />
          </div>
          <input
            type="text"
            className="input h-9 w-full bg-base-200/50 border-base-200/60 focus:bg-base-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg pl-10 text-sm transition-all"
            placeholder="Search in Customers, Items, Orders..."
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
            <kbd className="kbd kbd-sm text-[10px] opacity-60 bg-transparent border-none">⌘</kbd>
            <kbd className="kbd kbd-sm text-[10px] opacity-60 bg-transparent border-none">K</kbd>
          </div>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1 sm:gap-3">
        {/* Theme toggle */}
        <button onClick={toggleTheme} className="btn btn-ghost btn-sm btn-circle text-base-content/70 hover:text-base-content hover:bg-base-200/50 transition-colors">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <div className="dropdown dropdown-end">
          <button tabIndex={0} className="btn btn-ghost btn-sm btn-circle indicator text-base-content/70 hover:text-base-content hover:bg-base-200/50 transition-colors">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && <span className="indicator-item badge badge-error badge-xs w-4 h-4 p-0 text-[10px] font-bold border-2 border-base-100 shadow-sm">{unreadCount}</span>}
          </button>
          <div tabIndex={0} className="dropdown-content mt-4 z-50 card card-compact w-80 bg-base-100/95 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-base-200/60 rounded-2xl overflow-hidden">
            <div className="card-body p-0">
              <div className="flex justify-between items-center bg-base-200/30 px-4 py-3 border-b border-base-200/60">
                <h3 className="font-bold text-sm tracking-tight">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={() => dispatch(markAllAsRead())} className="text-xs font-semibold text-primary hover:text-primary-focus transition-colors">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="p-4 text-center">
                {unreadCount === 0 ? (
                  <p className="text-sm font-medium text-base-content/50">You're all caught up!</p>
                ) : (
                  <p className="text-sm font-medium text-base-content/70">You have <span className="font-bold text-base-content">{unreadCount}</span> unread messages</p>
                )}
              </div>
              <div className="p-2 bg-base-200/20 border-t border-base-200/60">
                <button onClick={() => navigate('/notifications')} className="btn btn-ghost btn-sm btn-block text-xs font-bold text-base-content/70 hover:text-base-content">
                  View All Activity
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-px h-6 bg-base-200/60 mx-1 hidden sm:block"></div>

        {/* User dropdown */}
        <div className="dropdown dropdown-end">
          <button tabIndex={0} className="btn btn-ghost btn-sm h-10 px-2 hover:bg-base-200/50 transition-colors rounded-xl gap-3">
            <div className="avatar placeholder">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-sm flex items-center justify-center">
                <span className="text-xs font-bold">{user?.name?.charAt(0)?.toUpperCase()}</span>
              </div>
            </div>
            <div className="hidden sm:flex flex-col items-start leading-none gap-0.5">
              <span className="text-sm font-bold tracking-tight text-base-content">{user?.name}</span>
              <span className="text-[10px] font-bold text-base-content/50 uppercase tracking-widest leading-none">{user?.role}</span>
            </div>
          </button>
          <ul tabIndex={0} className="dropdown-content mt-4 z-50 menu p-2 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] bg-base-100/95 backdrop-blur-xl rounded-2xl w-56 border border-base-200/60 gap-1">
            <div className="px-4 py-3 border-b border-base-200/60 mb-2 sm:hidden">
               <p className="text-sm font-bold text-base-content">{user?.name}</p>
               <p className="text-[10px] font-bold text-base-content/50 uppercase tracking-widest mt-0.5">{user?.role}</p>
            </div>
            <li>
              <button className="text-sm font-medium hover:bg-base-200/50 rounded-xl py-2.5">
                <UserIcon className="w-4 h-4 opacity-50" /> Profile
              </button>
            </li>
            <li>
              <button className="text-sm font-medium hover:bg-base-200/50 rounded-xl py-2.5">
                <Settings className="w-4 h-4 opacity-50" /> Preferences
              </button>
            </li>
            <div className="h-px bg-base-200/60 my-1"></div>
            <li>
              <button onClick={handleLogout} className="text-sm font-bold text-error hover:bg-error/10 hover:text-error rounded-xl py-2.5">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

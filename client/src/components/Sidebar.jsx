import {
  LayoutDashboard,
  Box,
  ClipboardList,
  Truck,
  ShoppingCart,
  DollarSign,
  BarChart3,
  Clock,
  ChevronLeft,
  Building2,
  Users,
  ArrowRightLeft,
  Globe,
  RotateCcw,
  CalendarDays,
  ShieldCheck,
  CreditCard,
  FileText,
  Receipt,
  FileCheck,
  PackagePlus,
  ArrowDownToLine,
  ArrowUpFromLine,
  Wallet,
  History,
  X
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom'; 

const staffItems = [
  { isSection: true, label: 'Main' },
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/reports', label: 'Reports', icon: BarChart3 },

  { isSection: true, label: 'Inventory' },
  { path: '/products', label: 'Items', icon: Box },
  { path: '/inventory', label: 'Adjustments', icon: ClipboardList },
  { path: '/warehouses', label: 'Warehouses', icon: Building2 },
  { path: '/transfers', label: 'Transfers', icon: ArrowRightLeft },
  { path: '/expiry', label: 'Expiry Alerts', icon: CalendarDays, roles: ['admin', 'manager'] },

  { isSection: true, label: 'Sales' },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/quotes', label: 'Quotes', icon: FileText },
  { path: '/sales-orders', label: 'Sales Orders', icon: PackagePlus },
  { path: '/invoices', label: 'Invoices', icon: Receipt },
  { path: '/returns', label: 'Returns', icon: RotateCcw, roles: ['admin', 'manager'] },

  { isSection: true, label: 'Purchases' },
  { path: '/vendors', label: 'Vendors', icon: Truck },
  { path: '/purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
  { path: '/billing', label: 'Purchase Bills', icon: FileCheck },

  { isSection: true, label: 'Banking & Finance' },
  { path: '/finance', label: 'Dashboard', icon: Wallet, roles: ['admin', 'manager'] },
  { path: '/expenses', label: 'Expenses', icon: DollarSign, roles: ['admin', 'manager'] },

  { isSection: true, label: 'Administration' },
  { path: '/users', label: 'Users & Roles', icon: Users, roles: ['admin'] },
  { path: '/activity-logs', label: 'Activity Logs', icon: Clock, roles: ['admin', 'manager'] },
  { path: '/security', label: 'Security', icon: ShieldCheck },
];

const customerItems = [
  { path: '/portal/customer', label: 'Customer Portal', icon: LayoutDashboard },
];

const vendorItems = [
  { path: '/portal/vendor', label: 'Vendor Portal', icon: LayoutDashboard },
];

const partnerItems = [
  { path: '/portal/partner', label: 'Partner Dashboard', icon: Globe },
];

const Sidebar = ({ collapsed, onToggle, mobileOpen, setMobileOpen }) => {
  const { user } = useSelector((state) => state.auth);

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-base-300/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`bg-base-100 h-screen fixed top-0 left-0 z-50 flex flex-col border-r border-base-200/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'} 
          ${collapsed ? 'lg:w-[76px]' : 'lg:w-64'}
        `}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 h-16 border-b border-base-200/50 flex-shrink-0 transition-all duration-300 ${collapsed ? 'px-0 justify-center' : 'px-5 justify-between'}`}>
          <div className="flex flex-1 items-center gap-3 w-full justify-center lg:justify-start">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-black text-sm shadow-md shrink-0 ${collapsed && 'mx-auto'}`}>
              {user?.organization?.name?.[0]?.toUpperCase() || 'I'}
            </div>
            {!collapsed && (
              <div className="flex flex-col overflow-hidden whitespace-nowrap opacity-100 transition-opacity duration-300">
                <span className="text-[15px] font-extrabold tracking-tight text-base-content truncate">
                  {user?.organization?.name || 'IMS Pro'}
                </span>
              </div>
            )}
          </div>
          
          {/* Mobile close button */}
          {!collapsed && (
            <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1.5 text-base-content/50 hover:bg-base-200/50 hover:text-base-content rounded-lg">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 space-y-1.5 custom-scrollbar">
          {(() => {
            let items = staffItems;
            if (user?.role === 'customer') items = customerItems;
            if (user?.role === 'vendor') items = vendorItems;
            if (user?.role === 'partner') items = partnerItems;

            return items.map((item, index) => {
              if (item.roles && !item.roles.includes(user?.role)) return null;

              if (item.isSection) {
                if (collapsed) {
                  return <div key={`sec-${index}`} className="my-2 h-px bg-base-200/50 w-full" />;
                }
                return (
                  <div key={`sec-${index}`} className="px-5 pt-5 pb-1 text-[11px] font-bold text-base-content/40 uppercase tracking-widest leading-none">
                    {item.label}
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 group relative ${
                      collapsed ? 'justify-center px-0' : 'px-4'
                    } ${
                      isActive
                        ? 'bg-indigo-50/70 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                        : 'text-base-content/60 hover:bg-base-200/40 hover:text-base-content'
                    }`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 dark:bg-indigo-500 rounded-r-full ${collapsed ? 'hidden lg:block' : 'block'}`} />
                      )}
                      <item.icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-base-content/40 group-hover:text-base-content/70'}`} strokeWidth={isActive ? 2.5 : 2} />
                      {!collapsed && <span className="truncate tracking-wide">{item.label}</span>}
                    </>
                  )}
                </NavLink>
              );
            });
          })()}
        </nav>

        {/* Collapse toggle (Desktop only) */}
        <div className="p-4 border-t border-base-200/50 flex-shrink-0 hidden lg:block">
          <button
            onClick={onToggle}
            className="flex items-center justify-center w-full h-10 rounded-xl bg-base-200/30 hover:bg-base-200/60 text-base-content/50 hover:text-base-content transition-colors"
          >
            <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

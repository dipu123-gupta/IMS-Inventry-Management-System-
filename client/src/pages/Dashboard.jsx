import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Package, ShoppingCart, DollarSign, AlertCircle, TrendingUp, Inbox, BarChart2, Activity, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import socketService from '../services/socketService';
import { DashboardSkeleton } from '../components/Skeleton';
import { useSelector } from 'react-redux';
import { formatCurrency, formatDate } from '../utils/format';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']; // Indigo, Emerald, Amber, Red, Violet

const CustomTooltip = ({ active, payload, label, organization }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-base-100/90 backdrop-blur-md border border-base-200 p-4 rounded-xl shadow-xl">
        <p className="text-sm font-bold text-base-content mb-2">{label}</p>
        <p className="text-sm font-bold text-primary">
          Revenue: {formatCurrency(payload[0].value, organization)}
        </p>
      </div>
    );
  }
  return null;
};

const StatCard = ({ title, value, icon: Icon, colorClass, sub, trend }) => (
  <div className="relative bg-base-100/60 backdrop-blur-xl border border-base-200/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 overflow-hidden group flex flex-col justify-between">
    <div className={`absolute -right-8 -top-8 w-40 h-40 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500 rounded-full ${colorClass.replace('text-', 'bg-')}`}></div>
    
    <div className="flex justify-between items-start mb-6 z-10 w-full relative">
       <div className={`p-3.5 rounded-2xl ${colorClass.replace('text-', 'bg-').replace('/10', '/15')} text-current bg-opacity-10 shadow-inner`}>
         <Icon className={`w-6 h-6 ${colorClass}`} />
       </div>
       {trend && (
         <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-sm ${trend > 0 ? 'bg-success/15 text-success-content dark:text-success' : 'bg-error/15 text-error-content dark:text-error'}`}>
           <TrendingUp className={`w-3.5 h-3.5 ${trend < 0 ? 'rotate-180' : ''}`} /> {Math.abs(trend)}%
         </div>
       )}
    </div>
    
    <div className="z-10 space-y-1.5 relative">
      <h3 className="text-4xl font-extrabold tracking-tight text-base-content">{value}</h3>
      <p className="text-sm font-semibold text-base-content/60 uppercase tracking-widest">{title}</p>
      {sub && <p className="text-xs text-base-content/40 mt-1 font-medium">{sub}</p>}
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useSelector((s) => s.auth);
  const organization = user?.organization;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('disconnected');

  const load = async () => {
    try {
      const { data: d } = await API.get('/reports/dashboard');
      setData(d);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

    const unsubscribeStatus = socketService.onStatusChange((status) => {
      setSyncStatus(status);
    });

    // Subscribe to dashboard refresh triggers
    const unsubscribeDashboard = socketService.onDashboardUpdate(() => {
      console.log('[Realtime] Dashboard refresh triggered');
      load(); // Re-fetch all aggregates for accuracy
    });

    // Ensure org room is joined
    if (user?.organization?._id || user?.organization) {
      socketService.joinOrg(user?.organization?._id || user?.organization);
    }

    return () => {
      unsubscribeStatus();
      unsubscribeDashboard();
    };
  }, [user]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  const stats = data?.stats || {};

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-base-content">Dashboard</h1>
          <p className="text-base-content/60 text-sm font-medium mt-1">Enterprise Analytics & Inventory Decision Center</p>
        </div>
        <div className="flex items-center gap-3">
           <div className={`badge badge-lg gap-2 text-xs font-bold py-4 px-4 transition-all duration-500 rounded-xl border-0 ${syncStatus === 'connected' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
             <div className={`w-2.5 h-2.5 rounded-full ${syncStatus === 'connected' ? 'bg-success animate-pulse' : 'bg-error'}`}></div> 
             {syncStatus === 'connected' ? 'Realtime Sync On' : 'Sync Disconnected'}
           </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap items-center gap-3 bg-base-100/60 p-4 border border-base-200/60 rounded-2xl shadow-sm backdrop-blur-md">
        <span className="text-xs font-bold text-base-content/50 uppercase tracking-widest mr-2">Quick Creates:</span>
        <Link to="/products" className="btn btn-sm bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border-none shadow-none rounded-lg font-bold transition-all">
          <Plus className="w-4 h-4" /> New Item
        </Link>
        <Link to="/sales-orders" className="btn btn-sm bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-none shadow-none rounded-lg font-bold transition-all">
          <Plus className="w-4 h-4" /> Sales Order
        </Link>
        <Link to="/purchase-orders" className="btn btn-sm bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-none shadow-none rounded-lg font-bold transition-all">
          <Plus className="w-4 h-4" /> Purchase Order
        </Link>
        <Link to="/billing" className="btn btn-sm bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-purple-700 dark:text-purple-400 border-none shadow-none rounded-lg font-bold transition-all">
          <Plus className="w-4 h-4" /> Invoice
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Products" value={stats.totalProducts || 0} icon={Package} colorClass="text-indigo-500" trend={12} />
        <StatCard title="Active Orders" value={stats.totalOrders || 0} icon={ShoppingCart} colorClass="text-emerald-500" trend={-4} />
        <StatCard title="Gross Revenue" value={formatCurrency(stats.totalRevenue, organization)} icon={DollarSign} colorClass="text-blue-500" trend={28} />
        <StatCard title="Low Stock Items" value={stats.lowStockCount || 0} icon={AlertCircle} 
          colorClass={stats.lowStockCount > 0 ? 'text-rose-500' : 'text-slate-400'}
          sub={stats.lowStockCount > 0 ? 'Requires attention' : 'All levels optimized'} />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card bg-base-100 border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl">
          <div className="card-body p-6 sm:p-8">
            <div className="flex items-center justify-between mb-8">
               <h3 className="card-title text-xl font-extrabold tracking-tight flex items-center gap-2"><BarChart2 className="w-5 h-5 text-indigo-500" /> Sales Performance</h3>
               <select className="select select-sm select-bordered font-bold text-xs rounded-lg shadow-sm">
                 <option>Last 30 Days</option>
                 <option>Last Quarter</option>
                 <option>This Year</option>
               </select>
            </div>
            <div className="h-[320px] w-full min-h-[320px] relative">
              {data?.monthlySales?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.monthlySales}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.15} />
                    <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#888', fontWeight: 600}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#888', fontWeight: 600}} dx={-10} tickFormatter={(val) => formatCurrency(val, organization)} />
                    <Tooltip content={<CustomTooltip organization={organization} />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '5 5' }} />
                    <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-base-content/30 italic">
                  <TrendingUp className="w-12 h-12 mb-2 opacity-20" />
                  <p>No sales data to display</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card bg-base-100 border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl">
          <div className="card-body p-6 sm:p-8">
            <h3 className="card-title text-xl font-extrabold tracking-tight flex items-center gap-2 mb-2"><Inbox className="w-5 h-5 text-emerald-500" /> Inventory Distribution</h3>
            <div className="h-[320px] w-full min-h-[320px] flex items-center justify-center relative">
               {data?.topProducts?.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={data.topProducts.slice(0, 5).map(p => ({ name: p.name, value: p.totalSold }))}
                       cx="50%" cy="50%"
                       innerRadius={70}
                       outerRadius={95}
                       paddingAngle={5}
                       dataKey="value"
                       stroke="none"
                     >
                       {COLORS.map((color, index) => (
                         <Cell key={`cell-${index}`} fill={color} />
                       ))}
                     </Pie>
                     <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} itemStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                   </PieChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="flex flex-col items-center justify-center text-base-content/30 italic">
                   <Inbox className="w-12 h-12 mb-2 opacity-20" />
                   <p>No distribution data</p>
                 </div>
               )}
               {data?.topProducts?.length > 0 && (
                 <div className="absolute text-center flex flex-col items-center justify-center pointer-events-none">
                   <p className="text-[10px] font-bold text-base-content/50 uppercase tracking-widest">Total Sales</p>
                   <p className="text-3xl font-black text-base-content tracking-tight">{data.topProducts.reduce((acc, p) => acc + p.totalSold, 0)}</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Table */}
        <div className="card bg-base-100 border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl">
          <div className="card-body p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="card-title text-lg font-extrabold tracking-tight">Top Performing Products</h3>
              <button className="btn btn-sm btn-ghost text-xs shadow-none">View All</button>
            </div>
            {data?.topProducts?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr className="border-base-200 text-base-content/60">
                      <th className="font-bold uppercase tracking-wider text-xs">Product</th>
                      <th className="font-bold uppercase tracking-wider text-xs text-right">Units Sold</th>
                      <th className="font-bold uppercase tracking-wider text-xs text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProducts.map((p, i) => (
                      <tr key={i} className="border-base-200/50 hover:bg-base-200/30 transition-colors">
                        <td className="font-semibold text-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-base-200 flex items-center justify-center text-xs">📦</div>
                            {p.name}
                          </div>
                        </td>
                        <td className="text-right font-medium">{p.totalSold}</td>
                        <td className="text-right font-bold text-base-content">{formatCurrency(p.revenue, organization)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-base-content/40">
                <Package className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">No sales data available yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="card bg-base-100 border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl">
          <div className="card-body p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="card-title text-lg font-extrabold tracking-tight">Recent Activity Log</h3>
              <button className="btn btn-sm btn-ghost text-xs shadow-none">View All</button>
            </div>
            {data?.recentLogs?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr className="border-base-200 text-base-content/60">
                      <th className="font-bold uppercase tracking-wider text-xs">Action</th>
                      <th className="font-bold uppercase tracking-wider text-xs">Product</th>
                      <th className="font-bold uppercase tracking-wider text-xs text-right">Qty</th>
                      <th className="font-bold uppercase tracking-wider text-xs text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentLogs.map((log) => (
                      <tr key={log._id} className="border-base-200/50 hover:bg-base-200/30 transition-colors">
                        <td>
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            log.type === 'in' ? 'bg-success/15 text-success' : 
                            log.type === 'out' || log.type === 'out-bound' ? 'bg-error/15 text-error' : 
                            'bg-warning/15 text-warning'
                          }`}>
                            {log.type}
                          </span>
                        </td>
                        <td className="font-medium text-sm truncate max-w-[150px]">{log.product?.name || 'N/A'}</td>
                        <td className="text-right font-bold">{log.quantity}</td>
                        <td className="text-right text-xs text-base-content/50 font-medium">
                          {formatDate(log.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-base-content/40">
                <Activity className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">No recent activity found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

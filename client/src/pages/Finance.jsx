import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFinanceSummary, fetchFinanceChart } from '../store/slices/financeSlice';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Banknote, PieChart, Calendar } from 'lucide-react';
import { CardSkeleton } from '../components/Skeleton';
import { formatCurrency } from '../utils/format';
import socketService from '../services/socketService';

const Finance = () => {
  const dispatch = useDispatch();
  const { summary, chartData, isLoading } = useSelector((state) => state.finance);
  const { user } = useSelector((state) => state.auth);
  const organization = user?.organization;
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    const loadData = () => {
      dispatch(fetchFinanceSummary(dateRange));
      dispatch(fetchFinanceChart());
    };

    loadData();

    // Subscribe to real-time updates
    const unsubscribe = socketService.onDashboardUpdate(() => {
      console.log('[Realtime] Finance page refresh triggered');
      loadData();
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [dispatch, dateRange]);

  const stats = [
    { label: 'Total Revenue', value: summary?.totalRevenue || 0, icon: TrendingUp, color: 'text-success', bg: 'bg-success/15' },
    { label: 'Total Expenses', value: summary?.totalExpenses || 0, icon: TrendingDown, color: 'text-error', bg: 'bg-error/15' },
    { label: 'Cost of Goods', value: summary?.cogs || 0, icon: Banknote, color: 'text-warning', bg: 'bg-warning/15' },
    { label: 'Net Profit', value: summary?.netProfit || 0, icon: PieChart, color: 'text-primary', bg: 'bg-primary/15 border-primary/20 bg-gradient-to-br from-primary/20 to-primary/5' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-base-content">Financial Analytics</h1>
          <p className="text-base-content/60 text-sm font-medium mt-1">Profit & Loss and Net Performance Overview</p>
        </div>
        <div className="flex items-center gap-3 bg-base-100/50 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-base-200/60">
           <div className="pl-3 text-base-content/40">
             <Calendar className="w-4 h-4" />
           </div>
           <input 
             type="date" 
             className="bg-base-200/50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 py-2 px-3 transition-all" 
             onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
           />
           <span className="text-base-content/30 font-bold">-</span>
           <input 
             type="date" 
             className="bg-base-200/50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 py-2 px-3 transition-all mr-1" 
             onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
           />
        </div>
      </div>

      {isLoading && !summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={stat.label} className={`card bg-base-100 border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] relative overflow-hidden ${i === 3 ? 'border-primary/20 ring-1 ring-primary/10' : ''}`}>
                <div className="card-body p-6">
                  <div className="flex items-center justify-between">
                    <div className={`p-3.5 rounded-2xl ${stat.bg} ${stat.color} shadow-sm`}>
                      <stat.icon className="w-6 h-6" strokeWidth={2.5} />
                    </div>
                    <span className="text-2xl font-black tracking-tight">{formatCurrency(stat.value, organization)}</span>
                  </div>
                  <p className="text-[11px] font-extrabold text-base-content/50 mt-5 uppercase tracking-widest">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue vs Expense Area Chart */}
            <div className="card bg-base-100 border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-extrabold tracking-tight">Revenue vs Expenses</h3>
                <span className="badge badge-success badge-sm badge-outline font-bold">Trend</span>
              </div>
              <div className="h-[300px] w-full min-h-[300px] relative">
                {chartData?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" strokeOpacity={0.5} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }} dx={-10} tickFormatter={(value) => formatCurrency(value, organization)} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                        itemStyle={{ fontWeight: 700, fontSize: '12px' }}
                        labelStyle={{ color: '#6b7280', fontSize: '11px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase' }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                      <Area type="monotone" dataKey="expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-base-content/30 italic">
                    <TrendingUp className="w-12 h-12 mb-2 opacity-20" />
                    <p>No financial data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Profit Performance Bar Chart */}
            <div className="card bg-base-100 border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-extrabold tracking-tight">Net Profit Performance</h3>
                <span className="badge badge-primary badge-sm badge-outline font-bold">Monthly</span>
              </div>
              <div className="h-[300px] w-full min-h-[300px] relative">
                {chartData?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" strokeOpacity={0.5} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }} dx={-10} tickFormatter={(value) => formatCurrency(value, organization)} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                        contentStyle={{ borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                        itemStyle={{ fontWeight: 700, fontSize: '12px', color: '#6366f1' }}
                        labelStyle={{ color: '#6b7280', fontSize: '11px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase' }}
                      />
                      <Bar dataKey="profit" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-base-content/30 italic">
                    <PieChart className="w-12 h-12 mb-2 opacity-20" />
                    <p>No performance data</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Margin Overview Card */}
          <div className="card bg-gradient-to-br from-primary to-primary/80 text-primary-content shadow-xl rounded-3xl overflow-hidden relative">
            <div className="absolute -top-10 -right-10 p-8 opacity-10 transform rotate-12">
                <PieChart className="w-64 h-64" />
            </div>
            <div className="card-body p-8 sm:p-10 relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="max-w-md">
                      <h3 className="text-3xl font-black mb-2 shadow-sm">Organization Margin Health</h3>
                      <p className="text-primary-content/80 font-medium leading-relaxed">Based on recent sales and overhead logs. Monitor your gross and net margins closely to optimize profitability.</p>
                  </div>
                  <div className="flex flex-wrap gap-8 sm:gap-16">
                      <div className="text-center bg-black/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 min-w-[140px]">
                        <p className="text-5xl font-black tracking-tighter">
                            {summary?.totalRevenue ? (((summary.grossProfit) / summary.totalRevenue) * 100).toFixed(1) : 0}<span className="text-3xl font-bold opacity-70">%</span>
                        </p>
                        <p className="text-[10px] uppercase font-bold text-primary-content/70 tracking-widest mt-3">Gross Margin</p>
                      </div>
                      <div className="text-center bg-black/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 min-w-[140px]">
                        <p className="text-5xl font-black tracking-tighter">
                            {summary?.totalRevenue ? ((summary.netProfit / summary.totalRevenue) * 100).toFixed(1) : 0}<span className="text-3xl font-bold opacity-70">%</span>
                        </p>
                        <p className="text-[10px] uppercase font-bold text-primary-content/70 tracking-widest mt-3">Net Margin</p>
                      </div>
                  </div>
                </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Finance;

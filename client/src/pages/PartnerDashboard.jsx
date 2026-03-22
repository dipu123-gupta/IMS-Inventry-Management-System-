import { useEffect, useState } from 'react';
import { Building2, Users, DollarSign, TrendingUp, Globe, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import API from '../services/api';
import toast from 'react-hot-toast';

const PartnerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, orgsRes] = await Promise.all([
          API.get('/partner/stats'),
          API.get('/partner/organizations')
        ]);
        setStats(statsRes.data);
        setOrgs(orgsRes.data.organizations);
      } catch (err) {
        toast.error('Failed to load platform analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
        <span className="loading loading-spinner text-primary loading-lg mb-4"></span>
        <p className="font-bold text-base-content/60 tracking-wider uppercase text-sm animate-pulse">Analysing platform metrics...</p>
    </div>
  );

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 bg-base-100/50 backdrop-blur-xl p-6 rounded-3xl border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <Globe className="w-6 h-6 animate-[spin_10s_linear_infinite]" /> 
            </div>
            Partner Dashboard
          </h1>
          <p className="text-base-content/50 mt-2 uppercase text-xs tracking-widest font-extrabold">Platform-wide Intelligence</p>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-base-100 border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all rounded-3xl overflow-hidden relative group">
          <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
             <Building2 className="w-32 h-32 text-primary" />
          </div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center text-primary shadow-sm border border-primary/10">
              <Building2 className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[11px] uppercase font-extrabold tracking-widest text-base-content/50 mb-1">Total Tenants</p>
              <h2 className="text-4xl font-black">{stats?.stats?.organizations || 0}</h2>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all rounded-3xl overflow-hidden relative group">
           <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
             <DollarSign className="w-32 h-32 text-success" />
          </div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-success/15 flex items-center justify-center text-success shadow-sm border border-success/10">
              <DollarSign className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[11px] uppercase font-extrabold tracking-widest text-base-content/50 mb-1">Gross Revenue</p>
              <h2 className="text-4xl font-black text-success">${stats?.stats?.revenue?.toLocaleString() || 0}</h2>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all rounded-3xl overflow-hidden relative group">
           <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
             <Users className="w-32 h-32 text-info" />
          </div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-info/15 flex items-center justify-center text-info shadow-sm border border-info/10">
              <Users className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[11px] uppercase font-extrabold tracking-widest text-base-content/50 mb-1">Active Users</p>
              <h2 className="text-4xl font-black">{stats?.stats?.users || 0}</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Growth Chart */}
        <div className="card bg-base-100 border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 rounded-3xl">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
              Tenant Acquisition Growth
            </h3>
            <span className="badge badge-primary badge-sm badge-outline font-bold"><TrendingUp className="w-3 h-3 mr-1" /> Trend</span>
          </div>
          <div className="h-72 w-full min-h-[288px] relative">
            {stats?.growth?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.growth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                     <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#818cf8" />
                        <stop offset="100%" stopColor="#4f46e5" />
                     </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" strokeOpacity={0.5} />
                  <XAxis dataKey="_id.month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }} dy={10} tickFormatter={(m) => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }} dx={-10} />
                  <Tooltip 
                     contentStyle={{ borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                     itemStyle={{ fontWeight: 800, fontSize: '14px', color: '#4f46e5' }}
                     labelStyle={{ color: '#6b7280', fontSize: '11px', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="url(#lineGrad)" strokeWidth={4} dot={{ r: 5, fill: '#fff', strokeWidth: 3, stroke: '#4f46e5' }} activeDot={{ r: 8, fill: '#4f46e5', stroke: '#fff', strokeWidth: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-base-content/30 italic">
                <TrendingUp className="w-12 h-12 mb-2 opacity-20" />
                <p>No growth data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Organizations Table */}
        <div className="card bg-base-100 border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-base-200/60 flex justify-between items-center bg-base-200/30">
            <h3 className="font-extrabold text-xl tracking-tight flex items-center gap-2">Platform Entities</h3>
            <span className="badge badge-primary font-bold shadow-sm">{orgs.length} Registered</span>
          </div>
          <div className="overflow-x-auto max-h-[350px]">
            <table className="table w-full">
              <thead className="sticky top-0 bg-base-200/90 backdrop-blur-md z-10 shadow-sm">
                <tr className="font-bold text-base-content/60 uppercase tracking-wider text-[11px]">
                  <th className="px-6 py-4">Organization</th>
                  <th className="px-6 py-4">Domain</th>
                  <th className="px-6 py-4 text-center">Joined</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200/50">
                {orgs.map(org => (
                  <tr key={org._id} className="hover:bg-base-200/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-sm tracking-tight">{org.name}</td>
                    <td className="px-6 py-4">
                        <span className="text-[11px] font-mono font-bold bg-base-200 px-2 py-1 rounded-md text-base-content/70 border border-base-300 shadow-sm">{org.domain}</span>
                    </td>
                    <td className="px-6 py-4 text-center text-[11px] font-bold text-base-content/50 uppercase tracking-widest">{new Date(org.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-extrabold rounded-lg tracking-wider border border-success/20 bg-success/15 text-success-content dark:text-success uppercase shadow-sm">
                          <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerDashboard;

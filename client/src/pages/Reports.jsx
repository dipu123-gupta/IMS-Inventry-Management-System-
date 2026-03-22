import { useState, useEffect } from 'react';
import { 
  Download, FileText, Database, TrendingUp, Package, 
  Warehouse, AlertTriangle, ChartBar, PieChart as PieIcon 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import API from '../services/api';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308'];
import { DashboardSkeleton } from '../components/Skeleton';

const Reports = () => {
  const [downloading, setDownloading] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categoryData, setCategoryData] = useState({ inventory: [], sales: [] });
  const [warehouseData, setWarehouseData] = useState([]);
  const [velocityData, setVelocityData] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [catRes, warRes, velRes] = await Promise.all([
        API.get('/reports/category-analysis'),
        API.get('/reports/warehouse-performance'),
        API.get('/reports/velocity')
      ]);
      setCategoryData(catRes.data);
      setWarehouseData(warRes.data);
      setVelocityData(velRes.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytical data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (entity, format) => {
    try {
      const id = `${entity}-${format}`;
      setDownloading(id);
      const res = await API.get(`/exports/${format}/${entity}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${entity}-export-${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`${entity} exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export data');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/5 via-base-100 to-base-100 backdrop-blur-xl p-8 rounded-[2rem] border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent italic">Analytics Hub</h1>
          <p className="text-base-content/60 text-lg font-semibold mt-2">Deep insights into categories, locations, and forecasting</p>
        </div>
        <div className="flex gap-2">
           <button onClick={fetchAnalytics} className="btn btn-ghost btn-circle shadow-sm border border-base-200">
             <TrendingUp className="w-5 h-5 text-primary" />
           </button>
           <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 shadow-inner">
             <ChartBar className="w-8 h-8 text-primary" strokeWidth={2.5} />
           </div>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Sales by Category */}
        <div className="card bg-base-100 shadow-xl border border-base-200/50 rounded-[2.5rem] overflow-hidden">
          <div className="card-body p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-secondary/10 rounded-xl text-secondary">
                <PieIcon className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Revenue by Category</h2>
            </div>
            <div className="h-[300px] w-full min-h-[300px] relative">
              {categoryData.sales?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData.sales}
                      dataKey="revenue"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={60}
                      paddingAngle={5}
                      label
                    >
                      {categoryData.sales.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-base-content/30 italic">
                  <PieIcon className="w-12 h-12 mb-2 opacity-20" />
                  <p>No revenue data</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Warehouse Stock Distribution */}
        <div className="card bg-base-100 shadow-xl border border-base-200/50 rounded-[2.5rem] overflow-hidden">
          <div className="card-body p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                <Warehouse className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Stock by Location</h2>
            </div>
            <div className="h-[300px] w-full min-h-[300px] relative">
              {warehouseData?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={warehouseData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} style={{ fontWeight: 600 }} />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="totalQuantity" radius={[0, 10, 10, 0]} fill="url(#barGradient)">
                      {warehouseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-base-content/30 italic">
                  <Warehouse className="w-12 h-12 mb-2 opacity-20" />
                  <p>No location data</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Inventory Value by Category */}
        <div className="card bg-base-100 shadow-xl border border-base-200/50 rounded-[2.5rem] lg:col-span-2 overflow-hidden">
          <div className="card-body p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-accent/10 rounded-xl text-accent">
                <Package className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Inventory Value breakdown</h2>
            </div>
            <div className="h-[350px] w-full min-h-[350px] relative">
              {categoryData.inventory?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData.inventory}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="_id" axisLine={false} tickLine={false} style={{ fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(value) => [`$${value.toLocaleString()}`, 'Total Value']}
                    />
                    <Bar dataKey="inventoryValue" radius={[10, 10, 0, 0]} fill="#6366f1" barSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-base-content/30 italic">
                  <Package className="w-12 h-12 mb-2 opacity-20" />
                  <p>No inventory value data</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Forecasting & Velocity Table */}
        <div className="card bg-base-100 shadow-xl border border-base-200/50 rounded-[2.5rem] lg:col-span-2 overflow-hidden">
          <div className="card-body p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-warning/10 rounded-xl text-warning">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Inventory Forecasting (30d Velocity)</h2>
              </div>
              <div className="badge badge-outline border-base-300 font-bold p-3">Top At-Risk Items</div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr className="border-b border-base-200 text-base-content/50">
                    <th className="bg-transparent font-bold">Product</th>
                    <th className="bg-transparent font-bold">SKU</th>
                    <th className="bg-transparent font-bold">Current Stock</th>
                    <th className="bg-transparent font-bold">Avg. Daily Sales</th>
                    <th className="bg-transparent font-bold">Est. Run-out Date</th>
                    <th className="bg-transparent font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="font-semibold text-sm">
                  {velocityData.slice(0, 10).map((item, idx) => {
                    const runOutDays = Math.round(item.daysOfStockRemaining);
                    const runOutDate = new Date();
                    runOutDate.setDate(runOutDate.getDate() + runOutDays);
                    
                    return (
                      <tr key={idx} className="hover:bg-base-200/40 transition-colors">
                        <td>{item.name}</td>
                        <td className="font-mono text-xs opacity-60">{item.sku}</td>
                        <td>{item.currentStock}</td>
                        <td className="text-primary">{item.avgDailyVelocity.toFixed(2)} / day</td>
                        <td>{runOutDays > 365 ? '365+ Days' : runOutDate.toLocaleDateString()}</td>
                        <td>
                          <div className={`badge badge-sm font-bold ${
                            runOutDays < 7 ? 'badge-error' : runOutDays < 30 ? 'badge-warning' : 'badge-success'
                          }`}>
                            {runOutDays < 7 ? 'CRITICAL' : runOutDays < 30 ? 'REORDER' : 'HEALTHY'}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Existing Export Section */}
      <div className="pt-8 border-t border-base-200/60">
        <h2 className="text-2xl font-black mb-8 italic">Data Management & Exports</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ExportCard 
            title="Product Catalog" 
            entity="products"
            description="Full inventory snapshot including costs, pricing and categories."
            icon={FileText}
          />
          <ExportCard 
            title="Sales History" 
            entity="orders"
            description="Complete record of all sales and purchase transactions."
            icon={TrendingUp}
          />
          <ExportCard 
            title="Stock Logs" 
            entity="inventory"
            description="Detailed audit trail of all warehouse movements and adjustments."
            icon={Database}
          />
        </div>
      </div>
    </div>
  );

  function ExportCard({ title, description, entity, icon: Icon }) {
    return (
      <div className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all rounded-3xl overflow-hidden group">
        <div className="card-body p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/5 rounded-xl group-hover:scale-110 transition-transform">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-bold">{title}</h3>
          </div>
          <p className="text-xs text-base-content/60 mb-6 min-h-[32px]">{description}</p>
          <div className="flex gap-2 justify-end">
            <button 
              onClick={() => handleDownload(entity, 'json')}
              className="btn btn-ghost btn-xs rounded-lg font-bold"
              disabled={downloading === `${entity}-json`}
            >
              JSON
            </button>
            <button 
              onClick={() => handleDownload(entity, 'csv')}
              className="btn btn-primary btn-xs rounded-lg font-bold"
              disabled={downloading === `${entity}-csv`}
            >
              CSV
            </button>
          </div>
        </div>
      </div>
    );
  }
};

export default Reports;

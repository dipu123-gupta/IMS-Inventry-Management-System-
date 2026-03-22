import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInventoryLogs, fetchLowStock, adjustStock, inventorySocketUpdate } from '../store/slices/inventorySlice';
import useRealtimeSync from '../hooks/useRealtimeSync';
import { AlertTriangle, SlidersHorizontal, PackageSearch, History, ArrowDownRight, ArrowUpRight, Box } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '../utils/format';
import API from '../services/api';
import { fetchWarehouses } from '../store/slices/warehouseSlice';

import { TableSkeleton } from '../components/Skeleton';

const Inventory = () => {
  const dispatch = useDispatch();
  const { logs, lowStockItems, total, pages, isLoading } = useSelector((s) => s.inventory);
  const [currentPage, setCurrentPage] = useState(1);
  const [tab, setTab] = useState('stock'); // stock | logs
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ productId: '', warehouseId: '', type: 'in', quantity: '', reason: '' });
  const [products, setProducts] = useState([]);
  const { warehouses } = useSelector((s) => s.warehouses);

  // Real-time synchronization
  useRealtimeSync('inventory', inventorySocketUpdate);

  useEffect(() => {
    dispatch(fetchLowStock());
    dispatch(fetchInventoryLogs({ page: currentPage, limit: 20 }));
    dispatch(fetchWarehouses());
  }, [dispatch, currentPage]);

  useEffect(() => {
    if (showAdjust && products.length === 0) {
      API.get('/products?limit=100').then(({ data }) => setProducts(data.products || [])).catch(() => {});
    }
  }, [showAdjust, products.length]);

  const handleAdjust = async (e) => {
    e.preventDefault();
    try {
      await dispatch(adjustStock({ ...adjustForm, quantity: Number(adjustForm.quantity) })).unwrap();
      toast.success('Stock adjusted');
      setShowAdjust(false);
      dispatch(fetchLowStock());
      dispatch(fetchInventoryLogs({ page: 1, limit: 20 }));
    } catch (err) {
      toast.error(err || 'Failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-base-content">Inventory Management</h1>
          <p className="text-base-content/60 text-sm font-medium mt-1">Real-time stock tracking across all locations</p>
        </div>
        <button onClick={() => setShowAdjust(true)} className="btn btn-primary rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all font-bold tracking-wide gap-2">
          <SlidersHorizontal className="w-5 h-5" strokeWidth={2.5} /> Adjust Stock
        </button>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="alert bg-warning/15 border border-warning/30 text-warning-content shadow-sm rounded-2xl flex items-center p-4">
          <AlertTriangle className="w-6 h-6 text-warning flex-shrink-0" />
          <span className="font-semibold text-warning-content dark:text-warning ml-2"><strong>{lowStockItems.length}</strong> product(s) are running critically low on stock!</span>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-base-200/50 border border-base-200/60 p-1.5 rounded-2xl w-fit shadow-sm">
        <button 
          className={`tab tab-sm md:tab-md font-bold rounded-xl transition-all h-10 px-6 gap-2 ${tab === 'stock' ? 'tab-active !bg-base-100 !text-primary shadow-[0_2px_10px_rgb(0,0,0,0.06)] ring-1 ring-base-200/60' : 'text-base-content/60 hover:text-base-content'}`} 
          onClick={() => setTab('stock')}
        >
          <PackageSearch className={`w-4 h-4 ${tab === 'stock' ? 'text-primary' : ''}`} /> Low Stock
        </button>
        <button 
          className={`tab tab-sm md:tab-md font-bold rounded-xl transition-all h-10 px-6 gap-2 ${tab === 'logs' ? 'tab-active !bg-base-100 !text-primary shadow-[0_2px_10px_rgb(0,0,0,0.06)] ring-1 ring-base-200/60' : 'text-base-content/60 hover:text-base-content'}`} 
          onClick={() => setTab('logs')}
        >
          <History className={`w-4 h-4 ${tab === 'logs' ? 'text-primary' : ''}`} /> Stock History
        </button>
      </div>

      {tab === 'stock' ? (
        isLoading ? (
          <div className="card bg-base-100 border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6">
            <TableSkeleton rows={5} cols={5} />
          </div>
        ) : lowStockItems.length === 0 ? (
          <div className="card bg-base-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-base-200/60 py-24 flex flex-col items-center justify-center text-center space-y-4 rounded-3xl">
            <div className="w-24 h-24 bg-success/15 rounded-full flex items-center justify-center mb-2 ring-4 ring-success/5">
              <Box className="w-12 h-12 text-success/70" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold tracking-tight text-success">All levels optimized</h3>
              <p className="text-base-content/50 font-medium max-w-sm mx-auto mt-2 leading-relaxed">
                Great job! No products have fallen below their low stock threshold at the moment.
              </p>
            </div>
          </div>
        ) : (
          <div className="card bg-base-100 border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr className="bg-base-200/30 border-b border-base-200/60 font-bold text-base-content/60 uppercase tracking-wider text-[11px]">
                    <th className="px-6 py-4">Product Name</th>
                    <th className="px-6 py-4">SKU</th>
                    <th className="px-6 py-4 text-center">Current Stock</th>
                    <th className="px-6 py-4 text-center">Threshold</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-200/50">
                  {lowStockItems.map((p) => (
                    <tr key={p._id} className="hover:bg-base-200/30 transition-colors group">
                      <td className="px-6 py-4 font-bold text-sm tracking-tight">{p.name}</td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-base-content/80 bg-base-200/40 px-2 py-0.5 rounded-md border border-base-200/60">{p.sku}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 text-xs font-extrabold rounded-lg tracking-wide shadow-sm inline-flex items-center min-w-[2.5rem] justify-center bg-error/15 text-error-content dark:text-error border border-error/20">
                          {p.totalQuantity || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-base-content/60">{p.lowStockThreshold}</td>
                      <td className="px-6 py-4 text-right">
                        {(p.totalQuantity || 0) === 0 ? (
                          <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg tracking-wider border border-error/20 bg-error/15 text-error-content dark:text-error uppercase shadow-sm">Out of Stock</span>
                        ) : (
                          <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg tracking-wider border border-warning/20 bg-warning/15 text-warning-content dark:text-warning uppercase shadow-sm">Low Stock</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        isLoading ? (
          <div className="card bg-base-100 border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6">
            <TableSkeleton rows={10} cols={8} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="card bg-base-100 border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr className="bg-base-200/30 border-b border-base-200/60 font-bold text-base-content/60 uppercase tracking-wider text-[11px]">
                      <th className="px-6 py-4">Product</th>
                      <th className="px-6 py-4">Movement Type</th>
                      <th className="px-6 py-4 text-center">Qty</th>
                      <th className="px-6 py-4 text-center">Prev</th>
                      <th className="px-6 py-4 text-center">New</th>
                      <th className="px-6 py-4">Reason</th>
                      <th className="px-6 py-4">Processed By</th>
                      <th className="px-6 py-4 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-base-200/50">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-20">
                          <div className="flex flex-col items-center space-y-2 opacity-30">
                            <History className="w-12 h-12 mb-2" />
                            <p className="font-extrabold text-lg">No inventory movements recorded</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      logs.map((l) => (
                        <tr key={l._id} className="hover:bg-base-200/30 transition-colors">
                          <td className="px-6 py-4 font-bold text-sm tracking-tight">{l.product?.name || 'N/A'}</td>
                          <td className="px-6 py-4">
                            <div className={`px-2 py-1 inline-flex items-center gap-1.5 text-[10px] font-extrabold rounded-lg tracking-wider uppercase border shadow-sm
                              ${l.type === 'in' ? 'bg-success/15 border-success/20 text-success-content dark:text-success' : 
                                l.type === 'out' ? 'bg-error/15 border-error/20 text-error-content dark:text-error' : 
                                'bg-warning/15 border-warning/20 text-warning-content dark:text-warning'}`}>
                              {l.type === 'in' ? <ArrowDownRight className="w-3 h-3" /> : l.type === 'out' ? <ArrowUpRight className="w-3 h-3" /> : <SlidersHorizontal className="w-3 h-3" />}
                              {l.type}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-sm">{l.quantity}</td>
                          <td className="px-6 py-4 text-center font-semibold text-base-content/50">{l.previousStock}</td>
                          <td className="px-6 py-4 text-center font-semibold text-base-content/50">{l.newStock}</td>
                          <td className="px-6 py-4 text-xs font-medium max-w-[200px] truncate text-base-content/70">{l.reason}</td>
                          <td className="px-6 py-4 text-sm font-semibold">{l.user?.name || 'System'}</td>
                          <td className="px-6 py-4 text-right text-xs font-semibold text-base-content/50 uppercase tracking-widest">{formatDate(l.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {pages > 1 && (
              <div className="flex justify-center mt-6">
                <div className="join shadow-sm border border-base-200/60 rounded-xl bg-base-100">
                  {Array.from({ length: pages }, (_, i) => (
                    <button key={i} className={`join-item btn btn-sm border-0 ${currentPage === i + 1 ? 'bg-primary text-primary-content font-bold shadow-inner' : 'bg-transparent text-base-content/70 hover:bg-base-200 hover:text-base-content font-semibold'}`}
                      onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* Adjust Modal */}
      <dialog className={`modal modal-bottom sm:modal-middle ${showAdjust ? 'modal-open' : ''}`}>
        <div className="modal-box w-11/12 max-w-xl bg-base-100/95 backdrop-blur-3xl border border-base-200/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-3xl p-6 sm:p-8">
          <h3 className="font-extrabold text-2xl tracking-tight mb-6 flex items-center gap-3">
            <SlidersHorizontal className="w-6 h-6 text-primary" /> Adjust Stock Balance
          </h3>
          <form onSubmit={handleAdjust} className="space-y-5">
            <div className="form-control">
              <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Product *</span></label>
              <select className="select bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all w-full" value={adjustForm.productId}
                onChange={(e) => setAdjustForm({ ...adjustForm, productId: e.target.value })} required>
                <option value="" disabled>Select product to adjust</option>
                {products.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Warehouse *</span></label>
                <select className="select bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all w-full" value={adjustForm.warehouseId}
                  onChange={(e) => setAdjustForm({ ...adjustForm, warehouseId: e.target.value })} required>
                  <option value="" disabled>Select location</option>
                  {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
                </select>
              </div>
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Movement Type *</span></label>
                <select className="select bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all w-full" value={adjustForm.type}
                  onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}>
                  <option value="in">Stock In (+)</option>
                  <option value="out">Stock Out (-)</option>
                  <option value="adjustment">Set Exact Value (=)</option>
                </select>
              </div>
            </div>
            <div className="form-control">
              <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Quantity *</span></label>
              <input type="number" min="0" className="input bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-bold transition-all text-lg" value={adjustForm.quantity}
                onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })} required placeholder="0" />
            </div>
            <div className="form-control">
              <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Reason (Optional)</span></label>
              <input type="text" className="input bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all" value={adjustForm.reason}
                onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })} placeholder="e.g. Damage recount, found missing item..." />
            </div>
            <div className="modal-action pt-4 border-t border-base-200/60 mt-6">
              <button type="button" className="btn btn-ghost rounded-xl font-bold" onClick={() => setShowAdjust(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary rounded-xl font-bold shadow-lg shadow-primary/20 px-8">Complete Adjustment</button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop bg-base-300/60 backdrop-blur-sm"><button onClick={() => setShowAdjust(false)}>close</button></form>
      </dialog>
    </div>
  );
};

export default Inventory;

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTransfers, createTransfer, approveTransfer, receiveTransfer, transferSocketUpdate } from '../store/slices/transferSlice';
import { fetchWarehouses } from '../store/slices/warehouseSlice';
import useRealtimeSync from '../hooks/useRealtimeSync';
import { ArrowRightLeft, Plus, CheckCircle2, Clock, MapPin, X, AlertCircle, Printer, Download, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../services/api';
import { TableSkeleton } from '../components/Skeleton';

const Transfers = () => {
  const dispatch = useDispatch();
  const { items: transfers, isLoading, total } = useSelector((state) => state.transfers);
  const { warehouses } = useSelector((state) => state.warehouses);
  const { user } = useSelector((state) => state.auth);
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    fromWarehouse: '',
    toWarehouse: '',
    notes: '',
    items: [{ product: '', quantity: 1 }]
  });

  // Real-time synchronization
  useRealtimeSync('transfers', transferSocketUpdate);

  useEffect(() => {
    dispatch(fetchTransfers());
    dispatch(fetchWarehouses());
    API.get('/products?limit=1000').then(res => setProducts(res.data.products)).catch(() => {});
  }, [dispatch]);

  const addItem = () => setForm({ ...form, items: [...form.items, { product: '', quantity: 1 }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, field, value) => {
    const newItems = [...form.items];
    newItems[i] = { ...newItems[i], [field]: value };
    setForm({ ...form, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.fromWarehouse === form.toWarehouse) {
      return toast.error('Source and destination warehouses must be different');
    }
    try {
      if (form.items.some(item => !item.product)) return toast.error('Please select products for all items');
      await dispatch(createTransfer(form)).unwrap();
      toast.success('Transfer created successfully');
      setShowModal(false);
      setForm({ fromWarehouse: '', toWarehouse: '', notes: '', items: [{ product: '', quantity: 1 }] });
    } catch (err) {
      toast.error(err || 'Failed to create transfer');
    }
  };

  const handleApprove = async (id) => {
    try {
      await dispatch(approveTransfer(id)).unwrap();
      toast.success('Transfer approved');
    } catch (err) {
      toast.error(err || 'Failed to approve');
    }
  };

  const handleReceive = async (id) => {
    try {
      await dispatch(receiveTransfer(id)).unwrap();
      toast.success('Inventory received successfully');
    } catch (err) {
      toast.error(err || 'Failed to receive');
    }
  };

  const statusBadge = (s) => {
    switch (s) {
      case 'received': return <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg tracking-wider border uppercase shadow-sm bg-success/15 text-success-content dark:text-success border-success/20 inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Received</span>;
      case 'approved': return <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg tracking-wider border uppercase shadow-sm bg-info/15 text-info-content dark:text-info border-info/20 inline-flex items-center gap-1"><Clock className="w-3 h-3"/> Approved</span>;
      case 'pending': return <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg tracking-wider border uppercase shadow-sm bg-warning/15 text-warning-content dark:text-warning border-warning/20 inline-flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Pending</span>;
      case 'shipped': return <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg tracking-wider border uppercase shadow-sm bg-primary/10 text-primary border-primary/20 inline-flex items-center gap-1"><Truck className="w-3 h-3"/> Shipped</span>;
      default: return <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg tracking-wider border uppercase shadow-sm bg-base-200 text-base-content border-base-300">{s}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
           <h1 className="text-2xl font-bold text-base-content flex items-center gap-2 cursor-pointer hover:bg-base-200/50 p-1.5 rounded-lg transition-colors">
              All Transfers <span className="text-xs opacity-50 mt-1">▼</span>
           </h1>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm px-4 rounded-md shadow-sm font-semibold">
              <Plus className="w-4 h-4 mr-1" /> New
           </button>
           <div className="dropdown dropdown-end">
             <label tabIndex={0} className="btn btn-square btn-sm btn-ghost rounded-md border border-base-200"><Printer className="w-4 h-4 text-base-content/70" /></label>
             <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 mt-2">
               <li><a>Print List</a></li>
               <li><a>Export as CSV</a></li>
             </ul>
           </div>
        </div>
      </div>

      <div className="card bg-base-100 border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="table w-full whitespace-nowrap">
            <thead>
              <tr className="border-y border-base-200/80 bg-base-100 font-bold text-base-content/70 text-[12px] tracking-wide">
                <th className="w-12 px-4 py-3"><input type="checkbox" className="checkbox checkbox-sm rounded border-base-300" /></th>
                <th className="px-4 py-3 font-semibold">TRANSFER #</th>
                <th className="px-4 py-3 font-semibold">SOURCE</th>
                <th className="px-4 py-3 font-semibold">DESTINATION</th>
                <th className="px-4 py-3 text-center font-semibold">ITEMS</th>
                <th className="px-4 py-3 text-center font-semibold">STATUS</th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-200/50 bg-base-100">
              {isLoading ? (
                <tr><td colSpan={7} className="p-0"><TableSkeleton rows={5} cols={7} /></td></tr>
              ) : transfers.length === 0 ? (
                <tr>
                   <td colSpan={7} className="text-center py-20">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-20 h-20 bg-base-200/50 rounded-full flex items-center justify-center ring-4 ring-base-100 opacity-60">
                          <ArrowRightLeft className="w-10 h-10 text-base-content/40" />
                        </div>
                        <div>
                          <h3 className="text-xl font-extrabold tracking-tight text-base-content mb-1">No transfers found</h3>
                          <p className="text-base-content/50 font-medium max-w-sm mx-auto">No inventory movements have been requested yet.</p>
                        </div>
                     </div>
                   </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t._id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group cursor-pointer border-b border-base-200/50">
                    <td className="px-4 py-2.5">
                      <input type="checkbox" className="checkbox checkbox-sm rounded border-base-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[13px] font-bold text-blue-600 dark:text-blue-400 hover:underline">
                        {t.transferNumber}
                    </td>
                    <td className="px-4 py-2.5 text-[13px] text-base-content/80 font-medium">
                       <div className="flex items-center gap-1.5">
                           <MapPin className="w-3.5 h-3.5 text-error" /> {t.fromWarehouse?.name}
                       </div>
                    </td>
                    <td className="px-4 py-2.5 text-[13px] text-base-content/80 font-medium">
                       <div className="flex items-center gap-1.5">
                           <MapPin className="w-3.5 h-3.5 text-success" /> {t.toWarehouse?.name}
                       </div>
                    </td>
                    <td className="px-4 py-2.5 text-center font-semibold text-[13px]">
                       {t.items.length}
                    </td>
                    <td className="px-4 py-2.5 text-center">{statusBadge(t.status)}</td>
                    <td className="px-4 py-2.5 text-right">
                       <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {t.status === 'pending' && ['admin', 'manager'].includes(user?.role) && (
                            <button onClick={(e) => { e.stopPropagation(); handleApprove(t._id); }} className="btn btn-primary btn-xs rounded-lg font-bold shadow-md shadow-primary/20 h-8 px-4" title="Approve">Approve</button>
                          )}
                          {t.status === 'approved' && (
                            <button onClick={(e) => { e.stopPropagation(); handleReceive(t._id); }} className="btn btn-success text-success-content btn-xs rounded-lg font-bold shadow-md shadow-success/20 h-8 px-4" title="Receive Stock">Receive</button>
                          )}
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <dialog className={`modal modal-bottom sm:modal-middle ${showModal ? 'modal-open' : ''}`}>
        <div className="modal-box w-full sm:w-11/12 max-w-3xl bg-base-100/95 backdrop-blur-3xl border border-base-200/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-3xl p-4 sm:p-6 md:p-8">
          <h3 className="font-extrabold text-2xl tracking-tight mb-6 flex items-center gap-3">
             <ArrowRightLeft className="w-6 h-6 text-primary" /> Create Stock Transfer
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-base-200/30 rounded-2xl border border-base-200/60">
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-error/80 flex items-center gap-1"><MapPin className="w-3 h-3"/> Origin</span></label>
                <select className="select bg-base-100 border-base-200/60 rounded-xl focus:border-error focus:ring-4 focus:ring-error/10 font-medium transition-all w-full" value={form.fromWarehouse} 
                  onChange={(e) => setForm({ ...form, fromWarehouse: e.target.value })} required>
                  <option value="" disabled>Select Source Warehouse</option>
                  {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                </select>
              </div>
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-success/80 flex items-center gap-1"><MapPin className="w-3 h-3"/> Destination</span></label>
                <select className="select bg-base-100 border-base-200/60 rounded-xl focus:border-success focus:ring-4 focus:ring-success/10 font-medium transition-all w-full" value={form.toWarehouse}
                  onChange={(e) => setForm({ ...form, toWarehouse: e.target.value })} required>
                  <option value="" disabled>Select Target Warehouse</option>
                  {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h4 className="font-bold text-sm tracking-wider uppercase text-base-content/70">Transfer Items</h4>
                <button type="button" onClick={addItem} className="btn btn-sm btn-ghost rounded-xl font-bold gap-1.5 text-primary tracking-wide bg-primary/10 hover:bg-primary/20 hover:text-primary">
                  <Plus className="w-4 h-4" strokeWidth={3} /> Add Product
                </button>
              </div>
              
              <div className="space-y-3">
                {form.items.map((item, i) => (
                  <div key={i} className="flex flex-col sm:flex-row gap-4 items-end bg-base-100 border border-base-200/80 p-4 rounded-2xl relative shadow-sm group">
                    {form.items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="btn btn-square btn-sm btn-ghost absolute -top-2 -right-2 bg-base-100 border border-base-200 text-error/40 hover:text-error hover:bg-error/10 rounded-full opacity-100 shadow-sm"><X className="w-3.5 h-3.5" /></button>
                    )}
                    <div className="form-control flex-1 w-full">
                      <label className="label py-1"><span className="label-text text-[10px] font-bold tracking-wider uppercase text-base-content/50">Product SKU</span></label>
                      <select className="select bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary w-full" value={item.product}
                        onChange={(e) => updateItem(i, 'product', e.target.value)} required>
                        <option value="" disabled>Search & Select product...</option>
                        {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
                      </select>
                    </div>
                      <div className="form-control w-full sm:w-32">
                        <label className="label py-1">
                          <span className="label-text text-[10px] font-bold tracking-wider uppercase text-base-content/50">Quantity</span>
                          {form.fromWarehouse && item.product && (
                            <span className={`text-[10px] font-bold ${
                              (products.find(p => p._id === item.product)?.warehouseStock?.find(ws => ws.warehouse === form.fromWarehouse)?.quantity || 0) < item.quantity 
                              ? 'text-error' : 'text-success'
                            }`}>
                              Stock: {products.find(p => p._id === item.product)?.warehouseStock?.find(ws => ws.warehouse === form.fromWarehouse)?.quantity || 0}
                            </span>
                          )}
                        </label>
                        <input type="number" min="1" className="input bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary w-full font-bold text-center" value={item.quantity}
                          onChange={(e) => updateItem(i, 'quantity', e.target.value === '' ? '' : parseInt(e.target.value))} required />
                      </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-control pt-2">
              <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Authorization Notes (Optional)</span></label>
              <textarea className="textarea bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all w-full text-sm" value={form.notes} rows={2}
                onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="State reason for transfer or special handling instructions..."></textarea>
            </div>

            <div className="modal-action pt-4 border-t border-base-200/60 mt-6">
              <button type="button" className="btn btn-ghost rounded-xl font-bold" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary rounded-xl font-bold shadow-lg shadow-primary/20 bg-primary/90 hover:bg-primary px-8">Authorize Transfer</button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop bg-base-300/60 backdrop-blur-sm"><button onClick={() => setShowModal(false)}>close</button></form>
      </dialog>
    </div>
  );
};

export default Transfers;

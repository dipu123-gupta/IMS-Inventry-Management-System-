import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders, createOrder, updateOrderStatus, orderSocketUpdate } from '../store/slices/orderSlice';
import useRealtimeSync from '../hooks/useRealtimeSync';
import { fetchVendors } from '../store/slices/vendorSlice';
import toast from 'react-hot-toast';
import API from '../services/api';
import { ShoppingCart, Download, Plus, Search, FileText, ArrowUpRight, X, Printer, Clock, CheckCircle2 } from 'lucide-react';
import { fetchWarehouses } from '../store/slices/warehouseSlice';
import { TableSkeleton } from '../components/Skeleton';
import { ORDER_STATUS, ORDER_TYPE } from '../utils/constants';
import { formatCurrency, getCurrencySymbol, formatDate } from '../utils/format';

const PurchaseOrders = () => {
  const dispatch = useDispatch();
  const { items, total, pages, isLoading } = useSelector((state) => state.orders);
  const { items: vendors } = useSelector((state) => state.vendors);
  const { warehouses } = useSelector((state) => state.warehouses);
  const { user } = useSelector((state) => state.auth);
  const organization = user?.organization;
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState([]);
  
  const [form, setForm] = useState({ 
    vendor: '', 
    notes: '', 
    items: [{ product: '', warehouse: '', quantity: 1, cost: 0 }] 
  });

  // Real-time synchronization
  useRealtimeSync('orders', orderSocketUpdate);

  useEffect(() => {
    dispatch(fetchOrders({ type: ORDER_TYPE.PURCHASE, page: currentPage, limit: 10, search }));
    dispatch(fetchVendors({ limit: 100 }));
    dispatch(fetchWarehouses());
  }, [dispatch, currentPage, search]);

  useEffect(() => {
    if (form.vendor) {
      API.get(`/products?vendor=${form.vendor}&limit=200`)
        .then(({ data }) => setProducts(data.products || []))
        .catch(() => {});
    } else {
      setProducts([]);
    }
  }, [form.vendor]);

  const addItem = () => setForm({ ...form, items: [...form.items, { product: '', warehouse: '', quantity: 1, cost: 0 }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });

  const handleDownloadInvoice = async (orderId, orderNumber) => {
    try {
      const response = await API.get(`/orders/${orderId}/invoice`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `po-${orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Failed to download PDF');
    }
  };
  
  const updateItem = (i, field, value) => {
    const newItems = [...form.items];
    newItems[i] = { ...newItems[i], [field]: value };
    if (field === 'product') {
      const p = products.find((p) => p._id === value);
      if (p) newItems[i].cost = p.cost;
    }
    setForm({ ...form, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (form.items.some(item => !item.product || !item.warehouse)) {
        return toast.error('Please select product and warehouse for all items');
      }

      // Map 'cost' to 'price' for the backend order API which uses 'price' for both buy/sell
      const payloadItems = form.items.map(i => ({ 
        product: i.product, 
        warehouse: i.warehouse,
        quantity: i.quantity, 
        price: i.cost 
      }));
      
      await dispatch(createOrder({ ...form, items: payloadItems, type: ORDER_TYPE.PURCHASE })).unwrap();
      toast.success('Purchase order created');
      setShowModal(false);
      setForm({ vendor: '', notes: '', items: [{ product: '', warehouse: '', quantity: 1, cost: 0 }] });
      dispatch(fetchOrders({ type: ORDER_TYPE.PURCHASE, page: 1, limit: 10 }));
    } catch (err) {
      toast.error(err || 'Failed to create order');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await dispatch(updateOrderStatus({ id, status })).unwrap();
      toast.success(`Status updated to ${status}`);
    } catch (err) {
      toast.error(err || 'Failed to update status');
    }
  };

  const handleConvertToBill = async (id) => {
    try {
      const { data } = await API.post(`/orders/${id}/convert-bill`);
      toast.success('Converted to Bill successfully');
      dispatch(fetchOrders({ type: ORDER_TYPE.PURCHASE, page: currentPage, limit: 10, search }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to convert to bill');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      [ORDER_STATUS.PENDING]: { bg: 'bg-warning/15', text: 'text-warning-content dark:text-warning', border: 'border-warning/20' },
      [ORDER_STATUS.PROCESSING]: { bg: 'bg-info/15', text: 'text-info-content dark:text-info', border: 'border-info/20' },
      [ORDER_STATUS.COMPLETED]: { bg: 'bg-success/15', text: 'text-success-content dark:text-success', border: 'border-success/20' },
      [ORDER_STATUS.CANCELLED]: { bg: 'bg-error/15', text: 'text-error-content dark:text-error', border: 'border-error/20' }
    };
    const style = statusMap[status] || statusMap.pending;
    return (
      <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg tracking-wider border uppercase shadow-sm ${style.bg} ${style.text} ${style.border}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
           <h1 className="text-2xl font-bold text-base-content flex items-center gap-2 cursor-pointer hover:bg-base-200/50 p-1.5 rounded-lg transition-colors">
              All Purchase Orders <span className="text-xs opacity-50 mt-1">▼</span>
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

      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-base-content/40" />
        </div>
        <input 
          type="text" 
          placeholder="Search orders..." 
          className="input bg-base-100 border-base-200/60 rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 shadow-[0_2px_10px_rgb(0,0,0,0.02)] font-medium transition-all w-full pl-10"
          value={search} 
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} 
        />
      </div>

      <div className="card bg-base-100 border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full whitespace-nowrap">
            <thead>
              <tr className="border-y border-base-200/80 bg-base-100 font-bold text-base-content/70 text-[12px] tracking-wide">
                <th className="w-12 px-4 py-3"><input type="checkbox" className="checkbox checkbox-sm rounded border-base-300" /></th>
                <th className="px-4 py-3 font-semibold">ORDER #</th>
                <th className="px-4 py-3 font-semibold">VENDOR</th>
                <th className="px-4 py-3 text-center font-semibold">ITEMS</th>
                <th className="px-4 py-3 text-right font-semibold">TOTAL AMOUNT</th>
                <th className="px-4 py-3 text-center font-semibold">STATUS</th>
                <th className="px-4 py-3 font-semibold">DATE</th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-200/50 bg-base-100">
              {isLoading ? (
                <tr><td colSpan={8} className="p-0"><TableSkeleton rows={5} cols={8} /></td></tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-20">
                    <div className="flex flex-col items-center space-y-3 opacity-40">
                      <ShoppingCart className="w-12 h-12" />
                      <p className="font-extrabold text-lg">No purchase orders found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((o) => (
                  <tr key={o._id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group cursor-pointer border-b border-base-200/50">
                    <td className="px-4 py-2.5">
                      <input type="checkbox" className="checkbox checkbox-sm rounded border-base-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-[13px] text-blue-600 dark:text-blue-400 hover:underline">{o.orderNumber}</span>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-[13px] text-base-content/80">{o.vendor?.name || '—'}</td>
                    <td className="px-4 py-2.5 text-center font-semibold text-[13px]">{o.items.length}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-[13px]">{formatCurrency(o.totalAmount, organization)}</td>
                    <td className="px-4 py-2.5 text-center">{getStatusBadge(o.status)}</td>
                    <td className="px-4 py-2.5 text-[13px] text-base-content/80 text-xs">{formatDate(o.createdAt)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); handleDownloadInvoice(o._id, o.orderNumber); }} className="p-1.5 rounded text-secondary hover:bg-secondary/10 transition-colors tooltip tooltip-left" data-tip="Download PO PDF">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        {o.status === ORDER_STATUS.PENDING && (
                           <button onClick={(e) => { e.stopPropagation(); handleUpdateStatus(o._id, ORDER_STATUS.PROCESSING); }} className="p-1.5 rounded text-info hover:bg-info/10 transition-colors tooltip tooltip-left" data-tip="Mark Processing">
                             <Clock className="w-3.5 h-3.5" />
                           </button>
                        )}
                        {o.status === ORDER_STATUS.PROCESSING && (
                           <button onClick={(e) => { e.stopPropagation(); handleUpdateStatus(o._id, ORDER_STATUS.COMPLETED); }} className="p-1.5 rounded text-success hover:bg-success/10 transition-colors tooltip tooltip-left" data-tip="Mark Received">
                             <CheckCircle2 className="w-3.5 h-3.5" />
                           </button>
                        )}
                        {o.status === ORDER_STATUS.COMPLETED && !o.isBilled && (
                           <button onClick={(e) => { e.stopPropagation(); handleConvertToBill(o._id); }} className="p-1.5 rounded text-primary hover:bg-primary/10 transition-colors tooltip tooltip-left" data-tip="Convert to Bill">
                             <FileText className="w-3.5 h-3.5" />
                           </button>
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

      {pages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="join shadow-sm border border-base-200/60 rounded-xl bg-base-100">
            {Array.from({ length: pages }, (_, i) => (
              <button key={i} className={`join-item btn btn-sm border-0 ${currentPage === i + 1 ? 'bg-primary text-primary-content font-bold shadow-inner' : 'bg-transparent text-base-content/70 hover:bg-base-200 hover:text-base-content font-semibold'}`} onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
            ))}
          </div>
        </div>
      )}

      {/* Create Modal */}
      <dialog className={`modal modal-bottom sm:modal-middle ${showModal ? 'modal-open' : ''}`}>
        <div className="modal-box w-full sm:w-11/12 max-w-4xl bg-base-100/95 backdrop-blur-3xl border border-base-200/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-3xl p-4 sm:p-6 md:p-8">
          <h3 className="font-extrabold text-2xl tracking-tight mb-6 flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 text-primary" /> Create Purchase Order
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="form-control">
              <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Select Vendor *</span></label>
              <select className="select bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all w-full" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value, items: [{ product: '', warehouse: '', quantity: 1, cost: 0 }] })} required>
                <option value="" disabled>Choose a vendor to procure from...</option>
                {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
              </select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Order Items</label>
                <button type="button" onClick={addItem} disabled={!form.vendor} className="btn btn-sm btn-ghost rounded-xl font-bold gap-1.5 text-primary tracking-wide bg-primary/10 hover:bg-primary/20 hover:text-primary">
                  <Plus className="w-4 h-4" strokeWidth={3} /> Add Item Row
                </button>
              </div>
              
              {!form.vendor && <p className="text-sm font-medium text-warning bg-warning/10 p-3 rounded-xl border border-warning/20">Please select a vendor first to load their available products.</p>}
              
              {form.vendor && products.length === 0 && <p className="text-sm font-medium text-warning bg-warning/10 p-3 rounded-xl border border-warning/20">This vendor does not have any active products registered.</p>}

              {form.vendor && products.length > 0 && form.items.map((item, i) => (
                <div key={i} className="bg-base-200/30 border border-base-200/60 p-5 rounded-2xl relative shadow-sm group">
                  {form.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} 
                      className="btn btn-square btn-sm btn-ghost absolute top-3 right-3 text-error/40 hover:text-error hover:bg-error/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all"><X className="w-4 h-4" /></button>
                  )}
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label py-1"><span className="label-text text-[10px] font-bold tracking-wider uppercase text-base-content/50">Product</span></label>
                        <select className="select bg-base-100 border-base-200/80 rounded-xl focus:border-primary w-full" value={item.product}
                          onChange={(e) => updateItem(i, 'product', e.target.value)} required>
                          <option value="" disabled>Select Product...</option>
                          {products.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
                        </select>
                      </div>
                      <div className="form-control">
                        <label className="label py-1"><span className="label-text text-[10px] font-bold tracking-wider uppercase text-base-content/50">Destination</span></label>
                        <select className="select bg-base-100 border-base-200/80 rounded-xl focus:border-primary w-full" value={item.warehouse}
                          onChange={(e) => updateItem(i, 'warehouse', e.target.value)} required>
                          <option value="" disabled>Select Delivery Location...</option>
                          {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label py-1"><span className="label-text text-[10px] font-bold tracking-wider uppercase text-base-content/50">Quantity</span></label>
                        <input type="number" min="1" className="input bg-base-100 border-base-200/80 rounded-xl focus:border-primary w-full font-bold"
                          value={item.quantity} onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 1)} />
                      </div>
                      <div className="form-control">
                        <label className="label py-1"><span className="label-text text-[10px] font-bold tracking-wider uppercase text-base-content/50">Unit Cost</span></label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40 font-bold">{getCurrencySymbol(organization)}</span>
                          <input type="number" step="0.01" className="input bg-base-100 border-base-200/80 rounded-xl focus:border-primary w-full pl-8 font-bold"
                            value={item.cost} onChange={(e) => updateItem(i, 'cost', parseFloat(e.target.value) || 0)} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="form-control">
              <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Order Notes (Optional)</span></label>
              <textarea className="textarea bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all w-full" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Add any special instructions or remarks here..."></textarea>
            </div>

            <div className="modal-action pt-4 border-t border-base-200/60 mt-6">
              <button type="button" className="btn btn-ghost rounded-xl font-bold" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary rounded-xl font-bold shadow-lg shadow-primary/20 bg-primary/90 hover:bg-primary px-8" disabled={!form.vendor || products.length === 0}>Create Purchase Order</button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop bg-base-300/60 backdrop-blur-sm"><button onClick={() => setShowModal(false)}>close</button></form>
      </dialog>
    </div>
  );
};

export default PurchaseOrders;

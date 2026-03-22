import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders, createOrder, updateOrderStatus, orderSocketUpdate } from '../store/slices/orderSlice';
import useRealtimeSync from '../hooks/useRealtimeSync';
import toast from 'react-hot-toast';
import API from '../services/api';
import { Download, Printer, Plus, Search, FileText, ArrowDownRight, Tag, Info, ShoppingBag, X, Zap, MoreVertical } from 'lucide-react';
import { fetchWarehouses } from '../store/slices/warehouseSlice';
import { fetchCustomers } from '../store/slices/customerSlice';
import { TableSkeleton } from '../components/Skeleton';
import { ORDER_STATUS, ORDER_TYPE, PAYMENT_MODE } from '../utils/constants';
import { formatCurrency, getCurrencySymbol, formatDate } from '../utils/format';

const InvoiceModal = ({ order, organization, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <dialog className="modal modal-open modal-bottom sm:modal-middle">
      <div className="modal-box w-11/12 max-w-4xl p-0 overflow-hidden bg-base-100 text-base-content print:shadow-none print:border-none rounded-3xl backdrop-blur-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-base-200/60">
        <div id="invoice-content" className="p-4 sm:p-8 md:p-10 space-y-8 sm:space-y-10 min-h-[600px] print:p-0 overflow-x-auto">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-base-200/60 pb-8">
            <div className="flex flex-col gap-1">
              <h2 className="text-4xl font-black tracking-tighter text-primary print:text-black">INVOICE</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-bold text-base-content/50 uppercase tracking-widest">ORDER NO.</span>
                <span className="text-base font-mono font-bold bg-base-200/50 px-3 py-1 rounded-lg border border-base-200/80">{order.orderNumber}</span>
              </div>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingBag className="w-6 h-6 text-primary" />
                <h3 className="font-extrabold text-xl tracking-tight">IMS Pro</h3>
              </div>
              <p className="text-sm font-medium text-base-content/60">123 Logistics Way, Tech City, NY 10001</p>
              <p className="text-sm font-medium text-base-content/60">billing@imspro.example.com</p>
              <p className="text-sm font-medium text-base-content/60">+1 (555) 123-4567</p>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-12 bg-base-200/30 p-8 rounded-2xl border border-base-200/60 break-inside-avoid">
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-widest text-base-content/40 mb-3">Billed To</p>
              <h4 className="font-bold text-xl tracking-tight">{order.customerName || 'Walk-in Customer'}</h4>
              {order.customerEmail && <p className="text-sm font-medium text-base-content/70">{order.customerEmail}</p>}
            </div>
            <div className="text-right space-y-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-base-content/40 mb-1">Issue Date</p>
                <p className="text-md font-bold">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-base-content/40 mb-1">Status</p>
                <div className="inline-flex">
                  <span className={`px-3 py-1 text-xs font-extrabold rounded-lg tracking-wider border uppercase shadow-sm
                    ${order.status === ORDER_STATUS.COMPLETED ? 'bg-success/15 text-success-content dark:text-success border-success/20' : 
                      order.status === ORDER_STATUS.PENDING ? 'bg-warning/15 text-warning-content dark:text-warning border-warning/20' : 
                      'bg-base-200 text-base-content border-base-300'}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-base-200/60 shadow-sm">
            <table className="table w-full border-collapse bg-base-100">
              <thead className="bg-base-200/50">
                <tr className="border-b border-base-200/80">
                  <th className="text-left py-4 px-6 font-bold text-base-content/60 uppercase tracking-widest text-[11px]">Item Description</th>
                  <th className="text-center py-4 px-6 font-bold text-base-content/60 uppercase tracking-widest text-[11px]">Qty</th>
                  <th className="text-right py-4 px-6 font-bold text-base-content/60 uppercase tracking-widest text-[11px]">Unit Price</th>
                  <th className="text-right py-4 px-6 font-bold text-base-content/60 uppercase tracking-widest text-[11px]">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200/60">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-base-200/20 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-sm tracking-tight">{item.product?.name || 'Unknown Product'}</div>
                      {item.product?.sku && <div className="text-xs text-base-content/50 font-mono mt-1 font-semibold">{item.product.sku}</div>}
                    </td>
                    <td className="text-center py-4 px-6 font-semibold">{item.quantity}</td>
                    <td className="text-right py-4 px-6 font-medium text-base-content/70">{formatCurrency(item.price, organization)}</td>
                    <td className="text-right py-4 px-6 font-extrabold tracking-tight">{formatCurrency(item.quantity * item.price, organization)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end pt-6 break-inside-avoid">
            <div className="w-80 space-y-4 bg-base-200/30 p-6 rounded-2xl border border-base-200/60">
              <div className="flex justify-between text-sm font-semibold text-base-content/70">
                <span>Subtotal</span>
                <span>{formatCurrency(order.totalAmount, organization)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-base-content/70 pb-4 border-b border-base-200/80">
                <span>Tax (0%)</span>
                <span>{formatCurrency(0, organization)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-base font-bold text-base-content/70 uppercase tracking-wider">Total Due</span>
                <span className="text-3xl font-black text-primary tracking-tighter">{formatCurrency(order.totalAmount, organization)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-16 pb-4 text-center text-xs font-semibold text-base-content/40 mt-auto break-inside-avoid">
            <p className="text-primary font-bold text-sm mb-1">Thank you for your business!</p>
            <p>This is a computer-generated invoice and requires no signature.</p>
          </div>
        </div>

        <div className="bg-base-200/50 p-6 flex justify-end gap-3 print:hidden border-t border-base-200/60">
          <button onClick={onClose} className="btn btn-ghost rounded-xl font-bold">Close</button>
          <button onClick={handlePrint} className="btn btn-primary rounded-xl font-bold gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 px-8">
            <Printer className="w-4 h-4" /> Print Invoice
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop bg-base-300/60 backdrop-blur-sm print:hidden"><button onClick={onClose}>close</button></form>
    </dialog>
  );
};

const SalesOrders = () => {
  const dispatch = useDispatch();
  const { items, total, pages, isLoading } = useSelector((s) => s.orders);
  const { warehouses } = useSelector((s) => s.warehouses);
  const { customers } = useSelector((s) => s.customers);
  const { user } = useSelector((s) => s.auth);
  const organization = user?.organization;
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ 
    customer: '', 
    notes: '', 
    paymentMethod: PAYMENT_MODE.CASH,
    items: [{ product: '', warehouse: '', quantity: 1, price: 0 }] 
  });
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Real-time synchronization
  useRealtimeSync('orders', orderSocketUpdate);

  useEffect(() => {
    dispatch(fetchOrders({ type: ORDER_TYPE.SALE, page: currentPage, limit: 10, search }));
    dispatch(fetchWarehouses());
    dispatch(fetchCustomers());
  }, [dispatch, currentPage, search]);

  useEffect(() => {
    API.get('/products?limit=200').then(({ data }) => setProducts(data.products || [])).catch(() => {});
  }, []);

  const addItem = () => setForm({ ...form, items: [...form.items, { product: '', warehouse: '', quantity: 1, price: 0 }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  
  const updateItem = (i, field, value) => {
    const newItems = [...form.items];
    newItems[i] = { ...newItems[i], [field]: value };
    if (field === 'product') {
      const p = products.find((p) => p._id === value);
      if (p) newItems[i].price = p.price; // Auto-set selling price
    }
    setForm({ ...form, items: newItems });
  };

  const handleDownloadInvoice = async (orderId, orderNumber) => {
    try {
      const response = await API.get(`/orders/${orderId}/invoice`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Failed to download invoice');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (form.items.some(item => !item.product || !item.warehouse)) {
        return toast.error('Please select product and warehouse for all items');
      }
      await dispatch(createOrder({ ...form, type: ORDER_TYPE.SALE })).unwrap();
      toast.success('Sales order created');
      setShowModal(false);
      setForm({ customer: '', notes: '', paymentMethod: PAYMENT_MODE.CASH, items: [{ product: '', warehouse: '', quantity: 1, price: 0 }] });
      dispatch(fetchOrders({ type: ORDER_TYPE.SALE, page: 1, limit: 10 }));
    } catch (err) {
      toast.error(err || 'Failed to create order');
    }
  };

  const handleStatusChange = (id, status) => {
    dispatch(updateOrderStatus({ id, status }));
  };

  const handleConvertToInvoice = async (id) => {
    try {
      await API.post(`/orders/${id}/convert`);
      toast.success('Converted to Invoice successfully');
      dispatch(fetchOrders({ page: currentPage, type: 'sale' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Conversion failed');
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
              All Sales Orders <span className="text-xs opacity-50 mt-1">▼</span>
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
                <th className="px-4 py-3 font-semibold">CUSTOMER</th>
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
                      <ShoppingBag className="w-12 h-12" />
                      <p className="font-extrabold text-lg">No sales orders found</p>
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
                    <td className="px-4 py-2.5 font-medium text-[13px] text-base-content/80">{o.customerName || '—'}</td>
                    <td className="px-4 py-2.5 text-center font-semibold text-[13px]">{o.items.length}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-[13px]">{formatCurrency(o.totalAmount, organization)}</td>
                    <td className="px-4 py-2.5 text-center">{getStatusBadge(o.status)}</td>
                    <td className="px-4 py-2.5 text-[13px] text-base-content/80 text-xs">{formatDate(o.createdAt)}</td>
                    <td className="px-6 py-4">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {o.status !== ORDER_STATUS.COMPLETED && o.status !== ORDER_STATUS.CANCELLED && (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); handleStatusChange(o._id, ORDER_STATUS.COMPLETED); }} className="btn btn-ghost btn-xs text-success font-bold">Mark Complete</button>
                          <button onClick={(e) => { e.stopPropagation(); handleConvertToInvoice(o._id); }} className="btn btn-primary btn-xs rounded-lg font-black gap-1 shadow-sm px-3">
                             <Zap className="w-3 h-3 text-white" /> Invoice
                          </button>
                        </>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); setSelectedInvoice(o); }} className="p-1.5 rounded text-primary hover:bg-primary/10 transition-colors tooltip tooltip-left" data-tip="View Invoice">
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDownloadInvoice(o._id, o.orderNumber); }} className="p-1.5 rounded text-secondary hover:bg-secondary/10 transition-colors tooltip tooltip-left" data-tip="Download PDF">
                          <Download className="w-3.5 h-3.5" />
                        </button>
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

      {/* Invoice Modal */}
      {selectedInvoice && <InvoiceModal order={selectedInvoice} organization={organization} onClose={() => setSelectedInvoice(null)} />}

      {/* Create Modal */}
      <dialog className={`modal modal-bottom sm:modal-middle ${showModal ? 'modal-open' : ''}`}>
        <div className="modal-box w-full sm:w-11/12 max-w-4xl bg-base-100/95 backdrop-blur-3xl border border-base-200/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-3xl p-4 sm:p-6 md:p-8">
          <h3 className="font-extrabold text-2xl tracking-tight mb-6 flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-primary" /> Create Sales Order
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Customer *</span></label>
                <select className="select bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all w-full" value={form.customer} 
                  onChange={(e) => setForm({ ...form, customer: e.target.value })} required>
                  <option value="" disabled>Select Customer</option>
                  {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Payment Method *</span></label>
                <select className="select bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all w-full" value={form.paymentMethod} 
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                  {Object.entries(PAYMENT_MODE).map(([key, value]) => (
                    <option key={value} value={value}>{key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Order Items</label>
                <button type="button" onClick={addItem} className="btn btn-sm btn-ghost rounded-xl font-bold gap-1.5 text-primary tracking-wide bg-primary/10 hover:bg-primary/20 hover:text-primary">
                  <Plus className="w-4 h-4" strokeWidth={3} /> Add Item Row
                </button>
              </div>
              
              {form.items.map((item, i) => (
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
                          <option value="" disabled>Select Product to Sell...</option>
                          {products.map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.name} ({p.sku}) - Stock: {p.totalQuantity}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-control">
                        <label className="label py-1"><span className="label-text text-[10px] font-bold tracking-wider uppercase text-base-content/50">Fulfillment Source</span></label>
                        <select className="select bg-base-100 border-base-200/80 rounded-xl focus:border-primary w-full" value={item.warehouse}
                          onChange={(e) => updateItem(i, 'warehouse', e.target.value)} required>
                          <option value="" disabled>Select Source Warehouse...</option>
                          {warehouses.map((w) => {
                            const p = products.find(prod => prod._id === item.product);
                            const stock = p?.warehouseStock?.find(s => s.warehouse === w._id)?.quantity || 0;
                            return (
                              <option key={w._id} value={w._id} disabled={stock < 1}>
                                {w.name} (Available: {stock})
                              </option>
                            );
                          })}
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
                        <label className="label py-1"><span className="label-text text-[10px] font-bold tracking-wider uppercase text-base-content/50">Unit Price</span></label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40 font-bold">{getCurrencySymbol(organization)}</span>
                          <input type="number" step="0.01" className="input bg-base-100 border-base-200/80 rounded-xl focus:border-primary w-full pl-8 font-bold text-success"
                            value={item.price} onChange={(e) => updateItem(i, 'price', parseFloat(e.target.value) || 0)} />
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
              <button type="submit" className="btn btn-primary rounded-xl font-bold shadow-lg shadow-primary/20 bg-primary/90 hover:bg-primary px-8">Create Sales Order</button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop bg-base-300/60 backdrop-blur-sm"><button onClick={() => setShowModal(false)}>close</button></form>
      </dialog>
    </div>
  );
};

export default SalesOrders;

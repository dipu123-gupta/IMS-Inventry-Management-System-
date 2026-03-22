import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBills, createBill, updateBill, deleteBill, billSocketUpdate } from '../store/slices/billSlice';
import { fetchVendors } from '../store/slices/vendorSlice';
import { fetchOrders } from '../store/slices/orderSlice';
import useRealtimeSync from '../hooks/useRealtimeSync';
import { Search, Receipt, Download, Printer, CreditCard, Clock, CheckCircle2, AlertCircle, Ban, X, Plus, Edit, Trash2, ExternalLink } from 'lucide-react';
import { TableSkeleton } from '../components/Skeleton';
import { formatCurrency, formatDate, getCurrencySymbol } from '../utils/format';
import { recordPayment, paymentSocketUpdate } from '../store/slices/paymentSlice';
import { BILL_STATUS, PAYMENT_MODE, PAYMENT_TYPE, ORDER_TYPE } from '../utils/constants';
import toast from 'react-hot-toast';
import API from '../services/api';

const Bills = () => {
  const dispatch = useDispatch();
  const { bills, isLoading } = useSelector((s) => s.bills);
  const { items: vendors } = useSelector((s) => s.vendors);
  const { items: orders } = useSelector((s) => s.orders);
  const { user } = useSelector((s) => s.auth);
  const organization = user?.organization;

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [products, setProducts] = useState([]);
  
  const [paymentForm, setPaymentForm] = useState({ amount: 0, paymentMode: PAYMENT_MODE.BANK_TRANSFER, reference: '', notes: '' });
  const [form, setForm] = useState({
    vendor: '',
    purchaseOrder: '',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [{ product: '', quantity: 1, price: 0 }],
    notes: ''
  });

  // Real-time synchronization
  useRealtimeSync('bills', billSocketUpdate);
  useRealtimeSync('payments', paymentSocketUpdate);

  useEffect(() => {
    dispatch(fetchBills({ page: currentPage, limit: 10, search }));
    dispatch(fetchVendors());
    dispatch(fetchOrders({ type: ORDER_TYPE.PURCHASE, limit: 100 }));
    API.get('/products?limit=200').then(({ data }) => setProducts(data.products || [])).catch(() => {});
  }, [dispatch, currentPage, search]);

  const handleEdit = (bill) => {
    setIsEditing(true);
    setForm({
      vendor: bill.vendor?._id || bill.vendor,
      purchaseOrder: bill.purchaseOrder?._id || bill.purchaseOrder || '',
      dueDate: new Date(bill.dueDate).toISOString().split('T')[0],
      items: bill.items.map(item => ({
        product: item.product?._id || item.product,
        quantity: item.quantity,
        price: item.price
      })),
      notes: bill.notes || ''
    });
    setSelectedBill(bill);
    setShowFormModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this bill?')) {
      try {
        await dispatch(deleteBill(id)).unwrap();
        toast.success('Bill deleted');
      } catch (err) {
        toast.error(err || 'Failed to delete bill');
      }
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await dispatch(updateBill({ id: selectedBill._id, data: form })).unwrap();
        toast.success('Bill updated');
      } else {
        await dispatch(createBill(form)).unwrap();
        toast.success('Bill created');
      }
      setShowFormModal(false);
      resetForm();
    } catch (err) {
      toast.error(err || 'Failed to save bill');
    }
  };

  const resetForm = () => {
    setForm({
      vendor: '',
      purchaseOrder: '',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [{ product: '', quantity: 1, price: 0 }],
      notes: ''
    });
    setIsEditing(false);
    setSelectedBill(null);
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { product: '', quantity: 1, price: 0 }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  
  const updateItem = (i, field, value) => {
    const newItems = [...form.items];
    newItems[i] = { ...newItems[i], [field]: value };
    if (field === 'product') {
      const p = products.find((p) => p._id === value);
      if (p) newItems[i].price = p.purchasePrice || p.price;
    }
    setForm({ ...form, items: newItems });
  };

  const getStatusBadge = (s) => {
    const map = {
      [BILL_STATUS.OPEN]: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20', icon: Clock },
      [BILL_STATUS.PARTIALLY_PAID]: { bg: 'bg-info/10', text: 'text-info', border: 'border-info/20', icon: AlertCircle },
      [BILL_STATUS.PAID]: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20', icon: CheckCircle2 },
      [BILL_STATUS.VOID]: { bg: 'bg-error/10', text: 'text-error', border: 'border-error/20', icon: Ban },
    };
    const c = map[s] || map.open;
    return (
      <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg tracking-wider border uppercase shadow-sm ${c.bg} ${c.text} ${c.border} inline-flex items-center gap-1.5`}>
        <c.icon className="w-3.5 h-3.5" /> {s}
      </span>
    );
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedBill) return;
    try {
      await dispatch(recordPayment({
        ...paymentForm,
        bill: selectedBill._id,
        vendor: selectedBill.vendor?._id || selectedBill.vendor,
        type: PAYMENT_TYPE.PAYABLE,
        date: new Date().toISOString()
      })).unwrap();
      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      dispatch(fetchBills({ page: currentPage, limit: 10, search }));
    } catch (err) {
      toast.error(err || 'Failed to record payment');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-base-content flex items-center gap-2">
            Purchase Bills
          </h1>
          <p className="text-sm text-base-content/50 font-medium">Manage vendor invoices and record payments</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowFormModal(true); }}
          className="btn btn-primary btn-sm px-6 rounded-xl font-bold shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4 mr-2" /> New Bill
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
        <input 
          type="text" 
          placeholder="Search bill number..." 
          className="input input-sm h-11 bg-base-100 border-base-200/60 rounded-xl focus:border-primary w-full pl-10 font-bold"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card bg-base-100 border border-base-200/60 shadow-sm rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-md w-full whitespace-nowrap">
            <thead>
              <tr className="bg-base-200/30 text-base-content/60 text-[11px] uppercase tracking-widest font-black border-b border-base-200/60">
                <th className="px-6 py-4">Bill #</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-right text-success">Paid</th>
                <th className="px-6 py-4 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-200/40">
              {isLoading ? (
                <tr><td colSpan={7}><TableSkeleton rows={5} cols={7} /></td></tr>
              ) : bills.length === 0 ? (
                <tr>
                   <td colSpan={7} className="text-center py-20 opacity-40">
                      <Receipt className="w-12 h-12 mx-auto mb-2" />
                      <p className="font-bold">No bills found</p>
                   </td>
                </tr>
              ) : bills.map(bill => (
                <tr key={bill._id} className="hover:bg-primary/5 transition-colors group cursor-pointer border-b border-base-200/50">
                  <td className="px-6 py-4" onClick={() => handleEdit(bill)}>
                     <div className="font-black text-sm text-primary tracking-tight">{bill.billNumber}</div>
                     <div className="text-[10px] text-base-content/40 flex items-center gap-1">
                        <ExternalLink className="w-2.5 h-2.5" /> PO: {bill.purchaseOrder?.orderNumber || 'Direct Bill'}
                     </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-sm tracking-tight">{bill.vendor?.name || '—'}</td>
                  <td className="px-6 py-4 text-center">{getStatusBadge(bill.status)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-base-content/60">
                    <span className={new Date(bill.dueDate) < new Date() && bill.status !== BILL_STATUS.PAID ? 'text-error font-bold' : ''}>
                      {formatDate(bill.dueDate)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-sm">{formatCurrency(bill.totalAmount, organization)}</td>
                  <td className="px-6 py-4 text-right font-black text-sm text-success">{formatCurrency(bill.amountPaid, organization)}</td>
                  <td className="px-6 py-4">
                     <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {bill.status !== BILL_STATUS.PAID && (
                          <button onClick={(e) => { e.stopPropagation(); setSelectedBill(bill); setShowPaymentModal(true); setPaymentForm({...paymentForm, amount: bill.totalAmount - bill.amountPaid}); }} className="btn btn-primary btn-xs rounded-lg font-bold gap-1 shadow-sm px-3">
                             <CreditCard className="w-3 h-3" /> Pay
                          </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); handleEdit(bill); }} className="btn btn-ghost btn-xs btn-square text-info"><Edit className="w-4 h-4" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(bill._id); }} className="btn btn-ghost btn-xs btn-square text-error"><Trash2 className="w-4 h-4" /></button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill Form Modal */}
      <dialog className={`modal modal-bottom sm:modal-middle ${showFormModal ? 'modal-open' : ''}`}>
        <div className="modal-box w-full sm:w-11/12 max-w-4xl bg-base-100 rounded-3xl p-0 overflow-hidden shadow-2xl border border-base-200/60">
          <div className="bg-primary/5 px-8 py-6 border-b border-primary/10 flex justify-between items-center">
             <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
               <Receipt className="w-6 h-6 text-primary" /> {isEditing ? 'Edit Bill' : 'New Bill'}
             </h3>
             <button onClick={() => setShowFormModal(false)} className="btn btn-ghost btn-sm btn-circle"><X className="w-5 h-5" /></button>
          </div>
          
          <form onSubmit={handleSubmitForm} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold uppercase tracking-wider text-base-content/60">Vendor *</span></label>
                <select className="select select-bordered bg-base-200/20 rounded-xl focus:border-primary w-full" value={form.vendor} onChange={e => setForm({...form, vendor: e.target.value})} required>
                  <option value="">Select Vendor</option>
                  {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                </select>
              </div>
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold uppercase tracking-wider text-base-content/60">Purchase Order</span></label>
                <select className="select select-bordered bg-base-200/20 rounded-xl focus:border-primary w-full" value={form.purchaseOrder} onChange={e => setForm({...form, purchaseOrder: e.target.value})}>
                  <option value="">None (Direct)</option>
                  {orders.map(o => <option key={o._id} value={o._id}>{o.orderNumber}</option>)}
                </select>
              </div>
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold uppercase tracking-wider text-base-content/60">Due Date *</span></label>
                <input type="date" className="input input-bordered bg-base-200/20 rounded-xl focus:border-primary w-full" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} required />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-base-content/40">Bill Items</p>
                <button type="button" onClick={addItem} className="btn btn-ghost btn-xs text-primary font-bold gap-1"><Plus className="w-3 h-3" /> Add Item</button>
              </div>
              {form.items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-3 items-end bg-base-200/20 p-4 rounded-2xl border border-base-200/60 group relative">
                  <div className="col-span-12 md:col-span-5">
                    <label className="label py-0 mb-1"><span className="text-[10px] font-bold uppercase text-base-content/40">Product</span></label>
                    <select className="select select-sm select-bordered w-full rounded-lg" value={item.product} onChange={e => updateItem(i, 'product', e.target.value)} required>
                      <option value="">Select Product</option>
                      {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
                    </select>
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <label className="label py-0 mb-1"><span className="text-[10px] font-bold uppercase text-base-content/40">Qty</span></label>
                    <input type="number" className="input input-sm input-bordered w-full rounded-lg font-bold" value={item.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))} min="1" required />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <label className="label py-0 mb-1"><span className="text-[10px] font-bold uppercase text-base-content/40">Purchase Price</span></label>
                    <input type="number" className="input input-sm input-bordered w-full rounded-lg font-bold" value={item.price} onChange={e => updateItem(i, 'price', Number(e.target.value))} step="0.01" required />
                  </div>
                  <div className="col-span-3 md:col-span-2">
                    <label className="label py-0 mb-1"><span className="text-[10px] font-bold uppercase text-base-content/40">Total</span></label>
                    <div className="h-8 flex items-center px-1 font-black text-sm">{formatCurrency(item.quantity * item.price, organization)}</div>
                  </div>
                  <div className="col-span-1">
                    <button type="button" onClick={() => removeItem(i)} className="btn btn-ghost btn-xs btn-circle text-error group-hover:opacity-100 opacity-0 transition-opacity"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="form-control">
              <label className="label py-1"><span className="label-text text-xs font-bold uppercase tracking-wider text-base-content/60">Notes</span></label>
              <textarea className="textarea textarea-bordered bg-base-200/20 rounded-xl focus:border-primary" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Billing notes, etc." />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-base-200/60">
               <button type="button" onClick={() => setShowFormModal(false)} className="btn btn-ghost rounded-xl font-bold">Cancel</button>
               <button type="submit" className="btn btn-primary px-10 rounded-xl font-bold shadow-lg shadow-primary/20">{isEditing ? 'Update Bill' : 'Create Bill'}</button>
            </div>
          </form>
        </div>
      </dialog>

      {/* Payment Modal */}
      <dialog className={`modal modal-bottom sm:modal-middle ${showPaymentModal ? 'modal-open' : ''}`}>
        <div className="modal-box w-full max-w-lg bg-base-100 p-0 overflow-hidden rounded-3xl border border-base-200/60 shadow-2xl">
          <div className="bg-primary/5 px-8 py-6 border-b border-primary/10 flex justify-between items-center">
             <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
               <CreditCard className="w-6 h-6 text-primary" /> Record Vendor Payment
             </h3>
             <button onClick={() => setShowPaymentModal(false)} className="btn btn-ghost btn-sm btn-circle"><X className="w-5 h-5" /></button>
          </div>
          
          <form onSubmit={handleRecordPayment} className="p-8 space-y-5">
             <div className="bg-base-200/30 p-4 rounded-xl flex justify-between items-center border border-base-200/60">
                <div>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-base-content/40">Total Amount</p>
                   <p className="text-lg font-black">{formatCurrency(selectedBill?.totalAmount || 0, organization)}</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-bold uppercase tracking-widest text-base-content/40">Open Balance</p>
                   <p className="text-lg font-black text-error">{formatCurrency((selectedBill?.totalAmount || 0) - (selectedBill?.amountPaid || 0), organization)}</p>
                </div>
             </div>

             <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold uppercase tracking-wider text-base-content/60">Payment Amount *</span></label>
                <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-base-content/30 text-lg">{getCurrencySymbol(organization)}</span>
                   <input 
                      type="number" 
                      className="input input-bordered bg-base-200/20 rounded-xl focus:border-primary w-full h-12 pl-10 font-black text-xl"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({...paymentForm, amount: Number(e.target.value)})}
                      max={(selectedBill?.totalAmount || 0) - (selectedBill?.amountPaid || 0)}
                      step="0.01"
                      required
                   />
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                   <label className="label py-1"><span className="label-text text-xs font-bold uppercase tracking-wider text-base-content/60">Payment Mode</span></label>
                   <select className="select select-bordered bg-base-200/20 rounded-xl focus:border-primary w-full font-bold" value={paymentForm.paymentMode} onChange={e => setPaymentForm({...paymentForm, paymentMode: e.target.value})}>
                      <option value={PAYMENT_MODE.BANK_TRANSFER}>Bank Transfer</option>
                      <option value={PAYMENT_MODE.CASH}>Cash</option>
                      <option value={PAYMENT_MODE.UPI}>UPI / Digital</option>
                      <option value={PAYMENT_MODE.CARD}>Card</option>
                   </select>
                </div>
                <div className="form-control">
                   <label className="label py-1"><span className="label-text text-xs font-bold uppercase tracking-wider text-base-content/60">Reference #</span></label>
                   <input type="text" className="input input-bordered bg-base-200/20 rounded-xl focus:border-primary w-full font-medium" placeholder="TXN-123456" value={paymentForm.reference} onChange={e => setPaymentForm({...paymentForm, reference: e.target.value})} />
                </div>
             </div>

             <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold uppercase tracking-wider text-base-content/60">Notes</span></label>
                <textarea className="textarea textarea-bordered bg-base-200/20 rounded-xl focus:border-primary" rows={2} value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} placeholder="Add any payment notes..." />
             </div>

             <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn btn-ghost rounded-xl font-bold">Cancel</button>
                <button type="submit" className="btn btn-primary px-10 rounded-xl font-bold shadow-lg shadow-primary/20">Record Payment</button>
             </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop bg-base-900/40 backdrop-blur-sm"><button onClick={() => setShowPaymentModal(false)}>close</button></form>
      </dialog>
    </div>
  );
};

export default Bills;

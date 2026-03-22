import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchQuotes, createQuote, updateQuoteStatus, quoteSocketUpdate } from '../store/slices/quoteSlice';
import useRealtimeSync from '../hooks/useRealtimeSync';
import { Plus, Search, FileText, Send, CheckCircle2, Ban, Zap, Download, X, User, Calendar, Tag, MoreVertical } from 'lucide-react';
import { fetchCustomers } from '../store/slices/customerSlice';
import { TableSkeleton } from '../components/Skeleton';
import { QUOTE_STATUS } from '../utils/constants';
import { formatCurrency, getCurrencySymbol, formatDate } from '../utils/format';
import toast from 'react-hot-toast';
import API from '../services/api';

const Quotes = () => {
  const dispatch = useDispatch();
  const { quotes, total, pages, isLoading } = useSelector((s) => s.quotes);
  const { customers } = useSelector((s) => s.customers);
  const { user } = useSelector((s) => s.auth);
  const organization = user?.organization;

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ 
    customer: '', 
    items: [{ product: '', quantity: 1, price: 0, discount: 0, tax: 0 }], 
    validUntil: '', 
    notes: '',
    termsAndConditions: 'Standard terms apply. Quote valid for 30 days.'
  });

  // Real-time synchronization
  useRealtimeSync('quotes', quoteSocketUpdate);

  useEffect(() => {
    dispatch(fetchQuotes({ page: currentPage, limit: 10, search }));
    dispatch(fetchCustomers());
  }, [dispatch, currentPage, search]);

  useEffect(() => {
    if (showModal) {
      API.get('/products?limit=200').then(({ data }) => setProducts(data.products || [])).catch(() => {});
    }
  }, [showModal]);

  const handleStatusChange = async (id, status) => {
    try {
      await dispatch(updateQuoteStatus({ id, status })).unwrap();
      toast.success(`Quote marked as ${status}`);
    } catch (err) {
      toast.error(err || 'Failed to update status');
    }
  };

  const handleConvert = async (id) => {
    try {
      await API.post(`/quotes/${id}/convert`);
      toast.success('Converted to Sales Order successfully');
      dispatch(fetchQuotes({ page: currentPage, limit: 10, search }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Conversion failed');
    }
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { product: '', quantity: 1, price: 0, discount: 0, tax: 0 }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  
  const updateItem = (i, field, value) => {
    const newItems = [...form.items];
    newItems[i] = { ...newItems[i], [field]: field === 'quantity' || field === 'price' || field === 'discount' || field === 'tax' ? Number(value) : value };
    if (field === 'product') {
      const p = products.find(prod => prod._id === value);
      if (p) newItems[i].price = p.price;
    }
    setForm({ ...form, items: newItems });
  };

  const statusBadge = (s) => {
    const map = {
      [QUOTE_STATUS.DRAFT]: { bg: 'bg-base-200', text: 'text-base-content/70', border: 'border-base-300', icon: FileText },
      [QUOTE_STATUS.SENT]: { bg: 'bg-info/15', text: 'text-info', border: 'border-info/20', icon: Send },
      [QUOTE_STATUS.ACCEPTED]: { bg: 'bg-success/15', text: 'text-success', border: 'border-success/20', icon: CheckCircle2 },
      [QUOTE_STATUS.DECLINED]: { bg: 'bg-error/15', text: 'text-error', border: 'border-error/20', icon: Ban },
      [QUOTE_STATUS.INVOICED]: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20', icon: Zap },
    };
    const c = map[s] || map.draft;
    return (
      <span className={`px-2 py-1 text-[10px] font-extrabold rounded-md tracking-wider border uppercase shadow-sm ${c.bg} ${c.text} ${c.border} inline-flex items-center gap-1`}>
        <c.icon className="w-3 h-3" /> {s}
      </span>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createQuote({ ...form, validUntil: new Date(form.validUntil).toISOString() })).unwrap();
      toast.success('Quote created');
      setShowModal(false);
      setForm({ customer: '', items: [{ product: '', quantity: 1, price: 0, discount: 0, tax: 0 }], validUntil: '', notes: '', termsAndConditions: 'Standard terms apply.' });
    } catch (err) {
      toast.error(err || 'Failed to create quote');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-base-content flex items-center gap-2">
            Quotes / Estimates
          </h1>
          <p className="text-sm text-base-content/50 font-medium">Create and track customer estimates</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm px-6 rounded-xl font-bold shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-1" /> New Quote
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
          <input 
            type="text" 
            placeholder="Search by quote number..." 
            className="input input-sm h-10 bg-base-100 border-base-200/60 rounded-xl focus:border-primary w-full pl-10 font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card bg-base-100 border border-base-200/60 shadow-sm rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-md w-full whitespace-nowrap">
            <thead>
              <tr className="bg-base-200/30 text-base-content/60 text-[11px] uppercase tracking-widest font-bold border-b border-base-200/60">
                <th className="px-6 py-4">Quote #</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4">Valid Until</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-200/40">
              {isLoading ? (
                <tr><td colSpan={6}><TableSkeleton rows={5} cols={6} /></td></tr>
              ) : quotes.length === 0 ? (
                <tr>
                   <td colSpan={6} className="text-center py-20 opacity-40">
                      <FileText className="w-12 h-12 mx-auto mb-2" />
                      <p className="font-bold">No quotes found</p>
                   </td>
                </tr>
              ) : quotes.map(q => (
                <tr key={q._id} className="hover:bg-base-200/20 transition-colors group">
                  <td className="px-6 py-4 font-mono font-bold text-sm text-primary">{q.quoteNumber}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-sm">{q.customer?.name || q.customer}</div>
                    <div className="text-[10px] text-base-content/40 uppercase tracking-tighter">Billed To</div>
                  </td>
                  <td className="px-6 py-4 text-right font-extrabold text-sm">{formatCurrency(q.totalAmount, organization)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-base-content/60">{formatDate(q.validUntil)}</td>
                  <td className="px-6 py-4 text-center">{statusBadge(q.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       {q.status === 'draft' && (
                         <button onClick={() => handleStatusChange(q._id, 'sent')} className="btn btn-ghost btn-xs text-info font-bold">Mark Sent</button>
                       )}
                       {q.status === 'sent' && (
                         <button onClick={() => handleStatusChange(q._id, 'accepted')} className="btn btn-ghost btn-xs text-success font-bold">Accept</button>
                       )}
                       {q.status === 'accepted' && (
                         <button onClick={() => handleConvert(q._id)} className="btn btn-primary btn-xs rounded-lg font-bold shadow-sm px-3 gap-1">
                           <Zap className="w-3 h-3" /> Convert to SO
                         </button>
                       )}
                       <button className="btn btn-ghost btn-xs btn-square"><MoreVertical className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Quote Modal */}
      <dialog className={`modal modal-bottom sm:modal-middle ${showModal ? 'modal-open' : ''}`}>
        <div className="modal-box w-11/12 max-w-4xl bg-base-100 p-0 overflow-hidden rounded-3xl border border-base-200/60 shadow-2xl">
          <div className="bg-base-200/30 px-8 py-6 border-b border-base-200/60 flex justify-between items-center">
             <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
               <FileText className="w-6 h-6 text-primary" /> New Estimate
             </h3>
             <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm btn-circle"><X className="w-5 h-5" /></button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="form-control">
                  <label className="label py-1"><span className="label-text text-[11px] font-bold uppercase tracking-widest text-base-content/50">Customer *</span></label>
                  <select className="select select-bordered bg-base-200/30 rounded-xl focus:border-primary w-full h-11" value={form.customer} onChange={e => setForm({...form, customer: e.target.value})} required>
                    <option value="">Select a Customer...</option>
                    {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
               </div>
               <div className="form-control">
                  <label className="label py-1"><span className="label-text text-[11px] font-bold uppercase tracking-widest text-base-content/50">Valid Until *</span></label>
                  <input type="date" className="input input-bordered bg-base-200/30 rounded-xl focus:border-primary w-full h-11" value={form.validUntil} onChange={e => setForm({...form, validUntil: e.target.value})} required />
               </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-base-content/40">Line Items</h4>
                  <button type="button" onClick={addItem} className="btn btn-ghost btn-xs text-primary font-bold gap-1 hover:bg-primary/10 rounded-lg">
                    <Plus className="w-3 h-3" strokeWidth={3} /> Add Row
                  </button>
               </div>
               
               {form.items.map((item, i) => (
                 <div key={i} className="grid grid-cols-12 gap-3 items-end group">
                    <div className="col-span-5 sm:col-span-4">
                       <select className="select select-bordered select-sm w-full rounded-xl bg-base-200/20" value={item.product} onChange={e => updateItem(i, 'product', e.target.value)} required>
                         <option value="">Select Product...</option>
                         {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                       </select>
                    </div>
                    <div className="col-span-2 sm:col-span-2">
                       <input type="number" placeholder="Qty" className="input input-bordered input-sm w-full rounded-xl bg-base-200/20 text-center" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} min="1" required />
                    </div>
                    <div className="col-span-3 sm:col-span-2">
                       <input type="number" placeholder="Price" className="input input-bordered input-sm w-full rounded-xl bg-base-200/20 text-right" value={item.price} onChange={e => updateItem(i, 'price', e.target.value)} step="0.01" required />
                    </div>
                    <div className="col-span-1 hidden sm:block">
                       <input type="number" placeholder="Tax" className="input input-bordered input-sm w-full rounded-xl bg-base-200/20 text-right" value={item.tax} onChange={e => updateItem(i, 'tax', e.target.value)} />
                    </div>
                    <div className="col-span-1 hidden sm:block">
                       <input type="number" placeholder="Disc" className="input input-bordered input-sm w-full rounded-xl bg-base-200/20 text-right" value={item.discount} onChange={e => updateItem(i, 'discount', e.target.value)} />
                    </div>
                    <div className="col-span-1 text-right flex items-center justify-center">
                       {form.items.length > 1 && (
                         <button type="button" onClick={() => removeItem(i)} className="btn btn-ghost btn-xs btn-circle text-error/30 hover:text-error hover:bg-error/10">
                           <X className="w-3 h-3" />
                         </button>
                       )}
                    </div>
                 </div>
               ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-base-200/60">
               <div className="space-y-4">
                  <div className="form-control">
                    <label className="label py-1"><span className="label-text text-[11px] font-bold uppercase tracking-widest text-base-content/40">Terms & Conditions</span></label>
                    <textarea className="textarea textarea-bordered bg-base-200/20 rounded-xl focus:border-primary text-xs" rows={3} value={form.termsAndConditions} onChange={e => setForm({...form, termsAndConditions: e.target.value})} />
                  </div>
               </div>
               <div className="bg-base-200/30 rounded-2xl p-6 space-y-3">
                  <div className="flex justify-between text-sm font-medium text-base-content/60">
                     <span>Subtotal</span>
                     <span>{formatCurrency(form.items.reduce((sum, i) => sum + (i.price * i.quantity), 0), organization)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-base-content/60">
                     <span>Line Discounts</span>
                     <span className="text-error">-{formatCurrency(form.items.reduce((sum, i) => sum + (i.discount || 0), 0), organization)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-base-content/60 border-b border-base-200/60 pb-3">
                     <span>Line Taxes</span>
                     <span className="text-success">+{formatCurrency(form.items.reduce((sum, i) => sum + (i.tax || 0), 0), organization)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                     <span className="text-sm font-black uppercase tracking-widest text-base-content/70">Total Estimate</span>
                     <span className="text-3xl font-black text-primary tracking-tighter">
                       {formatCurrency(form.items.reduce((sum, i) => sum + (i.price * i.quantity) - (i.discount || 0) + (i.tax || 0), 0), organization)}
                     </span>
                  </div>
               </div>
            </div>

            <div className="flex justify-end gap-3 pt-6">
               <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost rounded-xl font-bold">Cancel</button>
               <button type="submit" className="btn btn-primary px-10 rounded-xl font-bold shadow-lg shadow-primary/20">Send Estimate</button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop bg-base-900/40 backdrop-blur-sm"><button onClick={() => setShowModal(false)}>close</button></form>
      </dialog>
    </div>
  );
};

export default Quotes;

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSubscriptionStatus, createPortalSession } from '../store/slices/subscriptionSlice';
import RazorpayButton from '../components/RazorpayButton';
import { fetchQuotes, createQuote, updateQuoteStatus } from '../store/slices/quoteSlice';
import { fetchBills, createBill } from '../store/slices/billSlice';
import { fetchPayments, recordPayment } from '../store/slices/paymentSlice';
import { fetchCustomers } from '../store/slices/customerSlice';
import { fetchVendors } from '../store/slices/vendorSlice';
import { quoteSocketUpdate } from '../store/slices/quoteSlice';
import { billSocketUpdate } from '../store/slices/billSlice';
import { paymentSocketUpdate } from '../store/slices/paymentSlice';
import useRealtimeSync from '../hooks/useRealtimeSync';
import { Check, Sparkles, Zap, ShieldCheck, FileText, Receipt, CreditCard, Crown, Plus, X, CheckCircle2, Clock, AlertCircle, Send, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../services/api';
import { TableSkeleton } from '../components/Skeleton';
import { QUOTE_STATUS, BILL_STATUS, PAYMENT_MODE, PAYMENT_TYPE, SUBSCRIPTION_PLANS } from '../utils/constants';
import { formatCurrency, getCurrencySymbol, formatDate } from '../utils/format';

const Billing = () => {
  const dispatch = useDispatch();
  const [tab, setTab] = useState('quotes');
  const { status: subStatus, isLoading: subLoading } = useSelector((state) => state.subscription);
  const { quotes, isLoading: quotesLoading } = useSelector((state) => state.quotes);
  const { bills, isLoading: billsLoading } = useSelector((state) => state.bills);
  const { payments, isLoading: paymentsLoading } = useSelector((state) => state.payments);
  const { customers } = useSelector((state) => state.customers);
  const { items: vendors } = useSelector((state) => state.vendors);
  const { user } = useSelector((state) => state.auth);
  const organization = user?.organization;

  // Modal states
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [products, setProducts] = useState([]);

  // Form states
  const [quoteForm, setQuoteForm] = useState({ customer: '', items: [{ product: '', quantity: 1, price: 0 }], validUntil: '', notes: '' });
  const [billForm, setBillForm] = useState({ vendor: '', items: [{ product: '', quantity: 1, price: 0 }], dueDate: '' });
  const [paymentForm, setPaymentForm] = useState({ amount: '', type: PAYMENT_TYPE.RECEIVABLE, paymentMode: PAYMENT_MODE.BANK_TRANSFER, customer: '', vendor: '', reference: '', notes: '' });

  // Real-time synchronization
  useRealtimeSync('quotes', quoteSocketUpdate);
  useRealtimeSync('bills', billSocketUpdate);
  useRealtimeSync('payments', paymentSocketUpdate);

  useEffect(() => {
    dispatch(fetchSubscriptionStatus());
    dispatch(fetchQuotes());
    dispatch(fetchBills());
    dispatch(fetchPayments());
    dispatch(fetchCustomers());
    dispatch(fetchVendors());
  }, [dispatch]);

  useEffect(() => {
    if ((showQuoteModal || showBillModal) && products.length === 0) {
      API.get('/products?limit=500').then(({ data }) => setProducts(data.products || [])).catch(() => {});
    }
  }, [showQuoteModal, showBillModal, products.length]);

  // Quote handlers
  const handleCreateQuote = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...quoteForm, validUntil: new Date(quoteForm.validUntil).toISOString() };
      await dispatch(createQuote(payload)).unwrap();
      toast.success('Quote created successfully');
      setShowQuoteModal(false);
      setQuoteForm({ customer: '', items: [{ product: '', quantity: 1, price: 0 }], validUntil: '', notes: '' });
    } catch (err) { toast.error(err || 'Failed to create quote'); }
  };

  const handleQuoteStatus = async (id, status) => {
    try {
      await dispatch(updateQuoteStatus({ id, status })).unwrap();
      toast.success(`Quote ${status}`);
    } catch (err) { toast.error(err || 'Failed'); }
  };
  
  const handleConvertQuote = async (id) => {
    try {
      await API.post(`/quotes/${id}/convert`);
      toast.success('Quote converted to Sales Order');
      dispatch(fetchQuotes());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Conversion failed');
    }
  };

  // Bill handlers
  const handleCreateBill = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...billForm, dueDate: new Date(billForm.dueDate).toISOString() };
      await dispatch(createBill(payload)).unwrap();
      toast.success('Bill created successfully');
      setShowBillModal(false);
      setBillForm({ vendor: '', items: [{ product: '', quantity: 1, price: 0 }], dueDate: '' });
    } catch (err) { toast.error(err || 'Failed to create bill'); }
  };

  // Payment handlers
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      await dispatch(recordPayment({ ...paymentForm, amount: Number(paymentForm.amount) })).unwrap();
      toast.success('Payment recorded');
      setShowPaymentModal(false);
      setPaymentForm({ amount: '', type: PAYMENT_TYPE.RECEIVABLE, paymentMode: PAYMENT_MODE.BANK_TRANSFER, customer: '', supplier: '', reference: '', notes: '' });
    } catch (err) { toast.error(err || 'Failed to record payment'); }
  };

  const handleUpgradeSuccess = () => {
    dispatch(fetchSubscriptionStatus());
    toast.success('Your plan has been upgraded!');
  };

  const handleManage = async () => {
    try {
      const resultAction = await dispatch(createPortalSession());
      if (createPortalSession.fulfilled.match(resultAction)) window.location.href = resultAction.payload;
      else toast.error(resultAction.payload);
    } catch { toast.error('Something went wrong'); }
  };

  const quoteStatusBadge = (s) => {
    const map = {
      [QUOTE_STATUS.DRAFT]: { color: 'bg-base-200 text-base-content border-base-300', icon: FileText, label: 'Draft' },
      [QUOTE_STATUS.SENT]: { color: 'bg-info/15 text-info border-info/20', icon: Send, label: 'Sent' },
      [QUOTE_STATUS.ACCEPTED]: { color: 'bg-success/15 text-success border-success/20', icon: CheckCircle2, label: 'Accepted' },
      [QUOTE_STATUS.DECLINED]: { color: 'bg-error/15 text-error border-error/20', icon: Ban, label: 'Declined' },
      [QUOTE_STATUS.INVOICED]: { color: 'bg-primary/10 text-primary border-primary/20', icon: Receipt, label: 'Invoiced' },
    };
    const c = map[s] || map.draft;
    return <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg tracking-wider border uppercase shadow-sm ${c.color} inline-flex items-center gap-1`}><c.icon className="w-3 h-3" /> {c.label}</span>;
  };

  const billStatusBadge = (s) => {
    const map = {
      [BILL_STATUS.OPEN]: { color: 'bg-warning/15 text-warning border-warning/20', icon: Clock, label: 'Open' },
      [BILL_STATUS.PARTIALLY_PAID]: { color: 'bg-info/15 text-info border-info/20', icon: AlertCircle, label: 'Partial' },
      [BILL_STATUS.PAID]: { color: 'bg-success/15 text-success border-success/20', icon: CheckCircle2, label: 'Paid' },
      [BILL_STATUS.VOID]: { color: 'bg-error/15 text-error border-error/20', icon: Ban, label: 'Void' },
    };
    const c = map[s] || map.open;
    return <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg tracking-wider border uppercase shadow-sm ${c.color} inline-flex items-center gap-1`}><c.icon className="w-3 h-3" /> {c.label}</span>;
  };

  const addItem = (formSetter, form) => formSetter({ ...form, items: [...form.items, { product: '', quantity: 1, price: 0 }] });
  const removeItem = (formSetter, form, i) => formSetter({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (formSetter, form, i, field, value) => {
    const newItems = [...form.items];
    newItems[i] = { ...newItems[i], [field]: field === 'quantity' || field === 'price' ? Number(value) : value };
    formSetter({ ...form, items: newItems });
  };

  const plans = [
    { name: 'Free', price: 0, icon: Check, features: ['20 Products', '1 Warehouse', '2 Staff Members', 'Basic Reports'], color: 'base-content/40', bgClass: 'bg-base-200/50' },
    { name: 'Pro', price: 29, icon: Sparkles, features: ['500 Products', '5 Warehouses', '10 Staff Members', 'Advanced BI', 'CSV/JSON Exports'], color: 'primary', bgClass: 'bg-primary/10', popular: true },
    { name: 'Enterprise', price: 99, icon: Crown, features: ['Unlimited Products', 'Unlimited Warehouses', 'Unlimited Staff', 'Full BI Suite', 'Priority Support', 'API Access'], color: 'secondary', bgClass: 'bg-secondary/10' },
  ];

  const tabs = [
    { key: 'quotes', label: 'Quotes', icon: FileText },
    { key: 'bills', label: 'Bills', icon: Receipt },
    { key: 'payments', label: 'Payments', icon: CreditCard },
    { key: 'subscription', label: 'Plan', icon: Crown },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-base-content">Invoices & Bills</h1>
          <p className="text-base-content/60 text-sm font-medium mt-1">Manage quotes, bills, payments, and subscription</p>
        </div>
        <div className="flex items-center gap-2">
          {tab === 'quotes' && <button onClick={() => setShowQuoteModal(true)} className="btn btn-primary btn-sm px-4 rounded-md shadow-sm font-semibold"><Plus className="w-4 h-4 mr-1" /> New Quote</button>}
          {tab === 'bills' && <button onClick={() => setShowBillModal(true)} className="btn btn-primary btn-sm px-4 rounded-md shadow-sm font-semibold"><Plus className="w-4 h-4 mr-1" /> New Bill</button>}
          {tab === 'payments' && <button onClick={() => setShowPaymentModal(true)} className="btn btn-primary btn-sm px-4 rounded-md shadow-sm font-semibold"><Plus className="w-4 h-4 mr-1" /> Record Payment</button>}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-base-200/50 border border-base-200/60 p-1.5 rounded-2xl w-fit shadow-sm">
        {tabs.map(t => (
          <button key={t.key}
            className={`tab tab-sm md:tab-md font-bold rounded-xl transition-all h-10 px-6 gap-2 ${tab === t.key ? 'tab-active !bg-base-100 !text-primary shadow-[0_2px_10px_rgb(0,0,0,0.06)] ring-1 ring-base-200/60' : 'text-base-content/60 hover:text-base-content'}`}
            onClick={() => setTab(t.key)}
          >
            <t.icon className={`w-4 h-4 ${tab === t.key ? 'text-primary' : ''}`} /> {t.label}
          </button>
        ))}
      </div>

      {/* Quotes Tab */}
      {tab === 'quotes' && (
        <div className="card bg-base-100 border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            {quotesLoading ? <div className="p-6"><TableSkeleton rows={4} cols={6} /></div> : (
              <table className="table w-full whitespace-nowrap">
                <thead>
                  <tr className="border-y border-base-200/80 bg-base-100 font-bold text-base-content/70 text-[12px] tracking-wide">
                    <th className="px-4 py-3 font-semibold">QUOTE #</th>
                    <th className="px-4 py-3 font-semibold">CUSTOMER</th>
                    <th className="px-4 py-3 font-semibold">ITEMS</th>
                    <th className="px-4 py-3 text-right font-semibold">AMOUNT</th>
                    <th className="px-4 py-3 font-semibold">VALID UNTIL</th>
                    <th className="px-4 py-3 text-center font-semibold">STATUS</th>
                    <th className="px-4 py-3 text-center font-semibold">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-200/50 bg-base-100">
                  {(!quotes || quotes.length === 0) ? (
                    <tr><td colSpan="7" className="text-center py-24">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-20 h-20 bg-base-200/50 rounded-full flex items-center justify-center ring-4 ring-base-100 opacity-60"><FileText className="w-10 h-10 text-base-content/40" /></div>
                        <div><h3 className="text-xl font-extrabold tracking-tight text-base-content mb-1">No quotes yet</h3><p className="text-base-content/50 font-medium max-w-sm mx-auto">Create your first quote to get started.</p></div>
                      </div>
                    </td></tr>
                  ) : quotes.map(q => (
                    <tr key={q._id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group">
                      <td className="px-4 py-2.5 font-mono text-[13px] font-bold text-base-content/80">{q.quoteNumber}</td>
                      <td className="px-4 py-2.5 text-[13px] font-medium">{q.customer?.name || q.customer}</td>
                      <td className="px-4 py-2.5 text-[13px] font-medium">{q.items?.length || 0} items</td>
                      <td className="px-4 py-2.5 text-right font-bold text-[13px]">{formatCurrency(q.totalAmount, organization)}</td>
                      <td className="px-4 py-2.5 text-[13px] font-medium text-base-content/60">{formatDate(q.validUntil)}</td>
                      <td className="px-4 py-2.5 text-center">{quoteStatusBadge(q.status)}</td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          {q.status === QUOTE_STATUS.DRAFT && <button onClick={() => handleQuoteStatus(q._id, QUOTE_STATUS.SENT)} className="btn btn-xs btn-ghost text-primary font-bold">Send</button>}
                          {q.status === QUOTE_STATUS.SENT && <>
                            <button onClick={() => handleQuoteStatus(q._id, QUOTE_STATUS.ACCEPTED)} className="btn btn-xs btn-ghost text-success font-bold">Accept</button>
                            <button onClick={() => handleQuoteStatus(q._id, QUOTE_STATUS.DECLINED)} className="btn btn-xs btn-ghost text-error font-bold">Decline</button>
                          </>}
                          {q.status === QUOTE_STATUS.ACCEPTED && (
                            <button onClick={() => handleConvertQuote(q._id)} className="btn btn-xs btn-primary font-bold gap-1 shadow-sm">
                              <Zap className="w-3 h-3" /> Convert 
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Bills Tab */}
      {tab === 'bills' && (
        <div className="card bg-base-100 border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            {billsLoading ? <div className="p-6"><TableSkeleton rows={4} cols={6} /></div> : (
              <table className="table w-full whitespace-nowrap">
                <thead>
                  <tr className="border-y border-base-200/80 bg-base-100 font-bold text-base-content/70 text-[12px] tracking-wide">
                    <th className="px-4 py-3 font-semibold">BILL #</th>
                    <th className="px-4 py-3 font-semibold">VENDOR</th>
                    <th className="px-4 py-3 font-semibold">ITEMS</th>
                    <th className="px-4 py-3 text-right font-semibold">TOTAL</th>
                    <th className="px-4 py-3 text-right font-semibold">PAID</th>
                    <th className="px-4 py-3 font-semibold">DUE DATE</th>
                    <th className="px-4 py-3 text-center font-semibold">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-200/50 bg-base-100">
                  {(!bills || bills.length === 0) ? (
                    <tr><td colSpan="7" className="text-center py-24">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-20 h-20 bg-base-200/50 rounded-full flex items-center justify-center ring-4 ring-base-100 opacity-60"><Receipt className="w-10 h-10 text-base-content/40" /></div>
                        <div><h3 className="text-xl font-extrabold tracking-tight text-base-content mb-1">No bills yet</h3><p className="text-base-content/50 font-medium max-w-sm mx-auto">Create your first bill to track vendor invoices.</p></div>
                      </div>
                    </td></tr>
                  ) : bills.map(b => (
                    <tr key={b._id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group">
                      <td className="px-4 py-2.5 font-mono text-[13px] font-bold text-base-content/80">{b.billNumber}</td>
                      <td className="px-4 py-2.5 text-[13px] font-medium">{b.vendor?.name || b.vendor}</td>
                      <td className="px-4 py-2.5 text-[13px] font-medium">{b.items?.length || 0} items</td>
                      <td className="px-4 py-2.5 text-right font-bold text-[13px]">{formatCurrency(b.totalAmount, organization)}</td>
                      <td className="px-4 py-2.5 text-right text-[13px] font-medium text-success">{formatCurrency(b.amountPaid, organization)}</td>
                      <td className="px-4 py-2.5 text-[13px] font-medium text-base-content/60">{formatDate(b.dueDate)}</td>
                      <td className="px-4 py-2.5 text-center">{billStatusBadge(b.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {tab === 'payments' && (
        <div className="card bg-base-100 border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            {paymentsLoading ? <div className="p-6"><TableSkeleton rows={4} cols={6} /></div> : (
              <table className="table w-full whitespace-nowrap">
                <thead>
                  <tr className="border-y border-base-200/80 bg-base-100 font-bold text-base-content/70 text-[12px] tracking-wide">
                    <th className="px-4 py-3 font-semibold">PAYMENT #</th>
                    <th className="px-4 py-3 font-semibold">TYPE</th>
                    <th className="px-4 py-3 font-semibold">PARTY</th>
                    <th className="px-4 py-3 font-semibold">MODE</th>
                    <th className="px-4 py-3 text-right font-semibold">AMOUNT</th>
                    <th className="px-4 py-3 font-semibold">DATE</th>
                    <th className="px-4 py-3 font-semibold">REFERENCE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-200/50 bg-base-100">
                  {(!payments || payments.length === 0) ? (
                    <tr><td colSpan="7" className="text-center py-24">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-20 h-20 bg-base-200/50 rounded-full flex items-center justify-center ring-4 ring-base-100 opacity-60"><CreditCard className="w-10 h-10 text-base-content/40" /></div>
                        <div><h3 className="text-xl font-extrabold tracking-tight text-base-content mb-1">No payments yet</h3><p className="text-base-content/50 font-medium max-w-sm mx-auto">Record your first payment to start tracking.</p></div>
                      </div>
                    </td></tr>
                  ) : payments.map(p => (
                    <tr key={p._id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group">
                      <td className="px-4 py-2.5 font-mono text-[13px] font-bold text-base-content/80">{p.paymentNumber}</td>
                      <td className="px-4 py-2.5"><span className={`px-2 py-1 text-[10px] font-extrabold rounded-md tracking-wider border uppercase shadow-sm ${p.type === 'receivable' ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'}`}>{p.type === 'receivable' ? 'Received' : 'Payable'}</span></td>
                      <td className="px-4 py-2.5 text-[13px] font-medium">{p.customer?.name || p.vendor?.name || '-'}</td>
                      <td className="px-4 py-2.5"><span className="px-2 py-1 text-[10px] font-bold rounded-md bg-base-200 text-base-content border border-base-300 uppercase tracking-wider">{p.paymentMode?.replace('_', ' ')}</span></td>
                      <td className="px-4 py-2.5 text-right font-bold text-[13px]">{formatCurrency(p.amount, organization)}</td>
                      <td className="px-4 py-2.5 text-[13px] font-medium text-base-content/60">{formatDate(p.date)}</td>
                      <td className="px-4 py-2.5 text-[13px] font-mono text-base-content/50">{p.reference || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Subscription Tab */}
      {tab === 'subscription' && (
        <div className="space-y-8">
          {subStatus && (
            <div className="card bg-base-100/60 backdrop-blur-xl border border-base-200/60 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight">Current Plan: <span className="text-primary">{subStatus.plan || SUBSCRIPTION_PLANS.FREE}</span></h3>
                  {subStatus.currentPeriodEnd && <p className="text-sm text-base-content/60 mt-1">Renews {formatDate(subStatus.currentPeriodEnd)}</p>}
                </div>
                {subStatus.plan !== 'Free' && <button onClick={handleManage} className="btn btn-ghost btn-sm font-bold text-primary">Manage Subscription</button>}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => (
              <div key={plan.name} className={`card bg-base-100/60 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-base-200/60 rounded-3xl p-8 relative overflow-hidden transition-all hover:shadow-lg ${plan.popular ? 'ring-2 ring-primary ring-offset-2 ring-offset-base-100' : ''}`}>
                {plan.popular && <div className="absolute top-4 right-4"><span className="px-3 py-1 bg-primary text-primary-content text-[10px] font-extrabold uppercase tracking-widest rounded-full shadow-md">Popular</span></div>}
                <div className={`w-14 h-14 rounded-2xl ${plan.bgClass} flex items-center justify-center mb-6`}><plan.icon className={`w-7 h-7 text-${plan.color}`} /></div>
                <h3 className="text-2xl font-extrabold tracking-tight">{plan.name}</h3>
                <div className="mt-2 mb-6"><span className="text-4xl font-black tracking-tighter">{formatCurrency(plan.price, organization)}</span><span className="text-base-content/50 font-medium">/mo</span></div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (<li key={f} className="flex items-center gap-3 text-sm font-medium"><Check className="w-4 h-4 text-success flex-shrink-0" /> {f}</li>))}
                </ul>
                {subStatus?.plan?.toLowerCase() === plan.name.toLowerCase() ? (
                  <button className="btn btn-ghost w-full rounded-xl font-bold border border-base-200" disabled>Current Plan</button>
                ) : plan.price > 0 ? (
                  <RazorpayButton 
                    amount={plan.price} 
                    orderId={`SUB_${plan.name.toUpperCase()}_${user?._id}`} 
                    label="Upgrade Now"
                    onSuccess={handleUpgradeSuccess}
                    organization={organization}
                    user={user}
                  />
                ) : (
                  <button className="btn btn-ghost w-full rounded-xl font-bold border border-base-200" disabled>Free Forever</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quote Modal */}
      {showQuoteModal && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-2xl border border-base-200/60 shadow-2xl rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold tracking-tight">New Quote</h3>
              <button onClick={() => setShowQuoteModal(false)} className="btn btn-ghost btn-sm btn-circle"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateQuote} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase">Customer</span></label>
                  <select className="select select-bordered w-full rounded-xl" value={quoteForm.customer} onChange={e => setQuoteForm({ ...quoteForm, customer: e.target.value })} required>
                    <option value="">Select Customer</option>
                    {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase">Valid Until</span></label>
                  <input type="date" className="input input-bordered w-full rounded-xl" value={quoteForm.validUntil} onChange={e => setQuoteForm({ ...quoteForm, validUntil: e.target.value })} required />
                </div>
              </div>
              {quoteForm.items.map((item, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <select className="select select-bordered w-full rounded-xl select-sm" value={item.product} onChange={e => updateItem(setQuoteForm, quoteForm, i, 'product', e.target.value)} required>
                      <option value="">Select Product</option>
                      {products.map(p => <option key={p._id} value={p._id}>{p.name} ({formatCurrency(p.price, organization)})</option>)}
                    </select>
                  </div>
                  <input type="number" className="input input-bordered w-20 rounded-xl input-sm" value={item.quantity} onChange={e => updateItem(setQuoteForm, quoteForm, i, 'quantity', e.target.value)} min="1" required />
                  <input type="number" className="input input-bordered w-24 rounded-xl input-sm" placeholder="Price" value={item.price} onChange={e => updateItem(setQuoteForm, quoteForm, i, 'price', e.target.value)} min="0" step="0.01" />
                  {quoteForm.items.length > 1 && <button type="button" onClick={() => removeItem(setQuoteForm, quoteForm, i)} className="btn btn-ghost btn-sm btn-circle text-error"><X className="w-4 h-4" /></button>}
                </div>
              ))}
              <button type="button" onClick={() => addItem(setQuoteForm, quoteForm)} className="btn btn-ghost btn-sm text-primary font-bold"><Plus className="w-4 h-4" /> Add Item</button>
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase">Notes</span></label>
                <textarea className="textarea textarea-bordered w-full rounded-xl" rows={2} value={quoteForm.notes} onChange={e => setQuoteForm({ ...quoteForm, notes: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowQuoteModal(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-primary rounded-xl font-bold shadow-md shadow-primary/20">Create Quote</button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop"><button onClick={() => setShowQuoteModal(false)}>close</button></form>
        </dialog>
      )}

      {/* Bill Modal */}
      {showBillModal && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-2xl border border-base-200/60 shadow-2xl rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold tracking-tight">New Bill</h3>
              <button onClick={() => setShowBillModal(false)} className="btn btn-ghost btn-sm btn-circle"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateBill} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase">Vendor</span></label>
                  <select className="select select-bordered w-full rounded-xl" value={billForm.vendor} onChange={e => setBillForm({ ...billForm, vendor: e.target.value })} required>
                    <option value="">Select Vendor</option>
                    {(vendors || []).map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase">Due Date</span></label>
                  <input type="date" className="input input-bordered w-full rounded-xl" value={billForm.dueDate} onChange={e => setBillForm({ ...billForm, dueDate: e.target.value })} required />
                </div>
              </div>
              {billForm.items.map((item, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <select className="select select-bordered w-full rounded-xl select-sm" value={item.product} onChange={e => updateItem(setBillForm, billForm, i, 'product', e.target.value)} required>
                      <option value="">Select Product</option>
                      {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  </div>
                  <input type="number" className="input input-bordered w-20 rounded-xl input-sm" value={item.quantity} onChange={e => updateItem(setBillForm, billForm, i, 'quantity', e.target.value)} min="1" required />
                  <input type="number" className="input input-bordered w-24 rounded-xl input-sm" placeholder="Price" value={item.price} onChange={e => updateItem(setBillForm, billForm, i, 'price', e.target.value)} min="0" step="0.01" />
                  {billForm.items.length > 1 && <button type="button" onClick={() => removeItem(setBillForm, billForm, i)} className="btn btn-ghost btn-sm btn-circle text-error"><X className="w-4 h-4" /></button>}
                </div>
              ))}
              <button type="button" onClick={() => addItem(setBillForm, billForm)} className="btn btn-ghost btn-sm text-primary font-bold"><Plus className="w-4 h-4" /> Add Item</button>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowBillModal(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-primary rounded-xl font-bold shadow-md shadow-primary/20">Create Bill</button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop"><button onClick={() => setShowBillModal(false)}>close</button></form>
        </dialog>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-lg border border-base-200/60 shadow-2xl rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold tracking-tight">Record Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="btn btn-ghost btn-sm btn-circle"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase">Type</span></label>
                  <select className="select select-bordered w-full rounded-xl" value={paymentForm.type} onChange={e => setPaymentForm({ ...paymentForm, type: e.target.value })} required>
                    <option value={PAYMENT_TYPE.RECEIVABLE}>Money Received</option>
                    <option value={PAYMENT_TYPE.PAYABLE}>Money Paid</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase">Amount</span></label>
                  <input type="number" className="input input-bordered w-full rounded-xl" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} min="0.01" step="0.01" required placeholder="0.00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase">Payment Mode</span></label>
                  <select className="select select-bordered w-full rounded-xl" value={paymentForm.paymentMode} onChange={e => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}>
                    <option value={PAYMENT_MODE.BANK_TRANSFER}>Bank Transfer</option>
                    <option value={PAYMENT_MODE.CASH}>Cash</option>
                    <option value={PAYMENT_MODE.CHEQUE}>Cheque</option>
                    <option value={PAYMENT_MODE.CARD}>Card</option>
                    <option value={PAYMENT_MODE.UPI}>UPI</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase">{paymentForm.type === PAYMENT_TYPE.RECEIVABLE ? 'Customer' : 'Vendor'}</span></label>
                  {paymentForm.type === PAYMENT_TYPE.RECEIVABLE ? (
                    <select className="select select-bordered w-full rounded-xl" value={paymentForm.customer} onChange={e => setPaymentForm({ ...paymentForm, customer: e.target.value })}>
                      <option value="">Select Customer</option>
                      {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  ) : (
                    <select className="select select-bordered w-full rounded-xl" value={paymentForm.vendor} onChange={e => setPaymentForm({ ...paymentForm, vendor: e.target.value })}>
                      <option value="">Select Vendor</option>
                      {(vendors || []).map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                    </select>
                  )}
                </div>
              </div>
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase">Reference / Transaction ID</span></label>
                <input type="text" className="input input-bordered w-full rounded-xl" value={paymentForm.reference} onChange={e => setPaymentForm({ ...paymentForm, reference: e.target.value })} placeholder="e.g. TXN-12345" />
              </div>
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase">Notes</span></label>
                <textarea className="textarea textarea-bordered w-full rounded-xl" rows={2} value={paymentForm.notes} onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-primary rounded-xl font-bold shadow-md shadow-primary/20">Record Payment</button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop"><button onClick={() => setShowPaymentModal(false)}>close</button></form>
        </dialog>
      )}
    </div>
  );
};

export default Billing;

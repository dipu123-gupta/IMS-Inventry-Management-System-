import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchExpenses, addExpense, deleteExpense } from '../store/slices/expenseSlice';
import { Plus, Trash2, Receipt, ArrowDownRight, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { TableSkeleton } from '../components/Skeleton';
import ConfirmModal from '../components/ConfirmModal';
import { PAYMENT_MODE } from '../utils/constants';
import { formatCurrency, getCurrencySymbol, formatDate } from '../utils/format';

const Expenses = () => {
  const dispatch = useDispatch();
  const { expenses, isLoading } = useSelector((state) => state.expenses);
  const { user } = useSelector((state) => state.auth);
  const organization = user?.organization;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'other',
    date: new Date().toISOString().split('T')[0],
    description: '',
    paidTo: '',
    paymentMethod: PAYMENT_MODE.CASH
  });

  useEffect(() => {
    dispatch(fetchExpenses());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const resultAction = await dispatch(addExpense(formData));
    if (addExpense.fulfilled.match(resultAction)) {
      toast.success('Expense logged successfully');
      setIsModalOpen(false);
      setFormData({
        title: '',
        amount: '',
        category: 'other',
        date: new Date().toISOString().split('T')[0],
        description: '',
        paidTo: '',
        paymentMethod: PAYMENT_MODE.CASH
      });
    } else {
      toast.error(resultAction.payload);
    }
  };

  const handleDelete = () => {
    if (deletingId) {
      dispatch(deleteExpense(deletingId))
        .unwrap()
        .then(() => toast.success('Expense removed'))
        .catch((err) => toast.error(err));
      setDeletingId(null);
      setShowDeleteModal(false);
    }
  };

  const categories = [
    { value: 'rent', label: 'Rent' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'salary', label: 'Salary' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-base-content">Expense Management</h1>
          <p className="text-base-content/60 text-sm font-medium mt-1">Log and track organization overheads</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all font-bold tracking-wide gap-2">
          <Plus className="w-5 h-5" strokeWidth={3} /> Log Expense
        </button>
      </div>

      <div className="card bg-base-100 border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={5} cols={6} />
          </div>
        ) : expenses.length === 0 ? (
          <div className="card-body py-24 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-24 h-24 bg-base-200/50 rounded-full flex items-center justify-center mb-2">
              <Receipt className="w-12 h-12 text-base-content/20" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold tracking-tight text-base-content">No expenses recorded</h3>
              <p className="text-base-content/50 font-medium max-w-sm mx-auto mt-2 leading-relaxed">
                You haven't logged any business expenses yet. Start tracking your overheads to maintain accurate financials.
              </p>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary rounded-xl mt-4 font-bold shadow-lg shadow-primary/20">Log First Expense</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/30 border-b border-base-200/60 font-bold text-base-content/60 uppercase tracking-wider text-[11px]">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Title / Description</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Paid To</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200/50">
                {expenses.map((expense) => (
                  <tr key={expense._id} className="hover:bg-base-200/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-sm">{formatDate(expense.date)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-sm tracking-tight">{expense.title}</div>
                      <div className="text-[11px] text-base-content/50 font-medium tracking-wide mt-0.5 truncate max-w-xs">{expense.description || 'No description'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg tracking-wider border border-base-300 bg-base-200 uppercase shadow-sm">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium">
                        {expense.paidTo ? expense.paidTo : <span className="text-base-content/40 italic">Not specified</span>}
                      </div>
                      <div className="text-[10px] text-base-content/50 font-bold uppercase tracking-widest mt-0.5">{expense.paymentMethod}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-sm flex items-center justify-end gap-1 text-error">
                        <ArrowDownRight className="w-4 h-4" /> {formatCurrency(expense.amount, organization)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {['admin', 'manager'].includes(user?.role) && (
                          <button 
                            onClick={() => { setDeletingId(expense._id); setShowDeleteModal(true); }}
                            className="p-2 rounded-xl text-error hover:bg-error/10 transition-colors tooltip" data-tip="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Expense"
        message="Are you sure you want to delete this expense record? This action cannot be undone."
        type="danger"
      />

      {isModalOpen && (
        <dialog className="modal modal-open modal-bottom sm:modal-middle">
          <div className="modal-box max-w-2xl bg-base-100/95 backdrop-blur-3xl border border-base-200/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-3xl p-6 sm:p-8">
            <h3 className="font-extrabold text-2xl tracking-tight mb-6 flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <Receipt className="w-6 h-6" />
              </div>
              Log Business Expense
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div className="form-control md:col-span-2">
                  <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Title *</span></label>
                  <input type="text" className="input bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all" required placeholder="e.g., Office Rent - March"
                    value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                </div>

                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Amount ({getCurrencySymbol(organization)}) *</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40 font-bold">{getCurrencySymbol(organization)}</span>
                    <input type="number" className="input w-full pl-10 bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all" required step="0.01" min="0"
                      value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Category *</span></label>
                  <select className="select bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all" 
                    value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                    {categories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Date *</span></label>
                  <input type="date" className="input bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all" required
                    value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                </div>

                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Payment Method *</span></label>
                  <select className="select bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all"
                    value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}>
                    <option value={PAYMENT_MODE.CASH}>Cash</option>
                    <option value={PAYMENT_MODE.CARD}>Card</option>
                    <option value={PAYMENT_MODE.BANK_TRANSFER}>Bank Transfer</option>
                    <option value={PAYMENT_MODE.UPI}>UPI</option>
                  </select>
                </div>

                <div className="form-control md:col-span-2">
                  <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Paid To / Vendor</span></label>
                  <input type="text" className="input bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all" placeholder="e.g., Property Management Inc."
                    value={formData.paidTo} onChange={(e) => setFormData({ ...formData, paidTo: e.target.value })} />
                </div>

                <div className="form-control md:col-span-2">
                  <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Description</span></label>
                  <textarea className="textarea bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all min-h-[80px]" placeholder="Additional notes..."
                    value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>

                <div className="modal-action md:col-span-2 pt-4 border-t border-base-200/60 mt-6">
                  <button type="button" className="btn btn-ghost rounded-xl font-bold" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary rounded-xl font-bold shadow-lg shadow-primary/20 bg-primary/90 hover:bg-primary px-8">Log Expense</button>
                </div>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop bg-base-300/60 backdrop-blur-sm"><button onClick={() => setIsModalOpen(false)}>close</button></form>
        </dialog>
      )}
    </div>
  );
};

export default Expenses;

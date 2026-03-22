import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCustomers, createCustomer, deleteCustomer } from '../store/slices/customerSlice';
import { Plus, User, Mail, Phone, DollarSign, Trash2, Pencil, History, Users, Printer } from 'lucide-react';
import { TableSkeleton } from '../components/Skeleton';
import ConfirmModal from '../components/ConfirmModal';
import { formatCurrency, getCurrencySymbol } from '../utils/format';

const CustomerManagement = () => {
  const dispatch = useDispatch();
  const { customers, isLoading } = useSelector((state) => state.customers);
  const { user } = useSelector((state) => state.auth);
  const organization = user?.organization;
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '', creditLimit: 0 });

  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createCustomer(formData));
    setShowModal(false);
    setFormData({ name: '', email: '', phone: '', address: '', creditLimit: 0 });
  };

  const handleDelete = () => {
    if (deletingId) {
      dispatch(deleteCustomer(deletingId));
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
           <h1 className="text-2xl font-bold text-base-content flex items-center gap-2 cursor-pointer hover:bg-base-200/50 p-1.5 rounded-lg transition-colors">
              All Customers <span className="text-xs opacity-50 mt-1">▼</span>
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

      <div className="card bg-base-100 border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={5} cols={5} />
          </div>
        ) : customers.length === 0 ? (
          <div className="card-body py-24 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-24 h-24 bg-base-200/50 rounded-full flex items-center justify-center mb-2">
              <Users className="w-12 h-12 text-base-content/20" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold tracking-tight text-base-content">No customers found</h3>
              <p className="text-base-content/50 font-medium max-w-sm mx-auto mt-2 leading-relaxed">
                You haven't added any customers yet. Add your first client to start tracking their orders and balances.
              </p>
            </div>
            <button onClick={() => setShowModal(true)} className="btn btn-primary rounded-xl mt-4 font-bold shadow-lg shadow-primary/20">Add First Customer</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="border-y border-base-200/80 bg-base-100 font-bold text-base-content/70 text-[12px] tracking-wide">
                  <th className="w-12 px-4 py-3"><input type="checkbox" className="checkbox checkbox-sm rounded border-base-300" /></th>
                  <th className="px-4 py-3 font-semibold">CUSTOMER</th>
                  <th className="px-4 py-3 font-semibold">CONTACT INFO</th>
                  <th className="px-4 py-3 font-semibold">STATUS</th>
                  <th className="px-4 py-3 text-right font-semibold">BALANCE</th>
                  <th className="px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200/50 bg-base-100">
                {customers.map((customer) => (
                  <tr key={customer._id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group cursor-pointer border-b border-base-200/50">
                    <td className="px-4 py-2.5">
                      <input type="checkbox" className="checkbox checkbox-sm rounded border-base-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-[13px] text-blue-600 dark:text-blue-400 hover:underline">{customer.name}</div>
                      <div className="text-[11px] text-base-content/60 font-medium tracking-wide mt-0.5 truncate max-w-[200px]">{customer.address || 'No address'}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="text-xs font-semibold flex items-center gap-2 mb-1">
                        <span className={customer.email ? 'text-base-content/80' : 'text-base-content/40 italic'}>{customer.email || 'N/A'}</span>
                      </div>
                      <div className="text-xs font-semibold flex items-center gap-2">
                        <span className="text-base-content/80 text-[11px] opacity-70">📞 {customer.phone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      {customer.currentBalance > 0 ? (
                        <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-md border border-warning/20 bg-warning/15 text-warning-content dark:text-warning uppercase shadow-sm">Payer</span>
                      ) : (
                        <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-md border border-success/20 bg-success/15 text-success-content dark:text-success uppercase shadow-sm">Clear</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className={`font-medium text-[13px] text-right flex items-center justify-end ${customer.currentBalance > 0 ? 'text-warning font-bold' : 'text-base-content/80'}`}>
                        {formatCurrency(customer.currentBalance, organization)}
                      </div>
                      <div className="text-[10px] text-base-content/40 font-bold uppercase tracking-widest mt-0.5 opacity-60">Limit: {formatCurrency(customer.creditLimit, organization)}</div>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition-colors" title="History"><History className="w-3.5 h-3.5" /></button>
                        <button className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={(e) => { e.stopPropagation(); setDeletingId(customer._id); setShowDeleteModal(true); }} className="p-1.5 rounded text-error hover:bg-error/10 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
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
        title="Delete Customer"
        message="Are you sure you want to delete this customer? This will permanentely remove their purchase history and credit data."
        type="danger"
      />

      {showModal && (
        <dialog className="modal modal-open modal-bottom sm:modal-middle">
          <div className="modal-box max-w-2xl bg-base-100/95 backdrop-blur-3xl border border-base-200/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-3xl p-6 sm:p-8">
            <h3 className="font-extrabold text-2xl tracking-tight mb-6">Register New Customer</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Full Name *</span></label>
                  <input
                    type="text"
                    className="input bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Email Address</span></label>
                  <input
                    type="email"
                    className="input bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Phone Number *</span></label>
                  <input
                    type="text"
                    className="input bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Credit Limit ({getCurrencySymbol(organization)})</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40 font-bold">{getCurrencySymbol(organization)}</span>
                    <input
                      type="number"
                      className="input w-full pl-8 bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all"
                      value={formData.creditLimit}
                      onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-control md:col-span-2">
                  <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Address</span></label>
                  <textarea
                    className="textarea bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all min-h-[80px]"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  ></textarea>
                </div>
                <div className="modal-action md:col-span-2 pt-4 border-t border-base-200/60 mt-6">
                  <button type="button" className="btn btn-ghost rounded-xl font-bold" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary rounded-xl font-bold shadow-lg shadow-primary/20 bg-primary/90 hover:bg-primary px-8">Save Customer</button>
                </div>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop bg-base-300/60 backdrop-blur-sm"><button onClick={() => setShowModal(false)}>close</button></form>
        </dialog>
      )}
    </div>
  );
};

export default CustomerManagement;

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVendors, deleteVendor, createVendor, updateVendor } from '../store/slices/vendorSlice';
import { Truck, Plus, Pencil, Trash2, Search, Building, MapPin, Phone, Mail, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { TableSkeleton } from '../components/Skeleton';

const emptyForm = { name: '', email: '', phone: '', company: '', address: { street: '', city: '', state: '', zip: '', country: '' } };

const Vendors = () => {
  const dispatch = useDispatch();
  const { items, total, pages, isLoading } = useSelector((s) => s.vendors);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    dispatch(fetchVendors({ page: currentPage, limit: 10, search }));
  }, [dispatch, currentPage, search]);

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setShowModal(true); };
  const openEdit = (s) => { setForm({ ...emptyForm, ...s, address: { ...emptyForm.address, ...s.address } }); setEditingId(s._id); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await dispatch(updateVendor({ id: editingId, vendorData: form })).unwrap();
        toast.success('Vendor updated successfully');
      } else {
        await dispatch(createVendor(form)).unwrap();
        toast.success('Vendor created successfully');
      }
      setShowModal(false);
      dispatch(fetchVendors({ page: currentPage, limit: 10, search }));
    } catch (err) {
      toast.error(err || 'Failed to process request');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this vendor? This action cannot be reversed.')) return;
    try {
      await dispatch(deleteVendor(id)).unwrap();
      toast.success('Vendor deleted');
    } catch (err) {
      toast.error(err || 'Failed to delete vendor');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
           <h1 className="text-2xl font-bold text-base-content flex items-center gap-2 cursor-pointer hover:bg-base-200/50 p-1.5 rounded-lg transition-colors">
              All Vendors <span className="text-xs opacity-50 mt-1">▼</span>
           </h1>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={openCreate} className="btn btn-primary btn-sm px-4 rounded-md shadow-sm font-semibold">
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
          placeholder="Search vendors by name, company, or email..." 
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
                <th className="px-4 py-3 font-semibold">VENDOR NAME</th>
                <th className="px-4 py-3 font-semibold">COMPANY NAME</th>
                <th className="px-4 py-3 font-semibold">EMAIL</th>
                <th className="px-4 py-3 font-semibold">PHONE</th>
                <th className="px-4 py-3 font-semibold">CITY</th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
              <tbody className="divide-y divide-base-200/50 bg-base-100">
              {isLoading ? (
                <tr><td colSpan={7} className="p-0"><TableSkeleton rows={5} cols={7} /></td></tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-20">
                    <div className="flex flex-col items-center space-y-3 opacity-40">
                      <Truck className="w-12 h-12" />
                      <p className="font-extrabold text-lg">No vendors found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((s) => (
                  <tr key={s._id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group cursor-pointer border-b border-base-200/50">
                    <td className="px-4 py-2.5">
                      <input type="checkbox" className="checkbox checkbox-sm rounded border-base-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-[13px] text-blue-600 dark:text-blue-400 hover:underline">{s.name}</span>
                    </td>
                    <td className="px-4 py-2.5 text-[13px] text-base-content/80">
                      {s.company || <span className="opacity-40 italic">N/A</span>}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-[13px] text-base-content/80">
                      {s.email}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[13px] text-base-content/80">
                      {s.phone}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-[13px] text-base-content/80">
                      {s.address?.city || <span className="opacity-40 italic">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); openEdit(s); }} className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(s._id); }} className="p-1.5 rounded text-error hover:bg-error/10 transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal */}
      <dialog className={`modal modal-bottom sm:modal-middle ${showModal ? 'modal-open' : ''}`}>
        <div className="modal-box w-full sm:w-11/12 max-w-2xl bg-base-100/95 backdrop-blur-3xl border border-base-200/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-3xl p-4 sm:p-6 md:p-8">
          <h3 className="font-extrabold text-2xl tracking-tight mb-6 flex items-center gap-3">
            <Truck className="w-6 h-6 text-primary" /> {editingId ? 'Edit Vendor Details' : 'Register New Vendor'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Contact Name *</span></label>
                <input type="text" className="input bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="E.g. John Doe" />
              </div>
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Company Name</span></label>
                <input type="text" className="input bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all" value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="E.g. Acme Corp" />
              </div>
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Email Address *</span></label>
                <input type="email" className="input bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="john@example.com" />
              </div>
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Phone / Contact *</span></label>
                <input type="text" className="input bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} required placeholder="+1 (555) 123-4567" />
              </div>
            </div>

            <div className="bg-base-200/30 p-5 rounded-2xl border border-base-200/60 gap-5 grid grid-cols-1 sm:grid-cols-2">
              <div className="col-span-1 sm:col-span-2">
                <h4 className="font-bold text-sm tracking-widest text-base-content/50 uppercase mb-2">Location Information</h4>
              </div>
              <div className="form-control sm:col-span-2">
                <label className="label py-1"><span className="label-text text-[10px] font-bold tracking-wider uppercase text-base-content/50">Street Address</span></label>
                <input type="text" className="input bg-base-100 border-base-200/80 rounded-xl focus:border-primary w-full" value={form.address.street}
                  onChange={(e) => setForm({ ...form, address: { ...form.address, street: e.target.value } })} placeholder="123 Vendor Ave..." />
              </div>
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-[10px] font-bold tracking-wider uppercase text-base-content/50">City</span></label>
                <input type="text" className="input bg-base-100 border-base-200/80 rounded-xl focus:border-primary w-full" value={form.address.city}
                  onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })} placeholder="New York" />
              </div>
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-[10px] font-bold tracking-wider uppercase text-base-content/50">State / Province</span></label>
                <input type="text" className="input bg-base-100 border-base-200/80 rounded-xl focus:border-primary w-full" value={form.address.state}
                  onChange={(e) => setForm({ ...form, address: { ...form.address, state: e.target.value } })} placeholder="NY" />
              </div>
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-[10px] font-bold tracking-wider uppercase text-base-content/50">Zip / Postal Code</span></label>
                <input type="text" className="input bg-base-100 border-base-200/80 rounded-xl focus:border-primary w-full" value={form.address.zip}
                  onChange={(e) => setForm({ ...form, address: { ...form.address, zip: e.target.value } })} placeholder="10001" />
              </div>
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-[10px] font-bold tracking-wider uppercase text-base-content/50">Country</span></label>
                <input type="text" className="input bg-base-100 border-base-200/80 rounded-xl focus:border-primary w-full" value={form.address.country}
                  onChange={(e) => setForm({ ...form, address: { ...form.address, country: e.target.value } })} placeholder="United States" />
              </div>
            </div>

            <div className="modal-action pt-4 border-t border-base-200/60 mt-6">
              <button type="button" className="btn btn-ghost rounded-xl font-bold" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 px-8">{editingId ? 'Save Changes' : 'Register Vendor'}</button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop bg-base-300/60 backdrop-blur-sm"><button onClick={() => setShowModal(false)}>close</button></form>
      </dialog>
    </div>
  );
};

export default Vendors;

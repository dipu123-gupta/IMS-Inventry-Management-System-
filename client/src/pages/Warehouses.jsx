import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWarehouses, createWarehouse, deleteWarehouse } from '../store/slices/warehouseSlice';
import { Plus, MapPin, User, Phone, Trash2, Building2, ExternalLink, Pencil, Printer, Download } from 'lucide-react';
import { CardSkeleton } from '../components/Skeleton';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

const WarehouseManagement = () => {
  const dispatch = useDispatch();
  const { warehouses, isLoading } = useSelector((state) => state.warehouses);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    location: '', 
    address: '', 
    city: '', 
    state: '', 
    country: 'India', 
    postalCode: '', 
    parentWarehouse: null,
    contactNumber: '' 
  });

  useEffect(() => {
    dispatch(fetchWarehouses());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createWarehouse(formData)).unwrap();
      toast.success('Warehouse created successfully');
      setShowModal(false);
      setFormData({ 
        name: '', 
        location: '', 
        address: '', 
        city: '', 
        state: '', 
        country: 'India', 
        postalCode: '', 
        parentWarehouse: null,
        contactNumber: '' 
      });
    } catch (err) {
      toast.error(err?.message || err || 'Failed to create warehouse');
    }
  };

  const handleDelete = () => {
    if (deletingId) {
      dispatch(deleteWarehouse(deletingId));
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
           <h1 className="text-2xl font-bold text-base-content flex items-center gap-2 cursor-pointer hover:bg-base-200/50 p-1.5 rounded-lg transition-colors">
              All Warehouses <span className="text-xs opacity-50 mt-1">▼</span>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <CardSkeleton count={6} />
        ) : warehouses.length === 0 ? (
          <div className="col-span-full card bg-base-100 border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl py-24 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-24 h-24 bg-base-200/50 rounded-full flex items-center justify-center mb-2">
               <Building2 className="w-12 h-12 text-base-content/20" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold tracking-tight text-base-content">No locations configured</h3>
              <p className="text-base-content/50 font-medium max-w-sm mx-auto mt-2 leading-relaxed">
                Add your first warehouse or physical location to start tracking stock across multiple areas.
              </p>
            </div>
            <button onClick={() => setShowModal(true)} className="btn btn-primary rounded-xl mt-4 font-bold shadow-lg shadow-primary/20">Add First Location</button>
          </div>
        ) : (
          warehouses.map((warehouse) => (
            <div key={warehouse._id} className="card bg-base-100 border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 rounded-3xl transition-all duration-300 group overflow-hidden">
              <div className="h-2 w-full bg-gradient-to-r from-primary to-primary/60"></div>
              <div className="card-body p-6">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-3 items-center">
                      <div className="p-2.5 bg-primary/10 text-primary rounded-xl border border-primary/20 shadow-sm">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <h2 className="card-title text-xl font-extrabold tracking-tight text-base-content">{warehouse.name}</h2>
                    </div>
                    {warehouse.parentWarehouse && (
                      <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest ml-12">
                        Sub-unit of {warehouse.parentWarehouse.name}
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => { setDeletingId(warehouse._id); setShowDeleteModal(true); }}
                    className="p-2 rounded-xl text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-all tooltip tooltip-left" data-tip="Delete Warehouse"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-4 mt-6 text-sm">
                  <div className="flex items-start gap-3 text-base-content/70">
                    <MapPin className="w-4 h-4 mt-0.5 text-base-content/40 flex-shrink-0" /> 
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium leading-relaxed">{warehouse.address || warehouse.location || 'No address set'}</span>
                      {(warehouse.city || warehouse.state) && (
                        <span className="text-[11px] opacity-60 font-bold uppercase">{warehouse.city}, {warehouse.state} {warehouse.postalCode}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-base-content/70">
                    <Phone className="w-4 h-4 text-base-content/40 flex-shrink-0" /> 
                    <span className="font-medium">{warehouse.contactNumber || 'No contact number'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-base-content/70">
                    <User className="w-4 h-4 text-base-content/40 flex-shrink-0" /> 
                    <span className="font-medium bg-base-200/50 px-2.5 py-1 rounded-lg border border-base-200/80">
                      Manager: <span className="text-base-content font-semibold ml-1">{warehouse.manager?.name || 'Unassigned'}</span>
                    </span>
                  </div>
                </div>
                
                <div className="card-actions justify-end mt-8 pt-4 border-t border-base-200/50">
                  <button className="btn btn-sm btn-ghost rounded-xl font-bold gap-1.5 text-base-content/60 hover:text-base-content w-full sm:w-auto">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button className="btn btn-sm btn-primary bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-primary-content hover:border-primary rounded-xl font-bold gap-1.5 shadow-sm w-full sm:w-auto">
                    View Details <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Warehouse"
        message="Are you sure you want to delete this warehouse? All stock associations will be severed and cannot be reversed."
        type="danger"
      />

      {showModal && (
        <dialog className="modal modal-open modal-bottom sm:modal-middle">
          <div className="modal-box w-11/12 max-w-3xl bg-base-100/95 backdrop-blur-3xl border border-base-200/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-3xl p-6 sm:p-8">
            <h3 className="font-extrabold text-2xl tracking-tight mb-6">Add New Warehouse</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-control col-span-full">
                  <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Warehouse Name *</span></label>
                  <input type="text" className="input bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all"
                    value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Main Fulfillment Center" required />
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Parent Warehouse</span></label>
                  <select className="select select-bordered bg-base-200/50 border-base-200/60 rounded-xl" 
                    value={formData.parentWarehouse || ''} onChange={(e) => setFormData({ ...formData, parentWarehouse: e.target.value || null })}>
                    <option value="">None (Top-level)</option>
                    {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Contact Number</span></label>
                  <input type="text" className="input bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all"
                    value={formData.contactNumber} onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })} placeholder="+1 (555) 000-0000" />
                </div>
                <div className="form-control col-span-full">
                  <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Street Address</span></label>
                  <input type="text" className="input bg-base-200/50 border-base-200/60 rounded-xl"
                    value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="123 Logistics Way" />
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">City</span></label>
                  <input type="text" className="input bg-base-200/50 border-base-200/60 rounded-xl"
                    value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="City" />
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">State / Province</span></label>
                  <input type="text" className="input bg-base-200/50 border-base-200/60 rounded-xl"
                    value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} placeholder="State" />
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Country</span></label>
                  <input type="text" className="input bg-base-200/50 border-base-200/60 rounded-xl"
                    value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Postal Code</span></label>
                  <input type="text" className="input bg-base-200/50 border-base-200/60 rounded-xl"
                    value={formData.postalCode} onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })} placeholder="ZIP / PIN" />
                </div>
              </div>
              <div className="modal-action pt-4 border-t border-base-200/60 mt-6">
                <button type="button" className="btn btn-ghost rounded-xl font-bold" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary rounded-xl font-bold shadow-lg shadow-primary/20 bg-primary/90 hover:bg-primary px-8">Create Warehouse</button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop bg-base-300/60 backdrop-blur-sm"><button onClick={() => setShowModal(false)}>close</button></form>
        </dialog>
      )}
    </div>
  );
};

export default WarehouseManagement;

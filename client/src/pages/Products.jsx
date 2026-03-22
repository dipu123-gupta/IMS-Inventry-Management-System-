import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, deleteProduct, createProduct, updateProduct, productSocketUpdate } from '../store/slices/productSlice';
import useRealtimeSync from '../hooks/useRealtimeSync';
import JsBarcode from 'jsbarcode';
import { Plus, Pencil, Trash2, Search, Tag, Printer, Package, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { TableSkeleton } from '../components/Skeleton';
import ConfirmModal from '../components/ConfirmModal';
import { formatCurrency, getCurrencySymbol } from '../utils/format';
import API from '../services/api';

const BarcodeRenderer = ({ value }) => {
  const barcodeRef = useRef(null);
  useEffect(() => {
    if (barcodeRef.current && value) {
      JsBarcode(barcodeRef.current, value, {
        format: "CODE128",
        lineColor: "#000",
        width: 1.5,
        height: 40,
        displayValue: false
      });
    }
  }, [value]);

  return <svg ref={barcodeRef} className="max-w-full h-auto rounded-md shadow-sm"></svg>;
};

const emptyForm = { 
  name: '', 
  sku: '', 
  barcode: '', 
  category: '', 
  description: '', 
  price: '', 
  cost: '', 
  lowStockThreshold: 10, 
  images: [],
  variants: [] 
};

const Products = () => {
  const dispatch = useDispatch();
  const { items, total, pages, page, isLoading } = useSelector((s) => s.products);
  const { user } = useSelector((s) => s.auth);
  const organization = user?.organization;
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null, name: '' });

  // Real-time synchronization
  useRealtimeSync('products', productSocketUpdate);

  useEffect(() => {
    dispatch(fetchProducts({ page: currentPage, limit: 10, search }));
  }, [dispatch, currentPage, search]);

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setShowModal(true); };
  const openEdit = (p) => { 
    setForm({ 
      name: p.name, 
      sku: p.sku, 
      barcode: p.barcode, 
      category: p.category, 
      description: p.description, 
      price: p.price, 
      cost: p.cost, 
      lowStockThreshold: p.lowStockThreshold,
      images: p.images || (p.image ? [p.image] : []),
      variants: p.variants || []
    }); 
    setEditingId(p._id); 
    setShowModal(true); 
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const { data } = await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setForm(prev => ({ ...prev, images: [...prev.images, data.url] }));
      toast.success('Image uploaded');
    } catch (err) {
      toast.error('Upload failed');
    }
  };

  const addVariant = () => {
    setForm(prev => ({
      ...prev,
      variants: [...prev.variants, { name: '', sku: '', price: prev.price, cost: prev.cost, options: [] }]
    }));
  };

  const removeVariant = (index) => {
    setForm(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const updateVariant = (index, field, value) => {
    setForm(prev => {
      const newVariants = [...prev.variants];
      newVariants[index] = { ...newVariants[index], [field]: value };
      return { ...prev, variants: newVariants };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await dispatch(updateProduct({ id: editingId, productData: form })).unwrap();
        toast.success('Product updated');
      } else {
        await dispatch(createProduct(form)).unwrap();
        toast.success('Product created');
      }
      setShowModal(false);
      dispatch(fetchProducts({ page: currentPage, limit: 10, search }));
    } catch (err) {
      toast.error(err || 'Failed');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete.id) return;
    try {
      await dispatch(deleteProduct(confirmDelete.id)).unwrap();
      toast.success('Product deleted');
      setConfirmDelete({ show: false, id: null, name: '' });
    } catch (err) {
      toast.error(err || 'Failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
           <h1 className="text-2xl font-bold text-base-content flex items-center gap-2 cursor-pointer hover:bg-base-200/50 p-1.5 rounded-lg transition-colors">
              All Items <span className="text-xs opacity-50 mt-1">▼</span>
           </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openCreate} className="btn btn-primary btn-sm px-4 rounded-md shadow-sm font-semibold">
             <Plus className="w-4 h-4 mr-1" /> New
          </button>
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-square btn-sm btn-ghost rounded-md border border-base-200"><Printer className="w-4 h-4 text-base-content/70" /></label>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 mt-2">
              <li><a>Print Barcodes</a></li>
              <li><a>Export as CSV</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
        <input type="text" placeholder="Search by name, SKU, or category..." 
          className="input w-full pl-11 bg-base-100 border-base-200/60 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
          value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
      </div>

      {/* Table border wrapper */}
      <div className="card bg-base-100 border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={8} cols={8} />
          </div>
        ) : items.length === 0 ? (
          <div className="card-body py-24 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-24 h-24 bg-base-200/50 rounded-full flex items-center justify-center mb-2">
              <Package className="w-12 h-12 text-base-content/20" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold tracking-tight text-base-content">No products found</h3>
              <p className="text-base-content/50 font-medium max-w-sm mx-auto mt-2 leading-relaxed">
                {search ? `No products matching "${search}" were found in your inventory.` : "You haven't added any products yet. Get started by creating your first one!"}
              </p>
            </div>
            {!search && (
              <button onClick={openCreate} className="btn btn-primary rounded-xl mt-4 font-bold shadow-lg shadow-primary/20">Add First Product</button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="border-y border-base-200/80 bg-base-100 font-bold text-base-content/70 text-[12px] tracking-wide">
                  <th className="w-12 px-4 py-3"><input type="checkbox" className="checkbox checkbox-sm rounded border-base-300" /></th>
                  <th className="px-4 py-3 font-semibold">NAME</th>
                  <th className="px-4 py-3 font-semibold">SKU / BARCODE</th>
                  <th className="px-4 py-3 font-semibold">CATEGORY</th>
                  <th className="px-4 py-3 text-right font-semibold">STOCK ON HAND</th>
                  <th className="px-4 py-3 text-right font-semibold">PURCHASE RATE</th>
                  <th className="px-4 py-3 text-right font-semibold">SALES RATE</th>
                  <th className="px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200/50 bg-base-100">
                {items.map((p) => (
                  <tr key={p._id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group cursor-pointer border-b border-base-200/50">
                    <td className="px-4 py-2.5">
                      <input type="checkbox" className="checkbox checkbox-sm rounded border-base-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        {p.images?.length > 0 ? (
                          <img src={p.images[0]} alt={p.name} className="w-8 h-8 rounded object-cover border border-base-200 shadow-sm" />
                        ) : p.image ? (
                          <img src={p.image} alt={p.name} className="w-8 h-8 rounded object-cover border border-base-200 shadow-sm" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-base-200/60 flex items-center justify-center border border-base-200 shadow-sm">
                            <Package className="w-4 h-4 text-base-content/30" />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-medium text-[13px] text-blue-600 dark:text-blue-400 hover:underline">{p.name}</span>
                          {p.variants?.length > 0 && (
                            <span className="text-[10px] text-base-content/40">{p.variants.length} variants</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="text-[13px] text-base-content/80 font-mono">{p.sku}</div>
                      <div className="text-[10px] text-base-content/40 mt-0.5">{p.barcode || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-2.5 text-[13px] text-base-content/80">{p.category}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-[13px]">
                       <span className={p.isLowStock ? 'text-error font-bold' : 'text-success'}>{p.totalQuantity || 0}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-[13px] text-base-content/80">{formatCurrency(p.cost, organization)}</td>
                    <td className="px-4 py-2.5 text-right text-[13px] text-base-content/80">{formatCurrency(p.price, organization)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); openEdit(p); }} className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setConfirmDelete({ show: true, id: p._id, name: p.name }); }} className="p-1.5 rounded text-error hover:bg-error/10 transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="join shadow-sm border border-base-200/60 rounded-xl bg-base-100">
            {Array.from({ length: pages }, (_, i) => (
              <button key={i} className={`join-item btn btn-sm border-0 ${currentPage === i + 1 ? 'bg-primary text-primary-content font-bold shadow-inner' : 'bg-transparent text-base-content/70 hover:bg-base-200 hover:text-base-content font-semibold'}`}
                onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <dialog className={`modal modal-bottom sm:modal-middle ${showModal ? 'modal-open' : ''}`}>
        <div className="modal-box w-11/12 max-w-2xl bg-base-100/95 backdrop-blur-3xl border border-base-200/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-3xl p-6 sm:p-8">
          <h3 className="font-extrabold text-2xl tracking-tight mb-6">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Name *</span></label>
                <input type="text" className="input bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">SKU *</span></label>
                <input type="text" className="input bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-mono text-sm transition-all" value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
              </div>
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Category *</span></label>
                <input type="text" className="input bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all" value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })} required />
              </div>
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Barcode</span></label>
                <input type="text" className="input bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-mono text-sm transition-all" value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
              </div>
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Selling Price *</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40 font-bold">{getCurrencySymbol(organization)}</span>
                  <input type="number" step="0.01" className="input w-full pl-8 bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all" value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                </div>
              </div>
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Cost Price *</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40 font-bold">{getCurrencySymbol(organization)}</span>
                  <input type="number" step="0.01" className="input w-full pl-8 bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all" value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })} required />
                </div>
              </div>
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Low Stock Threshold</span></label>
                <input type="number" className="input bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all" value={form.lowStockThreshold}
                  onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} />
              </div>
              <div className="form-control sm:col-span-2 mt-[-4px]">
                <span className="text-[11px] font-bold text-info bg-info/10 px-3 py-2 rounded-lg border border-info/20 inline-block w-fit">ℹ️ Stock levels are managed via Purchases and Transfers</span>
              </div>
              <div className="form-control sm:col-span-2">
                <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Description</span></label>
                <textarea className="textarea bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all min-h-[80px]" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}></textarea>
              </div>

              {/* Image Upload Area */}
              <div className="form-control sm:col-span-2">
                <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Images</span></label>
                <div className="flex flex-wrap gap-4 p-4 border-2 border-dashed border-base-200 rounded-2xl bg-base-200/20">
                  {form.images?.map((img, idx) => (
                    <div key={idx} className="relative group w-20 h-20">
                      <img src={img} className="w-full h-full object-cover rounded-lg border border-base-200 shadow-sm" />
                      <button type="button" onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))}
                        className="absolute -top-2 -right-2 bg-error text-error-content rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-base-300 rounded-lg cursor-pointer hover:bg-base-200/50 transition-colors">
                    <Plus className="w-6 h-6 text-base-content/30" />
                    <span className="text-[10px] text-base-content/50 font-bold mt-1 uppercase">Add</span>
                    <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                  </label>
                </div>
              </div>

              {/* Variant Management Section */}
              <div className="form-control sm:col-span-2 space-y-4">
                <div className="flex items-center justify-between border-b border-base-200 pb-2">
                  <h4 className="text-sm font-bold tracking-wider uppercase text-base-content/80">Product Variants</h4>
                  <button type="button" onClick={addVariant} className="btn btn-ghost btn-xs text-primary font-bold"><Plus className="w-3.5 h-3.5 mr-1" /> Add Variant</button>
                </div>
                {form.variants?.map((v, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 bg-base-200/30 rounded-2xl border border-base-200/60 relative animate-in slide-in-from-top-2 duration-300">
                    <div className="form-control">
                      <label className="label pb-1"><span className="label-text text-[10px] font-bold text-base-content/40 uppercase">Variant Name</span></label>
                      <input type="text" className="input input-sm bg-base-100 border-base-200 rounded-md" value={v.name} placeholder="e.g. XL / Red"
                        onChange={(e) => updateVariant(idx, 'name', e.target.value)} />
                    </div>
                    <div className="form-control">
                      <label className="label pb-1"><span className="label-text text-[10px] font-bold text-base-content/40 uppercase">Variant SKU</span></label>
                      <input type="text" className="input input-sm bg-base-100 border-base-200 rounded-md font-mono" value={v.sku}
                        onChange={(e) => updateVariant(idx, 'sku', e.target.value)} />
                    </div>
                    <div className="form-control">
                      <label className="label pb-1"><span className="label-text text-[10px] font-bold text-base-content/40 uppercase">Sales Price</span></label>
                      <input type="number" className="input input-sm bg-base-100 border-base-200 rounded-md" value={v.price}
                        onChange={(e) => updateVariant(idx, 'price', e.target.value)} />
                    </div>
                    <div className="form-control">
                      <label className="label pb-1"><span className="label-text text-[10px] font-bold text-base-content/40 uppercase">Cost Price</span></label>
                      <input type="number" className="input input-sm bg-base-100 border-base-200 rounded-md" value={v.cost}
                        onChange={(e) => updateVariant(idx, 'cost', e.target.value)} />
                    </div>
                    <button type="button" onClick={() => removeVariant(idx)} className="absolute -top-2 -right-2 bg-base-100 border border-base-200 text-error rounded-full p-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-action pt-4 border-t border-base-200/60 mt-6">
              <button type="button" className="btn btn-ghost rounded-xl font-bold" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary rounded-xl font-bold shadow-lg shadow-primary/20" disabled={isLoading}>{editingId ? 'Save Changes' : 'Create Product'}</button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop bg-base-300/60 backdrop-blur-sm"><button onClick={() => setShowModal(false)}>close</button></form>
      </dialog>

      <ConfirmModal
        isOpen={confirmDelete.show}
        onClose={() => setConfirmDelete({ show: false, id: null, name: '' })}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${confirmDelete.name}"? This will remove all stock associations and cannot be undone.`}
        type="danger"
      />
    </div>
  );
};

export default Products;

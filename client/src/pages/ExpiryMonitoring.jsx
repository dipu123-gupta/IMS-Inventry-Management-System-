import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchExpiringBatches } from '../store/slices/batchSlice';
import { AlertTriangle, Calendar, Building2, Package, ArrowRight, Trash2 } from 'lucide-react';
import { CardSkeleton } from '../components/Skeleton';

const ExpiryMonitoring = () => {
  const dispatch = useDispatch();
  const { expiringBatches, isLoading } = useSelector((state) => state.batches);

  useEffect(() => {
    dispatch(fetchExpiringBatches());
  }, [dispatch]);

  const getUrgencyColor = (date) => {
    const daysLeft = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 7) return 'text-error font-extrabold';
    if (daysLeft < 15) return 'text-warning font-bold';
    return 'text-info';
  };

  const getUrgencyBadge = (date) => {
    const daysLeft = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 7) return <span className="px-2 py-0.5 rounded-md bg-error/10 text-error text-[10px] font-bold uppercase tracking-wider border border-error/20">Critical</span>;
    if (daysLeft < 15) return <span className="px-2 py-0.5 rounded-md bg-warning/10 text-warning text-[10px] font-bold uppercase tracking-wider border border-warning/20">Warning</span>;
    return <span className="px-2 py-0.5 rounded-md bg-info/10 text-info text-[10px] font-bold uppercase tracking-wider border border-info/20">Notice</span>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-base-content">Expiry Monitoring</h1>
          <p className="text-base-content/60 text-sm font-medium mt-1">Near-expiry stock alerts across all warehouses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <>
            <div className="col-span-1"><CardSkeleton /></div>
            <div className="col-span-1 hidden md:block"><CardSkeleton /></div>
            <div className="col-span-1 hidden lg:block"><CardSkeleton /></div>
          </>
        ) : expiringBatches.length === 0 ? (
          <div className="col-span-full card bg-base-100 border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl py-24 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-12 h-12 text-success" />
            </div>
            <h3 className="text-xl font-extrabold tracking-tight text-base-content">Stock is healthy</h3>
            <p className="text-base-content/50 font-medium max-w-sm mx-auto mt-2 leading-relaxed">
              No expiring batches found within the next 30 days. Your inventory is fresh and safe.
            </p>
          </div>
        ) : (
          expiringBatches.map((batch) => (
            <div key={batch._id} className="card bg-base-100 border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all overflow-hidden group">
              <div className="card-body p-6">
                <div className="flex justify-between items-start mb-2">
                   <div className="p-2.5 bg-error/10 text-error rounded-xl">
                      <AlertTriangle className="w-5 h-5" />
                   </div>
                   <div className="text-right">
                      {getUrgencyBadge(batch.expiryDate)}
                      <p className="font-mono text-[10px] text-base-content/40 mt-1 uppercase tracking-widest font-bold">Batch #{batch.batchNumber}</p>
                   </div>
                </div>

                <h3 className="text-lg font-bold tracking-tight truncate mt-2">{batch.product?.name}</h3>
                <p className="text-xs text-base-content/50 font-medium mb-4">SKU: {batch.product?.sku}</p>

                <div className="space-y-3 pt-4 border-t border-base-200/50">
                   <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-base-content/50 font-medium">
                         <Building2 className="w-4 h-4" />
                         <span>Warehouse</span>
                      </div>
                      <span className="font-bold text-base-content/80 text-right max-w-[120px] truncate">{batch.warehouse?.name}</span>
                   </div>

                   <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-base-content/50 font-medium">
                         <Package className="w-4 h-4" />
                         <span>Quantity</span>
                      </div>
                      <span className="font-extrabold">{batch.quantity}</span>
                   </div>

                   <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-base-content/50 font-medium">
                         <Calendar className="w-4 h-4" />
                         <span>Expires On</span>
                      </div>
                      <span className={getUrgencyColor(batch.expiryDate)}>
                         {new Date(batch.expiryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                   </div>
                </div>

                <div className="mt-6 flex gap-3 opacity-90 group-hover:opacity-100 transition-opacity">
                   <button className="btn btn-primary btn-outline flex-1 rounded-xl text-xs font-bold gap-1 min-h-[2.5rem] h-[2.5rem]">
                     <ArrowRight className="w-4 h-4" /> Move
                   </button>
                   <button className="btn btn-error btn-outline flex-1 rounded-xl text-xs font-bold gap-1 min-h-[2.5rem] h-[2.5rem]">
                     <Trash2 className="w-4 h-4" /> Scrape
                   </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ExpiryMonitoring;

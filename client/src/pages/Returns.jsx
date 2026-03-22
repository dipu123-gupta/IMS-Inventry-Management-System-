import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReturns, completeReturn } from '../store/slices/returnSlice';
import { RefreshCcw, CheckCircle2, Clock, Undo2, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { RETURN_STATUS, RETURN_TYPE, ROLES } from '../utils/constants';
import { formatCurrency } from '../utils/format';

const Returns = () => {
  const dispatch = useDispatch();
  const { returns, isLoading } = useSelector((state) => state.returns);
  const { user } = useSelector((state) => state.auth);
  const organization = user?.organization;

  useEffect(() => {
    dispatch(fetchReturns());
  }, [dispatch]);

  const handleComplete = async (id) => {
    const resultAction = await dispatch(completeReturn(id));
    if (completeReturn.fulfilled.match(resultAction)) {
      toast.success('Return completed and inventory updated');
    } else {
      toast.error(resultAction.payload);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case RETURN_STATUS.COMPLETED: return <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg tracking-wider border uppercase shadow-sm bg-success/15 text-success-content dark:text-success border-success/20 inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completed</span>;
      case RETURN_STATUS.PENDING: return <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg tracking-wider border uppercase shadow-sm bg-warning/15 text-warning-content dark:text-warning border-warning/20 inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
      case RETURN_STATUS.CANCELLED: return <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg tracking-wider border uppercase shadow-sm bg-error/15 text-error-content dark:text-error border-error/20">Cancelled</span>;
      default: return <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg tracking-wider border uppercase shadow-sm bg-base-200 text-base-content border-base-300">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
           <h1 className="text-2xl font-bold text-base-content flex items-center gap-2 cursor-pointer hover:bg-base-200/50 p-1.5 rounded-lg transition-colors">
              All Returns <span className="text-xs opacity-50 mt-1">▼</span>
           </h1>
        </div>
        <div className="flex items-center gap-2">
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
        <div className="overflow-x-auto">
          <table className="table w-full whitespace-nowrap">
            <thead>
              <tr className="border-y border-base-200/80 bg-base-100 font-bold text-base-content/70 text-[12px] tracking-wide">
                <th className="w-12 px-4 py-3"><input type="checkbox" className="checkbox checkbox-sm rounded border-base-300" /></th>
                <th className="px-4 py-3 font-semibold">RETURN #</th>
                <th className="px-4 py-3 font-semibold">ORDER #</th>
                <th className="px-4 py-3 font-semibold">TYPE</th>
                <th className="px-4 py-3 font-semibold">ITEMS</th>
                <th className="px-4 py-3 text-right font-semibold">REFUND AMOUNT</th>
                <th className="px-4 py-3 text-center font-semibold">STATUS</th>
                <th className="px-4 py-3 text-center font-semibold">ACTION</th>
              </tr>
            </thead>
              <tbody className="divide-y divide-base-200/50 bg-base-100">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="text-center py-20">
                    <span className="loading loading-spinner text-primary"></span>
                  </td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-24">
                     <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-20 h-20 bg-base-200/50 rounded-full flex items-center justify-center ring-4 ring-base-100 opacity-60">
                          <Undo2 className="w-10 h-10 text-base-content/40" />
                        </div>
                        <div>
                          <h3 className="text-xl font-extrabold tracking-tight text-base-content mb-1">No return records</h3>
                          <p className="text-base-content/50 font-medium max-w-sm mx-auto">No sales returns have been requested yet.</p>
                        </div>
                     </div>
                  </td>
                </tr>
              ) : (
                returns.map((ret) => (
                  <tr key={ret._id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group cursor-pointer border-b border-base-200/50">
                    <td className="px-4 py-2.5">
                      <input type="checkbox" className="checkbox checkbox-sm rounded border-base-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[13px] font-bold text-base-content/80">
                        {ret.returnNumber}
                    </td>
                    <td className="px-4 py-2.5">
                        <span className="text-[13px] font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline">{ret.order?.orderNumber}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-1 text-[10px] font-extrabold rounded-md tracking-wider border uppercase shadow-sm ${ret.type === RETURN_TYPE.SALE ? 'bg-info/10 text-info border-info/20' : 'bg-accent/10 text-accent border-accent/20'}`}>
                        {ret.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="text-[13px] space-y-1 font-medium text-base-content/80">
                        {ret.items.map((item, idx) => (
                          <div key={idx} className="flex gap-2 items-center w-max">
                             <span className="font-extrabold text-base-content/90">{item.quantity}x</span>
                             <span>{item.product?.name}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-[13px]">{formatCurrency(ret.totalRefundAmount, organization)}</td>
                    <td className="px-4 py-2.5 text-center">{getStatusBadge(ret.status)}</td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-center">
                        {ret.status === RETURN_STATUS.PENDING && [ROLES.ADMIN, ROLES.MANAGER].includes(user?.role) && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleComplete(ret._id); }}
                            className="btn btn-primary btn-xs rounded-lg font-bold shadow-md shadow-primary/20 hover:shadow-primary/40 transition-all gap-1 h-8 px-3"
                          >
                            <RefreshCcw className="w-3.5 h-3.5" /> Sync Stock
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Returns;

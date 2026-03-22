import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Truck, CheckCircle2, Clock, MapPin, Package } from 'lucide-react';
import API from '../services/api';
import { TableSkeleton } from '../components/Skeleton';
import toast from 'react-hot-toast';

const VendorPortal = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector(s => s.auth);

  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        const { data } = await API.get('/orders/vendor-orders');
        setOrders(data.orders);
      } catch (err) {
        toast.error('Failed to load purchase orders');
      } finally {
        setLoading(false);
      }
    };
    fetchMyOrders();
  }, []);

  const statusBadge = (s) => {
    switch (s) {
      case 'completed': return <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg tracking-wider border uppercase shadow-sm bg-success/15 text-success-content dark:text-success border-success/20 inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Fulfilled</span>;
      case 'pending': return <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg tracking-wider border uppercase shadow-sm bg-warning/15 text-warning-content dark:text-warning border-warning/20 inline-flex items-center gap-1"><Clock className="w-3 h-3"/> Pending</span>;
      case 'shipped': return <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg tracking-wider border uppercase shadow-sm bg-primary/10 text-primary border-primary/20 inline-flex items-center gap-1"><Truck className="w-3 h-3"/> Transit</span>;
      default: return <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg tracking-wider border uppercase shadow-sm bg-base-200 text-base-content border-base-300 capitalize">{s}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-base-content">Vendor Dashboard</h1>
          <p className="text-base-content/60 text-sm font-medium mt-1">Active purchase orders and fulfillment status</p>
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold flex items-center gap-2 border border-primary/20 shadow-sm">
          <MapPin className="w-4 h-4" /> Vendor Portal
        </div>
      </div>

      <div className="card bg-base-100 border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={5} cols={5} />
          ) : orders.length === 0 ? (
            <div className="py-24 text-center">
               <div className="w-20 h-20 bg-base-200/50 rounded-full flex items-center justify-center ring-4 ring-base-100 opacity-60 mx-auto mb-4">
                 <Package className="w-10 h-10 text-base-content/40" />
               </div>
               <h3 className="text-xl font-extrabold tracking-tight text-base-content mb-1">No pending orders</h3>
               <p className="text-base-content/50 font-medium max-w-sm mx-auto">You currently have no active purchase orders to fulfill.</p>
            </div>
          ) : (
            <table className="table w-full">
              <thead className="bg-base-200/30">
                <tr className="border-b border-base-200/60 font-bold text-base-content/60 uppercase tracking-wider text-[11px]">
                  <th className="px-6 py-4">PO Number</th>
                  <th className="px-6 py-4">Order Date</th>
                  <th className="px-6 py-4">Total Items</th>
                  <th className="px-6 py-4">Requested By</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200/50">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-base-200/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-sm tracking-tight">
                        <span className="bg-primary/5 text-primary px-2 py-0.5 rounded-md border border-primary/10">{order.orderNumber}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-xs text-base-content/70">{new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-bold text-sm">
                            <Package className="w-4 h-4 text-base-content/40" />
                            {order.items.length}
                        </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-sm text-base-content/90">{order.createdBy?.name || '—'}</td>
                    <td className="px-6 py-4">{statusBadge(order.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorPortal;

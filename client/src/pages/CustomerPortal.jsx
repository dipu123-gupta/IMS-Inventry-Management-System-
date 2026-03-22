import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { ShoppingBag, CheckCircle2, Clock, Truck, Download } from 'lucide-react';
import API from '../services/api';
import { TableSkeleton } from '../components/Skeleton';
import toast from 'react-hot-toast';

const CustomerPortal = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector(s => s.auth);

  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        const { data } = await API.get('/orders/my-orders');
        setOrders(data.orders);
      } catch (err) {
        toast.error('Failed to load your orders');
      } finally {
        setLoading(false);
      }
    };
    fetchMyOrders();
  }, []);

  const downloadInvoice = async (orderId) => {
    try {
      const { data } = await API.get(`/orders/${orderId}/invoice`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      toast.success('Invoice downloaded successfully');
    } catch (err) {
      toast.error('Could not download invoice');
    }
  };

  const StatusBadge = ({ status }) => {
    const statusConfig = {
      completed: { icon: CheckCircle2, color: 'success', text: 'Delivered' },
      pending: { icon: Clock, color: 'warning', text: 'Processing' },
      shipped: { icon: Truck, color: 'primary', text: 'In Transit' },
    };

    const config = statusConfig[status] || { icon: Clock, color: 'base-content/50', text: status };
    const Icon = config.icon;

    return (
      <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg tracking-wider border shadow-sm uppercase flex items-center gap-1.5 w-fit
        ${config.color === 'success' ? 'bg-success/15 text-success-content dark:text-success border-success/20' : 
          config.color === 'warning' ? 'bg-warning/15 text-warning-content dark:text-warning border-warning/20' : 
          config.color === 'primary' ? 'bg-primary/15 text-primary-content dark:text-primary border-primary/20' : 
          'bg-base-200 text-base-content/70 border-base-300'}`}>
        <Icon className="w-3.5 h-3.5" />
        {config.text}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-base-content flex items-center gap-3">
            Welcome, {user?.name}
          </h1>
          <p className="text-base-content/60 text-sm font-medium mt-1">Your order history and billing portal</p>
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2.5 rounded-xl text-sm font-bold border border-primary/20 shadow-sm flex items-center gap-2">
          Total Orders: <span className="bg-primary text-primary-content px-2 py-0.5 rounded-md">{orders.length}</span>
        </div>
      </div>

      <div className="card bg-base-100 border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="bg-base-200/30 border-b border-base-200/60 font-bold text-base-content/60 uppercase tracking-wider text-[11px]">
                <th className="px-6 py-4">Order #</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-200/50">
              {loading ? (
                <tr><td colSpan={6} className="p-0"><TableSkeleton rows={5} cols={6} /></td></tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3 opacity-40">
                      <ShoppingBag className="w-12 h-12" />
                      <p className="font-extrabold text-lg">No orders found yet</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-base-200/30 transition-colors group">
                    <td className="px-6 py-4 font-mono font-bold tracking-tight text-sm">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 font-semibold text-xs text-base-content/70">
                      {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 font-medium text-sm">
                      <span className="bg-base-200/50 px-2 py-1 rounded-lg border border-base-200/80">
                        {order.items.length} Product(s)
                      </span>
                    </td>
                    <td className="px-6 py-4 font-extrabold text-base-content tracking-tight">
                      ${order.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button onClick={() => downloadInvoice(order._id)} className="btn btn-sm btn-ghost text-primary hover:bg-primary/10 hover:text-primary gap-2 rounded-xl transition-all">
                          <Download className="w-4 h-4"/> Invoice
                       </button>
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

export default CustomerPortal;

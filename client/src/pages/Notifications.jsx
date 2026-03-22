import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, markAsRead, markAllAsRead } from '../store/slices/notificationSlice';
import { Bell, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const CardSkeleton = () => (
    <div className="card bg-base-100 border border-base-200/60 shadow-sm p-6 animate-pulse rounded-3xl">
        <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-base-300/50"></div>
            <div className="flex-1 space-y-3">
                <div className="h-4 bg-base-300/50 rounded-md w-1/3"></div>
                <div className="h-3 bg-base-300/50 rounded-md w-full"></div>
            </div>
        </div>
    </div>
);

const Notifications = () => {
  const dispatch = useDispatch();
  const { items, isLoading } = useSelector((state) => state.notifications);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleMarkAll = async () => {
    try {
      await dispatch(markAllAsRead()).unwrap();
      toast.success('All marked as read');
    } catch (err) {
      toast.error('Failed');
    }
  };

  const handleRead = (id) => {
    dispatch(markAsRead(id));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between bg-base-100/50 backdrop-blur-xl p-4 sm:p-6 rounded-3xl border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Notifications</h1>
          <p className="text-base-content/60 text-sm font-medium mt-1">Stay updated with critical system alerts</p>
        </div>
        <button onClick={handleMarkAll} className="btn btn-primary btn-outline btn-sm sm:btn-md rounded-xl font-bold gap-2">
          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="hidden sm:inline">Mark all as read</span>
        </button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <>
            <CardSkeleton /><CardSkeleton /><CardSkeleton />
          </>
        ) : items.length === 0 ? (
          <div className="card bg-base-100 border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-16 text-center text-base-content/50 rounded-3xl">
            <div className="w-20 h-20 bg-base-200/50 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-base-100">
               <Bell className="w-10 h-10 opacity-40" />
            </div>
            <h3 className="text-xl font-extrabold tracking-tight text-base-content mb-2">You're all caught up!</h3>
            <p className="font-medium">No new notifications to show.</p>
          </div>
        ) : (
          items.map((n) => (
            <div key={n._id} className={`card bg-base-100 border border-base-200/60 transition-all rounded-3xl overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] ${!n.read ? 'shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-primary/20' : 'opacity-70 shadow-sm'}`}>
              <div className="card-body p-5 sm:p-6 flex-row items-start gap-4 sm:gap-6 relative">
                {!n.read && <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-primary"></div>}
                
                <div className={`p-3 rounded-2xl flex-shrink-0 ${n.type === 'low_stock' ? 'bg-error/15 text-error shadow-sm border border-error/10' : 'bg-info/15 text-info shadow-sm border border-info/10'}`}>
                  <Bell className="w-6 h-6" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                    <h3 className={`font-extrabold text-lg tracking-tight truncate ${!n.read ? 'text-base-content' : 'text-base-content/70'}`}>{n.title}</h3>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-base-content/40 flex items-center gap-1.5 whitespace-nowrap">
                      <Clock className="w-3.5 h-3.5" /> {new Date(n.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-base-content/60 mt-2 leading-relaxed">{n.message}</p>
                  
                  {!n.read && (
                    <button onClick={() => handleRead(n._id)} className="btn btn-ghost btn-xs text-primary font-bold hover:bg-primary/10 transition-colors mt-3 rounded-lg px-3">
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;

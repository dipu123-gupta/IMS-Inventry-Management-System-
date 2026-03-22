import { useEffect, useState } from 'react';
import API from '../services/api';
import { Search, Clock, Terminal, Eye, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { TableSkeleton } from '../components/Skeleton';
import { formatDateTime } from '../utils/format';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const { data } = await API.get(`/activity-logs?page=${page}&limit=20`);
        setLogs(data.logs);
        setPages(data.pages);
      } catch (error) {
        toast.error('Failed to load activity logs');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [page]);

  const JsonDisplay = ({ data, title }) => (
    <div className="space-y-2">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-base-content/50">{title}</h4>
      <div className="bg-base-200/50 border border-base-200/80 p-4 rounded-xl overflow-x-auto max-h-60 shadow-inner custom-scrollbar">
        <pre className="text-xs leading-relaxed font-mono text-base-content/80">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-base-content flex items-center gap-3">
            <Terminal className="w-8 h-8 text-primary" /> System Audit Trail
          </h1>
          <p className="text-base-content/60 text-sm font-medium mt-1">Real-time chronicle of all high-impact actions and data mutations.</p>
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2.5 rounded-xl text-sm font-bold border border-primary/20 shadow-sm flex items-center gap-2">
          Total Recorded Actions: <span className="bg-primary text-primary-content px-2 py-0.5 rounded-md">{logs.length} on current page</span>
        </div>
      </div>

      <div className="card bg-base-100 border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full whitespace-nowrap">
            <thead>
              <tr className="bg-base-200/30 border-b border-base-200/60 font-bold text-base-content/60 uppercase tracking-wider text-[11px]">
                <th className="px-6 py-4">Timestamp & IP</th>
                <th className="px-6 py-4">Operator</th>
                <th className="px-6 py-4">Action Type</th>
                <th className="px-6 py-4">Affected Entity</th>
                <th className="px-6 py-4 text-right">Audit Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-200/50">
              {loading ? (
                <tr><td colSpan={5} className="p-0"><TableSkeleton rows={8} cols={5} /></td></tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3 opacity-40">
                      <Clock className="w-12 h-12" />
                      <p className="font-extrabold text-lg">No audit logs found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-base-200/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs font-semibold text-base-content/70 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {formatDateTime(log.createdAt)}
                      </div>
                      <div className="text-[10px] bg-secondary/10 text-secondary w-fit px-2 py-0.5 rounded-md mt-1.5 font-mono font-bold border border-secondary/20 tracking-wider">
                        {log.ip || '127.0.0.1'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-sm tracking-tight text-primary">{log.user?.name || 'System Auto'}</div>
                      <div className="text-xs font-medium text-base-content/50 mt-0.5">{log.user?.email || 'automated@ims.pro'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg tracking-wider border shadow-sm uppercase ${
                        log.action.includes('created') ? 'bg-success/15 text-success-content dark:text-success border-success/20' : 
                        log.action.includes('deleted') ? 'bg-error/15 text-error-content dark:text-error border-error/20' : 
                        log.action.includes('error') ? 'bg-error/15 text-error-content dark:text-error border-error/20 shadow-error/20' : 
                        'bg-info/15 text-info-content dark:text-info border-info/20'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-sm text-base-content">{log.entity}</div>
                      <div className="text-[10px] font-mono font-semibold text-base-content/40 mt-0.5 bg-base-200/50 w-fit px-1.5 py-0.5 rounded border border-base-200/80">
                        ID: {log.entityId || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedLog(log)}
                        className="p-2 rounded-xl text-primary hover:bg-primary/10 transition-all tooltip tooltip-left" data-tip="View Trace Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
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
              <button 
                key={i} 
                className={`join-item btn btn-sm border-0 ${page === i + 1 ? 'bg-primary text-primary-content font-bold shadow-inner' : 'bg-transparent text-base-content/70 hover:bg-base-200 hover:text-base-content font-semibold'}`} 
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Log Detail Modal */}
      {selectedLog && (
        <dialog className="modal modal-open modal-bottom sm:modal-middle">
          <div className="modal-box w-full sm:w-11/12 max-w-4xl p-0 overflow-hidden bg-base-100/95 backdrop-blur-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-3xl border border-primary/20">
            {/* Header */}
            <div className="bg-primary/10 border-b border-primary/20 p-6 sm:p-8 flex justify-between items-start">
              <div>
                <h3 className="text-xl sm:text-2xl font-black font-mono text-primary tracking-tight flex items-center gap-3">
                  <Terminal className="w-6 h-6" /> AUDIT_LOG_#{selectedLog._id.slice(-8)}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                   <span className="text-sm font-semibold opacity-80">{selectedLog.action} on <span className="font-extrabold">{selectedLog.entity}</span></span>
                </div>
              </div>
              <button onClick={() => setSelectedLog(null)} className="btn btn-sm btn-circle btn-ghost text-base-content hover:bg-base-200 transition-colors">✕</button>
            </div>

            <div className="p-6 sm:p-8 space-y-8">
              {/* Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-base-200/50 p-5 rounded-2xl border border-base-200/80 space-y-1.5 shadow-sm">
                   <p className="text-[10px] font-black text-base-content/40 uppercase tracking-widest flex items-center gap-1.5 mb-3"><span className="w-1.5 h-1.5 rounded-full bg-primary/40 block"></span> Operator Info</p>
                   <p className="font-extrabold tracking-tight text-[15px]">{selectedLog.user?.name}</p>
                   <p className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">{selectedLog.user?.role || 'authorized_user'}</p>
                </div>
                <div className="bg-base-200/50 p-5 rounded-2xl border border-base-200/80 space-y-1.5 shadow-sm">
                   <p className="text-[10px] font-black text-base-content/40 uppercase tracking-widest flex items-center gap-1.5 mb-3"><span className="w-1.5 h-1.5 rounded-full bg-primary/40 block"></span> Network Context</p>
                   <p className="font-mono text-sm font-bold tracking-wider">{selectedLog.ip || 'INTERNAL'}</p>
                   <p className="text-[10px] truncate w-full opacity-60 font-medium" title={selectedLog.userAgent}>{selectedLog.userAgent}</p>
                </div>
                <div className="bg-base-200/50 p-5 rounded-2xl border border-base-200/80 space-y-1.5 shadow-sm">
                   <p className="text-[10px] font-black text-base-content/40 uppercase tracking-widest flex items-center gap-1.5 mb-3"><span className="w-1.5 h-1.5 rounded-full bg-primary/40 block"></span> Execution Time</p>
                   <p className="font-bold tracking-tight text-sm">{formatDateTime(selectedLog.createdAt)}</p>
                   <p className="text-[10px] font-bold text-success uppercase tracking-wider mt-1 bg-success/15 px-2 py-0.5 rounded w-fit border border-success/20">SUCCESS_RECORDED</p>
                </div>
              </div>

              {/* Diff View */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {selectedLog.before && (
                  <JsonDisplay data={selectedLog.before} title="State Before Change" />
                )}
                {selectedLog.after && (
                  <JsonDisplay data={selectedLog.after} title="State After Change" />
                )}
                {!selectedLog.before && !selectedLog.after && selectedLog.details && (
                  <div className="lg:col-span-2">
                    <JsonDisplay data={selectedLog.details} title="Action Metadata / Details" />
                  </div>
                )}
                {!selectedLog.before && !selectedLog.after && !selectedLog.details && (
                  <div className="lg:col-span-2 bg-warning/10 border border-warning/20 p-6 rounded-2xl flex items-center gap-4 text-warning-content dark:text-warning">
                    <AlertTriangle className="w-8 h-8 opacity-80 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-sm">No Detail Payload Available</p>
                      <p className="text-xs font-medium opacity-80">This action did not record distinct before/after states or additional metadata.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-base-200/50 p-5 flex justify-end px-6 sm:px-8 border-t border-base-200/80">
              <button onClick={() => setSelectedLog(null)} className="btn btn-primary px-10 font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40">Close Trace</button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop bg-base-300/60 backdrop-blur-sm"><button onClick={() => setSelectedLog(null)}>close</button></form>
        </dialog>
      )}
    </div>
  );
};

export default ActivityLogs;

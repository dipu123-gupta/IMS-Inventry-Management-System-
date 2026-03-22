import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, addUser, deleteUser } from '../store/slices/userSlice';
import { Users as UsersIcon, UserPlus, Trash2, Mail, Shield, ShieldCheck, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

const Users = () => {
  const dispatch = useDispatch();
  const { users, isLoading } = useSelector((state) => state.users);
  const { status } = useSelector((state) => state.subscription);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'staff' });

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const resultAction = await dispatch(addUser(formData));
    if (addUser.fulfilled.match(resultAction)) {
      toast.success('Team member added successfully');
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'staff' });
    } else {
      toast.error(resultAction.payload);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you absolutely sure you want to remove this team member? Their access will be revoked immediately.')) {
      const resultAction = await dispatch(deleteUser(id));
      if (deleteUser.fulfilled.match(resultAction)) {
        toast.success('Team member removed');
      } else {
        toast.error(resultAction.payload);
      }
    }
  };

  const getRoleBadge = (role) => {
    if (role === 'admin') {
      return (
        <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg tracking-wider border border-secondary/20 bg-secondary/15 text-secondary-content dark:text-secondary uppercase shadow-sm flex items-center gap-1 w-fit">
          <ShieldAlert className="w-3 h-3" /> Admin
        </span>
      );
    }
    if (role === 'manager') {
      return (
        <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg tracking-wider border border-accent/20 bg-accent/15 text-accent-content dark:text-accent uppercase shadow-sm flex items-center gap-1 w-fit">
          <ShieldCheck className="w-3 h-3" /> Manager
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg tracking-wider border border-base-300 bg-base-200/80 text-base-content/70 uppercase shadow-sm flex items-center gap-1 w-fit">
        <Shield className="w-3 h-3" /> Staff
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-base-content">Team Management</h1>
          <p className="text-base-content/60 text-sm font-medium mt-1">Manage '{users.length}' staff members and their access levels</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all font-bold tracking-wide gap-2"
          disabled={status?.usage?.users >= status?.limits?.maxUsers}
        >
          <UserPlus className="w-5 h-5" strokeWidth={3} /> Add Team Member
        </button>
      </div>

      {status?.usage?.users >= status?.limits?.maxUsers && (
        <div className="alert bg-warning/15 border border-warning/30 text-warning-content shadow-sm rounded-2xl flex items-center p-4">
          <ShieldAlert className="w-6 h-6 text-warning flex-shrink-0" />
          <div className="ml-2">
            <span className="font-extrabold text-warning-content dark:text-warning tracking-tight">Plan Limit Reached</span>
            <p className="text-sm font-medium mt-0.5 opacity-80">You have reached the maximum number of users for your current plan ({status?.limits?.maxUsers}). Upgrade your subscription to add more members.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-2">
        {users.map((user) => (
          <div key={user._id} className="card bg-base-100 border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 rounded-3xl transition-all duration-300 group overflow-hidden">
            <div className="card-body p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-sm">
                  <span className="text-xl font-black text-primary">{user.name.charAt(0).toUpperCase()}</span>
                </div>
                {getRoleBadge(user.role)}
              </div>
              
              <div className="space-y-1 mb-6">
                <h3 className="font-extrabold text-xl tracking-tight text-base-content line-clamp-1" title={user.name}>{user.name}</h3>
                <div className="flex items-center gap-2 text-sm font-medium text-base-content/60 bg-base-200/50 w-fit px-3 py-1.5 rounded-lg border border-base-200/80">
                  <Mail className="w-4 h-4 text-primary/70" />
                  <span className="truncate max-w-[200px]">{user.email}</span>
                </div>
              </div>

              <div className="card-actions justify-end mt-auto pt-4 border-t border-base-200/50">
                <button 
                  onClick={() => handleDelete(user._id)} 
                  className="btn btn-sm btn-ghost hover:bg-error/10 text-base-content/40 hover:text-error rounded-xl font-bold gap-2 w-full transition-colors"
                  title="Remove User"
                >
                  <Trash2 className="w-4 h-4" /> Revoke Access
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Empty placeholder card for adding easily */}
        {status?.usage?.users < status?.limits?.maxUsers && (
          <div 
            onClick={() => setIsModalOpen(true)}
            className="card bg-base-200/20 border-2 border-dashed border-base-300/80 hover:border-primary/50 hover:bg-primary/5 rounded-3xl transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[220px] group text-base-content/40 hover:text-primary"
          >
            <div className="w-14 h-14 rounded-2xl bg-base-100 flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
              <UserPlus className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg tracking-tight">Add New Member</h3>
            <p className="text-sm font-medium opacity-70 mt-1">Send an invite to a colleague</p>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <dialog className="modal modal-open modal-bottom sm:modal-middle">
          <div className="modal-box bg-base-100/95 backdrop-blur-3xl border border-base-200/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-3xl p-6 sm:p-8">
            <h3 className="font-extrabold text-2xl tracking-tight mb-6 flex items-center gap-3">
              <UsersIcon className="w-6 h-6 text-primary" /> Add Team Member
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Full Name *</span></label>
                <input type="text" className="input bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all" required
                  placeholder="E.g. Jane Doe"
                  value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Email Address *</span></label>
                <input type="email" className="input bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all" required
                  placeholder="jane@example.com"
                  value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Initial Temp Password *</span></label>
                  <input type="password" className="input bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all" required minLength={6}
                    placeholder="Min. 6 characters"
                    value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Assign Role *</span></label>
                  <select className="select bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all w-full"
                    value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                    <option value="staff">Staff (Basic Access)</option>
                    <option value="manager">Manager (Elevated Access)</option>
                    <option value="admin">Admin (Full Control)</option>
                  </select>
                </div>
              </div>

              <div className="bg-base-200/30 p-4 rounded-xl border border-base-200/60 flex gap-3 items-start mt-2">
                <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-base-content/70 leading-relaxed">
                  The user will be able to log in immediately with the email and initial password provided above. Admins can manage billing and system settings.
                </p>
              </div>

              <div className="modal-action pt-4 border-t border-base-200/60 mt-6">
                <button type="button" className="btn btn-ghost rounded-xl font-bold" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary rounded-xl font-bold gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 px-8">
                  <UserPlus className="w-4 h-4" /> Add Member
                </button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop bg-base-300/60 backdrop-blur-sm"><button onClick={() => setIsModalOpen(false)}>close</button></form>
        </dialog>
      )}
    </div>
  );
};

export default Users;

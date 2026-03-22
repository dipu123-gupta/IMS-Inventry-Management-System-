import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login, clearError, verify2FALogin } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import { ShieldCheck, Package } from 'lucide-react';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [otpToken, setOtpToken] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isLoading, error, twoFactorRequired, tempUserId } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [error, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (twoFactorRequired) {
      dispatch(verify2FALogin({ userId: tempUserId, token: otpToken }));
    } else {
      dispatch(login(form));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-base-200/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-gradient-to-br from-primary/5 via-base-100 to-secondary/5">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] mix-blend-multiply opacity-50 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[120px] mix-blend-multiply opacity-50 animate-pulse delay-1000"></div>
      </div>

      <div className="card w-full max-w-md bg-base-100/95 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-base-200/60 rounded-3xl animate-in slide-in-from-bottom-8 fade-in duration-700">
        <div className="card-body p-8 sm:p-10 space-y-2 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-content font-bold shadow-lg shadow-primary/20 ring-4 ring-primary/5">
              {twoFactorRequired ? <ShieldCheck className="w-8 h-8" /> : <Package className="w-8 h-8" strokeWidth={2.5} />}
            </div>
          </div>
          
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-base-content title-font mb-2">
              {twoFactorRequired ? 'Two-Factor Auth' : 'Welcome Back'}
            </h2>
            <p className="text-base-content/60 font-medium text-sm">
              {twoFactorRequired ? 'Enter the 6-digit code from your authenticator app to verify your identity.' : 'Sign in to access your IMS Pro dashboard.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 pt-4 text-left">
            {!twoFactorRequired ? (
              <>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Email Address</span></label>
                  <input
                    type="email"
                    className="input bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all w-full autofill:shadow-[inset_0_0_0px_1000px_rgba(0,0,0,0.01)]"
                    placeholder="admin@ims.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-control">
                  <div className="flex items-center justify-between pb-1">
                    <label className="label p-0"><span className="label-text text-xs font-bold tracking-wider uppercase text-base-content/70">Password</span></label>
                    <a href="#" className="text-xs text-primary font-bold hover:underline">Forgot password?</a>
                  </div>
                  <input
                    type="password"
                    className="input bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all w-full autofill:shadow-[inset_0_0_0px_1000px_rgba(0,0,0,0.01)] tracking-widest"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                </div>
              </>
            ) : (
              <div className="form-control pt-2">
                <input
                  type="text"
                  className="input bg-base-200/50 border-base-200/60 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all w-full text-center text-3xl tracking-[0.5em] font-black h-16 shadow-inner"
                  placeholder="000000"
                  maxLength={6}
                  value={otpToken}
                  onChange={(e) => setOtpToken(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            )}

            <button type="submit" className={`btn btn-primary w-full rounded-xl font-bold tracking-wide shadow-lg shadow-primary/20 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5 transition-transform'}`} disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2"><span className="loading loading-spinner loading-xs"></span> Processing...</span>
              ) : twoFactorRequired ? 'Verify & Login' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm mt-6 text-base-content/60 font-medium pt-2">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-primary font-bold hover:underline transition-all">Request Access</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

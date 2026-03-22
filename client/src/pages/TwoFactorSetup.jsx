import { useState, useEffect } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';
import { ShieldCheck, Lock, QrCode } from 'lucide-react';

const TwoFactorSetup = () => {
  const [setupData, setSetupData] = useState(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSetup = async () => {
    try {
      const { data } = await API.get('/2fa/setup');
      setSetupData(data);
    } catch (err) {
      toast.error('Failed to initiate 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSetup();
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      if (token.length !== 6) return toast.error('Token must be 6 digits');
      await API.post('/2fa/verify', { token });
      toast.success('Two-Factor Authentication enabled!');
      setSetupData(prev => ({ ...prev, enabled: true }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    }
  };

  const handleDisable = async () => {
    if (!window.confirm('Are you sure you want to disable 2FA? This will reduce your account security.')) return;
    try {
      await API.post('/2fa/disable');
      toast.success('2FA disabled');
      fetchSetup();
    } catch (err) {
      toast.error('Failed to disable 2FA');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20 animate-pulse text-primary flex-col gap-4">
      <ShieldCheck className="w-12 h-12" />
      <span className="font-bold tracking-widest text-sm uppercase">Initializing Security Module...</span>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="card bg-base-100 border border-base-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 -mr-20 -mt-20"></div>
        <div className="p-8 sm:p-10 border-b border-base-200/60 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-base-content flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/20 shadow-sm">
                <ShieldCheck className="w-6 h-6" strokeWidth={2.5} />
              </div>
              Advanced Security
            </h1>
            <p className="text-base-content/60 text-sm font-medium mt-1">Two-Factor Authentication (TOTP)</p>
          </div>
        </div>

        <div className="p-8 sm:p-10 space-y-8">
          {setupData?.enabled ? (
            <div className="text-center space-y-6 py-6">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-success/10 rounded-full ring-8 ring-success/5 mb-2">
                <Lock className="w-10 h-10 text-success" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-success mb-2">2FA is Active</h2>
                <p className="text-base-content/60 font-medium max-w-sm mx-auto leading-relaxed">
                  Your account is protected by an additional layer of security. You will be actively prompted for a token during login flows.
                </p>
              </div>
              <button onClick={handleDisable} className="btn btn-outline border-error/20 text-error hover:bg-error hover:text-error-content hover:border-error rounded-xl font-bold px-8 transition-all">
                Disable 2FA Protection
              </button>
            </div>
          ) : (
            <div className="space-y-8 max-w-xl mx-auto">
              <div className="flex flex-col md:flex-row gap-8 items-center bg-base-200/30 p-6 rounded-3xl border border-base-200/60">
                <div className="bg-white p-4 rounded-2xl border flex-shrink-0 shadow-sm border-base-200">
                  {setupData?.qrCode ? (
                    <img src={setupData.qrCode} alt="2FA QR Code" className="w-40 h-40 mix-blend-multiply" />
                  ) : (
                    <div className="w-40 h-40 bg-base-200 animate-pulse rounded-lg"></div>
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  <h3 className="font-extrabold text-lg tracking-tight flex items-center gap-2">
                    <QrCode className="text-primary w-5 h-5" strokeWidth={2.5} /> Step 1: Scan QR Code
                  </h3>
                  <p className="text-sm font-medium text-base-content/70 leading-relaxed">
                    Use an authenticator app like Google Authenticator, Microsoft Authenticator, or Authy to scan this code.
                  </p>
                  <div className="bg-base-100 p-4 rounded-xl border border-base-200 shadow-sm relative group">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-base-content/40 mb-1 block">Manual Entry Key</span>
                    <span className="font-mono text-xs font-bold tracking-wider break-all text-base-content/80 select-all">{setupData?.secret}</span>
                  </div>
                </div>
              </div>

              <div className="divider text-xs font-bold tracking-widest uppercase text-base-content/30 my-8">Step 2: Verification</div>

              <form onSubmit={handleVerify} className="space-y-5 bg-base-200/30 p-6 sm:p-8 rounded-3xl border border-base-200/60">
                <div className="form-control text-center">
                  <label className="label justify-center pb-4">
                    <span className="label-text text-sm font-bold tracking-wider uppercase text-base-content/70 flex items-center gap-2">
                      <Lock className="w-4 h-4" /> Enter 6-digit confirmation code
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="000000"
                    className="input bg-base-100 border-base-200/80 focus:border-primary focus:ring-4 focus:ring-primary/10 input-lg text-center tracking-[0.75em] font-black text-2xl rounded-2xl w-full max-w-[280px] mx-auto shadow-sm transition-all"
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/[^0-9]/g, ''))}
                    maxLength={6}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-block rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 text-lg sm:h-14">
                  Verify & Enable Protection
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TwoFactorSetup;

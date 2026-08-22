import React, { useState } from 'react';
import { useHR } from '../../context/HRContext';
import { UserRole } from '../../types';
import { 
  X, 
  ShieldCheck, 
  User, 
  Lock, 
  Mail, 
  Building2, 
  Sparkles, 
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Info
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    signIn, 
    currentUser
  } = useHR();

  // Sign In form
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInRole, setSignInRole] = useState<UserRole>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!signInEmail.trim()) {
      setErrorMessage('Please provide your company email.');
      return;
    }
    setIsLoading(true);
    const success = await signIn(signInEmail, signInRole, signInPassword);
    setIsLoading(false);
    if (!success) {
      setErrorMessage('Account not found in the database or invalid credentials. Note: Self-registration is restricted; accounts are created by Administrators.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden transition-all">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-purple-800 via-indigo-700 to-teal-600 p-6 text-white relative">
          {currentUser && (
            <button
              onClick={closeAuthModal}
              className="absolute right-4 top-4 text-white/80 hover:text-white p-1.5 rounded-lg bg-black/10 hover:bg-black/20 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center font-bold font-display">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg font-display tracking-tight">Dayflow HRMS</span>
            </div>

          </div>
          <h2 className="text-xl font-bold text-white mt-2">
            Sign In to Workspace
          </h2>
          <p className="text-xs text-purple-100 mt-1">
            Secure workspace authentication for your Dayflow account.
          </p>
        </div>

        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Account Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSignInRole('admin')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    signInRole === 'admin'
                      ? 'bg-purple-50 border-purple-500 text-purple-700 ring-1 ring-purple-500'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  Admin / HR
                </button>
                <button
                  type="button"
                  onClick={() => setSignInRole('employee')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    signInRole === 'employee'
                      ? 'bg-purple-50 border-purple-500 text-purple-700 ring-1 ring-purple-500'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <User className="w-4 h-4 text-indigo-600" />
                  Employee
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="name@dayflow.corp"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <span>{isLoading ? 'Verifying...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Enterprise Provisioning Notice */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
              <span>
                <strong>Admin Controlled:</strong> User registration is managed by System Administrators. New employees are provisioned via the Admin Console.
              </span>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

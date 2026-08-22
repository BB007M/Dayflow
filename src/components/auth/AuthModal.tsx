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
  Database,
  Info
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    signIn, 
    employees, 
    switchUser,
    isDbConnected,
    currentUser
  } = useHR();

  // Sign In form
  const [signInEmail, setSignInEmail] = useState('sarveshv6413@gmail.com');
  const [signInPassword, setSignInPassword] = useState('SarvesH@07');
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

  const handleQuickPresetLogin = (emp: typeof employees[0]) => {
    switchUser(emp.id);
    closeAuthModal();
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

            {/* DB Status Badge */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-medium text-emerald-200 border border-emerald-400/30">
              <Database className="w-3 h-3 text-emerald-300" />
              <span>{isDbConnected ? 'Supabase Active' : 'Database Offline'}</span>
            </div>
          </div>
          <h2 className="text-xl font-bold text-white mt-2">
            Sign In to Workspace
          </h2>
          <p className="text-xs text-purple-100 mt-1">
            Secure workspace authentication backed by the Dayflow database.
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

            {/* Quick Demo Switcher */}
            <div className="pt-3 border-t border-slate-100">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Quick Sign-In Switcher
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {employees.slice(0, 4).map((emp) => (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => handleQuickPresetLogin(emp)}
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-slate-200/60 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={emp.avatar}
                        alt={emp.firstName}
                        className="w-7 h-7 rounded-full object-cover shrink-0"
                      />
                      <div className="truncate">
                        <div className="text-xs font-semibold text-slate-800 group-hover:text-purple-900 truncate flex items-center gap-1.5">
                          {emp.firstName} {emp.lastName}
                          {emp.role === 'admin' && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded font-bold">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">{emp.email}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-purple-600 group-hover:underline shrink-0">
                      Switch &rarr;
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

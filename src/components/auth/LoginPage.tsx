import React, { useState } from 'react';
import { useHR } from '../../context/HRContext';
import { UserRole } from '../../types';
import { 
  ShieldCheck, 
  User, 
  Lock, 
  Mail, 
  Sparkles, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Database,
  Layers,
  ShieldAlert,
  Info
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { 
    signIn, 
    isDbConnected,
    openAuditDrawer
  } = useHR();

  // Sign In state with demo admin default credentials
  const [signInEmail, setSignInEmail] = useState('sarveshv6413@gmail.com');
  const [signInPassword, setSignInPassword] = useState('SarvesH@07');
  const [signInRole, setSignInRole] = useState<UserRole>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!signInEmail.trim()) {
      setErrorMessage('Please provide your work email address.');
      return;
    }
    setIsLoading(true);
    const success = await signIn(signInEmail.trim(), signInRole, signInPassword);
    setIsLoading(false);
    if (!success) {
      setErrorMessage('Account not found or invalid credentials. Note: Self-registration is disabled; accounts are provisioned exclusively by Administrators.');
    }
  };

  const setPresetCredentials = (email: string, pass: string, role: UserRole) => {
    setSignInEmail(email);
    setSignInPassword(pass);
    setSignInRole(role);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-purple-500 selection:text-white">
      {/* Background Decorative Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-teal-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold font-display tracking-tight text-white">dayflow</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  HRMS
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Every workday, perfectly aligned.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-300">
              <Database className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>{isDbConnected ? 'Supabase Database Connected' : 'Supabase Active'}</span>
            </div>
            
            <button
              onClick={openAuditDrawer}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-900/40 hover:bg-purple-900/60 border border-purple-700/50 text-xs font-medium text-purple-200 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>DB Audit Logs</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
          
          {/* Header Banner */}
          <div className="p-6 bg-gradient-to-r from-purple-900/80 via-indigo-900/80 to-slate-900 border-b border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Enterprise Access
              </span>
              <span className="text-xs text-slate-400">Admin Managed</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white font-display">
              Sign In to Workspace
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Enter your verified company credentials to access your dashboard.
            </p>
          </div>

          {/* Form Content */}
          <div className="p-6">
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleSignIn} className="space-y-4">
              {/* Role Toggle Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Account Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSignInRole('admin')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      signInRole === 'admin'
                        ? 'bg-purple-600/30 border-purple-500 text-white ring-1 ring-purple-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    Admin / HR
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignInRole('employee')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      signInRole === 'employee'
                        ? 'bg-purple-600/30 border-purple-500 text-white ring-1 ring-purple-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <User className="w-4 h-4 text-indigo-400" />
                    Employee
                  </button>
                </div>
              </div>

              {/* Email input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="name@dayflow.corp"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              {/* Password input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <span>{isLoading ? 'Verifying with Supabase DB...' : 'Sign In & Verify Session'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Enterprise Provisioning Notice */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Admin-Provisioned Policy:</strong> Self-registration is restricted. New user accounts and onboarding are handled directly by Administrators.
                </span>
              </div>

              {/* Quick Credentials Helper Pills */}
              <div className="pt-3 border-t border-slate-800/80">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
                  Quick Demo Accounts
                </div>
                <div className="space-y-1.5">
                  {/* Sarvesh V Lead Admin */}
                  <button
                    type="button"
                    onClick={() => setPresetCredentials('sarveshv6413@gmail.com', 'SarvesH@07', 'admin')}
                    className="w-full p-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/60 hover:border-purple-500 text-left transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Sarvesh V</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-300 border border-purple-500/40">
                          Lead Admin
                        </span>
                      </div>
                      <div className="text-[11px] text-purple-300 font-mono">sarveshv6413@gmail.com</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">Pass: <span className="text-white font-mono">SarvesH@07</span></div>
                      <span className="text-[10px] text-purple-400 group-hover:underline">Use &rarr;</span>
                    </div>
                  </button>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPresetCredentials('sarah.jenkins@dayflow.corp', 'AdminPass2026!', 'admin')}
                      className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 text-left transition-colors"
                    >
                      <div className="text-[11px] font-bold text-white truncate">Sarah Jenkins</div>
                      <div className="text-[10px] text-purple-400 font-medium">HR Admin</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPresetCredentials('alex.chen@dayflow.corp', 'EmployeePass2026!', 'employee')}
                      className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 text-left transition-colors"
                    >
                      <div className="text-[11px] font-bold text-white truncate">Alex Chen</div>
                      <div className="text-[10px] text-sky-400 font-medium">Employee</div>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-slate-500 border-t border-slate-800/60 bg-slate-950">
        <p>Dayflow HRMS • Enterprise Database Session Security with Supabase</p>
      </footer>
    </div>
  );
};

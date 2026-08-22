import React, { useState } from 'react';
import { useHR } from '../../context/HRContext';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Sparkles, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Database,
  Layers,
  Info,
  Sun,
  Moon,
  KeyRound
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { 
    signIn, 
    isDbConnected,
    openAuditDrawer,
    theme,
    toggleTheme
  } = useHR();

  // Sign In state
  const [signInEmail, setSignInEmail] = useState('sarveshv6413@gmail.com');
  const [signInPassword, setSignInPassword] = useState('SarvesH@07');
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
    // Standard login: passes email and password; backend/context inspects user credentials & assigns appropriate role/dashboard
    const success = await signIn(signInEmail.trim(), undefined, signInPassword);
    setIsLoading(false);
    if (!success) {
      setErrorMessage('Account not found or invalid credentials. If you are a new employee, please contact your System Administrator.');
    }
  };

  const fillAdminCredentials = () => {
    setSignInEmail('sarveshv6413@gmail.com');
    setSignInPassword('SarvesH@07');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-purple-500 selection:text-white transition-colors duration-200">
      {/* Background Decorative Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/10 dark:bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-600/10 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-teal-600/10 dark:bg-teal-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold font-display tracking-tight text-slate-900 dark:text-white">dayflow</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                  HRMS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Every workday, perfectly aligned.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-amber-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer group"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform group-hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600 group-hover:text-purple-600 transition-transform group-hover:-rotate-12" />
              )}
            </button>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs font-medium text-slate-700 dark:text-slate-300">
              <Database className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 animate-pulse" />
              <span>{isDbConnected ? 'Supabase Connected' : 'Supabase Active'}</span>
            </div>
            
            <button
              onClick={openAuditDrawer}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/40 hover:bg-purple-200 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-700/50 text-xs font-medium text-purple-800 dark:text-purple-200 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>DB Audit Logs</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-md bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
          
          {/* Header Banner */}
          <div className="p-6 bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-slate-900 border-b border-slate-800 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Workspace Login
              </span>
              <span className="text-xs text-slate-400">Secure Access</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white font-display">
              Sign In to Dayflow
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Enter your corporate email and password. Your access level will be automatically verified upon sign-in.
            </p>
          </div>

          {/* Form Content */}
          <div className="p-6">
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Normal Sign In Form */}
            <form onSubmit={handleSignIn} className="space-y-4">
              {/* Email input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              {/* Password input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
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
                <span>{isLoading ? 'Verifying Credentials...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Verified Account Quick Access */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Verified Account
                  </span>
                  <button
                    type="button"
                    onClick={fillAdminCredentials}
                    className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <KeyRound className="w-3 h-3" />
                    Auto-Fill Sarvesh V
                  </button>
                </div>

                <div 
                  onClick={fillAdminCredentials}
                  className="p-3 rounded-xl bg-purple-50/80 dark:bg-purple-950/30 hover:bg-purple-100/80 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800/60 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                      SV
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Sarvesh V</span>
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-purple-200 dark:bg-purple-500/30 text-purple-800 dark:text-purple-300">
                          Admin
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">sarveshv6413@gmail.com</div>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-slate-500 dark:text-slate-400">
                    <div>Pass: <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">SarvesH@07</span></div>
                  </div>
                </div>
              </div>

              {/* RBAC Notice */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Role-Based Access:</strong> Administrators receive full management panels; normal employees access their dedicated personal workspace.
                </span>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-slate-500 border-t border-slate-200 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950">
        <p>Dayflow HRMS • Enterprise Cloud &amp; Supabase Database</p>
      </footer>
    </div>
  );
};


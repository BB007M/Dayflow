import React, { useEffect, useState } from 'react';
import { useHR } from '../../context/HRContext';
import { Department } from '../../types';
import {
  X,
  Lock,
  Mail,
  Building2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Database,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    signIn,
    signUp,
    isDbConnected,
    currentUser,
  } = useHR();

  const [mode, setMode] = useState<'signin' | 'signup'>(authModalMode);

  useEffect(() => {
    setMode(authModalMode);
  }, [authModalMode]);

  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpFirstName, setSignUpFirstName] = useState('');
  const [signUpLastName, setSignUpLastName] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpDept, setSignUpDept] = useState<Department>('Engineering');

  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!signInEmail.trim()) {
      setErrorMessage('Please provide your email address.');
      return;
    }

    if (!signInPassword) {
      setErrorMessage('Please provide your password.');
      return;
    }

    setIsLoading(true);

    const success = await signIn(
      signInEmail.trim(),
      'employee',
      signInPassword
    );

    setIsLoading(false);

    if (!success) {
      setErrorMessage(
        'Invalid email or password. Please check your credentials.'
      );
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (
      !signUpFirstName.trim() ||
      !signUpLastName.trim() ||
      !signUpEmail.trim() ||
      !signUpPassword
    ) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (signUpPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    const success = await signUp({
      email: signUpEmail.trim().toLowerCase(),
      firstName: signUpFirstName.trim(),
      lastName: signUpLastName.trim(),
      department: signUpDept,
      password: signUpPassword,
    });

    setIsLoading(false);

    if (!success) {
      setErrorMessage(
        'Registration failed. Check the error notification for details.'
      );
      return;
    }

    setSignUpEmail('');
    setSignUpFirstName('');
    setSignUpLastName('');
    setSignUpPassword('');
    setSignUpDept('Engineering');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full overflow-hidden">

        <div className="bg-gradient-to-r from-purple-800 via-indigo-700 to-teal-600 p-6 text-white relative">
          {currentUser && (
            <button
              type="button"
              onClick={closeAuthModal}
              aria-label="Close"
              className="absolute right-4 top-4 z-20 w-9 h-9 flex items-center justify-center rounded-lg bg-black/10 hover:bg-black/20 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center justify-between gap-2 mb-1 pr-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">Dayflow HRMS</span>
            </div>

            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/10 text-[11px] font-medium text-emerald-200 border border-emerald-400/30">
              <Database className="w-3 h-3" />
              <span>
                {isDbConnected ? 'Supabase Connected' : 'Database Offline'}
              </span>
            </div>
          </div>

          <h2 className="text-xl font-bold text-white mt-2">
            {mode === 'signin'
              ? 'Sign in to your workplace'
              : 'Create your employee account'}
          </h2>

          <p className="text-xs text-purple-100 mt-1">
            Secure authentication powered by Supabase.
          </p>
        </div>

        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-[11px] text-purple-700 dark:text-purple-400 hover:underline"
                    onClick={() =>
                      setErrorMessage('Password reset will be added next.')
                    }
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2">
                Don't have an employee account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setMode('signup');
                  }}
                  className="font-bold text-purple-700 dark:text-purple-400 hover:underline"
                >
                  Sign Up
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="John"
                    value={signUpFirstName}
                    onChange={(e) => setSignUpFirstName(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Doe"
                    value={signUpLastName}
                    onChange={(e) => setSignUpLastName(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <select
                  value={signUpDept}
                  onChange={(e) => setSignUpDept(e.target.value as Department)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Product & Design">Product & Design</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">
                  Email names ending in <span className="font-semibold text-purple-600 dark:text-purple-400">.admin</span> automatically receive HR Admin access.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Create Password
                </label>
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-purple-500"
                  minLength={6}
                  required
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
                <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Employee ID
                </div>
                Your unique Employee ID will be generated automatically by the database after registration.
              </div>

              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/60 text-[11px] text-purple-700 dark:text-purple-300">
                Normal accounts are employees. Use an email such as <strong>name.admin@gmail.com</strong> to receive HR Admin access automatically.
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>{isLoading ? 'Creating account...' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-1">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setMode('signin');
                  }}
                  className="font-bold text-purple-700 dark:text-purple-400 hover:underline"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
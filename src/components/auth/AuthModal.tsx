import React, { useState } from 'react';
import { useHR } from '../../context/HRContext';
import { UserRole, Department } from '../../types';
import { 
  X, 
  ShieldCheck, 
  User, 
  Lock, 
  Mail, 
  Building2, 
  Sparkles, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    authModalMode, 
    openAuthModal, 
    signIn, 
    signUp, 
    employees, 
    switchUser 
  } = useHR();

  const [mode, setMode] = useState<'signin' | 'signup'>(authModalMode);
  
  // Sign In form
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInRole, setSignInRole] = useState<UserRole>('employee');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sign Up form
  const [signUpEmpId, setSignUpEmpId] = useState(`EMP-${Math.floor(1000 + Math.random() * 9000)}`);
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpFirstName, setSignUpFirstName] = useState('');
  const [signUpLastName, setSignUpLastName] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpRole, setSignUpRole] = useState<UserRole>('employee');
  const [signUpDept, setSignUpDept] = useState<Department>('Engineering');
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!signInEmail.trim() || !signInPassword.trim()) {
      setErrorMessage('Please provide both company email and password.');
      return;
    }
    const success = signIn(signInEmail, signInRole);
    if (!success) {
      setErrorMessage('Invalid credentials. Check your email or use a Demo Preset below.');
    }
  };

  const handleSignUpStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!signUpEmail || !signUpFirstName || !signUpLastName || !signUpPassword) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    if (signUpPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters with mixed characters.');
      return;
    }
    // Proceed to email verification code step
    setIsVerifyingEmail(true);
  };

  const handleVerifyAndCompleteSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailVerificationCode.trim()) {
      setErrorMessage('Please enter the 6-digit verification code sent to your email.');
      return;
    }
    signUp({
      employeeId: signUpEmpId,
      email: signUpEmail,
      firstName: signUpFirstName,
      lastName: signUpLastName,
      role: signUpRole,
      department: signUpDept,
    });
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
          <button
            onClick={closeAuthModal}
            className="absolute right-4 top-4 text-white/80 hover:text-white p-1 rounded-lg bg-black/10 hover:bg-black/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center font-bold font-display">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg font-display tracking-tight">Dayflow HRMS</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-2">
            {isVerifyingEmail
              ? 'Verify Your Email'
              : mode === 'signin'
              ? 'Sign in to your workplace'
              : 'Create your employee account'}
          </h2>
          <p className="text-xs text-purple-100 mt-1">
            {isVerifyingEmail
              ? `We sent a security code to ${signUpEmail}`
              : 'Every workday, perfectly aligned. Secure role-based access.'}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Email Verification Step for Sign Up */}
          {isVerifyingEmail ? (
            <form onSubmit={handleVerifyAndCompleteSignUp} className="space-y-4">
              <div className="p-4 bg-purple-50/70 rounded-xl border border-purple-100 text-center">
                <Mail className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-xs text-slate-700 font-medium">
                  Enter any 6-digit confirmation code (e.g. <strong>849201</strong>) to complete identity verification.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="849201"
                  value={emailVerificationCode}
                  onChange={(e) => setEmailVerificationCode(e.target.value)}
                  className="w-full text-center text-lg tracking-widest font-mono px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-200 focus:border-purple-600 outline-none"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsVerifyingEmail(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium text-xs hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs transition-colors shadow-md shadow-purple-600/20"
                >
                  Complete Registration
                </button>
              </div>
            </form>
          ) : mode === 'signin' ? (
            /* Sign In Form */
            <form onSubmit={handleSignIn} className="space-y-4">
              {/* Role Toggle Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Access Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSignInRole('admin');
                      setSignInEmail('sarah.jenkins@dayflow.corp');
                      setSignInPassword('AdminPass2026!');
                    }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      signInRole === 'admin'
                        ? 'bg-purple-50 border-purple-600 text-purple-900 ring-2 ring-purple-100'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    Admin / HR Officer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSignInRole('employee');
                      setSignInEmail('alex.chen@dayflow.corp');
                      setSignInPassword('EmployeePass2026!');
                    }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      signInRole === 'employee'
                        ? 'bg-purple-50 border-purple-600 text-purple-900 ring-2 ring-purple-100'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <User className="w-4 h-4 text-indigo-600" />
                    Regular Employee
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="name@dayflow.corp"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-200 focus:border-purple-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <span className="text-[11px] text-purple-700 hover:underline cursor-pointer">
                    Forgot password?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-200 focus:border-purple-600 outline-none"
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
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-purple-600/25 flex items-center justify-center gap-2"
              >
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Demo 1-Click fast login pills */}
              <div className="pt-3 border-t border-slate-100">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
                  Or 1-Click Demo Login
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickPresetLogin(employees[0])}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-left transition-colors flex items-center gap-2"
                  >
                    <img src={employees[0].avatar} className="w-7 h-7 rounded-full object-cover" alt="" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-slate-900 truncate">Sarah Jenkins</div>
                      <div className="text-[10px] text-purple-700 font-semibold">HR Officer (Admin)</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickPresetLogin(employees[1])}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-left transition-colors flex items-center gap-2"
                  >
                    <img src={employees[1].avatar} className="w-7 h-7 rounded-full object-cover" alt="" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-slate-900 truncate">Alex Chen</div>
                      <div className="text-[10px] text-sky-700 font-semibold">Senior Engineer</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="text-center text-xs text-slate-500 pt-2">
                Don't have an employee account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="font-bold text-purple-700 hover:underline"
                >
                  Sign Up
                </button>
              </div>
            </form>
          ) : (
            /* Sign Up Form (Section 3.1.1 of PDF) */
            <form onSubmit={handleSignUpStep1} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="John"
                    value={signUpFirstName}
                    onChange={(e) => setSignUpFirstName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-200 focus:border-purple-600 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Doe"
                    value={signUpLastName}
                    onChange={(e) => setSignUpLastName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-200 focus:border-purple-600 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={signUpEmpId}
                    onChange={(e) => setSignUpEmpId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-200 focus:border-purple-600 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <select
                    value={signUpDept}
                    onChange={(e) => setSignUpDept(e.target.value as Department)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-200 focus:border-purple-600 outline-none bg-white"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product & Design">Product & Design</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  placeholder="john.doe@dayflow.corp"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-200 focus:border-purple-600 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSignUpRole('employee')}
                    className={`py-1.5 px-3 rounded-lg border text-xs font-medium ${
                      signUpRole === 'employee'
                        ? 'bg-purple-50 border-purple-600 text-purple-900 font-bold'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Employee
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignUpRole('admin')}
                    className={`py-1.5 px-3 rounded-lg border text-xs font-medium ${
                      signUpRole === 'admin'
                        ? 'bg-purple-50 border-purple-600 text-purple-900 font-bold'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Admin / HR
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Create Password
                </label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-200 focus:border-purple-600 outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 mt-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-purple-600/25 flex items-center justify-center gap-2"
              >
                <span>Continue to Verification</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center text-xs text-slate-500 pt-1">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="font-bold text-purple-700 hover:underline"
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

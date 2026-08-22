import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Calendar, 
  Sparkles, 
  X, 
  ArrowRight, 
  UserCheck, 
  CalendarCheck2,
  Banknote,
  ShieldCheck
} from 'lucide-react';
import { useHR } from '../../context/HRContext';

const DURATION = 5000; // 5 seconds display

export const CleanCelebrationModal: React.FC = () => {
  const { celebrationData, closeCelebration, setActiveTab } = useHR();
  const [progress, setProgress] = useState(100);
  
  // Stable ref for closeCelebration to prevent effect restarts
  const closeRef = useRef(closeCelebration);
  useEffect(() => {
    closeRef.current = closeCelebration;
  }, [closeCelebration]);

  const activeId = celebrationData?.id;

  useEffect(() => {
    if (!activeId) return;

    setProgress(100);
    const startTime = Date.now();
    const endTime = startTime + DURATION;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = endTime - now;
      const pct = Math.max(0, (remaining / DURATION) * 100);
      setProgress(pct);

      if (remaining <= 0) {
        clearInterval(interval);
        closeRef.current();
      }
    }, 25);

    return () => {
      clearInterval(interval);
    };
  }, [activeId]);

  const isApproved = celebrationData?.type === 'leave_approved';
  const isApplied = celebrationData?.type === 'leave_applied';
  const isPayroll = celebrationData?.type === 'payroll_disbursed';
  const isOnboarded = celebrationData?.type === 'employee_onboarded';

  const getIcon = () => {
    if (!celebrationData) return null;
    switch (celebrationData.type) {
      case 'leave_approved':
        return <CalendarCheck2 className="w-8 h-8 text-emerald-600" />;
      case 'leave_applied':
        return <Calendar className="w-8 h-8 text-purple-600" />;
      case 'employee_onboarded':
        return <UserCheck className="w-8 h-8 text-indigo-600" />;
      case 'payroll_disbursed':
        return <Banknote className="w-8 h-8 text-teal-600" />;
      default:
        return <CheckCircle2 className="w-8 h-8 text-emerald-600" />;
    }
  };

  const getThemeColors = () => {
    if (isApproved) {
      return {
        ring: 'ring-emerald-500/20 bg-emerald-50 text-emerald-700',
        badge: 'bg-emerald-100/80 text-emerald-800 border-emerald-200',
        gradient: 'from-emerald-500 to-teal-600',
        button: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20',
        glow: 'bg-emerald-400/20',
      };
    }
    if (isApplied) {
      return {
        ring: 'ring-purple-500/20 bg-purple-50 text-purple-700',
        badge: 'bg-purple-100/80 text-purple-800 border-purple-200',
        gradient: 'from-purple-600 to-indigo-600',
        button: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20',
        glow: 'bg-purple-400/20',
      };
    }
    if (isPayroll) {
      return {
        ring: 'ring-teal-500/20 bg-teal-50 text-teal-700',
        badge: 'bg-teal-100/80 text-teal-800 border-teal-200',
        gradient: 'from-teal-600 to-emerald-600',
        button: 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20',
        glow: 'bg-teal-400/20',
      };
    }
    return {
      ring: 'ring-indigo-500/20 bg-indigo-50 text-indigo-700',
      badge: 'bg-indigo-100/80 text-indigo-800 border-indigo-200',
      gradient: 'from-indigo-600 to-purple-600',
      button: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20',
      glow: 'bg-indigo-400/20',
    };
  };

  const theme = getThemeColors();

  const handleAction = () => {
    closeCelebration();
    if (isApplied || isApproved) {
      setActiveTab('leaves');
    } else if (isPayroll) {
      setActiveTab('payroll');
    } else if (isOnboarded) {
      setActiveTab('employees');
    }
  };

  const getActionLabel = () => {
    if (isApplied || isApproved) return 'View Leave Hub';
    if (isPayroll) return 'View Payroll';
    if (isOnboarded) return 'View Directory';
    return 'Continue';
  };

  return (
    <AnimatePresence>
      {celebrationData && (
        <div 
          id="clean-celebration-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm"
          onClick={closeCelebration}
        >
          <motion.div
            id="clean-celebration-card"
            initial={{ opacity: 0, scale: 0.88, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -10 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Top Glow */}
            <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-36 ${theme.glow} rounded-full blur-3xl pointer-events-none`} />

            {/* Close button */}
            <button
              id="close-celebration-btn"
              onClick={closeCelebration}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors z-10 cursor-pointer"
              aria-label="Close popup"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Floating Minimalist Particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    opacity: 0, 
                    scale: 0,
                    x: Math.random() * 160 - 80,
                    y: Math.random() * 40 - 20
                  }}
                  animate={{ 
                    opacity: [0, 0.8, 0], 
                    scale: [0.6, 1.2, 0.8],
                    y: [0, -40 - Math.random() * 30],
                    x: [(i % 2 === 0 ? 1 : -1) * (15 + i * 8), (i % 2 === 0 ? 1 : -1) * (30 + i * 12)]
                  }}
                  transition={{ 
                    duration: 2.2, 
                    ease: 'easeOut',
                    delay: i * 0.12 
                  }}
                  className={`absolute left-1/2 top-14 w-2 h-2 rounded-full ${
                    i % 3 === 0 ? 'bg-purple-400' : i % 3 === 1 ? 'bg-emerald-400' : 'bg-indigo-400'
                  }`}
                />
              ))}
            </div>

            <div className="p-6 sm:p-7 relative z-10 text-center">
              
              {/* Animated Icon Avatar */}
              <div className="relative mx-auto w-20 h-20 mb-4 flex items-center justify-center">
                {/* Pulsing Ripple Ring */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.4 }}
                  animate={{ scale: [0.85, 1.25, 0.85], opacity: [0.4, 0.1, 0.4] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className={`absolute inset-0 rounded-full ${theme.ring} ring-8`}
                />
                
                {/* Core Icon Wrapper */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 20, delay: 0.1 }}
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border border-slate-100 ${
                    isApproved ? 'bg-emerald-50 text-emerald-600' : isApplied ? 'bg-purple-50 text-purple-600' : 'bg-indigo-50 text-indigo-600'
                  }`}
                >
                  {getIcon()}
                </motion.div>

                {/* Sparkle Chip */}
                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.25, type: 'spring', stiffness: 500 }}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-amber-950" />
                </motion.div>
              </div>

              {/* Badge */}
              {celebrationData.badge && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border mb-2.5"
                >
                  <span className={theme.badge}>{celebrationData.badge}</span>
                </motion.div>
              )}

              {/* Title & Subtitle */}
              <motion.h3
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl sm:text-2xl font-bold font-display tracking-tight text-slate-900 mb-1"
              >
                {celebrationData.title}
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed mb-5"
              >
                {celebrationData.subtitle}
              </motion.p>

              {/* Structured Details Card (if provided) */}
              {celebrationData.details && celebrationData.details.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 mb-5 text-left"
                >
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    {celebrationData.details.map((item, idx) => (
                      <div key={idx} className="p-2 rounded-xl bg-white border border-slate-200/60 shadow-xs">
                        <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{item.label}</div>
                        <div className="text-xs font-bold text-slate-800 mt-0.5 truncate">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Employee Preview (if available) */}
              {celebrationData.employeeName && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.32 }}
                  className="flex items-center justify-center gap-2 mb-5 text-xs text-slate-600"
                >
                  {celebrationData.employeeAvatar ? (
                    <img
                      src={celebrationData.employeeAvatar}
                      alt={celebrationData.employeeName}
                      className="w-5 h-5 rounded-full object-cover border border-slate-300"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold">
                      {celebrationData.employeeName.charAt(0)}
                    </div>
                  )}
                  <span className="font-medium text-slate-700">For {celebrationData.employeeName}</span>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleAction}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${theme.button}`}
                >
                  <span>{getActionLabel()}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={closeCelebration}
                  className="py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>

            {/* Auto-Dismiss Progress Bar (smooth 5s countdown) */}
            <div className="w-full bg-slate-100 h-1 overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${theme.gradient} transition-all duration-75 ease-linear`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

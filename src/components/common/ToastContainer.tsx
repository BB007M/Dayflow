import React from 'react';
import { useHR } from '../../context/HRContext';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useHR();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => {
          let Icon = Info;
          let colorStyles = 'bg-slate-900 text-white border-slate-800';
          let iconColor = 'text-sky-400';

          if (toast.type === 'success') {
            colorStyles = 'bg-emerald-950/95 text-emerald-100 border-emerald-800 shadow-emerald-950/30';
            iconColor = 'text-emerald-400';
            Icon = CheckCircle;
          } else if (toast.type === 'error') {
            colorStyles = 'bg-rose-950/95 text-rose-100 border-rose-800 shadow-rose-950/30';
            iconColor = 'text-rose-400';
            Icon = XCircle;
          } else if (toast.type === 'warning') {
            colorStyles = 'bg-amber-950/95 text-amber-100 border-amber-800 shadow-amber-950/30';
            iconColor = 'text-amber-400';
            Icon = AlertTriangle;
          } else {
            colorStyles = 'bg-indigo-950/95 text-indigo-100 border-indigo-800 shadow-indigo-950/30';
            iconColor = 'text-indigo-400';
            Icon = Info;
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md ${colorStyles}`}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold leading-tight">{toast.title}</h4>
                {toast.message && (
                  <p className="text-xs mt-1 text-slate-300 leading-relaxed">{toast.message}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

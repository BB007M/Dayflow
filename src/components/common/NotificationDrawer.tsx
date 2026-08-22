import React from 'react';
import { useHR } from '../../context/HRContext';
import { 
  X, 
  CheckCheck, 
  CalendarDays, 
  Clock, 
  Banknote, 
  Bell, 
  ShieldCheck, 
  Info,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { 
    notifications, 
    markNotificationRead, 
    markAllNotificationsRead, 
    setActiveTab, 
    currentRole,
    currentUser
  } = useHR();

  if (!isOpen) return null;

  // Filter notifications relevant to current persona
  const userNotifications = notifications.filter((n) => {
    if (n.targetRole === 'all') return true;
    if (n.targetRole === currentRole) return true;
    if (n.targetEmployeeId && currentUser && n.targetEmployeeId === currentUser.employeeId) return true;
    return false;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'leave':
        return <CalendarDays className="w-4 h-4 text-purple-600" />;
      case 'attendance':
        return <Clock className="w-4 h-4 text-emerald-600" />;
      case 'payroll':
        return <Banknote className="w-4 h-4 text-teal-600" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-600" />;
    }
  };

  const handleClickItem = (notif: typeof notifications[0]) => {
    markNotificationRead(notif.id);
    if (notif.linkTab) {
      setActiveTab(notif.linkTab);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Notifications</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Alerts, leave approvals & payroll</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={markAllNotificationsRead}
                className="p-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-lg font-medium flex items-center gap-1 transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Mark read</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {userNotifications.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500">
                <Bell className="w-10 h-10 stroke-1 mb-2 opacity-60 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No new notifications</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">You're completely caught up with HR activities.</p>
              </div>
            ) : (
              userNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleClickItem(notif)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex gap-3 items-start group ${
                    notif.isRead
                      ? 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                      : 'bg-purple-50/50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/50 shadow-xs'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${notif.isRead ? 'bg-slate-100 dark:bg-slate-700' : 'bg-purple-100 dark:bg-purple-900/60'}`}>
                    {getIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-xs font-semibold truncate ${notif.isRead ? 'text-slate-800 dark:text-slate-200' : 'text-purple-950 dark:text-purple-200 font-bold'}`}>
                        {notif.title}
                      </h4>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/80 dark:border-slate-700/60">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {notif.timestamp}
                      </span>
                      {notif.linkTab && (
                        <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 flex items-center group-hover:translate-x-0.5 transition-transform">
                          View details <ChevronRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              System alerts adhere to Dayflow HRMS security policies.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

import React from 'react';
import { useHR } from '../../context/HRContext';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  CalendarDays, 
  Banknote, 
  BarChart3, 
  Sparkles, 
  ShieldAlert, 
  UserCircle,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Building2,
  FileCheck,
  Sun,
  Moon
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onOpenAssistant?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  isOpenMobile, 
  onCloseMobile, 
  onOpenAssistant 
}) => {
  const isMobileOpen = isOpenMobile !== undefined ? isOpenMobile : (isOpen || false);
  const handleClose = onCloseMobile || onClose || (() => {});

  const { 
    activeTab, 
    setActiveTab, 
    currentRole, 
    currentUser, 
    leaveRequests,
    openEmployeeProfile,
    openAuthModal,
    signOut,
    isDarkMode,
    toggleDarkMode
  } = useHR();

  const pendingLeavesCount = leaveRequests.filter((l) => l.status === 'Pending').length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'employee'],
    },
    {
      id: 'employees',
      label: currentRole === 'admin' ? 'Employees Directory' : 'Team Directory',
      icon: Users,
      roles: ['admin', 'employee'],
    },
    {
      id: 'attendance',
      label: 'Attendance & Clock',
      icon: Clock,
      roles: ['admin', 'employee'],
    },
    {
      id: 'leaves',
      label: 'Leave & Time-Off',
      icon: CalendarDays,
      roles: ['admin', 'employee'],
      badge: currentRole === 'admin' && pendingLeavesCount > 0 ? pendingLeavesCount : undefined,
    },
    {
      id: 'payroll',
      label: currentRole === 'admin' ? 'Payroll & Salary' : 'My Salary & Payslips',
      icon: Banknote,
      roles: ['admin', 'employee'],
    },
    {
      id: 'analytics',
      label: 'Reports & Analytics',
      icon: BarChart3,
      roles: ['admin', 'employee'],
    },
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    if (window.innerWidth < 1024) {
      handleClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={handleClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 h-screen bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-lg font-display tracking-tight text-white flex items-center gap-1.5">
                dayflow
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  HRMS
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium">HR Operations Suite</div>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Main Operations
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/30 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-purple-300'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Current User & Role Switcher Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2">
          {/* Active User Card */}
          {currentUser ? (
            <div 
              onClick={() => openEmployeeProfile(currentUser)}
              className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 cursor-pointer border border-slate-800 transition-colors"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.firstName}
                className="w-9 h-9 rounded-lg object-cover ring-1 ring-purple-500/40"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white truncate">
                  {currentUser.firstName} {currentUser.lastName}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {currentRole === 'admin' ? 'HR Officer (Admin)' : currentUser.jobDetails.designation}
                </div>
              </div>
              <UserCircle className="w-4 h-4 text-slate-400 hover:text-purple-300" />
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('signin')}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-purple-900/40 hover:bg-purple-900/60 border border-purple-700/50 text-xs text-purple-200 transition-colors"
            >
              <span>Not Signed In</span>
              <span className="font-semibold text-white underline">Sign In</span>
            </button>
          )}

          {/* Dark / Light Mode Toggle Button in Sidebar */}
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              {isDarkMode ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
              )}
              <span>Appearance:</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-purple-300 bg-purple-950/60 border border-purple-800/40 px-2 py-0.5 rounded">
              {isDarkMode ? 'Dark Mode' : 'Light Mode'}
            </div>
          </button>

        </div>
      </aside>
    </>
  );
};

import React from 'react';
import { useHR } from '../../context/HRContext';
import { ProfilePlaceholder } from './ProfilePlaceholder';
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
  FileCheck
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
    switchRole,
    openEmployeeProfile,
    openAuthModal,
    signOut
  } = useHR();

  const pendingLeavesCount = leaveRequests.filter((l) => l.status === 'Pending').length;

  const navItems = [
    {
      id: 'admin',
      label: 'Admin Console',
      icon: ShieldCheck,
      roles: ['admin'],
      adminOnlyBadge: true,
    },
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

  const visibleNavItems = navItems.filter((item) => item.roles.includes(currentRole));

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
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:z-10`}
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

          {visibleNavItems.map((item) => {
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

          {/* Quick Database Security Status */}
          <div className="pt-3">
            <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              System Infrastructure
            </div>
            <div className="mx-2 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-[11px] text-slate-300 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Supabase Database Active</span>
            </div>
          </div>
        </div>

        {/* Current User & Logout Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2">
          {/* Active User Card */}
          {currentUser ? (
            <>
              <div 
                onClick={() => openEmployeeProfile(currentUser)}
                className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 cursor-pointer border border-slate-800 transition-colors"
                title="View Profile Details"
              >
                <ProfilePlaceholder label={`${currentUser.firstName} ${currentUser.lastName}`} className="w-9 h-9" />
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

              {/* Logout Button */}
              <button
                onClick={() => signOut()}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-xs font-semibold text-rose-300 hover:text-white transition-all cursor-pointer shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => openAuthModal('signin')}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-purple-900/40 hover:bg-purple-900/60 border border-purple-700/50 text-xs text-purple-200 transition-colors"
            >
              <span>Not Signed In</span>
              <span className="font-semibold text-white underline">Sign In</span>
            </button>
          )}

        </div>
      </aside>
    </>
  );
};

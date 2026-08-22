import React, { useState, useRef, useEffect } from 'react';
import { useHR } from '../../context/HRContext';
import { 
  Bell, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  User, 
  ChevronDown, 
  LogOut, 
  Clock, 
  Check, 
  Briefcase,
  Layers,
  Menu,
  X
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar?: () => void;
  onOpenAssistant?: () => void;
  onOpenNotifications?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onToggleSidebar, 
  onOpenAssistant,
  onOpenNotifications
}) => {
  const { 
    currentUser, 
    currentRole, 
    switchRole, 
    switchUser, 
    employees, 
    checkInState, 
    openEmployeeProfile, 
    unreadNotificationCount, 
    openAuthModal,
    signOut,
    setActiveTab
  } = useHR();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof employees>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
        setIsRoleDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }
    const q = searchQuery.toLowerCase();
    const filtered = employees.filter(
      (e) =>
        e.firstName.toLowerCase().includes(q) ||
        e.lastName.toLowerCase().includes(q) ||
        e.employeeId.toLowerCase().includes(q) ||
        e.jobDetails.department.toLowerCase().includes(q) ||
        e.jobDetails.designation.toLowerCase().includes(q)
    );
    setSearchResults(filtered);
    setIsSearchOpen(true);
  }, [searchQuery, employees]);

  const handleSelectSearchResult = (emp: typeof employees[0]) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    openEmployeeProfile(emp);
  };

  // Format active worked time
  const formatSeconds = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-6 py-3 transition-all">
      <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
        
        {/* Left: Mobile menu toggle + Logo / Tagline */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg lg:hidden transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div 
            onClick={() => setActiveTab('dashboard')} 
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-700 via-indigo-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-slate-900 font-display">
                  dayflow
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                  HRMS
                </span>
              </div>
              <span className="text-[11px] text-slate-500 hidden sm:inline -mt-0.5">
                Every workday, perfectly aligned.
              </span>
            </div>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div ref={searchRef} className="relative hidden md:block flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search employees, departments, designations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setIsSearchOpen(true)}
              className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-800 placeholder-slate-400 rounded-xl border border-transparent focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {isSearchOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 max-h-80 overflow-y-auto">
              <div className="text-[11px] font-semibold text-slate-400 px-3 py-1 uppercase tracking-wider">
                Matching Employees ({searchResults.length})
              </div>
              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No employee records found matching "{searchQuery}"
                </div>
              ) : (
                searchResults.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => handleSelectSearchResult(emp)}
                    className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg text-left transition-colors"
                  >
                    <img
                      src={emp.avatar}
                      alt={emp.firstName}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {emp.firstName} {emp.lastName}
                        <span className="ml-1.5 text-[10px] text-slate-400">({emp.employeeId})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {emp.jobDetails.designation} • {emp.jobDetails.department}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right: Punch Status, Role Switcher, Copilot, Notifications & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Real-time Punch Status pill (Employee quick glance) */}
          <div 
            onClick={() => setActiveTab('attendance')}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 cursor-pointer border border-slate-200/60 transition-colors text-xs"
            title="Click to view full attendance logs"
          >
            <div className={`w-2 h-2 rounded-full ${checkInState.isCheckedIn ? (checkInState.isOnBreak ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse') : 'bg-slate-400'}`} />
            <span className="font-medium text-slate-700">
              {checkInState.isCheckedIn
                ? checkInState.isOnBreak
                  ? 'On Break'
                  : `In: ${checkInState.checkInTimestamp || '09:00 AM'}`
                : 'Punched Out'}
            </span>
            {checkInState.isCheckedIn && (
              <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                {formatSeconds(checkInState.accumulatedWorkedSeconds)}
              </span>
            )}
          </div>

          {/* AI Assistant Button */}
          <button
            onClick={onOpenAssistant}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition-all hover:shadow-sm"
            title="Ask Dayflow AI HR Copilot"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
            <span className="hidden sm:inline">AI Copilot</span>
          </button>

          {/* Notifications Button */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white animate-bounce">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {/* User Profile & Role Dropdown */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.firstName}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover ring-2 ring-purple-500/20"
              />
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 leading-tight">
                  {currentUser.firstName} {currentUser.lastName}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {currentRole === 'admin' ? 'HR Director (Admin)' : currentUser.jobDetails.designation}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* User Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 text-xs">
                {/* Active user header */}
                <div className="p-3 bg-slate-50 rounded-xl mb-2 border border-slate-100">
                  <div className="font-semibold text-slate-900 text-sm">
                    {currentUser.firstName} {currentUser.lastName}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {currentUser.email}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-purple-100 text-purple-800">
                      <ShieldCheck className="w-3 h-3" />
                      {currentRole === 'admin' ? 'Admin / HR' : 'Employee'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {currentUser.employeeId}
                    </span>
                  </div>
                </div>

                {/* Role Switcher in Menu */}
                <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Active Role Switch
                </div>
                <div className="grid grid-cols-2 gap-1 mb-2">
                  <button
                    onClick={() => {
                      switchRole('admin');
                      setIsUserMenuOpen(false);
                    }}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition-all ${
                      currentRole === 'admin'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Admin
                  </button>
                  <button
                    onClick={() => {
                      switchRole('employee');
                      setIsUserMenuOpen(false);
                    }}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition-all ${
                      currentRole === 'employee'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    Employee
                  </button>
                </div>

                <div className="h-px bg-slate-100 my-1" />

                {/* Actions */}
                <button
                  onClick={() => {
                    openEmployeeProfile(currentUser);
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors text-left"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  View & Edit My Profile
                </button>

                <button
                  onClick={() => {
                    setActiveTab('attendance');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors text-left"
                >
                  <Clock className="w-4 h-4 text-slate-400" />
                  Attendance & Punch Logs
                </button>

                <button
                  onClick={() => {
                    setActiveTab('payroll');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors text-left"
                >
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  Salary & Payslips
                </button>

                <div className="h-px bg-slate-100 my-1" />

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    openAuthModal('signin');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-purple-700 hover:bg-purple-50 rounded-lg transition-colors text-left font-medium"
                >
                  <User className="w-4 h-4 text-purple-600" />
                  Switch / Sign In Other User
                </button>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    signOut();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left font-medium"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  Sign Out
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

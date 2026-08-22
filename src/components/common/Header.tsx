import React, { useState, useRef, useEffect } from 'react';
import { useHR } from '../../context/HRContext';
import { ProfilePlaceholder } from './ProfilePlaceholder';
import { formatWorkedSeconds } from '../../time';
import { 
  Bell, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  User, 
  ChevronDown, 
  LogOut, 
  Clock, 
  Briefcase,
  Layers,
  Menu,
  Database,
  LogIn,
  Sun,
  Moon
} from 'lucide-react';

interface HeaderProps {
  onToggleMobileSidebar?: () => void;
  onOpenAssistant?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onToggleMobileSidebar, 
  onOpenAssistant,
}) => {
  const { 
    currentUser, 
    currentRole, 
    switchRole, 
    employees, 
    checkInState, 
    openEmployeeProfile, 
    unreadNotificationCount, 
    openAuthModal,
    signOut,
    setActiveTab,
    isNotificationOpen,
    setIsNotificationOpen,
    openAuditDrawer,
    isDbConnected,
    theme,
    toggleTheme
  } = useHR();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
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

  return (
    <header className="sticky top-0 z-30 bg-white/70 dark:bg-slate-950/65 backdrop-blur-xl border-b border-white/70 dark:border-slate-800/80 shadow-[0_1px_0_rgba(15,23,42,0.04)] px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 transition-colors duration-200">
      <div className="flex min-w-0 items-center justify-between gap-2 sm:gap-3 max-w-7xl mx-auto">
        
        {/* Left: Mobile menu toggle + Logo / Tagline */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg lg:hidden transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div 
            onClick={() => setActiveTab('dashboard')} 
            className="flex min-w-0 items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-700 via-indigo-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white font-display">
                  dayflow
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                  HRMS
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline -mt-0.5">
                Every workday, perfectly aligned.
              </span>
            </div>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div ref={searchRef} className="relative hidden md:block flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search employees, departments, designations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setIsSearchOpen(true)}
              className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-white/70 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl border border-slate-200/70 dark:border-slate-700/80 focus:border-purple-400 dark:focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-950 outline-none shadow-sm transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs absolute right-3 top-1/2 -translate-y-1/2"
              >
                Clear
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {isSearchOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 max-h-72 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                  No matching employees found for "{searchQuery}"
                </div>
              ) : (
                searchResults.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => handleSelectSearchResult(emp)}
                    className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-lg text-left transition-colors"
                  >
                    <ProfilePlaceholder label={`${emp.firstName} ${emp.lastName}`} className="w-8 h-8 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {emp.firstName} {emp.lastName}
                        <span className="ml-1.5 text-[10px] text-slate-400">({emp.employeeId})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {emp.jobDetails.designation} • {emp.jobDetails.department}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right: DB Logs, Punch Status, Theme Toggle, Notifications & Profile */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          
          {/* Supabase DB Auth Logs Button */}
          <button
            onClick={openAuditDrawer}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-slate-700 hover:text-purple-700 dark:hover:text-purple-300 rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            title="View Supabase Login & Audit Logs"
          >
            <Database className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span className="hidden sm:inline">DB Logs</span>
          </button>

          {/* Theme Toggle Button (Light / Dark Mode) */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-amber-400 bg-slate-100/80 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700/80 rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer group"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform group-hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 group-hover:text-purple-600 transition-transform group-hover:-rotate-12" />
            )}
          </button>

          {/* Real-time Punch Status pill */}
          {currentUser && (
            <div 
              onClick={() => setActiveTab('attendance')}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 cursor-pointer border border-slate-200/60 dark:border-slate-700 transition-colors text-xs"
              title="Click to view full attendance logs"
            >
              <div className={`w-2 h-2 rounded-full ${checkInState.isCheckedIn ? (checkInState.isOnBreak ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse') : 'bg-slate-400'}`} />
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {checkInState.isCheckedIn
                  ? checkInState.isOnBreak
                    ? 'On Break'
                    : `In: ${checkInState.checkInTimestamp || '09:00 AM'}`
                  : 'Punched Out'}
              </span>
              {checkInState.isCheckedIn && (
                <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/70 px-1.5 py-0.5 rounded">
                    {formatWorkedSeconds(checkInState.accumulatedWorkedSeconds)}
                </span>
              )}
            </div>
          )}

          {/* Notifications Button */}
          <button
            onClick={() => setIsNotificationOpen(true)}
            className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900 animate-bounce">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {/* User Profile & Role Dropdown or Sign In */}
          {currentUser ? (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer"
              >
                <ProfilePlaceholder imageUrl={currentUser.avatar} label={`${currentUser.firstName} ${currentUser.lastName}`} className="w-7 h-7 sm:w-8 sm:h-8" />
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                    {currentUser.firstName} {currentUser.lastName}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {currentRole === 'admin' ? 'HR Director (Admin)' : currentUser.jobDetails.designation}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 text-xs">
                  {/* Active user header */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl mb-2 border border-slate-100 dark:border-slate-700">
                    <div className="font-semibold text-slate-900 dark:text-white text-sm">
                      {currentUser.firstName} {currentUser.lastName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {currentUser.email}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300">
                        <ShieldCheck className="w-3 h-3" />
                        {currentRole === 'admin' ? 'Admin / HR' : 'Employee'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {currentUser.employeeId}
                      </span>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                  {/* Actions */}
                  <button
                    onClick={() => {
                      openEmployeeProfile(currentUser);
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-left cursor-pointer"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    View & Edit My Profile
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('attendance');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-left cursor-pointer"
                  >
                    <Clock className="w-4 h-4 text-slate-400" />
                    Attendance & Punch Logs
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('payroll');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-left cursor-pointer"
                  >
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    Salary & Payslips
                  </button>

                  {/* Dark Mode switch inside user menu too for extra convenience */}
                  <button
                    onClick={() => {
                      toggleTheme();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      {theme === 'dark' ? (
                        <Sun className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Moon className="w-4 h-4 text-slate-400" />
                      )}
                      <span>Appearance</span>
                    </div>
                    <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase">
                      {theme === 'dark' ? 'Dark' : 'Light'}
                    </span>
                  </button>

                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors text-left font-semibold cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    Sign Out (Logout)
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('signin')}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}

          {/* Dedicated Direct Logout Button */}
          {currentUser && (
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-xl border border-rose-200 dark:border-rose-900/60 transition-all shadow-sm cursor-pointer"
              title="Sign Out of Session"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};

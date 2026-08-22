import { getLocalDateKey } from '../time';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Employee, 
  UserRole, 
  AttendanceRecord, 
  AttendanceDbLog,
  LeaveRequest, 
  Payslip, 
  NotificationItem, 
  CheckInState, 
  SalaryStructure,
  Department,
  CelebrationPopupData
} from '../types';
import { 
  INITIAL_EMPLOYEES, 
  generateInitialAttendance, 
  INITIAL_LEAVE_REQUESTS, 
  INITIAL_PAYSLIPS, 
  INITIAL_NOTIFICATIONS 
} from '../data/initialData';
import { LoginAuditLog } from '../types/auth';

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
}

interface HRContextType {
  currentUser: Employee | null;
  currentRole: UserRole;
  isAuthenticated: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  attendanceDbLogs: AttendanceDbLog[];
  leaveRequests: LeaveRequest[];
  payslips: Payslip[];
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  activeTab: string;
  checkInState: CheckInState;
  toasts: ToastMessage[];
  selectedEmployeeForModal: Employee | null;
  isProfileModalOpen: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'signin' | 'signup';
  isDbConnected: boolean;
  loginAuditLogs: LoginAuditLog[];
  isAuditDrawerOpen: boolean;
  isNotificationOpen: boolean;
  celebrationData: CelebrationPopupData | null;
  
  // Actions
  triggerCelebration: (data: CelebrationPopupData) => void;
  closeCelebration: () => void;
  setIsNotificationOpen: (open: boolean) => void;
  openNotificationDrawer: () => void;
  closeNotificationDrawer: () => void;
  setActiveTab: (tab: string) => void;
  switchUser: (employeeId: string) => void;
  switchRole: (role: UserRole) => void;
  openAuthModal: (mode?: 'signin' | 'signup') => void;
  closeAuthModal: () => void;
  signIn: (email: string, role?: UserRole, password?: string) => Promise<boolean>;
  signUp: (payload: { employeeId: string; email: string; firstName: string; lastName: string; role: UserRole; department: Department; password?: string }) => Promise<boolean>;
  signOut: (reason?: string) => Promise<void>;
  openAuditDrawer: () => void;
  closeAuditDrawer: () => void;
  refreshAuditLogs: () => Promise<void>;
  refreshAttendanceLogs: () => Promise<void>;
  
  // Attendance
  checkIn: () => void;
  checkOut: () => void;
  toggleBreak: () => void;
  markAttendanceManual: (record: AttendanceRecord) => void;
  
  // Leaves
  applyLeave: (leaveData: {
    leaveType: LeaveRequest['leaveType'];
    startDate: string;
    endDate: string;
    totalDays: number;
    isHalfDay: boolean;
    reason: string;
  }) => void;
  updateLeaveRequest: (leaveId: string, updates: Pick<LeaveRequest, 'leaveType' | 'startDate' | 'endDate' | 'totalDays' | 'isHalfDay' | 'reason'>) => void;
  reviewLeave: (leaveId: string, status: 'Approved' | 'Rejected', comments?: string) => void;
  
  // Employees & Profile
  openEmployeeProfile: (employee: Employee) => void;
  closeEmployeeProfile: () => void;
  updateEmployee: (updated: Employee) => void;
  addNewEmployee: (newEmployee: Omit<Employee, 'id'>, initialPassword?: string) => Promise<void>;
  updateSalaryStructure: (employeeId: string, structure: SalaryStructure) => void;
  terminateEmployee: (employeeId: string, reason?: string, notes?: string) => Promise<boolean>;
  rehireEmployee: (employeeId: string) => Promise<boolean>;
  deleteEmployee: (employeeId: string) => Promise<boolean>;
  
  // Payroll
  generateMonthlyPayroll: (month: string, year: number) => void;
  
  // Notifications & UI
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addToast: (type: ToastMessage['type'], title: string, message?: string) => void;
  removeToast: (id: string) => void;
  resetDemoData: () => void;
}

const HRContext = createContext<HRContextType | undefined>(undefined);

const STORAGE_KEYS = {
  EMPLOYEES: 'dayflow_hrms_employees_v3',
  ATTENDANCE: 'dayflow_hrms_attendance_v3',
  LEAVES: 'dayflow_hrms_leaves_v3',
  PAYSLIPS: 'dayflow_hrms_payslips_v3',
  NOTIFICATIONS: 'dayflow_hrms_notifications_v3',
  CURRENT_USER_ID: 'dayflow_hrms_current_user_id_v3',
  AUTH_TOKEN: 'dayflow_hrms_auth_token_v3',
  LAST_ACTIVITY: 'dayflow_hrms_last_activity_v3',
  CHECK_IN_STATE: 'dayflow_hrms_checkin_state_v3',
  THEME: 'dayflow_hrms_theme_v3',
};

export const HRProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme State
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Sync theme with HTML document element class list
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      try {
        localStorage.setItem(STORAGE_KEYS.THEME, theme);
      } catch (err) {
        console.warn('Could not save theme preference to localStorage', err);
      }
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setTheme = useCallback((newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  }, []);

  // State Initialization
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    if (saved) {
      try {
        const parsed: Employee[] = JSON.parse(saved);
        const filtered = parsed.filter(
          (e) => !['sarah.jenkins@dayflow.corp', 'alex.chen@dayflow.corp', 'marcus.vance@dayflow.corp', 'elena.rostova@dayflow.corp', 'priya.sharma@dayflow.corp', 'david.kim@dayflow.corp'].includes(e.email.toLowerCase())
        );
        if (filtered.length > 0) {
          if (!filtered.some(e => e.email.toLowerCase() === 'sarveshv6413@gmail.com')) {
            filtered.unshift(INITIAL_EMPLOYEES[0]);
          }
          return filtered;
        }
      } catch {
        // ignore
      }
    }
    return INITIAL_EMPLOYEES;
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (!saved || saved === 'LOGGED_OUT' || saved === 'null' || ['emp-1', 'emp-2', 'emp-3', 'emp-4', 'emp-5', 'emp-6'].includes(saved)) return null;
    return null;
  });

  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    const savedUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (!savedUserId || savedUserId === 'LOGGED_OUT' || savedUserId === 'null') return null;
    return null;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    return saved ? JSON.parse(saved) : generateInitialAttendance();
  });

  const [attendanceDbLogs, setAttendanceDbLogs] = useState<AttendanceDbLog[]>([]);

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LEAVES);
    return saved ? JSON.parse(saved) : INITIAL_LEAVE_REQUESTS;
  });

  const [payslips, setPayslips] = useState<Payslip[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PAYSLIPS);
    return saved ? JSON.parse(saved) : INITIAL_PAYSLIPS;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const getInitialTab = () => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/admin') return 'admin';
      if (path === '/employees') return 'employees';
      if (path === '/attendance') return 'attendance';
      if (path === '/leaves') return 'leaves';
      if (path === '/payroll') return 'payroll';
      if (path === '/analytics') return 'analytics';
    }
    return 'dashboard';
  };

  const [activeTab, setActiveTabState] = useState<string>(getInitialTab);

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      const targetPath = tab === 'dashboard' ? '/' : `/${tab}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ tab }, '', targetPath);
      }
    }
  };

  // Sync browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (path === '/admin') setActiveTabState('admin');
        else if (path === '/employees') setActiveTabState('employees');
        else if (path === '/attendance') setActiveTabState('attendance');
        else if (path === '/leaves') setActiveTabState('leaves');
        else if (path === '/payroll') setActiveTabState('payroll');
        else if (path === '/analytics') setActiveTabState('analytics');
        else setActiveTabState('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [selectedEmployeeForModal, setSelectedEmployeeForModal] = useState<Employee | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [loginAuditLogs, setLoginAuditLogs] = useState<LoginAuditLog[]>([]);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [celebrationData, setCelebrationData] = useState<CelebrationPopupData | null>(null);

  const openNotificationDrawer = useCallback(() => setIsNotificationOpen(true), []);
  const closeNotificationDrawer = useCallback(() => setIsNotificationOpen(false), []);
  const triggerCelebration = useCallback((data: CelebrationPopupData) => {
    setCelebrationData({ ...data, id: data.id || `cel-${Date.now()}-${Math.random().toString(36).substring(2, 6)}` });
  }, []);
  const closeCelebration = useCallback(() => setCelebrationData(null), []);

  // Active check-in state
  const [checkInState, setCheckInState] = useState<CheckInState>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CHECK_IN_STATE);
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      isCheckedIn: true,
      isOnBreak: false,
      checkInTimestamp: '08:45 AM',
      breakStartTimestamp: null,
      accumulatedWorkedSeconds: 0,
      accumulatedBreakSeconds: 0,
      lastUpdatedAt: Date.now(),
    };
  });

  // Current active user
  const currentUser = currentUserId ? (employees.find((e) => e.id === currentUserId) || null) : null;
  const currentRole: UserRole = currentUser?.role || 'admin';
  const isAuthenticated = !!currentUser;

  // Check Database connection on mount & fetch sync users
  useEffect(() => {
    const syncDatabaseState = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setIsDbConnected(data.db === 'connected');
        }

        // Fetch verified employees from DB
        const empRes = await fetch('/api/employees');
        if (empRes.ok) {
          const empData = await empRes.json();
          if (empData.employees && Array.isArray(empData.employees) && empData.employees.length > 0) {
            setEmployees(empData.employees);
          }
        }

        const leaveRes = await fetch('/api/leaves');
        if (leaveRes.ok) {
          const leaveData = await leaveRes.json();
          if (Array.isArray(leaveData.leaves) && leaveData.leaves.length > 0) {
            setLeaveRequests((current) => leaveData.leaves.map((leave: any) => {
              const employee = employees.find((item) => item.employeeId === leave.employee_id);
              return {
                id: leave.id,
                employeeId: leave.employee_id,
                employeeName: leave.employee_name,
                employeeAvatar: employee?.avatar || '',
                department: leave.department,
                leaveType: leave.leave_type,
                startDate: leave.start_date,
                endDate: leave.end_date,
                totalDays: Number(leave.total_days),
                isHalfDay: Boolean(leave.is_half_day),
                reason: leave.reason || '',
                status: leave.status,
                appliedAt: leave.applied_at,
                reviewedBy: leave.reviewed_by,
                reviewedAt: leave.reviewed_at,
                adminComments: leave.admin_comments,
              } as LeaveRequest;
            }).map((leave) => ({
              ...leave,
              employeeAvatar: leave.employeeAvatar || current.find((item) => item.employeeId === leave.employeeId)?.employeeAvatar || '',
            })));
          }
        }
      } catch (err) {
        console.warn('API sync error:', err);
      }
    };
    syncDatabaseState();
    refreshAuditLogs();
    refreshAttendanceLogs();
  }, []);

  const refreshAttendanceLogs = async () => {
    try {
      const res = await fetch('/api/attendance/logs');
      if (res.ok) {
        const data = await res.json();
        if (data.logs && Array.isArray(data.logs)) {
          setAttendanceDbLogs(data.logs);
        }
      }
    } catch (err) {
      console.warn('Error fetching attendance logs:', err);
    }
  };

  const refreshAuditLogs = async () => {
    try {
      const res = await fetch('/api/auth/logs');
      if (res.ok) {
        const data = await res.json();
        if (data.logs && Array.isArray(data.logs)) {
          const formatted: LoginAuditLog[] = data.logs.map((row: any) => ({
            id: row.id,
            userId: row.user_id,
            email: row.email,
            role: row.role,
            status: row.status,
            ipAddress: row.ip_address,
            userAgent: row.user_agent,
            timestamp: row.timestamp,
          }));
          setLoginAuditLogs(formatted);
        }
      }
    } catch (err) {
      console.warn('Error fetching login logs:', err);
    }
  };

  // Persistence effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (sessionToken) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, sessionToken);
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    }
  }, [sessionToken]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(leaveRequests));
  }, [leaveRequests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYSLIPS, JSON.stringify(payslips));
  }, [payslips]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHECK_IN_STATE, JSON.stringify(checkInState));
  }, [checkInState]);

  // Keep work and break time separate so lunch/rest periods never count as work.
  useEffect(() => {
    if (!checkInState.isCheckedIn) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setCheckInState((prev) => {
        if (!prev.isCheckedIn) return prev;
        const elapsedSeconds = Math.max(0, Math.floor((now - (prev.lastUpdatedAt || now)) / 1000));
        if (elapsedSeconds === 0) return prev;
        if (prev.isOnBreak) {
          return {
            ...prev,
            accumulatedBreakSeconds: prev.accumulatedBreakSeconds + elapsedSeconds,
            lastUpdatedAt: now,
          };
        } else {
          return {
            ...prev,
            accumulatedWorkedSeconds: prev.accumulatedWorkedSeconds + elapsedSeconds,
            lastUpdatedAt: now,
          };
        }
      });

      const today = getLocalDateKey();
      const activeWorkedHours = checkInState.accumulatedWorkedSeconds / 3600;
      setAttendanceRecords((prev) => prev.map((record) => (
        record.employeeId === currentUser?.employeeId && record.date === today
          ? {
              ...record,
              totalHoursWorked: activeWorkedHours,
              breakMinutes: Math.round(checkInState.accumulatedBreakSeconds / 60),
            }
          : record
      )));
    }, 1000);
    return () => clearInterval(interval);
  }, [checkInState.isCheckedIn, checkInState.isOnBreak, checkInState.accumulatedWorkedSeconds, checkInState.accumulatedBreakSeconds, checkInState.lastUpdatedAt, currentUser?.employeeId]);

  // Toast Helpers
  const addToast = (type: ToastMessage['type'], title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Switch User (Persona Switcher)
  const switchUser = (employeeId: string) => {
    const emp = employees.find((e) => e.id === employeeId || e.employeeId === employeeId);
    if (emp) {
      setCurrentUserId(emp.id);
      setSessionToken(`sess-${Date.now()}`);
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
      addToast('info', 'Active Persona Switched', `Logged in as ${emp.firstName} ${emp.lastName} (${emp.role.toUpperCase()})`);
      
      // Also log switch event to DB
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emp.email, role: emp.role }),
      }).then(() => refreshAuditLogs()).catch(() => {});
    }
  };

  const switchRole = (role: UserRole) => {
    const target = employees.find((e) => e.role === role);
    if (target) {
      setCurrentUserId(target.id);
      setSessionToken(`sess-${Date.now()}`);
      addToast('info', `Switched to ${role === 'admin' ? 'Admin / HR Officer' : 'Employee'} Role`, `Active profile: ${target.firstName} ${target.lastName}`);
    }
  };

  const openAuthModal = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    // If user is already authenticated, allow closing
    if (currentUser) {
      setIsAuthModalOpen(false);
    } else {
      // Must be logged in
      addToast('warning', 'Authentication Required', 'Please sign in or select a demo preset account to access Dayflow HRMS.');
    }
  };

  const openAuditDrawer = () => {
    refreshAuditLogs();
    setIsAuditDrawerOpen(true);
  };

  const closeAuditDrawer = () => {
    setIsAuditDrawerOpen(false);
  };

  // Sign In with Supabase backend authentication
  const signIn = async (email: string, role: UserRole, password?: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, role }),
      });

      const data = await res.json();
      await refreshAuditLogs();

      if (res.ok && data.success && data.user) {
        setEmployees((prev) => {
          const exists = prev.some((e) => e.id === data.user.id);
          if (exists) {
            return prev.map((e) => (e.id === data.user.id ? { ...e, ...data.user } : e));
          }
          return [data.user, ...prev];
        });
        setCurrentUserId(data.user.id);
        setSessionToken(data.token || `sess-${Date.now()}`);
        localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
        setIsAuthModalOpen(false);
        addToast('success', 'Verified & Signed In', `Authenticated with Supabase DB as ${data.user.firstName} ${data.user.lastName}`);
        return true;
      } else {
        const errorMsg = data.error || 'Account not found in the database. Please check your email or register a new account.';
        addToast('error', 'Authentication Failed', errorMsg);
        return false;
      }
    } catch (err) {
      console.warn('Network sign in error:', err);
      addToast('error', 'Authentication Failed', 'Account could not be verified in the database.');
      return false;
    }
  };

  // Sign Up with Supabase backend
  const signUp = async (payload: {
    employeeId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    department: Department;
    password?: string;
  }): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      await refreshAuditLogs();

      if (res.ok && data.success) {
        if (data.user) {
          setEmployees((prev) => {
            const exists = prev.some((e) => e.id === data.user.id || e.email.toLowerCase() === String(data.user.email).toLowerCase());
            return exists
              ? prev.map((e) => (e.id === data.user.id || e.email.toLowerCase() === String(data.user.email).toLowerCase() ? { ...e, ...data.user } : e))
              : [data.user, ...prev];
          });
          setCurrentUserId(data.user.id);
        } else {
          // Fallback create
          const newEmpId = `emp-${Date.now()}`;
          const newEmp: Employee = {
            id: newEmpId,
            employeeId: payload.employeeId.toUpperCase(),
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
            phone: '+1 (555) 000-1122',
            avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
            role: payload.role,
            jobDetails: {
              designation: payload.role === 'admin' ? 'HR Specialist' : 'Associate Specialist',
              department: payload.department,
              dateOfJoining: new Date().toISOString().split('T')[0],
              employmentType: 'Full-Time',
              workLocation: 'Hybrid',
              managerName: 'Sarah Jenkins',
              managerId: 'EMP-1001',
            },
            personalDetails: {
              dob: '1998-05-15',
              gender: 'Prefer not to say',
              address: '123 Enterprise Blvd',
              city: 'San Francisco, CA',
              country: 'United States',
              emergencyContactName: 'Family Contact',
              emergencyContactPhone: '+1 (555) 999-8877',
              emergencyContactRelation: 'Guardian',
              nationality: 'American',
            },
            salaryStructure: {
              basicSalary: 6000,
              hra: 2400,
              conveyanceAllowance: 400,
              medicalAllowance: 400,
              specialAllowance: 1000,
              providentFund: 720,
              professionalTax: 200,
              incomeTax: 1080,
              currency: 'USD',
            },
            leaveBalance: {
              paidLeave: { total: 18, used: 0, remaining: 18 },
              sickLeave: { total: 10, used: 0, remaining: 10 },
              casualLeave: { total: 6, used: 0, remaining: 6 },
              unpaidLeave: { used: 0 },
            },
            documents: [],
            status: 'Active',
            bankDetails: {
              bankName: 'Dayflow Federal Credit Union',
              accountNumberMasked: '•••• •••• •••• 1092',
              ifscOrRouting: 'DFCU0001',
              panOrTaxId: 'US-TAX-NEW',
            },
          };
          setEmployees((prev) => [newEmp, ...prev]);
          setCurrentUserId(newEmpId);
        }

        setSessionToken(data.token || `sess-${Date.now()}`);
        localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
        setIsAuthModalOpen(false);
        triggerCelebration({
          type: 'general',
          title: 'Account Registered & Verified!',
          subtitle: `Welcome to Dayflow HRMS, ${payload.firstName}! Your workspace has been configured.`,
          badge: 'Registration Complete',
          details: [
            { label: 'Name', value: `${payload.firstName} ${payload.lastName}` },
            { label: 'Role Assigned', value: payload.role === 'admin' ? 'Administrator' : 'Employee' },
            { label: 'Department', value: payload.department || 'Engineering' },
            { label: 'Work Email', value: payload.email },
          ],
          employeeName: `${payload.firstName} ${payload.lastName}`,
        });
        addToast('success', 'Account Stored in Database', `Welcome to Dayflow HRMS, ${payload.firstName}!`);
        return true;
      } else {
        const detail = [data.error, data.code, data.details, data.hint].filter(Boolean).join(' | ');
        addToast('error', 'Registration Failed', detail || 'Could not register user.');
        return false;
      }
    } catch (err) {
      console.error('Signup error:', err);
      addToast('error', 'Sign Up Error', 'Could not complete registration.');
      return false;
    }
  };

  // Sign Out function
  const signOut = async (reason?: string) => {
    const userToLog = currentUser;
    const tokenToClear = sessionToken;

    // Send logout audit log to backend DB
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenToClear,
          userId: userToLog?.id,
          email: userToLog?.email,
          role: userToLog?.role,
          reason: reason || 'USER_LOGOUT',
        }),
      });
      await refreshAuditLogs();
    } catch (err) {
      console.warn('Logout API error:', err);
    }

    // Clear active session, user, and last activity timestamp
    setCurrentUserId(null);
    setSessionToken(null);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);

    // Prompt user to sign in again
    setAuthModalMode('signin');
    setIsAuthModalOpen(true);
    
    if (reason === 'INACTIVITY_TIMEOUT') {
      addToast('warning', 'Session Expired', 'You have been automatically signed out after 30 minutes of inactivity for security.');
    } else {
      addToast('info', 'Successfully Signed Out', 'Session terminated. Database audit log recorded.');
    }
  };

  // Security: Automatic Sign Out after 30 minutes of inactivity
  useEffect(() => {
    if (!isAuthenticated || !currentUserId) return;

    const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
    const CHECK_INTERVAL_MS = 10 * 1000; // Check every 10 seconds

    // Ensure last activity is initialized
    const saved = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
    if (!saved) {
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
    }

    let lastUpdate = Date.now();
    const handleUserActivity = () => {
      const now = Date.now();
      // Throttle updating storage to at most once every 2 seconds
      if (now - lastUpdate > 2000) {
        lastUpdate = now;
        localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, now.toString());
      }
    };

    // User interaction events that reset the activity timer
    const activityEvents: (keyof WindowEventMap)[] = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click'
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleUserActivity, { passive: true });
    });

    // Periodic check for inactivity expiration
    const intervalId = setInterval(() => {
      const storedLastActivity = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
      const lastActivityTime = storedLastActivity ? parseInt(storedLastActivity, 10) : lastUpdate;
      const elapsed = Date.now() - lastActivityTime;

      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        signOut('INACTIVITY_TIMEOUT');
      }
    }, CHECK_INTERVAL_MS);

    // Also check on tab visibility regain (e.g. user returns after being away)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const storedLastActivity = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
        const lastActivityTime = storedLastActivity ? parseInt(storedLastActivity, 10) : lastUpdate;
        if (Date.now() - lastActivityTime >= INACTIVITY_TIMEOUT_MS) {
          signOut('INACTIVITY_TIMEOUT');
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleUserActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [isAuthenticated, currentUserId]);

  // Attendance Actions
  const checkIn = () => {
    if (!currentUser) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const todayStr = getLocalDateKey(now);

    setCheckInState({
      isCheckedIn: true,
      isOnBreak: false,
      checkInTimestamp: timeStr,
      breakStartTimestamp: null,
      accumulatedWorkedSeconds: 0,
      accumulatedBreakSeconds: 0,
      lastUpdatedAt: Date.now(),
    });

    setAttendanceRecords((prev) => {
      const existingIndex = prev.findIndex((r) => r.employeeId === currentUser.employeeId && r.date === todayStr);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          checkInTime: timeStr,
          status: 'present',
        };
        return updated;
      } else {
        return [
          {
            id: `att-${currentUser.employeeId}-${todayStr}`,
            employeeId: currentUser.employeeId,
            date: todayStr,
            checkInTime: timeStr,
            checkOutTime: null,
            totalHoursWorked: 0,
            breakMinutes: 0,
            status: 'present',
          },
          ...prev,
        ];
      }
    });

    // Write real-time attendance telemetry to Supabase DB
    fetch('/api/attendance/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: currentUser.employeeId,
        employeeName: `${currentUser.firstName} ${currentUser.lastName}`,
        email: currentUser.email,
        date: todayStr,
        actionType: 'CHECK_IN',
        checkInTime: timeStr,
        status: 'present',
      }),
    }).then(() => refreshAttendanceLogs()).catch(() => {});

    addToast('success', 'Checked In Successfully', `Good day, ${currentUser.firstName}! Punch recorded at ${timeStr}`);
  };

  const checkOut = () => {
    if (!currentUser) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const todayStr = getLocalDateKey(now);
    const hoursWorked = checkInState.accumulatedWorkedSeconds / 3600;
    const breakMins = Math.round(checkInState.accumulatedBreakSeconds / 60);

    setCheckInState((prev) => ({
      ...prev,
      isCheckedIn: false,
      isOnBreak: false,
      lastUpdatedAt: Date.now(),
    }));

    setAttendanceRecords((prev) => {
      const existingIndex = prev.findIndex((r) => r.employeeId === currentUser.employeeId && r.date === todayStr);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          checkOutTime: timeStr,
          totalHoursWorked: hoursWorked,
          breakMinutes: breakMins,
        };
        return updated;
      }
      return prev;
    });

    // Write punch out telemetry to Supabase DB
    fetch('/api/attendance/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: currentUser.employeeId,
        employeeName: `${currentUser.firstName} ${currentUser.lastName}`,
        email: currentUser.email,
        date: todayStr,
        actionType: 'CHECK_OUT',
        checkInTime: checkInState.checkInTimestamp,
        checkOutTime: timeStr,
        totalHoursWorked: Math.max(hoursWorked, 0.1),
        breakMinutes: breakMins,
        status: 'present',
      }),
    }).then(() => refreshAttendanceLogs()).catch(() => {});

    addToast('info', 'Checked Out Successfully', `Punch out recorded at ${timeStr}. Total time: ${hoursWorked} hrs`);
  };

  const toggleBreak = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const todayStr = now.toISOString().split('T')[0];
    const nextBreak = !checkInState.isOnBreak;
    
    setCheckInState((prev) => {
      if (nextBreak) {
        addToast('info', 'Break Started', `Enjoy your break! Started at ${timeStr}`);
        return {
          ...prev,
          isOnBreak: true,
          breakStartTimestamp: timeStr,
          lastUpdatedAt: Date.now(),
        };
      } else {
        addToast('success', 'Back from Break', `Welcome back! Resumed work at ${timeStr}`);
        return {
          ...prev,
          isOnBreak: false,
          breakStartTimestamp: null,
          lastUpdatedAt: Date.now(),
        };
      }
    });

    // Write break telemetry to Supabase DB
    if (currentUser) {
      fetch('/api/attendance/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: currentUser.employeeId,
          employeeName: `${currentUser.firstName} ${currentUser.lastName}`,
          email: currentUser.email,
          date: todayStr,
          actionType: nextBreak ? 'BREAK_START' : 'BREAK_END',
          checkInTime: checkInState.checkInTimestamp,
          breakMinutes: Math.round(checkInState.accumulatedBreakSeconds / 60),
          status: nextBreak ? 'on_break' : 'present',
        }),
      }).then(() => refreshAttendanceLogs()).catch(() => {});
    }
  };

  const markAttendanceManual = (record: AttendanceRecord) => {
    const regularizer = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'HR Administrator';
    setAttendanceRecords((prev) => {
      const idx = prev.findIndex((r) => r.id === record.id || (r.employeeId === record.employeeId && r.date === record.date));
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...record, isManual: true, regularizedBy: regularizer };
        return updated;
      }
      return [{ ...record, isManual: true, regularizedBy: regularizer }, ...prev];
    });

    // Send manual regularization to Supabase DB
    fetch('/api/attendance/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: `att-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        employeeId: record.employeeId,
        employeeName: employees.find((employee) => employee.employeeId === record.employeeId)?.firstName
          ? `${employees.find((employee) => employee.employeeId === record.employeeId)?.firstName} ${employees.find((employee) => employee.employeeId === record.employeeId)?.lastName}`
          : undefined,
        email: employees.find((employee) => employee.employeeId === record.employeeId)?.email,
        date: record.date,
        actionType: 'MANUAL_PUNCH',
        checkInTime: record.checkInTime,
        checkOutTime: record.checkOutTime,
        totalHoursWorked: record.totalHoursWorked,
        breakMinutes: record.breakMinutes,
        status: record.status,
      }),
    }).then(() => refreshAttendanceLogs()).catch(() => {});

    // Notify employee of attendance regularization
    const attNotif: NotificationItem = {
      id: `notif-att-${Date.now()}`,
      title: 'Attendance Regularization',
      message: `Your punch record for ${record.date} was regularized by ${regularizer}.`,
      timestamp: 'Just now',
      isRead: false,
      type: 'attendance',
      targetRole: 'employee',
      targetEmployeeId: record.employeeId,
      linkTab: 'attendance',
    };
    setNotifications((prev) => [attNotif, ...prev]);

    addToast('success', 'Attendance Record Updated', `Successfully regularized attendance for ${record.employeeId} on ${record.date}`);
  };

  // Leave Actions
  const applyLeave = (data: {
    leaveType: LeaveRequest['leaveType'];
    startDate: string;
    endDate: string;
    totalDays: number;
    isHalfDay: boolean;
    reason: string;
  }) => {
    if (!currentUser) return;
    const newLeave: LeaveRequest = {
      id: `leave-${Date.now()}`,
      employeeId: currentUser.employeeId,
      employeeName: `${currentUser.firstName} ${currentUser.lastName}`,
      employeeAvatar: currentUser.avatar,
      department: currentUser.jobDetails.department,
      leaveType: data.leaveType,
      startDate: data.startDate,
      endDate: data.endDate,
      totalDays: data.totalDays,
      isHalfDay: data.isHalfDay,
      reason: data.reason,
      status: 'Pending',
      appliedAt: new Date().toISOString(),
    };

    setLeaveRequests((prev) => [newLeave, ...prev]);

    // Persist the request and add a corresponding attendance audit event.
    fetch('/api/leaves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLeave),
    }).catch((error) => console.warn('Leave request sync error:', error));

    fetch('/api/attendance/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: `att-leave-${newLeave.id}`,
        employeeId: newLeave.employeeId,
        employeeName: newLeave.employeeName,
        email: currentUser.email,
        date: newLeave.startDate,
        actionType: 'LEAVE_REQUEST',
        totalHoursWorked: 0,
        breakMinutes: 0,
        status: 'leave_pending',
      }),
    }).catch((error) => console.warn('Leave attendance log sync error:', error));

    // Create notification for Admin / HR
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'New Leave Request',
      message: `${currentUser.firstName} ${currentUser.lastName} applied for ${data.totalDays} day(s) ${data.leaveType} leave.`,
      timestamp: 'Just now',
      isRead: false,
      type: 'leave',
      targetRole: 'admin',
      linkTab: 'leaves',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    triggerCelebration({
      type: 'leave_applied',
      title: 'Leave Application Submitted!',
      subtitle: `Your ${data.leaveType} leave request has been submitted to HR for approval.`,
      badge: 'Application Sent',
      details: [
        { label: 'Leave Category', value: `${data.leaveType} Leave` },
        { label: 'Duration', value: `${data.totalDays} day${data.totalDays > 1 ? 's' : ''}${data.isHalfDay ? ' (Half Day)' : ''}` },
        { label: 'Start Date', value: data.startDate },
        { label: 'End Date', value: data.endDate },
      ],
      employeeName: `${currentUser.firstName} ${currentUser.lastName}`,
      employeeAvatar: currentUser.avatar,
    });

    addToast('success', 'Leave Request Submitted', `Your ${data.leaveType} leave request for ${data.totalDays} day(s) has been sent to HR for approval.`);
  };

  const reviewLeave = (leaveId: string, status: 'Approved' | 'Rejected', comments?: string) => {
    const targetLeave = leaveRequests.find((l) => l.id === leaveId);
    if (!targetLeave) return;
    const reviewer = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'HR Director';

    setLeaveRequests((prev) =>
      prev.map((l) => {
        if (l.id === leaveId) {
          return {
            ...l,
            status,
            reviewedBy: reviewer,
            reviewedAt: new Date().toISOString(),
            adminComments: comments || (status === 'Approved' ? 'Leave approved by HR.' : 'Request could not be accommodated at this time.'),
          };
        }
        return l;
      })
    );

    fetch(`/api/leaves/${encodeURIComponent(leaveId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        reviewedBy: reviewer,
        reviewedAt: new Date().toISOString(),
        adminComments: comments,
      }),
    }).catch((error) => console.warn('Leave review sync error:', error));

    // If approved, update the employee's leave balance & attendance calendar
    if (status === 'Approved') {
      setEmployees((prev) =>
        prev.map((emp) => {
          if (emp.employeeId === targetLeave.employeeId) {
            const currentBal = { ...emp.leaveBalance };
            if (targetLeave.leaveType === 'Paid') {
              currentBal.paidLeave.used += targetLeave.totalDays;
              currentBal.paidLeave.remaining = Math.max(0, currentBal.paidLeave.total - currentBal.paidLeave.used);
            } else if (targetLeave.leaveType === 'Sick') {
              currentBal.sickLeave.used += targetLeave.totalDays;
              currentBal.sickLeave.remaining = Math.max(0, currentBal.sickLeave.total - currentBal.sickLeave.used);
            } else if (targetLeave.leaveType === 'Casual') {
              currentBal.casualLeave.used += targetLeave.totalDays;
              currentBal.casualLeave.remaining = Math.max(0, currentBal.casualLeave.total - currentBal.casualLeave.used);
            } else if (targetLeave.leaveType === 'Unpaid') {
              currentBal.unpaidLeave.used += targetLeave.totalDays;
            }
            return { ...emp, leaveBalance: currentBal };
          }
          return emp;
        })
      );

      // Create attendance leave records for start to end date
      const start = new Date(targetLeave.startDate);
      const end = new Date(targetLeave.endDate);
      const cur = new Date(start);
      const newAttendanceUpdates: AttendanceRecord[] = [];

      while (cur <= end) {
        const dateString = cur.toISOString().split('T')[0];
        const day = cur.getDay();
        if (day !== 0 && day !== 6) {
          newAttendanceUpdates.push({
            id: `att-${targetLeave.employeeId}-${dateString}`,
            employeeId: targetLeave.employeeId,
            date: dateString,
            checkInTime: null,
            checkOutTime: null,
            totalHoursWorked: 0,
            breakMinutes: 0,
            status: 'leave',
            notes: `Approved ${targetLeave.leaveType} Leave`,
          });
        }
        cur.setDate(cur.getDate() + 1);
      }

      setAttendanceRecords((prev) => {
        const filtered = prev.filter((r) => !newAttendanceUpdates.some((u) => u.employeeId === r.employeeId && u.date === r.date));
        return [...newAttendanceUpdates, ...filtered];
      });
    } else if (status === 'Rejected' && targetLeave.status === 'Approved') {
      setEmployees((prev) => prev.map((emp) => {
        if (emp.employeeId !== targetLeave.employeeId) return emp;
        const leaveBalance = { ...emp.leaveBalance };
        if (targetLeave.leaveType === 'Paid') {
          leaveBalance.paidLeave.used = Math.max(0, leaveBalance.paidLeave.used - targetLeave.totalDays);
          leaveBalance.paidLeave.remaining = leaveBalance.paidLeave.total - leaveBalance.paidLeave.used;
        } else if (targetLeave.leaveType === 'Sick') {
          leaveBalance.sickLeave.used = Math.max(0, leaveBalance.sickLeave.used - targetLeave.totalDays);
          leaveBalance.sickLeave.remaining = leaveBalance.sickLeave.total - leaveBalance.sickLeave.used;
        } else if (targetLeave.leaveType === 'Casual') {
          leaveBalance.casualLeave.used = Math.max(0, leaveBalance.casualLeave.used - targetLeave.totalDays);
          leaveBalance.casualLeave.remaining = leaveBalance.casualLeave.total - leaveBalance.casualLeave.used;
        } else if (targetLeave.leaveType === 'Unpaid') {
          leaveBalance.unpaidLeave.used = Math.max(0, leaveBalance.unpaidLeave.used - targetLeave.totalDays);
        }
        return { ...emp, leaveBalance };
      }));
      setAttendanceRecords((prev) => prev.filter((record) => (
        !(record.employeeId === targetLeave.employeeId && record.status === 'leave' && record.notes?.startsWith('Approved '))
      )));
    }

    // Send notification to employee
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: `Leave Request ${status}`,
      message: `Your ${targetLeave.leaveType} leave request (${targetLeave.startDate} to ${targetLeave.endDate}) was ${status.toLowerCase()} by ${reviewer}.`,
      timestamp: 'Just now',
      isRead: false,
      type: 'leave',
      targetRole: 'employee',
      targetEmployeeId: targetLeave.employeeId,
      linkTab: 'leaves',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    if (status === 'Approved') {
      triggerCelebration({
        type: 'leave_approved',
        title: 'Leave Approved Successfully!',
        subtitle: `Approved ${targetLeave.totalDays} day(s) of ${targetLeave.leaveType} leave for ${targetLeave.employeeName}.`,
        badge: 'HR Verified & Approved',
        details: [
          { label: 'Employee', value: targetLeave.employeeName },
          { label: 'Leave Category', value: `${targetLeave.leaveType} Leave` },
          { label: 'Total Duration', value: `${targetLeave.totalDays} day${targetLeave.totalDays > 1 ? 's' : ''}` },
          { label: 'Calendar Updated', value: `${targetLeave.startDate} → ${targetLeave.endDate}` },
        ],
        employeeName: targetLeave.employeeName,
        employeeAvatar: targetLeave.employeeAvatar,
      });
    }

    addToast(
      status === 'Approved' ? 'success' : 'info',
      `Leave Request ${status}`,
      `Request for ${targetLeave.employeeName} has been ${status.toLowerCase()}.`
    );
  };

  const updateLeaveRequest = (leaveId: string, updates: Pick<LeaveRequest, 'leaveType' | 'startDate' | 'endDate' | 'totalDays' | 'isHalfDay' | 'reason'>) => {
    setLeaveRequests((prev) => prev.map((leave) => leave.id === leaveId ? { ...leave, ...updates } : leave));
    fetch(`/api/leaves/${encodeURIComponent(leaveId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch((error) => console.warn('Leave edit sync error:', error));
    addToast('success', 'Leave Request Updated', 'The leave request was updated from Attendance.');
  };

  // Employee Profile Management
  const openEmployeeProfile = (employee: Employee) => {
    setSelectedEmployeeForModal(employee);
    setIsProfileModalOpen(true);
  };

  const closeEmployeeProfile = () => {
    setIsProfileModalOpen(false);
    setSelectedEmployeeForModal(null);
  };

  const updateEmployee = (updated: Employee) => {
    setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    if (selectedEmployeeForModal?.id === updated.id) {
      setSelectedEmployeeForModal(updated);
    }

    // Persist to Supabase database
    fetch(`/api/employees/${updated.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch((err) => console.warn('Supabase profile update sync error:', err));

    addToast('success', 'Profile Updated & Synced', `Changes to ${updated.firstName} ${updated.lastName}'s profile saved in Supabase.`);
  };

  const addNewEmployee = async (newEmployeeData: Omit<Employee, 'id'>, initialPassword?: string) => {
    const newId = `emp-${Date.now()}`;
    const completeEmp: Employee = {
      ...newEmployeeData,
      id: newId,
    };
    setEmployees((prev) => [completeEmp, ...prev]);

    // Also persist user credentials and full details to backend / Supabase
    try {
      await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: completeEmp.id,
          employeeId: completeEmp.employeeId,
          email: completeEmp.email,
          firstName: completeEmp.firstName,
          lastName: completeEmp.lastName,
          role: completeEmp.role,
          department: completeEmp.jobDetails.department,
          password: initialPassword || 'EmployeePass2026!',
          phone: completeEmp.phone,
          avatar: completeEmp.avatar,
          status: completeEmp.status,
          jobDetails: completeEmp.jobDetails,
          personalDetails: completeEmp.personalDetails,
          salaryStructure: completeEmp.salaryStructure,
          leaveBalance: completeEmp.leaveBalance,
          bankDetails: completeEmp.bankDetails,
          documents: completeEmp.documents,
        }),
      });
    } catch (err) {
      console.warn('Backend sync failed:', err);
    }

    triggerCelebration({
      type: 'employee_onboarded',
      title: 'Employee Onboarded & Provisioned!',
      subtitle: `${completeEmp.firstName} ${completeEmp.lastName} has been added and assigned credentials.`,
      badge: 'Account Created',
      details: [
        { label: 'Employee ID', value: completeEmp.employeeId },
        { label: 'Department', value: completeEmp.jobDetails.department },
        { label: 'Role Access', value: completeEmp.role === 'admin' ? 'Administrator' : 'Employee' },
        { label: 'Work Email', value: completeEmp.email },
      ],
      employeeName: `${completeEmp.firstName} ${completeEmp.lastName}`,
      employeeAvatar: completeEmp.avatar,
    });

    addToast('success', 'User Provisioned & Onboarded', `${completeEmp.firstName} ${completeEmp.lastName} (${completeEmp.employeeId}) has been created with login access.`);
  };

  const updateSalaryStructure = (employeeId: string, structure: SalaryStructure) => {
    let targetEmp: Employee | undefined;
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.employeeId === employeeId || emp.id === employeeId) {
          targetEmp = { ...emp, salaryStructure: structure };
          return targetEmp;
        }
        return emp;
      })
    );

    if (targetEmp) {
      fetch(`/api/employees/${(targetEmp as Employee).id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salaryStructure: structure }),
      }).catch((err) => console.warn('Supabase salary update sync error:', err));
    }

    addToast('success', 'Salary Structure Updated', `Compensation package updated and synced for ${employeeId}.`);
  };

  const terminateEmployee = async (employeeId: string, reason?: string, notes?: string): Promise<boolean> => {
    const target = employees.find((e) => e.id === employeeId || e.employeeId === employeeId);
    if (!target) {
      addToast('error', 'Employee Not Found', `Could not find employee with ID: ${employeeId}`);
      return false;
    }

    const terminationReason = reason || 'Employment terminated by HR Administration';

    // Update in React State
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id === target.id || emp.employeeId === target.employeeId) {
          return { ...emp, status: 'Terminated' };
        }
        return emp;
      })
    );

    if (selectedEmployeeForModal?.id === target.id || selectedEmployeeForModal?.employeeId === target.employeeId) {
      setSelectedEmployeeForModal((prev) => (prev ? { ...prev, status: 'Terminated' } : null));
    }

    // Call Supabase Database API
    try {
      await fetch(`/api/employees/${target.id}/terminate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: terminationReason,
          notes,
          severedBy: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'HR Administrator',
          terminationDate: new Date().toISOString().split('T')[0],
        }),
      });
    } catch (err) {
      console.warn('Termination API sync notice:', err);
    }

    // Refresh audit telemetry in drawer
    refreshAuditLogs().catch(() => {});

    // Notification
    const notif: NotificationItem = {
      id: `notif-term-${Date.now()}`,
      title: 'Employee Terminated',
      message: `${target.firstName} ${target.lastName} (${target.employeeId}) has been marked as Terminated in the database. Reason: ${terminationReason}`,
      timestamp: 'Just now',
      isRead: false,
      type: 'system',
      targetRole: 'admin',
      linkTab: 'employees',
    };
    setNotifications((prev) => [notif, ...prev]);

    addToast('error', 'Employee Terminated', `${target.firstName} ${target.lastName} (${target.employeeId}) is now Terminated. Database updated.`);
    return true;
  };

  const rehireEmployee = async (employeeId: string): Promise<boolean> => {
    const target = employees.find((e) => e.id === employeeId || e.employeeId === employeeId);
    if (!target) return false;

    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id === target.id || emp.employeeId === target.employeeId) {
          return { ...emp, status: 'Active' };
        }
        return emp;
      })
    );

    if (selectedEmployeeForModal?.id === target.id || selectedEmployeeForModal?.employeeId === target.employeeId) {
      setSelectedEmployeeForModal((prev) => (prev ? { ...prev, status: 'Active' } : null));
    }

    try {
      await fetch(`/api/employees/${target.id}/rehire`, {
        method: 'POST',
      });
    } catch (err) {
      console.warn('Rehire API sync error:', err);
    }

    refreshAuditLogs().catch(() => {});
    addToast('success', 'Employee Reactivated', `${target.firstName} ${target.lastName} status restored to Active in Supabase.`);
    return true;
  };

  const deleteEmployee = async (employeeId: string): Promise<boolean> => {
    const target = employees.find((e) => e.id === employeeId || e.employeeId === employeeId);
    if (!target) return false;

    setEmployees((prev) => prev.filter((e) => e.id !== target.id && e.employeeId !== target.employeeId));
    if (selectedEmployeeForModal?.id === target.id || selectedEmployeeForModal?.employeeId === target.employeeId) {
      closeEmployeeProfile();
    }

    try {
      await fetch(`/api/employees/${target.id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Delete API sync error:', err);
    }

    addToast('info', 'Record Removed', `${target.firstName} ${target.lastName} deleted from database.`);
    return true;
  };

  const generateMonthlyPayroll = (month: string, year: number) => {
    const newSlips: Payslip[] = employees.map((emp) => {
      const base = emp.salaryStructure.basicSalary;
      const hra = emp.salaryStructure.hra;
      const allowances = emp.salaryStructure.conveyanceAllowance + emp.salaryStructure.medicalAllowance + emp.salaryStructure.specialAllowance;
      const gross = base + hra + allowances;
      const pf = emp.salaryStructure.providentFund;
      const tax = emp.salaryStructure.incomeTax;
      const profTax = emp.salaryStructure.professionalTax;
      const totalDeductions = pf + tax + profTax;
      const netPay = gross - totalDeductions;

      return {
        id: `slip-${year}-${month.toLowerCase()}-${emp.employeeId}`,
        employeeId: emp.employeeId,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        designation: emp.jobDetails.designation,
        department: emp.jobDetails.department,
        month,
        year,
        paymentDate: `${year}-${month === 'August' ? '08' : '09'}-30`,
        basicSalary: base,
        hra,
        allowances,
        grossEarnings: gross,
        pfDeduction: pf,
        taxDeduction: tax,
        otherDeductions: profTax,
        totalDeductions,
        netPay,
        status: 'Paid',
        bankAccountMasked: emp.bankDetails.accountNumberMasked,
        panNumber: emp.bankDetails.panOrTaxId,
        workedDays: 22,
        lopDays: 0,
      };
    });

    setPayslips((prev) => {
      const filtered = prev.filter((p) => !(p.month === month && p.year === year));
      return [...newSlips, ...filtered];
    });

    const notif: NotificationItem = {
      id: `notif-admin-pay-${Date.now()}`,
      title: `${month} ${year} Payroll Executed`,
      message: `Salary distribution slips generated and credited for ${employees.length} employees.`,
      timestamp: 'Just now',
      isRead: false,
      type: 'payroll',
      targetRole: 'admin',
      linkTab: 'payroll',
    };

    // Send individual notifications to each employee for their specific salary payslip
    const employeePayslipNotifs: NotificationItem[] = newSlips.map((slip) => ({
      id: `notif-slip-${slip.employeeId}-${Date.now()}`,
      title: `${month} ${year} Payslip Disbursed`,
      message: `Your ${month} ${year} salary statement is ready. Net Pay: $${slip.netPay.toLocaleString()} credited.`,
      timestamp: 'Just now',
      isRead: false,
      type: 'payroll',
      targetRole: 'employee',
      targetEmployeeId: slip.employeeId,
      linkTab: 'payroll',
    }));

    setNotifications((prev) => [notif, ...employeePayslipNotifs, ...prev]);

    triggerCelebration({
      type: 'payroll_disbursed',
      title: `${month} ${year} Payroll Executed!`,
      subtitle: `Successfully processed salary statements and bank disbursements for all ${employees.length} employees.`,
      badge: 'Payroll Disbursed',
      details: [
        { label: 'Billing Period', value: `${month} ${year}` },
        { label: 'Employees Paid', value: `${employees.length} Staff` },
        { label: 'Total Payslips', value: `${newSlips.length} Statements` },
        { label: 'Disbursement Status', value: 'Direct Deposit Sent' },
      ],
    });
    addToast('success', 'Payroll Batch Processed', `Generated ${newSlips.length} payslips for ${month} ${year}.`);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    addToast('info', 'Notifications', 'All notifications marked as read.');
  };

  const resetDemoData = () => {
    setEmployees(INITIAL_EMPLOYEES);
    setCurrentUserId('emp-sarvesh');
    setAttendanceRecords(generateInitialAttendance());
    setLeaveRequests(INITIAL_LEAVE_REQUESTS);
    setPayslips(INITIAL_PAYSLIPS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setCheckInState({
      isCheckedIn: true,
      isOnBreak: false,
      checkInTimestamp: '08:45 AM',
      breakStartTimestamp: null,
      accumulatedWorkedSeconds: 0,
      accumulatedBreakSeconds: 0,
    });
    localStorage.clear();
    addToast('info', 'Demo Reset', 'Application state has been restored to default Sarvesh V scenario.');
  };

  const unreadNotificationCount = notifications.filter((n) => {
    if (n.isRead) return false;
    if (!currentUser) return false;
    if (currentRole === 'admin') return true;
    return n.targetEmployeeId === currentUser.employeeId;
  }).length;

  return (
    <HRContext.Provider
      value={{
        currentUser,
        currentRole,
        isAuthenticated,
        theme,
        toggleTheme,
        setTheme,
        employees,
        attendanceRecords,
        attendanceDbLogs,
        leaveRequests,
        payslips,
        notifications,
        unreadNotificationCount,
        activeTab,
        checkInState,
        toasts,
        selectedEmployeeForModal,
        isProfileModalOpen,
        isAuthModalOpen,
        authModalMode,
        isDbConnected,
        loginAuditLogs,
        isAuditDrawerOpen,
        isNotificationOpen,
        celebrationData,
        triggerCelebration,
        closeCelebration,
        setIsNotificationOpen,
        openNotificationDrawer,
        closeNotificationDrawer,
        setActiveTab,
        switchUser,
        switchRole,
        openAuthModal,
        closeAuthModal,
        signIn,
        signUp,
        signOut,
        openAuditDrawer,
        closeAuditDrawer,
        refreshAuditLogs,
        refreshAttendanceLogs,
        checkIn,
        checkOut,
        toggleBreak,
        markAttendanceManual,
        applyLeave,
        updateLeaveRequest,
        reviewLeave,
        openEmployeeProfile,
        closeEmployeeProfile,
        updateEmployee,
        addNewEmployee,
        updateSalaryStructure,
        terminateEmployee,
        rehireEmployee,
        deleteEmployee,
        generateMonthlyPayroll,
        markNotificationRead,
        markAllNotificationsRead,
        addToast,
        removeToast,
        resetDemoData,
      }}
    >
      {children}
    </HRContext.Provider>
  );
};

export const useHR = () => {
  const context = useContext(HRContext);
  if (!context) {
    throw new Error('useHR must be used within an HRProvider');
  }
  return context;
};

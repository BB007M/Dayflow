import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Employee, 
  UserRole, 
  AttendanceRecord, 
  LeaveRequest, 
  Payslip, 
  NotificationItem, 
  CheckInState, 
  SalaryStructure,
  Department,
  LeaveBalance,
  LeaveType
} from '../types';

import { LoginAuditLog } from '../types/auth';
import confetti from 'canvas-confetti';

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
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
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
  isDarkMode: boolean;
  isNotificationOpen: boolean;
  setIsNotificationOpen: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Actions
  toggleDarkMode: () => void;
  setDarkMode: (enabled: boolean) => void;
  setActiveTab: (tab: string) => void;
  openAuthModal: (mode?: 'signin' | 'signup') => void;
  closeAuthModal: () => void;
  signIn: (email: string, role: UserRole, password?: string) => Promise<boolean>;
  signUp: (payload: {
    email: string;
    firstName: string;
    lastName: string;
    department: Department;
    role?: UserRole;
    password?: string;
  }) => Promise<boolean>;
  signOut: () => Promise<void>;
  openAuditDrawer: () => void;
  closeAuditDrawer: () => void;
  refreshAuditLogs: () => Promise<void>;

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
  reviewLeave: (leaveId: string, status: 'Approved' | 'Rejected', comments?: string) => void;
  
  // Employees & Profile
  openEmployeeProfile: (employee: Employee) => void;
  closeEmployeeProfile: () => void;
  updateEmployee: (updated: Employee) => void;
  addNewEmployee: (newEmployee: Omit<Employee, 'id'>) => void;
  updateSalaryStructure: (employeeId: string, structure: SalaryStructure) => void;
  
  // Payroll
  generateMonthlyPayroll: (month: string, year: number) => void;
  
  // Notifications & UI
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addToast: (type: ToastMessage['type'], title: string, message?: string) => void;
  removeToast: (id: string) => void;
}

const HRContext = createContext<HRContextType | undefined>(undefined);


const getFallbackAvatar = (firstName: string, lastName: string) => {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`
    .toUpperCase()
    .slice(0, 2);

  const safeInitials = initials || 'U';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#7e22ce"/>
          <stop offset="100%" stop-color="#4338ca"/>
        </linearGradient>
      </defs>
      <rect width="256" height="256" rx="48" fill="url(#g)"/>
      <text x="50%" y="53%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="92" font-weight="700" fill="#ffffff">${safeInitials}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};


// Base annual leave allocation per employee. Actual `used` / `remaining`
// figures are always derived from real leave requests (see
// computeLeaveBalance) instead of being hand-maintained, so balances can
// never drift out of sync with what has actually been applied for/approved.
const BASE_LEAVE_ALLOCATION = {
  paidLeave: 18,
  sickLeave: 10,
  casualLeave: 6,
};

// Leave types that draw down a capped balance. 'Unpaid' and
// 'Maternity/Paternity' are intentionally excluded — they are not capped by
// the standard annual quota.
const CAPPED_LEAVE_BALANCE_KEY: Partial<Record<LeaveType, keyof typeof BASE_LEAVE_ALLOCATION>> = {
  Paid: 'paidLeave',
  Sick: 'sickLeave',
  Casual: 'casualLeave',
};

// Recompute an employee's leave balance from their actual leave requests.
// - `used` reflects only Approved leave (days actually taken).
// - `remaining` also subtracts Pending requests, so an employee can't apply
//   for more leave than they actually have left while other requests of
//   theirs are still awaiting a decision.
const computeLeaveBalance = (employeeId: string, requests: LeaveRequest[]): LeaveBalance => {
  const approved: Record<'paidLeave' | 'sickLeave' | 'casualLeave', number> = {
    paidLeave: 0,
    sickLeave: 0,
    casualLeave: 0,
  };
  const pending: Record<'paidLeave' | 'sickLeave' | 'casualLeave', number> = {
    paidLeave: 0,
    sickLeave: 0,
    casualLeave: 0,
  };
  let approvedUnpaid = 0;

  for (const req of requests) {
    if (req.employeeId !== employeeId) continue;
    if (req.status === 'Rejected') continue;

    const balanceKey = CAPPED_LEAVE_BALANCE_KEY[req.leaveType];
    if (balanceKey) {
      if (req.status === 'Approved') approved[balanceKey] += req.totalDays;
      else pending[balanceKey] += req.totalDays;
    } else if (req.leaveType === 'Unpaid' && req.status === 'Approved') {
      approvedUnpaid += req.totalDays;
    }
  }

  const makeBucket = (key: 'paidLeave' | 'sickLeave' | 'casualLeave') => {
    const total = BASE_LEAVE_ALLOCATION[key];
    const used = approved[key];
    const remaining = Math.max(0, total - approved[key] - pending[key]);
    return { total, used, remaining };
  };

  return {
    paidLeave: makeBucket('paidLeave'),
    sickLeave: makeBucket('sickLeave'),
    casualLeave: makeBucket('casualLeave'),
    unpaidLeave: { used: approvedUnpaid },
  };
};

const STORAGE_KEYS = {
  ATTENDANCE: 'dayflow_hrms_attendance_v2',
  LEAVES: 'dayflow_hrms_leaves_v2',
  PAYSLIPS: 'dayflow_hrms_payslips_v2',
  NOTIFICATIONS: 'dayflow_hrms_notifications_v2',
  CHECK_IN_STATE: 'dayflow_hrms_checkin_state_v2',
  THEME_MODE: 'dayflow_hrms_theme_mode_v2',
};

export const HRProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme Dark/Light Mode state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME_MODE);
    if (saved !== null) {
      return saved === 'dark';
    }
    return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // State Initialization
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  const [payslips, setPayslips] = useState<Payslip[]>([]);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [selectedEmployeeForModal, setSelectedEmployeeForModal] = useState<Employee | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [loginAuditLogs, setLoginAuditLogs] = useState<LoginAuditLog[]>([]);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Active check-in state
  const [checkInState, setCheckInState] = useState<CheckInState>({
    isCheckedIn: false,
    isOnBreak: false,
    checkInTimestamp: null,
    breakStartTimestamp: null,
    accumulatedWorkedSeconds: 0,
    accumulatedBreakSeconds: 0,
  });

  // Keep every employee's leaveBalance in sync with reality. Whenever leave
  // requests change (a new application, an approval, a rejection), recompute
  // used/remaining from the actual request history rather than leaving the
  // balance frozen at its initial hardcoded values.
  useEffect(() => {
    setEmployees((prev) => {
      if (prev.length === 0) return prev;
      let changed = false;
      const next = prev.map((e) => {
        const recomputed = computeLeaveBalance(e.employeeId, leaveRequests);
        if (
          recomputed.paidLeave.remaining === e.leaveBalance.paidLeave.remaining &&
          recomputed.paidLeave.used === e.leaveBalance.paidLeave.used &&
          recomputed.sickLeave.remaining === e.leaveBalance.sickLeave.remaining &&
          recomputed.sickLeave.used === e.leaveBalance.sickLeave.used &&
          recomputed.casualLeave.remaining === e.leaveBalance.casualLeave.remaining &&
          recomputed.casualLeave.used === e.leaveBalance.casualLeave.used &&
          recomputed.unpaidLeave.used === e.leaveBalance.unpaidLeave.used
        ) {
          return e;
        }
        changed = true;
        return { ...e, leaveBalance: recomputed };
      });
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaveRequests]);

  const currentUser = currentUserId
    ? (employees.find((e) => e.id === currentUserId) || null)
    : null;

  const currentRole: UserRole = currentUser?.role || 'employee';
  const isAuthenticated = !!currentUser;

  const loadCurrentUser = async (authUserId: string) => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single();

  if (error || !data) {
    console.error('Employee profile not found:', error);
    setCurrentUserId(null);
    return;
  }

  const employee: Employee = {
    id: data.id,
    employeeId: data.employee_code,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    phone: data.phone || '',
    avatar: data.avatar_url || getFallbackAvatar(data.first_name, data.last_name),
    role: data.role as UserRole,

    jobDetails: {
      designation: data.designation,
      department: data.department,
      dateOfJoining: data.date_of_joining || '',
      employmentType: 'Full-Time',
      workLocation: 'Hybrid',
      managerName: '',
      managerId: '',
    },

    personalDetails: {
      dob: data.date_of_birth || '',
      gender: 'Prefer not to say',
      address: data.address || '',
      city: data.city || '',
      country: data.country || '',
      emergencyContactName: data.emergency_contact_name || '',
      emergencyContactPhone: data.emergency_contact_phone || '',
      emergencyContactRelation: '',
      nationality: '',
    },

    salaryStructure: {
      basicSalary: Number(data.basic_salary || 0),
      hra: Number(data.hra || 0),
      conveyanceAllowance: 0,
      medicalAllowance: 0,
      specialAllowance: Number(data.allowances || 0),
      providentFund: 0,
      professionalTax: 0,
      incomeTax: 0,
      currency: 'USD',
    },

    leaveBalance: {
      paidLeave: { total: 18, used: 0, remaining: 18 },
      sickLeave: { total: 10, used: 0, remaining: 10 },
      casualLeave: { total: 6, used: 0, remaining: 6 },
      unpaidLeave: { used: 0 },
    },

    documents: [],
    status: data.status,
    bankDetails: {
      bankName: data.bank_name || '',
      accountNumberMasked: data.bank_account_number || '',
      ifscOrRouting: data.bank_ifsc || '',
      panOrTaxId: data.pan_number || '',
    },
  };

  setEmployees((prev) => {
    const exists = prev.some((e) => e.id === employee.id);

    if (exists) {
      return prev.map((e) =>
        e.id === employee.id ? employee : e
      );
    }

    return [employee, ...prev];
  });

  setCurrentUserId(employee.id);
};

  const loadEmployees = async (): Promise<Employee[]> => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to load employees:', error);
    addToast('error', 'Database Error', 'Could not load employees from Supabase.');
    return [];
  }

  const mappedEmployees: Employee[] = data.map((employee) => ({
    id: employee.id,
    employeeId: employee.employee_code,
    firstName: employee.first_name,
    lastName: employee.last_name,
    email: employee.email,
    phone: employee.phone || '',
    avatar: employee.avatar_url || getFallbackAvatar(employee.first_name, employee.last_name),
    role: employee.role as UserRole,

    jobDetails: {
      designation: employee.designation,
      department: employee.department as Department,
      dateOfJoining: employee.date_of_joining || '',
      employmentType: 'Full-Time',
      workLocation: 'Hybrid',
      managerName: '',
      managerId: '',
    },

    personalDetails: {
      dob: employee.date_of_birth || '',
      gender: 'Prefer not to say',
      address: employee.address || '',
      city: employee.city || '',
      country: employee.country || '',
      emergencyContactName: employee.emergency_contact_name || '',
      emergencyContactPhone: employee.emergency_contact_phone || '',
      emergencyContactRelation: '',
      nationality: '',
    },

    salaryStructure: {
      basicSalary: Number(employee.basic_salary || 0),
      hra: Number(employee.hra || 0),
      conveyanceAllowance: 0,
      medicalAllowance: 0,
      specialAllowance: Number(employee.allowances || 0),
      providentFund: 0,
      professionalTax: 0,
      incomeTax: 0,
      currency: 'USD',
    },

    leaveBalance: {
      paidLeave: { total: 18, used: 0, remaining: 18 },
      sickLeave: { total: 10, used: 0, remaining: 10 },
      casualLeave: { total: 6, used: 0, remaining: 6 },
      unpaidLeave: { used: 0 },
    },

    documents: [],
    status: employee.status as Employee['status'],

    bankDetails: {
      bankName: employee.bank_name || '',
      accountNumberMasked: employee.bank_account_number || '',
      ifscOrRouting: employee.bank_ifsc || '',
      panOrTaxId: employee.pan_number || '',
    },
  }));

  setEmployees(mappedEmployees);
  return mappedEmployees;
};

  const loadOperationalData = async (employeeRows: Employee[]) => {
    try {
      const employeeById = new Map(employeeRows.map((e) => [e.id, e]));
      const employeeByCode = new Map(employeeRows.map((e) => [e.employeeId, e]));

      const [attendanceRes, leaveRes, payslipRes, notificationRes] = await Promise.all([
        supabase.from('attendance').select('*').order('attendance_date', { ascending: false }),
        supabase.from('leave_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('payslips').select('*').order('year', { ascending: false }).order('month', { ascending: false }),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }),
      ]);

      if (attendanceRes.error) console.error('Attendance load error:', attendanceRes.error);
      if (leaveRes.error) console.error('Leave load error:', leaveRes.error);
      if (payslipRes.error) console.error('Payslip load error:', payslipRes.error);
      if (notificationRes.error) console.error('Notification load error:', notificationRes.error);

      const attendanceRows = attendanceRes.data || [];
      const attendance: AttendanceRecord[] = attendanceRows.map((row: any) => ({
        id: row.id,
        employeeId: employeeById.get(row.employee_id)?.employeeId || row.employee_id,
        date: row.attendance_date,
        checkInTime: row.check_in ? new Date(row.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
        checkOutTime: row.check_out ? new Date(row.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
        totalHoursWorked: Number(row.total_hours || 0),
        breakMinutes: Number(row.break_minutes || 0),
        status: ({
          Present: 'present', Absent: 'absent', Late: 'present', 'Half Day': 'half-day', 'On Leave': 'leave', Holiday: 'holiday'
        } as Record<string, AttendanceRecord['status']>)[row.status] || 'present',
        notes: row.notes || undefined,
        isManual: !!row.is_manual,
        regularizedBy: employeeById.get(row.regularized_by)?.firstName || undefined,
      }));
      setAttendanceRecords(attendance);

      const leaveRows = leaveRes.data || [];
      const leaves: LeaveRequest[] = leaveRows.map((row: any) => {
        const emp = employeeById.get(row.employee_id);
        const reviewer = row.reviewed_by ? employeeById.get(row.reviewed_by) : undefined;
        return {
          id: row.id,
          employeeId: emp?.employeeId || row.employee_id,
          employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Employee',
          employeeAvatar: emp?.avatar || getFallbackAvatar(emp?.firstName || 'E', emp?.lastName || ''),
          department: (emp?.jobDetails.department || 'Engineering') as Department,
          leaveType: row.leave_type,
          startDate: row.start_date,
          endDate: row.end_date,
          totalDays: Number(row.total_days || 0),
          isHalfDay: !!row.is_half_day,
          reason: row.reason || '',
          status: row.status,
          appliedAt: row.created_at,
          reviewedBy: reviewer ? `${reviewer.firstName} ${reviewer.lastName}` : undefined,
          reviewedAt: row.reviewed_at || undefined,
          adminComments: row.admin_comments || undefined,
        };
      });
      setLeaveRequests(leaves);

      const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const payslipRows = payslipRes.data || [];
      const slips: Payslip[] = payslipRows.map((row: any) => {
        const emp = employeeById.get(row.employee_id);
        return {
          id: row.id,
          employeeId: emp?.employeeId || row.employee_id,
          employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Employee',
          designation: emp?.jobDetails.designation || 'Employee',
          department: (emp?.jobDetails.department || 'Engineering') as Department,
          month: monthNames[(row.month || 1) - 1] || String(row.month),
          year: Number(row.year),
          paymentDate: row.payment_date || '',
          basicSalary: Number(row.basic_salary || 0),
          hra: Number(row.hra || 0),
          allowances: Number(row.allowances || 0),
          grossEarnings: Number(row.gross_salary || 0),
          pfDeduction: Number(row.pf_deduction || 0),
          taxDeduction: Number(row.tax_deduction || 0),
          otherDeductions: Number(row.other_deductions || 0),
          totalDeductions: Number(row.total_deductions || 0),
          netPay: Number(row.net_salary || 0),
          status: row.status,
          bankAccountMasked: emp?.bankDetails.accountNumberMasked || '',
          panNumber: emp?.bankDetails.panOrTaxId || '',
          workedDays: Number(row.worked_days || 0),
          lopDays: Number(row.lop_days || 0),
        };
      });
      setPayslips(slips);

      const notificationRows = notificationRes.data || [];
      const notifs: NotificationItem[] = notificationRows.map((row: any) => ({
        id: row.id,
        title: row.title,
        message: row.message,
        timestamp: row.created_at,
        isRead: !!row.is_read,
        type: row.type,
        targetRole: row.target_role || (row.employee_id ? 'employee' : 'all'),
        targetEmployeeId: row.employee_id ? employeeById.get(row.employee_id)?.employeeId : undefined,
        linkTab: row.link_tab || undefined,
      }));
      setNotifications(notifs);
    } catch (error) {
      console.error('Failed to load operational data:', error);
    }
  };

  useEffect(() => {
  const initializeAuth = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Supabase session error:', error);
        setIsDbConnected(false);
        return;
      }

      setIsDbConnected(true);
      localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
      localStorage.removeItem(STORAGE_KEYS.LEAVES);
      localStorage.removeItem(STORAGE_KEYS.PAYSLIPS);
      localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
      localStorage.removeItem(STORAGE_KEYS.CHECK_IN_STATE);

      const loadedEmployees = await loadEmployees();

      if (data.session?.user) {
        await loadOperationalData(loadedEmployees);
        await loadCurrentUser(data.session.user.id);
      } else {
        setAttendanceRecords([]);
        setLeaveRequests([]);
        setPayslips([]);
        setNotifications([]);
      }

    } catch (error) {
      console.error('Supabase initialization error:', error);
      setIsDbConnected(false);
    }
  };

  initializeAuth();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      const loadedEmployees = await loadEmployees();
      await loadOperationalData(loadedEmployees);
      await loadCurrentUser(session.user.id);
    } else {
      setCurrentUserId(null);
      setAttendanceRecords([]);
      setLeaveRequests([]);
      setPayslips([]);
      setNotifications([]);
      setCheckInState({ isCheckedIn: false, isOnBreak: false, checkInTimestamp: null, breakStartTimestamp: null, accumulatedWorkedSeconds: 0, accumulatedBreakSeconds: 0 });
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}, []);

  const refreshAuditLogs = async () => {
  const { data, error } = await supabase
    .from('login_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching login logs:', error);
    return;
  }

  const formatted: LoginAuditLog[] = data.map((row) => ({
    id: row.id,
    userId: row.employee_id || '',
    email: row.email,
    role: 'employee',
    status: row.success ? 'SUCCESS' : 'FAILED',
    ipAddress: row.ip_address || '',
    userAgent: row.user_agent || '',
    timestamp: row.created_at,
  }));

  setLoginAuditLogs(formatted);
};

  // Sync Dark/Light Mode with HTML document class & localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
      localStorage.setItem(STORAGE_KEYS.THEME_MODE, 'dark');
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
      localStorage.setItem(STORAGE_KEYS.THEME_MODE, 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
  const next = !isDarkMode;

  setIsDarkMode(next);

  addToast(
    'info',
    next
      ? '🌙 Dark Mode Activated'
      : '☀️ Light Mode Activated',
    `Theme switched to ${
      next ? 'Dark' : 'Light'
    } appearance.`
  );
};

  const setDarkMode = (enabled: boolean) => {
    setIsDarkMode(enabled);
  };

  // Real-time second counter for active check-in
  useEffect(() => {
    if (!checkInState.isCheckedIn) return;
    const interval = setInterval(() => {
      setCheckInState((prev) => {
        if (!prev.isCheckedIn) return prev;
        if (prev.isOnBreak) {
          return { ...prev, accumulatedBreakSeconds: prev.accumulatedBreakSeconds + 1 };
        } else {
          return { ...prev, accumulatedWorkedSeconds: prev.accumulatedWorkedSeconds + 1 };
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [checkInState.isCheckedIn, checkInState.isOnBreak]);

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
      addToast(
  'warning',
  'Authentication Required',
  'Please sign in or create an account to access Dayflow HRMS.'
);
    }
  };

  const openAuditDrawer = () => {
    refreshAuditLogs();
    setIsAuditDrawerOpen(true);
  };

  const closeAuditDrawer = () => {
    setIsAuditDrawerOpen(false);
  };

  const signIn = async (
    email: string,
    _role: UserRole,
    password?: string
  ): Promise<boolean> => {
    try {
      if (!password) {
        addToast(
          'error',
          'Authentication Failed',
          'Password is required.'
        );
        return false;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.user) {
        console.error('Supabase sign in error:', error);

        addToast(
          'error',
          'Authentication Failed',
          error?.message || 'Invalid email or password.'
        );

        return false;
      }

      await loadCurrentUser(data.user.id);

      setIsAuthModalOpen(false);

      addToast(
        'success',
        'Signed In Successfully',
        'Welcome back to Dayflow HRMS.'
      );

      return true;

    } catch (error) {
      console.error('Sign in error:', error);

      addToast(
        'error',
        'Authentication Failed',
        'Unable to connect to Supabase.'
      );

      return false;
    }
  };

  const signUp = async (payload: {
    email: string;
    firstName: string;
    lastName: string;
    department: Department;
    role?: UserRole;
    password?: string;
  }): Promise<boolean> => {
    try {
      if (!payload.password) {
        addToast(
          'error',
          'Registration Failed',
          'Password is required.'
        );
        return false;
      }

      const email = payload.email.trim().toLowerCase();

      const { data, error } = await supabase.auth.signUp({
        email,
        password: payload.password,
        options: {
          data: {
            first_name: payload.firstName.trim(),
            last_name: payload.lastName.trim(),
            department: payload.department,
          },
        },
      });

      if (error) {
        console.error('Supabase signup error:', error);

        addToast(
          'error',
          'Sign Up Error',
          error.message
        );

        return false;
      }

      if (!data.user) {
        addToast(
          'error',
          'Sign Up Error',
          'Supabase did not return a user after signup.'
        );

        return false;
      }

      /*
       * The database trigger is responsible for:
       * 1. Generating a unique employee ID.
       * 2. Assigning admin when the email local-part ends in ".admin".
       * 3. Creating the employees row.
       *
       * Do not generate employee_code or trust role from the browser.
       */

      addToast(
        'success',
        'Account Created',
        `Welcome to Dayflow HRMS, ${payload.firstName}!`
      );

      setAuthModalMode('signin');

      return true;
    } catch (error: unknown) {
      console.error('Signup exception:', error);

      const message =
        error instanceof Error
          ? error.message
          : 'Unknown registration error.';

      addToast(
        'error',
        'Sign Up Error',
        message
      );

      return false;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Supabase sign out error:', error);

      addToast(
        'error',
        'Sign Out Failed',
        'Unable to terminate the current session.'
      );

      return;
    }

    setCurrentUserId(null);
    setIsAuthModalOpen(true);
    setAuthModalMode('signin');

    addToast(
      'info',
      'Successfully Signed Out',
      'Your Supabase session has been terminated.'
    );
  };
  // Attendance Actions
  const checkIn = async () => {
    if (!currentUser) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const todayStr = now.toISOString().split('T')[0];

    const employeeRow = employees.find((e) => e.id === currentUser.id);
    if (!employeeRow) return;

    const { error } = await supabase.from('attendance').upsert({
      employee_id: employeeRow.id,
      attendance_date: todayStr,
      check_in: now.toISOString(),
      check_out: null,
      total_hours: 0,
      break_minutes: 0,
      status: 'Present',
    }, { onConflict: 'employee_id,attendance_date' });

    if (error) {
      console.error('Check-in database error:', error);
      addToast('error', 'Check In Failed', error.message);
      return;
    }

    setCheckInState({
      isCheckedIn: true,
      isOnBreak: false,
      checkInTimestamp: timeStr,
      breakStartTimestamp: null,
      accumulatedWorkedSeconds: 0,
      accumulatedBreakSeconds: 0,
    });

    const localRecord: AttendanceRecord = {
      id: `att-${currentUser.employeeId}-${todayStr}`,
      employeeId: currentUser.employeeId,
      date: todayStr,
      checkInTime: timeStr,
      checkOutTime: null,
      totalHoursWorked: 0,
      breakMinutes: 0,
      status: 'present',
    };

    setAttendanceRecords((prev) => [
      localRecord,
      ...prev.filter((r) => !(r.employeeId === currentUser.employeeId && r.date === todayStr)),
    ]);

    addToast('success', 'Checked In Successfully', `Good day, ${currentUser.firstName}! Punch recorded at ${timeStr}`);
  };

  const checkOut = async () => {
    if (!currentUser) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const todayStr = now.toISOString().split('T')[0];
    const hoursWorked = parseFloat((checkInState.accumulatedWorkedSeconds / 3600).toFixed(2));
    const breakMins = Math.round(checkInState.accumulatedBreakSeconds / 60);

    const employeeRow = employees.find((e) => e.id === currentUser.id);
    if (!employeeRow) return;

    const { error } = await supabase.from('attendance')
      .update({
        check_out: now.toISOString(),
        total_hours: Math.max(hoursWorked, 0),
        break_minutes: breakMins,
      })
      .eq('employee_id', employeeRow.id)
      .eq('attendance_date', todayStr);

    if (error) {
      console.error('Check-out database error:', error);
      addToast('error', 'Check Out Failed', error.message);
      return;
    }

    setCheckInState({
      isCheckedIn: false,
      isOnBreak: false,
      checkInTimestamp: null,
      breakStartTimestamp: null,
      accumulatedWorkedSeconds: Math.max(hoursWorked * 3600, 0),
      accumulatedBreakSeconds: breakMins * 60,
    });

    setAttendanceRecords((prev) => prev.map((r) =>
      r.employeeId === currentUser.employeeId && r.date === todayStr
        ? { ...r, checkOutTime: timeStr, totalHoursWorked: Math.max(hoursWorked, 0), breakMinutes: breakMins }
        : r
    ));

    addToast('info', 'Checked Out Successfully', `Punch out recorded at ${timeStr}. Total time: ${Math.max(hoursWorked, 0)} hrs`);
  };

  const toggleBreak = () => {
    if (!checkInState.isCheckedIn) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const nextBreak = !checkInState.isOnBreak;

    setCheckInState((prev) => ({
      ...prev,
      isOnBreak: nextBreak,
      breakStartTimestamp: nextBreak ? timeStr : null,
    }));

    addToast(
      nextBreak ? 'info' : 'success',
      nextBreak ? 'Break Started' : 'Back from Break',
      nextBreak ? `Enjoy your break! Started at ${timeStr}` : `Welcome back! Resumed work at ${timeStr}`
    );
  };

  const markAttendanceManual = async (record: AttendanceRecord) => {
    const employeeRow = employees.find((e) => e.employeeId === record.employeeId || e.id === record.employeeId);
    if (!employeeRow) {
      addToast('error', 'Attendance Update Failed', 'Employee record could not be found.');
      return;
    }

    const { error } = await supabase.from('attendance').upsert({
      employee_id: employeeRow.id,
      attendance_date: record.date,
      check_in: record.checkInTime ? new Date(`${record.date} ${record.checkInTime}`).toISOString() : null,
      check_out: record.checkOutTime ? new Date(`${record.date} ${record.checkOutTime}`).toISOString() : null,
      total_hours: record.totalHoursWorked,
      break_minutes: record.breakMinutes,
      status: ({ present: 'Present', absent: 'Absent', 'half-day': 'Half Day', leave: 'On Leave', weekend: 'Holiday', holiday: 'Holiday' } as Record<string, string>)[record.status] || 'Present',
      notes: record.notes || null,
      is_manual: true,
    }, { onConflict: 'employee_id,attendance_date' });

    if (error) {
      console.error('Manual attendance error:', error);
      addToast('error', 'Attendance Update Failed', error.message);
      return;
    }

    const regularizer = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'HR Administrator';
    const updated = { ...record, isManual: true, regularizedBy: regularizer };
    setAttendanceRecords((prev) => [updated, ...prev.filter((r) => !(r.employeeId === record.employeeId && r.date === record.date))]);
    addToast('success', 'Attendance Record Updated', `Successfully regularized attendance for ${record.employeeId} on ${record.date}`);
  };

  // Leave Actions
  const applyLeave = async (data: {
    leaveType: LeaveRequest['leaveType'];
    startDate: string;
    endDate: string;
    totalDays: number;
    isHalfDay: boolean;
    reason: string;
  }) => {
    if (!currentUser) {
      addToast(
        'error',
        'Leave Request Failed',
        'You must be signed in to apply for leave.'
      );
      return;
    }

    if (!data.reason.trim()) {
      addToast(
        'error',
        'Reason Required',
        'Please provide a reason for your leave request.'
      );
      return;
    }

    if (data.totalDays <= 0) {
      addToast(
        'error',
        'Invalid Leave Duration',
        'The selected date range does not contain any working days.'
      );
      return;
    }

    const employeeRow = employees.find((e) => e.id === currentUser.id);
    if (!employeeRow) return;

    // Enforce leave balance: for capped leave types (Paid/Sick/Casual), the
    // requested duration cannot exceed what the employee actually has left,
    // accounting for both leave already approved and leave still pending
    // review. This is what prevents e.g. applying for 3 days when only 2
    // remain, or applying at all once the balance has hit 0.
    const balanceKey = CAPPED_LEAVE_BALANCE_KEY[data.leaveType];
    if (balanceKey) {
      const liveBalance = computeLeaveBalance(employeeRow.employeeId, leaveRequests);
      const remaining = liveBalance[balanceKey].remaining;
      if (data.totalDays > remaining) {
        addToast(
          'error',
          'Insufficient Leave Balance',
          remaining <= 0
            ? `You have no ${data.leaveType} leave remaining. Try Unpaid leave instead.`
            : `You only have ${remaining} day(s) of ${data.leaveType} leave remaining, but requested ${data.totalDays}.`
        );
        return;
      }
    }

    const { data: inserted, error } = await supabase.from('leave_requests').insert({
      employee_id: employeeRow.id,
      leave_type: data.leaveType,
      start_date: data.startDate,
      end_date: data.endDate,
      total_days: data.totalDays,
      is_half_day: data.isHalfDay,
      reason: data.reason,
      status: 'Pending',
    }).select().single();

    if (error || !inserted) {
      console.error('Leave application error:', error);
      addToast('error', 'Leave Request Failed', error?.message || 'Could not submit leave request.');
      return;
    }

    const newLeave: LeaveRequest = {
      id: inserted.id,
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
      appliedAt: inserted.created_at,
    };

    setLeaveRequests((prev) => [newLeave, ...prev]);

    // Create a notification for admins. Database column employee_id is null so it is visible to all admin users via the UI filter.
    const message = `${currentUser.firstName} ${currentUser.lastName} applied for ${data.totalDays} day(s) ${data.leaveType} leave.`;
    const { data: notification } = await supabase.from('notifications').insert({
      employee_id: null,
      title: 'New Leave Request',
      message,
      type: 'leave',
      is_read: false,
      target_role: 'admin',
      link_tab: 'leaves',
    }).select().single();

    if (notification) {
      setNotifications((prev) => [{ id: notification.id, title: notification.title, message: notification.message, timestamp: notification.created_at, isRead: false, type: 'leave', targetRole: 'admin', linkTab: 'leaves' }, ...prev]);
    }

    confetti({ particleCount: 40, spread: 40, origin: { y: 0.7 } });
    addToast('success', 'Leave Request Submitted', `Your ${data.leaveType} leave request for ${data.totalDays} day(s) has been sent to HR for approval.`);
  };

  const reviewLeave = async (leaveId: string, status: 'Approved' | 'Rejected', comments?: string) => {
    const targetLeave = leaveRequests.find((l) => l.id === leaveId);
    if (!targetLeave) return;

    const reviewerRow = currentUser ? employees.find((e) => e.id === currentUser.id) : undefined;
    const reviewer = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'HR Director';

    const { error } = await supabase.from('leave_requests').update({
      status,
      reviewed_by: reviewerRow?.id || null,
      reviewed_at: new Date().toISOString(),
      admin_comments: comments || (status === 'Approved' ? 'Leave approved by HR.' : 'Request could not be accommodated at this time.'),
    }).eq('id', leaveId);

    if (error) {
      console.error('Leave review error:', error);
      addToast('error', 'Leave Update Failed', error.message);
      return;
    }

    setLeaveRequests((prev) => prev.map((l) => l.id === leaveId ? {
      ...l,
      status,
      reviewedBy: reviewer,
      reviewedAt: new Date().toISOString(),
      adminComments: comments || (status === 'Approved' ? 'Leave approved by HR.' : 'Request could not be accommodated at this time.'),
    } : l));

    if (status === 'Approved') {
      // Mark weekdays in the approved period as leave in the database.
      const empRow = employees.find((e) => e.employeeId === targetLeave.employeeId);
      if (empRow) {
        const start = new Date(targetLeave.startDate);
        const end = new Date(targetLeave.endDate);
        const rows: any[] = [];
        const cursor = new Date(start);
        while (cursor <= end) {
          const day = cursor.getDay();
          if (day !== 0 && day !== 6) {
            const dateString = cursor.toISOString().split('T')[0];
            rows.push({ employee_id: empRow.id, attendance_date: dateString, check_in: null, check_out: null, total_hours: 0, break_minutes: 0, status: 'On Leave', notes: `Approved ${targetLeave.leaveType} Leave` });
          }
          cursor.setDate(cursor.getDate() + 1);
        }
        if (rows.length) await supabase.from('attendance').upsert(rows, { onConflict: 'employee_id,attendance_date' });
      }
    }

    const employeeRow = employees.find((e) => e.employeeId === targetLeave.employeeId);
    const { data: notification } = await supabase.from('notifications').insert({
      employee_id: employeeRow?.id || null,
      title: `Leave Request ${status}`,
      message: `Your ${targetLeave.leaveType} leave request (${targetLeave.startDate} to ${targetLeave.endDate}) was ${status.toLowerCase()} by ${reviewer}.`,
      type: 'leave',
      is_read: false,
      target_role: 'employee',
      link_tab: 'leaves',
    }).select().single();

    if (notification) {
      setNotifications((prev) => [{ id: notification.id, title: notification.title, message: notification.message, timestamp: notification.created_at, isRead: false, type: 'leave', targetRole: 'employee', targetEmployeeId: targetLeave.employeeId, linkTab: 'leaves' }, ...prev]);
    }

    if (status === 'Approved') confetti({ particleCount: 50, spread: 60 });
    addToast(status === 'Approved' ? 'success' : 'info', `Leave Request ${status}`, `Request for ${targetLeave.employeeName} has been ${status.toLowerCase()}.`);
  };

  // Employee Profile Management
  const openEmployeeProfile = (employee: Employee) => {
    const normalizedEmployee: Employee = {
      ...employee,
      avatar:
        employee.avatar ||
        getFallbackAvatar(employee.firstName, employee.lastName),
    };

    setSelectedEmployeeForModal(normalizedEmployee);
    setIsProfileModalOpen(true);
  };

  const closeEmployeeProfile = () => {
    setIsProfileModalOpen(false);
    setSelectedEmployeeForModal(null);
  };

  const updateEmployee = async (updated: Employee) => {
    const { error } = await supabase.from('employees').update({
      first_name: updated.firstName, last_name: updated.lastName, email: updated.email, phone: updated.phone, avatar_url: updated.avatar,
      department: updated.jobDetails.department, designation: updated.jobDetails.designation, date_of_joining: updated.jobDetails.dateOfJoining || null,
      date_of_birth: updated.personalDetails.dob || null, address: updated.personalDetails.address, city: updated.personalDetails.city, country: updated.personalDetails.country,
      emergency_contact_name: updated.personalDetails.emergencyContactName, emergency_contact_phone: updated.personalDetails.emergencyContactPhone,
      basic_salary: updated.salaryStructure.basicSalary, hra: updated.salaryStructure.hra, allowances: updated.salaryStructure.conveyanceAllowance + updated.salaryStructure.medicalAllowance + updated.salaryStructure.specialAllowance,
      bank_name: updated.bankDetails.bankName, bank_account_number: updated.bankDetails.accountNumberMasked, bank_ifsc: updated.bankDetails.ifscOrRouting, pan_number: updated.bankDetails.panOrTaxId,
      updated_at: new Date().toISOString(),
    }).eq('id', updated.id);

    if (error) {
      console.error('Employee update error:', error);
      addToast('error', 'Profile Update Failed', error.message);
      return;
    }

    setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    if (selectedEmployeeForModal?.id === updated.id) setSelectedEmployeeForModal(updated);
    addToast('success', 'Profile Updated', `Changes to ${updated.firstName} ${updated.lastName}'s profile have been saved.`);
  };

  const addNewEmployee = async (newEmployeeData: Omit<Employee, 'id'>) => {
    const completeEmp: Employee = { ...newEmployeeData, id: crypto.randomUUID() };
    const { data, error } = await supabase.from('employees').insert({
      id: completeEmp.id, employee_code: completeEmp.employeeId, first_name: completeEmp.firstName, last_name: completeEmp.lastName, email: completeEmp.email, phone: completeEmp.phone, avatar_url: completeEmp.avatar, role: completeEmp.role, department: completeEmp.jobDetails.department, designation: completeEmp.jobDetails.designation, date_of_joining: completeEmp.jobDetails.dateOfJoining || null, status: completeEmp.status, address: completeEmp.personalDetails.address, city: completeEmp.personalDetails.city, country: completeEmp.personalDetails.country, emergency_contact_name: completeEmp.personalDetails.emergencyContactName, emergency_contact_phone: completeEmp.personalDetails.emergencyContactPhone, basic_salary: completeEmp.salaryStructure.basicSalary, hra: completeEmp.salaryStructure.hra, allowances: completeEmp.salaryStructure.conveyanceAllowance + completeEmp.salaryStructure.medicalAllowance + completeEmp.salaryStructure.specialAllowance, bank_name: completeEmp.bankDetails.bankName, bank_account_number: completeEmp.bankDetails.accountNumberMasked, bank_ifsc: completeEmp.bankDetails.ifscOrRouting, pan_number: completeEmp.bankDetails.panOrTaxId
    }).select().single();
    if (error || !data) { addToast('error', 'Employee Onboarding Failed', error?.message || 'Could not create employee.'); return; }
    setEmployees((prev) => [completeEmp, ...prev]);
    confetti({ particleCount: 70, spread: 70 });
    addToast('success', 'Employee Onboarded', `${completeEmp.firstName} ${completeEmp.lastName} (${completeEmp.employeeId}) has been added to the system.`);
  };

  const updateSalaryStructure = async (employeeId: string, structure: SalaryStructure) => {
    const emp = employees.find((e) => e.employeeId === employeeId || e.id === employeeId);
    if (!emp) return;
    const { error } = await supabase.from('employees').update({ basic_salary: structure.basicSalary, hra: structure.hra, allowances: structure.conveyanceAllowance + structure.medicalAllowance + structure.specialAllowance, updated_at: new Date().toISOString() }).eq('id', emp.id);
    if (error) { addToast('error', 'Salary Update Failed', error.message); return; }
    setEmployees((prev) => prev.map((e) => e.id === emp.id ? { ...e, salaryStructure: structure } : e));
    addToast('success', 'Salary Structure Updated', `Compensation package updated for ${employeeId}.`);
  };

  const MONTH_NAME_TO_INDEX: Record<string, number> = {
    January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
    July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
  };

  const generateMonthlyPayroll = (month: string, year: number) => {
    // Resolve the actual last day of the given month/year (handles all 12
    // months plus leap years) instead of hardcoding a fixed day for only
    // two months, which silently mis-dated every other month's payroll.
    const monthIndex = MONTH_NAME_TO_INDEX[month] ?? new Date().getMonth();
    const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate();
    const paymentDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

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
        paymentDate,
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
      id: `notif-${Date.now()}`,
      title: `${month} ${year} Payroll Executed`,
      message: `Salary distribution slips generated and credited for ${employees.length} employees.`,
      timestamp: 'Just now',
      isRead: false,
      type: 'payroll',
      targetRole: 'all',
      linkTab: 'payroll',
    };
    setNotifications((prev) => [notif, ...prev]);

    confetti({ particleCount: 70, spread: 80 });
    addToast('success', 'Payroll Batch Processed', `Generated ${newSlips.length} payslips for ${month} ${year}.`);
  };

  const markNotificationRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).not('id', 'is', null);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    addToast('info', 'Notifications', 'All notifications marked as read.');
  };

  const unreadNotificationCount = notifications.filter((n) => {
    if (n.isRead) return false;
    if (n.targetRole === 'all') return true;
    if (n.targetRole === currentRole) return true;
    if (n.targetEmployeeId && currentUser && n.targetEmployeeId === currentUser.employeeId) return true;
    return false;
  }).length;

  return (
    <HRContext.Provider
      value={{
        currentUser,
        currentRole,
        isAuthenticated,
        employees,
        attendanceRecords,
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
        isDarkMode,
        isNotificationOpen,
        setIsNotificationOpen,
        toggleDarkMode,
        setDarkMode,
        setActiveTab,
        openAuthModal,
        closeAuthModal,
        signIn,
        signUp,
        signOut,
        openAuditDrawer,
        closeAuditDrawer,
        refreshAuditLogs,
        checkIn,
        checkOut,
        toggleBreak,
        markAttendanceManual,
        applyLeave,
        reviewLeave,
        openEmployeeProfile,
        closeEmployeeProfile,
        updateEmployee,
        addNewEmployee,
        updateSalaryStructure,
        generateMonthlyPayroll,
        markNotificationRead,
        markAllNotificationsRead,
        addToast,
        removeToast,
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
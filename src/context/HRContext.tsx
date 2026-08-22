import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Employee, 
  UserRole, 
  AttendanceRecord, 
  LeaveRequest, 
  Payslip, 
  NotificationItem, 
  CheckInState, 
  SalaryStructure,
  Department
} from '../types';
import { 
  INITIAL_EMPLOYEES, 
  generateInitialAttendance, 
  INITIAL_LEAVE_REQUESTS, 
  INITIAL_PAYSLIPS, 
  INITIAL_NOTIFICATIONS 
} from '../data/initialData';
import confetti from 'canvas-confetti';

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
}

interface HRContextType {
  currentUser: Employee;
  currentRole: UserRole;
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
  
  // Actions
  setActiveTab: (tab: string) => void;
  switchUser: (employeeId: string) => void;
  switchRole: (role: UserRole) => void;
  openAuthModal: (mode?: 'signin' | 'signup') => void;
  closeAuthModal: () => void;
  signIn: (email: string, role: UserRole) => boolean;
  signUp: (payload: { employeeId: string; email: string; firstName: string; lastName: string; role: UserRole; department: Department }) => boolean;
  signOut: () => void;
  
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
  resetDemoData: () => void;
}

const HRContext = createContext<HRContextType | undefined>(undefined);

const STORAGE_KEYS = {
  EMPLOYEES: 'dayflow_hrms_employees_v1',
  ATTENDANCE: 'dayflow_hrms_attendance_v1',
  LEAVES: 'dayflow_hrms_leaves_v1',
  PAYSLIPS: 'dayflow_hrms_payslips_v1',
  NOTIFICATIONS: 'dayflow_hrms_notifications_v1',
  CURRENT_USER_ID: 'dayflow_hrms_current_user_id_v1',
  CHECK_IN_STATE: 'dayflow_hrms_checkin_state_v1',
};

export const HRProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State Initialization
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    return saved || 'emp-1'; // Default Sarah Jenkins (Admin)
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    return saved ? JSON.parse(saved) : generateInitialAttendance();
  });

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

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [selectedEmployeeForModal, setSelectedEmployeeForModal] = useState<Employee | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

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
      accumulatedWorkedSeconds: 14400, // 4 hours
      accumulatedBreakSeconds: 0,
    };
  });

  // Current active user
  const currentUser = employees.find((e) => e.id === currentUserId) || employees[0];
  const currentRole = currentUser?.role || 'admin';

  // Persistence effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
  }, [currentUserId]);

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

  // Switch User
  const switchUser = (employeeId: string) => {
    const emp = employees.find((e) => e.id === employeeId || e.employeeId === employeeId);
    if (emp) {
      setCurrentUserId(emp.id);
      addToast('info', 'Active Persona Switched', `Logged in as ${emp.firstName} ${emp.lastName} (${emp.role.toUpperCase()})`);
    }
  };

  const switchRole = (role: UserRole) => {
    const target = employees.find((e) => e.role === role);
    if (target) {
      setCurrentUserId(target.id);
      addToast('info', `Switched to ${role === 'admin' ? 'Admin / HR Officer' : 'Employee'} Role`, `Active profile: ${target.firstName} ${target.lastName}`);
    }
  };

  const openAuthModal = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const signIn = (email: string, role: UserRole) => {
    const match = employees.find((e) => e.email.toLowerCase() === email.toLowerCase());
    if (match) {
      setCurrentUserId(match.id);
      setIsAuthModalOpen(false);
      addToast('success', 'Welcome Back!', `Signed in as ${match.firstName} ${match.lastName}`);
      return true;
    } else {
      // Find someone matching the role or fallback
      const roleMatch = employees.find((e) => e.role === role);
      if (roleMatch) {
        setCurrentUserId(roleMatch.id);
        setIsAuthModalOpen(false);
        addToast('success', 'Sign In Successful', `Demo account: ${roleMatch.firstName} ${roleMatch.lastName}`);
        return true;
      }
      addToast('error', 'Account Not Found', 'Please enter a valid company email address.');
      return false;
    }
  };

  const signUp = (payload: {
    employeeId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    department: Department;
  }) => {
    const newEmpId = `emp-${Date.now()}`;
    const newEmployee: Employee = {
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
      documents: [
        { id: `doc-new-1`, name: 'Employee_Onboarding_Form.pdf', type: 'PDF', uploadDate: new Date().toISOString().split('T')[0], size: '1.1 MB', status: 'Pending' }
      ],
      status: 'Active',
      bankDetails: {
        bankName: 'Dayflow Federal Credit Union',
        accountNumberMasked: '•••• •••• •••• 1092',
        ifscOrRouting: 'DFCU0001',
        panOrTaxId: 'US-TAX-NEW',
      },
    };

    setEmployees((prev) => [newEmployee, ...prev]);
    setCurrentUserId(newEmpId);
    setIsAuthModalOpen(false);
    confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
    addToast('success', 'Account Registered Successfully', `Welcome to Dayflow HRMS, ${payload.firstName}!`);
    return true;
  };

  const signOut = () => {
    // Switch to first employee or open sign in
    addToast('info', 'Logged Out', 'You have been signed out of Dayflow HRMS.');
    openAuthModal('signin');
  };

  // Attendance Actions
  const checkIn = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const todayStr = now.toISOString().split('T')[0];

    setCheckInState({
      isCheckedIn: true,
      isOnBreak: false,
      checkInTimestamp: timeStr,
      breakStartTimestamp: null,
      accumulatedWorkedSeconds: 0,
      accumulatedBreakSeconds: 0,
    });

    // Update today's record in attendanceRecords
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
            totalHoursWorked: 0.1,
            breakMinutes: 0,
            status: 'present',
          },
          ...prev,
        ];
      }
    });

    addToast('success', 'Checked In Successfully', `Good day, ${currentUser.firstName}! Punch recorded at ${timeStr}`);
  };

  const checkOut = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const todayStr = now.toISOString().split('T')[0];
    const hoursWorked = parseFloat((checkInState.accumulatedWorkedSeconds / 3600).toFixed(2));
    const breakMins = Math.round(checkInState.accumulatedBreakSeconds / 60);

    setCheckInState((prev) => ({
      ...prev,
      isCheckedIn: false,
      isOnBreak: false,
    }));

    setAttendanceRecords((prev) => {
      const existingIndex = prev.findIndex((r) => r.employeeId === currentUser.employeeId && r.date === todayStr);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          checkOutTime: timeStr,
          totalHoursWorked: Math.max(hoursWorked, 0.1),
          breakMinutes: breakMins,
        };
        return updated;
      }
      return prev;
    });

    addToast('info', 'Checked Out Successfully', `Punch out recorded at ${timeStr}. Total time: ${hoursWorked} hrs`);
  };

  const toggleBreak = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    
    setCheckInState((prev) => {
      const nextBreak = !prev.isOnBreak;
      if (nextBreak) {
        addToast('info', 'Break Started', `Enjoy your break! Started at ${timeStr}`);
        return {
          ...prev,
          isOnBreak: true,
          breakStartTimestamp: timeStr,
        };
      } else {
        addToast('success', 'Back from Break', `Welcome back! Resumed work at ${timeStr}`);
        return {
          ...prev,
          isOnBreak: false,
          breakStartTimestamp: null,
        };
      }
    });
  };

  const markAttendanceManual = (record: AttendanceRecord) => {
    setAttendanceRecords((prev) => {
      const idx = prev.findIndex((r) => r.id === record.id || (r.employeeId === record.employeeId && r.date === record.date));
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...record, isManual: true, regularizedBy: currentUser.firstName + ' ' + currentUser.lastName };
        return updated;
      }
      return [{ ...record, isManual: true, regularizedBy: currentUser.firstName + ' ' + currentUser.lastName }, ...prev];
    });
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

    confetti({ particleCount: 40, spread: 40, origin: { y: 0.7 } });
    addToast('success', 'Leave Request Submitted', `Your ${data.leaveType} leave request for ${data.totalDays} day(s) has been sent to HR for approval.`);
  };

  const reviewLeave = (leaveId: string, status: 'Approved' | 'Rejected', comments?: string) => {
    const targetLeave = leaveRequests.find((l) => l.id === leaveId);
    if (!targetLeave) return;

    setLeaveRequests((prev) =>
      prev.map((l) => {
        if (l.id === leaveId) {
          return {
            ...l,
            status,
            reviewedBy: `${currentUser.firstName} ${currentUser.lastName}`,
            reviewedAt: new Date().toISOString(),
            adminComments: comments || (status === 'Approved' ? 'Leave approved by HR.' : 'Request could not be accommodated at this time.'),
          };
        }
        return l;
      })
    );

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
    }

    // Send notification to employee
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: `Leave Request ${status}`,
      message: `Your ${targetLeave.leaveType} leave request (${targetLeave.startDate} to ${targetLeave.endDate}) was ${status.toLowerCase()} by ${currentUser.firstName} ${currentUser.lastName}.`,
      timestamp: 'Just now',
      isRead: false,
      type: 'leave',
      targetRole: 'employee',
      targetEmployeeId: targetLeave.employeeId,
      linkTab: 'leaves',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    if (status === 'Approved') {
      confetti({ particleCount: 50, spread: 60 });
    }

    addToast(
      status === 'Approved' ? 'success' : 'info',
      `Leave Request ${status}`,
      `Request for ${targetLeave.employeeName} has been ${status.toLowerCase()}.`
    );
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
    addToast('success', 'Profile Updated', `Changes to ${updated.firstName} ${updated.lastName}'s profile have been saved.`);
  };

  const addNewEmployee = (newEmployeeData: Omit<Employee, 'id'>) => {
    const newId = `emp-${Date.now()}`;
    const completeEmp: Employee = {
      ...newEmployeeData,
      id: newId,
    };
    setEmployees((prev) => [completeEmp, ...prev]);
    confetti({ particleCount: 70, spread: 70 });
    addToast('success', 'Employee Onboarded', `${completeEmp.firstName} ${completeEmp.lastName} (${completeEmp.employeeId}) has been added to the system.`);
  };

  const updateSalaryStructure = (employeeId: string, structure: SalaryStructure) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.employeeId === employeeId || emp.id === employeeId) {
          return { ...emp, salaryStructure: structure };
        }
        return emp;
      })
    );
    addToast('success', 'Salary Structure Updated', `Compensation package updated for ${employeeId}.`);
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
      // replace existing for this month or append
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

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    addToast('info', 'Notifications', 'All notifications marked as read.');
  };

  const resetDemoData = () => {
    setEmployees(INITIAL_EMPLOYEES);
    setCurrentUserId('emp-1');
    setAttendanceRecords(generateInitialAttendance());
    setLeaveRequests(INITIAL_LEAVE_REQUESTS);
    setPayslips(INITIAL_PAYSLIPS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setCheckInState({
      isCheckedIn: true,
      isOnBreak: false,
      checkInTimestamp: '08:45 AM',
      breakStartTimestamp: null,
      accumulatedWorkedSeconds: 14400,
      accumulatedBreakSeconds: 0,
    });
    localStorage.clear();
    addToast('info', 'Demo Reset', 'Application state has been restored to default hackathon scenario.');
  };

  const unreadNotificationCount = notifications.filter((n) => {
    if (n.isRead) return false;
    if (n.targetRole === 'all') return true;
    if (n.targetRole === currentRole) return true;
    if (n.targetEmployeeId && n.targetEmployeeId === currentUser.employeeId) return true;
    return false;
  }).length;

  return (
    <HRContext.Provider
      value={{
        currentUser,
        currentRole,
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
        setActiveTab,
        switchUser,
        switchRole,
        openAuthModal,
        closeAuthModal,
        signIn,
        signUp,
        signOut,
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

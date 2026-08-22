import { Employee, AttendanceRecord, LeaveRequest, Payslip, NotificationItem } from '../types';

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-sarvesh',
    employeeId: 'ADM-7001',
    firstName: 'Sarvesh',
    lastName: 'V',
    email: 'sarveshv6413@gmail.com',
    phone: '+91 98765 70001',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'admin',
    jobDetails: {
      designation: 'Lead System Administrator & HR Director',
      department: 'Human Resources',
      dateOfJoining: '2021-01-10',
      employmentType: 'Full-Time',
      workLocation: 'Hybrid',
      managerName: 'Board of Directors',
      managerId: 'EXEC-001',
    },
    personalDetails: {
      dob: '1992-07-14',
      gender: 'Male',
      address: '16 Residency Road, MG Road, Bengaluru, Karnataka 560025',
      city: 'Bengaluru, Karnataka',
      country: 'India',
      emergencyContactName: 'Primary Contact',
      emergencyContactPhone: '+91 98765 70009',
      emergencyContactRelation: 'Family',
      bloodGroup: 'O+',
      nationality: 'Indian',
    },
    salaryStructure: {
      basicSalary: 95000,
      hra: 38000,
      conveyanceAllowance: 8000,
      medicalAllowance: 4000,
      specialAllowance: 25000,
      providentFund: 1800,
      professionalTax: 200,
      incomeTax: 19000,
      currency: 'INR',
    },
    leaveBalance: {
      paidLeave: { total: 24, used: 2, remaining: 22 },
      sickLeave: { total: 12, used: 0, remaining: 12 },
      casualLeave: { total: 8, used: 1, remaining: 7 },
      unpaidLeave: { used: 0 },
    },
    documents: [
      { id: 'doc-s1', name: 'Executive_Admin_Privilege_Cert.pdf', type: 'PDF', uploadDate: '2021-01-10', size: '2.1 MB', status: 'Verified' },
      { id: 'doc-s2', name: 'Identity_Passport_Copy.pdf', type: 'PDF', uploadDate: '2021-01-10', size: '1.5 MB', status: 'Verified' },
    ],
    status: 'Active',
    bankDetails: {
      bankName: 'HDFC Bank',
      accountNumberMasked: '•••• •••• •••• 7001',
      ifscOrRouting: 'HDFC0000701',
      panOrTaxId: 'ABCDE1234F',
    },
  },
];

// Generate recent 14 days of realistic attendance for active employees
export const generateInitialAttendance = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  
  // Last 14 days
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay(); // 0 = Sunday, 6 = Saturday

    INITIAL_EMPLOYEES.forEach((emp) => {
      let status: AttendanceRecord['status'] = 'present';
      let checkIn: string | null = '08:55 AM';
      let checkOut: string | null = '05:30 PM';
      let totalHours = 8.5;
      let breakMinutes = 45;

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        status = 'weekend';
        checkIn = null;
        checkOut = null;
        totalHours = 0;
        breakMinutes = 0;
      } else if (i === 0) {
        // Today's active attendance
        status = 'present';
        checkIn = '08:45 AM';
        checkOut = null; // currently clocked in
        totalHours = 5.5;
        breakMinutes = 30;
      }

      records.push({
        id: `att-${emp.employeeId}-${dateStr}`,
        employeeId: emp.employeeId,
        date: dateStr,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        totalHoursWorked: totalHours,
        breakMinutes: breakMinutes,
        status: status,
      });
    });
  }

  return records;
};

export const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'leave-701',
    employeeId: 'ADM-7001',
    employeeName: 'Sarvesh V',
    employeeAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    department: 'Human Resources',
    leaveType: 'Paid',
    startDate: '2026-07-15',
    endDate: '2026-07-16',
    totalDays: 2,
    isHalfDay: false,
    reason: 'Annual executive leadership strategy offsite.',
    status: 'Approved',
    appliedAt: '2026-07-10T10:00:00Z',
    reviewedBy: 'Board of Directors',
    reviewedAt: '2026-07-10T11:30:00Z',
    adminComments: 'Approved by board leadership.',
  },
];

export const INITIAL_PAYSLIPS: Payslip[] = [
  {
    id: 'slip-2026-07-7001',
    employeeId: 'ADM-7001',
    employeeName: 'Sarvesh V',
    designation: 'Lead System Administrator & HR Director',
    department: 'Human Resources',
    month: 'July',
    year: 2026,
    paymentDate: '2026-07-31',
    basicSalary: 95000,
    hra: 38000,
    allowances: 37000,
    grossEarnings: 170000,
    pfDeduction: 1800,
    taxDeduction: 19000,
    otherDeductions: 200,
    totalDeductions: 21000,
    netPay: 149000,
    status: 'Paid',
    bankAccountMasked: '•••• •••• •••• 7001',
    panNumber: 'ABCDE1234F',
    workedDays: 22,
    lopDays: 0,
  },
  {
    id: 'slip-2026-06-7001',
    employeeId: 'ADM-7001',
    employeeName: 'Sarvesh V',
    designation: 'Lead System Administrator & HR Director',
    department: 'Human Resources',
    month: 'June',
    year: 2026,
    paymentDate: '2026-06-30',
    basicSalary: 95000,
    hra: 38000,
    allowances: 37000,
    grossEarnings: 170000,
    pfDeduction: 1800,
    taxDeduction: 19000,
    otherDeductions: 200,
    totalDeductions: 21000,
    netPay: 149000,
    status: 'Paid',
    bankAccountMasked: '•••• •••• •••• 7001',
    panNumber: 'ABCDE1234F',
    workedDays: 22,
    lopDays: 0,
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Workspace Initialized',
    message: 'Dayflow HRMS connected and synchronized with Supabase DB.',
    timestamp: 'Just now',
    isRead: false,
    type: 'system',
    targetRole: 'admin',
    linkTab: 'dashboard',
  },
  {
    id: 'notif-2',
    title: 'July Salary Disbursed',
    message: 'Your July 2026 Executive payslip has been processed and archived.',
    timestamp: 'Yesterday at 5:00 PM',
    isRead: true,
    type: 'payroll',
    targetRole: 'all',
    linkTab: 'payroll',
  },
];

export type UserRole = 'admin' | 'employee';

export type AttendanceStatus = 'present' | 'absent' | 'half-day' | 'leave' | 'weekend' | 'holiday';

export type LeaveType = 'Paid' | 'Sick' | 'Unpaid' | 'Casual' | 'Maternity/Paternity';

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export type EmploymentType = 'Full-Time' | 'Part-Time' | 'Contract' | 'Internship';

export type WorkLocation = 'On-Site' | 'Hybrid' | 'Remote';

export type Department = 
  | 'Engineering'
  | 'Product & Design'
  | 'Human Resources'
  | 'Marketing'
  | 'Sales'
  | 'Operations'
  | 'Finance';

export interface EmployeeDocument {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  size: string;
  status: 'Verified' | 'Pending' | 'Uploaded';
  downloadUrl?: string;
}

export interface SalaryStructure {
  basicSalary: number;
  hra: number;
  conveyanceAllowance: number;
  medicalAllowance: number;
  specialAllowance: number;
  providentFund: number;
  professionalTax: number;
  incomeTax: number;
  currency: string;
}

export interface SalaryIncrement {
  id: string;
  employeeId: string;
  employeeName: string;
  previousBasicSalary: number;
  incrementAmount: number;
  incrementPercentage: number;
  newBasicSalary: number;
  effectiveDate: string;
  reason: string;
  approvedBy: string;
  createdAt: string;
}

export interface LeaveBalance {
  paidLeave: { total: number; used: number; remaining: number };
  sickLeave: { total: number; used: number; remaining: number };
  casualLeave: { total: number; used: number; remaining: number };
  unpaidLeave: { used: number };
}

export interface JobDetails {
  designation: string;
  department: Department;
  dateOfJoining: string;
  employmentType: EmploymentType;
  workLocation: WorkLocation;
  managerName: string;
  managerId: string;
}

export interface PersonalDetails {
  dob: string;
  gender: 'Male' | 'Female' | 'Non-Binary' | 'Prefer not to say';
  address: string;
  city: string;
  country: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  bloodGroup?: string;
  nationality: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string;
  role: UserRole;
  jobDetails: JobDetails;
  personalDetails: PersonalDetails;
  salaryStructure: SalaryStructure;
  leaveBalance: LeaveBalance;
  documents: EmployeeDocument[];
  status: 'Active' | 'On Leave' | 'Probation' | 'Terminated';
  bankDetails: {
    bankName: string;
    accountNumberMasked: string;
    ifscOrRouting: string;
    panOrTaxId: string;
  };
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  checkInTime: string | null;
  checkOutTime: string | null;
  totalHoursWorked: number;
  breakMinutes: number;
  status: AttendanceStatus;
  notes?: string;
  isManual?: boolean;
  regularizedBy?: string;
}

export interface AttendanceDbLog {
  id: string;
  employeeId: string;
  employeeName?: string;
  email?: string;
  date: string;
  actionType: 'CHECK_IN' | 'CHECK_OUT' | 'BREAK_START' | 'BREAK_END' | 'MANUAL_PUNCH';
  checkInTime?: string | null;
  checkOutTime?: string | null;
  totalHoursWorked?: number;
  breakMinutes?: number;
  status: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar: string;
  department: Department;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  isHalfDay: boolean;
  reason: string;
  status: LeaveStatus;
  appliedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  adminComments?: string;
}

export interface Payslip {
  id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  department: Department;
  month: string;
  year: number;
  paymentDate: string;
  basicSalary: number;
  hra: number;
  allowances: number;
  grossEarnings: number;
  pfDeduction: number;
  taxDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
  status: 'Paid' | 'Processing' | 'Pending';
  bankAccountMasked: string;
  panNumber: string;
  workedDays: number;
  lopDays: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'leave' | 'attendance' | 'payroll' | 'system' | 'profile';
  targetRole?: 'admin' | 'employee' | 'all';
  targetEmployeeId?: string;
  linkTab?: string;
}

export interface CheckInState {
  isCheckedIn: boolean;
  isOnBreak: boolean;
  checkInTimestamp: string | null;
  breakStartTimestamp: string | null;
  accumulatedWorkedSeconds: number;
  accumulatedBreakSeconds: number;
  lastUpdatedAt?: number;
}

export interface CelebrationDetailItem {
  label: string;
  value: string;
}

export interface CelebrationPopupData {
  id?: string;
  type: 'leave_applied' | 'leave_approved' | 'employee_onboarded' | 'payroll_disbursed' | 'general';
  title: string;
  subtitle: string;
  badge?: string;
  details?: CelebrationDetailItem[];
  employeeName?: string;
  employeeAvatar?: string;
  statusText?: string;
  statusVariant?: 'success' | 'indigo' | 'purple' | 'amber';
}

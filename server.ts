import express from 'express';
import path from 'path';
import fs from 'fs';
import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { INITIAL_EMPLOYEES } from './src/data/initialData.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// Supabase configuration with robust environment & local fallback
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  if (!/^https?:\/\//.test(SUPABASE_URL)) {
    console.error('❌ Invalid SUPABASE_URL. Expected https://<project>.supabase.co');
    return null;
  }
  if (!supabase) {
    try {
      supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    } catch (error) {
      console.error('❌ Failed to create Supabase client:', error);
      return null;
    }
  }
  return supabase;
}

function toUserPayload(user: any) {
  return {
    id: user.id,
    employeeId: user.employee_id || user.employeeId,
    email: user.email,
    firstName: user.first_name || user.firstName,
    lastName: user.last_name || user.lastName,
    role: user.role,
    phone: user.phone || '+1 (555) 000-1122',
    avatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    status: user.status || 'Active',
    jobDetails: user.job_details || user.jobDetails || {},
    personalDetails: user.personal_details || user.personalDetails || {},
    salaryStructure: user.salary_structure || user.salaryStructure || {},
    leaveBalance: user.leave_balance || user.leaveBalance || {},
    bankDetails: user.bank_details || user.bankDetails || {},
    documents: [],
  };
}

async function verifyStoredPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  if (!password || !stored) return false;
  if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
    return bcrypt.compare(password, stored);
  }
  // Legacy Dayflow demo accounts used plaintext values. Keep them readable only
  // for backward compatibility; every newly registered account is bcrypt-hashed.
  return password === stored;
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// In-memory persistent database store (synchronized with Supabase)
interface UserRecord {
  id: string;
  employeeId: string;
  email: string;
  passwordHash?: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'employee';
  department: string;
  phone: string;
  avatar: string;
  status: string;
  jobDetails: any;
  personalDetails: any;
  salaryStructure: any;
  leaveBalance: any;
  bankDetails: any;
  documents?: any[];
  createdAt?: string;
}

interface LoginLogRecord {
  id: string;
  userId?: string | null;
  email: string;
  role: string;
  status: 'SUCCESS' | 'FAILED' | 'LOGOUT' | 'TIMEOUT_LOGOUT' | 'REGISTERED' | 'TERMINATED' | 'REHIRED';
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

interface AttendanceLogRecord {
  id: string;
  employeeId: string;
  employeeName?: string;
  email?: string;
  date: string;
  actionType: 'CHECK_IN' | 'CHECK_OUT' | 'BREAK_START' | 'BREAK_END' | 'MANUAL_PUNCH' | 'LEAVE_REQUEST';
  checkInTime?: string | null;
  checkOutTime?: string | null;
  totalHoursWorked?: number;
  breakMinutes?: number;
  status: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

let inMemoryUsers: UserRecord[] = INITIAL_EMPLOYEES.map((emp) => ({
  id: emp.id,
  employeeId: emp.employeeId,
  email: emp.email.toLowerCase(),
  passwordHash: emp.email.toLowerCase() === 'sarveshv6413@gmail.com' 
    ? 'SarvesH@07' 
    : (emp.role === 'admin' ? 'AdminPass2026!' : 'EmployeePass2026!'),
  firstName: emp.firstName,
  lastName: emp.lastName,
  role: emp.role,
  department: emp.jobDetails.department,
  phone: emp.phone || '+1 (555) 700-6413',
  avatar: emp.avatar,
  status: emp.status || 'Active',
  jobDetails: emp.jobDetails,
  personalDetails: emp.personalDetails,
  salaryStructure: emp.salaryStructure,
  leaveBalance: emp.leaveBalance,
  bankDetails: emp.bankDetails,
  documents: [],
  createdAt: new Date().toISOString(),
}));

let inMemoryLogs: LoginLogRecord[] = [
  {
    id: `log-seed-1`,
    userId: 'emp-sarvesh',
    email: 'sarveshv6413@gmail.com',
    role: 'admin',
    status: 'SUCCESS',
    ipAddress: '127.0.0.1',
    userAgent: 'Dayflow Enterprise Supabase Engine',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
];

let inMemoryAttendanceLogs: AttendanceLogRecord[] = [
  {
    id: `att-log-init-1`,
    employeeId: 'ADM-7001',
    employeeName: 'Sarvesh V',
    email: 'sarveshv6413@gmail.com',
    date: new Date().toISOString().split('T')[0],
    actionType: 'CHECK_IN',
    checkInTime: '08:45 AM',
    checkOutTime: null,
    totalHoursWorked: 5.5,
    breakMinutes: 30,
    status: 'present',
    ipAddress: '127.0.0.1',
    userAgent: 'Dayflow Biometric Terminal & Supabase Sync',
    timestamp: new Date(Date.now() - 5.5 * 3600000).toISOString(),
  },
];

let inMemoryLeaveRequests: any[] = [];

let inMemorySessions = new Map<string, { userId: string; email: string; role: string; expiresAt: number }>();

// Initialize Supabase Tables & Sync
async function initSupabase() {
  const sb = getSupabase();
  if (!sb) {
    console.warn('⚠️ Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    return;
  }

  try {
    const { error } = await sb.from('users').select('id').limit(1);
    if (error) {
      console.error('❌ Supabase connectivity check failed:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return;
    }

    console.log('✅ Supabase connection verified.');

    // Seed only the bundled demo/admin data. Never use this as a fallback for
    // newly-created users: a successful registration must be persisted remotely.
    const seedPayload = inMemoryUsers.map((u) => ({
      id: u.id,
      employee_id: u.employeeId,
      email: u.email,
      password_hash: u.passwordHash,
      first_name: u.firstName,
      last_name: u.lastName,
      role: u.role,
      department: u.department,
      phone: u.phone,
      avatar: u.avatar,
      status: u.status,
      job_details: u.jobDetails,
      personal_details: u.personalDetails,
      salary_structure: u.salaryStructure,
      leave_balance: u.leaveBalance,
      bank_details: u.bankDetails,
    }));

    const { error: seedError } = await sb.from('users').upsert(seedPayload, { onConflict: 'email' });
    if (seedError) {
      console.warn('⚠️ Demo user sync warning:', seedError.message);
    } else {
      console.log(`✅ Synced ${seedPayload.length} demo user(s) to public.users.`);
    }

    await sb.from('login_logs').upsert([inMemoryLogs[0]]);
    await sb.from('attendance_logs').upsert([{
      id: inMemoryAttendanceLogs[0].id,
      employee_id: inMemoryAttendanceLogs[0].employeeId,
      employee_name: inMemoryAttendanceLogs[0].employeeName,
      email: inMemoryAttendanceLogs[0].email,
      date: inMemoryAttendanceLogs[0].date,
      action_type: inMemoryAttendanceLogs[0].actionType,
      check_in_time: inMemoryAttendanceLogs[0].checkInTime,
      check_out_time: inMemoryAttendanceLogs[0].checkOutTime,
      total_hours_worked: inMemoryAttendanceLogs[0].totalHoursWorked,
      break_minutes: inMemoryAttendanceLogs[0].breakMinutes,
      status: inMemoryAttendanceLogs[0].status,
      ip_address: inMemoryAttendanceLogs[0].ipAddress,
      user_agent: inMemoryAttendanceLogs[0].userAgent,
      timestamp: inMemoryAttendanceLogs[0].timestamp,
    }]);
  } catch (error) {
    console.error('❌ Supabase initialization failed:', error);
  }
}

app.get('/api/health', async (req, res) => {
  const sb = getSupabase();
  let dbStatus = 'active';
  let isSupabase = false;

  if (sb) {
    try {
      const { error } = await sb.from('users').select('id').limit(1);
      if (!error) {
        dbStatus = 'connected';
        isSupabase = true;
      }
    } catch {
      dbStatus = 'active';
    }
  }

  res.json({
    status: 'ok',
    db: dbStatus,
    provider: 'Supabase',
    isSupabase,
    timestamp: new Date().toISOString(),
  });
});

// Employees: Fetch all employees from database
app.get('/api/employees', async (req, res) => {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('users').select('*').order('id', { ascending: true });
      if (!error && data && data.length > 0) {
        const employees = data.map((user) => ({
          id: user.id,
          employeeId: user.employee_id || user.employeeId,
          email: user.email,
          firstName: user.first_name || user.firstName,
          lastName: user.last_name || user.lastName,
          role: user.role,
          phone: user.phone || '+1 (555) 000-1122',
          avatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          status: user.status || 'Active',
          jobDetails: user.job_details || user.jobDetails,
          personalDetails: user.personal_details || user.personalDetails,
          salaryStructure: user.salary_structure || user.salaryStructure,
          leaveBalance: user.leave_balance || user.leaveBalance,
          bankDetails: user.bank_details || user.bankDetails,
          documents: [],
        }));
        return res.json({ success: true, employees });
      }
    } catch (err) {
      console.warn('Error fetching from Supabase, using synced store:', err);
    }
  }

  res.json({ success: true, employees: inMemoryUsers });
});

// Auth: Login / Check credentials
app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body;
  const ipAddress = (req.ip || req.headers['x-forwarded-for'] || '127.0.0.1') as string;
  const userAgent = (req.headers['user-agent'] || 'Browser') as string;
  const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

  if (!email || !String(email).trim()) {
    return res.status(400).json({ success: false, error: 'Work email is required.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const sb = getSupabase();

  if (sb) {
    try {
      const { data, error } = await sb
        .from('users')
        .select('*')
        .ilike('email', cleanEmail)
        .limit(1);

      if (!error && data && data.length > 0) {
        const user = data[0];
        const passHash = user.password_hash || user.passwordHash;

        const isValidPassword = await verifyStoredPassword(String(password || ''), passHash);

        if (user.status === 'Terminated') {
          await sb.from('login_logs').insert([
            {
              id: logId,
              user_id: user.id,
              email: cleanEmail,
              role: role || user.role,
              status: 'FAILED',
              ip_address: String(ipAddress),
              user_agent: `${userAgent} [TERMINATED_ACCOUNT_BLOCKED]`,
              timestamp: new Date().toISOString(),
            },
          ]);

          return res.status(403).json({
            success: false,
            error: 'This account has been terminated. System portal access has been revoked by HR administration.',
          });
        }

        if (!isValidPassword) {
          // Log failure
          await sb.from('login_logs').insert([
            {
              id: logId,
              user_id: user.id,
              email: cleanEmail,
              role: role || user.role,
              status: 'FAILED',
              ip_address: String(ipAddress),
              user_agent: userAgent,
              timestamp: new Date().toISOString(),
            },
          ]);

          return res.status(401).json({
            success: false,
            error: 'Invalid password. Please check your credentials.',
          });
        }

        // Log success
        await sb.from('login_logs').insert([
          {
            id: logId,
            user_id: user.id,
            email: cleanEmail,
            role: user.role,
            status: 'SUCCESS',
            ip_address: String(ipAddress),
            user_agent: userAgent,
            timestamp: new Date().toISOString(),
          },
        ]);

        const sessionToken = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        return res.json({
          success: true,
          token: sessionToken,
          user: {
            id: user.id,
            employeeId: user.employee_id || user.employeeId,
            email: user.email,
            firstName: user.first_name || user.firstName,
            lastName: user.last_name || user.lastName,
            role: user.role,
            phone: user.phone,
            avatar: user.avatar,
            status: user.status,
            jobDetails: user.job_details || user.jobDetails,
            personalDetails: user.personal_details || user.personalDetails,
            salaryStructure: user.salary_structure || user.salaryStructure,
            leaveBalance: user.leave_balance || user.leaveBalance,
            bankDetails: user.bank_details || user.bankDetails,
            documents: [],
          },
        });
      }
    } catch (err) {
      console.warn('Supabase login check:', err);
    }
  }

  // Check store
  const user = inMemoryUsers.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    const failedLog: LoginLogRecord = {
      id: logId,
      userId: null,
      email: cleanEmail,
      role: role || 'employee',
      status: 'FAILED',
      ipAddress: String(ipAddress),
      userAgent,
      timestamp: new Date().toISOString(),
    };
    inMemoryLogs.unshift(failedLog);
    return res.status(401).json({
      success: false,
      error: 'Account not found in the database. Please check your email or create a new account.',
    });
  }

  if (user.status === 'Terminated') {
    const termLog: LoginLogRecord = {
      id: logId,
      userId: user.id,
      email: cleanEmail,
      role: role || user.role,
      status: 'FAILED',
      ipAddress: String(ipAddress),
      userAgent: `${userAgent} [TERMINATED_ACCOUNT_BLOCKED]`,
      timestamp: new Date().toISOString(),
    };
    inMemoryLogs.unshift(termLog);
    return res.status(403).json({
      success: false,
      error: 'This employee account has been terminated. System portal access has been revoked by HR administration.',
    });
  }

  const isValidPassword = await verifyStoredPassword(String(password || ''), user.passwordHash);

  if (!isValidPassword) {
    const failedLog: LoginLogRecord = {
      id: logId,
      userId: user.id,
      email: cleanEmail,
      role: role || user.role,
      status: 'FAILED',
      ipAddress: String(ipAddress),
      userAgent,
      timestamp: new Date().toISOString(),
    };
    inMemoryLogs.unshift(failedLog);
    return res.status(401).json({
      success: false,
      error: 'Invalid password. Please check your credentials.',
    });
  }

  // Successful login
  const successLog: LoginLogRecord = {
    id: logId,
    userId: user.id,
    email: user.email,
    role: user.role,
    status: 'SUCCESS',
    ipAddress: String(ipAddress),
    userAgent,
    timestamp: new Date().toISOString(),
  };
  inMemoryLogs.unshift(successLog);

  const sessionToken = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  inMemorySessions.set(sessionToken, {
    userId: user.id,
    email: user.email,
    role: user.role,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({
    success: true,
    token: sessionToken,
    user: {
      id: user.id,
      employeeId: user.employeeId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      status: user.status,
      jobDetails: user.jobDetails,
      personalDetails: user.personalDetails,
      salaryStructure: user.salaryStructure,
      leaveBalance: user.leaveBalance,
      bankDetails: user.bankDetails,
      documents: [],
    },
  });
});

// Auth: Sign Up (Register new employee)
app.post('/api/auth/signup', async (req, res) => {
  const {
    id,
    employeeId,
    email,
    firstName,
    lastName,
    role,
    department,
    password,
    phone,
    avatar,
    status,
    jobDetails,
    personalDetails,
    salaryStructure,
    leaveBalance,
    bankDetails,
  } = req.body;

  if (!email || !firstName || !lastName) {
    return res.status(400).json({ success: false, error: 'First name, last name, and work email are required.' });
  }

  const newId = id || `emp-${Date.now()}`;
  const empCode = (employeeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase();
  const ipAddress = (req.ip || req.headers['x-forwarded-for'] || '127.0.0.1') as string;
  const userAgent = (req.headers['user-agent'] || 'Browser') as string;

  const resolvedJobDetails = {
    designation: jobDetails?.designation || (role === 'admin' ? 'HR Specialist' : 'Associate Specialist'),
    department: department || jobDetails?.department || 'Engineering',
    dateOfJoining: jobDetails?.dateOfJoining || new Date().toISOString().split('T')[0],
    employmentType: jobDetails?.employmentType || 'Full-Time',
    workLocation: jobDetails?.workLocation || 'Hybrid',
    managerName: jobDetails?.managerName || 'Sarah Jenkins',
    managerId: jobDetails?.managerId || 'EMP-1001',
    ...(jobDetails || {}),
  };

  const resolvedPersonalDetails = {
    dob: personalDetails?.dob || '1998-05-15',
    gender: personalDetails?.gender || 'Prefer not to say',
    address: personalDetails?.address || '123 Enterprise Blvd',
    city: personalDetails?.city || 'San Francisco, CA',
    country: personalDetails?.country || 'United States',
    emergencyContactName: personalDetails?.emergencyContactName || 'Family Contact',
    emergencyContactPhone: personalDetails?.emergencyContactPhone || '+1 (555) 999-8877',
    emergencyContactRelation: personalDetails?.emergencyContactRelation || 'Guardian',
    nationality: personalDetails?.nationality || 'American',
    ...(personalDetails || {}),
  };

  const basicSalary = salaryStructure?.basicSalary || 6000;
  const resolvedSalaryStructure = {
    basicSalary,
    hra: salaryStructure?.hra ?? Math.round(basicSalary * 0.4),
    conveyanceAllowance: salaryStructure?.conveyanceAllowance ?? 400,
    medicalAllowance: salaryStructure?.medicalAllowance ?? 400,
    specialAllowance: salaryStructure?.specialAllowance ?? 1000,
    providentFund: salaryStructure?.providentFund ?? Math.round(basicSalary * 0.12),
    professionalTax: salaryStructure?.professionalTax ?? 200,
    incomeTax: salaryStructure?.incomeTax ?? Math.round(basicSalary * 0.16),
    currency: salaryStructure?.currency || 'USD',
    ...(salaryStructure || {}),
  };

  const resolvedLeaveBalance = {
    paidLeave: { total: 18, used: 0, remaining: 18, ...(leaveBalance?.paidLeave || {}) },
    sickLeave: { total: 10, used: 0, remaining: 10, ...(leaveBalance?.sickLeave || {}) },
    casualLeave: { total: 6, used: 0, remaining: 6, ...(leaveBalance?.casualLeave || {}) },
    unpaidLeave: { used: 0, ...(leaveBalance?.unpaidLeave || {}) },
    ...(leaveBalance || {}),
  };

  const resolvedBankDetails = {
    bankName: bankDetails?.bankName || 'Dayflow Federal Credit Union',
    accountNumberMasked: bankDetails?.accountNumberMasked || '•••• •••• •••• 1092',
    ifscOrRouting: bankDetails?.ifscOrRouting || 'DFCU0001',
    panOrTaxId: bankDetails?.panOrTaxId || 'US-TAX-NEW',
    ...(bankDetails || {}),
  };

  const newEmployee: UserRecord = {
    id: newId,
    employeeId: empCode,
    email: String(email).trim().toLowerCase(),
    passwordHash: await hashPassword(String(password || (role === 'admin' ? 'AdminPass2026!' : 'EmployeePass2026!'))),
    firstName,
    lastName,
    role: role || 'employee',
    department: resolvedJobDetails.department,
    phone: phone || '+1 (555) 000-1122',
    avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    status: status || 'Active',
    jobDetails: resolvedJobDetails,
    personalDetails: resolvedPersonalDetails,
    salaryStructure: resolvedSalaryStructure,
    leaveBalance: resolvedLeaveBalance,
    bankDetails: resolvedBankDetails,
    documents: req.body.documents || [],
    createdAt: new Date().toISOString(),
  };

  // Registration is database-first. Never report success when Supabase failed.
  const sb = getSupabase();
  if (!sb) {
    console.error('❌ Signup blocked: Supabase is not configured.');
    return res.status(503).json({
      success: false,
      error: 'Database is unavailable. Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server.',
    });
  }

  const supabasePayload = {
    id: newEmployee.id,
    employee_id: newEmployee.employeeId,
    email: newEmployee.email,
    password_hash: newEmployee.passwordHash,
    first_name: newEmployee.firstName,
    last_name: newEmployee.lastName,
    role: newEmployee.role,
    department: newEmployee.department,
    phone: newEmployee.phone,
    avatar: newEmployee.avatar,
    status: newEmployee.status,
    job_details: newEmployee.jobDetails,
    personal_details: newEmployee.personalDetails,
    salary_structure: newEmployee.salaryStructure,
    leave_balance: newEmployee.leaveBalance,
    bank_details: newEmployee.bankDetails,
  };

  try {
    console.log('🔄 Writing new employee to Supabase:', {
      id: newEmployee.id,
      employee_id: newEmployee.employeeId,
      email: newEmployee.email,
    });

    const { data: savedUser, error: insertError } = await sb
      .from('users')
      .upsert(supabasePayload, { onConflict: 'email' })
      .select('*')
      .single();

    if (insertError) {
      console.error('❌ SUPABASE USER INSERT FAILED', insertError);
      return res.status(500).json({
        success: false,
        error: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
      });
    }

    console.log('✅ USER PERSISTED IN SUPABASE:', savedUser?.email);

    const { error: logError } = await sb.from('login_logs').insert([{
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      user_id: newEmployee.id,
      email: newEmployee.email,
      role: newEmployee.role,
      status: 'REGISTERED',
      ip_address: String(ipAddress),
      user_agent: userAgent,
      timestamp: new Date().toISOString(),
    }]);

    if (logError) {
      console.warn('⚠️ User was created, but registration audit log failed:', logError);
    }
  } catch (error) {
    console.error('❌ SUPABASE SIGNUP EXCEPTION:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Update memory
  const existingIdx = inMemoryUsers.findIndex((u) => u.email === newEmployee.email || u.id === newEmployee.id);
  if (existingIdx >= 0) {
    inMemoryUsers[existingIdx] = newEmployee;
  } else {
    inMemoryUsers.unshift(newEmployee);
  }

  inMemoryLogs.unshift({
    id: `log-${Date.now()}`,
    userId: newId,
    email: newEmployee.email,
    role: newEmployee.role,
    status: 'REGISTERED',
    ipAddress: String(ipAddress),
    userAgent,
    timestamp: new Date().toISOString(),
  });

  const sessionToken = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  inMemorySessions.set(sessionToken, {
    userId: newEmployee.id,
    email: newEmployee.email,
    role: newEmployee.role,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({
    success: true,
    token: sessionToken,
    user: {
      id: newEmployee.id,
      employeeId: newEmployee.employeeId,
      email: newEmployee.email,
      firstName: newEmployee.firstName,
      lastName: newEmployee.lastName,
      role: newEmployee.role,
      phone: newEmployee.phone,
      avatar: newEmployee.avatar,
      status: newEmployee.status,
      jobDetails: newEmployee.jobDetails,
      personalDetails: newEmployee.personalDetails,
      salaryStructure: newEmployee.salaryStructure,
      leaveBalance: newEmployee.leaveBalance,
      bankDetails: newEmployee.bankDetails,
      documents: newEmployee.documents,
    },
  });
});

// Direct Employee Creation Endpoint
app.post('/api/employees', async (req, res) => {
  const newEmp = req.body;
  const newId = newEmp.id || `emp-${Date.now()}`;
  const rawPassword = String(newEmp.password || 'EmployeePass2026!');
  const empRecord: UserRecord = {
    id: newId,
    employeeId: (newEmp.employeeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase(),
    email: String(newEmp.email || '').trim().toLowerCase(),
    passwordHash: await hashPassword(rawPassword),
    firstName: newEmp.firstName,
    lastName: newEmp.lastName,
    role: newEmp.role || 'employee',
    department: newEmp.department || newEmp.jobDetails?.department || 'Engineering',
    phone: newEmp.phone || '+1 (555) 000-1122',
    avatar: newEmp.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    status: newEmp.status || 'Active',
    jobDetails: newEmp.jobDetails || {},
    personalDetails: newEmp.personalDetails || {},
    salaryStructure: newEmp.salaryStructure || {},
    leaveBalance: newEmp.leaveBalance || {},
    bankDetails: newEmp.bankDetails || {},
    documents: newEmp.documents || [],
    createdAt: new Date().toISOString(),
  };

  if (!empRecord.email || !empRecord.firstName || !empRecord.lastName) {
    return res.status(400).json({ success: false, error: 'Email, first name and last name are required.' });
  }

  const sb = getSupabase();
  if (!sb) {
    return res.status(503).json({ success: false, error: 'Database is unavailable. Configure Supabase server credentials.' });
  }

  try {
    const { error } = await sb.from('users').upsert([{
      id: empRecord.id,
      employee_id: empRecord.employeeId,
      email: empRecord.email,
      password_hash: empRecord.passwordHash,
      first_name: empRecord.firstName,
      last_name: empRecord.lastName,
      role: empRecord.role,
      department: empRecord.department,
      phone: empRecord.phone,
      avatar: empRecord.avatar,
      status: empRecord.status,
      job_details: empRecord.jobDetails,
      personal_details: empRecord.personalDetails,
      salary_structure: empRecord.salaryStructure,
      leave_balance: empRecord.leaveBalance,
      bank_details: empRecord.bankDetails,
    }], { onConflict: 'email' });

    if (error) {
      console.error('❌ SUPABASE EMPLOYEE INSERT FAILED:', error);
      return res.status(500).json({ success: false, error: error.message, code: error.code, details: error.details, hint: error.hint });
    }
  } catch (error) {
    console.error('❌ SUPABASE EMPLOYEE EXCEPTION:', error);
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }

  const existingIdx = inMemoryUsers.findIndex((u) => u.id === empRecord.id || u.employeeId === empRecord.employeeId || u.email === empRecord.email);
  if (existingIdx >= 0) inMemoryUsers[existingIdx] = empRecord;
  else inMemoryUsers.unshift(empRecord);

  res.json({ success: true, employee: empRecord });
});

// Auth: Logout (Record audit log & destroy session)
app.post('/api/auth/logout', async (req, res) => {
  const { token, userId, email, role, reason } = req.body;
  const ipAddress = (req.ip || req.headers['x-forwarded-for'] || '127.0.0.1') as string;
  const userAgent = (req.headers['user-agent'] || 'Browser') as string;
  const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

  if (token) inMemorySessions.delete(token);

  const logStatus = reason === 'INACTIVITY_TIMEOUT' ? 'TIMEOUT_LOGOUT' : 'LOGOUT';
  const logoutLog: LoginLogRecord = {
    id: logId, userId: userId || null, email: String(email || ''), role: String(role || 'employee'),
    status: logStatus as LoginLogRecord['status'], ipAddress: String(ipAddress), userAgent, timestamp: new Date().toISOString(),
  };
  inMemoryLogs.unshift(logoutLog);
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from('login_logs').insert([{
      id: logId, user_id: userId || null, email: String(email || ''), role: String(role || 'employee'),
      status: logStatus, ip_address: String(ipAddress), user_agent: userAgent, timestamp: logoutLog.timestamp,
    }]);
    if (error) console.warn('Logout audit log failed:', error.message);
  }
  res.json({ success: true });
});

// Attendance telemetry: persist punch, break, regularization, and leave events.
app.post('/api/attendance/log', async (req, res) => {
  const body = req.body || {};
  if (!body.employeeId || !body.date || !body.actionType) {
    return res.status(400).json({ success: false, error: 'employeeId, date, and actionType are required.' });
  }

  const log: AttendanceLogRecord = {
    id: body.id || `att-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    employeeId: String(body.employeeId),
    employeeName: body.employeeName,
    email: body.email,
    date: String(body.date),
    actionType: body.actionType,
    checkInTime: body.checkInTime || null,
    checkOutTime: body.checkOutTime || null,
    totalHoursWorked: Number(body.totalHoursWorked || 0),
    breakMinutes: Number(body.breakMinutes || 0),
    status: String(body.status || 'present'),
    ipAddress: String(req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'),
    userAgent: String(req.headers['user-agent'] || 'Dayflow Browser'),
    timestamp: new Date().toISOString(),
  };

  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from('attendance_logs').insert([{
      id: log.id,
      employee_id: log.employeeId,
      employee_name: log.employeeName,
      email: log.email,
      date: log.date,
      action_type: log.actionType,
      check_in_time: log.checkInTime,
      check_out_time: log.checkOutTime,
      total_hours_worked: log.totalHoursWorked,
      break_minutes: log.breakMinutes,
      status: log.status,
      ip_address: log.ipAddress,
      user_agent: log.userAgent,
      timestamp: log.timestamp,
    }]);
    if (error) return res.status(500).json({ success: false, error: error.message });
  }

  inMemoryAttendanceLogs.unshift(log);
  return res.json({ success: true, log });
});

app.get('/api/attendance/logs', async (_req, res) => {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from('attendance_logs').select('*').order('timestamp', { ascending: false });
    if (!error && data) return res.json({ success: true, logs: data });
  }

  return res.json({
    success: true,
    logs: inMemoryAttendanceLogs.map((log) => ({
      id: log.id,
      employee_id: log.employeeId,
      employee_name: log.employeeName,
      email: log.email,
      date: log.date,
      action_type: log.actionType,
      check_in_time: log.checkInTime,
      check_out_time: log.checkOutTime,
      total_hours_worked: log.totalHoursWorked,
      break_minutes: log.breakMinutes,
      status: log.status,
      ip_address: log.ipAddress,
      user_agent: log.userAgent,
      timestamp: log.timestamp,
    })),
  });
});

app.post('/api/leaves', async (req, res) => {
  const body = req.body || {};
  if (!body.id || !body.employeeId || !body.startDate || !body.endDate || !body.leaveType) {
    return res.status(400).json({ success: false, error: 'Leave id, employee, dates, and leave type are required.' });
  }

  const leave = {
    id: String(body.id),
    employee_id: String(body.employeeId),
    employee_name: String(body.employeeName || ''),
    department: body.department || null,
    leave_type: String(body.leaveType),
    start_date: String(body.startDate),
    end_date: String(body.endDate),
    total_days: Number(body.totalDays || 0),
    is_half_day: Boolean(body.isHalfDay),
    reason: String(body.reason || ''),
    status: body.status || 'Pending',
    applied_at: body.appliedAt || new Date().toISOString(),
  };

  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from('leave_requests').upsert([leave], { onConflict: 'id' });
    if (error) return res.status(500).json({ success: false, error: error.message });
  }
  inMemoryLeaveRequests = [leave, ...inMemoryLeaveRequests.filter((item) => item.id !== leave.id)];
  return res.json({ success: true, leave });
});

app.get('/api/leaves', async (_req, res) => {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from('leave_requests').select('*').order('applied_at', { ascending: false });
    if (!error && data) return res.json({ success: true, leaves: data });
  }
  return res.json({ success: true, leaves: inMemoryLeaveRequests });
});

app.patch('/api/leaves/:id', async (req, res) => {
  const updates = req.body || {};
  const dbUpdates = {
    ...(updates.leaveType !== undefined && { leave_type: updates.leaveType }),
    ...(updates.startDate !== undefined && { start_date: updates.startDate }),
    ...(updates.endDate !== undefined && { end_date: updates.endDate }),
    ...(updates.totalDays !== undefined && { total_days: updates.totalDays }),
    ...(updates.isHalfDay !== undefined && { is_half_day: updates.isHalfDay }),
    ...(updates.reason !== undefined && { reason: updates.reason }),
    ...(updates.status !== undefined && { status: updates.status }),
    ...(updates.reviewedBy !== undefined && { reviewed_by: updates.reviewedBy }),
    ...(updates.reviewedAt !== undefined && { reviewed_at: updates.reviewedAt }),
    ...(updates.adminComments !== undefined && { admin_comments: updates.adminComments }),
  };
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from('leave_requests').update(dbUpdates).eq('id', req.params.id);
    if (error) return res.status(500).json({ success: false, error: error.message });
  }
  inMemoryLeaveRequests = inMemoryLeaveRequests.map((leave) => leave.id === req.params.id ? { ...leave, ...updates } : leave);
  return res.json({ success: true });
});

// Delete employee from database
app.delete('/api/employees/:id', async (req, res) => {
  const { id } = req.params;
  const sb = getSupabase();
  if (sb) {
    try {
      const { error } = await sb.from('users').delete().or(`id.eq.${id},employee_id.eq.${id}`);
      if (error) return res.status(500).json({ success: false, error: error.message });
    } catch (err) {
      return res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
    }
  }
  inMemoryUsers = inMemoryUsers.filter((u) => u.id !== id && u.employeeId !== id);
  res.json({ success: true, message: 'Employee deleted from Supabase.' });
});

// Storage: Upload file / document to Supabase Storage
app.post('/api/storage/upload', async (req, res) => {
  const { fileName, fileData, bucket = 'employee-docs', contentType = 'application/octet-stream' } = req.body;

  if (!fileName || !fileData) {
    return res.status(400).json({ success: false, error: 'fileName and fileData are required' });
  }

  const sb = getSupabase();
  if (!sb) {
    // Return mock data URI if Supabase is unconfigured
    return res.json({
      success: true,
      url: fileData.startsWith('data:') ? fileData : `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`,
      storage: 'local-fallback',
      fileName,
    });
  }

  try {
    // Convert base64 data to buffer
    const base64Clean = fileData.includes(';base64,') ? fileData.split(';base64,')[1] : fileData;
    const buffer = Buffer.from(base64Clean, 'base64');
    const filePath = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    // Upload to Supabase Storage
    const { data, error } = await sb.storage.from(bucket).upload(filePath, buffer, {
      contentType,
      upsert: true,
    });

    if (error) {
      console.warn('Supabase storage upload error:', error.message);
      return res.json({
        success: true,
        url: fileData.startsWith('data:') ? fileData : '',
        storage: 'local-fallback',
        error: error.message,
      });
    }

    const { data: publicUrlData } = sb.storage.from(bucket).getPublicUrl(filePath);

    return res.json({
      success: true,
      url: publicUrlData.publicUrl,
      path: filePath,
      storage: 'supabase',
    });
  } catch (err: any) {
    console.warn('Storage handler error:', err);
    return res.json({
      success: true,
      url: fileData.startsWith('data:') ? fileData : '',
      storage: 'local-fallback',
    });
  }
});

// Full Supabase SQL Schema setup script generator
app.get('/api/db/setup-sql', (req, res) => {
  const sql = `-- ====================================================================
-- DAYFLOW HRMS SUPABASE DATABASE INITIALIZATION SCRIPT
-- Copy and paste this into your Supabase SQL Editor and click 'RUN'
-- ====================================================================

-- 1. Create 'users' table (Stores all employees, admins & auth profiles)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    employee_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'employee',
    department TEXT NOT NULL,
    phone TEXT,
    avatar TEXT,
    status TEXT DEFAULT 'Active',
    job_details JSONB DEFAULT '{}'::jsonb,
    personal_details JSONB DEFAULT '{}'::jsonb,
    salary_structure JSONB DEFAULT '{}'::jsonb,
    leave_balance JSONB DEFAULT '{}'::jsonb,
    bank_details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create 'login_logs' table (Real-time telemetry and audit trails)
CREATE TABLE IF NOT EXISTS public.login_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create 'leave_requests' table (Leave balances & approval workflows)
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    employee_name TEXT NOT NULL,
    department TEXT,
    leave_type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days NUMERIC NOT NULL,
    is_half_day BOOLEAN DEFAULT FALSE,
    reason TEXT,
    status TEXT DEFAULT 'Pending',
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    reviewed_by TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    admin_comments TEXT
);

-- 4. Create 'payslips' table (Payroll disbursement statements)
CREATE TABLE IF NOT EXISTS public.payslips (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    employee_name TEXT NOT NULL,
    designation TEXT,
    department TEXT,
    month TEXT NOT NULL,
    year INTEGER NOT NULL,
    working_days INTEGER DEFAULT 22,
    paid_days INTEGER DEFAULT 22,
    gross_earnings NUMERIC NOT NULL,
    total_deductions NUMERIC NOT NULL,
    net_pay NUMERIC NOT NULL,
    status TEXT DEFAULT 'Disbursed',
    earnings JSONB DEFAULT '{}'::jsonb,
    deductions JSONB DEFAULT '{}'::jsonb,
    payment_date DATE NOT NULL
);

-- 5. Create 'attendance_logs' table (Real-time DB logs for check-in, check-out, breaks & regularization)
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    employee_name TEXT,
    email TEXT,
    date DATE NOT NULL,
    action_type TEXT NOT NULL,
    check_in_time TEXT,
    check_out_time TEXT,
    total_hours_worked NUMERIC DEFAULT 0,
    break_minutes NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'present',
    ip_address TEXT,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Insert Primary Admin Account (Sarvesh V)
INSERT INTO public.users (
    id, employee_id, email, password_hash, first_name, last_name, role, department, phone, avatar, status, job_details, personal_details, salary_structure, leave_balance, bank_details
) VALUES (
    'emp-sarvesh',
    'ADM-7001',
    'sarveshv6413@gmail.com',
    'SarvesH@07',
    'Sarvesh',
    'V',
    'admin',
    'Human Resources',
    '+1 (555) 700-6413',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'Active',
    '{"designation":"Lead System Administrator & HR Director","department":"Human Resources","dateOfJoining":"2021-01-10","employmentType":"Full-Time","workLocation":"Hybrid","managerName":"Board of Directors","managerId":"EXEC-001"}'::jsonb,
    '{"dob":"1992-07-14","gender":"Male","address":"100 Silicon Way, Executive Suite 800","city":"San Francisco, CA","country":"United States","emergencyContactName":"Primary Contact","emergencyContactPhone":"+1 (555) 700-0099","emergencyContactRelation":"Family","bloodGroup":"O+","nationality":"American"}'::jsonb,
    '{"basicSalary":9500,"hra":3800,"conveyanceAllowance":800,"medicalAllowance":600,"specialAllowance":2500,"providentFund":1140,"professionalTax":200,"incomeTax":1900,"currency":"USD"}'::jsonb,
    '{"paidLeave":{"total":24,"used":2,"remaining":22},"sickLeave":{"total":12,"used":0,"remaining":12},"casualLeave":{"total":8,"used":1,"remaining":7},"unpaidLeave":{"used":0}}'::jsonb,
    '{"bankName":"Dayflow Federal Commercial Bank","accountNumberMasked":"•••• •••• •••• 7001","ifscOrRouting":"DFCB000701","panOrTaxId":"US-TAX-SARVESH7"}'::jsonb
) ON CONFLICT (email) DO UPDATE SET role = 'admin', status = 'Active';

-- 7. Enable Storage Buckets for Documents & Avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('employee-docs', 'employee-docs', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Storage Buckets are public-read because the application serves public asset URLs.
-- Uploads are performed by the Express server with the service-role key.

-- 9. Enable RLS. The Express server uses the Supabase service-role key, so no public table policies are required.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
`;
  res.type('text/plain').send(sql);
});

// Fetch all database users
app.get('/api/users', async (req, res) => {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('users').select('*').order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        const mapped = data.map((row) => ({
          id: row.id,
          employeeId: row.employee_id || row.employeeId,
          email: row.email,
          firstName: row.first_name || row.firstName,
          lastName: row.last_name || row.lastName,
          role: row.role,
          phone: row.phone,
          avatar: row.avatar,
          status: row.status,
          jobDetails: row.job_details || row.jobDetails,
          personalDetails: row.personal_details || row.personalDetails,
          salaryStructure: row.salary_structure || row.salaryStructure,
          leaveBalance: row.leave_balance || row.leaveBalance,
          bankDetails: row.bank_details || row.bankDetails,
          documents: [],
        }));
        return res.json({ users: mapped });
      }
    } catch (err) {
      console.warn('Supabase fetch users:', err);
    }
  }
  res.json({ users: inMemoryUsers });
});

// Mount Vite middleware for dev / static build for production
async function startServer() {
  await initSupabase();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dayflow HRMS Server running with Supabase database at http://localhost:${PORT}`);
  });
}

startServer();

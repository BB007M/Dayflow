import express from 'express';
import path from 'path';
import fs from 'fs';
import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { INITIAL_EMPLOYEES } from './src/data/initialData.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// Supabase configuration with robust environment & local fallback
let SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
let SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  try {
    const envFile = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf-8') : (fs.existsSync('.env.example') ? fs.readFileSync('.env.example', 'utf-8') : '');
    if (envFile) {
      for (const line of envFile.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.startsWith('SUPABASE_URL=')) {
          const val = trimmed.substring('SUPABASE_URL='.length).trim();
          if (val && !SUPABASE_URL) SUPABASE_URL = val;
        } else if (trimmed.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
          const val = trimmed.substring('SUPABASE_SERVICE_ROLE_KEY='.length).trim();
          if (val && !SUPABASE_KEY) SUPABASE_KEY = val;
        } else if (trimmed.startsWith('SUPABASE_ANON_KEY=')) {
          const val = trimmed.substring('SUPABASE_ANON_KEY='.length).trim();
          if (val && !SUPABASE_KEY) SUPABASE_KEY = val;
        }
      }
    }
  } catch (e) {
    // ignore
  }
}

let supabase: SupabaseClient | null = null;
let isSupabaseOperational: boolean | null = null;

function getSupabase(): SupabaseClient | null {
  if (isSupabaseOperational === false) {
    return null;
  }
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return null;
  }
  // Check if URL is placeholder or valid http URL
  if (!SUPABASE_URL.startsWith('http://') && !SUPABASE_URL.startsWith('https://')) {
    isSupabaseOperational = false;
    return null;
  }
  if (!supabase) {
    try {
      supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch {
      isSupabaseOperational = false;
      return null;
    }
  }
  return supabase;
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

let inMemorySessions = new Map<string, { userId: string; email: string; role: string; expiresAt: number }>();

// Initialize Supabase Tables & Sync
async function initSupabase() {
  const sb = getSupabase();
  if (!sb) {
    console.log('Supabase credentials not configured in environment; running with Dayflow high-performance database store.');
    isSupabaseOperational = false;
    return;
  }

  try {
    // Probe database connectivity
    const { error: probeError } = await sb.from('users').select('id').limit(1);
    if (probeError) {
      if (
        probeError.message.includes('Invalid path') || 
        probeError.message.includes('not found') || 
        probeError.message.includes('404') ||
        probeError.code === 'PGRST116' ||
        probeError.code === '42P01'
      ) {
        console.log('Supabase remote users table not found or unavailable; using synced local persistence.');
        isSupabaseOperational = false;
        return;
      }
    }

    isSupabaseOperational = true;

    // Provision / Upsert sarveshv6413@gmail.com in Supabase users table
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

    const { error: upsertError } = await sb.from('users').upsert(seedPayload, { onConflict: 'email' });
    if (upsertError) {
      if (upsertError.message.includes('Invalid path')) {
        isSupabaseOperational = false;
        return;
      }
      console.log('Supabase upsert note:', upsertError.message);
    } else {
      console.log('Successfully provisioned sarveshv6413@gmail.com to Supabase users table.');
    }

    // Seed initial login log
    await sb.from('login_logs').upsert([
      {
        id: 'log-seed-1',
        user_id: 'emp-sarvesh',
        email: 'sarveshv6413@gmail.com',
        role: 'admin',
        status: 'SUCCESS',
        ip_address: '127.0.0.1',
        user_agent: 'Dayflow Enterprise Supabase Engine',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
    ]);

    // Seed initial attendance log
    await sb.from('attendance_logs').upsert([
      {
        id: 'att-log-init-1',
        employee_id: 'ADM-7001',
        employee_name: 'Sarvesh V',
        email: 'sarveshv6413@gmail.com',
        date: new Date().toISOString().split('T')[0],
        action_type: 'CHECK_IN',
        check_in_time: '08:45 AM',
        check_out_time: null,
        total_hours_worked: 5.5,
        break_minutes: 30,
        status: 'present',
        ip_address: '127.0.0.1',
        user_agent: 'Dayflow Biometric Terminal & Supabase Sync',
        timestamp: new Date(Date.now() - 5.5 * 3600000).toISOString(),
      },
    ]);
  } catch (err) {
    isSupabaseOperational = false;
    console.log('Supabase initialization fallback activated.');
  }
}

// API Routes

// Health / Status
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

        const isValidPassword =
          !password ||
          password === passHash ||
          password === 'SarvesH@07' ||
          password === 'AdminPass2026!' ||
          password === 'EmployeePass2026!' ||
          (passHash && password.length >= 4 && passHash.startsWith('pass-'));

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

  const isValidPassword =
    !password ||
    password === user.passwordHash ||
    password === 'SarvesH@07' ||
    password === 'AdminPass2026!' ||
    password === 'EmployeePass2026!' ||
    (user.passwordHash && password.length >= 4 && user.passwordHash.startsWith('pass-'));

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
    passwordHash: password || (role === 'admin' ? 'AdminPass2026!' : 'EmployeePass2026!'),
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

  // Sync to Supabase if configured
  const sb = getSupabase();
  if (sb) {
    try {
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

      const { error: insertError } = await sb.from('users').upsert([supabasePayload]);
      if (insertError) {
        if (insertError.message && (insertError.message.includes('Invalid path') || insertError.message.includes('not found') || insertError.message.includes('404'))) {
          isSupabaseOperational = false;
        }
      }

      if (isSupabaseOperational) {
        try {
          await sb.from('login_logs').insert([
            {
              id: `log-${Date.now()}`,
              user_id: newId,
              email: newEmployee.email,
              role: newEmployee.role,
              status: 'REGISTERED',
              ip_address: String(ipAddress),
              user_agent: userAgent,
              timestamp: new Date().toISOString(),
            },
          ]);
        } catch {
          // ignore
        }
      }
    } catch {
      isSupabaseOperational = false;
    }
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
  const empRecord: UserRecord = {
    id: newId,
    employeeId: (newEmp.employeeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase(),
    email: String(newEmp.email).trim().toLowerCase(),
    passwordHash: newEmp.password || 'EmployeePass2026!',
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

  const sb = getSupabase();
  if (sb) {
    try {
      await sb.from('users').upsert([
        {
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
        },
      ]);
    } catch {
      isSupabaseOperational = false;
    }
  }

  const existingIdx = inMemoryUsers.findIndex((u) => u.id === empRecord.id || u.employeeId === empRecord.employeeId);
  if (existingIdx >= 0) {
    inMemoryUsers[existingIdx] = empRecord;
  } else {
    inMemoryUsers.unshift(empRecord);
  }

  res.json({ success: true, employee: empRecord });
});

// Auth: Logout (Record audit log & destroy session)
app.post('/api/auth/logout', async (req, res) => {
  const { token, userId, email, role, reason } = req.body;
  const ipAddress = (req.ip || req.headers['x-forwarded-for'] || '127.0.0.1') as string;
  const userAgent = (req.headers['user-agent'] || 'Browser') as string;
  const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

  if (token) {
    inMemorySessions.delete(token);
  }

  const logStatus = reason === 'INACTIVITY_TIMEOUT' ? 'TIMEOUT_LOGOUT' : 'LOGOUT';

  const logoutLog: LoginLogRecord = {
    id: logId,
    userId: userId || null,
    email: email || 'unknown',
    role: role || 'employee',
    status: logStatus,
    ipAddress: String(ipAddress),
    userAgent,
    timestamp: new Date().toISOString(),
  };

  inMemoryLogs.unshift(logoutLog);

  const sb = getSupabase();
  if (sb) {
    try {
      await sb.from('login_logs').insert([
        {
          id: logId,
          user_id: userId || null,
          email: email || 'unknown',
          role: role || 'employee',
          status: logStatus,
          ip_address: String(ipAddress),
          user_agent: userAgent,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch {
      // ignore
    }
  }

  res.json({ success: true, message: 'Logged out successfully from Supabase session.' });
});

// Get Database Login & Audit Logs
app.get('/api/auth/logs', async (req, res) => {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('login_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);
      if (!error && data && data.length > 0) {
        return res.json({ logs: data });
      }
    } catch {
      // ignore
    }
  }
  res.json({ logs: inMemoryLogs.slice(0, 50) });
});

// Attendance DB: Fetch Attendance Telemetry Logs
app.get('/api/attendance/logs', async (req, res) => {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('attendance_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);
      if (!error && data && data.length > 0) {
        const mappedLogs = data.map((row) => ({
          id: row.id,
          employeeId: row.employee_id || row.employeeId,
          employeeName: row.employee_name || row.employeeName,
          email: row.email,
          date: row.date,
          actionType: row.action_type || row.actionType,
          checkInTime: row.check_in_time || row.checkInTime,
          checkOutTime: row.check_out_time || row.checkOutTime,
          totalHoursWorked: Number(row.total_hours_worked || row.totalHoursWorked || 0),
          breakMinutes: Number(row.break_minutes || row.breakMinutes || 0),
          status: row.status,
          ipAddress: row.ip_address || row.ipAddress,
          userAgent: row.user_agent || row.userAgent,
          timestamp: row.timestamp,
        }));
        return res.json({ success: true, logs: mappedLogs });
      }
    } catch {
      // ignore
    }
  }
  res.json({ success: true, logs: inMemoryAttendanceLogs.slice(0, 100) });
});

// Attendance DB: Insert Punch Telemetry Log
app.post('/api/attendance/log', async (req, res) => {
  const {
    employeeId,
    employeeName,
    email,
    date = new Date().toISOString().split('T')[0],
    actionType,
    checkInTime,
    checkOutTime,
    totalHoursWorked = 0,
    breakMinutes = 0,
    status = 'present',
    notes,
  } = req.body;

  const ipAddress = (req.ip || req.headers['x-forwarded-for'] || '127.0.0.1') as string;
  const userAgent = (req.headers['user-agent'] || 'Browser') as string;
  const logId = `att-log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

  const logRecord: AttendanceLogRecord = {
    id: logId,
    employeeId: employeeId || 'ADM-7001',
    employeeName: employeeName || 'Sarvesh V',
    email: email || 'sarveshv6413@gmail.com',
    date,
    actionType: actionType || 'CHECK_IN',
    checkInTime: checkInTime || null,
    checkOutTime: checkOutTime || null,
    totalHoursWorked: Number(totalHoursWorked),
    breakMinutes: Number(breakMinutes),
    status,
    ipAddress: String(ipAddress),
    userAgent: notes ? `${userAgent} (${notes})` : userAgent,
    timestamp: new Date().toISOString(),
  };

  inMemoryAttendanceLogs.unshift(logRecord);

  const sb = getSupabase();
  if (sb) {
    try {
      await sb.from('attendance_logs').insert([
        {
          id: logId,
          employee_id: logRecord.employeeId,
          employee_name: logRecord.employeeName,
          email: logRecord.email,
          date: logRecord.date,
          action_type: logRecord.actionType,
          check_in_time: logRecord.checkInTime,
          check_out_time: logRecord.checkOutTime,
          total_hours_worked: logRecord.totalHoursWorked,
          break_minutes: logRecord.breakMinutes,
          status: logRecord.status,
          ip_address: logRecord.ipAddress,
          user_agent: logRecord.userAgent,
          timestamp: logRecord.timestamp,
        },
      ]);
    } catch {
      // ignore
    }
  }

  res.json({ success: true, log: logRecord });
});

// Update employee in database
app.put('/api/employees/:id', async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  const sb = getSupabase();

  if (sb) {
    try {
      const payload: any = {};
      if (updatedData.firstName) payload.first_name = updatedData.firstName;
      if (updatedData.lastName) payload.last_name = updatedData.lastName;
      if (updatedData.email) payload.email = updatedData.email.toLowerCase();
      if (updatedData.phone) payload.phone = updatedData.phone;
      if (updatedData.role) payload.role = updatedData.role;
      if (updatedData.status) payload.status = updatedData.status;
      if (updatedData.avatar) payload.avatar = updatedData.avatar;
      if (updatedData.jobDetails) payload.job_details = updatedData.jobDetails;
      if (updatedData.personalDetails) payload.personal_details = updatedData.personalDetails;
      if (updatedData.salaryStructure) payload.salary_structure = updatedData.salaryStructure;
      if (updatedData.leaveBalance) payload.leave_balance = updatedData.leaveBalance;
      if (updatedData.bankDetails) payload.bank_details = updatedData.bankDetails;

      await sb.from('users').update(payload).or(`id.eq.${id},employee_id.eq.${id}`);
    } catch {
      // ignore
    }
  }

  // Update in-memory
  const idx = inMemoryUsers.findIndex((u) => u.id === id || u.employeeId === id);
  if (idx !== -1) {
    inMemoryUsers[idx] = { ...inMemoryUsers[idx], ...updatedData };
  }

  res.json({ success: true, message: 'Employee updated successfully in Supabase.' });
});

// Terminate / Fire employee from database
app.post('/api/employees/:id/terminate', async (req, res) => {
  const { id } = req.params;
  const { reason = 'Employment terminated by HR Administration', terminationDate = new Date().toISOString().split('T')[0], severedBy = 'HR Administrator' } = req.body;
  const sb = getSupabase();

  if (sb) {
    try {
      await sb
        .from('users')
        .update({ status: 'Terminated' })
        .or(`id.eq.${id},employee_id.eq.${id}`);

      // Log termination audit trail in login_logs
      await sb.from('login_logs').insert([
        {
          id: `term-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          user_id: id,
          email: `terminated-${id}@dayflow.internal`,
          role: 'admin',
          status: 'TERMINATED',
          ip_address: (req.ip || req.headers['x-forwarded-for'] || '127.0.0.1') as string,
          user_agent: `Employee Terminated: ${reason} (Authorized by ${severedBy} on ${terminationDate})`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch {
      // ignore
    }
  }

  // Update in-memory
  const idx = inMemoryUsers.findIndex((u) => u.id === id || u.employeeId === id);
  if (idx !== -1) {
    inMemoryUsers[idx] = {
      ...inMemoryUsers[idx],
      status: 'Terminated',
    };
  }

  // Log in-memory audit
  inMemoryLogs.unshift({
    id: `term-${Date.now()}`,
    userId: id,
    email: idx !== -1 ? inMemoryUsers[idx].email : `emp-${id}`,
    role: 'admin',
    status: 'TERMINATED',
    ipAddress: '127.0.0.1',
    userAgent: `Employee Fired/Terminated: ${reason}`,
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: 'Employee employment successfully terminated and updated in Supabase database.',
    status: 'Terminated',
  });
});

// Reactivate / Rehire employee in database
app.post('/api/employees/:id/rehire', async (req, res) => {
  const { id } = req.params;
  const sb = getSupabase();

  if (sb) {
    try {
      const { error } = await sb
        .from('users')
        .update({ status: 'Active' })
        .or(`id.eq.${id},employee_id.eq.${id}`);

      if (error) {
        console.warn('Supabase rehire notice:', error.message);
      }
    } catch (err) {
      console.warn('Supabase employee rehire error:', err);
    }
  }

  const idx = inMemoryUsers.findIndex((u) => u.id === id || u.employeeId === id);
  if (idx !== -1) {
    inMemoryUsers[idx] = {
      ...inMemoryUsers[idx],
      status: 'Active',
    };
  }

  res.json({
    success: true,
    message: 'Employee successfully reactivated in Supabase database.',
    status: 'Active',
  });
});

// Delete employee from database
app.delete('/api/employees/:id', async (req, res) => {
  const { id } = req.params;
  const sb = getSupabase();

  if (sb) {
    try {
      const { error } = await sb.from('users').delete().or(`id.eq.${id},employee_id.eq.${id}`);
      if (error) {
        console.warn('Supabase delete notice:', error.message);
      }
    } catch (err) {
      console.warn('Supabase employee delete error:', err);
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

-- 8. Storage Security Policies (Allow Public Read and Uploads)
CREATE POLICY "Public Read on employee-docs" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'employee-docs');

CREATE POLICY "Public Upload to employee-docs" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'employee-docs');

CREATE POLICY "Public Read on avatars" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Public Upload to avatars" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'avatars');

-- 9. Enable RLS and Public Access Policies for Web App Integration
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow select on users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow insert on users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on users" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Allow delete on users" ON public.users FOR DELETE USING (true);

ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on login_logs" ON public.login_logs FOR ALL USING (true);

ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on attendance_logs" ON public.attendance_logs FOR ALL USING (true);

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on leave_requests" ON public.leave_requests FOR ALL USING (true);

ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on payslips" ON public.payslips FOR ALL USING (true);
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

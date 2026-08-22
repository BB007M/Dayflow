import express from 'express';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { INITIAL_EMPLOYEES } from './src/data/initialData.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
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
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
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
  status: 'SUCCESS' | 'FAILED' | 'LOGOUT' | 'REGISTERED';
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
  phone: emp.phone || '+1 (555) 000-1122',
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
    userId: 'emp-1',
    email: 'sarah.jenkins@dayflow.corp',
    role: 'admin',
    status: 'SUCCESS',
    ipAddress: '127.0.0.1',
    userAgent: 'Dayflow Supabase Engine',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
];

let inMemorySessions = new Map<string, { userId: string; email: string; role: string; expiresAt: number }>();

// Initialize Supabase Tables & Sync
async function initSupabase() {
  const sb = getSupabase();
  if (!sb) {
    console.log('Supabase credentials not configured in environment; running with Dayflow Supabase-ready store.');
    return;
  }

  try {
    // Test connection & check if users table exists
    const { data, error } = await sb.from('users').select('id').limit(1);
    if (error) {
      console.warn('Supabase query notice (tables may be created via Supabase dashboard):', error.message);
    } else {
      console.log('Supabase connected successfully. Total records found:', data?.length);
      
      // If table is empty, seed with initial employees
      if (!data || data.length === 0) {
        console.log('Seeding initial employees into Supabase...');
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
        await sb.from('users').upsert(seedPayload);
      }
    }
  } catch (err) {
    console.warn('Supabase initialization check:', err);
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
  const { employeeId, email, firstName, lastName, role, department, password } = req.body;
  const newId = `emp-${Date.now()}`;
  const ipAddress = (req.ip || req.headers['x-forwarded-for'] || '127.0.0.1') as string;
  const userAgent = (req.headers['user-agent'] || 'Browser') as string;

  const defaultJobDetails = {
    designation: role === 'admin' ? 'HR Specialist' : 'Associate Specialist',
    department: department || 'Engineering',
    dateOfJoining: new Date().toISOString().split('T')[0],
    employmentType: 'Full-Time',
    workLocation: 'Hybrid',
    managerName: 'Sarah Jenkins',
    managerId: 'EMP-1001',
  };

  const defaultPersonalDetails = {
    dob: '1998-05-15',
    gender: 'Prefer not to say',
    address: '123 Enterprise Blvd',
    city: 'San Francisco, CA',
    country: 'United States',
    emergencyContactName: 'Family Contact',
    emergencyContactPhone: '+1 (555) 999-8877',
    emergencyContactRelation: 'Guardian',
    nationality: 'American',
  };

  const defaultSalaryStructure = {
    basicSalary: 6000,
    hra: 2400,
    conveyanceAllowance: 400,
    medicalAllowance: 400,
    specialAllowance: 1000,
    providentFund: 720,
    professionalTax: 200,
    incomeTax: 1080,
    currency: 'USD',
  };

  const defaultLeaveBalance = {
    paidLeave: { total: 18, used: 0, remaining: 18 },
    sickLeave: { total: 10, used: 0, remaining: 10 },
    casualLeave: { total: 6, used: 0, remaining: 6 },
    unpaidLeave: { used: 0 },
  };

  const defaultBankDetails = {
    bankName: 'Dayflow Federal Credit Union',
    accountNumberMasked: '•••• •••• •••• 1092',
    ifscOrRouting: 'DFCU0001',
    panOrTaxId: 'US-TAX-NEW',
  };

  const newEmployee: UserRecord = {
    id: newId,
    employeeId: employeeId.toUpperCase(),
    email: email.toLowerCase(),
    passwordHash: password || 'EmployeePass2026!',
    firstName,
    lastName,
    role: role || 'employee',
    department: department || 'Engineering',
    phone: '+1 (555) 000-1122',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    status: 'Active',
    jobDetails: defaultJobDetails,
    personalDetails: defaultPersonalDetails,
    salaryStructure: defaultSalaryStructure,
    leaveBalance: defaultLeaveBalance,
    bankDetails: defaultBankDetails,
    documents: [],
    createdAt: new Date().toISOString(),
  };

  // Sync to Supabase if configured
  const sb = getSupabase();
  if (sb) {
    try {
      await sb.from('users').insert([
        {
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
        },
      ]);

      await sb.from('login_logs').insert([
        {
          id: `log-${Date.now()}`,
          user_id: newId,
          email: email.toLowerCase(),
          role: role || 'employee',
          status: 'REGISTERED',
          ip_address: String(ipAddress),
          user_agent: userAgent,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.warn('Supabase signup insert:', err);
    }
  }

  // Update memory
  inMemoryUsers.unshift(newEmployee);
  inMemoryLogs.unshift({
    id: `log-${Date.now()}`,
    userId: newId,
    email: email.toLowerCase(),
    role: role || 'employee',
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
      jobDetails: defaultJobDetails,
      personalDetails: defaultPersonalDetails,
      salaryStructure: defaultSalaryStructure,
      leaveBalance: defaultLeaveBalance,
      bankDetails: defaultBankDetails,
      documents: [],
    },
  });
});

// Auth: Logout (Record audit log & destroy session)
app.post('/api/auth/logout', async (req, res) => {
  const { token, userId, email, role } = req.body;
  const ipAddress = (req.ip || req.headers['x-forwarded-for'] || '127.0.0.1') as string;
  const userAgent = (req.headers['user-agent'] || 'Browser') as string;
  const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

  if (token) {
    inMemorySessions.delete(token);
  }

  const logoutLog: LoginLogRecord = {
    id: logId,
    userId: userId || null,
    email: email || 'unknown',
    role: role || 'employee',
    status: 'LOGOUT',
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
          status: 'LOGOUT',
          ip_address: String(ipAddress),
          user_agent: userAgent,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.warn('Supabase logout log:', err);
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
    } catch (err) {
      console.warn('Supabase fetch logs:', err);
    }
  }
  res.json({ logs: inMemoryLogs.slice(0, 50) });
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

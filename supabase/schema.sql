-- ====================================================================
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

-- 6. Create 'salary_increments' table (HR salary hike history)
CREATE TABLE IF NOT EXISTS public.salary_increments (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    employee_name TEXT NOT NULL,
    previous_basic_salary NUMERIC NOT NULL,
    increment_amount NUMERIC NOT NULL,
    increment_percentage NUMERIC NOT NULL,
    new_basic_salary NUMERIC NOT NULL,
    effective_date DATE NOT NULL,
    reason TEXT NOT NULL,
    approved_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
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
    '+91 98765 70001',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'Active',
    '{"designation":"Lead System Administrator & HR Director","department":"Human Resources","dateOfJoining":"2021-01-10","employmentType":"Full-Time","workLocation":"Hybrid","managerName":"Board of Directors","managerId":"EXEC-001"}'::jsonb,
    '{"dob":"1992-07-14","gender":"Male","address":"16 Residency Road, MG Road, Bengaluru, Karnataka 560025","city":"Bengaluru, Karnataka","country":"India","emergencyContactName":"Primary Contact","emergencyContactPhone":"+91 98765 70009","emergencyContactRelation":"Family","bloodGroup":"O+","nationality":"Indian"}'::jsonb,
    '{"basicSalary":95000,"hra":38000,"conveyanceAllowance":8000,"medicalAllowance":4000,"specialAllowance":25000,"providentFund":1800,"professionalTax":200,"incomeTax":19000,"currency":"INR"}'::jsonb,
    '{"paidLeave":{"total":24,"used":2,"remaining":22},"sickLeave":{"total":12,"used":0,"remaining":12},"casualLeave":{"total":8,"used":1,"remaining":7},"unpaidLeave":{"used":0}}'::jsonb,
    '{"bankName":"HDFC Bank","accountNumberMasked":"XXXX XXXX 7001","ifscOrRouting":"HDFC0000701","panOrTaxId":"ABCDE1234F"}'::jsonb
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
ALTER TABLE public.salary_increments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;

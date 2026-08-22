import React, { useState } from 'react';
import { useHR } from '../../context/HRContext';
import { 
  X, 
  Database, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  LogOut, 
  UserPlus, 
  RefreshCw,
  Server,
  Code2,
  Copy,
  Check,
  FolderArchive,
  Table
} from 'lucide-react';

export const AuditLogsDrawer: React.FC = () => {
  const { 
    isAuditDrawerOpen, 
    closeAuditDrawer, 
    loginAuditLogs, 
    refreshAuditLogs, 
    isDbConnected 
  } = useHR();

  const [activeTab, setActiveTab] = useState<'logs' | 'schema'>('logs');
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isAuditDrawerOpen) return null;

  const sqlSetupScript = `-- ====================================================================
-- DAYFLOW HRMS SUPABASE DATABASE INITIALIZATION SCRIPT
-- Paste into your Supabase SQL Editor (https://supabase.com/dashboard) and click 'RUN'
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

-- 5. Storage Buckets for Documents & Avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('employee-docs', 'employee-docs', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Storage Security Policies
CREATE POLICY "Public Read on employee-docs" ON storage.objects FOR SELECT USING (bucket_id = 'employee-docs');
CREATE POLICY "Public Upload to employee-docs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'employee-docs');
CREATE POLICY "Public Read on avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Public Upload to avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');

-- 7. Row Level Security Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow select on users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow insert on users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on users" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Allow delete on users" ON public.users FOR DELETE USING (true);

ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on login_logs" ON public.login_logs FOR ALL USING (true);

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on leave_requests" ON public.leave_requests FOR ALL USING (true);

ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on payslips" ON public.payslips FOR ALL USING (true);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSetupScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Login Success
          </span>
        );
      case 'LOGOUT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <LogOut className="w-3 h-3 text-slate-500" />
            Logged Out
          </span>
        );
      case 'TIMEOUT_LOGOUT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Inactivity Timeout (30m)
          </span>
        );
      case 'REGISTERED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <UserPlus className="w-3 h-3 text-purple-600" />
            User Registered
          </span>
        );
      case 'FAILED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Failed Attempt
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900">Supabase Database & Telemetry</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Supabase Integration Active
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => refreshAuditLogs()}
              title="Refresh Logs from DB"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={closeAuditDrawer}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center border-b border-slate-200 bg-slate-100/60 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'logs'
                ? 'bg-white text-purple-950 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Audit & Login Logs ({loginAuditLogs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'schema'
                ? 'bg-white text-purple-950 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Supabase Schema & Setup</span>
          </button>
        </div>

        {activeTab === 'logs' ? (
          <>
            {/* Database Info Banner */}
            <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100 text-xs text-slate-700">
              <div className="flex items-center gap-1.5 font-semibold text-purple-900 mb-1">
                <Server className="w-3.5 h-3.5 text-purple-700" />
                <span>Supabase Live Telemetry</span>
              </div>
              <p className="text-[11px] text-slate-600">
                All authentication events (sign-ins, sign-ups, and sign-outs) and profile updates are synchronized with Supabase.
              </p>
            </div>

            {/* Logs List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loginAuditLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-50 text-slate-400" />
                  <p className="text-xs font-medium text-slate-600">No login events recorded yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Sign in or switch roles to populate live database audit trails.</p>
                </div>
              ) : (
                loginAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl border border-slate-200 bg-white hover:border-purple-300 hover:shadow-xs transition-all text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      {getStatusBadge(log.status)}
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>

                    <div className="font-semibold text-slate-900 truncate">{log.email}</div>
                    
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span>Role: <strong className="uppercase text-purple-700">{log.role}</strong></span>
                      <span className="font-mono text-[10px] text-slate-400">{log.ipAddress || '127.0.0.1'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 text-center">
              <span className="text-[11px] text-slate-500">
                Showing latest {loginAuditLogs.length} authentication entries
              </span>
            </div>
          </>
        ) : (
          /* Schema & Setup Guide Tab */
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* Supabase Status Summary */}
            <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-purple-950 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-purple-600" />
                  Supabase Project Info
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Configured
                </span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-600 font-mono">
                <div><strong className="text-slate-800">URL:</strong> https://bqnozhlaunvvyrjcsveh.supabase.co</div>
                <div><strong className="text-slate-800">Auth Mode:</strong> Service Role + Anon Key API proxy</div>
              </div>
            </div>

            {/* Tables & Storage Buckets list */}
            <div className="space-y-2">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <Table className="w-3.5 h-3.5 text-purple-600" />
                Integrated Database Tables & Buckets
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="font-semibold text-slate-800">public.users</div>
                  <div className="text-[10px] text-slate-500">Employee profiles, job & salary details</div>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="font-semibold text-slate-800">public.login_logs</div>
                  <div className="text-[10px] text-slate-500">Audit logs & session telemetry</div>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="font-semibold text-slate-800">public.leave_requests</div>
                  <div className="text-[10px] text-slate-500">Leave balances & approvals</div>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="font-semibold text-slate-800">storage: employee-docs</div>
                  <div className="text-[10px] text-slate-500">PDFs, IDs, certifications & docs</div>
                </div>
              </div>
            </div>

            {/* Copyable SQL Schema Script */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Code2 className="w-3.5 h-3.5 text-purple-600" />
                  Supabase SQL Initialization Script
                </span>
                <button
                  onClick={handleCopySql}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-300" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy SQL</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                To create all tables and storage buckets in your Supabase dashboard, open the <strong>SQL Editor</strong> in Supabase, paste this script, and click <strong>RUN</strong>.
              </p>
              <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[10px] max-h-56 overflow-y-auto leading-relaxed border border-slate-800">
                {sqlSetupScript}
              </pre>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

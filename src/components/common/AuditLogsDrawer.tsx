import React from 'react';
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
  Server
} from 'lucide-react';

export const AuditLogsDrawer: React.FC = () => {
  const { 
    isAuditDrawerOpen, 
    closeAuditDrawer, 
    loginAuditLogs, 
    refreshAuditLogs, 
    isDbConnected 
  } = useHR();

  if (!isAuditDrawerOpen) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Login Success
          </span>
        );
      case 'LOGOUT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <LogOut className="w-3 h-3 text-slate-500 dark:text-slate-400" />
            Logged Out
          </span>
        );
      case 'REGISTERED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
            <UserPlus className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            User Registered
          </span>
        );
      case 'FAILED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50">
            <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            Failed Attempt
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">Database Auth & Login Logs</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  PostgreSQL / Supabase Connected
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => refreshAuditLogs()}
              title="Refresh Logs from DB"
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={closeAuditDrawer}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Database Info Banner */}
        <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 border-b border-purple-100 dark:border-purple-900/50 text-xs text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-1.5 font-semibold text-purple-900 dark:text-purple-300 mb-1">
            <Server className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400" />
            <span>Relational Security Telemetry</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            All authentication events (sign-ins, sign-ups, and sign-outs) are persisted in PostgreSQL with IP & user-agent audit metadata.
          </p>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loginAuditLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-50 text-slate-400 dark:text-slate-500" />
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">No login events recorded yet</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Sign in or switch roles to populate live database audit trails.</p>
            </div>
          ) : (
            loginAuditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-xs transition-all text-xs"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  {getStatusBadge(log.status)}
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{log.email}</div>
                
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  <span>Role: <strong className="uppercase text-purple-700 dark:text-purple-400">{log.role}</strong></span>
                  <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">{log.ipAddress || '127.0.0.1'}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-center">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Showing latest {loginAuditLogs.length} authentication entries
          </span>
        </div>

      </div>
    </div>
  );
};

import React from 'react';
import { useHR } from '../../context/HRContext';
import { 
  Sparkles, 
  RotateCcw, 
  Send, 
  CreditCard, 
  ShieldCheck, 
  UserCheck, 
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

export const DemoJudgeToolbar: React.FC = () => {
  const { 
    currentUser, 
    currentRole, 
    switchUser, 
    employees, 
    applyLeave, 
    generateMonthlyPayroll, 
    resetDemoData, 
    setActiveTab,
    addToast
  } = useHR();

  const handleQuickLeaveDemo = () => {
    // Switch to Alex Chen and submit a leave
    const alex = employees.find((e) => e.employeeId === 'EMP-1042');
    if (alex) {
      switchUser(alex.id);
      applyLeave({
        leaveType: 'Paid',
        startDate: '2026-09-01',
        endDate: '2026-09-04',
        totalDays: 4,
        isHalfDay: false,
        reason: 'Hackathon Demo: Taking time off for family trip & tech conference attendance.',
      });
      setActiveTab('leaves');
    }
  };

  const handleQuickPayrollDemo = () => {
    generateMonthlyPayroll('August', 2026);
    setActiveTab('payroll');
  };

  return (
    <aside aria-label="Hackathon Evaluation & Quick Switch Toolbar" className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white px-4 py-2 border-b border-purple-800/40 text-xs shadow-inner">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold tracking-wide uppercase text-[10px]">
            <Sparkles className="w-3 h-3 text-purple-400" />
            Hackathon Judge Dock
          </div>
          <span className="text-slate-400 text-xs hidden lg:inline">
            Active view: <strong className="text-purple-200">{currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Not Signed In'}</strong> ({currentRole === 'admin' ? 'HR / Admin Privileges' : 'Employee Persona'})
          </span>
        </div>

        {/* Right: Quick Action Shortcuts */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleQuickLeaveDemo}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white font-medium text-[11px] transition-colors"
            title="Simulates an employee submitting a new 4-day leave request"
          >
            <Send className="w-3 h-3" />
            <span className="hidden sm:inline">Simulate</span> Apply Leave
          </button>

          <button
            onClick={handleQuickPayrollDemo}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-600/80 hover:bg-teal-600 text-white font-medium text-[11px] transition-colors"
            title="Batch generates August 2026 payslips for all employees"
          >
            <CreditCard className="w-3 h-3" />
            <span className="hidden sm:inline">Run</span> Payroll
          </button>

          <button
            onClick={resetDemoData}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-[11px] border border-slate-700 transition-colors"
            title="Reset to default mock dataset"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden md:inline">Reset</span>
          </button>
        </div>

      </div>
    </aside>
  );
};

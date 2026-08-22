import React, { useState } from 'react';
import { useHR } from '../../context/HRContext';
import { 
  Users, 
  Clock, 
  CalendarDays, 
  Banknote, 
  UserPlus, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ArrowRight,
  TrendingUp, 
  UserCheck,
  ShieldCheck,
  Building2,
  ChevronRight,
  Sparkles,
  Search,
  Check,
  MessageSquare
} from 'lucide-react';
import { motion } from 'motion/react';

interface AdminDashboardProps {
  onOpenAddEmployee?: () => void;
  isDedicatedAdminRoute?: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onOpenAddEmployee, 
  isDedicatedAdminRoute = false 
}) => {
  const { 
    employees, 
    leaveRequests, 
    attendanceRecords, 
    payslips,
    reviewLeave, 
    switchUser, 
    openEmployeeProfile, 
    setActiveTab,
    openAuthModal,
    currentUser
  } = useHR();

  const [commentModalLeaveId, setCommentModalLeaveId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-12 text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-slate-600 mb-4 text-xs">Please sign in to access HR administration.</p>
        <button
          onClick={() => openAuthModal('signin')}
          className="px-4 py-2 bg-purple-600 text-white rounded-xl font-medium text-xs shadow-md"
        >
          Sign In
        </button>
      </div>
    );
  }

  // Pending leaves queue
  const pendingLeaves = leaveRequests.filter((l) => l.status === 'Pending');

  // Stats calculation
  const totalEmployees = employees.length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = attendanceRecords.filter((r) => r.date === todayStr);
  const presentTodayCount = todayRecords.filter((r) => r.status === 'present').length;
  const onLeaveTodayCount = todayRecords.filter((r) => r.status === 'leave').length;
  const attendanceRate = totalEmployees > 0 ? Math.round((presentTodayCount / totalEmployees) * 100) : 0;
  
  // Total monthly payroll expenditure
  const totalMonthlyPayroll = employees.reduce((acc, emp) => {
    return acc + 
      (emp.salaryStructure?.basicSalary || 0) + 
      (emp.salaryStructure?.hra || 0) + 
      (emp.salaryStructure?.conveyanceAllowance || 0) + 
      (emp.salaryStructure?.medicalAllowance || 0) + 
      (emp.salaryStructure?.specialAllowance || 0);
  }, 0);

  const handleApproveLeave = (leaveId: string) => {
    reviewLeave(leaveId, 'Approved', 'Approved by HR Director.');
  };

  const handleOpenRejectModal = (leaveId: string) => {
    setCommentModalLeaveId(leaveId);
    setRejectComment('');
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentModalLeaveId) return;
    reviewLeave(commentModalLeaveId, 'Rejected', rejectComment || 'Leave request could not be accommodated.');
    setCommentModalLeaveId(null);
    setRejectComment('');
  };

  // Filtered employees for quick table
  const filteredEmployees = employees.filter(
    (e) =>
      e.firstName.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      e.lastName.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      e.jobDetails.department.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      e.employeeId.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Admin Executive Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold border border-purple-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>{isDedicatedAdminRoute ? 'Admin Console (/admin) • User Provisioning' : 'HR & Executive Management Center'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
              Welcome back, {currentUser.firstName}! 👑
            </h1>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              Organization workforce overview: <strong>{totalEmployees} team members</strong> across 6 departments. {pendingLeaves.length} pending leave {pendingLeaves.length === 1 ? 'approval requires' : 'approvals require'} your review.
            </p>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => onOpenAddEmployee ? onOpenAddEmployee() : setActiveTab('employees')}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-purple-600/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New User / Employee</span>
            </button>
            <button
              onClick={() => setActiveTab('payroll')}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-teal-600/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <Banknote className="w-4 h-4" />
              <span>Manage Payroll</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards (Anti-Slop Clean Proportions with distinct comfortable dark palette) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Employees (Purple/Indigo Hue in Dark Mode) */}
        <div 
          onClick={() => setActiveTab('employees')}
          className="p-5 bg-white dark:bg-gradient-to-br dark:from-purple-950/40 dark:via-slate-900/90 dark:to-slate-900 rounded-2xl border border-slate-200/80 dark:border-purple-800/40 hover:border-purple-300 dark:hover:border-purple-500/70 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-purple-300/80 uppercase tracking-wider">Total Headcount</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 flex items-center justify-center transition-transform group-hover:scale-110">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">
            {totalEmployees}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% Active</span> • Full-Time & Contract
          </div>
        </div>

        {/* Card 2: Present Today (Emerald Hue in Dark Mode) */}
        <div 
          onClick={() => setActiveTab('attendance')}
          className="p-5 bg-white dark:bg-gradient-to-br dark:from-emerald-950/40 dark:via-slate-900/90 dark:to-slate-900 rounded-2xl border border-slate-200/80 dark:border-emerald-800/40 hover:border-emerald-300 dark:hover:border-emerald-500/70 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-emerald-300/80 uppercase tracking-wider">Present Today</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center transition-transform group-hover:scale-110">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">
            {presentTodayCount} <span className="text-sm font-normal text-slate-400 dark:text-slate-500">/ {totalEmployees}</span>
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{attendanceRate}% Attendance Rate</span>
          </div>
        </div>

        {/* Card 3: Pending Approvals (Amber Hue in Dark Mode) */}
        <div 
          onClick={() => setActiveTab('leaves')}
          className="p-5 bg-white dark:bg-gradient-to-br dark:from-amber-950/40 dark:via-slate-900/90 dark:to-slate-900 rounded-2xl border border-slate-200/80 dark:border-amber-800/40 hover:border-amber-300 dark:hover:border-amber-500/70 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-amber-300/80 uppercase tracking-wider">Leave Approvals</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center transition-transform group-hover:scale-110">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">
            {pendingLeaves.length}
          </div>
          <div className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-1">
            {pendingLeaves.length > 0 ? 'Awaiting HR action' : 'All requests processed'}
          </div>
        </div>

        {/* Card 4: Monthly Payroll Cost (Teal/Cyan Hue in Dark Mode) */}
        <div 
          onClick={() => setActiveTab('payroll')}
          className="p-5 bg-white dark:bg-gradient-to-br dark:from-cyan-950/40 dark:via-slate-900/90 dark:to-slate-900 rounded-2xl border border-slate-200/80 dark:border-cyan-800/40 hover:border-teal-300 dark:hover:border-cyan-500/70 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-cyan-300/80 uppercase tracking-wider">Monthly Payroll</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-cyan-900/50 text-teal-700 dark:text-cyan-300 flex items-center justify-center transition-transform group-hover:scale-110">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">
            ${totalMonthlyPayroll.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Across 6 departments
          </div>
        </div>

      </div>

      {/* Main Grid: Pending Approvals Queue + Employee Quick Switcher */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Section 3.5.2 Leave Approvals Inbox */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base font-display flex items-center gap-2">
                  <span>Pending Leave Approvals Queue</span>
                  {pendingLeaves.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300">
                      {pendingLeaves.length} Action Needed
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Approve or reject requests with immediate employee record sync</p>
              </div>
              <button
                onClick={() => setActiveTab('leaves')}
                className="text-xs font-semibold text-purple-700 dark:text-purple-400 hover:underline cursor-pointer"
              >
                All Requests ({leaveRequests.length})
              </button>
            </div>

            {pendingLeaves.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                <CheckCircle className="w-10 h-10 text-emerald-500 dark:text-emerald-400 mx-auto mb-2 opacity-80" />
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">All leave requests are up to date</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">New employee time-off applications will appear here in real-time.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingLeaves.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl border border-purple-100 dark:border-purple-900/50 bg-purple-50/30 dark:bg-purple-950/25 hover:bg-purple-50/60 dark:hover:bg-purple-950/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={req.employeeAvatar}
                        alt={req.employeeName}
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-purple-300 dark:ring-purple-700 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{req.employeeName}</h4>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">({req.employeeId})</span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300">
                            {req.leaveType}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-1">
                          📅 {req.startDate} to {req.endDate} ({req.totalDays} {req.totalDays === 1 ? 'day' : 'days'})
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 italic">
                          "{req.reason}"
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => handleApproveLeave(req.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleOpenRejectModal(req.id)}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800 text-slate-700 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-400 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PDF Section 3.2.2: Employee List & Switch Ability */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base font-display">
                  Employee Directory & Quick Switch
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Switch context between team members or edit records</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter directory..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-purple-400 dark:focus:border-purple-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-semibold uppercase text-[10px]">
                    <th className="pb-2 pl-2">Employee</th>
                    <th className="pb-2">Department</th>
                    <th className="pb-2">Designation</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors group">
                      <td className="py-2.5 pl-2">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={emp.avatar}
                            alt={emp.firstName}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                              {emp.firstName} {emp.lastName}
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                              {emp.employeeId}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 text-slate-600 dark:text-slate-300 font-medium">
                        {emp.jobDetails.department}
                      </td>

                      <td className="py-2.5 text-slate-500 dark:text-slate-400">
                        {emp.jobDetails.designation}
                      </td>

                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                          {emp.status}
                        </span>
                      </td>

                      <td className="py-2.5 text-right pr-2">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => switchUser(emp.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-600 dark:hover:bg-purple-600 hover:text-white text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-colors cursor-pointer"
                            title="Switch view to this employee"
                          >
                            Switch User
                          </button>
                          <button
                            onClick={() => openEmployeeProfile(emp)}
                            className="p-1 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 rounded cursor-pointer"
                            title="View / Edit Profile"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right 1 Col: Department Distribution & Quick Actions */}
        <div className="space-y-6">
          
          {/* Department Breakdown */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm font-display mb-3">
              Department Headcount
            </h3>

            <div className="space-y-2.5">
              {[
                { name: 'Engineering', count: employees.filter((e) => e.jobDetails.department === 'Engineering').length, color: 'bg-purple-600' },
                { name: 'Human Resources', count: employees.filter((e) => e.jobDetails.department === 'Human Resources').length, color: 'bg-indigo-600' },
                { name: 'Product & Design', count: employees.filter((e) => e.jobDetails.department === 'Product & Design').length, color: 'bg-teal-500' },
                { name: 'Marketing', count: employees.filter((e) => e.jobDetails.department === 'Marketing').length, color: 'bg-amber-500' },
                { name: 'Sales', count: employees.filter((e) => e.jobDetails.department === 'Sales').length, color: 'bg-rose-500' },
              ].map((dept) => (
                <div key={dept.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{dept.name}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{dept.count} members</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${dept.color}`}
                      style={{ width: `${(dept.count / Math.max(totalEmployees, 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveTab('analytics')}
              className="w-full mt-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-700 dark:text-purple-400 font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>View Full Analytics</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-slate-900 rounded-2xl border border-purple-100 dark:border-purple-900/50 p-5">
            <h3 className="font-bold text-purple-950 dark:text-purple-200 text-sm font-display mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>HR Admin Tools</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">Instant operational management shortcuts</p>

            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('attendance')}
                className="w-full p-2.5 bg-white dark:bg-slate-900/90 hover:bg-purple-600 dark:hover:bg-purple-600 hover:text-white rounded-xl text-left text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-xs border border-purple-100 dark:border-purple-900/50 transition-all flex items-center justify-between group cursor-pointer"
              >
                <span>Review & Regularize Attendance</span>
                <ChevronRight className="w-4 h-4 text-purple-400 group-hover:text-white" />
              </button>

              <button
                onClick={() => setActiveTab('payroll')}
                className="w-full p-2.5 bg-white dark:bg-slate-900/90 hover:bg-teal-600 dark:hover:bg-teal-600 hover:text-white rounded-xl text-left text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-xs border border-purple-100 dark:border-purple-900/50 transition-all flex items-center justify-between group cursor-pointer"
              >
                <span>Edit Salary Structures & Slips</span>
                <ChevronRight className="w-4 h-4 text-teal-400 group-hover:text-white" />
              </button>

              <button
                onClick={() => setActiveTab('employees')}
                className="w-full p-2.5 bg-white dark:bg-slate-900/90 hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:text-white rounded-xl text-left text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-xs border border-purple-100 dark:border-purple-900/50 transition-all flex items-center justify-between group cursor-pointer"
              >
                <span>Add / Manage Team Documents</span>
                <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:text-white" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Reject Leave Request Comment Modal */}
      {commentModalLeaveId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
              Reject Leave Application
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Please provide a reason or note for the employee.
            </p>

            <form onSubmit={handleConfirmReject} className="mt-4 space-y-3">
              <textarea
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="e.g., Overlapping team sprint delivery deadline, please reschedule."
                rows={3}
                className="w-full p-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-200 focus:border-rose-500 outline-none"
                required
              />

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setCommentModalLeaveId(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

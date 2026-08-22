import React from 'react';
import { useHR } from '../../context/HRContext';
import { 
  Clock, 
  CalendarDays, 
  User, 
  Banknote, 
  Play, 
  Square, 
  Coffee, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  TrendingUp,
  FileText,
  Calendar,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { motion } from 'motion/react';

export const EmployeeDashboard: React.FC = () => {
  const { 
    currentUser, 
    checkInState, 
    checkIn, 
    checkOut, 
    toggleBreak, 
    leaveRequests, 
    attendanceRecords,
    payslips,
    setActiveTab, 
    openEmployeeProfile,
    openAuthModal,
    signOut
  } = useHR();

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-12 text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-slate-600 mb-4 text-xs">Please sign in to view your employee dashboard.</p>
        <button
          onClick={() => openAuthModal('signin')}
          className="px-4 py-2 bg-purple-600 text-white rounded-xl font-medium text-xs shadow-md"
        >
          Sign In
        </button>
      </div>
    );
  }

  // Employee's own pending and recent leaves
  const myLeaves = leaveRequests.filter((l) => l.employeeId === currentUser.employeeId);
  const myLatestPayslip = payslips.find((p) => p.employeeId === currentUser.employeeId);
  
  // Recent attendance for this employee
  const myAttendance = attendanceRecords.filter((a) => a.employeeId === currentUser.employeeId).slice(0, 5);

  // Time formatter helper
  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const todayDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Welcome Banner with Live Check-In Punch Widget */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Abstract background graphics */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-purple-500/20 to-transparent pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Greeting */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-purple-200 text-xs font-semibold border border-white/10">
              <Calendar className="w-3.5 h-3.5 text-teal-300" />
              <span>{todayDateFormatted}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
              Good day, {currentUser.firstName}! 👋
            </h1>
            <p className="text-sm text-purple-200/90 max-w-lg leading-relaxed">
              {currentUser.jobDetails.designation} • {currentUser.jobDetails.department}
            </p>
          </div>

          {/* Interactive Check-In / Check-Out Punch Card (PDF Section 3.4.1) */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-5 shrink-0 shadow-lg">
            <div className="text-center sm:text-left">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-purple-200">
                Today's Working Clock
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-bold tracking-wider text-white mt-0.5">
                {checkInState.isCheckedIn
                  ? formatTimer(checkInState.accumulatedWorkedSeconds)
                  : '00:00:00'}
              </div>
              <div className="text-xs text-purple-200 mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                <span className={`w-2 h-2 rounded-full ${checkInState.isCheckedIn ? (checkInState.isOnBreak ? 'bg-amber-400' : 'bg-emerald-400 animate-ping') : 'bg-slate-400'}`} />
                <span>
                  {checkInState.isCheckedIn
                    ? checkInState.isOnBreak
                      ? 'On Lunch / Rest Break'
                      : `Punched in at ${checkInState.checkInTimestamp || '09:00 AM'}`
                    : 'Currently Checked Out'}
                </span>
              </div>
            </div>

            {/* Punch Controls */}
            <div className="flex items-center gap-2">
              {!checkInState.isCheckedIn ? (
                <button
                  onClick={checkIn}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-500/25 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Check In
                </button>
              ) : (
                <>
                  <button
                    onClick={toggleBreak}
                    className={`px-3.5 py-2.5 rounded-xl font-medium text-xs border transition-all flex items-center gap-1.5 ${
                      checkInState.isOnBreak
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md'
                        : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                    }`}
                  >
                    <Coffee className="w-4 h-4" />
                    {checkInState.isOnBreak ? 'End Break' : 'Take Break'}
                  </button>

                  <button
                    onClick={checkOut}
                    className="px-4 py-2.5 rounded-xl bg-rose-500/90 hover:bg-rose-600 text-white font-semibold text-xs sm:text-sm border border-rose-400/30 transition-all flex items-center gap-1.5 shadow-md shadow-rose-500/25 hover:scale-105 active:scale-95"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    Check Out
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PDF Section 3.2.1: Quick-Access Cards */}
      <div>
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">
          Quick Access Hub
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Card 1: My Profile */}
          <div
            onClick={() => openEmployeeProfile(currentUser)}
            className="group p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-purple-300 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <User className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-purple-700 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                View <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-purple-700 transition-colors">
                My Profile
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Personal, job & contact info
              </p>
            </div>
          </div>

          {/* Card 2: Attendance */}
          <div
            onClick={() => setActiveTab('attendance')}
            className="group p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                Logs <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                Attendance
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Daily/weekly logs & working hours
              </p>
            </div>
          </div>

          {/* Card 3: Leave Requests */}
          <div
            onClick={() => setActiveTab('leaves')}
            className="group p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CalendarDays className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                Apply <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-700 transition-colors">
                Leave Requests
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Apply & check approval status
              </p>
            </div>
          </div>

          {/* Card 4: Payroll & Payslips */}
          <div
            onClick={() => setActiveTab('payroll')}
            className="group p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-teal-300 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Banknote className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-teal-700 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                View <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-teal-700 transition-colors">
                Salary & Payslips
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Read-only payroll & slip download
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Main Grid: Leave Balances + Recent Activity & Payslip Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Leave Balances & Upcoming Leave Status */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Leave Balances */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base font-display">
                  Leave Balances & Allowances
                </h3>
                <p className="text-xs text-slate-500">Available time-off quota for current fiscal year</p>
              </div>
              <button
                onClick={() => setActiveTab('leaves')}
                className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
              >
                Apply Leave <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Paid Leave */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span>Paid Annual Leave</span>
                  <span className="text-purple-600 font-bold">{currentUser.leaveBalance.paidLeave.remaining} days left</span>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-slate-900 font-display">
                    {currentUser.leaveBalance.paidLeave.remaining}
                    <span className="text-xs text-slate-400 font-normal ml-1">/ {currentUser.leaveBalance.paidLeave.total}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-purple-600 h-full rounded-full transition-all"
                      style={{
                        width: `${(currentUser.leaveBalance.paidLeave.remaining / currentUser.leaveBalance.paidLeave.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Sick Leave */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span>Sick Leave</span>
                  <span className="text-emerald-600 font-bold">{currentUser.leaveBalance.sickLeave.remaining} days left</span>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-slate-900 font-display">
                    {currentUser.leaveBalance.sickLeave.remaining}
                    <span className="text-xs text-slate-400 font-normal ml-1">/ {currentUser.leaveBalance.sickLeave.total}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{
                        width: `${(currentUser.leaveBalance.sickLeave.remaining / currentUser.leaveBalance.sickLeave.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Casual Leave */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span>Casual / Floating</span>
                  <span className="text-indigo-600 font-bold">{currentUser.leaveBalance.casualLeave.remaining} days left</span>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-slate-900 font-display">
                    {currentUser.leaveBalance.casualLeave.remaining}
                    <span className="text-xs text-slate-400 font-normal ml-1">/ {currentUser.leaveBalance.casualLeave.total}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all"
                      style={{
                        width: `${(currentUser.leaveBalance.casualLeave.remaining / currentUser.leaveBalance.casualLeave.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* My Leave Requests & History */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base font-display">
                  My Recent Leave Applications
                </h3>
                <p className="text-xs text-slate-500">Track approvals and review comments from HR</p>
              </div>
              <button
                onClick={() => setActiveTab('leaves')}
                className="text-xs font-semibold text-purple-700 hover:underline"
              >
                View all
              </button>
            </div>

            {myLeaves.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No leave requests filed yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {myLeaves.slice(0, 3).map((leave) => (
                  <div
                    key={leave.id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                        <CalendarDays className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{leave.leaveType} Leave</span>
                          <span className="text-[10px] text-slate-500 font-medium">({leave.totalDays} {leave.totalDays === 1 ? 'day' : 'days'})</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 truncate">
                          {leave.startDate} to {leave.endDate} • {leave.reason}
                        </p>
                        {leave.adminComments && (
                          <p className="text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded mt-1.5 inline-block">
                            HR Note: "{leave.adminComments}"
                          </p>
                        )}
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                        leave.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : leave.status === 'Rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800 animate-pulse'
                      }`}
                    >
                      {leave.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right 1 Col: Salary Snapshot & Recent Attendance Log */}
        <div className="space-y-6">
          
          {/* Latest Salary Card */}
          {myLatestPayslip && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Payroll Snapshot
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                  {myLatestPayslip.status}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100">
                <div className="text-xs text-slate-500 font-medium">
                  {myLatestPayslip.month} {myLatestPayslip.year} Net Disbursed
                </div>
                <div className="text-2xl font-bold text-purple-950 font-display mt-0.5">
                  ${myLatestPayslip.netPay.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 mt-2 flex justify-between pt-2 border-t border-purple-200/50">
                  <span>Gross: ${myLatestPayslip.grossEarnings.toLocaleString()}</span>
                  <span>Deductions: ${myLatestPayslip.totalDeductions.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('payroll')}
                className="w-full mt-3 py-2 rounded-xl bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                View & Download Payslip
              </button>
            </div>
          )}

          {/* Recent Attendance Mini Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm font-display">
                Recent Attendance
              </h3>
              <button
                onClick={() => setActiveTab('attendance')}
                className="text-[11px] font-semibold text-purple-700 hover:underline"
              >
                View Logs
              </button>
            </div>

            <div className="space-y-2">
              {myAttendance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 text-xs border border-slate-100"
                >
                  <div>
                    <div className="font-semibold text-slate-800">{record.date}</div>
                    <div className="text-[10px] text-slate-500">
                      {record.checkInTime || '--'} - {record.checkOutTime || '--'}
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        record.status === 'present'
                          ? 'bg-emerald-100 text-emerald-800'
                          : record.status === 'leave'
                          ? 'bg-purple-100 text-purple-800'
                          : record.status === 'half-day'
                          ? 'bg-amber-100 text-amber-800'
                          : record.status === 'absent'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {record.status}
                    </span>
                    {record.totalHoursWorked > 0 && (
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {record.totalHoursWorked} hrs
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

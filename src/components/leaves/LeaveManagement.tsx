import React, { useState } from 'react';
import { useHR } from '../../context/HRContext';
import { LeaveType, LeaveRequest, LeaveStatus } from '../../types';
import { 
  CalendarDays, 
  Send, 
  Check, 
  X, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Filter, 
  Calendar, 
  User, 
  Sparkles,
  Info,
  ChevronDown,
  MessageSquare
} from 'lucide-react';

export const LeaveManagement: React.FC = () => {
  const { 
    currentUser, 
    currentRole, 
    leaveRequests, 
    applyLeave, 
    reviewLeave,
    openAuthModal,
    addToast
  } = useHR();

  const isAdmin = currentRole === 'admin';

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-12 text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-slate-600 mb-4 text-xs">Please sign in to view and manage leave requests.</p>
        <button
          onClick={() => openAuthModal('signin')}
          className="px-4 py-2 bg-purple-600 text-white rounded-xl font-medium text-xs shadow-md"
        >
          Sign In
        </button>
      </div>
    );
  }

  // Apply Leave Form state
  const [leaveType, setLeaveType] = useState<LeaveType>('Paid');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle start date changes: automatically update end date if it is behind start date or if single-day leave or half-day
  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    if (isHalfDay) {
      setEndDate(newStart);
    } else if (!endDate || endDate < newStart || endDate === startDate) {
      setEndDate(newStart);
    }
  };

  // Handle end date changes: if half day was ticked and end date is changed, remove the half day tick
  const handleEndDateChange = (newEnd: string) => {
    if (isHalfDay) {
      setIsHalfDay(false);
    }
    if (startDate && newEnd < startDate) {
      setEndDate(startDate);
    } else {
      setEndDate(newEnd);
    }
  };

  // Handle half-day checkbox toggle: synchronize end date with start date when checked
  const handleHalfDayToggle = (checked: boolean) => {
    setIsHalfDay(checked);
    if (checked) {
      setEndDate(startDate);
    }
  };

  // Filter state for requests table
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  // Review comment modal state
  const [selectedRequestForReview, setSelectedRequestForReview] = useState<LeaveRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'Approved' | 'Rejected'>('Approved');
  const [reviewComment, setReviewComment] = useState('');

  // Calculate day difference
  const calculateTotalDays = () => {
    if (isHalfDay) return 0.5;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return 1;
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    return Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay) + 1;
  };

  const totalDays = calculateTotalDays();

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      addToast('warning', 'Missing Reason', 'Please provide a brief reason for your leave request.');
      return;
    }

    setIsSubmitting(true);
    applyLeave({
      leaveType,
      startDate,
      endDate,
      totalDays,
      isHalfDay,
      reason,
    });

    // Reset form
    const todayStr = new Date().toISOString().split('T')[0];
    setStartDate(todayStr);
    setEndDate(todayStr);
    setReason('');
    setIsHalfDay(false);
    setIsSubmitting(false);
  };

  const handleOpenReview = (req: LeaveRequest, action: 'Approved' | 'Rejected') => {
    setSelectedRequestForReview(req);
    setReviewAction(action);
    setReviewComment(action === 'Approved' ? 'Approved by HR Director.' : 'Unable to approve due to team schedule overlap.');
  };

  const handleConfirmReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestForReview) return;
    reviewLeave(selectedRequestForReview.id, reviewAction, reviewComment);
    setSelectedRequestForReview(null);
  };

  // Filtered leave list
  const visibleRequests = leaveRequests.filter((req) => {
    // If regular employee, only show their own requests unless admin
    if (!isAdmin && req.employeeId !== currentUser.employeeId) return false;
    
    const matchStatus = statusFilter === 'All' || req.status === statusFilter;
    const matchType = typeFilter === 'All' || req.leaveType === typeFilter;
    return matchStatus && matchType;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="soft-banner rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/30 flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-purple-300" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-200">
              {isAdmin ? 'HR Leave Management & Approvals' : 'Employee Leave & Time-Off Portal'}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold font-display tracking-tight text-white mt-1">
            Leave & Time-Off Management
          </h1>
          <p className="text-xs sm:text-sm text-purple-200/90 mt-0.5">
            {isAdmin
              ? 'Review pending time-off requests, manage team quota allocations, and monitor leave calendar.'
              : `Current active balance: ${currentUser.leaveBalance.paidLeave.remaining} Paid • ${currentUser.leaveBalance.sickLeave.remaining} Sick • ${currentUser.leaveBalance.casualLeave.remaining} Casual`}
          </p>
        </div>

        {isAdmin && (
          <div className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center shrink-0">
            <div className="text-[10px] uppercase font-semibold text-purple-200">Pending Approvals</div>
            <div className="text-2xl font-bold font-display text-white">
              {leaveRequests.filter((l) => l.status === 'Pending').length}
            </div>
          </div>
        )}
      </div>

      {/* Leave Balances Strip (Always visible for active employee persona) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-slate-700">Paid Annual Leave</span>
            <span className="text-purple-600 font-bold">{currentUser.leaveBalance.paidLeave.remaining} remaining</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-display">
            {currentUser.leaveBalance.paidLeave.remaining} <span className="text-xs text-slate-400 font-normal">/ {currentUser.leaveBalance.paidLeave.total}</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-purple-600 h-full rounded-full"
              style={{ width: `${(currentUser.leaveBalance.paidLeave.remaining / currentUser.leaveBalance.paidLeave.total) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-slate-700">Sick Leave</span>
            <span className="text-emerald-600 font-bold">{currentUser.leaveBalance.sickLeave.remaining} remaining</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-display">
            {currentUser.leaveBalance.sickLeave.remaining} <span className="text-xs text-slate-400 font-normal">/ {currentUser.leaveBalance.sickLeave.total}</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{ width: `${(currentUser.leaveBalance.sickLeave.remaining / currentUser.leaveBalance.sickLeave.total) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-slate-700">Casual / Floating</span>
            <span className="text-indigo-600 font-bold">{currentUser.leaveBalance.casualLeave.remaining} remaining</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-display">
            {currentUser.leaveBalance.casualLeave.remaining} <span className="text-xs text-slate-400 font-normal">/ {currentUser.leaveBalance.casualLeave.total}</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full"
              style={{ width: `${(currentUser.leaveBalance.casualLeave.remaining / currentUser.leaveBalance.casualLeave.total) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-slate-700">Unpaid Leave</span>
            <span className="text-slate-500 font-bold">{currentUser.leaveBalance.unpaidLeave.used} used</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-display">
            {currentUser.leaveBalance.unpaidLeave.used} <span className="text-xs text-slate-400 font-normal">days logged</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
            <div className="bg-slate-400 h-full rounded-full" style={{ width: `30%` }} />
          </div>
        </div>

      </div>

      {/* Main Grid: Apply for Leave Form (PDF 3.5.1) + Approvals / Request Table (PDF 3.5.2) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 1 Col: Apply for Leave Form (Section 3.5.1 of PDF) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs h-fit">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Send className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm font-display">
              Apply for Time-Off
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Submit a leave request. Requests are forwarded directly to HR / Admin.
          </p>

          <form onSubmit={handleApplySubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Leave Type *
              </label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:border-purple-600 outline-none"
              >
                <option value="Paid">Paid Leave (Annual)</option>
                <option value="Sick">Sick Leave</option>
                <option value="Casual">Casual / Personal Leave</option>
                <option value="Unpaid">Unpaid Leave (Loss of Pay)</option>
                <option value="Maternity/Paternity">Maternity / Paternity Leave</option>
              </select>
            </div>

            {/* Half-Day Leave Request (Moved above Start Date & End Date) */}
            <div className="flex items-center p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <label className="text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-2 select-none w-full">
                <input
                  type="checkbox"
                  checked={isHalfDay}
                  onChange={(e) => handleHalfDayToggle(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                />
                <span>Half-Day Request (0.5 Day)</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-purple-600 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-purple-600 outline-none"
                  required
                />
              </div>
            </div>

            {/* Separate Total Duration Display Bar */}
            <div className="flex items-center justify-between p-2.5 bg-purple-50/80 rounded-xl border border-purple-100">
              <span className="text-xs font-semibold text-purple-900 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-600" />
                Total Duration
              </span>
              <span className="text-xs font-bold text-purple-700 bg-white px-2.5 py-0.5 rounded-lg border border-purple-200/80 shadow-2xs">
                {totalDays} {totalDays === 1 ? 'day' : 'days'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason & Remarks *
              </label>
              <textarea
                rows={3}
                placeholder="Describe reason for leave (e.g., medical appointment, family vacation, personal emergency)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:border-purple-600 outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-md shadow-purple-600/25 flex items-center justify-center gap-2 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Leave Application</span>
            </button>
          </form>
        </div>

        {/* Right 2 Cols: Leave Requests & Approvals Queue (PDF 3.5.2) */}
        <div className="lg:col-span-2 space-y-4">
          
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base font-display">
                  {isAdmin ? 'All Organization Leave Requests & Approvals' : 'My Leave Applications History'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isAdmin ? 'Approve or reject requests. Approved leaves deduct balance and update attendance.' : 'Track approval progress and HR remarks'}
                </p>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700 outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700 outline-none"
                >
                  <option value="All">All Types</option>
                  <option value="Paid">Paid</option>
                  <option value="Sick">Sick</option>
                  <option value="Casual">Casual</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>
            </div>

            {visibleRequests.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                No leave requests found matching filters.
              </div>
            ) : (
              <div className="space-y-3">
                {visibleRequests.map((req) => (
                  <div
                    key={req.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      req.status === 'Pending'
                        ? 'bg-purple-50/40 border-purple-200'
                        : req.status === 'Approved'
                        ? 'bg-emerald-50/20 border-emerald-200/80'
                        : 'bg-rose-50/20 border-rose-200/80'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <img
                        src={req.employeeAvatar}
                        alt={req.employeeName}
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">
                            {req.employeeName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {req.employeeId}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-900">
                            {req.leaveType} Leave
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              req.status === 'Approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : req.status === 'Rejected'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800 animate-pulse'
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>

                        <div className="text-xs text-slate-700 font-medium mt-1">
                          📅 {req.startDate} to {req.endDate} • {req.totalDays} {req.totalDays === 1 ? 'day' : 'days'}
                        </div>

                        <p className="text-xs text-slate-600 mt-1 italic leading-relaxed">
                          "{req.reason}"
                        </p>

                        {req.adminComments && (
                          <div className="mt-2 text-[11px] text-purple-900 bg-purple-100/70 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                            <MessageSquare className="w-3 h-3 text-purple-600 shrink-0" />
                            <span>
                              <strong>HR Response:</strong> "{req.adminComments}" ({req.reviewedBy})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Admin Action Buttons (Section 3.5.2) */}
                    {isAdmin && req.status === 'Pending' && (
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          onClick={() => handleOpenReview(req, 'Approved')}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleOpenReview(req, 'Rejected')}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-700 hover:text-rose-700 text-xs font-semibold transition-all flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Review Comment Confirmation Modal */}
      {selectedRequestForReview && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
            <h3 className="text-base font-bold text-slate-900 font-display">
              {reviewAction === 'Approved' ? 'Approve Leave Request' : 'Reject Leave Request'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Confirm action for {selectedRequestForReview.employeeName} ({selectedRequestForReview.totalDays} days {selectedRequestForReview.leaveType} leave).
            </p>

            <form onSubmit={handleConfirmReview} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  HR Reviewer Comments / Feedback
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:border-purple-600 outline-none"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRequestForReview(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition-colors ${
                    reviewAction === 'Approved'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Confirm {reviewAction}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

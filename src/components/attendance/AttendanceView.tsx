import React, { useState } from 'react';
import { useHR } from '../../context/HRContext';
import { AttendanceRecord, AttendanceStatus, Department, LeaveRequest, LeaveType } from '../../types';
import { formatWorkedClock, formatWorkedHours, formatWorkedSeconds, getLocalDateKey } from '../../time';
import { ProfilePlaceholder } from '../common/ProfilePlaceholder';
import { 
  Clock, 
  Play, 
  Square, 
  Coffee, 
  Calendar, 
  Filter, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ShieldAlert, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays,
  Plus,
  SlidersHorizontal,
  Edit2,
  Database,
  RefreshCw,
  Activity
} from 'lucide-react';

type TimeInputMode = 'time' | 'analog';

const parseTimeToMinutes = (value: string) => {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  let hours = Number(match[1]) % 12;
  if (match[3].toUpperCase() === 'PM') hours += 12;
  return hours * 60 + Number(match[2]);
};

const formatMinutesToTime = (minutes: number) => {
  const normalized = Math.max(0, Math.min(1439, Math.round(minutes)));
  const hours24 = Math.floor(normalized / 60);
  const hours12 = hours24 % 12 || 12;
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  return `${String(hours12).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')} ${suffix}`;
};

const formatTimeForInput = (value: string) => {
  const minutes = parseTimeToMinutes(value);
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
};

const parseTimeInput = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number);
  return (hours * 60) + minutes;
};

interface TimeSelectorProps {
  label: string;
  value: string;
  mode: TimeInputMode;
  onModeChange: (mode: TimeInputMode) => void;
  onChange: (value: string) => void;
}

const TimeSelector: React.FC<TimeSelectorProps> = ({ label, value, mode, onModeChange, onChange }) => (
  <div>
    <div className="flex items-center justify-between gap-2 mb-1.5">
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</label>
      <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 p-0.5" role="group" aria-label={`${label} input mode`}>
        {(['time', 'analog'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onModeChange(option)}
            className={`px-2 py-1 text-[10px] font-semibold capitalize rounded-md transition-colors ${mode === option ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
            aria-pressed={mode === option}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
    {mode === 'time' ? (
      <input
        type="time"
        value={formatTimeForInput(value)}
        onChange={(event) => onChange(formatMinutesToTime(parseTimeInput(event.target.value)))}
        className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
      />
    ) : (
      <div className="px-3 py-2.5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50 dark:bg-purple-950/30">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-600 dark:text-purple-300" />
          <span className="text-sm font-mono font-bold text-purple-800 dark:text-purple-200">{value}</span>
        </div>
        <input
          type="range"
          min="0"
          max="1439"
          value={parseTimeToMinutes(value)}
          onChange={(event) => onChange(formatMinutesToTime(Number(event.target.value)))}
          className="w-full mt-2 accent-purple-600"
          aria-label={`Adjust ${label.toLowerCase()} using analog control`}
        />
        <div className="flex justify-between text-[9px] text-purple-600 dark:text-purple-300"><span>12 AM</span><span>12 PM</span><span>11:59 PM</span></div>
      </div>
    )}
  </div>
);

export const AttendanceView: React.FC = () => {
  const { 
    currentUser, 
    currentRole, 
    attendanceRecords, 
    attendanceDbLogs,
    leaveRequests,
    refreshAttendanceLogs,
    employees, 
    checkInState, 
    checkIn, 
    checkOut, 
    toggleBreak, 
    markAttendanceManual,
    updateLeaveRequest,
    reviewLeave,
    addToast
  } = useHR();

  const isAdmin = currentRole === 'admin';

  const [viewMode, setViewMode] = useState<'daily' | 'monthly' | 'db_logs'>('monthly');
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateKey());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(getLocalDateKey());
  const [searchEmployee, setSearchEmployee] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [regularizeModalRecord, setRegularizeModalRecord] = useState<AttendanceRecord | null>(null);
  const [selectedLeaveForEdit, setSelectedLeaveForEdit] = useState<LeaveRequest | null>(null);
  const [editLeaveType, setEditLeaveType] = useState<LeaveType>('Paid');
  const [editLeaveStart, setEditLeaveStart] = useState('');
  const [editLeaveEnd, setEditLeaveEnd] = useState('');
  const [editLeaveReason, setEditLeaveReason] = useState('');
  const [isRefreshingLogs, setIsRefreshingLogs] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshingLogs(true);
    await refreshAttendanceLogs();
    setTimeout(() => setIsRefreshingLogs(false), 400);
  };
  // Form state for regularizing/editing attendance
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('present');
  const [editCheckIn, setEditCheckIn] = useState('09:00 AM');
  const [editCheckOut, setEditCheckOut] = useState('05:30 PM');
  const [editHours, setEditHours] = useState(8.5);
  const [editBreakMinutes, setEditBreakMinutes] = useState(45);
  const [editNotes, setEditNotes] = useState('');
  const [timeInputMode, setTimeInputMode] = useState<TimeInputMode>('time');

  const calculateWorkedHours = (checkIn: string, checkOut: string, breakMinutes: number) => {
    const parseTime = (value: string) => {
      const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (!match) return null;
      let hours = Number(match[1]) % 12;
      if (match[3].toUpperCase() === 'PM') hours += 12;
      return hours * 60 + Number(match[2]);
    };

    const start = parseTime(checkIn);
    const end = parseTime(checkOut);
    if (start === null || end === null || end <= start) return null;
    return Math.max(0, (end - start - Math.max(0, breakMinutes)) / 60);
  };

  // Filter records based on role
  // PDF 3.4.2: Employees can view only their own attendance; Admin can view all
  const visibleEmployees = isAdmin
    ? employees.filter((e) => {
        const matchesSearch =
          e.firstName.toLowerCase().includes(searchEmployee.toLowerCase()) ||
          e.lastName.toLowerCase().includes(searchEmployee.toLowerCase()) ||
          e.employeeId.toLowerCase().includes(searchEmployee.toLowerCase());
        const matchesDept = selectedDept === 'All' || e.jobDetails.department === selectedDept;
        return matchesSearch && matchesDept;
      })
    : currentUser 
      ? employees.filter((e) => e.id === currentUser.id)
      : [];

  // Build every date in the selected month for the attendance calendar.
  const getMonthlyDates = () => {
    const monthStart = new Date(`${selectedDate.slice(0, 7)}-01T00:00:00`);
    const dates: string[] = [];
    const cursor = new Date(monthStart);
    while (cursor.getMonth() === monthStart.getMonth()) {
      dates.push(getLocalDateKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
  };

  const monthlyDates = getMonthlyDates();
  const calendarStartOffset = new Date(`${selectedDate.slice(0, 7)}-01T00:00:00`).getDay();
  const calendarCells = [...Array(calendarStartOffset).fill(null), ...monthlyDates];
  const isWeekendDate = (date: string) => {
    const [year, month, day] = date.split('-').map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  const getLeaveForEmployeeAndDate = (employeeId: string, date: string): LeaveRequest | undefined => {
    return leaveRequests.find((request) => (
      request.employeeId === employeeId &&
      request.status !== 'Rejected' &&
      date >= request.startDate &&
      date <= request.endDate
    ));
  };

  const getMonthlyLabel = () => new Date(`${selectedDate.slice(0, 7)}-01T00:00:00`).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  const getRecordForEmployeeAndDate = (empId: string, date: string): AttendanceRecord | undefined => {
    return attendanceRecords.find((r) => r.employeeId === empId && r.date === date);
  };

  const handleOpenRegularize = (emp: typeof employees[0], date: string) => {
    if (!isAdmin) return;
    const existing: AttendanceRecord = getRecordForEmployeeAndDate(emp.employeeId, date) || {
      id: `att-${emp.employeeId}-${date}`,
      employeeId: emp.employeeId,
      date,
      checkInTime: '09:00 AM',
      checkOutTime: '05:30 PM',
      totalHoursWorked: 8.5,
      breakMinutes: 45,
      status: 'present',
      notes: '',
    };

    setRegularizeModalRecord(existing);
    setEditStatus(existing.status);
    setEditCheckIn(existing.checkInTime || '09:00 AM');
    setEditCheckOut(existing.checkOutTime || '05:30 PM');
    setEditHours(existing.totalHoursWorked || 8.0);
    setEditBreakMinutes(existing.breakMinutes || 0);
    setEditNotes(existing.notes || '');
    setEditLeaveType('Paid');
    setEditLeaveStart(date);
    setEditLeaveEnd(date);
    setEditLeaveReason(existing.notes || '');
  };

  const handleOpenLeaveEdit = (leave: LeaveRequest) => {
    if (!isAdmin) return;
    setSelectedLeaveForEdit(leave);
    setRegularizeModalRecord({
      id: `leave-edit-${leave.id}`,
      employeeId: leave.employeeId,
      date: leave.startDate,
      checkInTime: null,
      checkOutTime: null,
      totalHoursWorked: 0,
      breakMinutes: 0,
      status: 'leave',
    });
    setEditStatus('leave');
    setEditLeaveType(leave.leaveType);
    setEditLeaveStart(leave.startDate);
    setEditLeaveEnd(leave.endDate);
    setEditLeaveReason(leave.reason);
  };

  const handleCancelLeave = (leave: LeaveRequest) => {
    if (!isAdmin || !window.confirm(`Cancel ${leave.employeeName}'s leave request?`)) return;
    reviewLeave(leave.id, 'Rejected', 'Cancelled by HR from Attendance.');
  };

  const handleSaveRegularize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regularizeModalRecord) return;

    if (selectedLeaveForEdit || editStatus === 'leave') {
      if (editLeaveEnd < editLeaveStart) {
        addToast('warning', 'Invalid Leave Dates', 'The end date must be on or after the start date.');
        return;
      }
      const start = new Date(`${editLeaveStart}T00:00:00`);
      const end = new Date(`${editLeaveEnd}T00:00:00`);
      let totalDays = 0;
      const cursor = new Date(start);
      while (cursor <= end) {
        if (cursor.getDay() !== 0 && cursor.getDay() !== 6) totalDays += 1;
        cursor.setDate(cursor.getDate() + 1);
      }
      if (selectedLeaveForEdit) {
        updateLeaveRequest(selectedLeaveForEdit.id, {
          leaveType: editLeaveType,
          startDate: editLeaveStart,
          endDate: editLeaveEnd,
          totalDays: Math.max(totalDays, 1),
          isHalfDay: selectedLeaveForEdit.isHalfDay,
          reason: editLeaveReason,
        });
      } else {
        markAttendanceManual({
          ...regularizeModalRecord,
          status: 'leave',
          checkInTime: null,
          checkOutTime: null,
          totalHoursWorked: 0,
          breakMinutes: 0,
          notes: `${editLeaveType} Leave: ${editLeaveStart} to ${editLeaveEnd}. ${editLeaveReason}`,
        });
      }
      setSelectedLeaveForEdit(null);
      setRegularizeModalRecord(null);
      return;
    }

    markAttendanceManual({
      ...regularizeModalRecord,
      status: editStatus,
      checkInTime: (editStatus as string) === 'absent' || (editStatus as string) === 'leave' ? null : editCheckIn,
      checkOutTime: (editStatus as string) === 'absent' || (editStatus as string) === 'leave' ? null : editCheckOut,
      totalHoursWorked: (editStatus as string) === 'absent' || (editStatus as string) === 'leave' ? 0 : editHours,
      breakMinutes: (editStatus as string) === 'absent' || (editStatus as string) === 'leave' ? 0 : editBreakMinutes,
      notes: editNotes,
    });

    setRegularizeModalRecord(null);
  };

  // Status Badge Component
  const renderStatusBadge = (status: AttendanceStatus, hours?: number) => {
    switch (status) {
      case 'present':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Present {hours ? `(${formatWorkedClock(hours)})` : ''}
          </span>
        );
      case 'absent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Absent
          </span>
        );
      case 'half-day':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Half-Day {hours ? `(${formatWorkedClock(hours)})` : ''}
          </span>
        );
      case 'leave':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-purple-100 text-purple-800 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            On Leave
          </span>
        );
      case 'weekend':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-500 border border-slate-200">
            Weekend
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-400">
            --
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Header & Punch Station Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/30 flex items-center justify-center">
              <Clock className="w-4 h-4 text-purple-300" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-200">
              {isAdmin ? 'Organization Attendance Central' : 'My Attendance & Punch Station'}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold font-display tracking-tight text-white mt-1">
            Attendance Tracking
          </h1>
          <p className="text-xs sm:text-sm text-purple-200/90 mt-0.5">
            {isAdmin
              ? `Reviewing attendance records across all ${employees.length} team members. Admin regularize enabled.`
              : currentUser 
                ? `Logged in as ${currentUser.firstName} ${currentUser.lastName} (${currentUser.employeeId}).`
                : 'Please sign in to view your attendance.'}
          </p>
        </div>

        {/* Real-Time Punch Widget */}
        <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl flex items-center gap-4 shrink-0 shadow-lg">
          <div>
            <div className="text-[10px] uppercase font-semibold tracking-wider text-purple-200">
              Active Clock
            </div>
            <div className="text-xl sm:text-2xl font-mono font-bold tracking-wider text-white">
              {checkInState.isCheckedIn
                ? formatWorkedSeconds(checkInState.accumulatedWorkedSeconds)
                : '0 hr 0 min'}
            </div>
            <div className="text-[11px] text-purple-200 flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${checkInState.isCheckedIn ? (checkInState.isOnBreak ? 'bg-amber-400' : 'bg-emerald-400 animate-ping') : 'bg-slate-400'}`} />
              <span>
                {checkInState.isCheckedIn
                  ? checkInState.isOnBreak
                    ? 'On Break'
                    : 'Punched In'
                  : 'Punched Out'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!checkInState.isCheckedIn ? (
              <button
                onClick={checkIn}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs shadow-md shadow-emerald-500/25 flex items-center gap-1.5 transition-all hover:scale-105"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Check In</span>
              </button>
            ) : (
              <>
                <button
                  onClick={toggleBreak}
                  className={`px-3 py-2 rounded-xl font-medium text-xs border transition-all flex items-center gap-1 ${
                    checkInState.isOnBreak
                      ? 'bg-amber-400 text-slate-950 font-bold border-amber-300'
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                  }`}
                >
                  <Coffee className="w-3.5 h-3.5" />
                  <span>{checkInState.isOnBreak ? 'Resume' : 'Break'}</span>
                </button>
                <button
                  onClick={checkOut}
                  className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs shadow-md shadow-rose-500/25 flex items-center gap-1 transition-all hover:scale-105"
                >
                  <Square className="w-3 h-3 fill-white" />
                  <span>Check Out</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Control Bar: Attendance Views & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* View Mode Buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setViewMode('monthly')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'monthly'
                  ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Monthly Grid
            </button>
            <button
              onClick={() => setViewMode('daily')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'daily'
                  ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Daily Timeline
            </button>
          </div>

          {/* Date Picker & Search */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const d = new Date(selectedDate);
                  if (viewMode === 'monthly') d.setMonth(d.getMonth() - 1);
                  else d.setDate(d.getDate() - 1);
                  const nextDate = getLocalDateKey(d);
                  setSelectedDate(nextDate);
                  if (viewMode === 'monthly') setSelectedCalendarDate(nextDate);
                }}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <input
                type={viewMode === 'monthly' ? 'month' : 'date'}
                value={viewMode === 'monthly' ? selectedDate.slice(0, 7) : selectedDate}
                onChange={(e) => {
                  const nextDate = viewMode === 'monthly' ? `${e.target.value}-01` : e.target.value;
                  setSelectedDate(nextDate);
                  if (viewMode === 'monthly') setSelectedCalendarDate(nextDate);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 rounded-xl border border-slate-200 outline-none"
              />

              <button
                onClick={() => {
                  const d = new Date(selectedDate);
                  if (viewMode === 'monthly') d.setMonth(d.getMonth() + 1);
                  else d.setDate(d.getDate() + 1);
                  const nextDate = getLocalDateKey(d);
                  setSelectedDate(nextDate);
                  if (viewMode === 'monthly') setSelectedCalendarDate(nextDate);
                }}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {isAdmin && (
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter team..."
                  value={searchEmployee}
                  onChange={(e) => setSearchEmployee(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 rounded-xl border border-slate-200 outline-none"
                />
              </div>
            )}
          </div>

        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-semibold text-slate-700">Status Types:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Present</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Absent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Half-Day</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span>Leave</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span>Weekend</span>
            </div>
          </div>

          {isAdmin && (
            <span className="text-purple-700 font-medium italic">
              * Click any cell to regularize / adjust attendance as HR Admin
            </span>
          )}
        </div>
      </div>

      {/* VIEW 1: MONTHLY GRID VIEW */}
      {viewMode === 'monthly' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm font-display">Attendance for {getMonthlyLabel()}</h3>
            <span className="text-[11px] text-slate-500">{visibleEmployees.length} employees</span>
          </div>
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="py-2 text-center text-[10px] font-bold uppercase tracking-wide text-slate-500">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 auto-rows-fr">
            {calendarCells.map((date, index) => {
              if (!date) return <div key={`empty-${index}`} className="min-h-28 border-r border-b border-slate-100 bg-slate-50/40" />;
              const isToday = date === getLocalDateKey();
              const isSelected = date === selectedCalendarDate;
              const dayRecords = visibleEmployees.map((emp) => ({
                employee: emp,
                record: getRecordForEmployeeAndDate(emp.employeeId, date),
                leave: getLeaveForEmployeeAndDate(emp.employeeId, date),
                isWeekend: isWeekendDate(date),
              })).filter(({ record, leave, isWeekend }) => record || leave || isWeekend);
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => setSelectedCalendarDate(date)}
                  className={`min-h-28 p-2 text-left align-top border-r border-b border-slate-100 transition-colors hover:bg-purple-50/60 ${isToday ? 'bg-purple-50/50' : 'bg-white'} ${isSelected ? 'ring-2 ring-inset ring-purple-500' : ''}`}
                  aria-label={`View attendance details for ${date}`}
                >
                  <div className={`text-xs font-bold ${isToday ? 'text-purple-700' : 'text-slate-700'}`}>{Number(date.slice(8))}</div>
                  <div className="mt-2 space-y-1">
                    {dayRecords.slice(0, 4).map(({ employee, record, leave, isWeekend }) => {
                      const isPending = leave?.status === 'Pending';
                      const status = leave ? (isPending ? 'pending' : 'leave') : record?.status || (isWeekend ? 'weekend' : undefined);
                      const statusColor = status === 'present' ? 'bg-emerald-500' : status === 'absent' ? 'bg-rose-500' : status === 'half-day' ? 'bg-amber-500' : status === 'pending' ? 'bg-amber-400' : status === 'leave' ? 'bg-purple-500' : 'bg-slate-400';
                      return (
                        <div key={employee.id} className="flex items-center gap-1 min-w-0">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${statusColor}`} />
                          <span className="truncate text-[9px] font-medium text-slate-600">{employee.firstName}</span>
                        </div>
                      );
                    })}
                    {dayRecords.length > 4 && <span className="text-[9px] text-slate-400">+{dayRecords.length - 4} more</span>}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="border-t border-slate-200 p-4 bg-slate-50/50">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h4 className="text-sm font-bold text-slate-900">Details for {selectedCalendarDate}</h4>
              {isAdmin && <span className="text-[10px] text-purple-700">Select a record to edit</span>}
            </div>
            <div className="space-y-2">
              {visibleEmployees.map((emp) => {
                const record = getRecordForEmployeeAndDate(emp.employeeId, selectedCalendarDate);
                const leave = getLeaveForEmployeeAndDate(emp.employeeId, selectedCalendarDate);
                const isWeekend = isWeekendDate(selectedCalendarDate);
                if (!record && !leave && !isWeekend) return null;
                return (
                  <div key={emp.id} onClick={() => leave ? handleOpenLeaveEdit(leave) : handleOpenRegularize(emp, selectedCalendarDate)} className="w-full flex flex-wrap items-center gap-3 p-3 text-left bg-white rounded-xl border border-slate-200 hover:border-purple-300 transition-colors cursor-pointer">
                    <ProfilePlaceholder label={`${emp.firstName} ${emp.lastName}`} className="w-8 h-8" />
                    <span className="text-xs font-bold text-slate-900 min-w-28">{emp.firstName} {emp.lastName}</span>
                    {leave ? <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${leave.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'}`}>{leave.status} {leave.leaveType} Leave</span> : record ? renderStatusBadge(record.status, record.totalHoursWorked) : renderStatusBadge('weekend')}
                    <span className="text-[11px] text-slate-500">{leave ? `${leave.startDate} to ${leave.endDate} • ${leave.totalDays} day(s) • ${leave.reason}` : record ? `${record.checkInTime || '--'} to ${record.checkOutTime || '--'} • ${record.breakMinutes || 0} min break${record.notes ? ` • ${record.notes}` : ''}` : 'Saturday / Sunday • Non-working day'}</span>
                    {leave && isAdmin && <button type="button" onClick={(event) => { event.stopPropagation(); handleCancelLeave(leave); }} className="ml-auto rounded-lg bg-rose-50 px-2.5 py-1.5 text-[10px] font-semibold text-rose-700 hover:bg-rose-100">Cancel Leave</button>}
                  </div>
                );
              })}
              {!isWeekendDate(selectedCalendarDate) && !visibleEmployees.some((emp) => getRecordForEmployeeAndDate(emp.employeeId, selectedCalendarDate) || getLeaveForEmployeeAndDate(emp.employeeId, selectedCalendarDate)) && <p className="text-xs text-slate-400">No attendance or leave details for this day.</p>}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: DAILY TIMELINE VIEW (PDF 3.4.1) */}
      {viewMode === 'daily' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm font-display">
              Attendance Roster for {selectedDate}
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Showing {visibleEmployees.length} employees
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Punch In</th>
                  <th className="py-3 px-4">Punch Out</th>
                  <th className="py-3 px-4">Worked Hours</th>
                  <th className="py-3 px-4">Break (mins)</th>
                  {isAdmin && <th className="py-3 px-4 text-right">Regularize</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleEmployees.map((emp) => {
                  const rec = getRecordForEmployeeAndDate(emp.employeeId, selectedDate);
                  const isWeekend = isWeekendDate(selectedDate);
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <ProfilePlaceholder label={`${emp.firstName} ${emp.lastName}`} className="w-8 h-8" />
                          <div>
                            <div className="font-bold text-slate-900">
                              {emp.firstName} {emp.lastName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {emp.employeeId} • {emp.jobDetails.designation}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {rec ? renderStatusBadge(rec.status) : isWeekend ? renderStatusBadge('weekend') : <span className="text-slate-400">Not recorded</span>}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700">
                        {rec?.checkInTime || (isWeekend ? 'Off' : '--')}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700">
                        {rec?.checkOutTime || (isWeekend ? 'Off' : rec?.status === 'present' ? <span className="text-emerald-600 font-semibold">Active In Office</span> : '--')}
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900">
                        {isWeekend ? '0 hr' : formatWorkedHours(rec?.totalHoursWorked)}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {isWeekend ? '0 min' : rec?.breakMinutes !== undefined ? `${rec.breakMinutes} min` : '--'}
                      </td>

                      {isAdmin && (
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenRegularize(emp, selectedDate)}
                            className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-[11px] transition-colors inline-flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Internal attendance telemetry is kept out of the presentation UI. */}
      {false && viewMode === 'db_logs' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
            <div>
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                  Supabase Attendance Database Audit Logs
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Real-time check-in, check-out, break intervals, and regularization telemetry persisted in <code className="font-mono text-purple-600 dark:text-purple-400">attendance_logs</code>.
              </p>
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={isRefreshingLogs}
              className="px-3.5 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 hover:bg-purple-200 dark:hover:bg-purple-900/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 font-semibold text-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingLogs ? 'animate-spin' : ''}`} />
              <span>Refresh DB Logs</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 font-semibold">
                  <th className="py-3 px-4">Event Time (UTC)</th>
                  <th className="py-3 px-4">Action Type</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Work Email</th>
                  <th className="py-3 px-4">Work Date</th>
                  <th className="py-3 px-4">Check In</th>
                  <th className="py-3 px-4">Check Out</th>
                  <th className="py-3 px-4">Worked Hrs</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {attendanceDbLogs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No database punch logs recorded yet. Check in or out to log telemetry into Supabase.
                    </td>
                  </tr>
                ) : (
                  attendanceDbLogs
                    .filter((log) => {
                      if (isAdmin) return true;
                      return log.email === currentUser?.email || log.employee_id === currentUser?.employeeId;
                    })
                    .map((log) => {
                      const actionBadge = (type: string) => {
                        switch (type) {
                          case 'CHECK_IN':
                            return <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold text-[10px]">CHECK IN</span>;
                          case 'CHECK_OUT':
                            return <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-semibold text-[10px]">CHECK OUT</span>;
                          case 'BREAK_START':
                            return <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold text-[10px]">BREAK START</span>;
                          case 'BREAK_END':
                            return <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 font-semibold text-[10px]">BREAK END</span>;
                          case 'MANUAL_PUNCH':
                            return <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 font-semibold text-[10px]">MANUAL REGULARIZATION</span>;
                          default:
                            return <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[10px]">{type}</span>;
                        }
                      };

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {new Date(log.created_at ?? log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            {actionBadge(log.action_type ?? log.actionType)}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                            {log.employee_name} <span className="text-slate-400 font-normal">({log.employee_id})</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-purple-700 dark:text-purple-300 text-[11px]">
                            {log.email}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px]">
                            {log.date}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px]">
                            {log.check_in_time || '--'}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px]">
                            {log.check_out_time || '--'}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                                {formatWorkedHours(log.total_hours_worked)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="capitalize font-medium">{log.status}</span>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {regularizeModalRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                  {selectedLeaveForEdit ? 'Edit Leave Request' : 'Regularize Attendance'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {selectedLeaveForEdit
                ? `HR changes for ${selectedLeaveForEdit.employeeName} are reflected in the calendar.`
                : `Override or adjust punch records for ${regularizeModalRecord.employeeId} on ${regularizeModalRecord.date}.`}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <form onSubmit={handleSaveRegularize} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as AttendanceStatus)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value="present">Present (Full Day)</option>
                  <option value="half-day">Half-Day</option>
                  <option value="absent">Absent</option>
                  <option value="leave">On Leave</option>
                  <option value="weekend">Weekend / Off</option>
                </select>
              </div>

              {editStatus === 'leave' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Leave Type</label>
                    <select value={editLeaveType} onChange={(event) => setEditLeaveType(event.target.value as LeaveType)} className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20">
                      <option value="Paid">Paid Leave</option>
                      <option value="Sick">Sick Leave</option>
                      <option value="Casual">Casual Leave</option>
                      <option value="Unpaid">Unpaid Leave</option>
                      <option value="Maternity/Paternity">Maternity / Paternity Leave</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Start Date<input type="date" value={editLeaveStart} onChange={(event) => setEditLeaveStart(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-normal text-slate-900 dark:text-slate-100" required /></label>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">End Date<input type="date" value={editLeaveEnd} onChange={(event) => setEditLeaveEnd(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-normal text-slate-900 dark:text-slate-100" required /></label>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Reason & Remarks</label>
                    <textarea value={editLeaveReason} onChange={(event) => setEditLeaveReason(event.target.value)} rows={3} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-xs text-slate-900 dark:text-slate-100" required />
                  </div>
                </>
              ) : (editStatus as string) !== 'absent' && (editStatus as string) !== 'leave' && (editStatus as string) !== 'weekend' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <TimeSelector
                      label="Check In Time"
                      value={editCheckIn}
                      mode={timeInputMode}
                      onModeChange={setTimeInputMode}
                      onChange={(value) => {
                        setEditCheckIn(value);
                        const calculated = calculateWorkedHours(value, editCheckOut, editBreakMinutes);
                        if (calculated !== null) setEditHours(calculated);
                      }}
                    />
                    <TimeSelector
                      label="Check Out Time"
                      value={editCheckOut}
                      mode={timeInputMode}
                      onModeChange={setTimeInputMode}
                      onChange={(value) => {
                        setEditCheckOut(value);
                        const calculated = calculateWorkedHours(editCheckIn, value, editBreakMinutes);
                        if (calculated !== null) setEditHours(calculated);
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">Total Work Time</div>
                      <div className="text-xl font-mono font-bold text-purple-700 dark:text-purple-300 mt-1">{formatWorkedClock(editHours)}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Calculated automatically</div>
                    </div>
                    <label className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 p-3">
                      <span className="block text-[10px] uppercase tracking-wider font-bold text-amber-700 dark:text-amber-300">Unpaid Break / Lunch</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={editBreakMinutes}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          setEditBreakMinutes(value);
                          const calculated = calculateWorkedHours(editCheckIn, editCheckOut, value);
                          if (calculated !== null) setEditHours(calculated);
                        }}
                        className="w-full mt-1 bg-transparent text-lg font-mono font-bold text-amber-900 dark:text-amber-200 outline-none"
                      />
                      <span className="text-[10px] text-amber-700 dark:text-amber-300">minutes excluded</span>
                    </label>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">HR Regularization Remarks</label>
                <input
                  type="text"
                  placeholder="e.g., Client on-site meeting regularization verified by Manager"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setRegularizeModalRecord(null);
                    setSelectedLeaveForEdit(null);
                  }}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs transition-colors"
                >
                  {editStatus === 'leave' ? 'Save Leave' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

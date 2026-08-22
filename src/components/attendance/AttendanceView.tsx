import React, { useState } from 'react';
import { useHR } from '../../context/HRContext';
import { AttendanceRecord, AttendanceStatus, Department } from '../../types';
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

export const AttendanceView: React.FC = () => {
  const { 
    currentUser, 
    currentRole, 
    attendanceRecords, 
    attendanceDbLogs,
    refreshAttendanceLogs,
    employees, 
    checkInState, 
    checkIn, 
    checkOut, 
    toggleBreak, 
    markAttendanceManual,
    addToast
  } = useHR();

  const isAdmin = currentRole === 'admin';

  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'db_logs'>('weekly');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchEmployee, setSearchEmployee] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [regularizeModalRecord, setRegularizeModalRecord] = useState<AttendanceRecord | null>(null);
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
  const [editNotes, setEditNotes] = useState('');

  // Format timer
  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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

  // Days for the weekly view (last 7 days from selectedDate)
  const getWeeklyDates = () => {
    const dates: string[] = [];
    const base = new Date(selectedDate);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const weeklyDates = getWeeklyDates();

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
    setEditNotes(existing.notes || '');
  };

  const handleSaveRegularize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regularizeModalRecord) return;

    markAttendanceManual({
      ...regularizeModalRecord,
      status: editStatus,
      checkInTime: editStatus === 'absent' || editStatus === 'leave' ? null : editCheckIn,
      checkOutTime: editStatus === 'absent' || editStatus === 'leave' ? null : editCheckOut,
      totalHoursWorked: editStatus === 'absent' || editStatus === 'leave' ? 0 : editHours,
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
            Present {hours ? `(${hours}h)` : ''}
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
            Half-Day {hours ? `(${hours}h)` : ''}
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
      <div className="soft-banner rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
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
                ? formatTimer(checkInState.accumulatedWorkedSeconds)
                : '00:00:00'}
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

      {/* Control Bar: View Switcher (Daily / Weekly / Calendar) & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* View Mode Buttons (PDF 3.4.1 + Supabase DB Logs) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setViewMode('weekly')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'weekly'
                  ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Weekly Grid
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
            <button
              onClick={() => setViewMode('db_logs')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'db_logs'
                  ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              <span>Attendance DB Logs</span>
            </button>
          </div>

          {/* Date Picker & Search */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() - (viewMode === 'weekly' ? 7 : 1));
                  setSelectedDate(d.toISOString().split('T')[0]);
                }}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 rounded-xl border border-slate-200 outline-none"
              />

              <button
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() + (viewMode === 'weekly' ? 7 : 1));
                  setSelectedDate(d.toISOString().split('T')[0]);
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

      {/* VIEW 1: WEEKLY GRID VIEW (PDF 3.4.1) */}
      {viewMode === 'weekly' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4 text-slate-600 font-bold uppercase text-[10px] w-64">
                    Employee ({visibleEmployees.length})
                  </th>
                  {weeklyDates.map((d) => {
                    const dateObj = new Date(d);
                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                    const isToday = d === new Date().toISOString().split('T')[0];
                    return (
                      <th
                        key={d}
                        className={`py-3 px-3 text-center border-l border-slate-100 ${
                          isToday ? 'bg-purple-50/70 text-purple-900 font-extrabold' : 'text-slate-600'
                        }`}
                      >
                        <div className="text-[10px] uppercase">{dayName}</div>
                        <div className="text-xs font-mono">{d.slice(5)}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.avatar}
                          alt={emp.firstName}
                          className="w-8 h-8 rounded-xl object-cover"
                        />
                        <div>
                          <div className="font-bold text-slate-900">
                            {emp.firstName} {emp.lastName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {emp.employeeId} • {emp.jobDetails.department}
                          </div>
                        </div>
                      </div>
                    </td>

                    {weeklyDates.map((d) => {
                      const rec = getRecordForEmployeeAndDate(emp.employeeId, d);
                      const isToday = d === new Date().toISOString().split('T')[0];
                      return (
                        <td
                          key={d}
                          onClick={() => handleOpenRegularize(emp, d)}
                          className={`py-3 px-2 text-center border-l border-slate-100 transition-colors ${
                            isAdmin ? 'cursor-pointer hover:bg-purple-50/40' : ''
                          } ${isToday ? 'bg-purple-50/20' : ''}`}
                          title={isAdmin ? 'Click to regularize / edit this day' : ''}
                        >
                          {rec ? (
                            <div className="flex flex-col items-center gap-1">
                              {renderStatusBadge(rec.status, rec.totalHoursWorked)}
                              {rec.checkInTime && (
                                <span className="text-[9px] text-slate-400 font-mono">
                                  {rec.checkInTime}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300 text-xs">--</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
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
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={emp.avatar}
                            alt={emp.firstName}
                            className="w-8 h-8 rounded-xl object-cover"
                          />
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
                        {rec ? renderStatusBadge(rec.status) : <span className="text-slate-400">Not recorded</span>}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700">
                        {rec?.checkInTime || '--'}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700">
                        {rec?.checkOutTime || (rec?.status === 'present' ? <span className="text-emerald-600 font-semibold">Active In Office</span> : '--')}
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900">
                        {rec?.totalHoursWorked ? `${rec.totalHoursWorked} hrs` : '--'}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {rec?.breakMinutes !== undefined ? `${rec.breakMinutes} min` : '--'}
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

      {/* VIEW 3: Real-Time Supabase Attendance DB Logs */}
      {viewMode === 'db_logs' && (
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
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            {actionBadge(log.action_type)}
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
                            {log.total_hours_worked ? `${log.total_hours_worked} hrs` : '--'}
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
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
            <h3 className="text-base font-bold text-slate-900 font-display">
              Regularize Attendance Record
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Override or adjust punch records for {regularizeModalRecord.employeeId} on {regularizeModalRecord.date}.
            </p>

            <form onSubmit={handleSaveRegularize} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as AttendanceStatus)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  <option value="present">Present (Full Day)</option>
                  <option value="half-day">Half-Day</option>
                  <option value="absent">Absent</option>
                  <option value="leave">On Leave</option>
                  <option value="weekend">Weekend / Off</option>
                </select>
              </div>

              {editStatus !== 'absent' && editStatus !== 'leave' && editStatus !== 'weekend' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Check In Time</label>
                      <input
                        type="text"
                        value={editCheckIn}
                        onChange={(e) => setEditCheckIn(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Check Out Time</label>
                      <input
                        type="text"
                        value={editCheckOut}
                        onChange={(e) => setEditCheckOut(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Total Hours Worked</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editHours}
                      onChange={(e) => setEditHours(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">HR Regularization Remarks</label>
                <input
                  type="text"
                  placeholder="e.g., Client on-site meeting regularization verified by Manager"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRegularizeModalRecord(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs transition-colors"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

import React, { useState } from 'react';
import { useHR } from '../../context/HRContext';
import { ProfilePlaceholder } from '../common/ProfilePlaceholder';
import { Department, Employee, UserRole } from '../../types';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  UserCheck, 
  Download, 
  LayoutGrid, 
  List, 
  ChevronRight,
  ExternalLink,
  Briefcase,
  Flame,
  UserX,
  RotateCcw,
  AlertTriangle,
  FileText,
  CheckCircle2,
  X,
  Trash2
} from 'lucide-react';

interface EmployeeDirectoryProps {
  onOpenAddEmployee: () => void;
}

export const EmployeeDirectory: React.FC<EmployeeDirectoryProps> = ({ onOpenAddEmployee }) => {
  const { 
    employees, 
    currentUser, 
    currentRole, 
    switchUser, 
    openEmployeeProfile,
    terminateEmployee,
    rehireEmployee,
    deleteEmployee,
    addToast
  } = useHR();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Termination Modal State
  const [employeeToTerminate, setEmployeeToTerminate] = useState<Employee | null>(null);
  const [terminationReason, setTerminationReason] = useState('Performance Discrepancy');
  const [terminationNotes, setTerminationNotes] = useState('');
  const [isSubmittingTermination, setIsSubmittingTermination] = useState(false);

  const departments = ['All', 'Engineering', 'Product & Design', 'Human Resources', 'Marketing', 'Sales', 'Finance'];

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.jobDetails.designation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = selectedDept === 'All' || emp.jobDetails.department === selectedDept;
    const matchesRole = selectedRole === 'All' || emp.role === selectedRole;
    const matchesStatus = selectedStatus === 'All' || emp.status === selectedStatus;

    return matchesSearch && matchesDept && matchesRole && matchesStatus;
  });

  const handleOpenFireModal = (emp: Employee, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEmployeeToTerminate(emp);
    setTerminationReason('Performance Discrepancy');
    setTerminationNotes('');
  };

  const handleConfirmTermination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeToTerminate) return;

    setIsSubmittingTermination(true);
    try {
      await terminateEmployee(employeeToTerminate.id, terminationReason, terminationNotes);
      setEmployeeToTerminate(null);
    } finally {
      setIsSubmittingTermination(false);
    }
  };

  const handleRehire = async (emp: Employee, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await rehireEmployee(emp.id);
  };

  const exportToCSV = () => {
    const headers = ['Employee ID', 'Name', 'Email', 'Phone', 'Role', 'Department', 'Designation', 'Joining Date', 'Location', 'Status'];
    const rows = filteredEmployees.map((e) => [
      e.employeeId,
      `"${e.firstName} ${e.lastName}"`,
      e.email,
      e.phone,
      e.role,
      `"${e.jobDetails.department}"`,
      `"${e.jobDetails.designation}"`,
      e.jobDetails.dateOfJoining,
      e.jobDetails.workLocation,
      e.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dayflow_employees_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('success', 'Export Complete', `Exported ${filteredEmployees.length} employee records.`);
  };

  const getStatusBadge = (status: Employee['status']) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        );
      case 'Terminated':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
            <UserX className="w-3 h-3 text-rose-600" />
            Terminated
          </span>
        );
      case 'On Leave':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            On Leave
          </span>
        );
      case 'Probation':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Probation
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display tracking-tight flex items-center gap-2.5">
            <span>Employee Directory</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
              {employees.length} Total
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Browse team members, review credentials, manage status & process employee actions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {currentRole === 'admin' && (
            <button
              onClick={onOpenAddEmployee}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Onboard New Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          
          {/* Search Bar */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, ID, designation, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-200 focus:border-purple-400 outline-none transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:border-purple-400 outline-none font-medium text-slate-700 w-full md:w-auto"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Terminated">Terminated Only</option>
              <option value="Probation">Probation Only</option>
              <option value="On Leave">On Leave Only</option>
            </select>

            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:border-purple-400 outline-none font-medium text-slate-700 w-full md:w-auto"
            >
              <option value="All">All Roles</option>
              <option value="admin">HR / Admins</option>
              <option value="employee">Employees</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-500'
                }`}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-500'
                }`}
                title="Table view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Department Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                selectedDept === dept
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Content */}
      {filteredEmployees.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No employees found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or filter options.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => {
            const isMe = currentUser ? emp.id === currentUser.id : false;
            const isTerminated = emp.status === 'Terminated';

            return (
              <div
                key={emp.id}
                className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between hover:shadow-md relative ${
                  isTerminated
                    ? 'border-rose-300 bg-rose-50/20'
                    : isMe
                    ? 'border-purple-400 ring-2 ring-purple-100'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Top card bar */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="relative">
                      <ProfilePlaceholder label={`${emp.firstName} ${emp.lastName}`} className={`w-14 h-14 text-base rounded-2xl ring-2 shadow-2xs ${isTerminated ? 'ring-rose-200 opacity-80' : 'ring-slate-100'}`} />
                      <span
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          isTerminated ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                      />
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1">
                        {getStatusBadge(emp.status)}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            emp.role === 'admin'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-purple-100 text-purple-900 border border-purple-200'
                          }`}
                        >
                          {emp.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                          {emp.role === 'admin' ? 'HR / Admin' : 'Employee'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{emp.employeeId}</span>
                    </div>
                  </div>

                  {/* Name & Designation */}
                  <h3 className={`font-bold text-slate-900 text-base leading-tight ${isTerminated ? 'line-through text-slate-600' : ''}`}>
                    {emp.firstName} {emp.lastName}
                  </h3>
                  <p className="text-xs text-purple-700 font-semibold mt-0.5">
                    {emp.jobDetails.designation}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {emp.jobDetails.department} • {emp.jobDetails.employmentType}
                  </p>

                  {/* Meta details */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{emp.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{emp.personalDetails.city} ({emp.jobDetails.workLocation})</span>
                    </div>
                  </div>
                </div>

                {/* Card footer actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => openEmployeeProfile(emp)}
                      className="py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>Profile</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Admin Fire / Terminate Button */}
                  {currentRole === 'admin' && !isMe && (
                    <div className="pt-1">
                      {isTerminated ? (
                        <button
                          onClick={(e) => handleRehire(emp, e)}
                          className="w-full py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs transition-all border border-emerald-200 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reactivate / Rehire Employee</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleOpenFireModal(emp, e)}
                          className="w-full py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 font-semibold text-xs transition-all border border-rose-200 hover:border-rose-600 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Flame className="w-3.5 h-3.5" />
                          <span>Fire / Terminate Employee</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table Layout */
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Department & Role</th>
                  <th className="py-3.5 px-4">Work Location</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp) => {
                  const isMe = currentUser ? emp.id === currentUser.id : false;
                  const isTerminated = emp.status === 'Terminated';

                  return (
                    <tr key={emp.id} className={`hover:bg-slate-50/80 transition-colors ${isTerminated ? 'bg-rose-50/30' : ''}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <ProfilePlaceholder label={`${emp.firstName} ${emp.lastName}`} className={`w-9 h-9 ${isTerminated ? 'opacity-80' : ''}`} />
                          <div>
                            <div className={`font-bold text-slate-900 ${isTerminated ? 'line-through text-slate-500' : ''}`}>
                              {emp.firstName} {emp.lastName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {emp.employeeId} • {emp.role === 'admin' ? 'HR / Admin' : 'Employee'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {getStatusBadge(emp.status)}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <div>{emp.email}</div>
                        <div className="text-[10px] text-slate-400">{emp.phone}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-purple-700">{emp.jobDetails.designation}</div>
                        <div className="text-slate-500">{emp.jobDetails.department}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 font-medium">
                          {emp.jobDetails.workLocation}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEmployeeProfile(emp)}
                            className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-[11px] transition-colors cursor-pointer"
                          >
                            View
                          </button>

                          {/* Admin Quick Fire Button */}
                          {currentRole === 'admin' && !isMe && (
                            isTerminated ? (
                              <button
                                onClick={(e) => handleRehire(emp, e)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 font-semibold text-[11px] transition-colors border border-emerald-200 cursor-pointer"
                                title="Reactivate employee"
                              >
                                Rehire
                              </button>
                            ) : (
                              <button
                                onClick={(e) => handleOpenFireModal(emp, e)}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 font-semibold text-[11px] transition-colors border border-rose-200 cursor-pointer flex items-center gap-1"
                                title="Fire / Terminate employee"
                              >
                                <Flame className="w-3 h-3" />
                                <span>Fire</span>
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fire / Terminate Employee Confirmation Modal */}
      {employeeToTerminate && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-rose-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header Banner */}
            <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 p-6 text-white relative">
              <button
                onClick={() => setEmployeeToTerminate(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/30 border border-rose-400/40 flex items-center justify-center shrink-0">
                  <Flame className="w-6 h-6 text-rose-300 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display">Fire / Terminate Employee</h3>
                  <p className="text-xs text-rose-200 mt-0.5">Revoke system access and update database status</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleConfirmTermination} className="p-6 space-y-4">
              
              {/* Target Employee Summary Card */}
              <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 flex items-center gap-3.5">
                <ProfilePlaceholder label={`${employeeToTerminate.firstName} ${employeeToTerminate.lastName}`} className="w-12 h-12 ring-2 ring-rose-200 shadow-2xs" />
                <div className="min-w-0 flex-1 text-xs">
                  <div className="font-bold text-slate-900 text-sm truncate">
                    {employeeToTerminate.firstName} {employeeToTerminate.lastName}
                  </div>
                  <div className="text-purple-700 font-medium truncate">
                    {employeeToTerminate.jobDetails.designation} • {employeeToTerminate.jobDetails.department}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    ID: {employeeToTerminate.employeeId} • Email: {employeeToTerminate.email}
                  </div>
                </div>
              </div>

              {/* Warning box */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>Database Effect:</strong> This action will mark <strong>{employeeToTerminate.firstName} {employeeToTerminate.lastName}</strong> as <strong>Terminated</strong> in Supabase (`public.users`), revoke portal login access, and append an audit record to the telemetry logs.
                </div>
              </div>

              {/* Reason Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Termination / Severance Reason *</label>
                <select
                  value={terminationReason}
                  onChange={(e) => setTerminationReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none font-medium text-slate-800"
                  required
                >
                  <option value="Performance Discrepancy">Performance Discrepancy / KPI Non-Attainment</option>
                  <option value="Gross Misconduct / Policy Violation">Gross Misconduct / Policy Violation</option>
                  <option value="Company Restructuring & Redundancy">Company Restructuring & Workforce Redundancy</option>
                  <option value="Voluntary Resignation / Separation">Voluntary Resignation / Separation</option>
                  <option value="Probation Assessment Non-Confirmation">Probation Assessment Non-Confirmation</option>
                  <option value="Mutual Exit Agreement">Mutual Exit Agreement</option>
                  <option value="Other Administrative Decision">Other Administrative Decision</option>
                </select>
              </div>

              {/* Notes / Documentation */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">HR Administrative Notes & Clearance Details</label>
                <textarea
                  value={terminationNotes}
                  onChange={(e) => setTerminationNotes(e.target.value)}
                  placeholder="e.g., Handover completed with department lead. Assets returned. Final settlement scheduled."
                  rows={3}
                  className="w-full p-3 text-xs bg-slate-50 rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none text-slate-800"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEmployeeToTerminate(null)}
                  disabled={isSubmittingTermination}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTermination}
                  className="px-5 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md shadow-rose-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>{isSubmittingTermination ? 'Updating Supabase...' : 'Confirm & Fire Employee'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

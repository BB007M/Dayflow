import React, { useState } from 'react';
import { useHR } from '../../context/HRContext';
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
  Briefcase
} from 'lucide-react';

interface EmployeeDirectoryProps {
  onOpenAddEmployee: () => void;
}

export const EmployeeDirectory: React.FC<EmployeeDirectoryProps> = ({ onOpenAddEmployee }) => {
  const { 
    employees, 
    currentUser, 
    currentRole, 
    openEmployeeProfile,
    addToast
  } = useHR();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const departments = ['All', 'Engineering', 'Product & Design', 'Human Resources', 'Marketing', 'Sales', 'Operations', 'Finance'];

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.jobDetails.designation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = selectedDept === 'All' || emp.jobDetails.department === selectedDept;
    const matchesRole = selectedRole === 'All' || emp.role === selectedRole;

    return matchesSearch && matchesDept && matchesRole;
  });

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
            Browse team members, review job credentials, manage profiles & role assignments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {currentRole === 'admin' && (
            <button
              onClick={onOpenAddEmployee}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-600/25 transition-all flex items-center gap-1.5"
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

          {/* Role Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
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
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-500'
                }`}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
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
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
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
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or department filter.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => {
            const isMe = currentUser ? emp.id === currentUser.id : false;
            return (
              <div
                key={emp.id}
                className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between hover:shadow-md ${
                  isMe ? 'border-purple-400 ring-2 ring-purple-100' : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Top card bar */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="relative">
                      <img
                        src={emp.avatar}
                        alt={emp.firstName}
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100 shadow-2xs"
                      />
                      <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                    </div>

                    <div className="flex flex-col items-end gap-1">
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
                      <span className="text-[10px] font-mono text-slate-400">{emp.employeeId}</span>
                    </div>
                  </div>

                  {/* Name & Designation */}
                  <h3 className="font-bold text-slate-900 text-base leading-tight">
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
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
<button
                    onClick={() => openEmployeeProfile(emp)}
                    className="py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-all shadow-xs flex items-center gap-1"
                  >
                    <span>Profile</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
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
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Department & Role</th>
                  <th className="py-3.5 px-4">Work Location</th>
                  <th className="py-3.5 px-4">Joined</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.avatar}
                          alt={emp.firstName}
                          className="w-9 h-9 rounded-xl object-cover"
                        />
                        <div>
                          <div className="font-bold text-slate-900">
                            {emp.firstName} {emp.lastName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {emp.employeeId} • {emp.role === 'admin' ? 'HR / Admin' : 'Employee'}
                          </div>
                        </div>
                      </div>
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

                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {emp.jobDetails.dateOfJoining}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEmployeeProfile(emp)}
                          className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-[11px] transition-colors"
                        >
                          View Profile
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

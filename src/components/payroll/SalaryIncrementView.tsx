import React, { useState } from 'react';
import { Check, Percent, TrendingUp, Users } from 'lucide-react';
import { useHR } from '../../context/HRContext';
import { Employee } from '../../types';

export const SalaryIncrementView: React.FC = () => {
  const { employees, updateSalaryStructure, addToast } = useHR();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [incrementPercent, setIncrementPercent] = useState('');

  const selectedEmployee = employees.find((employee) => employee.employeeId === selectedEmployeeId);
  const percent = Number(incrementPercent);
  const currentBasicSalary = selectedEmployee?.salaryStructure.basicSalary || 0;
  const proposedBasicSalary = currentBasicSalary + (currentBasicSalary * percent) / 100;

  const handleApplyIncrement = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedEmployee || !Number.isFinite(percent) || percent <= 0) {
      addToast('warning', 'Invalid Increment', 'Choose an employee and enter an increment greater than 0%.');
      return;
    }

    updateSalaryStructure(selectedEmployee.employeeId, {
      ...selectedEmployee.salaryStructure,
      basicSalary: Math.round(proposedBasicSalary),
    });
    addToast('success', 'Salary Increment Applied', `${selectedEmployee.firstName} ${selectedEmployee.lastName}'s basic salary increased by ${percent}%.`);
    setIncrementPercent('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="soft-banner rounded-3xl p-6 sm:p-8">
        <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold uppercase tracking-wider">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-700" />
          </div>
          Compensation Planning
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display mt-2">Salary Increment</h1>
        <p className="text-sm text-slate-600 mt-1">Apply a percentage increase to an employee's basic salary.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleApplyIncrement} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-slate-900 font-display">Apply Increment</h2>
          </div>

          <label className="block text-xs font-semibold text-slate-700">
            Employee
            <select
              value={selectedEmployeeId}
              onChange={(event) => setSelectedEmployeeId(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              required
            >
              <option value="">Select employee</option>
              {employees.filter((employee) => employee.status === 'Active').map((employee) => (
                <option key={employee.id} value={employee.employeeId}>
                  {employee.firstName} {employee.lastName} ({employee.employeeId})
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-semibold text-slate-700">
            Increment Percentage
            <div className="relative mt-1">
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={incrementPercent}
                onChange={(event) => setIncrementPercent(event.target.value)}
                placeholder="e.g. 10"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-9 text-sm text-slate-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                required
              />
              <Percent className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </label>

          <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
            <div className="flex justify-between"><span>Current basic</span><strong>${currentBasicSalary.toLocaleString()}</strong></div>
            <div className="flex justify-between mt-1"><span>New basic</span><strong>${selectedEmployee ? proposedBasicSalary.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '--'}</strong></div>
          </div>

          <button type="submit" className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 flex items-center justify-center gap-2">
            <Check className="w-4 h-4" /> Apply Increment
          </button>
        </form>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-900 font-display">Team Compensation</h2>
              <p className="text-xs text-slate-500 mt-1">Current basic salary by active employee</p>
            </div>
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="divide-y divide-slate-100">
            {employees.filter((employee) => employee.status === 'Active').map((employee: Employee) => (
              <button
                key={employee.id}
                type="button"
                onClick={() => setSelectedEmployeeId(employee.employeeId)}
                className={`w-full flex items-center justify-between py-3 text-left rounded-lg px-2 transition-colors ${selectedEmployeeId === employee.employeeId ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
              >
                <span>
                  <span className="block text-sm font-semibold text-slate-900">{employee.firstName} {employee.lastName}</span>
                  <span className="block text-xs text-slate-500">{employee.jobDetails.designation} · {employee.employeeId}</span>
                </span>
                <span className="text-sm font-bold text-slate-900">${employee.salaryStructure.basicSalary.toLocaleString()}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

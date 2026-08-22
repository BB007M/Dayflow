import React, { useEffect, useState } from 'react';
import { CheckCircle2, History, Percent, Plus, ShieldAlert } from 'lucide-react';
import { useHR } from '../../context/HRContext';
import { SalaryIncrement } from '../../types';
import { formatINR } from '../../currency';

export const SalaryIncrementsView: React.FC = () => {
  const { currentUser, currentRole, employees, updateSalaryStructure, addToast } = useHR();
  const activeEmployees = employees.filter((employee) => employee.status !== 'Terminated');
  const [employeeId, setEmployeeId] = useState('');
  const [percentage, setPercentage] = useState(10);
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('Performance review salary hike');
  const [increments, setIncrements] = useState<SalaryIncrement[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!employeeId && activeEmployees[0]) setEmployeeId(activeEmployees[0].employeeId);
  }, [activeEmployees, employeeId]);

  useEffect(() => {
    fetch('/api/salary-increments')
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load increment history.');
        const data = await response.json();
        setIncrements(Array.isArray(data.increments) ? data.increments : []);
      })
      .catch(() => console.warn('Salary increment history could not be loaded.'));
  }, []);

  const selectedEmployee = activeEmployees.find((employee) => employee.employeeId === employeeId);
  const currentBasicSalary = selectedEmployee?.salaryStructure.basicSalary || 0;
  const incrementAmount = Math.round(currentBasicSalary * (Math.max(percentage, 0) / 100));
  const newBasicSalary = currentBasicSalary + incrementAmount;

  if (currentRole !== 'admin') {
    return (
      <div className="mx-auto mt-12 max-w-md rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
        <ShieldAlert className="mx-auto h-10 w-10 text-rose-500" />
        <h1 className="mt-4 text-lg font-bold text-slate-900">Administrator access required</h1>
        <p className="mt-2 text-xs text-slate-500">Only HR administrators can manage salary increments.</p>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser || !selectedEmployee || percentage <= 0 || !reason.trim()) return;
    setIsSaving(true);
    const createdAt = new Date().toISOString();
    const increment: SalaryIncrement = {
      id: `increment-${Date.now()}`,
      employeeId: selectedEmployee.employeeId,
      employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
      previousBasicSalary: currentBasicSalary,
      incrementAmount,
      incrementPercentage: percentage,
      newBasicSalary,
      effectiveDate,
      reason: reason.trim(),
      approvedBy: `${currentUser.firstName} ${currentUser.lastName}`,
      createdAt,
    };

    try {
      const response = await fetch('/api/salary-increments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(increment),
      });
      if (!response.ok) throw new Error('Increment was not saved.');
      updateSalaryStructure(selectedEmployee.employeeId, {
        ...selectedEmployee.salaryStructure,
        basicSalary: newBasicSalary,
      });
      setIncrements((current) => [increment, ...current]);
      addToast('success', 'Salary Increment Applied', `${selectedEmployee.firstName}'s basic salary is now ${formatINR(newBasicSalary)}.`);
    } catch {
      addToast('error', 'Increment Not Saved', 'The salary increment could not be recorded in the database.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <header className="rounded-3xl bg-gradient-to-r from-amber-900 via-slate-900 to-teal-950 p-6 text-white shadow-xl">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-200">
          <Percent className="h-4 w-4" /> Compensation Planning
        </div>
        <h1 className="mt-2 font-display text-2xl font-extrabold">Salary Increments</h1>
        <p className="mt-1 max-w-2xl text-xs text-slate-300">Apply approved salary changes and keep a clear history of every adjustment.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Plus className="h-4 w-4" /></div>
            <div><h2 className="text-sm font-bold text-slate-900">Apply an increment</h2><p className="text-[11px] text-slate-500">Update basic salary and record approval details.</p></div>
          </div>
          <div className="mt-5 space-y-4">
            <label className="block text-xs font-semibold text-slate-700">Employee
              <select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs font-normal text-slate-800" required>
                {activeEmployees.map((employee) => <option key={employee.id} value={employee.employeeId}>{employee.firstName} {employee.lastName} ({employee.employeeId})</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-semibold text-slate-700">Current basic
                <input value={formatINR(currentBasicSalary)} readOnly className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600" />
              </label>
              <label className="block text-xs font-semibold text-slate-700">Increment %
                <input type="number" min="0.1" step="0.1" value={percentage} onChange={(event) => setPercentage(Number(event.target.value))} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs text-slate-800" required />
              </label>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
              New basic salary <strong>{formatINR(newBasicSalary)}</strong> <span className="text-emerald-600">(+{formatINR(incrementAmount)})</span>
            </div>
            <label className="block text-xs font-semibold text-slate-700">Effective date
              <input type="date" value={effectiveDate} onChange={(event) => setEffectiveDate(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs font-normal text-slate-800" required />
            </label>
            <label className="block text-xs font-semibold text-slate-700">Reason
              <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-xs font-normal text-slate-800" required />
            </label>
            <button type="submit" disabled={isSaving || !selectedEmployee} className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60">
              <CheckCircle2 className="h-4 w-4" /> {isSaving ? 'Saving increment...' : 'Apply increment'}
            </button>
          </div>
        </form>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <History className="h-4 w-4 text-teal-600" />
            <div><h2 className="text-sm font-bold text-slate-900">Increment history</h2><p className="text-[11px] text-slate-500">Recorded salary changes from Supabase.</p></div>
          </div>
          {increments.length === 0 ? <p className="py-12 text-center text-xs text-slate-500">No salary increments recorded yet.</p> : (
            <div className="mt-4 space-y-3">
              {increments.map((item) => (
                <article key={item.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><h3 className="text-xs font-bold text-slate-900">{item.employeeName}</h3><p className="mt-1 text-[11px] text-slate-500">{item.employeeId} · Effective {item.effectiveDate}</p></div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">+{item.incrementPercentage}%</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] sm:grid-cols-3"><div><span className="text-slate-500">Previous</span><p className="font-semibold text-slate-800">{formatINR(item.previousBasicSalary)}</p></div><div><span className="text-slate-500">New basic</span><p className="font-semibold text-slate-800">{formatINR(item.newBasicSalary)}</p></div><div><span className="text-slate-500">Approved by</span><p className="font-semibold text-slate-800">{item.approvedBy}</p></div></div>
                  <p className="mt-3 border-t border-slate-200 pt-3 text-[11px] text-slate-600">{item.reason}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

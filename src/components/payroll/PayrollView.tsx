import React, { useState } from 'react';
import { useHR } from '../../context/HRContext';
import { Payslip, Employee } from '../../types';
import { 
  Banknote, 
  Download, 
  Printer, 
  Calendar, 
  CheckCircle, 
  Sparkles, 
  Search, 
  FileText, 
  Building2, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldCheck,
  CreditCard,
  Percent,
  X
} from 'lucide-react';

export const PayrollView: React.FC = () => {
  const { 
    currentUser, 
    currentRole, 
    payslips, 
    employees, 
    generateMonthlyPayroll,
    openAuthModal,
    addToast
  } = useHR();

  const isAdmin = currentRole === 'admin';

  const now = new Date();
  const currentMonthLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const [selectedMonth, setSelectedMonth] = useState(currentMonthLabel);
  const [searchEmployee, setSearchEmployee] = useState('');
  const [selectedPayslipForModal, setSelectedPayslipForModal] = useState<Payslip | null>(null);

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-12 text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-slate-600 mb-4 text-xs">Please sign in to view salary and payslip records.</p>
        <button
          onClick={() => openAuthModal('signin')}
          className="px-4 py-2 bg-purple-600 text-white rounded-xl font-medium text-xs shadow-md"
        >
          Sign In
        </button>
      </div>
    );
  }

  // Filter visible payslips
  const visiblePayslips = payslips.filter((p) => {
    if (!isAdmin && p.employeeId !== currentUser.employeeId) return false;
    const matchMonth = p.month === selectedMonth;
    const matchSearch =
      p.employeeName.toLowerCase().includes(searchEmployee.toLowerCase()) ||
      p.employeeId.toLowerCase().includes(searchEmployee.toLowerCase()) ||
      p.department.toLowerCase().includes(searchEmployee.toLowerCase());
    return matchMonth && matchSearch;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSlip = (slip: Payslip) => {
    addToast('success', 'Payslip Generated', `Downloading ${slip.month} payslip for ${slip.employeeName}`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/30 flex items-center justify-center">
              <Banknote className="w-4 h-4 text-teal-300" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-200">
              {isAdmin ? 'Corporate Payroll & Compensation Engine' : 'My Compensation & Payslips'}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold font-display tracking-tight text-white mt-1">
            Payroll Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            {isAdmin
              ? 'Review salary structures, generate monthly disbursement batches, and audit tax compliance.'
              : `View official salary statements, tax deduction breakdowns, and download monthly PDF payslips.`}
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => generateMonthlyPayroll(currentMonthLabel, now.getFullYear())}
              className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold text-xs shadow-md shadow-teal-500/30 flex items-center gap-1.5 transition-all hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              <span>Run {currentMonthLabel} Batch</span>
            </button>
          </div>
        )}
      </div>

      {/* Salary Overview Cards for Current Persona */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Gross Earnings */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Monthly Gross CTC</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            $
            {(
              currentUser.salaryStructure.basicSalary +
              currentUser.salaryStructure.hra +
              currentUser.salaryStructure.conveyanceAllowance +
              currentUser.salaryStructure.medicalAllowance +
              currentUser.salaryStructure.specialAllowance
            ).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Basic ${currentUser.salaryStructure.basicSalary} + Allowances ${(
              currentUser.salaryStructure.hra +
              currentUser.salaryStructure.conveyanceAllowance +
              currentUser.salaryStructure.medicalAllowance +
              currentUser.salaryStructure.specialAllowance
            ).toLocaleString()}
          </div>
        </div>

        {/* Deductions */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Deductions</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-700 font-display">
            -$
            {(
              currentUser.salaryStructure.providentFund +
              currentUser.salaryStructure.incomeTax +
              currentUser.salaryStructure.professionalTax
            ).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            PF (${currentUser.salaryStructure.providentFund}) + TDS (${currentUser.salaryStructure.incomeTax}) + Tax (${currentUser.salaryStructure.professionalTax})
          </div>
        </div>

        {/* Net Take-Home */}
        <div className="p-5 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl border border-teal-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-teal-900 uppercase">Net Monthly Take-Home</span>
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-teal-950 font-display">
            $
            {(
              currentUser.salaryStructure.basicSalary +
              currentUser.salaryStructure.hra +
              currentUser.salaryStructure.conveyanceAllowance +
              currentUser.salaryStructure.medicalAllowance +
              currentUser.salaryStructure.specialAllowance -
              (currentUser.salaryStructure.providentFund +
                currentUser.salaryStructure.incomeTax +
                currentUser.salaryStructure.professionalTax)
            ).toLocaleString()}
          </div>
          <div className="text-xs text-teal-800 mt-1 flex items-center gap-1 font-medium">
            <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
            <span>Disbursed directly to {currentUser.bankDetails.bankName}</span>
          </div>
        </div>

      </div>

      {/* Payslip History & Explorer */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base font-display">
              {isAdmin ? 'Organization Payslips Archive' : 'My Salary Statements'}
            </h3>
            <p className="text-xs text-slate-500">
              Select any payslip to inspect detailed line items, working days breakdown, or generate printable PDF
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700 outline-none"
            >
              <option value={currentMonthLabel}>{currentMonthLabel}</option>
            </select>

            {isAdmin && (
              <div className="relative w-44">
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

        {visiblePayslips.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
            No payslips generated for {selectedMonth} yet. {isAdmin && 'Run the current-month batch to generate.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Month</th>
                  <th className="py-3 px-4">Work Days / Paid</th>
                  <th className="py-3 px-4">Gross Earnings</th>
                  <th className="py-3 px-4">Deductions</th>
                  <th className="py-3 px-4">Net Salary</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visiblePayslips.map((slip) => (
                  <tr key={slip.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{slip.employeeName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {slip.employeeId} • {slip.designation}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {slip.month}
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <span className="font-semibold text-slate-900">{slip.workedDays}</span> / {slip.workedDays + slip.lopDays} days
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-900">
                      ${slip.grossEarnings.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 font-semibold text-rose-600">
                      -${slip.totalDeductions.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 font-bold text-emerald-700 text-sm">
                      ${slip.netPay.toLocaleString()}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {slip.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedPayslipForModal(slip)}
                          className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold text-[11px] transition-colors"
                        >
                          View Slip
                        </button>
                        <button
                          onClick={() => handleDownloadSlip(slip)}
                          className="p-1 text-slate-400 hover:text-teal-600 rounded"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAILED PRINTABLE PAYSLIP MODAL (PDF Section 3.6.2) */}
      {selectedPayslipForModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden transition-all my-6 max-h-[92vh] flex flex-col print:shadow-none print:border-none print:max-w-none">
            
            {/* Modal Control Bar */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold font-display">
                  Official Salary Slip - {selectedPayslipForModal.month}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => handleDownloadSlip(selectedPayslipForModal)}
                  className="px-3 py-1 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => setSelectedPayslipForModal(null)}
                  className="p-1 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Payslip Document Body */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 text-slate-900 bg-white">
              
              {/* Document Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white font-extrabold text-sm">
                      D
                    </div>
                    <span className="text-xl font-bold font-display tracking-tight text-slate-900">
                      Dayflow HRMS
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Dayflow Technologies Inc. • 100 Market St, San Francisco, CA
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Tax information is shown securely for authorized employees.
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Payslip For
                  </span>
                  <h3 className="text-lg font-bold text-teal-700 font-display">
                    {selectedPayslipForModal.month}
                  </h3>
                  <span className="text-xs font-mono text-slate-500">
                    Slip #: {selectedPayslipForModal.id}
                  </span>
                </div>
              </div>

              {/* Employee Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Employee Name</span>
                  <span className="font-bold text-slate-900">{selectedPayslipForModal.employeeName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Employee ID</span>
                  <span className="font-mono font-bold text-slate-900">{selectedPayslipForModal.employeeId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Designation</span>
                  <span className="font-medium text-slate-800">{selectedPayslipForModal.designation}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Department</span>
                  <span className="font-medium text-slate-800">{selectedPayslipForModal.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">PAN / Tax ID</span>
                  <span className="font-mono font-medium text-slate-800">{selectedPayslipForModal.panNumber || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Account Number</span>
                  <span className="font-mono font-medium text-slate-800">{selectedPayslipForModal.bankAccountMasked || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Working Days</span>
                  <span className="font-bold text-slate-900">{selectedPayslipForModal.workedDays + selectedPayslipForModal.lopDays} Days</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Paid / Attended</span>
                  <span className="font-bold text-emerald-600">{selectedPayslipForModal.workedDays} Days</span>
                </div>
              </div>

              {/* Earnings & Deductions Dual Table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Earnings Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider border-b border-emerald-200 pb-1">
                    Earnings Breakdown
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600">Basic Salary</span>
                      <span className="font-semibold text-slate-900">${selectedPayslipForModal.basicSalary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600">House Rent Allowance (HRA)</span>
                      <span className="font-semibold text-slate-900">${selectedPayslipForModal.hra.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600">Other Allowances (Conveyance, Medical, Special)</span>
                      <span className="font-semibold text-slate-900">${selectedPayslipForModal.allowances.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-2 text-xs font-bold text-slate-900">
                      <span>Total Gross Earnings</span>
                      <span className="text-emerald-700">${selectedPayslipForModal.grossEarnings.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider border-b border-rose-200 pb-1">
                    Deductions & Taxes
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600">Provident Fund (PF)</span>
                      <span className="font-semibold text-slate-900">${selectedPayslipForModal.pfDeduction.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600">Income Tax (TDS)</span>
                      <span className="font-semibold text-slate-900">${selectedPayslipForModal.taxDeduction.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600">Professional Tax / Other Deductions</span>
                      <span className="font-semibold text-slate-900">${selectedPayslipForModal.otherDeductions.toLocaleString()}</span>
                    </div>
                    {selectedPayslipForModal.lopDays > 0 && (
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-rose-600">Loss of Pay ({selectedPayslipForModal.lopDays} day{selectedPayslipForModal.lopDays === 1 ? '' : 's'})</span>
                        <span className="font-semibold text-rose-600">Included above</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 text-xs font-bold text-slate-900">
                      <span>Total Deductions</span>
                      <span className="text-rose-600">-${selectedPayslipForModal.totalDeductions.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Net Take-Home Big Banner */}
              <div className="p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
                    Net Take-Home Pay
                  </span>
                  <div className="text-3xl font-extrabold font-display text-teal-300">
                    ${selectedPayslipForModal.netPay.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    (Gross Earnings ${selectedPayslipForModal.grossEarnings.toLocaleString()} - Total Deductions ${selectedPayslipForModal.totalDeductions.toLocaleString()})
                  </p>
                </div>

                <div className="text-right text-xs text-slate-300">
                  <div className="font-bold text-emerald-400 flex items-center justify-end gap-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>Paid & Settled</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Disbursed on {selectedPayslipForModal.paymentDate}</p>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-[10px] text-slate-400 text-center border-t border-slate-100 pt-3">
                This is a computer-generated official payroll statement from Dayflow HRMS and does not require a physical signature.
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

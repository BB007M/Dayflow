import React, { useState } from 'react';
import { useHR } from '../../context/HRContext';
import { Department, EmploymentType, WorkLocation, UserRole } from '../../types';
import { X, UserPlus, Building2, ShieldCheck, User, Sparkles } from 'lucide-react';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ isOpen, onClose }) => {
  const { addNewEmployee } = useHR();

  const [employeeId, setEmployeeId] = useState(`EMP-${Math.floor(1200 + Math.random() * 8000)}`);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+1 (555) 302-8819');
  const [role, setRole] = useState<UserRole>('employee');
  const [designation, setDesignation] = useState('Product Specialist');
  const [department, setDepartment] = useState<Department>('Engineering');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('Full-Time');
  const [workLocation, setWorkLocation] = useState<WorkLocation>('Hybrid');
  const [managerName, setManagerName] = useState('Sarah Jenkins');
  const [city, setCity] = useState('San Francisco, CA');
  const [basicSalary, setBasicSalary] = useState(6500);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) return;

    const hra = Math.round(basicSalary * 0.4);
    const conveyance = 400;
    const medical = 400;
    const special = 1200;
    const pf = Math.round(basicSalary * 0.12);
    const tax = Math.round(basicSalary * 0.16);

    addNewEmployee({
      employeeId,
      firstName,
      lastName,
      email,
      phone,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      role,
      jobDetails: {
        designation,
        department,
        dateOfJoining: new Date().toISOString().split('T')[0],
        employmentType,
        workLocation,
        managerName,
        managerId: 'EMP-1001',
      },
      personalDetails: {
        dob: '1995-05-20',
        gender: 'Prefer not to say',
        address: '500 Howard St',
        city,
        country: 'United States',
        emergencyContactName: 'Family Contact',
        emergencyContactPhone: '+1 (555) 888-9900',
        emergencyContactRelation: 'Family',
        nationality: 'American',
      },
      salaryStructure: {
        basicSalary,
        hra,
        conveyanceAllowance: conveyance,
        medicalAllowance: medical,
        specialAllowance: special,
        providentFund: pf,
        professionalTax: 200,
        incomeTax: tax,
        currency: 'USD',
      },
      leaveBalance: {
        paidLeave: { total: 18, used: 0, remaining: 18 },
        sickLeave: { total: 10, used: 0, remaining: 10 },
        casualLeave: { total: 6, used: 0, remaining: 6 },
        unpaidLeave: { used: 0 },
      },
      documents: [
        {
          id: `doc-${Date.now()}`,
          name: 'Offer_Letter_Signed.pdf',
          type: 'PDF',
          uploadDate: new Date().toISOString().split('T')[0],
          size: '1.4 MB',
          status: 'Verified',
        },
      ],
      status: 'Active',
      bankDetails: {
        bankName: 'Dayflow Federal Credit Union',
        accountNumberMasked: '•••• •••• •••• 9901',
        ifscOrRouting: 'DFCU0001',
        panOrTaxId: 'US-TAX-NEW',
      },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden transition-all my-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-white/80 hover:text-white p-1 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-purple-500/30 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-purple-300" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-200">HR Onboarding</span>
          </div>
          <h2 className="text-xl font-bold font-display tracking-tight text-white">
            Onboard New Employee
          </h2>
          <p className="text-xs text-purple-200 mt-1">
            Add team credentials, assign department & designate initial salary package.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                placeholder="e.g. Jordan"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-purple-600 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
              <input
                type="text"
                placeholder="e.g. Miller"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-purple-600 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Employee ID *</label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:border-purple-600 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email *</label>
              <input
                type="email"
                placeholder="jordan.miller@dayflow.corp"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-purple-600 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="Engineering">Engineering</option>
                <option value="Product & Design">Product & Design</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="Finance">Finance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Access Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="employee">Regular Employee</option>
                <option value="admin">HR / Admin Officer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work Mode</label>
              <select
                value={workLocation}
                onChange={(e) => setWorkLocation(e.target.value as WorkLocation)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="Hybrid">Hybrid</option>
                <option value="Remote">Remote</option>
                <option value="On-Site">On-Site</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Base Salary ($)</label>
              <input
                type="number"
                value={basicSalary}
                onChange={(e) => setBasicSalary(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Office Location</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md shadow-purple-600/20 transition-all flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Complete Onboarding</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

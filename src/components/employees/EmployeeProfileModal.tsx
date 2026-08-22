import React, { useEffect, useState } from 'react';
import { useHR } from '../../context/HRContext';
import {
  Employee,
  Department,
  EmploymentType,
  WorkLocation,
} from '../../types';
import {
  X,
  User,
  Briefcase,
  Banknote,
  FileText,
  Edit3,
  Save,
  Upload,
  Lock,
  Download,
} from 'lucide-react';

type Tab = 'personal' | 'job' | 'salary' | 'documents';

export const EmployeeProfileModal: React.FC = () => {
  const {
    selectedEmployeeForModal,
    isProfileModalOpen,
    closeEmployeeProfile,
    updateEmployee,
    currentRole,
    currentUser,
    addToast,
  } = useHR();

  const [activeTab, setActiveTab] = useState<Tab>('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Employee | null>(
    selectedEmployeeForModal
  );

  useEffect(() => {
    setFormData(selectedEmployeeForModal);
    setActiveTab('personal');
    setIsEditing(false);
  }, [selectedEmployeeForModal]);

  if (!isProfileModalOpen || !formData) return null;

  const isAdmin = currentRole === 'admin';
  const isOwner = currentUser?.id === formData.id;
  const canEditPersonal = isAdmin || isOwner;
  const canEditJob = isAdmin;
  const canEditSalary = isAdmin;
  const canUploadDocuments = isAdmin || isOwner;

  const fieldClass = (editable: boolean) =>
    `w-full px-3 py-2 text-xs rounded-xl border outline-none transition-colors ${
      editable
        ? 'border-purple-400 dark:border-purple-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 ring-1 ring-purple-200 dark:ring-purple-900'
        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-400'
    }`;

  const moneyFieldClass = (editable: boolean) =>
    `w-full px-3 py-1.5 text-xs rounded-lg border outline-none transition-colors ${
      editable
        ? 'border-purple-400 dark:border-purple-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 ring-1 ring-purple-200 dark:ring-purple-900'
        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-400'
    }`;

  const setPersonal = (changes: Partial<Employee['personalDetails']>) => {
    setFormData({
      ...formData,
      personalDetails: {
        ...formData.personalDetails,
        ...changes,
      },
    });
  };

  const setJob = (changes: Partial<Employee['jobDetails']>) => {
    setFormData({
      ...formData,
      jobDetails: {
        ...formData.jobDetails,
        ...changes,
      },
    });
  };

  const setSalary = (changes: Partial<Employee['salaryStructure']>) => {
    setFormData({
      ...formData,
      salaryStructure: {
        ...formData.salaryStructure,
        ...changes,
      },
    });
  };

  const handleSave = async () => {
    await updateEmployee(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(selectedEmployeeForModal);
    setIsEditing(false);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canUploadDocuments) return;

    const url = URL.createObjectURL(file);

    const doc = {
      id: `doc-${Date.now()}`,
      name: file.name,
      type: file.type.includes('pdf') ? 'PDF' : 'Document',
      uploadDate: new Date().toISOString().split('T')[0],
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      status: 'Uploaded' as const,
    };

    const updated = {
      ...formData,
      avatar: file.type.startsWith('image/') ? url : formData.avatar,
      documents: [doc, ...(formData.documents || [])],
    };

    setFormData(updated);
    addToast('success', 'File Added', `${file.name} was attached to the profile.`);
  };

  const gross =
    formData.salaryStructure.basicSalary +
    formData.salaryStructure.hra +
    formData.salaryStructure.conveyanceAllowance +
    formData.salaryStructure.medicalAllowance +
    formData.salaryStructure.specialAllowance;

  const net =
    gross -
    formData.salaryStructure.providentFund -
    formData.salaryStructure.incomeTax -
    formData.salaryStructure.professionalTax;

  const salaryNumber = (
    key: keyof Employee['salaryStructure'],
    value: string
  ) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const numeric = cleaned === '' ? 0 : Number(cleaned);
    setSalary({ [key]: Number.isFinite(numeric) ? numeric : 0 });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full overflow-hidden my-6 max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 text-white relative shrink-0">
          <button
            type="button"
            onClick={closeEmployeeProfile}
            aria-label="Close profile"
            className="absolute right-3 top-3 z-30 w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pr-12">
            <div className="relative group shrink-0">
              <img
                src={formData.avatar}
                alt={`${formData.firstName} ${formData.lastName}`}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '';
                }}
                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white/20 shadow-lg bg-purple-800"
              />

              {isEditing && canEditPersonal && (
                <label className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center cursor-pointer text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload className="w-4 h-4 mb-0.5" />
                  <span>Change</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpload}
                  />
                </label>
              )}
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl font-bold text-white">
                  {formData.firstName} {formData.lastName}
                </h2>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/20 text-purple-200">
                  {formData.employeeId}
                </span>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {formData.status}
                </span>
              </div>

              <p className="text-xs text-purple-200 mt-1">
                {formData.jobDetails.designation} • {formData.jobDetails.department}
              </p>

              <p className="text-[11px] text-slate-300 mt-0.5">
                Joined {formData.jobDetails.dateOfJoining || '—'} •{' '}
                {formData.jobDetails.workLocation} ({formData.jobDetails.employmentType})
              </p>
            </div>

            {canEditPersonal && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="shrink-0 px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold border border-white/20 flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Profile
              </button>
            )}

            {isEditing && (
              <div className="shrink-0 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-100 dark:bg-slate-950 shrink-0 overflow-x-auto">
          {[
            { id: 'personal' as Tab, label: 'Personal Details', icon: User },
            { id: 'job' as Tab, label: 'Job & Employment', icon: Briefcase },
            { id: 'salary' as Tab, label: 'Salary Structure', icon: Banknote },
            { id: 'documents' as Tab, label: 'Documents & Files', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap ${
                  active
                    ? 'border-purple-600 dark:border-purple-500 text-purple-700 dark:text-purple-300 bg-white dark:bg-slate-800'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-900 dark:text-slate-100">

          {/* Personal */}
          {activeTab === 'personal' && (
            <div className="space-y-4">
              {!isAdmin && isEditing && isOwner && (
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 text-xs flex gap-2">
                  <Lock className="w-4 h-4 shrink-0" />
                  You can edit your personal and emergency contact information. Job and salary information is managed by HR.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">First Name</label>
                  <input
                    value={formData.firstName}
                    disabled={!canEditPersonal || !isEditing}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={fieldClass(canEditPersonal && isEditing)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Last Name</label>
                  <input
                    value={formData.lastName}
                    disabled={!canEditPersonal || !isEditing}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={fieldClass(canEditPersonal && isEditing)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Work Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled={!isAdmin || !isEditing}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={fieldClass(isAdmin && isEditing)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Phone Number</label>
                  <input
                    value={formData.phone || ''}
                    disabled={!canEditPersonal || !isEditing}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={fieldClass(canEditPersonal && isEditing)}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1">Residential Address</label>
                  <input
                    value={formData.personalDetails.address || ''}
                    disabled={!canEditPersonal || !isEditing}
                    onChange={(e) => setPersonal({ address: e.target.value })}
                    className={fieldClass(canEditPersonal && isEditing)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">City / State</label>
                  <input
                    value={formData.personalDetails.city || ''}
                    disabled={!canEditPersonal || !isEditing}
                    onChange={(e) => setPersonal({ city: e.target.value })}
                    className={fieldClass(canEditPersonal && isEditing)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.personalDetails.dob || ''}
                    disabled={!isAdmin || !isEditing}
                    onChange={(e) => setPersonal({ dob: e.target.value })}
                    className={fieldClass(isAdmin && isEditing)}
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-bold uppercase tracking-wider mb-3">
                  Emergency Contact Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] mb-1 text-slate-600 dark:text-slate-400">Contact Name</label>
                    <input
                      value={formData.personalDetails.emergencyContactName || ''}
                      disabled={!canEditPersonal || !isEditing}
                      onChange={(e) => setPersonal({ emergencyContactName: e.target.value })}
                      className={fieldClass(canEditPersonal && isEditing)}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] mb-1 text-slate-600 dark:text-slate-400">Relationship</label>
                    <input
                      value={formData.personalDetails.emergencyContactRelation || ''}
                      disabled={!canEditPersonal || !isEditing}
                      onChange={(e) => setPersonal({ emergencyContactRelation: e.target.value })}
                      className={fieldClass(canEditPersonal && isEditing)}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] mb-1 text-slate-600 dark:text-slate-400">Emergency Phone</label>
                    <input
                      value={formData.personalDetails.emergencyContactPhone || ''}
                      disabled={!canEditPersonal || !isEditing}
                      onChange={(e) => setPersonal({ emergencyContactPhone: e.target.value })}
                      className={fieldClass(canEditPersonal && isEditing)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Job */}
          {activeTab === 'job' && (
            <div className="space-y-4">
              {!isAdmin && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs">
                  Job information can only be changed by HR administrators.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Designation / Title</label>
                  <input
                    value={formData.jobDetails.designation}
                    disabled={!canEditJob || !isEditing}
                    onChange={(e) => setJob({ designation: e.target.value })}
                    className={fieldClass(canEditJob && isEditing)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Department</label>
                  <select
                    value={formData.jobDetails.department}
                    disabled={!canEditJob || !isEditing}
                    onChange={(e) => setJob({ department: e.target.value as Department })}
                    className={fieldClass(canEditJob && isEditing)}
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product & Design">Product & Design</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="Operations">Operations</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Employment Type</label>
                  <select
                    value={formData.jobDetails.employmentType}
                    disabled={!canEditJob || !isEditing}
                    onChange={(e) => setJob({ employmentType: e.target.value as EmploymentType })}
                    className={fieldClass(canEditJob && isEditing)}
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Work Location</label>
                  <select
                    value={formData.jobDetails.workLocation}
                    disabled={!canEditJob || !isEditing}
                    onChange={(e) => setJob({ workLocation: e.target.value as WorkLocation })}
                    className={fieldClass(canEditJob && isEditing)}
                  >
                    <option value="On-Site">On-Site</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Date of Joining</label>
                  <input
                    type="date"
                    value={formData.jobDetails.dateOfJoining}
                    disabled={!canEditJob || !isEditing}
                    onChange={(e) => setJob({ dateOfJoining: e.target.value })}
                    className={fieldClass(canEditJob && isEditing)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Reporting Manager</label>
                  <input
                    value={formData.jobDetails.managerName || ''}
                    disabled={!canEditJob || !isEditing}
                    onChange={(e) => setJob({ managerName: e.target.value })}
                    className={fieldClass(canEditJob && isEditing)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Salary */}
          {activeTab === 'salary' && (
            <div className="space-y-4">
              {!isAdmin && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs">
                  Salary information can only be changed by HR administrators.
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 border border-purple-100 dark:border-purple-900/60">
                <div>
                  <span className="text-xs font-semibold text-purple-900 dark:text-purple-300 uppercase tracking-wider">
                    Total Monthly Gross CTC
                  </span>
                  <div className="text-2xl font-bold text-purple-950 dark:text-purple-200">
                    ${gross.toLocaleString()}
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Estimated Net Take-Home
                  </span>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    ${net.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    Earnings & Allowances
                  </h4>

                  {[
                    ['Basic Salary ($)', 'basicSalary'],
                    ['House Rent Allowance (HRA) ($)', 'hra'],
                    ['Conveyance Allowance ($)', 'conveyanceAllowance'],
                    ['Medical Allowance ($)', 'medicalAllowance'],
                    ['Special Allowance ($)', 'specialAllowance'],
                  ].map(([label, key]) => (
                    <div key={key}>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        {label}
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={String(
                          formData.salaryStructure[
                            key as keyof Employee['salaryStructure']
                          ] ?? ''
                        )}
                        disabled={!canEditSalary || !isEditing}
                        onChange={(e) =>
                          salaryNumber(
                            key as keyof Employee['salaryStructure'],
                            e.target.value
                          )
                        }
                        className={moneyFieldClass(canEditSalary && isEditing)}
                      />
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    Deductions & Taxes
                  </h4>

                  {[
                    ['Provident Fund (PF) ($)', 'providentFund'],
                    ['Income Tax (TDS) ($)', 'incomeTax'],
                    ['Professional Tax ($)', 'professionalTax'],
                  ].map(([label, key]) => (
                    <div key={key}>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        {label}
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={String(
                          formData.salaryStructure[
                            key as keyof Employee['salaryStructure']
                          ] ?? ''
                        )}
                        disabled={!canEditSalary || !isEditing}
                        onChange={(e) =>
                          salaryNumber(
                            key as keyof Employee['salaryStructure'],
                            e.target.value
                          )
                        }
                        className={moneyFieldClass(canEditSalary && isEditing)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Documents */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    Verified Credentials & Contracts
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Official employment documents and compliance papers
                  </p>
                </div>

                {canUploadDocuments && (
                  <label className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    Upload Document
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleUpload}
                    />
                  </label>
                )}
              </div>

              {(formData.documents || []).length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
                  No documents uploaded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {(formData.documents || []).map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">
                            {doc.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {doc.size} • Uploaded {doc.uploadDate}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          addToast(
                            'info',
                            'File Download',
                            `Downloading ${doc.name} is not connected to Storage yet.`
                          )
                        }
                        className="p-1.5 text-slate-400 hover:text-purple-500"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Employee ID:{' '}
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              {formData.employeeId}
            </span>
          </div>

          <button
            type="button"
            onClick={closeEmployeeProfile}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
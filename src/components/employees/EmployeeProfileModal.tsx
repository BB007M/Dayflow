import React, { useState } from 'react';
import { useHR } from '../../context/HRContext';
import { Employee, Department, EmploymentType, WorkLocation } from '../../types';
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
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  AlertCircle,
  FileCheck,
  Download,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';

export const EmployeeProfileModal: React.FC = () => {
  const { 
    selectedEmployeeForModal, 
    isProfileModalOpen, 
    closeEmployeeProfile, 
    updateEmployee, 
    currentRole, 
    currentUser,
    addToast
  } = useHR();

  const [activeTab, setActiveTab] = useState<'personal' | 'job' | 'salary' | 'documents'>('personal');
  const [isEditing, setIsEditing] = useState(false);
  
  // Editable form state initialized from selected employee
  const [formData, setFormData] = useState<Employee | null>(selectedEmployeeForModal);

  // Sync state if selectedEmployeeForModal changes
  React.useEffect(() => {
    setFormData(selectedEmployeeForModal);
    setIsEditing(false);
  }, [selectedEmployeeForModal]);

  if (!isProfileModalOpen || !formData) return null;

  const isAdmin = currentRole === 'admin';
  const isOwner = currentUser ? currentUser.id === formData.id : false;
  const canEdit = isAdmin || isOwner;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    updateEmployee(formData);
    setIsEditing(false);
    addToast('success', 'Profile Updated', `Changes to ${formData.firstName} ${formData.lastName}'s profile saved.`);
  };

  const handleCancel = () => {
    setFormData(selectedEmployeeForModal);
    setIsEditing(false);
  };

  const handleAddDocument = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !formData) return;

    const newDoc = {
      id: `doc-${Date.now()}`,
      name: file.name,
      type: file.type.includes('pdf') ? 'PDF' : 'Document',
      uploadDate: new Date().toISOString().split('T')[0],
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      status: 'Uploaded' as const,
    };

    const updated = {
      ...formData,
      documents: [newDoc, ...formData.documents],
    };
    setFormData(updated);
    updateEmployee(updated);
    addToast('success', 'Document Attached', `${file.name} uploaded to profile.`);
  };

  return (
    <div 
      id="employee-profile-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
    >
      <div 
        id="employee-profile-modal-container"
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden transition-all my-6 max-h-[92vh] flex flex-col relative"
      >
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 text-white relative shrink-0">
          
          {/* Top-Right Control Bar (Separate & Non-Overlapping) */}
          <div className="absolute right-4 top-4 flex items-center gap-2 z-10">
            {canEdit && (
              !isEditing ? (
                <button
                  type="button"
                  id="profile-edit-toggle-btn"
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur-md border border-white/20 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    id="profile-cancel-edit-btn"
                    onClick={handleCancel}
                    className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 text-xs font-semibold backdrop-blur-md border border-white/20 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    id="profile-save-changes-btn"
                    onClick={handleSave}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                </div>
              )
            )}

            <button
              type="button"
              id="profile-close-btn"
              onClick={closeEmployeeProfile}
              className="p-1.5 rounded-xl text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/10 transition-colors cursor-pointer"
              aria-label="Close profile modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pr-0 sm:pr-36">
            <div className="relative group shrink-0">
              <img
                src={formData.avatar}
                alt={formData.firstName}
                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white/20 shadow-lg"
              />
              {isEditing && (
                <label className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center cursor-pointer text-[10px] text-white opacity-90 group-hover:opacity-100 transition-opacity">
                  <Upload className="w-4 h-4 mb-0.5" />
                  <span>Change</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = URL.createObjectURL(file);
                        setFormData({ ...formData, avatar: url });
                      }
                    }}
                  />
                </label>
              )}
            </div>

            <div className="text-center sm:text-left flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl font-bold font-display tracking-tight text-white truncate">
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
              <p className="text-[11px] text-slate-300 mt-0.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span>Joined {formData.jobDetails.dateOfJoining}</span>
                <span>•</span>
                <span>{formData.jobDetails.workLocation} ({formData.jobDetails.employmentType})</span>
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/80 shrink-0 overflow-x-auto">
          {[
            { id: 'personal', label: 'Personal Details', icon: User },
            { id: 'job', label: 'Job & Employment', icon: Briefcase },
            { id: 'salary', label: 'Salary Structure', icon: Banknote },
            { id: 'documents', label: 'Documents & Files', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`profile-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-purple-600 text-purple-700 bg-white shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-purple-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* Edit Mode Alert / Notice */}
          {isEditing ? (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Edit Mode Active:</strong>{' '}
                {isAdmin 
                  ? 'You are editing this profile with Administrator privileges. All fields and salary figures are editable.' 
                  : 'You can update your personal contact details, residential address, emergency contacts, and profile picture. Job designation and salary structures are managed by HR.'
                }
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-500 text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>View-only mode. Click <strong>Edit Profile</strong> at the top right to make changes.</span>
              </span>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-purple-600 hover:text-purple-700 font-semibold cursor-pointer text-xs"
                >
                  Enable Edit
                </button>
              )}
            </div>
          )}

          {/* TAB 1: PERSONAL DETAILS */}
          {activeTab === 'personal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>First Name</span>
                    {isEditing && !isAdmin && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Lock className="w-3 h-3" /> HR Managed</span>}
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing || !isAdmin}
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${
                      isEditing && isAdmin 
                        ? 'border-purple-400 bg-white ring-1 ring-purple-100' 
                        : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed select-none'
                    } outline-none`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Last Name</span>
                    {isEditing && !isAdmin && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Lock className="w-3 h-3" /> HR Managed</span>}
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing || !isAdmin}
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${
                      isEditing && isAdmin 
                        ? 'border-purple-400 bg-white ring-1 ring-purple-100' 
                        : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed select-none'
                    } outline-none`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Work Email</span>
                    {isEditing && !isAdmin && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Lock className="w-3 h-3" /> HR Managed</span>}
                  </label>
                  <input
                    type="email"
                    disabled={!isEditing || !isAdmin}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${
                      isEditing && isAdmin 
                        ? 'border-purple-400 bg-white ring-1 ring-purple-100' 
                        : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed select-none'
                    } outline-none`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Phone Number</span>
                    {isEditing && <span className="text-[10px] text-emerald-600 font-bold">Editable</span>}
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${
                      isEditing 
                        ? 'border-purple-400 bg-white ring-1 ring-purple-200' 
                        : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed select-none'
                    } outline-none`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Residential Address</span>
                    {isEditing && <span className="text-[10px] text-emerald-600 font-bold">Editable</span>}
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.personalDetails.address}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personalDetails: { ...formData.personalDetails, address: e.target.value },
                      })
                    }
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${
                      isEditing 
                        ? 'border-purple-400 bg-white ring-1 ring-purple-200' 
                        : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed select-none'
                    } outline-none`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>City / State</span>
                    {isEditing && <span className="text-[10px] text-emerald-600 font-bold">Editable</span>}
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.personalDetails.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personalDetails: { ...formData.personalDetails, city: e.target.value },
                      })
                    }
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${
                      isEditing 
                        ? 'border-purple-400 bg-white ring-1 ring-purple-200' 
                        : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed select-none'
                    } outline-none`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Date of Birth</span>
                    {isEditing && !isAdmin && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Lock className="w-3 h-3" /> HR Managed</span>}
                  </label>
                  <input
                    type="date"
                    disabled={!isEditing || !isAdmin}
                    value={formData.personalDetails.dob}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personalDetails: { ...formData.personalDetails, dob: e.target.value },
                      })
                    }
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${
                      isEditing && isAdmin 
                        ? 'border-purple-400 bg-white ring-1 ring-purple-100' 
                        : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed select-none'
                    } outline-none`}
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Emergency Contact Information</span>
                  {isEditing && <span className="text-[10px] text-emerald-600 font-bold normal-case">Editable</span>}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Contact Name</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.personalDetails.emergencyContactName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          personalDetails: { ...formData.personalDetails, emergencyContactName: e.target.value },
                        })
                      }
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                        isEditing ? 'border-purple-400 bg-white' : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Relationship</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.personalDetails.emergencyContactRelation}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          personalDetails: { ...formData.personalDetails, emergencyContactRelation: e.target.value },
                        })
                      }
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                        isEditing ? 'border-purple-400 bg-white' : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Emergency Phone</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.personalDetails.emergencyContactPhone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          personalDetails: { ...formData.personalDetails, emergencyContactPhone: e.target.value },
                        })
                      }
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                        isEditing ? 'border-purple-400 bg-white' : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: JOB & EMPLOYMENT */}
          {activeTab === 'job' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Designation / Title</span>
                    {isEditing && !isAdmin && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Lock className="w-3 h-3" /> HR Managed</span>}
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing || !isAdmin}
                    value={formData.jobDetails.designation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        jobDetails: { ...formData.jobDetails, designation: e.target.value },
                      })
                    }
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${
                      isEditing && isAdmin 
                        ? 'border-purple-400 bg-white ring-1 ring-purple-100' 
                        : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed select-none'
                    } outline-none`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Department</span>
                    {isEditing && !isAdmin && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Lock className="w-3 h-3" /> HR Managed</span>}
                  </label>
                  <select
                    disabled={!isEditing || !isAdmin}
                    value={formData.jobDetails.department}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        jobDetails: { ...formData.jobDetails, department: e.target.value as Department },
                      })
                    }
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${
                      isEditing && isAdmin 
                        ? 'border-purple-400 bg-white ring-1 ring-purple-100' 
                        : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed select-none'
                    } outline-none`}
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Employment Type</span>
                    {isEditing && !isAdmin && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Lock className="w-3 h-3" /> HR Managed</span>}
                  </label>
                  <select
                    disabled={!isEditing || !isAdmin}
                    value={formData.jobDetails.employmentType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        jobDetails: { ...formData.jobDetails, employmentType: e.target.value as EmploymentType },
                      })
                    }
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${
                      isEditing && isAdmin 
                        ? 'border-purple-400 bg-white ring-1 ring-purple-100' 
                        : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed select-none'
                    } outline-none`}
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Work Location</span>
                    {isEditing && !isAdmin && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Lock className="w-3 h-3" /> HR Managed</span>}
                  </label>
                  <select
                    disabled={!isEditing || !isAdmin}
                    value={formData.jobDetails.workLocation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        jobDetails: { ...formData.jobDetails, workLocation: e.target.value as WorkLocation },
                      })
                    }
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${
                      isEditing && isAdmin 
                        ? 'border-purple-400 bg-white ring-1 ring-purple-100' 
                        : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed select-none'
                    } outline-none`}
                  >
                    <option value="On-Site">On-Site</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Date of Joining</span>
                    {isEditing && !isAdmin && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Lock className="w-3 h-3" /> HR Managed</span>}
                  </label>
                  <input
                    type="date"
                    disabled={!isEditing || !isAdmin}
                    value={formData.jobDetails.dateOfJoining}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        jobDetails: { ...formData.jobDetails, dateOfJoining: e.target.value },
                      })
                    }
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${
                      isEditing && isAdmin 
                        ? 'border-purple-400 bg-white ring-1 ring-purple-100' 
                        : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed select-none'
                    } outline-none`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Reporting Manager</span>
                    {isEditing && !isAdmin && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Lock className="w-3 h-3" /> HR Managed</span>}
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing || !isAdmin}
                    value={formData.jobDetails.managerName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        jobDetails: { ...formData.jobDetails, managerName: e.target.value },
                      })
                    }
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${
                      isEditing && isAdmin 
                        ? 'border-purple-400 bg-white ring-1 ring-purple-100' 
                        : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed select-none'
                    } outline-none`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SALARY STRUCTURE */}
          {activeTab === 'salary' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100">
                <div>
                  <span className="text-xs font-semibold text-purple-900 uppercase tracking-wider">
                    Total Monthly Gross CTC
                  </span>
                  <div className="text-2xl font-bold text-purple-950 font-display">
                    $
                    {(
                      (formData.salaryStructure?.basicSalary || 0) +
                      (formData.salaryStructure?.hra || 0) +
                      (formData.salaryStructure?.conveyanceAllowance || 0) +
                      (formData.salaryStructure?.medicalAllowance || 0) +
                      (formData.salaryStructure?.specialAllowance || 0)
                    ).toLocaleString()}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Estimated Net Take-Home
                  </span>
                  <div className="text-2xl font-bold text-emerald-600 font-display">
                    $
                    {(
                      (formData.salaryStructure?.basicSalary || 0) +
                      (formData.salaryStructure?.hra || 0) +
                      (formData.salaryStructure?.conveyanceAllowance || 0) +
                      (formData.salaryStructure?.medicalAllowance || 0) +
                      (formData.salaryStructure?.specialAllowance || 0) -
                      ((formData.salaryStructure?.providentFund || 0) +
                        (formData.salaryStructure?.incomeTax || 0) +
                        (formData.salaryStructure?.professionalTax || 0))
                    ).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Earnings */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                    <span>Earnings & Allowances</span>
                    {isEditing && !isAdmin && <span className="text-[10px] text-slate-400 flex items-center gap-1 font-normal"><Lock className="w-3 h-3" /> HR Managed</span>}
                  </h4>
                  
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Basic Salary ($)</label>
                    <input
                      type="number"
                      disabled={!isEditing || !isAdmin}
                      value={formData.salaryStructure.basicSalary}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          salaryStructure: { ...formData.salaryStructure, basicSalary: Number(e.target.value) },
                        })
                      }
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                        isEditing && isAdmin ? 'border-purple-400 bg-white' : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed select-none'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">House Rent Allowance (HRA) ($)</label>
                    <input
                      type="number"
                      disabled={!isEditing || !isAdmin}
                      value={formData.salaryStructure.hra}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          salaryStructure: { ...formData.salaryStructure, hra: Number(e.target.value) },
                        })
                      }
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                        isEditing && isAdmin ? 'border-purple-400 bg-white' : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed select-none'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Special Allowance ($)</label>
                    <input
                      type="number"
                      disabled={!isEditing || !isAdmin}
                      value={formData.salaryStructure.specialAllowance}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          salaryStructure: { ...formData.salaryStructure, specialAllowance: Number(e.target.value) },
                        })
                      }
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                        isEditing && isAdmin ? 'border-purple-400 bg-white' : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed select-none'
                      }`}
                    />
                  </div>
                </div>

                {/* Deductions */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                    <span>Deductions & Taxes</span>
                    {isEditing && !isAdmin && <span className="text-[10px] text-slate-400 flex items-center gap-1 font-normal"><Lock className="w-3 h-3" /> HR Managed</span>}
                  </h4>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Provident Fund (PF) ($)</label>
                    <input
                      type="number"
                      disabled={!isEditing || !isAdmin}
                      value={formData.salaryStructure.providentFund}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          salaryStructure: { ...formData.salaryStructure, providentFund: Number(e.target.value) },
                        })
                      }
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                        isEditing && isAdmin ? 'border-purple-400 bg-white' : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed select-none'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Income Tax (TDS) ($)</label>
                    <input
                      type="number"
                      disabled={!isEditing || !isAdmin}
                      value={formData.salaryStructure.incomeTax}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          salaryStructure: { ...formData.salaryStructure, incomeTax: Number(e.target.value) },
                        })
                      }
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                        isEditing && isAdmin ? 'border-purple-400 bg-white' : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed select-none'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Professional Tax ($)</label>
                    <input
                      type="number"
                      disabled={!isEditing || !isAdmin}
                      value={formData.salaryStructure.professionalTax}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          salaryStructure: { ...formData.salaryStructure, professionalTax: Number(e.target.value) },
                        })
                      }
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                        isEditing && isAdmin ? 'border-purple-400 bg-white' : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed select-none'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Verified Credentials & Contracts
                  </h4>
                  <p className="text-xs text-slate-500">Official employment documents and compliance papers</p>
                </div>

                {isEditing && (
                  <label className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-xs transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Document</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleAddDocument}
                    />
                  </label>
                )}
              </div>

              <div className="space-y-2">
                {formData.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                        <FileCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {doc.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {doc.size} • Uploaded {doc.uploadDate}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        {doc.status}
                      </span>
                      <button
                        onClick={() => addToast('info', 'File Download', `Simulated downloading ${doc.name}`)}
                        className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Employee ID: <span className="font-mono font-bold text-slate-700">{formData.employeeId}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {isEditing && (
              <button
                type="button"
                id="modal-footer-cancel-btn"
                onClick={handleCancel}
                className="px-3.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
            {isEditing ? (
              <button
                type="button"
                id="modal-footer-save-btn"
                onClick={handleSave}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            ) : (
              <button
                type="button"
                id="modal-footer-close-btn"
                onClick={closeEmployeeProfile}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

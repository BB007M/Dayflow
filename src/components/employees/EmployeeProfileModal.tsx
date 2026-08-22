import React, { useRef, useState } from 'react';
import { useHR } from '../../context/HRContext';
import { ProfilePlaceholder } from '../common/ProfilePlaceholder';
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
  MapPin, 
  AlertCircle,
  FileCheck,
  Download,
  RotateCcw,
  Flame,
  UserX,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';

export const EmployeeProfileModal: React.FC = () => {
  const { 
    selectedEmployeeForModal, 
    isProfileModalOpen, 
    closeEmployeeProfile, 
    updateEmployee, 
    terminateEmployee,
    rehireEmployee,
    currentRole, 
    currentUser,
    addToast
  } = useHR();

  const [activeTab, setActiveTab] = useState<'personal' | 'job' | 'salary' | 'documents'>('personal');
  const [isEditing, setIsEditing] = useState(false);
  
  // Editable form state initialized from selected employee
  const [formData, setFormData] = useState<Employee | null>(selectedEmployeeForModal);

  // Termination Confirmation inside Modal
  const [showFireConfirm, setShowFireConfirm] = useState(false);
  const [fireReason, setFireReason] = useState('Performance Discrepancy');
  const [fireNotes, setFireNotes] = useState('');
  const [isProcessingTermination, setIsProcessingTermination] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Sync state if selectedEmployeeForModal changes
  React.useEffect(() => {
    setFormData(selectedEmployeeForModal);
    setIsEditing(false);
    setShowFireConfirm(false);
  }, [selectedEmployeeForModal]);

  if (!isProfileModalOpen || !formData) return null;

  const isAdmin = currentRole === 'admin';
  const isOwner = currentUser ? currentUser.id === formData.id : false;
  const canEdit = isAdmin || isOwner;
  const isTerminated = formData.status === 'Terminated';

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

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !formData) return;

    if (!file.type.startsWith('image/')) {
      addToast('error', 'Choose an image', 'Please select a JPG, PNG, WebP, or other image file.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      addToast('error', 'Image is too large', 'Choose an image smaller than 4 MB.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Unable to read the selected image.'));
        reader.readAsDataURL(file);
      });
      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: `avatar-${formData.id}-${Date.now()}-${file.name}`,
          fileData,
          bucket: 'avatars',
          contentType: file.type,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success || !result.url) {
        throw new Error(result.error || 'Image upload failed.');
      }

      setFormData((current) => current ? { ...current, avatar: result.url } : current);
      addToast('success', 'Photo ready', 'Your new profile photo will be saved with the profile changes.');
    } catch (error) {
      addToast('error', 'Photo upload failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = '';
    }
  };

  const handleExecuteFire = async () => {
    if (!formData) return;
    setIsProcessingTermination(true);
    try {
      await terminateEmployee(formData.id, fireReason, fireNotes);
      setFormData((prev) => (prev ? { ...prev, status: 'Terminated' } : null));
      setShowFireConfirm(false);
    } finally {
      setIsProcessingTermination(false);
    }
  };

  const handleExecuteRehire = async () => {
    if (!formData) return;
    setIsProcessingTermination(true);
    try {
      await rehireEmployee(formData.id);
      setFormData((prev) => (prev ? { ...prev, status: 'Active' } : null));
    } finally {
      setIsProcessingTermination(false);
    }
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

  const getStatusPill = (status: Employee['status']) => {
    switch (status) {
      case 'Active':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            Active
          </span>
        );
      case 'Terminated':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/30 text-rose-200 border border-rose-400/50 flex items-center gap-1">
            <UserX className="w-3 h-3 text-rose-300" />
            Terminated
          </span>
        );
      case 'On Leave':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
            On Leave
          </span>
        );
      case 'Probation':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            Probation
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
            {status}
          </span>
        );
    }
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
        <div className={`p-6 text-white relative shrink-0 ${
          isTerminated 
            ? 'bg-gradient-to-r from-rose-950 via-rose-900 to-slate-950' 
            : 'bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900'
        }`}>
          
          {/* Top-Right Control Bar */}
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
                <ProfilePlaceholder imageUrl={formData.avatar} label={`${formData.firstName} ${formData.lastName}`} className={`w-20 h-20 text-lg rounded-2xl ring-4 shadow-lg ${isTerminated ? 'ring-rose-400/40' : 'ring-white/20'}`} />
                {isEditing && canEdit && (
                  <>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleAvatarChange}
                    />
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-xl border border-white/25 bg-white text-purple-700 shadow-lg transition hover:scale-105 disabled:cursor-wait disabled:opacity-70 flex items-center justify-center"
                      aria-label="Upload profile photo"
                      title="Upload profile photo"
                    >
                      <Upload className={`h-3.5 w-3.5 ${isUploadingAvatar ? 'animate-pulse' : ''}`} />
                    </button>
                  </>
                )}
            </div>

            <div className="text-center sm:text-left flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className={`text-xl font-bold font-display tracking-tight text-white truncate ${
                  isTerminated ? 'line-through text-slate-300' : ''
                }`}>
                  {formData.firstName} {formData.lastName}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/20 text-purple-200">
                  {formData.employeeId}
                </span>
                {getStatusPill(formData.status)}
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

        {/* Termination Alert Bar */}
        {isTerminated && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-3 flex items-center justify-between gap-3 text-xs text-rose-900">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>Employment Terminated:</strong> This employee is deactivated in Supabase. System login access has been revoked.
              </span>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={handleExecuteRehire}
                disabled={isProcessingTermination}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Rehire Employee</span>
              </button>
            )}
          </div>
        )}

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
          
          {/* TAB 1: PERSONAL DETAILS */}
          {activeTab === 'personal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${
                      isEditing ? 'border-purple-400 bg-white ring-1 ring-purple-100' : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed'
                    } outline-none`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${
                      isEditing ? 'border-purple-400 bg-white ring-1 ring-purple-100' : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed'
                    } outline-none`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
                  <input
                    type="email"
                    disabled={!isEditing || !isAdmin}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${
                      isEditing && isAdmin ? 'border-purple-400 bg-white ring-1 ring-purple-100' : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed'
                    } outline-none`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${
                      isEditing ? 'border-purple-400 bg-white ring-1 ring-purple-100' : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed'
                    } outline-none`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    disabled={!isEditing}
                    value={formData.personalDetails?.dateOfBirth || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personalDetails: { ...formData.personalDetails, dateOfBirth: e.target.value },
                      })
                    }
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${
                      isEditing ? 'border-purple-400 bg-white ring-1 ring-purple-100' : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed'
                    } outline-none`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    disabled={!isEditing}
                    value={formData.personalDetails?.gender || 'Prefer not to say'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personalDetails: { ...formData.personalDetails, gender: e.target.value as any },
                      })
                    }
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${
                      isEditing ? 'border-purple-400 bg-white ring-1 ring-purple-100' : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed'
                    } outline-none`}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              {/* Address details */}
              <div className="pt-3 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-purple-600" />
                  <span>Residential Address</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Street Address</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.personalDetails?.address || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          personalDetails: { ...formData.personalDetails, address: e.target.value },
                        })
                      }
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                        isEditing ? 'border-purple-400 bg-white' : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">City</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.personalDetails?.city || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          personalDetails: { ...formData.personalDetails, city: e.target.value },
                        })
                      }
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                        isEditing ? 'border-purple-400 bg-white' : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">State / Region</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.personalDetails?.state || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          personalDetails: { ...formData.personalDetails, state: e.target.value },
                        })
                      }
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                        isEditing ? 'border-purple-400 bg-white' : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Postal Code</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.personalDetails?.postalCode || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          personalDetails: { ...formData.personalDetails, postalCode: e.target.value },
                        })
                      }
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                        isEditing ? 'border-purple-400 bg-white' : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="pt-3 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-purple-600" />
                  <span>Emergency Contact</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Contact Name</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.personalDetails?.emergencyContactName || ''}
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
                      value={formData.personalDetails?.emergencyContactRelation || ''}
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
                      value={formData.personalDetails?.emergencyContactPhone || ''}
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

                {/* Status selector if editing as Admin */}
                {isAdmin && (
                  <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-purple-600" />
                      <span>Employee Status (HR Administrative Control)</span>
                    </label>
                    <select
                      disabled={!isEditing}
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as any,
                        })
                      }
                      className={`w-full px-3 py-2 text-xs rounded-xl border ${
                        isEditing 
                          ? 'border-purple-400 bg-white' 
                          : 'border-slate-200 bg-slate-100 text-slate-600'
                      } font-semibold`}
                    >
                      <option value="Active">Active (Full Access)</option>
                      <option value="Probation">Probation (Standard Employee)</option>
                      <option value="On Leave">On Leave (Active Contract)</option>
                      <option value="Terminated">Terminated (Revoke Portal Access)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Admin Separation & Termination Section */}
              {isAdmin && !isOwner && (
                <div className="mt-6 pt-5 border-t border-slate-200">
                  <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/50 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                          <Flame className="w-4 h-4 text-rose-600" />
                          <span>Employee Separation & Termination Control</span>
                        </h4>
                        <p className="text-[11px] text-rose-700 mt-0.5">
                          {isTerminated 
                            ? 'This employee is currently marked as Terminated. You can reactivate their profile below.'
                            : 'Formally fire or terminate this employee, update Supabase records, and revoke login credentials.'}
                        </p>
                      </div>

                      {isTerminated ? (
                        <button
                          type="button"
                          onClick={handleExecuteRehire}
                          disabled={isProcessingTermination}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reactivate Employee</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowFireConfirm(true)}
                          className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Flame className="w-3.5 h-3.5" />
                          <span>Fire / Terminate</span>
                        </button>
                      )}
                    </div>

                    {/* In-modal confirmation accordion */}
                    {showFireConfirm && !isTerminated && (
                      <div className="mt-3 p-3.5 bg-white rounded-xl border border-rose-300 space-y-3 animate-in fade-in duration-150">
                        <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>Confirm Termination of {formData.firstName} {formData.lastName}</span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">Termination Reason</label>
                          <select
                            value={fireReason}
                            onChange={(e) => setFireReason(e.target.value)}
                            className="w-full p-2 text-xs bg-slate-50 rounded-lg border border-slate-300 text-slate-800"
                          >
                            <option value="Performance Discrepancy">Performance Discrepancy / KPI Non-Attainment</option>
                            <option value="Gross Misconduct / Policy Violation">Gross Misconduct / Policy Violation</option>
                            <option value="Company Restructuring & Redundancy">Company Restructuring & Workforce Redundancy</option>
                            <option value="Voluntary Resignation / Separation">Voluntary Resignation / Separation</option>
                            <option value="Probation Assessment Non-Confirmation">Probation Assessment Non-Confirmation</option>
                            <option value="Other Administrative Decision">Other Administrative Decision</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">HR Notes</label>
                          <input
                            type="text"
                            placeholder="Optional notes or clearance status..."
                            value={fireNotes}
                            onChange={(e) => setFireNotes(e.target.value)}
                            className="w-full p-2 text-xs bg-slate-50 rounded-lg border border-slate-300 text-slate-800"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowFireConfirm(false)}
                            className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleExecuteFire}
                            disabled={isProcessingTermination}
                            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Flame className="w-3.5 h-3.5" />
                            <span>{isProcessingTermination ? 'Processing...' : 'Confirm Fire Employee'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
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
                  <div className="text-2xl font-bold text-emerald-700 font-display">
                    $
                    {(
                      (formData.salaryStructure?.basicSalary || 0) +
                      (formData.salaryStructure?.hra || 0) +
                      (formData.salaryStructure?.conveyanceAllowance || 0) +
                      (formData.salaryStructure?.medicalAllowance || 0) +
                      (formData.salaryStructure?.specialAllowance || 0) -
                      (formData.salaryStructure?.providentFund || 0) -
                      (formData.salaryStructure?.incomeTax || 0) -
                      (formData.salaryStructure?.professionalTax || 0)
                    ).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Earnings breakdown */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center justify-between">
                  <span>Monthly Earnings Breakdown</span>
                  {isEditing && !isAdmin && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Lock className="w-3 h-3" /> HR Managed</span>}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Basic Salary ($)</label>
                    <input
                      type="number"
                      disabled={!isEditing || !isAdmin}
                      value={formData.salaryStructure?.basicSalary || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          salaryStructure: {
                            ...formData.salaryStructure,
                            basicSalary: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                        isEditing && isAdmin ? 'border-purple-400 bg-white' : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">HRA ($)</label>
                    <input
                      type="number"
                      disabled={!isEditing || !isAdmin}
                      value={formData.salaryStructure?.hra || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          salaryStructure: {
                            ...formData.salaryStructure,
                            hra: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                        isEditing && isAdmin ? 'border-purple-400 bg-white' : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Conveyance Allowance ($)</label>
                    <input
                      type="number"
                      disabled={!isEditing || !isAdmin}
                      value={formData.salaryStructure?.conveyanceAllowance || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          salaryStructure: {
                            ...formData.salaryStructure,
                            conveyanceAllowance: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                        isEditing && isAdmin ? 'border-purple-400 bg-white' : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Medical Allowance ($)</label>
                    <input
                      type="number"
                      disabled={!isEditing || !isAdmin}
                      value={formData.salaryStructure?.medicalAllowance || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          salaryStructure: {
                            ...formData.salaryStructure,
                            medicalAllowance: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                        isEditing && isAdmin ? 'border-purple-400 bg-white' : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Special Allowance ($)</label>
                    <input
                      type="number"
                      disabled={!isEditing || !isAdmin}
                      value={formData.salaryStructure?.specialAllowance || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          salaryStructure: {
                            ...formData.salaryStructure,
                            specialAllowance: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                        isEditing && isAdmin ? 'border-purple-400 bg-white' : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Deductions breakdown */}
              <div className="pt-3 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center justify-between">
                  <span>Monthly Deductions & Tax Provisions</span>
                  {isEditing && !isAdmin && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Lock className="w-3 h-3" /> HR Managed</span>}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Provident Fund (PF) ($)</label>
                    <input
                      type="number"
                      disabled={!isEditing || !isAdmin}
                      value={formData.salaryStructure?.providentFund || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          salaryStructure: {
                            ...formData.salaryStructure,
                            providentFund: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                        isEditing && isAdmin ? 'border-purple-400 bg-white' : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Income Tax (TDS) ($)</label>
                    <input
                      type="number"
                      disabled={!isEditing || !isAdmin}
                      value={formData.salaryStructure?.incomeTax || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          salaryStructure: {
                            ...formData.salaryStructure,
                            incomeTax: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                        isEditing && isAdmin ? 'border-purple-400 bg-white' : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Professional Tax ($)</label>
                    <input
                      type="number"
                      disabled={!isEditing || !isAdmin}
                      value={formData.salaryStructure?.professionalTax || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          salaryStructure: {
                            ...formData.salaryStructure,
                            professionalTax: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                        isEditing && isAdmin ? 'border-purple-400 bg-white' : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Bank & Tax Details */}
              <div className="pt-3 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-purple-600" />
                  <span>Disbursement Account & Tax IDs</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Bank Name</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.bankDetails?.bankName || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bankDetails: { ...formData.bankDetails, bankName: e.target.value },
                        })
                      }
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                        isEditing ? 'border-purple-400 bg-white' : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Account Number (Masked)</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.bankDetails?.accountNumberMasked || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bankDetails: { ...formData.bankDetails, accountNumberMasked: e.target.value },
                        })
                      }
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                        isEditing ? 'border-purple-400 bg-white' : 'border-slate-200 bg-slate-100/70 text-slate-600 cursor-not-allowed'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Tax Identification / PAN</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.bankDetails?.panOrTaxId || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bankDetails: { ...formData.bankDetails, panOrTaxId: e.target.value },
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

          {/* TAB 4: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Uploaded Verification Documents</h4>
                  <p className="text-[11px] text-slate-500">Employment agreements, government IDs, and certificates</p>
                </div>
                <label className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                  <input type="file" className="hidden" onChange={handleAddDocument} />
                </label>
              </div>

              {formData.documents.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-600">No documents uploaded yet</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Upload onboarding contracts, ID proofs, or degrees</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {formData.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3 hover:border-purple-200 hover:shadow-2xs transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {doc.type}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">{doc.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {doc.size} • Uploaded {doc.uploadDate}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                          {doc.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Employee ID: <span className="font-mono font-bold text-slate-700">{formData.employeeId}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Quick Fire Button in Footer for Admin */}
            {isAdmin && !isOwner && !isTerminated && !isEditing && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('job');
                  setShowFireConfirm(true);
                }}
                className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 text-rose-600" />
                <span>Fire Employee</span>
              </button>
            )}

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

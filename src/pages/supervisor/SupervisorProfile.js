import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Clock,
  Shield,
  Save,
  RotateCcw,
  LogOut,
  CheckCircle2,
  HardHat,
  Briefcase,
} from 'lucide-react';
import { useCivic } from '../../context/CivicContext';

export function SupervisorProfile() {
  const navigate = useNavigate();
  const {
    supervisorProfile,
    updateSupervisorProfile,
    workOrders,
    workerTasks,
  } = useCivic();

  // Editable Form State (Section 15)
  const [formData, setFormData] = useState({
    name: supervisorProfile.name || 'Supervisor M. Rao',
    employeeId: supervisorProfile.employeeId || 'EMP-SUP-2024-08',
    email: supervisorProfile.email || 'm.rao@civicconnect.gov.in',
    phone: supervisorProfile.phone || '+91 98451 22334',
    department: supervisorProfile.department || 'Roads & Bridges Dept',
    assignedArea: supervisorProfile.assignedArea || 'Central Zone - Ward 14 Indiranagar',
    shift: supervisorProfile.shift || 'Day Shift (08:00 AM - 05:00 PM)',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Statistics
  const activeWOCount = workOrders.filter(
    (w) => !w.supervisor || w.supervisor.toLowerCase().includes('rao')
  ).length;

  const totalTasksSupervised = workerTasks.length;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateSupervisorProfile(formData);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const handleCancel = () => {
    setFormData({
      name: supervisorProfile.name,
      employeeId: supervisorProfile.employeeId,
      email: supervisorProfile.email,
      phone: supervisorProfile.phone,
      department: supervisorProfile.department,
      assignedArea: supervisorProfile.assignedArea,
      shift: supervisorProfile.shift,
    });
    setIsEditing(false);
  };

  const handleSignOut = () => {
    navigate('/');
  };

  return (
    <div className="space-y-6 pb-12 font-sans max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-civic-text flex items-center space-x-2">
            <User className="w-6 h-6 text-civic-blue" />
            <span>Field Supervisor Profile</span>
          </h2>
          <p className="text-xs text-civic-muted mt-0.5">
            Manage your credentials, departmental assignments, ward coverage, and contact details.
          </p>
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-colors self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out / Switch Role</span>
        </button>
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-800 flex items-center space-x-2 font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Supervisor profile information updated successfully!</span>
        </div>
      )}

      {/* Profile Summary Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="relative">
          <img
            src={supervisorProfile.avatarUrl}
            alt={supervisorProfile.name}
            className="w-24 h-24 rounded-3xl object-cover ring-4 ring-blue-50 shadow-md"
          />
          <div className="absolute -bottom-2 -right-2 p-1.5 bg-civic-blue text-white rounded-xl shadow-md">
            <HardHat className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-2 text-center md:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <h3 className="text-xl font-extrabold text-slate-900">{supervisorProfile.name}</h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-civic-blue">
              Field Supervisor
            </span>
          </div>

          <p className="text-xs text-slate-500 font-medium">
            {supervisorProfile.title || 'Senior Field Works Supervisor'} &bull; {supervisorProfile.department}
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-600 pt-1">
            <span className="flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>ID: <strong className="font-mono text-slate-800">{supervisorProfile.employeeId}</strong></span>
            </span>
            <span className="flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{supervisorProfile.assignedArea}</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{supervisorProfile.shift}</span>
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex md:flex-col gap-3 shrink-0 text-center">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 w-28">
            <span className="font-extrabold text-xl text-civic-blue block">{activeWOCount}</span>
            <span className="text-[10px] text-slate-400 font-medium uppercase">Active Orders</span>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 w-28">
            <span className="font-extrabold text-xl text-purple-600 block">{totalTasksSupervised}</span>
            <span className="text-[10px] text-slate-400 font-medium uppercase">Total Tasks</span>
          </div>
        </div>
      </div>

      {/* Profile Form (Section 15) */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h4 className="text-base font-bold text-slate-900">Supervisor Account Details</h4>
            <p className="text-xs text-slate-400">
              Demonstration profile fields connected to reactive state.
            </p>
          </div>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-xl bg-civic-blue hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center space-x-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Supervisor Name */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Supervisor Full Name *</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="name"
                disabled={!isEditing}
                value={formData.name}
                onChange={handleInputChange}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 disabled:bg-slate-50 focus:ring-2 focus:ring-civic-blue"
                required
              />
            </div>
          </div>

          {/* Employee ID */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Municipal Employee ID *</label>
            <div className="relative">
              <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="employeeId"
                disabled={!isEditing}
                value={formData.employeeId}
                onChange={handleInputChange}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 font-mono text-xs font-semibold text-slate-800 disabled:bg-slate-50 focus:ring-2 focus:ring-civic-blue"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Official Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                name="email"
                disabled={!isEditing}
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 disabled:bg-slate-50 focus:ring-2 focus:ring-civic-blue"
                required
              />
            </div>
          </div>

          {/* Contact Number */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Contact Phone Number *</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="phone"
                disabled={!isEditing}
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 disabled:bg-slate-50 focus:ring-2 focus:ring-civic-blue"
                required
              />
            </div>
          </div>

          {/* Department */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Municipal Department *</label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="department"
                disabled={!isEditing}
                value={formData.department}
                onChange={handleInputChange}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 disabled:bg-slate-50 focus:ring-2 focus:ring-civic-blue"
                required
              />
            </div>
          </div>

          {/* Assigned Area */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Assigned Ward Coverage / Area *</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="assignedArea"
                disabled={!isEditing}
                value={formData.assignedArea}
                onChange={handleInputChange}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 disabled:bg-slate-50 focus:ring-2 focus:ring-civic-blue"
                required
              />
            </div>
          </div>

          {/* Shift */}
          <div className="space-y-1 md:col-span-2">
            <label className="font-bold text-slate-700 block">Active Shift Hours</label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="shift"
                disabled={!isEditing}
                value={formData.shift}
                onChange={handleInputChange}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 disabled:bg-slate-50 focus:ring-2 focus:ring-civic-blue"
              />
            </div>
          </div>

          {isEditing && (
            <div className="md:col-span-2 flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-civic-blue hover:bg-blue-700 text-white font-bold shadow-md"
              >
                Save Profile Updates
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

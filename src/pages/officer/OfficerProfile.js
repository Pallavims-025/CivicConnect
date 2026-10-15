import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Save,
  LogOut,
  Info,
} from 'lucide-react';
import { useCivic } from '../../context/CivicContext';

export function OfficerProfile() {
  const navigate = useNavigate();
  const { officerProfile, updateOfficerProfile } = useCivic();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(officerProfile);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    updateOfficerProfile(formData);
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-extrabold text-civic-text flex items-center space-x-2">
          <Shield className="w-6 h-6 text-civic-navy" />
          <span>Municipal Officer Profile & Credentials</span>
        </h2>
        <p className="text-xs text-civic-muted">
          Designation, department jurisdiction, engineering clearance levels, and field contact details.
        </p>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 text-xs">
          Officer profile successfully updated for this session.
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center space-x-4 pb-6 border-b border-slate-100">
          <img
            src={officerProfile.avatarUrl}
            alt={officerProfile.name}
            className="w-16 h-16 rounded-2xl object-cover ring-4 ring-blue-50"
          />
          <div>
            <h3 className="text-lg font-bold text-slate-900">{officerProfile.name}</h3>
            <p className="text-xs text-slate-500">{officerProfile.title}</p>
            <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-civic-blue text-[10px] font-bold rounded-md border border-blue-200 mt-1">
              {officerProfile.department}
            </span>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Officer Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Designation Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Ward Jurisdiction Coverage</label>
              <input
                type="text"
                value={formData.wardCoverage}
                onChange={(e) => setFormData({ ...formData, wardCoverage: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setFormData(officerProfile);
                  setIsEditing(false);
                }}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-civic-blue text-white font-bold hover:bg-blue-700"
              >
                Save Profile
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium block mb-0.5">Government Email</span>
                <span className="font-semibold text-slate-800">{officerProfile.email}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium block mb-0.5">Official Wireless / Phone</span>
                <span className="font-semibold text-slate-800">{officerProfile.phone}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium block mb-0.5">Primary Department</span>
                <span className="font-semibold text-slate-800">{officerProfile.department}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium block mb-0.5">Jurisdiction Coverage</span>
                <span className="font-semibold text-slate-800">{officerProfile.wardCoverage}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
              >
                Edit Officer Details
              </button>

              <button
                onClick={() => navigate('/')}
                className="text-rose-600 hover:text-rose-700 font-semibold text-xs flex items-center space-x-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out / Switch Mode</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

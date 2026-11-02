import React, { useState } from 'react';
import { Shield, User, Mail, Phone, Building, MapPin, Save, CheckCircle, Key, Server, Lock } from 'lucide-react';
import { useCivic } from '../../context/CivicContext';

export function AdminProfile() {
  const { auditLogs } = useCivic();

  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Santosh (Admin)',
    title: 'Lead System Administrator & Platform Architect',
    department: 'IT & Digital Governance',
    email: 'admin@civicconnect.org',
    phone: '+91 91234 56789',
    jurisdiction: 'All Municipal Zones (Platform-Wide Admin)',
    clearanceLevel: 'Level 4 — Master Superuser',
    joinedDate: '2026-01-01',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Shield className="text-purple-600 w-6 h-6" /> System Administrator Profile
        </h1>
        <p className="text-sm text-slate-500">
          Master administrative credentials, system access clearance, and governance profile settings
        </p>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 text-xs flex items-center gap-2">
          <CheckCircle size={16} /> Admin profile credentials successfully updated.
        </div>
      )}

      {/* Main Profile Card */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center space-x-4">
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-purple-50"
            />
            <div>
              <h3 className="text-lg font-bold text-slate-900">{profile.name}</h3>
              <p className="text-xs text-slate-500">{profile.title}</p>
              <div className="flex flex-wrap gap-2 mt-1.5">
                <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 text-[11px] font-bold rounded-lg border border-purple-200">
                  {profile.clearanceLevel}
                </span>
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-semibold rounded-lg border border-blue-200">
                  {profile.department}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="self-start sm:self-auto px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            {isEditing ? 'Cancel' : 'Edit Credentials'}
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  Admin Name
                </label>
                <input
                  type="text"
                  required
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  Designation Title
                </label>
                <input
                  type="text"
                  required
                  value={profile.title}
                  onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  Official Email
                </label>
                <input
                  type="email"
                  required
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  Jurisdiction Scope
                </label>
                <input
                  type="text"
                  value={profile.jurisdiction}
                  onChange={(e) => setProfile({ ...profile, jurisdiction: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-purple-600 text-white px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 hover:bg-purple-700 transition"
              >
                <Save size={14} /> Save Profile Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                <Mail size={13} /> Official Email
              </div>
              <div className="font-semibold text-slate-900 text-sm">{profile.email}</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                <Phone size={13} /> Emergency Helpline
              </div>
              <div className="font-semibold text-slate-900 text-sm">{profile.phone}</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                <Building size={13} /> Assigned Division
              </div>
              <div className="font-semibold text-slate-900 text-sm">{profile.department}</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                <MapPin size={13} /> Jurisdiction Scope
              </div>
              <div className="font-semibold text-slate-900 text-sm">{profile.jurisdiction}</div>
            </div>
          </div>
        )}

        {/* Security & Access Rights Matrix */}
        <div className="pt-6 border-t border-slate-100 space-y-3">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Lock size={16} className="text-purple-600" /> Platform Security & Root Privileges
          </h4>
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl flex items-start gap-2.5">
              <Key size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">Master Access Control:</strong>
                <p className="text-slate-500">Authorized to manage role permissions across Citizen, Officer, Supervisor, and Admin accounts.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl flex items-start gap-2.5">
              <Server size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">Database & Schema Governance:</strong>
                <p className="text-slate-500">Prisma MySQL 8.x schema migrations, telemetry KPI tracking, and system audit history access.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

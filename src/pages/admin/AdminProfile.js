import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Camera, CheckCircle, Key, Lock, LogOut, Mail, Phone, Server, Shield, Upload, User, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchAdminProfile, resolveAdminAvatarUrl, uploadAdminProfilePhoto } from '../../services/adminProfileApi';

const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
const maxPhotoSize = 5 * 1024 * 1024;

function initials(name) {
  return (name || '?').trim().split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || '?';
}

export function AdminProfile() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const photoInputRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [pendingPhoto, setPendingPhoto] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchAdminProfile()
      .then((data) => { if (active) setProfile(data); })
      .catch((error) => { if (active) setPhotoError(error.message || 'Administrator profile could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.id]);

  const handlePhotoSelection = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setPhotoError('');
    const extension = `.${file.name.split('.').pop()?.toLowerCase() || ''}`;
    const typeAllowed = allowedMimeTypes.includes(file.type) || (!file.type && allowedExtensions.includes(extension));
    if (!typeAllowed || !allowedExtensions.includes(extension)) {
      setPhotoError('Choose a JPEG, JPG, PNG, or WebP image.');
      return;
    }
    if (!file.size || file.size > maxPhotoSize) {
      setPhotoError('Choose an image that is 5 MB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => setPhotoError('The selected image could not be read. Please try another file.');
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setPhotoError('The selected image could not be previewed. Please try another file.');
        return;
      }
      setPhotoFailed(false);
      setPendingPhoto(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCancelPhoto = () => {
    setPendingPhoto('');
    setPhotoError('');
    setPhotoFailed(false);
  };

  const handleSavePhoto = async () => {
    if (!pendingPhoto) return;
    setPhotoBusy(true);
    setPhotoError('');
    try {
      const savedProfile = await uploadAdminProfilePhoto(pendingPhoto);
      setProfile(savedProfile);
      setPendingPhoto('');
      setPhotoFailed(false);
      await refreshUser();
    } catch (error) {
      setPhotoError(error.message || 'Profile photo could not be saved. Please try again.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleSignOut = () => {
    if (logout) {
      logout().finally(() => navigate('/login', { replace: true }));
    } else {
      navigate('/login', { replace: true });
    }
  };

  const currentAvatarUrl = pendingPhoto || resolveAdminAvatarUrl(profile?.avatarUrl);
  const departmentName = profile?.department?.name || 'Municipal Information & Technology Directorate';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Shield className="h-6 w-6 text-purple-600" /> Administrator Credentials &amp; Clearance
        </h1>
        <p className="text-sm text-slate-500">
          Root administrative clearance profile, platform oversight credentials, and authentication details.
        </p>
      </header>

      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="relative group shrink-0">
            {currentAvatarUrl && !photoFailed ? (
              <img
                src={currentAvatarUrl}
                alt={profile?.name || 'Administrator'}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-purple-500 shadow-sm"
                onError={() => setPhotoFailed(true)}
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-xl font-bold border-2 border-purple-500 shadow-sm">
                {initials(profile?.name)}
              </div>
            )}
            <button
              type="button"
              disabled={photoBusy}
              onClick={() => photoInputRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 shadow-xs hover:bg-slate-50 disabled:opacity-50"
              aria-label="Upload profile photo"
            >
              <Camera size={14} />
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept={allowedMimeTypes.join(',')}
              className="hidden"
              onChange={handlePhotoSelection}
            />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900 truncate">{loading ? 'Loading…' : profile?.name || 'Santosh (Admin)'}</h2>
              <span className="px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-bold">
                ROOT PRIVILEGES
              </span>
            </div>
            <p className="text-xs text-slate-500">{profile?.title || 'Lead System Administrator'}</p>
            <p className="text-xs text-slate-400">{departmentName}</p>
          </div>

          <div className="sm:ml-auto flex flex-wrap gap-2">
            {pendingPhoto && (
              <>
                <button type="button" disabled={photoBusy} onClick={handleSavePhoto} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 disabled:opacity-50">
                  <Upload size={14} /> {photoBusy ? 'Saving…' : 'Save Photo'}
                </button>
                <button type="button" disabled={photoBusy} onClick={handleCancelPhoto} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50">
                  <X size={14} /> Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {photoError && <div role="alert" className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">{photoError}</div>}

        <p className="text-[11px] text-slate-400">JPEG, JPG, PNG, or WebP · Maximum 5 MB</p>

        <div className="grid sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium"><User size={13} /> Full Name</div>
            <div className="font-semibold text-slate-900 text-sm">{profile?.name || '—'}</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium"><Mail size={13} /> Official Email</div>
            <div className="font-semibold text-slate-900 text-sm break-all">{profile?.email || '—'}</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium"><Phone size={13} /> Contact Phone</div>
            <div className="font-semibold text-slate-900 text-sm">{profile?.phone || 'Not provided'}</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium"><Building size={13} /> Department</div>
            <div className="font-semibold text-slate-900 text-sm">{departmentName}</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium"><Shield size={13} /> Designation</div>
            <div className="font-semibold text-slate-900 text-sm">{profile?.title || 'Not specified'}</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium"><CheckCircle size={13} /> Account Created</div>
            <div className="font-semibold text-slate-900 text-sm">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}</div>
          </div>
        </div>

        <div className="pt-5 border-t border-slate-100 space-y-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2"><Lock size={16} className="text-purple-600" /> Platform Security & Root Privileges</h3>
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl flex items-start gap-2.5"><Key size={16} className="text-emerald-600 shrink-0 mt-0.5" /><div><strong className="text-slate-800">Master Access Control</strong><p className="text-slate-500">Administrator access is managed by your authenticated account.</p></div></div>
            <div className="p-3 bg-slate-50 rounded-xl flex items-start gap-2.5"><Server size={16} className="text-blue-600 shrink-0 mt-0.5" /><div><strong className="text-slate-800">Database & Schema Governance</strong><p className="text-slate-500">Your profile and photo are associated with your administrator record.</p></div></div>
          </div>
        </div>

        {/* Administrator Sign Out Action */}
        <div className="pt-5 border-t border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Sign Out</h4>
            <p className="text-slate-500 text-xs">End your current administrator session and return to login.</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </section>
    </div>
  );
}

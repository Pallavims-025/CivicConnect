import React, { useEffect, useRef, useState } from 'react';
import { Building, Camera, CheckCircle, Key, Lock, Mail, Phone, Server, Shield, Upload, User, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchAdminProfile, resolveAdminAvatarUrl, uploadAdminProfilePhoto } from '../../services/adminProfileApi';

const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
const maxPhotoSize = 5 * 1024 * 1024;

function initials(name) {
  return (name || '?').trim().split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || '?';
}

export function AdminProfile() {
  const { user, refreshUser } = useAuth();
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

  const profileName = profile?.name || user?.name || '';
  const profilePhoto = pendingPhoto || resolveAdminAvatarUrl(profile?.avatarUrl);
  const departmentName = profile?.department?.name || 'Not assigned';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Shield className="text-purple-600 w-6 h-6" /> Administrator Profile
        </h1>
        <p className="text-sm text-slate-500">View your administrator account information and update your profile photo.</p>
      </div>

      {loading && <p role="status" className="text-sm text-slate-500">Loading administrator profile…</p>}
      {!loading && photoError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">{photoError}</p>}

      <section className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative shrink-0">
              {profilePhoto && !photoFailed ? (
                <img
                  src={profilePhoto}
                  alt={`${profileName || 'Administrator'} profile`}
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-purple-50"
                  onError={() => setPhotoFailed(true)}
                />
              ) : (
                <div aria-label="Administrator initials" className="w-20 h-20 rounded-full bg-purple-600 text-white flex items-center justify-center text-xl font-bold ring-4 ring-purple-50">
                  {initials(profileName)}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 rounded-full bg-white p-1.5 text-purple-600 shadow border border-slate-100" aria-hidden="true">
                <Camera size={14} />
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900 truncate">{profileName || (loading ? 'Loading…' : 'Administrator')}</h2>
              <p className="text-xs text-slate-500">{profile?.title || 'Administrator'}</p>
              <span className="inline-flex mt-2 px-2.5 py-0.5 bg-purple-50 text-purple-700 text-[11px] font-bold rounded-lg border border-purple-200">Administrator</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              onChange={handlePhotoSelection}
              className="hidden"
              aria-label="Choose profile photo"
            />
            {!pendingPhoto ? (
              <button
                type="button"
                disabled={loading || photoBusy}
                onClick={() => photoInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 disabled:opacity-50"
              >
                <Camera size={14} /> {profile?.avatarUrl ? 'Change Photo' : 'Upload Photo'}
              </button>
            ) : (
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
      </section>
    </div>
  );
}

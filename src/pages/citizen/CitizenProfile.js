import React, { useEffect, useRef, useState } from 'react';
import { Camera, MapPin, Mail, Phone, Trash2 } from 'lucide-react';
import { useCivic } from '../../context/CivicContext';
import { useAuth } from '../../context/AuthContext';
import { getMyComplaints, updateCitizenProfileRequest } from '../../services/api';

const initials = (name = '') => name.trim().split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || '?';
const dateLabel = (date) => date ? new Date(date).toLocaleDateString() : '—';

export function CitizenProfile() {
  const { citizenProfile, updateCitizenProfile } = useCivic();
  const { refreshUser } = useAuth();
  const inputRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(citizenProfile);
  const [complaints, setComplaints] = useState([]);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => setForm(citizenProfile), [citizenProfile]);
  useEffect(() => { getMyComplaints().then(setComplaints).catch(() => setError('Could not load your complaints.')); }, []);

  const save = async (event) => {
    event.preventDefault(); setError('');
    try {
      const result = await updateCitizenProfileRequest({ name: form.name, alternateContactNumber: form.alternateContactNumber || null, address: form.address || '', preferredLanguage: form.preferredLanguage || null });
      updateCitizenProfile(result.user); await refreshUser(); setEditing(false); setSaved(true);
    } catch (err) { setError(err.message || 'Profile could not be saved.'); }
  };
  const uploadPhoto = (event) => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) { setError('Choose a JPEG, PNG, or WebP image under 2 MB.'); return; }
    const reader = new FileReader(); reader.onload = async () => {
      try { const result = await updateCitizenProfileRequest({ avatarUrl: reader.result }); updateCitizenProfile(result.user); await refreshUser(); setError(''); }
      catch (err) { setError(err.message || 'Photo could not be saved.'); }
    }; reader.readAsDataURL(file);
  };
  const removePhoto = async () => { try { const result = await updateCitizenProfileRequest({ avatarUrl: null }); updateCitizenProfile(result.user); await refreshUser(); } catch (err) { setError(err.message); } };

  return <div className="max-w-3xl mx-auto space-y-6">
    <h2 className="text-xl md:text-2xl font-extrabold text-civic-text">Profile</h2>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {saved && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">Profile saved.</p>}
    <section className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
      <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
        {citizenProfile.avatarUrl ? <img src={citizenProfile.avatarUrl} alt={citizenProfile.name} className="w-16 h-16 rounded-full object-cover ring-4 ring-blue-50" /> : <div className="w-16 h-16 rounded-full bg-civic-blue text-white flex items-center justify-center text-lg font-bold">{initials(citizenProfile.name)}</div>}
        <div className="flex-1"><h3 className="text-lg font-bold text-slate-900">{citizenProfile.name}</h3><p className="text-sm text-slate-500">{citizenProfile.email}</p>
          <button type="button" onClick={() => inputRef.current?.click()} className="mt-2 text-xs font-semibold text-civic-blue inline-flex gap-1"><Camera className="w-4 h-4"/>Upload or change photo</button>
          {citizenProfile.avatarUrl && <button type="button" onClick={removePhoto} className="ml-4 text-xs text-rose-600 inline-flex gap-1"><Trash2 className="w-4 h-4"/>Remove</button>}
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadPhoto} className="hidden" />
        </div>
      </div>
      {editing ? <form onSubmit={save} className="space-y-4">
        <label className="block text-xs font-semibold">Full name<input required minLength="2" value={form.name || ''} onChange={(e) => setForm({...form,name:e.target.value})} className="mt-1 w-full rounded-xl border p-3"/></label>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block text-xs font-semibold">Email<input readOnly value={citizenProfile.email || ''} className="mt-1 w-full rounded-xl border bg-slate-50 p-3"/></label>
          <label className="block text-xs font-semibold">Primary contact<input readOnly value={citizenProfile.phone || ''} className="mt-1 w-full rounded-xl border bg-slate-50 p-3"/></label>
          <label className="block text-xs font-semibold">Alternate contact number<input type="tel" value={form.alternateContactNumber || ''} onChange={(e) => setForm({...form,alternateContactNumber:e.target.value})} className="mt-1 w-full rounded-xl border p-3"/></label>
          <label className="block text-xs font-semibold">Preferred language<select value={form.preferredLanguage || ''} onChange={(e) => setForm({...form,preferredLanguage:e.target.value})} className="mt-1 w-full rounded-xl border p-3"><option value="">Select language</option>{['English','ಕನ್ನಡ','हिन्दी','தமிழ்','తెలుగు','اردو'].map(x=><option key={x}>{x}</option>)}</select></label>
        </div>
        <label className="block text-xs font-semibold">Address<textarea rows="3" value={form.address || ''} onChange={(e) => setForm({...form,address:e.target.value})} className="mt-1 w-full rounded-xl border p-3"/></label>
        <div className="flex justify-end gap-2"><button type="button" onClick={()=>{setForm(citizenProfile);setEditing(false);setError('');}} className="px-4 py-2 rounded-xl bg-slate-100">Cancel</button><button className="px-4 py-2 rounded-xl bg-civic-blue text-white">Save changes</button></div>
      </form> : <>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">{[['Email',citizenProfile.email,Mail],['Contact',citizenProfile.phone,Phone],['Alternate contact',citizenProfile.alternateContactNumber],['Address',citizenProfile.address,MapPin],['Preferred language',citizenProfile.preferredLanguage]].map(([label,value,Icon])=><div key={label} className="rounded-xl border bg-slate-50 p-3"><span className="text-slate-500">{Icon && <Icon className="inline w-4 h-4 mr-1"/>}{label}</span><div className="font-semibold mt-1">{value || 'Not provided'}</div></div>)}</div>
        <button onClick={()=>{setSaved(false);setEditing(true);}} className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-sm">Edit profile</button>
      </>}
    </section>
    <section className="bg-white rounded-3xl p-6 border border-slate-200"><h3 className="font-bold text-slate-900 mb-4">My complaints</h3>{complaints.length ? <ul className="divide-y">{complaints.map(c=><li key={c.databaseId || c.id} className="py-3 flex flex-wrap justify-between gap-2 text-sm"><div><strong>{c.title || c.category}</strong><p className="text-slate-500">{c.id} · {dateLabel(c.reportedDate)}{c.address ? ` · ${c.address}` : ''}</p></div><span className="font-semibold">{c.status?.replaceAll('_',' ')}</span></li>)}</ul> : <p className="text-sm text-slate-500">No complaints submitted yet.</p>}</section>
  </div>;
}

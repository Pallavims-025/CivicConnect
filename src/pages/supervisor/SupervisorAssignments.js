import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, ExternalLink, MapPin, RefreshCw, Upload } from 'lucide-react';
import { getMyAssignments, submitAssignmentCompletion, updateAssignmentStatus } from '../../services/api';

const statusLabel = (status) => (status || '').replaceAll('_', ' ');
const statusStyle = (status) => status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : status === 'AWAITING_VERIFICATION' ? 'bg-purple-100 text-purple-800' : status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : status === 'REWORK_REQUIRED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800';

export function SupervisorAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  const refresh = useCallback(async (initial = false) => {
    if (initial) setLoading(true); else setRefreshing(true);
    try {
      const records = await getMyAssignments();
      setAssignments(records || []);
      setError('');
    } catch (fetchError) {
      setError(fetchError.message || 'Could not load assignments.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refresh(true);
    const timer = window.setInterval(() => refresh(false), 30000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const changeStatus = async (assignment, status) => {
    setSaving(true); setError(''); setSuccess('');
    try {
      await updateAssignmentStatus(assignment.id, { status });
      setSuccess(`Assignment ${status === 'ACCEPTED' ? 'accepted' : 'moved to in progress'}.`);
      await refresh(false);
    } catch (saveError) { setError(saveError.message || 'Could not update assignment.'); }
    finally { setSaving(false); }
  };

  const addPhotos = (event) => {
    const selectedFiles = [...(event.target.files || [])];
    event.target.value = '';
    for (const file of selectedFiles) {
      if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
        setError('Each completion photo must be an image no larger than 5 MB.');
        continue;
      }
      if (photos.length >= 5) { setError('You can submit up to 5 completion photos.'); break; }
      const reader = new FileReader();
      reader.onload = () => setPhotos((current) => current.length >= 5 || current.includes(reader.result) ? current : [...current, reader.result]);
      reader.readAsDataURL(file);
    }
  };

  const completeWork = async (assignment) => {
    setSaving(true); setError(''); setSuccess('');
    try {
      await submitAssignmentCompletion(assignment.id, { remarks, photos: [...new Set(photos)] });
      setPhotos([]); setRemarks('');
      setSuccess('Completion submitted to the Municipal Officer for verification.');
      await refresh(false);
    } catch (saveError) { setError(saveError.message || 'Could not submit completion.'); }
    finally { setSaving(false); }
  };

  const selected = assignments.find((assignment) => assignment.id === selectedId);

  return <div className="space-y-5">
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h1 className="text-xl md:text-2xl font-extrabold text-civic-text">My Assigned Work</h1><p className="text-xs text-civic-muted mt-1">Only work assigned to your supervisor account is shown here.</p></div><button onClick={() => refresh(false)} disabled={refreshing} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />Refresh</button></header>
    {error && <div role="alert" className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
    {success && <div role="status" className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs">{success}</div>}
    {loading ? <div className="bg-white rounded-2xl p-12 text-center text-sm text-slate-500">Loading assigned work…</div> : assignments.length === 0 ? <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center"><BriefcaseIcon /><p className="font-semibold text-slate-700 mt-3">No work has been assigned to you yet.</p><p className="text-xs text-slate-500 mt-1">New assignments from a Municipal Officer will appear here.</p></div> : <div className="space-y-3">{assignments.map((assignment) => {
      const complaint = assignment.complaint;
      const active = ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'REWORK_REQUIRED'].includes(assignment.status);
      return <article key={assignment.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div className="min-w-0 space-y-2"><div className="flex flex-wrap gap-2 items-center"><span className="font-mono text-xs text-civic-blue">{assignment.workOrderCode || assignment.id}</span><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${statusStyle(assignment.status)}`}>{statusLabel(assignment.status)}</span><span className="text-xs font-semibold text-slate-500">{assignment.priority}</span></div><h2 className="font-bold text-slate-900">{complaint?.title}</h2><p className="text-xs text-slate-500">Complaint {complaint?.complaintCode || complaint?.id} · {complaint?.category?.name} · {complaint?.user?.name}</p><p className="text-xs text-slate-500 flex gap-1"><MapPin className="w-3.5 h-3.5 shrink-0" />{complaint?.address || 'Location not provided'}</p><p className="text-xs text-slate-500 flex gap-1"><Clock3 className="w-3.5 h-3.5" />Assigned {assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleString() : '—'} · Due {new Date(assignment.deadline).toLocaleString()}</p></div><div className="flex flex-wrap gap-2 shrink-0"><button onClick={() => { setSelectedId(selectedId === assignment.id ? null : assignment.id); setPhotos([]); setRemarks(''); }} className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">{selectedId === assignment.id ? 'Hide details' : 'Open details'}</button>{assignment.status === 'ASSIGNED' && <button onClick={() => changeStatus(assignment, 'ACCEPTED')} disabled={saving} className="px-3 py-2 rounded-lg bg-civic-blue text-white text-xs font-bold disabled:opacity-50">Accept</button>}{['ASSIGNED', 'ACCEPTED', 'REWORK_REQUIRED'].includes(assignment.status) && <button onClick={() => changeStatus(assignment, 'IN_PROGRESS')} disabled={saving} className="px-3 py-2 rounded-lg bg-blue-700 text-white text-xs font-bold disabled:opacity-50">Start / Resume</button>}</div></div>
        {selectedId === assignment.id && <div className="border-t border-slate-100 bg-slate-50/60 p-4 sm:p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4 text-xs"><Field label="Description" value={complaint?.description} /><Field label="Customer" value={`${complaint?.user?.name || 'Customer'} · ${complaint?.user?.email || 'No email'} · ${complaint?.user?.phone || 'No phone'}`} /><Field label="Category" value={complaint?.category?.name} /><Field label="Assignment instructions" value={assignment.workDescription} /><Field label="Municipal Officer" value={assignment.assignedByOfficer?.name} /><Field label="Complaint submitted" value={complaint?.createdAt ? new Date(complaint.createdAt).toLocaleString() : ''} /><Field label="Address" value={complaint?.address} /><Field label="Coordinates" value={Number.isFinite(complaint?.latitude) && Number.isFinite(complaint?.longitude) ? `${complaint.latitude}, ${complaint.longitude}` : 'Not provided'} /><Field label="Due date" value={assignment.deadline ? new Date(assignment.deadline).toLocaleString() : ''} /><Field label="Complaint status" value={statusLabel(complaint?.status)} /></div>
          {Number.isFinite(complaint?.latitude) && Number.isFinite(complaint?.longitude) && <a className="inline-flex items-center gap-1 text-xs text-blue-700 underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${complaint.latitude},${complaint.longitude}`}><MapPin className="w-3.5 h-3.5" />Open complaint location</a>}
          {complaint?.photos?.length > 0 && <PhotoGrid title="Customer photographs" photos={complaint.photos.map((photo) => photo.imageUrl)} />}
          {assignment.photos?.length > 0 && <PhotoGrid title="Submitted completion photographs" photos={assignment.photos.map((photo) => photo.imageUrl)} />}
          {assignment.statusHistory?.length > 0 && <section><h3 className="text-xs font-bold mb-2">Assignment history</h3><div className="space-y-2">{assignment.statusHistory.map((entry) => <p key={entry.id} className="text-xs text-slate-600">{new Date(entry.createdAt).toLocaleString()} · {entry.changedByName} · {statusLabel(entry.newStatus)}{entry.notes ? ` — ${entry.notes}` : ''}</p>)}</div></section>}
          {active && assignment.status !== 'ASSIGNED' && <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3"><h3 className="text-sm font-bold">Submit completed work</h3><p className="text-xs text-slate-500">Completion is sent for Municipal Officer verification. The complaint is not resolved until it is approved.</p><label className="block text-xs font-semibold">Completion remarks<textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} maxLength={5000} rows={3} className="mt-1 block w-full rounded-lg border border-slate-200 p-2" placeholder="Describe the work performed and any remaining issues" /></label><label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-xs font-semibold cursor-pointer"><Upload className="w-4 h-4" />Add completion photos<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={addPhotos} className="sr-only" /></label>{photos.length > 0 && <PhotoGrid title={`Photos to submit (${photos.length})`} photos={photos} />}{assignment.status === 'IN_PROGRESS' || assignment.status === 'REWORK_REQUIRED' ? <button onClick={() => completeWork(assignment)} disabled={saving || photos.length === 0 || !remarks.trim()} className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold disabled:opacity-50">{saving ? 'Submitting…' : 'Submit for verification'}</button> : null}</section>}
          {assignment.status === 'AWAITING_VERIFICATION' && <p className="flex items-center gap-2 text-xs text-purple-800 bg-purple-50 border border-purple-200 rounded-lg p-3"><CheckCircle2 className="w-4 h-4" />Your completion is awaiting municipal verification.</p>}
        </div>}
      </article>;
    })}</div>}
  </div>;
}

function Field({ label, value }) { return <div><p className="text-slate-400 font-semibold">{label}</p><p className="text-slate-800 mt-0.5 whitespace-pre-wrap break-words">{value || 'Not provided'}</p></div>; }
function PhotoGrid({ title, photos }) { return <section><h3 className="text-xs font-bold mb-2">{title}</h3><div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[...new Set(photos)].map((url, index) => <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer" className="group rounded-xl overflow-hidden border border-slate-200 bg-white relative" title="Open full size"><img src={url} alt={`${title} ${index + 1}`} className="w-full aspect-video object-cover" onError={(event) => { event.currentTarget.alt = 'Image unavailable'; event.currentTarget.classList.add('opacity-30'); }} /><ExternalLink className="absolute right-2 bottom-2 w-4 h-4 text-white drop-shadow" /></a>)}</div></section>; }
function BriefcaseIcon() { return <div className="mx-auto w-12 h-12 rounded-xl bg-blue-50 text-blue-700 grid place-items-center"><CheckCircle2 className="w-6 h-6" /></div>; }

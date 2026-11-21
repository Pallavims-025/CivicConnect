import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw, RotateCcw, ShieldCheck } from 'lucide-react';
import { getPendingVerifications, reviewAssignmentCompletion } from '../../services/api';

export function RepairVerification() {
  const [items, setItems] = useState([]);
  const [remarks, setRemarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const refresh = useCallback(async (initial = false) => {
    if (initial) setLoading(true); else setRefreshing(true);
    try { setItems(await getPendingVerifications() || []); setError(''); }
    catch (e) { setError(e.message || 'Could not load pending verifications.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { refresh(true); const timer = window.setInterval(() => refresh(), 30000); return () => window.clearInterval(timer); }, [refresh]);

  const decide = async (item, decision) => {
    const note = (remarks[item.id] || '').trim();
    if (note.length < 3) { setError('Enter review remarks before approving or requesting rework.'); return; }
    setBusy(item.id); setError(''); setSuccess('');
    try { await reviewAssignmentCompletion(item.id, { decision, remarks: note }); setSuccess(decision === 'APPROVE' ? 'Repair verified and complaint resolved.' : 'Rework request sent to the Field Supervisor.'); await refresh(); }
    catch (e) { setError(e.message || 'Could not save the verification decision.'); }
    finally { setBusy(null); }
  };

  return <div className="space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="flex items-center gap-2 text-xl font-extrabold text-civic-text md:text-2xl"><ShieldCheck className="h-5 w-5 text-emerald-600" />Field repair verification</h1><p className="mt-1 text-xs text-civic-muted">Review supervisor remarks and completion photographs. Approval resolves the complaint and notifies the customer.</p></div><button onClick={() => refresh()} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs font-semibold"><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />Refresh</button></header>
    {error && <div role="alert" className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}{success && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</div>}
    {loading ? <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">Loading completion reviews…</div> : items.length === 0 ? <div className="rounded-2xl border bg-white p-10 text-center text-sm text-slate-500">No supervisor completion reports are awaiting review.</div> : <div className="space-y-4">{items.map((item) => { const complaint = item.complaint; const workOrder = item.workOrder; const completionPhotos = workOrder?.photos || (item.completionPhotoUrl ? [{ imageUrl: item.completionPhotoUrl }] : []); return <article key={item.id} className="space-y-4 rounded-2xl border bg-white p-4 md:p-6"><header className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-purple-700">Verification pending · {workOrder?.workOrderCode || workOrder?.id}</p><h2 className="mt-1 font-bold text-slate-900">{complaint?.complaintCode || complaint?.id}: {complaint?.title}</h2><p className="mt-1 text-xs text-slate-500">Submitted by {complaint?.user?.name || 'Customer'} · Supervisor {item.submittedBySupervisor?.name || item.supervisorName || '—'} · {new Date(item.submittedAt).toLocaleString()}</p></div><span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold text-amber-800">Awaiting verification</span></header>
      <div className="rounded-xl bg-slate-50 p-3"><h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Supervisor completion remarks</h3><p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{item.completionDetails || 'No remarks provided.'}</p>{complaint?.address && <p className="mt-2 text-xs text-slate-500">{complaint.address}</p>}</div>
      <div><h3 className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">Completion photographs ({completionPhotos.length})</h3><div className="flex flex-wrap gap-2">{completionPhotos.map((photo, index) => <a key={photo.id || `${photo.imageUrl}-${index}`} href={photo.imageUrl} target="_blank" rel="noreferrer" className="block h-28 w-36 overflow-hidden rounded-lg border bg-slate-100"><img src={photo.imageUrl} alt={`Completion evidence ${index + 1}`} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.alt = 'Photo unavailable'; }} /></a>)}</div></div>
      <div className="flex flex-wrap gap-2">{(complaint?.photos || []).map((photo, index) => <a key={photo.id || index} href={photo.imageUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-civic-blue underline">Open original photo {index + 1}</a>)}</div>
      <label className="block text-xs font-semibold text-slate-700">Officer review remarks<textarea rows={2} value={remarks[item.id] || ''} onChange={(e) => setRemarks((current) => ({ ...current, [item.id]: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm" placeholder="Explain the verification or rework decision" /></label>
      <footer className="flex flex-wrap justify-end gap-2 border-t pt-3"><button disabled={busy === item.id} onClick={() => decide(item, 'REWORK')} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-50"><RotateCcw className="h-3.5 w-3.5" />Request rework</button><button disabled={busy === item.id} onClick={() => decide(item, 'APPROVE')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><CheckCircle2 className="h-3.5 w-3.5" />Verify and resolve</button></footer>
    </article>; })}</div>}
  </div>;
}

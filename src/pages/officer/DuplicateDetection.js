import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Check, Copy, ExternalLink, RefreshCw, X } from 'lucide-react';
import { getDuplicateReviews, reviewDuplicate } from '../../services/api';

const attributes = [
  ['title', 'Title'], ['description', 'Description'], ['category', 'Category'], ['address', 'Address'],
  ['location', 'Coordinates'], ['date', 'Submitted date'], ['photographs', 'Photographs'],
];

export function DuplicateDetection() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [selected, setSelected] = useState(null);

  const refresh = useCallback(async (initial = false) => {
    if (initial) setLoading(true); else setRefreshing(true);
    try { setMatches(await getDuplicateReviews() || []); setError(''); }
    catch (fetchError) { setError(fetchError.message || 'Could not load duplicate review candidates.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { refresh(true); const timer = window.setInterval(() => refresh(false), 30000); return () => window.clearInterval(timer); }, [refresh]);

  const decide = async (match, decision) => {
    setBusyId(match.id); setError('');
    try {
      await reviewDuplicate(match.id, decision, decision === 'LINK' ? match.matchedComplaint.databaseId : undefined);
      await refresh(false);
      if (selected?.id === match.id) setSelected(null);
    } catch (actionError) { setError(actionError.message || 'Could not save this duplicate review.'); }
    finally { setBusyId(null); }
  };

  return <div className="space-y-5">
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h1 className="text-xl md:text-2xl font-extrabold text-civic-text flex items-center gap-2"><Copy className="w-5 h-5 text-purple-700" />Duplicate review</h1><p className="text-xs text-civic-muted mt-1">Similarity candidates are suggestions. Customer submissions remain intact until you review them.</p></div><button onClick={() => refresh(false)} disabled={refreshing} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold"><RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />Refresh</button></header>
    {error && <div role="alert" className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
    {loading ? <div className="bg-white rounded-2xl p-12 text-center text-sm text-slate-500">Comparing submitted complaints…</div> : matches.length === 0 ? <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center"><p className="font-semibold text-slate-700">No duplicate candidates need review.</p><p className="text-xs text-slate-500 mt-1">New customer submissions are checked automatically.</p></div> : <div className="space-y-4">{matches.map((match) => <article key={match.id} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap items-center gap-2"><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${match.classification === 'LIKELY_DUPLICATE' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>{match.classification.replaceAll('_', ' ')}</span><span className="text-xs font-semibold text-slate-700">Similarity {(match.similarityScore * 100).toFixed(0)}%</span><span className="font-mono text-xs text-civic-blue">Candidate {match.complaint.id}</span><span className="text-slate-400">↔</span><span className="font-mono text-xs text-slate-700">Existing {match.matchedComplaint.id}</span></div><button onClick={() => setSelected(selected?.id === match.id ? null : match)} className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-800 text-xs font-bold">{selected?.id === match.id ? 'Hide comparison' : 'Compare details'}</button></header>
      <div className="grid md:grid-cols-2 gap-3"><ComplaintCard title="New customer report" complaint={match.complaint} /><ComplaintCard title="Potential match" complaint={match.matchedComplaint} /></div>
      {selected?.id === match.id && <Comparison match={match} />}
      <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3"><button onClick={() => decide(match, 'KEEP_REVIEWING')} disabled={busyId === match.id} className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold">Keep under review</button><button onClick={() => decide(match, 'SEPARATE')} disabled={busyId === match.id} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold"><X className="w-3.5 h-3.5" />Mark separate</button><button onClick={() => decide(match, 'LINK')} disabled={busyId === match.id} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold"><Check className="w-3.5 h-3.5" />Link to existing</button></footer>
    </article>)}</div>}
  </div>;
}

function ComplaintCard({ title, complaint }) {
  return <section className="rounded-xl border border-slate-200 bg-slate-50 p-3 min-w-0"><h2 className="text-[10px] uppercase tracking-wide font-bold text-slate-500">{title}</h2><p className="font-bold text-sm mt-1">{complaint.title}</p><p className="text-xs text-slate-600 mt-1 line-clamp-3">{complaint.description}</p><p className="text-xs text-slate-500 mt-2">{complaint.category} · {complaint.address || 'No address'}</p><p className="text-[10px] text-slate-400 mt-1">{Number.isFinite(complaint.latitude) ? `${complaint.latitude}, ${complaint.longitude}` : 'No coordinates'} · {complaint.reportedDate ? new Date(complaint.reportedDate).toLocaleString() : 'Unknown date'}</p><div className="flex gap-2 mt-3">{(complaint.photos || []).slice(0, 3).map((photo, index) => <a key={`${photo}-${index}`} href={photo} target="_blank" rel="noreferrer" title="Open photograph full size" className="relative block w-20 h-14 rounded-lg overflow-hidden border border-slate-200"><img src={photo} alt={`Complaint photo ${index + 1}`} className="w-full h-full object-cover" onError={(event) => { event.currentTarget.alt = 'Image unavailable'; }} /><ExternalLink className="absolute right-1 bottom-1 w-3 h-3 text-white drop-shadow" /></a>)}</div></section>;
}

function Comparison({ match }) {
  const values = match.comparison?.attributeScores || {};
  const locationDistance = match.comparison?.locationDistanceMeters;
  const dateDifference = match.comparison?.dateDifferenceDays;
  return <section className="rounded-xl border border-purple-100 p-3"><h3 className="text-xs font-bold mb-2">Attribute comparison</h3><div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{attributes.map(([key, label]) => { const score = values[key]; return <div key={key} className={`rounded-lg p-2 text-[10px] ${score === null || score === undefined ? 'bg-slate-100 text-slate-500' : score >= 0.75 ? 'bg-emerald-50 text-emerald-800' : score >= 0.45 ? 'bg-amber-50 text-amber-800' : 'bg-rose-50 text-rose-800'}`}><p className="font-semibold">{label}</p><p>{score === null || score === undefined ? 'Not comparable' : `${(score * 100).toFixed(0)}% similar`}</p>{key === 'location' && locationDistance !== null && locationDistance !== undefined && <p>{locationDistance} m apart</p>}{key === 'date' && dateDifference !== null && dateDifference !== undefined && <p>{dateDifference} days apart</p>}</div>; })}</div><p className="text-[10px] text-slate-500 mt-2">The score combines title, description, category, address, coordinates, dates, and perceptual image hashes when available.</p></section>;
}

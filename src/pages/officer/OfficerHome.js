import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Clock3, FileText, MapPin, RefreshCw, Search } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useCivic } from '../../context/CivicContext';
import { useOfficerComplaints } from '../../hooks/useOfficerComplaints';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';

export function OfficerHome() {
  const navigate = useNavigate();
  const { officerProfile } = useCivic();
  const { complaints, loading, refreshing, error, refresh } = useOfficerComplaints();
  const stats = useMemo(() => ({
    total: complaints.length,
    pending: complaints.filter((item) => item.status === 'PENDING').length,
    inProgress: complaints.filter((item) => item.status === 'IN_PROGRESS' || item.status === 'UNDER_REVIEW').length,
    resolved: complaints.filter((item) => item.status === 'RESOLVED').length,
  }), [complaints]);
  const categories = useMemo(() => {
    const counts = new Map();
    for (const item of complaints) counts.set(item.category || 'Uncategorized', (counts.get(item.category || 'Uncategorized') || 0) + 1);
    return [...counts.entries()].map(([name, count]) => ({ name, count }));
  }, [complaints]);
  const priorityComplaints = complaints.filter((item) => ['CRITICAL', 'HIGH'].includes(item.priority)).slice(0, 5);

  return (
    <div className="space-y-6">
      <header className="bg-gradient-to-r from-[#0F2742] via-[#163A63] to-[#1E4E85] text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-blue-200 text-xs font-semibold uppercase tracking-wider">Municipal Operations</span>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-1">{officerProfile.name}</h1>
          <p className="text-blue-100 text-sm mt-1">{officerProfile.title} · {officerProfile.department}</p>
          <p className="text-blue-100/80 text-xs mt-2">Complaint information and totals are loaded from submitted customer reports.</p>
        </div>
        <button onClick={() => navigate('/officer/complaints')} className="px-4 py-2 bg-white text-civic-blue font-bold rounded-xl text-xs">Manage complaints</button>
      </header>

      {error && <div role="alert" className="flex items-center gap-3 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm"><AlertCircle className="w-4 h-4 shrink-0" />{error}<button onClick={() => refresh(false)} className="ml-auto underline">Retry</button></div>}

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4" aria-label="Complaint statistics">
        {[
          ['Total complaints', stats.total, FileText, 'text-blue-700'],
          ['Pending', stats.pending, Clock3, 'text-amber-700'],
          ['In progress', stats.inProgress, Search, 'text-indigo-700'],
          ['Resolved', stats.resolved, CheckCircle2, 'text-emerald-700'],
        ].map(([label, value, Icon, color]) => <article key={label} className="bg-white rounded-2xl p-4 border border-slate-200">
          <div className="flex items-center justify-between"><p className="text-xs text-slate-500">{label}</p><Icon className={`w-4 h-4 ${color}`} /></div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{loading ? '…' : value}</p>
        </article>)}
      </section>

      <section className="grid lg:grid-cols-2 gap-5">
        <article className="bg-white rounded-2xl p-5 border border-slate-200 min-h-[300px]">
          <h2 className="font-bold text-slate-900">Complaints by category</h2>
          <p className="text-xs text-slate-500 mt-1">Counts are calculated from submitted complaints.</p>
          {loading ? <p className="grid place-items-center h-56 text-sm text-slate-500">Loading complaint data…</p> : categories.length ? <div className="h-64 mt-4"><ResponsiveContainer width="100%" height="100%"><BarChart data={categories} margin={{ left: 0, right: 12 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="count" fill="#2563EB" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div> : <p className="grid place-items-center h-56 text-sm text-slate-500">No category data yet.</p>}
        </article>

        <article className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-5 flex items-center justify-between border-b border-slate-100"><div><h2 className="font-bold text-slate-900">High priority complaints</h2><p className="text-xs text-slate-500 mt-1">From the current complaint records</p></div><button aria-label="Refresh complaints" onClick={() => refresh(false)} disabled={refreshing} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /></button></div>
          {loading ? <p className="p-8 text-center text-sm text-slate-500">Loading complaints…</p> : priorityComplaints.length ? <div className="divide-y divide-slate-100">{priorityComplaints.map((item) => <div key={item.databaseId || item.id} className="p-4 flex items-start justify-between gap-3"><div className="min-w-0 space-y-1"><div className="flex flex-wrap gap-2 items-center"><span className="font-mono text-xs text-civic-blue">{item.id}</span><PriorityBadge priority={item.priority} /><StatusBadge status={item.status} /></div><p className="font-semibold text-sm truncate">{item.title}</p><p className="text-xs text-slate-500 flex gap-1"><MapPin className="w-3 h-3 shrink-0" />{item.address || 'Location not provided'}</p></div><button onClick={() => navigate('/officer/complaints')} className="shrink-0 px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-semibold">View</button></div>)}</div> : <p className="p-8 text-center text-sm text-slate-500">{error ? 'Complaint data is unavailable.' : complaints.length ? 'No high priority complaints.' : 'No complaints have been submitted yet.'}</p>}
        </article>
      </section>

      {!loading && complaints.length === 0 && !error && <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-900">No complaints have been submitted yet.</div>}
    </div>
  );
}

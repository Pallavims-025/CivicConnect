import React, { useCallback, useEffect, useState } from 'react';
import { Briefcase, Calendar, RefreshCw, User } from 'lucide-react';
import { getOfficerAssignments } from '../../services/api';

const label = (value) => (value || 'UNKNOWN').replaceAll('_', ' ');
const badge = (status) => status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : status === 'AWAITING_VERIFICATION' ? 'bg-purple-100 text-purple-800' : status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : status === 'REWORK_REQUIRED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800';

export function WorkOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const refresh = useCallback(async (initial = false) => {
    if (initial) setLoading(true); else setRefreshing(true);
    try { setOrders(await getOfficerAssignments() || []); setError(''); }
    catch (e) { setError(e.message || 'Could not load assigned work.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { refresh(true); const timer = window.setInterval(() => refresh(), 30000); return () => window.clearInterval(timer); }, [refresh]);

  return <div className="space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-xl md:text-2xl font-extrabold text-civic-text flex items-center gap-2"><Briefcase className="w-5 h-5 text-civic-blue" />Assigned field work</h1><p className="text-xs text-civic-muted mt-1">Track assignments you sent to Field Supervisors and review their progress.</p></div><button onClick={() => refresh()} disabled={refreshing} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white text-xs font-semibold"><RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />Refresh</button></header>
    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
    {loading ? <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">Loading assignments…</div> : orders.length === 0 ? <div className="rounded-2xl border bg-white p-10 text-center text-sm text-slate-500">No field assignments have been created yet. Assign a complaint from Complaint Management.</div> : <div className="overflow-x-auto rounded-2xl border bg-white"><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">Assignment</th><th className="p-3">Complaint</th><th className="p-3">Supervisor</th><th className="p-3">Priority</th><th className="p-3">Due</th><th className="p-3">Status</th></tr></thead><tbody className="divide-y">{orders.map((order) => <tr key={order.id}><td className="p-3 font-mono font-bold text-civic-blue">{order.workOrderCode || order.id}</td><td className="p-3"><strong>{order.complaint?.complaintCode || order.complaintId}</strong><p className="mt-1 max-w-sm font-semibold text-slate-800">{order.complaint?.title}</p><p className="mt-1 max-w-sm text-slate-500">{order.workDescription}</p></td><td className="p-3"><span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{order.supervisor?.name || 'Unassigned'}</span><p className="mt-1 text-slate-500">{order.supervisor?.email}</p></td><td className="p-3">{order.priority}</td><td className="p-3"><span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{order.deadline ? new Date(order.deadline).toLocaleDateString() : '—'}</span></td><td className="p-3"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${badge(order.status)}`}>{label(order.status)}</span>{order.status === 'AWAITING_VERIFICATION' && <p className="mt-1 text-purple-700">Review pending</p>}</td></tr>)}</tbody></table></div>}
  </div>;
}

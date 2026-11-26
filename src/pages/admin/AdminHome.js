import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertCircle, ArrowRight, Building2, CheckCircle, Clock3, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';

const number = (value, loading) => loading ? '…' : (value ?? 0).toLocaleString();

export function AdminHome() {
  const { data, loading, refreshing, error, refresh } = useAdminDashboard();
  const stats = data?.stats || {};
  const cards = [
    ['Registered citizens', stats.totalRegisteredCitizens, Users, 'text-blue-600'],
    ['Municipal officers', stats.totalMunicipalOfficers, ShieldCheck, 'text-indigo-600'],
    ['Field supervisors', stats.totalFieldSupervisors, Users, 'text-amber-600'],
    ['Total complaints', stats.totalComplaints, Activity, 'text-slate-700'],
    ['Verified complaints', stats.verifiedComplaints, CheckCircle, 'text-emerald-600'],
    ['Rejected complaints', stats.rejectedComplaints, AlertCircle, 'text-rose-600'],
    ['Pending verification', stats.pendingVerificationComplaints, Clock3, 'text-amber-600'],
    ['Assigned to teams', stats.assignedComplaints, Users, 'text-blue-600'],
    ['Currently in progress', stats.inProgressComplaints, Activity, 'text-indigo-600'],
    ['Completed complaints', stats.completedComplaints, CheckCircle, 'text-emerald-600'],
    ['Unresolved complaints', stats.unresolvedComplaints, Clock3, 'text-orange-600'],
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Administration &amp; Oversight</h1>
          <p className="text-sm text-slate-500">Live account, complaint and field operation data from CivicConnect.</p>
        </div>
        <button onClick={refresh} disabled={refreshing} className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50">
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </header>

      {error && <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle size={16} />{error}<button onClick={refresh} className="ml-auto font-semibold underline">Retry</button></div>}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4" aria-label="Application statistics">
        {cards.map(([label, value, Icon, color]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between gap-2"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p><Icon className={`h-4 w-4 shrink-0 ${color}`} /></div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{number(value, loading)}</p>
        </article>)}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 text-sm font-bold text-slate-900"><Building2 className="h-4 w-4 text-blue-600" />Municipal departments</h2><Link to="/admin/departments" className="flex items-center gap-1 text-xs font-semibold text-blue-600">Manage <ArrowRight size={13} /></Link></div>
          {loading ? <p className="py-8 text-center text-sm text-slate-500">Loading departments…</p> : data?.departments?.length ? <div className="space-y-2">{data.departments.map((department) => <div key={department.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><div><p className="text-sm font-semibold text-slate-800">{department.name}</p><p className="text-xs text-slate-500">{department.categoryCount} categories · {department._count.users} users</p></div><span className="text-right text-xs text-slate-600">{department._count.complaints} complaints<br />{department._count.workOrders} work orders</span></div>)}</div> : <p className="py-8 text-center text-sm text-slate-500">No active departments.</p>}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 text-sm font-bold text-slate-900"><Activity className="h-4 w-4 text-blue-600" />Recent application activity</h2><Link to="/admin/audit" className="flex items-center gap-1 text-xs font-semibold text-blue-600">Audit log <ArrowRight size={13} /></Link></div>
          {loading ? <p className="py-8 text-center text-sm text-slate-500">Loading recent activity…</p> : data?.activities?.length ? <div className="max-h-[28rem] space-y-2 overflow-y-auto">{data.activities.slice(0, 12).map((item) => <article key={item.id} className="rounded-xl border-l-2 border-blue-500 bg-slate-50 px-3 py-2"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-bold text-slate-800">{item.title}</p><time className="text-[10px] text-slate-500">{new Date(item.at).toLocaleString()}</time></div><p className="mt-1 text-xs text-slate-600">{item.description}</p><p className="mt-1 text-[10px] text-slate-400">By {item.actor || 'System'}{item.complaintCode ? ` · ${item.complaintCode}` : ''}</p></article>)}</div> : <p className="py-8 text-center text-sm text-slate-500">No application activity has been recorded yet.</p>}
        </section>
      </div>
      {data?.refreshedAt && <p className="text-right text-[11px] text-slate-400">Updated {new Date(data.refreshedAt).toLocaleTimeString()}</p>}
    </div>
  );
}

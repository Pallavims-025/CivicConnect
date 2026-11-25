import React, { useState } from 'react';
import { AlertCircle, BarChart3, RefreshCw, TrendingUp } from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];
const chartPanel = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-xs';
const chartHeight = 'grid h-64 place-items-center text-sm text-slate-500';

export function SystemAnalytics() {
  const [range, setRange] = useState('30_DAYS');
  const { data, loading, refreshing, error, refresh } = useAdminDashboard(range);
  const stats = data?.stats || {};
  const hasComplaints = (stats.totalComplaints || 0) > 0;
  const hasUsers = (data?.usersByRole || []).some((item) => item.count > 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900"><BarChart3 className="h-6 w-6 text-blue-600" />System Analytics &amp; Platform Telemetry</h1>
          <p className="text-sm text-slate-500">Complaint and account analytics from current database records.</p>
        </div>
        <div className="flex gap-2">
          <select aria-label="Chart date range" value={range} onChange={(event) => setRange(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
            <option value="7_DAYS">Last 7 days</option><option value="30_DAYS">Last 30 days</option><option value="90_DAYS">Last 90 days</option><option value="YEAR">Last year</option>
          </select>
          <button onClick={refresh} disabled={refreshing} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 disabled:opacity-50" aria-label="Refresh analytics"><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /></button>
        </div>
      </header>

      {error && <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle size={16} />{error}<button onClick={refresh} className="ml-auto font-semibold underline">Retry</button></div>}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Total complaints', stats.totalComplaints],
          ['Verified complaints', stats.verifiedComplaints],
          ['Completed', stats.completedComplaints],
          ['Resolution rate', `${stats.resolutionRate ?? 0}%`],
        ].map(([label, value]) => <article key={label} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><p className="mt-2 text-2xl font-extrabold text-slate-900">{loading ? '…' : (value ?? 0)}</p></article>)}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={chartPanel}>
          <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-bold text-slate-900">Department Performance: Reported vs Resolved</h2><span className="text-[11px] text-slate-400">All recorded complaints</span></div>
          {loading ? <p className={chartHeight}>Loading chart…</p> : data?.departmentPerformance?.length ? <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.departmentPerformance} margin={{ top: 10, right: 10, left: -12, bottom: 24 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" /><YAxis allowDecimals={false} />
            <Tooltip formatter={(value, name) => [value, name === 'Reported' ? 'Complaints Reported' : 'Complaints Resolved']} labelFormatter={(label) => `Department: ${label}`} /><Legend />
            <Bar dataKey="reported" fill="#3B82F6" name="Reported" radius={[4, 4, 0, 0]} /><Bar dataKey="resolved" fill="#10B981" name="Resolved" radius={[4, 4, 0, 0]} />
          </BarChart></ResponsiveContainer></div> : <p className={chartHeight}>No department complaint data yet.</p>}
        </section>

        <section className={chartPanel}><h2 className="mb-4 text-sm font-bold text-slate-900">Complaints by status</h2>{loading ? <p className={chartHeight}>Loading chart…</p> : hasComplaints ? <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.complaintsByStatus} margin={{ left: 4, right: 12 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={48} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#3B82F6" name="Complaints" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div> : <p className={chartHeight}>No complaint records yet.</p>}</section>

        <section className={chartPanel}><h2 className="mb-4 text-sm font-bold text-slate-900">Complaints by category</h2>{loading ? <p className={chartHeight}>Loading chart…</p> : data?.complaintsByCategory?.length ? <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.complaintsByCategory} layout="vertical" margin={{ left: 12, right: 15 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="category" width={115} tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="count" fill="#10B981" name="Complaints" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div> : <p className={chartHeight}>No category data yet.</p>}</section>

        <section className={chartPanel}>
          <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-bold text-slate-900">Submission and resolution trend</h2><span className="text-[11px] text-slate-400">{range.replace('_', ' ').toLowerCase()}</span></div>
          {loading ? <p className={chartHeight}>Loading chart…</p> : hasComplaints ? <div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={data.submissionAndResolutionTrends} margin={{ left: 2, right: 12 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Line type="monotone" dataKey="submitted" name="Submitted" stroke="#3B82F6" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="resolved" name="Resolved" stroke="#10B981" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div> : <p className={chartHeight}>No complaint trend data yet.</p>}
        </section>

        <section className={chartPanel}><h2 className="mb-4 text-sm font-bold text-slate-900">Platform User Distribution</h2>{loading ? <p className={chartHeight}>Loading chart…</p> : hasUsers ? <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.usersByRole.map((item) => ({ name: item.role.toLowerCase().replaceAll('_', ' '), value: item.count }))} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>{data.usersByRole.map((item, index) => <Cell key={item.role} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div> : <p className={chartHeight}>No registered users yet.</p>}</section>
      </div>

      <p className="flex items-center justify-end gap-1 text-[11px] text-slate-400"><TrendingUp size={13} />Auto-refreshes every 30 seconds{data?.refreshedAt ? ` · Updated ${new Date(data.refreshedAt).toLocaleTimeString()}` : ''}</p>
    </div>
  );
}

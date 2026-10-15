import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Copy,
  TrendingUp,
  MapPin,
  ChevronRight,
  Shield,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useCivic } from '../../context/CivicContext';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';

export function OfficerHome() {
  const navigate = useNavigate();
  const {
    complaints,
    workOrders,
    verifications,
    duplicates,
    officerProfile,
  } = useCivic();

  // Metrics
  const totalComplaints = complaints.length;
  const pendingComplaints = complaints.filter((c) => c.status === 'PENDING').length;
  const inProgressComplaints = complaints.filter(
    (c) => c.status === 'IN_PROGRESS' || c.status === 'UNDER_REVIEW'
  ).length;
  const overdueWorkOrders = workOrders.filter((w) => w.status === 'OVERDUE').length;
  const awaitingVerification = verifications.filter(
    (v) => v.status === 'AWAITING_VERIFICATION'
  ).length;
  const pendingDuplicates = duplicates.filter(
    (d) => d.reviewStatus === 'PENDING_REVIEW'
  ).length;

  // Status Chart Data
  const statusData = [
    { name: 'Pending', value: pendingComplaints, color: '#F59E0B' },
    { name: 'In Progress / Review', value: inProgressComplaints, color: '#2563EB' },
    {
      name: 'Resolved',
      value: complaints.filter((c) => c.status === 'RESOLVED').length,
      color: '#10B981',
    },
    {
      name: 'Rejected',
      value: complaints.filter((c) => c.status === 'REJECTED').length,
      color: '#EF4444',
    },
  ].filter((d) => d.value > 0);

  // Category Chart Data
  const categoryCountMap = {};
  complaints.forEach((c) => {
    categoryCountMap[c.category] = (categoryCountMap[c.category] || 0) + 1;
  });
  const categoryData = Object.entries(categoryCountMap).map(([name, count]) => ({
    name: name.split(' ')[0], // Short name
    fullName: name,
    count,
  }));

  // High Priority Complaints
  const highPriorityComplaints = complaints
    .filter((c) => c.priority === 'CRITICAL' || c.priority === 'HIGH')
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Officer Welcome Header */}
      <div className="bg-gradient-to-r from-[#0F2742] via-[#163A63] to-[#1E4E85] text-white rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-blue-300 text-xs font-semibold uppercase tracking-wider">
            Municipal Operations Command • Ward 12-18
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold mt-1">
            {officerProfile.name}
          </h2>
          <p className="text-blue-100 text-xs md:text-sm mt-1 max-w-xl">
            {officerProfile.title} — {officerProfile.department}. Real-time monitoring,
            duplicate detection, work orders, inventory dispatch, and field repair verification.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 self-start md:self-auto">
          <button
            onClick={() => navigate('/officer/complaints')}
            className="px-4 py-2 bg-civic-blue hover:bg-blue-600 text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center space-x-1"
          >
            <span>Triage Complaints</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => navigate('/officer/work-orders')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs transition-colors border border-white/20"
          >
            Work Orders
          </button>
        </div>
      </div>

      {/* 5 Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <p className="text-[11px] font-medium text-slate-500">Total Complaints</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalComplaints}</p>
          <span className="text-[10px] text-blue-600 font-semibold">Ward Coverage</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <p className="text-[11px] font-medium text-slate-500">Pending Triage</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{pendingComplaints}</p>
          <span className="text-[10px] text-amber-700 font-semibold">Requires Review</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <p className="text-[11px] font-medium text-slate-500">In-Progress</p>
          <p className="text-2xl font-extrabold text-civic-blue mt-1">{inProgressComplaints}</p>
          <span className="text-[10px] text-blue-700 font-semibold">Active Crews</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <p className="text-[11px] font-medium text-slate-500">Overdue Orders</p>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">{overdueWorkOrders}</p>
          <span className="text-[10px] text-rose-700 font-semibold">Urgent Escalation</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <p className="text-[11px] font-medium text-slate-500">Awaiting Verification</p>
          <p className="text-2xl font-extrabold text-purple-600 mt-1">{awaitingVerification}</p>
          <span className="text-[10px] text-purple-700 font-semibold">Inspection Ready</span>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Complaint Status Breakdown</h3>
              <p className="text-xs text-slate-400">Live distribution across civic issue lifecycle</p>
            </div>
            <span className="text-xs text-slate-500 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded">
              {totalComplaints} Reports
            </span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} complaints`, name]}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap justify-center gap-3 text-xs mt-2">
            {statusData.map((d) => (
              <div key={d.name} className="flex items-center space-x-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: d.color }}
                ></span>
                <span className="text-slate-600">{d.name}</span>
                <span className="font-bold text-slate-900">({d.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Complaints by Category Bar */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Complaints by Category</h3>
              <p className="text-xs text-slate-400">Hazard frequency across municipal infrastructure</p>
            </div>
            <button
              onClick={() => navigate('/officer/analytics')}
              className="text-xs text-civic-blue font-semibold hover:underline"
            >
              Full Analytics
            </button>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val, name, props) => [`${val} complaints`, props.payload.fullName]}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Critical & High Priority Table + Action Center */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* High Priority Complaints (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 flex items-center justify-between border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>High & Critical Priority Complaints</span>
              </h3>
              <p className="text-xs text-slate-400">Issues requiring prompt engineering intervention</p>
            </div>
            <button
              onClick={() => navigate('/officer/complaints')}
              className="text-xs text-civic-blue font-semibold hover:underline"
            >
              View All
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {highPriorityComplaints.map((c) => (
              <div
                key={c.id}
                className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
              >
                <div className="space-y-1 max-w-md">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-civic-blue">{c.id}</span>
                    <PriorityBadge priority={c.priority} />
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="font-bold text-slate-800 truncate">{c.title}</p>
                  <p className="text-[11px] text-slate-500 truncate flex items-center">
                    <MapPin className="w-3 h-3 text-slate-400 mr-1" />
                    {c.address}
                  </p>
                </div>

                <button
                  onClick={() => navigate(`/officer/complaints`)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-civic-blue hover:text-white rounded-lg font-semibold text-slate-700 transition-colors whitespace-nowrap"
                >
                  Inspect & Assign
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Operational Quick Actions (1 col) */}
        <div className="space-y-4">
          {/* Overdue Work Order Alert */}
          {overdueWorkOrders > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800">
              <div className="flex items-center space-x-2 font-bold mb-1">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>{overdueWorkOrders} Overdue Work Order(s)</span>
              </div>
              <p className="text-[11px] text-rose-700 mb-2">
                Field repair deadlines have elapsed. Expedite crew or adjust timeline.
              </p>
              <button
                onClick={() => navigate('/officer/work-orders')}
                className="text-xs font-bold text-rose-800 underline"
              >
                Inspect Overdue Orders →
              </button>
            </div>
          )}

          {/* Pending Verification Alert */}
          {awaitingVerification > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-xs text-purple-800">
              <div className="flex items-center space-x-2 font-bold mb-1">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                <span>{awaitingVerification} Repair(s) Awaiting Signoff</span>
              </div>
              <p className="text-[11px] text-purple-700 mb-2">
                Field supervisors have submitted completion photos for review.
              </p>
              <button
                onClick={() => navigate('/officer/verifications')}
                className="text-xs font-bold text-purple-800 underline"
              >
                Review Completion Photos →
              </button>
            </div>
          )}

          {/* Duplicate Detection Alert */}
          {pendingDuplicates > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800">
              <div className="flex items-center space-x-2 font-bold mb-1">
                <Copy className="w-4 h-4 text-amber-600" />
                <span>{pendingDuplicates} Suspected Duplicates Detected</span>
              </div>
              <p className="text-[11px] text-amber-700 mb-2">
                Geospatial match detected duplicate reports in the same radius.
              </p>
              <button
                onClick={() => navigate('/officer/duplicates')}
                className="text-xs font-bold text-amber-800 underline"
              >
                Review Candidate Duplicates →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

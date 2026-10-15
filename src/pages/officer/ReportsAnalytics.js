import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Download,
  Filter,
} from 'lucide-react';
import { useCivic } from '../../context/CivicContext';

export function ReportsAnalytics() {
  const { complaints, workOrders, inventory } = useCivic();

  const [dateRange, setDateRange] = useState('30_DAYS');

  // Metrics
  const totalComplaints = complaints.length;
  const resolvedComplaints = complaints.filter((c) => c.status === 'RESOLVED').length;
  const resolutionRate = Math.round((resolvedComplaints / (totalComplaints || 1)) * 100);

  // Time-series mock data
  const trendData = [
    { date: 'Oct 01', reported: 4, resolved: 3 },
    { date: 'Oct 04', reported: 6, resolved: 5 },
    { date: 'Oct 08', reported: 8, resolved: 6 },
    { date: 'Oct 12', reported: 5, resolved: 7 },
    { date: 'Oct 15', reported: 7, resolved: 4 },
  ];

  // Category breakdown
  const categoryMap = {};
  complaints.forEach((c) => {
    categoryMap[c.category] = (categoryMap[c.category] || 0) + 1;
  });
  const categoryChartData = Object.entries(categoryMap).map(([cat, count]) => ({
    name: cat.length > 15 ? cat.substring(0, 14) + '...' : cat,
    fullName: cat,
    count,
  }));

  // Status breakdown
  const statusCounts = [
    { name: 'Pending', count: complaints.filter((c) => c.status === 'PENDING').length, color: '#F59E0B' },
    { name: 'Under Review', count: complaints.filter((c) => c.status === 'UNDER_REVIEW').length, color: '#8B5CF6' },
    { name: 'In Progress', count: complaints.filter((c) => c.status === 'IN_PROGRESS').length, color: '#2563EB' },
    { name: 'Resolved', count: resolvedComplaints, color: '#10B981' },
    { name: 'Rejected', count: complaints.filter((c) => c.status === 'REJECTED').length, color: '#EF4444' },
  ].filter((d) => d.count > 0);

  // Department Performance
  const departmentStats = [
    { dept: 'Roads & Bridges Dept', total: 6, resolved: 4, avgDays: '3.2 days', rate: '67%' },
    { dept: 'Solid Waste Management', total: 5, resolved: 5, avgDays: '1.1 days', rate: '100%' },
    { dept: 'Water Supply & Sewerage', total: 4, resolved: 2, avgDays: '2.5 days', rate: '50%' },
    { dept: 'Electrical & Lighting', total: 3, resolved: 2, avgDays: '2.0 days', rate: '67%' },
    { dept: 'Stormwater Drains (SWD)', total: 3, resolved: 3, avgDays: '4.0 days', rate: '100%' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-civic-text flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-civic-blue" />
            <span>Reports & Ward Operations Analytics</span>
          </h2>
          <p className="text-xs text-civic-muted">
            Performance metrics, resolution turnarounds, and departmental efficiency across municipal wards.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white font-medium shadow-2xs"
          >
            <option value="7_DAYS">Last 7 Days</option>
            <option value="30_DAYS">Last 30 Days (Current Month)</option>
            <option value="90_DAYS">Last Quarter</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Overall Resolution Rate</p>
          <p className="text-3xl font-extrabold text-emerald-600 mt-1">{resolutionRate}%</p>
          <span className="text-[10px] text-emerald-700 font-semibold">
            {resolvedComplaints} of {totalComplaints} closed
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Avg Resolution Turnaround</p>
          <p className="text-3xl font-extrabold text-civic-blue mt-1">2.4 Days</p>
          <span className="text-[10px] text-slate-400 font-medium">Target: &lt; 3.0 Days</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Active Work Orders</p>
          <p className="text-3xl font-extrabold text-amber-600 mt-1">
            {workOrders.filter((w) => w.status === 'IN_PROGRESS').length}
          </p>
          <span className="text-[10px] text-amber-700 font-medium">In field execution</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Overdue SLA Breaches</p>
          <p className="text-3xl font-extrabold text-rose-600 mt-1">
            {workOrders.filter((w) => w.status === 'OVERDUE').length}
          </p>
          <span className="text-[10px] text-rose-700 font-medium">Requires supervisor notice</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Timeline Trends */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <h3 className="font-bold text-sm text-slate-900 mb-1">
            Complaints Reported vs Resolved Over Time
          </h3>
          <p className="text-xs text-slate-400 mb-4">Intake velocity compared with field completion rate</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="reported"
                  name="Issues Reported"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  name="Repairs Resolved"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Bar Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <h3 className="font-bold text-sm text-slate-900 mb-1">
            Issue Frequency by Infrastructure Category
          </h3>
          <p className="text-xs text-slate-400 mb-4">Distribution of civic friction points</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val, name, props) => [`${val} complaints`, props.payload.fullName]}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#163A63" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Departmental Efficiency Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Departmental Performance & SLA Compliance
            </h3>
            <p className="text-xs text-slate-400">Resolution velocity across municipal divisions</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4 md:px-6">Department</th>
                <th className="py-3 px-4">Assigned Tasks</th>
                <th className="py-3 px-4">Verified Resolved</th>
                <th className="py-3 px-4">Avg Turnaround</th>
                <th className="py-3 px-4 text-right">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departmentStats.map((d, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-3 px-4 md:px-6 font-bold text-slate-800">{d.dept}</td>
                  <td className="py-3 px-4 font-semibold text-slate-700">{d.total}</td>
                  <td className="py-3 px-4 font-semibold text-emerald-600">{d.resolved}</td>
                  <td className="py-3 px-4 text-slate-500">{d.avgDays}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-block px-2 py-0.5 rounded-full font-bold text-xs bg-blue-50 text-civic-blue">
                      {d.rate}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

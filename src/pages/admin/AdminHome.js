import React from 'react';
import { Link } from 'react-router-dom';
import { useCivic } from '../../context/CivicContext';
import { Users, Building2, Activity, AlertTriangle, TrendingUp, CheckCircle, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';

export function AdminHome() {
  const { complaints, workOrders, auditLogs, users, departments } = useCivic();

  const totalComplaints = complaints?.length || 0;
  const resolved = complaints?.filter((c) => c.status === 'RESOLVED').length || 0;
  const pending = complaints?.filter((c) => c.status === 'PENDING').length || 0;
  const inProgress = complaints?.filter((c) => c.status === 'IN_PROGRESS' || c.status === 'UNDER_REVIEW').length || 0;
  const resolutionRate = totalComplaints > 0 ? Math.round((resolved / totalComplaints) * 100) : 0;

  const totalUsers = users?.length || 0;
  const totalDepartments = departments?.length || 0;

  const getActionBadgeColor = (action) => {
    switch (action) {
      case 'CREATE_USER':
      case 'UPDATE_USER':
        return 'border-purple-600';
      case 'CREATE_DEPARTMENT':
      case 'UPDATE_DEPARTMENT':
        return 'border-blue-600';
      case 'SUBMIT_COMPLAINT':
        return 'border-amber-500';
      case 'VERIFY_AND_RESOLVE':
        return 'border-emerald-600';
      default:
        return 'border-blue-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Administration & Oversight</h1>
          <p className="text-sm text-slate-500">
            Platform telemetry, municipal operations oversight, and master administrative configurations
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 shadow-xs">
          <ShieldCheck size={16} /> System Operational • SDG 11 Compliant
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Complaints</span>
            <Activity className="text-blue-600 w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{totalComplaints}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>{pending} pending review</span>
            <span className="text-blue-600 font-semibold">{inProgress} active</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Active Work Orders</span>
            <AlertTriangle className="text-amber-500 w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{workOrders?.length || 0}</div>
          <div className="text-xs text-amber-600 mt-1 font-medium">Field operations deployed</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Resolution Rate</span>
            <TrendingUp className="text-emerald-600 w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{resolutionRate}%</div>
          <div className="text-xs text-emerald-600 mt-1 font-medium">{resolved} issues completed</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Platform Users</span>
            <Users className="text-purple-600 w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{totalUsers}</div>
          <div className="text-xs text-slate-500 mt-1">{totalDepartments} active departments</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Municipal Departments Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Building2 className="text-blue-600 w-4 h-4" /> Municipal Departments Status
              </h3>
              <Link
                to="/admin/departments"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Configure <ArrowRight size={13} />
              </Link>
            </div>

            <div className="space-y-3">
              {(departments || []).map((dept) => (
                <div
                  key={dept.id}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center hover:bg-slate-100/70 transition"
                >
                  <div>
                    <span className="font-semibold text-slate-800 text-sm">{dept.name}</span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Head: <span className="text-slate-700">{dept.head}</span> • {dept.categories?.length || 0} categories
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs rounded-lg font-semibold shrink-0">
                    {dept.zone || 'Zone 1-4'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-xs text-slate-500">
            <span>Total Active Municipal Units: <strong className="text-slate-800">{totalDepartments}</strong></span>
            <Link to="/admin/departments" className="text-blue-600 font-semibold hover:underline">
              Add New Department
            </Link>
          </div>
        </div>

        {/* Live System Audit Stream */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Activity className="text-blue-600 w-4 h-4" /> Live Platform Audit Log Stream
              </h3>
              <Link
                to="/admin/audit"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View Master Log <ArrowRight size={13} />
              </Link>
            </div>

            <div className="space-y-3 text-xs max-h-80 overflow-y-auto pr-1">
              {(auditLogs || []).slice(0, 6).map((log, idx) => (
                <div
                  key={log.id || idx}
                  className={`border-l-3 ${getActionBadgeColor(log.action)} pl-3 py-1.5 bg-slate-50/70 rounded-r-xl`}
                >
                  <div className="flex justify-between font-bold text-slate-800">
                    <span className="uppercase text-[11px] tracking-wide">{log.action || 'System Event'}</span>
                    <span className="text-slate-400 font-normal text-[11px]">{log.timestamp || 'Today'}</span>
                  </div>
                  <div className="text-slate-600 mt-1 leading-snug">{log.details || log.description || 'Logged operation'}</div>
                  <div className="text-slate-400 text-[10px] mt-1 font-medium">Actor: {log.actor || 'System'}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-xs text-slate-500">
            <span>Total Audit Trail Records: <strong className="text-slate-800">{auditLogs?.length || 0}</strong></span>
            <Link to="/admin/audit" className="text-blue-600 font-semibold hover:underline">
              Search All Events
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

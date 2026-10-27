import React from 'react';
import { useCivic } from '../../context/CivicContext';
import { Users, Building2, Activity, AlertTriangle, TrendingUp, CheckCircle, ShieldCheck } from 'lucide-react';

export function AdminHome() {
    const { complaints, workOrders, auditLogs } = useCivic();

    const totalComplaints = complaints?.length || 0;
    const resolved = complaints?.filter(c => c.status === 'RESOLVED').length || 0;
    const pending = complaints?.filter(c => c.status === 'PENDING').length || 0;
    const inProgress = complaints?.filter(c => c.status === 'IN_PROGRESS' || c.status === 'UNDER_REVIEW').length || 0;
    const resolutionRate = totalComplaints > 0 ? Math.round((resolved / totalComplaints) * 100) : 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">System Administration & Oversight</h1>
                    <p className="text-sm text-slate-500">Platform telemetry, municipal operations, and master configurations</p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700">
                    <ShieldCheck size={16} /> System Operational • SDG 11 Compliant
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center text-slate-500 text-xs font-semibold uppercase">
                        <span>Total Complaints</span>
                        <Activity className="text-blue-600 w-4 h-4" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mt-2">{totalComplaints}</div>
                    <div className="text-xs text-slate-500 mt-1">{pending} pending review</div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center text-slate-500 text-xs font-semibold uppercase">
                        <span>Active Work Orders</span>
                        <AlertTriangle className="text-amber-500 w-4 h-4" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mt-2">{workOrders?.length || 0}</div>
                    <div className="text-xs text-amber-600 mt-1">Field operations in progress</div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center text-slate-500 text-xs font-semibold uppercase">
                        <span>Resolution Rate</span>
                        <TrendingUp className="text-emerald-600 w-4 h-4" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mt-2">{resolutionRate}%</div>
                    <div className="text-xs text-emerald-600 mt-1">{resolved} issues resolved</div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center text-slate-500 text-xs font-semibold uppercase">
                        <span>Audit Records</span>
                        <Activity className="text-indigo-600 w-4 h-4" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mt-2">{auditLogs?.length || 24}</div>
                    <div className="text-xs text-indigo-600 mt-1">Logged system events</div>
                </div>
            </div>

            {/* Overview Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
                        <Building2 className="text-blue-600 w-5 h-5" /> Municipal Departments Status
                    </h3>
                    <div className="space-y-3 text-sm">
                        <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
                            <div>
                                <span className="font-medium text-slate-800">Road Infrastructure & Maintenance</span>
                                <p className="text-xs text-slate-500">Potholes, resurfacing, sidewalk repairs</p>
                            </div>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">Zone 1-4</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
                            <div>
                                <span className="font-medium text-slate-800">Solid Waste Management</span>
                                <p className="text-xs text-slate-500">Garbage overflow, illegal dumps, bins</p>
                            </div>
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full font-medium">Zone 1-4</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
                            <div>
                                <span className="font-medium text-slate-800">Street Lighting & Electrical Works</span>
                                <p className="text-xs text-slate-500">Outages, damaged poles, short circuits</p>
                            </div>
                            <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full font-medium">Zone 1-4</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
                        <Activity className="text-blue-600 w-5 h-5" /> Recent System Audit Logs
                    </h3>
                    <div className="space-y-3 text-xs max-h-72 overflow-y-auto">
                        {(auditLogs || []).slice(0, 6).map((log, idx) => (
                            <div key={idx} className="border-l-2 border-blue-600 pl-3 py-1">
                                <div className="flex justify-between font-semibold text-slate-800">
                                    <span>{log.action || 'System Event'}</span>
                                    <span className="text-slate-400 font-normal">{log.timestamp || 'Today'}</span>
                                </div>
                                <div className="text-slate-600 mt-0.5">{log.details || log.description || 'Logged operation'}</div>
                                <div className="text-slate-400 text-[10px] mt-0.5">Actor: {log.actor || 'System'}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
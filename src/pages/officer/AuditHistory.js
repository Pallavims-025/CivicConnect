import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  Shield,
  Clock,
  User,
  FileText,
  Info,
} from 'lucide-react';
import { useCivic } from '../../context/CivicContext';

export function AuditHistory() {
  const { auditLogs } = useCivic();

  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchSearch =
        log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.affectedRecord.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase());

      const matchAction =
        actionFilter === 'ALL' || log.action === actionFilter;

      return matchSearch && matchAction;
    });
  }, [auditLogs, searchTerm, actionFilter]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getActionBadge = (action) => {
    switch (action) {
      case 'SUBMIT_COMPLAINT':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">COMPLAINT FILED</span>;
      case 'APPROVE_COMPLAINT':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800">APPROVED</span>;
      case 'CREATE_WORK_ORDER':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800">WORK ORDER</span>;
      case 'VERIFY_AND_RESOLVE':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">VERIFIED RESOLVED</span>;
      case 'REWORK_REQUESTED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">REWORK REQUEST</span>;
      case 'SUBMIT_FEEDBACK':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">FEEDBACK RATED</span>;
      case 'CONFIRM_DUPLICATE':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800">DUPLICATE MERGE</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800">{action}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-extrabold text-civic-text flex items-center space-x-2">
          <History className="w-6 h-6 text-civic-blue" />
          <span>System Audit History & Activity Logs</span>
        </h2>
        <p className="text-xs text-civic-muted">
          Immutable chronological ledger recording all citizen submissions, officer approvals, material dispatches, and repair verifications.
        </p>
      </div>

      {/* Demo Notice */}
      <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 flex items-start space-x-2">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Compliance Logging Notice:</span> All simulated interactions across both Customer and Municipal Officer dashboards generate real-time audit ledger entries here. In full production, this binds to append-only cryptographically signed server audit logs.
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-1 max-w-xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search actor, record reference, or details..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60"
            />
          </div>

          <div>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60"
            >
              <option value="ALL">All Event Types</option>
              <option value="SUBMIT_COMPLAINT">Complaint Submissions</option>
              <option value="APPROVE_COMPLAINT">Approvals</option>
              <option value="CREATE_WORK_ORDER">Work Orders</option>
              <option value="VERIFY_AND_RESOLVE">Verifications</option>
              <option value="SUBMIT_FEEDBACK">Feedback</option>
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-500">
          Showing <strong>{filteredLogs.length}</strong> recorded events
        </span>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Log ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Affected Record</th>
                <th className="py-3 px-4">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-500">{log.id}</td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                  <td className="py-3 px-4 font-sans font-semibold text-slate-800 whitespace-nowrap">
                    {log.actor}
                  </td>
                  <td className="py-3 px-4 font-sans">{getActionBadge(log.action)}</td>
                  <td className="py-3 px-4 font-bold text-civic-blue whitespace-nowrap">
                    {log.affectedRecord}
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-600 max-w-md">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-sans">
            <span>
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredLogs.length)} of {filteredLogs.length} events
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-100 font-semibold"
              >
                Previous
              </button>
              <span className="font-semibold px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-100 font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

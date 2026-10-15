import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Briefcase,
  AlertTriangle,
  ChevronRight,
  Eye,
  MapPin,
  Calendar,
  User,
  Shield,
  Layers,
  Clock,
  ExternalLink,
  PlusCircle,
} from 'lucide-react';
import { useCivic } from '../../context/CivicContext';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';

export function ComplaintManagement() {
  const navigate = useNavigate();
  const {
    complaints,
    categories,
    approveComplaint,
    rejectComplaint,
    createWorkOrder,
    duplicates,
  } = useCivic();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Selected complaint for modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Modal actions state
  const [actionType, setActionType] = useState('VIEW'); // 'VIEW', 'APPROVE', 'REJECT', 'WORK_ORDER'
  const [assignDept, setAssignDept] = useState('Roads & Bridges Dept');
  const [assignPriority, setAssignPriority] = useState('HIGH');
  const [rejectReason, setRejectReason] = useState('');

  // Work order form state
  const [woSupervisor, setWoSupervisor] = useState('Supervisor M. Rao');
  const [woDesc, setWoDesc] = useState('');
  const [woDeadline, setWoDeadline] = useState('2026-10-25');
  const [woCrew, setWoCrew] = useState('Ward Field Response Unit 2');
  const [woCost, setWoCost] = useState('₹ 15,000');

  const DEPARTMENTS = [
    'Roads & Bridges Dept',
    'Solid Waste Management',
    'Electrical & Lighting',
    'Water Supply & Sewerage',
    'Stormwater Drains (SWD)',
    'Horticulture & Parks',
    'Health & Public Sanitation',
  ];

  const filteredComplaints = useMemo(() => {
    return complaints
      .filter((c) => {
        const matchesSearch =
          c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.citizenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.address.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
          statusFilter === 'ALL' || c.status === statusFilter;
        const matchesCategory =
          categoryFilter === 'ALL' || c.category === categoryFilter;
        const matchesPriority =
          priorityFilter === 'ALL' || c.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
      })
      .sort((a, b) => {
        if (sortBy === 'NEWEST') return new Date(b.reportedDate) - new Date(a.reportedDate);
        if (sortBy === 'OLDEST') return new Date(a.reportedDate) - new Date(b.reportedDate);
        if (sortBy === 'PRIORITY') {
          const pOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
          return (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0);
        }
        return 0;
      });
  }, [complaints, searchTerm, statusFilter, categoryFilter, priorityFilter, sortBy]);

  const totalPages = Math.ceil(filteredComplaints.length / pageSize) || 1;
  const paginatedComplaints = filteredComplaints.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleOpenAction = (complaint, type = 'VIEW') => {
    setSelectedComplaint(complaint);
    setActionType(type);
    setAssignDept(complaint.assignedDepartment !== 'Unassigned' ? complaint.assignedDepartment : DEPARTMENTS[0]);
    setAssignPriority(complaint.priority || 'MEDIUM');
    setWoDesc(complaint.title);
  };

  const handleExecuteApprove = () => {
    if (!selectedComplaint) return;
    approveComplaint(selectedComplaint.id, assignDept, assignPriority);
    setSelectedComplaint(null);
  };

  const handleExecuteReject = () => {
    if (!selectedComplaint) return;
    if (!rejectReason.trim()) {
      alert('Please state a reason for rejecting this complaint.');
      return;
    }
    rejectComplaint(selectedComplaint.id, rejectReason);
    setSelectedComplaint(null);
    setRejectReason('');
  };

  const handleExecuteCreateWO = () => {
    if (!selectedComplaint) return;
    createWorkOrder({
      complaintId: selectedComplaint.id,
      department: assignDept,
      supervisor: woSupervisor,
      priority: assignPriority,
      workDescription: woDesc || selectedComplaint.title,
      deadline: woDeadline,
      estimatedCost: woCost,
      assignedCrew: woCrew,
    });
    setSelectedComplaint(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-civic-text">
            Complaint Triage & Management
          </h2>
          <p className="text-xs text-civic-muted">
            Inspect citizen reports, classify priorities, assign engineering wings, and issue work orders.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-medium">
            Total in Ward: <strong className="text-slate-800">{complaints.length}</strong>
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search ID, title, citizen..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-civic-blue outline-hidden bg-slate-50/50"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/50"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Triage</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/50"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/50"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/50"
            >
              <option value="NEWEST">Sort: Newest First</option>
              <option value="OLDEST">Sort: Oldest First</option>
              <option value="PRIORITY">Sort: Priority High-Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Complaints Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4 md:px-6">Complaint ID</th>
                <th className="py-3 px-4">Issue Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Citizen Ref</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned Dept</th>
                <th className="py-3 px-4">Work Order</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedComplaints.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 md:px-6 font-mono font-bold text-civic-blue">
                    {c.id}
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    <p className="font-bold text-slate-800 truncate">{c.title}</p>
                    <p className="text-[11px] text-slate-400 truncate flex items-center mt-0.5">
                      <MapPin className="w-3 h-3 mr-0.5" />
                      {c.address}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{c.category}</td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-700">{c.citizenName}</p>
                    <p className="text-[10px] text-slate-400">{c.citizenPhone}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <PriorityBadge priority={c.priority} />
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {c.assignedDepartment !== 'Unassigned' ? (
                      <span className="font-medium text-slate-700">{c.assignedDepartment}</span>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    {c.workOrderId ? (
                      <span className="text-civic-blue font-bold">{c.workOrderId}</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                    <button
                      onClick={() => handleOpenAction(c, 'VIEW')}
                      className="p-1.5 text-slate-600 hover:text-civic-blue hover:bg-slate-100 rounded-lg transition-colors"
                      title="Inspect details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {c.status === 'PENDING' && (
                      <button
                        onClick={() => handleOpenAction(c, 'APPROVE')}
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold rounded-lg text-xs"
                      >
                        Approve
                      </button>
                    )}
                    {c.status !== 'RESOLVED' && c.status !== 'REJECTED' && !c.workOrderId && (
                      <button
                        onClick={() => handleOpenAction(c, 'WORK_ORDER')}
                        className="px-2.5 py-1 bg-blue-50 text-civic-blue hover:bg-blue-100 font-semibold rounded-lg text-xs"
                      >
                        Issue WO
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredComplaints.length)} of{' '}
              {filteredComplaints.length} complaints
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

      {/* Action / Review Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-mono font-bold text-xs text-civic-blue bg-blue-50 px-2 py-0.5 rounded">
                    {selectedComplaint.id}
                  </span>
                  <StatusBadge status={selectedComplaint.status} />
                  <PriorityBadge priority={selectedComplaint.priority} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {selectedComplaint.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Mode Tabs inside Modal */}
            <div className="flex border-b border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setActionType('VIEW')}
                className={`pb-2 px-3 border-b-2 transition-colors ${
                  actionType === 'VIEW'
                    ? 'border-civic-blue text-civic-blue'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Complaint Details
              </button>
              <button
                onClick={() => setActionType('APPROVE')}
                className={`pb-2 px-3 border-b-2 transition-colors ${
                  actionType === 'APPROVE'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Approve / Assign
              </button>
              <button
                onClick={() => setActionType('WORK_ORDER')}
                className={`pb-2 px-3 border-b-2 transition-colors ${
                  actionType === 'WORK_ORDER'
                    ? 'border-blue-600 text-civic-blue'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Issue Work Order
              </button>
              <button
                onClick={() => setActionType('REJECT')}
                className={`pb-2 px-3 border-b-2 transition-colors ${
                  actionType === 'REJECT'
                    ? 'border-rose-600 text-rose-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Reject with Reason
              </button>
            </div>

            {/* TAB: VIEW DETAILS */}
            {actionType === 'VIEW' && (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <p className="text-slate-700">{selectedComplaint.description}</p>
                  <div className="flex items-center text-slate-500 pt-2 border-t border-slate-200/60">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-civic-blue" />
                    <span>{selectedComplaint.address}</span>
                  </div>
                </div>

                <div>
                  <p className="font-bold text-slate-800 mb-2">Evidence Photos</p>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedComplaint.photos?.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt="Evidence"
                        className="rounded-xl border border-slate-200 aspect-video object-cover"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="font-bold text-slate-800 mb-2">Resolution Timeline</p>
                  <div className="space-y-2 pl-4 border-l border-slate-200">
                    {selectedComplaint.timeline.map((item, idx) => (
                      <div key={idx} className="relative">
                        <span className="font-semibold text-slate-800">{item.title}</span>
                        <span className="text-[10px] text-slate-400 ml-2">{item.date}</span>
                        <p className="text-slate-500">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: APPROVE / ASSIGN */}
            {actionType === 'APPROVE' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Assign Municipal Department
                  </label>
                  <select
                    value={assignDept}
                    onChange={(e) => setAssignDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Priority Classification
                  </label>
                  <select
                    value={assignPriority}
                    onChange={(e) => setAssignPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="CRITICAL">Critical (Life / Property Risk)</option>
                    <option value="HIGH">High (Major Traffic / Public Disruption)</option>
                    <option value="MEDIUM">Medium (Standard Ward Repair)</option>
                    <option value="LOW">Low (Minor Non-urgent Aesthetic)</option>
                  </select>
                </div>

                <div className="pt-4 flex justify-end space-x-2">
                  <button
                    onClick={() => setSelectedComplaint(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteApprove}
                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                  >
                    Confirm Approval
                  </button>
                </div>
              </div>
            )}

            {/* TAB: ISSUE WORK ORDER */}
            {actionType === 'WORK_ORDER' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Responsible Supervisor</label>
                  <input
                    type="text"
                    value={woSupervisor}
                    onChange={(e) => setWoSupervisor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Target Deadline</label>
                    <input
                      type="date"
                      value={woDeadline}
                      onChange={(e) => setWoDeadline(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Estimated Budget</label>
                    <input
                      type="text"
                      value={woCost}
                      onChange={(e) => setWoCost(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Repair Crew</label>
                  <input
                    type="text"
                    value={woCrew}
                    onChange={(e) => setWoCrew(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div className="pt-4 flex justify-end space-x-2">
                  <button
                    onClick={() => setSelectedComplaint(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteCreateWO}
                    className="px-5 py-2 rounded-xl bg-civic-blue text-white font-bold hover:bg-blue-700"
                  >
                    Deploy Work Order
                  </button>
                </div>
              </div>
            )}

            {/* TAB: REJECT WITH REASON */}
            {actionType === 'REJECT' && (
              <div className="space-y-4 text-xs">
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl">
                  Rejection requires a transparent reason that will be visible to the reporting citizen in their timeline.
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Rejection Reason <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Private property boundary, duplicate of CC-2026-1041, or state highway authority jurisdiction..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div className="pt-4 flex justify-end space-x-2">
                  <button
                    onClick={() => setSelectedComplaint(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteReject}
                    className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

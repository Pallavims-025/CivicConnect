import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Search,
  Filter,
  PlusCircle,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  User,
  Building,
  Coins,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useCivic } from '../../context/CivicContext';
import { PriorityBadge } from '../../components/common/StatusBadge';

export function WorkOrders() {
  const {
    workOrders,
    complaints,
    createWorkOrder,
    updateWorkOrderStatus,
  } = useCivic();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Work Order Form State
  const [formComplaintId, setFormComplaintId] = useState(
    complaints.filter((c) => !c.workOrderId).length > 0
      ? complaints.filter((c) => !c.workOrderId)[0].id
      : complaints[0]?.id || ''
  );
  const [formDept, setFormDept] = useState('Roads & Bridges Dept');
  const [formSupervisor, setFormSupervisor] = useState('Supervisor M. Rao');
  const [formPriority, setFormPriority] = useState('HIGH');
  const [formDesc, setFormDesc] = useState('');
  const [formDeadline, setFormDeadline] = useState('2026-10-25');
  const [formCrew, setFormCrew] = useState('Ward Field Response Unit 2 (5 personnel)');
  const [formCost, setFormCost] = useState('₹ 18,500');

  const DEPARTMENTS = [
    'Roads & Bridges Dept',
    'Solid Waste Management',
    'Electrical & Lighting',
    'Water Supply & Sewerage',
    'Stormwater Drains (SWD)',
    'Horticulture & Parks',
  ];

  const filteredOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      const matchSearch =
        wo.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wo.complaintTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wo.supervisor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wo.department.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || wo.status === statusFilter;
      const matchPriority = priorityFilter === 'ALL' || wo.priority === priorityFilter;

      return matchSearch && matchStatus && matchPriority;
    });
  }, [workOrders, searchTerm, statusFilter, priorityFilter]);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!formDesc.trim()) {
      alert('Please describe the work required.');
      return;
    }

    createWorkOrder({
      complaintId: formComplaintId,
      department: formDept,
      supervisor: formSupervisor,
      priority: formPriority,
      workDescription: formDesc,
      deadline: formDeadline,
      assignedCrew: formCrew,
      estimatedCost: formCost,
    });

    setShowCreateModal(false);
    setFormDesc('');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">In Progress</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Completed</span>;
      case 'OVERDUE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 flex items-center space-x-1">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            <span>Overdue</span>
          </span>
        );
      case 'REWORK_REQUIRED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">Rework Required</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-civic-text">
            Work Order Management
          </h2>
          <p className="text-xs text-civic-muted">
            Issue field task orders, monitor engineering crew assignments, track deadlines, and handle SLA compliance.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center space-x-2 bg-civic-blue hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-sm self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Work Order</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-1 max-w-2xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search work order ID, department, crew..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60"
            >
              <option value="ALL">All Statuses</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="OVERDUE">Overdue</option>
              <option value="REWORK_REQUIRED">Rework Required</option>
            </select>
          </div>

          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-500">
          Showing <strong>{filteredOrders.length}</strong> active orders
        </span>
      </div>

      {/* Work Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4 md:px-6">Work Order ID</th>
                <th className="py-3.5 px-4">Complaint Reference</th>
                <th className="py-3.5 px-4">Department & Supervisor</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Target Deadline</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Quick Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((wo) => (
                <tr key={wo.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 md:px-6 font-mono font-bold text-civic-blue">
                    {wo.id}
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    <span className="font-mono text-[11px] text-slate-400 block">
                      #{wo.complaintId}
                    </span>
                    <p className="font-bold text-slate-800 truncate">{wo.complaintTitle}</p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{wo.workDescription}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-800">{wo.department}</p>
                    <p className="text-[11px] text-slate-500 flex items-center mt-0.5">
                      <User className="w-3 h-3 mr-1 text-slate-400" />
                      {wo.supervisor}
                    </p>
                  </td>
                  <td className="py-3.5 px-4">
                    <PriorityBadge priority={wo.priority} />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-700 font-medium">{wo.deadline}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">{getStatusBadge(wo.status)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <select
                      value={wo.status}
                      onChange={(e) => updateWorkOrderStatus(wo.id, e.target.value)}
                      className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-[11px] font-semibold text-slate-700"
                    >
                      <option value="IN_PROGRESS">Set: In Progress</option>
                      <option value="COMPLETED">Set: Completed</option>
                      <option value="OVERDUE">Set: Overdue</option>
                      <option value="REWORK_REQUIRED">Set: Rework</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Work Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Issue Field Work Order
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Target Civic Complaint
                </label>
                <select
                  value={formComplaintId}
                  onChange={(e) => {
                    setFormComplaintId(e.target.value);
                    const comp = complaints.find((c) => c.id === e.target.value);
                    if (comp) setFormDesc(comp.title);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  {complaints.map((c) => (
                    <option key={c.id} value={c.id}>
                      #{c.id} — {c.title} ({c.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
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
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Field Supervisor</label>
                <input
                  type="text"
                  value={formSupervisor}
                  onChange={(e) => setFormSupervisor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Work Scope & Repair Instructions
                </label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="e.g. Excavate road surface, compact cold-mix asphalt, seal edges..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Deadline</label>
                  <input
                    type="date"
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimated Budget</label>
                  <input
                    type="text"
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Crew</label>
                <input
                  type="text"
                  value={formCrew}
                  onChange={(e) => setFormCrew(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-civic-blue text-white font-bold hover:bg-blue-700"
                >
                  Create & Dispatch Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

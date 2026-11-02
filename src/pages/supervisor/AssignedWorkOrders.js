import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Search,
  Filter,
  Eye,
  Users,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Camera,
  MapPin,
  Calendar,
  X,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { useCivic } from '../../context/CivicContext';
import { PriorityBadge, StatusBadge } from '../../components/common/StatusBadge';

export function AssignedWorkOrders() {
  const navigate = useNavigate();
  const {
    supervisorProfile,
    workOrders,
    complaints,
    workers,
    assignWorkersToWorkOrder,
    updateWorkOrderProgress,
    reportWorkOrderDelay,
    addWorkOrderSiteNotes,
  } = useCivic();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Modal states
  const [selectedWO, setSelectedWO] = useState(null);
  const [modalType, setModalType] = useState(null); // 'DETAILS' | 'ASSIGN_WORKERS' | 'PROGRESS' | 'SITE_NOTES' | 'DELAY'

  // Form states for modals
  const [selectedWorkersList, setSelectedWorkersList] = useState([]);
  const [progressVal, setProgressVal] = useState(50);
  const [progressNotes, setProgressNotes] = useState('');
  const [newSiteNote, setNewSiteNote] = useState('');
  const [delayReason, setDelayReason] = useState('');
  const [revisedDeadline, setRevisedDeadline] = useState('');

  // Filter to supervisor's work orders
  const myWorkOrders = useMemo(() => {
    return workOrders.filter(
      (w) => !w.supervisor || w.supervisor.toLowerCase().includes('rao') || w.supervisor.toLowerCase().includes('supervisor')
    );
  }, [workOrders]);

  const filteredWorkOrders = useMemo(() => {
    return myWorkOrders.filter((wo) => {
      const matchSearch =
        wo.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wo.complaintTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (wo.location && wo.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (wo.category && wo.category.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'ALL' || wo.status === statusFilter;
      const matchPriority = priorityFilter === 'ALL' || wo.priority === priorityFilter;

      return matchSearch && matchStatus && matchPriority;
    });
  }, [myWorkOrders, searchTerm, statusFilter, priorityFilter]);

  // Open modals with pre-filled state
  const handleOpenModal = (type, wo) => {
    setSelectedWO(wo);
    setModalType(type);

    if (type === 'ASSIGN_WORKERS') {
      setSelectedWorkersList(wo.assignedWorkers || []);
    } else if (type === 'PROGRESS') {
      setProgressVal(wo.progress || 0);
      setProgressNotes('');
    } else if (type === 'SITE_NOTES') {
      setNewSiteNote('');
    } else if (type === 'DELAY') {
      setDelayReason('');
      setRevisedDeadline(wo.deadline || '');
    }
  };

  const handleCloseModal = () => {
    setSelectedWO(null);
    setModalType(null);
  };

  // Submit Worker Assignments
  const handleAssignWorkersSubmit = (e) => {
    e.preventDefault();
    if (!selectedWO) return;
    assignWorkersToWorkOrder(selectedWO.id, selectedWorkersList);
    handleCloseModal();
    alert('Assigned workers successfully updated!');
  };

  // Submit Progress
  const handleProgressSubmit = (e) => {
    e.preventDefault();
    if (!selectedWO) return;
    updateWorkOrderProgress(selectedWO.id, {
      progress: progressVal,
      progressNotes,
      notifyOfficer: true,
    });
    handleCloseModal();
    alert('Work order progress saved!');
  };

  // Submit Site Note
  const handleSiteNoteSubmit = (e) => {
    e.preventDefault();
    if (!selectedWO || !newSiteNote.trim()) return;
    addWorkOrderSiteNotes(selectedWO.id, newSiteNote.trim());
    handleCloseModal();
    alert('Site note added to audit trail!');
  };

  // Submit Delay Report
  const handleDelaySubmit = (e) => {
    e.preventDefault();
    if (!selectedWO || !delayReason.trim()) {
      alert('Please specify the delay reason.');
      return;
    }
    reportWorkOrderDelay(selectedWO.id, {
      delayReason,
      revisedDeadline,
    });
    handleCloseModal();
    alert('Delay reported to Municipal Officer and recorded in complaint history.');
  };

  // Find original complaint
  const activeComplaint = selectedWO
    ? complaints.find((c) => c.id === selectedWO.complaintId)
    : null;

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-civic-text flex items-center space-x-2">
            <Briefcase className="w-6 h-6 text-civic-blue" />
            <span>Assigned Work Orders</span>
          </h2>
          <p className="text-xs text-civic-muted mt-0.5">
            Field work orders assigned to {supervisorProfile.name}. All repair jobs are strictly connected to their original citizen complaints.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/supervisor/photo-evidence')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
          >
            <Camera className="w-4 h-4" />
            <span>Submit Verification</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, title, location, category..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-civic-blue"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter Pills */}
          <div className="flex items-center space-x-1 overflow-x-auto text-xs">
            {['ALL', 'IN_PROGRESS', 'AWAITING_VERIFICATION', 'REWORK_REQUIRED', 'OVERDUE', 'COMPLETED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-colors whitespace-nowrap text-[11px] ${
                  statusFilter === st
                    ? 'bg-civic-blue text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* Priority Dropdown */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Work Orders List Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-4 px-4">Work Order / Complaint</th>
                <th className="py-4 px-4">Issue Title & Category</th>
                <th className="py-4 px-4">Location</th>
                <th className="py-4 px-4">Priority</th>
                <th className="py-4 px-4">Assigned Crew</th>
                <th className="py-4 px-4">Deadline</th>
                <th className="py-4 px-4">Progress</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredWorkOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No assigned work orders matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredWorkOrders.map((wo) => (
                  <tr key={wo.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono">
                      <span className="font-bold text-slate-900 block">{wo.id}</span>
                      <span className="text-[11px] text-civic-blue font-semibold">
                        #{wo.complaintId}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-bold text-slate-900 line-clamp-1">{wo.complaintTitle}</p>
                      <span className="text-[10px] text-slate-500">{wo.category}</span>
                    </td>

                    <td className="py-3.5 px-4 max-w-[180px]">
                      <div className="flex items-center space-x-1 text-slate-600 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{wo.location || 'Ward 14'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <PriorityBadge priority={wo.priority} />
                    </td>

                    <td className="py-3.5 px-4">
                      {wo.assignedWorkers && wo.assignedWorkers.length > 0 ? (
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-800 text-[11px] block">
                            {wo.assignedWorkers.length} assigned
                          </span>
                          <p className="text-[10px] text-slate-500 truncate max-w-[120px]">
                            {wo.assignedWorkers.join(', ')}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[11px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                          Unassigned
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`font-semibold text-[11px] ${
                          wo.status === 'OVERDUE' ? 'text-rose-600 font-bold' : 'text-slate-700'
                        }`}
                      >
                        {wo.deadline}
                      </span>
                      {wo.status === 'OVERDUE' && (
                        <span className="block text-[9px] text-rose-500 font-bold uppercase">
                          SLA Breached
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="w-24 space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span>{wo.progress || 0}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              wo.progress === 100
                                ? 'bg-emerald-500'
                                : wo.status === 'OVERDUE'
                                ? 'bg-rose-500'
                                : 'bg-civic-blue'
                            }`}
                            style={{ width: `${wo.progress || 0}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={wo.status} />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {/* Action buttons (Section 7) */}
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenModal('DETAILS', wo)}
                          title="View Details"
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-civic-blue transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenModal('ASSIGN_WORKERS', wo)}
                          title="Assign Workers"
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                        >
                          <Users className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenModal('PROGRESS', wo)}
                          title="Update Progress"
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                        >
                          <TrendingUp className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenModal('SITE_NOTES', wo)}
                          title="Add Site Notes"
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-purple-600 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenModal('DELAY', wo)}
                          title="Report Delay"
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-amber-600 transition-colors"
                        >
                          <Clock className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => navigate('/supervisor/photo-evidence')}
                          title="Submit Photo Evidence for Verification"
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors font-bold"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================================================== */}
      {/* MODAL 1: VIEW DETAILS                                */}
      {/* ==================================================== */}
      {modalType === 'DETAILS' && selectedWO && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                  {selectedWO.id}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {selectedWO.complaintTitle}
                </h3>
              </div>
              <button onClick={handleCloseModal} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 text-xl font-bold">
                &times;
              </button>
            </div>

            {/* Rejection Alert if applicable */}
            {selectedWO.verificationStatus === 'REWORK_REQUESTED' && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-1">
                <p className="font-bold flex items-center space-x-1.5 text-rose-900">
                  <RotateCcw className="w-4 h-4" />
                  <span>Officer Rejection Remarks & Rework Instructions:</span>
                </p>
                <p>{selectedWO.rejectionReason || 'Inspection standard not met.'}</p>
              </div>
            )}

            {/* Complaint Connection Information */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-400 font-semibold block">Complaint ID</span>
                <span className="font-mono font-bold text-civic-blue text-sm">#{selectedWO.complaintId}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Citizen Reported By</span>
                <span className="font-bold text-slate-800">{activeComplaint?.citizenName || 'Priya Sharma'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Category</span>
                <span className="font-semibold text-slate-800">{selectedWO.category}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Issued Date</span>
                <span className="font-semibold text-slate-800">{selectedWO.issuedDate}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Target Deadline</span>
                <span className="font-semibold text-slate-800">{selectedWO.deadline}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Estimated Cost</span>
                <span className="font-semibold text-slate-800">{selectedWO.estimatedCost}</span>
              </div>
            </div>

            {/* Repair Description */}
            <div>
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-1">
                Repair Specification & Description
              </h4>
              <p className="text-xs text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                {selectedWO.workDescription}
              </p>
            </div>

            {/* Assigned Workers */}
            <div>
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-2">
                Assigned Workers ({selectedWO.assignedWorkers?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedWO.assignedWorkers && selectedWO.assignedWorkers.length > 0 ? (
                  selectedWO.assignedWorkers.map((name, i) => (
                    <span key={i} className="px-3 py-1 rounded-xl bg-blue-50 text-civic-blue font-semibold text-xs border border-blue-200">
                      {name}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No workers assigned to this work order yet.</span>
                )}
              </div>
            </div>

            {/* Site Notes History */}
            <div>
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-2">
                Site Notes & Field Log
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedWO.siteNotes && selectedWO.siteNotes.length > 0 ? (
                  selectedWO.siteNotes.map((note, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 text-xs">
                      <div className="flex items-center justify-between text-slate-400 text-[10px] mb-0.5">
                        <span className="font-semibold text-slate-600">{note.author}</span>
                        <span>{note.date}</span>
                      </div>
                      <p className="text-slate-700">{note.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No site notes recorded yet.</p>
                )}
              </div>
            </div>

            {/* Complaint Photos Preview */}
            {activeComplaint?.photos && activeComplaint.photos.length > 0 && (
              <div>
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-2">
                  Original Citizen Issue Photos
                </h4>
                <div className="flex gap-2">
                  {activeComplaint.photos.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt="Citizen report"
                      className="w-20 h-20 rounded-xl object-cover border border-slate-200"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={handleCloseModal}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-md"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: ASSIGN WORKERS                              */}
      {/* ==================================================== */}
      {modalType === 'ASSIGN_WORKERS' && selectedWO && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Assign Workers to #{selectedWO.id}</span>
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>

            <p className="text-xs text-slate-500">
              Select one or multiple specialized municipal workers to dispatch for "{selectedWO.complaintTitle}".
            </p>

            <form onSubmit={handleAssignWorkersSubmit} className="space-y-4 text-xs">
              <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-100 p-3 rounded-2xl bg-slate-50/50">
                {workers.map((w) => {
                  const isChecked = selectedWorkersList.includes(w.name);
                  return (
                    <label
                      key={w.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-blue-50 border-blue-300 text-slate-900 font-semibold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedWorkersList([...selectedWorkersList, w.name]);
                            } else {
                              setSelectedWorkersList(selectedWorkersList.filter((n) => n !== w.name));
                            }
                          }}
                          className="rounded text-civic-blue focus:ring-civic-blue"
                        />
                        <div>
                          <p className="font-bold text-xs text-slate-900">{w.name}</p>
                          <p className="text-[10px] text-slate-400">{w.role}</p>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          w.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {w.status}
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md"
                >
                  Update Crew Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: UPDATE PROGRESS                             */}
      {/* ==================================================== */}
      {modalType === 'PROGRESS' && selectedWO && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-civic-blue" />
                <span>Update Progress: #{selectedWO.id}</span>
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleProgressSubmit} className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Completion Percentage</label>
                  <span className="font-extrabold text-civic-blue text-sm">{progressVal}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progressVal}
                  onChange={(e) => setProgressVal(parseInt(e.target.value))}
                  className="w-full accent-civic-blue cursor-pointer"
                />
              </div>

              {progressVal === 100 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 font-medium">
                  <strong>Crucial Rule:</strong> Setting 100% indicates on-site work is completed. The complaint will <strong>NOT</strong> become Resolved automatically. Resolution occurs only after you upload Photo Evidence and a Municipal Officer inspects and approves it.
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Field Progress Notes</label>
                <textarea
                  value={progressNotes}
                  onChange={(e) => setProgressNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. Sub-grade primed and 12 cold-mix asphalt bags compacted."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-civic-blue"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-civic-blue hover:bg-blue-700 text-white font-bold shadow-md"
                >
                  Save Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 4: ADD SITE NOTES                              */}
      {/* ==================================================== */}
      {modalType === 'SITE_NOTES' && selectedWO && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <span>Add Site Note: #{selectedWO.id}</span>
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleSiteNoteSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Site Observation / Inspection Note</label>
                <textarea
                  value={newSiteNote}
                  onChange={(e) => setNewSiteNote(e.target.value)}
                  rows={4}
                  placeholder="Record on-site conditions, machinery calibration, or safety barriers placed..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md"
                >
                  Add Site Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 5: REPORT DELAY                                */}
      {/* ==================================================== */}
      {modalType === 'DELAY' && selectedWO && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-rose-700 flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Report Delay: #{selectedWO.id}</span>
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>

            <p className="text-xs text-slate-500">
              Formally report unexpected obstacles causing schedule deviations. Municipal officers will be notified immediately.
            </p>

            <form onSubmit={handleDelaySubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason for Delay *</label>
                <textarea
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Unmapped telecom optical fiber bundle discovered during trench excavation"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Revised Target Completion Date</label>
                <input
                  type="date"
                  value={revisedDeadline}
                  onChange={(e) => setRevisedDeadline(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md"
                >
                  Submit Delay Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

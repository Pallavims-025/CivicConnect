import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  FileText,
  Camera,
  RotateCcw,
  Bell,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { useCivic } from '../../context/CivicContext';
import { PriorityBadge, StatusBadge } from '../../components/common/StatusBadge';

export function RepairProgressTracking() {
  const navigate = useNavigate();
  const {
    workOrders,
    updateWorkOrderProgress,
    reportWorkOrderDelay,
    supervisorProfile,
  } = useCivic();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [activeWO, setActiveWO] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'UPDATE_PROGRESS' | 'REPORT_DELAY'

  // Update Progress Form State
  const [progressVal, setProgressVal] = useState(50);
  const [notesVal, setNotesVal] = useState('');
  const [estDateVal, setEstDateVal] = useState('');
  const [blockerVal, setBlockerVal] = useState('');
  const [notifyOfficerCheck, setNotifyOfficerCheck] = useState(true);

  // Delay Form State
  const [delayReasonVal, setDelayReasonVal] = useState('');
  const [revisedDeadlineVal, setRevisedDeadlineVal] = useState('');

  // Supervisor work orders
  const myWorkOrders = useMemo(() => {
    return workOrders.filter(
      (w) => !w.supervisor || w.supervisor.toLowerCase().includes('rao') || w.supervisor.toLowerCase().includes('supervisor')
    );
  }, [workOrders]);

  const filteredOrders = useMemo(() => {
    return myWorkOrders.filter((wo) => {
      const matchSearch =
        wo.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wo.complaintTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wo.complaintId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (wo.location && wo.location.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'ALL' || wo.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [myWorkOrders, searchTerm, statusFilter]);

  const handleOpenUpdate = (wo) => {
    setActiveWO(wo);
    setProgressVal(wo.progress || 0);
    setNotesVal('');
    setEstDateVal(wo.estimatedCompletionDate || wo.deadline || '');
    setBlockerVal(wo.blockers && wo.blockers.length > 0 ? wo.blockers[0] : '');
    setNotifyOfficerCheck(true);
    setModalMode('UPDATE_PROGRESS');
  };

  const handleOpenDelay = (wo) => {
    setActiveWO(wo);
    setDelayReasonVal('');
    setRevisedDeadlineVal(wo.deadline || '');
    setModalMode('REPORT_DELAY');
  };

  const handleCloseModal = () => {
    setActiveWO(null);
    setModalMode(null);
  };

  const handleSaveProgress = (e) => {
    e.preventDefault();
    if (!activeWO) return;

    updateWorkOrderProgress(activeWO.id, {
      progress: progressVal,
      progressNotes: notesVal,
      estimatedCompletionDate: estDateVal,
      blockers: blockerVal ? [blockerVal] : [],
      notifyOfficer: notifyOfficerCheck,
    });

    handleCloseModal();
    alert('Repair progress synchronized with Municipal Command & Citizen Timeline!');
  };

  const handleSaveDelay = (e) => {
    e.preventDefault();
    if (!activeWO || !delayReasonVal.trim()) {
      alert('Please state the delay reason.');
      return;
    }

    reportWorkOrderDelay(activeWO.id, {
      delayReason: delayReasonVal.trim(),
      revisedDeadline: revisedDeadlineVal,
    });

    handleCloseModal();
    alert('Delay notification dispatched to Municipal Officer.');
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-civic-text flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-civic-blue" />
            <span>Repair Progress Tracking</span>
          </h2>
          <p className="text-xs text-civic-muted mt-0.5">
            Monitor real-time progress percentages, add field notes, update estimated completions, and report obstacles.
          </p>
        </div>

        <button
          onClick={() => navigate('/supervisor/photo-evidence')}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors self-start sm:self-auto"
        >
          <Camera className="w-4 h-4" />
          <span>Upload Verification Photos</span>
        </button>
      </div>

      {/* Verification Safeguard Notice Banner */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex items-start space-x-3 shadow-xs">
        <Info className="w-5 h-5 text-civic-blue shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold">System Accountability Standard:</p>
          <p className="text-blue-800 leading-relaxed">
            Even when repair progress reaches <strong>100%</strong>, the citizen complaint does <strong>NOT</strong> automatically transition to "Resolved".
            Official complaint resolution requires submitting Before-and-After photo evidence for Municipal Officer verification inspection.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search work order ID, title, complaint..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-civic-blue"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto text-xs">
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
      </div>

      {/* Progress Cards List (Section 9) */}
      <div className="space-y-5">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200">
            No work orders matching the selected filter.
          </div>
        ) : (
          filteredOrders.map((wo) => {
            const isFinished = (wo.progress || 0) === 100;
            const isOverdue = wo.status === 'OVERDUE';
            const isRework = wo.status === 'REWORK_REQUIRED';

            return (
              <div
                key={wo.id}
                className={`bg-white rounded-3xl p-6 border shadow-xs transition-all space-y-5 ${
                  isRework
                    ? 'border-rose-300 bg-rose-50/20'
                    : isOverdue
                    ? 'border-amber-300'
                    : 'border-slate-200'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">
                      {wo.id}
                    </span>
                    <span className="font-mono text-xs text-civic-blue font-semibold">
                      Complaint #{wo.complaintId}
                    </span>
                    <PriorityBadge priority={wo.priority} />
                    <StatusBadge status={wo.status} />
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenDelay(wo)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center space-x-1"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Report Delay</span>
                    </button>

                    <button
                      onClick={() => handleOpenUpdate(wo)}
                      className="px-4 py-1.5 rounded-xl bg-civic-blue hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center space-x-1.5"
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Update Progress</span>
                    </button>
                  </div>
                </div>

                {/* Title & Location */}
                <div>
                  <h3 className="text-base font-bold text-slate-900">{wo.complaintTitle}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{wo.location || 'Ward 14 Indiranagar'}</span>
                    </span>
                    <span>Department: <strong className="text-slate-700">{wo.department}</strong></span>
                    <span>Last Updated: <strong className="text-slate-700">{wo.lastUpdated || wo.issuedDate}</strong></span>
                  </div>
                </div>

                {/* Progress Bar & Key Percentages */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">Repair Progress Percentage</span>
                    <span className="text-civic-blue text-sm">{wo.progress || 0}%</span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFinished
                          ? 'bg-emerald-500'
                          : isOverdue
                          ? 'bg-amber-500'
                          : 'bg-civic-blue'
                      }`}
                      style={{ width: `${wo.progress || 0}%` }}
                    />
                  </div>

                  {/* 100% notification alert */}
                  {isFinished && (
                    <div className="flex items-center justify-between pt-1 text-[11px] text-emerald-800 font-semibold">
                      <span className="flex items-center space-x-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Physical repair complete on site. Verification photos required.</span>
                      </span>
                      <button
                        onClick={() => navigate('/supervisor/photo-evidence')}
                        className="text-civic-blue hover:underline font-bold"
                      >
                        Submit Verification Evidence &rarr;
                      </button>
                    </div>
                  )}
                </div>

                {/* Dates & Assigned Crew Details (Section 9) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-semibold block text-[10px] uppercase">Start Date</span>
                    <span className="font-bold text-slate-800">{wo.startDate || wo.issuedDate}</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-semibold block text-[10px] uppercase">Estimated Completion</span>
                    <span className="font-bold text-slate-800">{wo.estimatedCompletionDate || wo.deadline}</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-semibold block text-[10px] uppercase">SLA Deadline</span>
                    <span className={`font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-800'}`}>
                      {wo.deadline}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-semibold block text-[10px] uppercase">Actual Completion</span>
                    <span className="font-bold text-slate-800">
                      {wo.actualCompletionDate || (isFinished ? 'Completed (Pending signoff)' : 'In Progress')}
                    </span>
                  </div>
                </div>

                {/* Assigned Workers list */}
                <div className="flex items-center space-x-2 text-xs">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-slate-700">Assigned Crew:</span>
                  <div className="flex flex-wrap gap-1">
                    {wo.assignedWorkers && wo.assignedWorkers.length > 0 ? (
                      wo.assignedWorkers.map((name, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {name}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic">No workers assigned</span>
                    )}
                  </div>
                </div>

                {/* Active Blockers / Rework Remarks */}
                {(wo.blockers?.length > 0 || wo.rejectionReason) && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-1">
                    {wo.rejectionReason && (
                      <div>
                        <strong className="text-rose-900 block flex items-center space-x-1.5">
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Officer Rework Instructions:</span>
                        </strong>
                        <p className="text-rose-800">{wo.rejectionReason}</p>
                      </div>
                    )}
                    {wo.blockers && wo.blockers.length > 0 && (
                      <div>
                        <strong className="text-rose-900 block flex items-center space-x-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Reported Field Blocker:</span>
                        </strong>
                        <p className="text-rose-800">{wo.blockers.join(' • ')}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Latest Progress Notes */}
                {wo.siteNotes && wo.siteNotes.length > 0 && (
                  <div className="text-xs bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-700 block mb-0.5">Latest Site Update:</span>
                    <p className="text-slate-600 italic">"{wo.siteNotes[0].text}"</p>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Logged by {wo.siteNotes[0].author} on {wo.siteNotes[0].date}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ==================================================== */}
      {/* MODAL: UPDATE PROGRESS                               */}
      {/* ==================================================== */}
      {modalMode === 'UPDATE_PROGRESS' && activeWO && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                  {activeWO.id}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Update Repair Progress
                </h3>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleSaveProgress} className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Progress Percentage</label>
                  <span className="font-extrabold text-civic-blue text-base">{progressVal}%</span>
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
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>0% Not Started</span>
                  <span>50% In Progress</span>
                  <span>100% Completed on Site</span>
                </div>
              </div>

              {progressVal === 100 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
                  <strong>Notice:</strong> 100% progress marks physical repair completed. To resolve the complaint, you must next submit photo evidence to the Municipal Officer.
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Field Progress Notes</label>
                <textarea
                  value={notesVal}
                  onChange={(e) => setNotesVal(e.target.value)}
                  rows={3}
                  placeholder="Describe progress made today, materials laid, surface compaction..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-civic-blue"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Estimated Completion Date</label>
                <input
                  type="date"
                  value={estDateVal}
                  onChange={(e) => setEstDateVal(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reported Site Blocker / Delay Factor</label>
                <input
                  type="text"
                  value={blockerVal}
                  onChange={(e) => setBlockerVal(e.target.value)}
                  placeholder="e.g. Traffic diversion permit delayed, machinery maintenance"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <label className="flex items-center space-x-2.5 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyOfficerCheck}
                  onChange={(e) => setNotifyOfficerCheck(e.target.checked)}
                  className="rounded text-civic-blue focus:ring-civic-blue"
                />
                <span className="font-semibold text-slate-700 text-xs">
                  Notify Municipal Officer of this update via notification push
                </span>
              </label>

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
      {/* MODAL: REPORT DELAY                                  */}
      {/* ==================================================== */}
      {modalMode === 'REPORT_DELAY' && activeWO && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-rose-700 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Report Delay: #{activeWO.id}</span>
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleSaveDelay} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason for Delay *</label>
                <textarea
                  value={delayReasonVal}
                  onChange={(e) => setDelayReasonVal(e.target.value)}
                  rows={3}
                  placeholder="Specify cause of delay (heavy rain, missing DI sleeve, underground cable obstacle)..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Revised Target Date *</label>
                <input
                  type="date"
                  value={revisedDeadlineVal}
                  onChange={(e) => setRevisedDeadlineVal(e.target.value)}
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

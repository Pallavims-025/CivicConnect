import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  PlusCircle,
  Search,
  Calendar,
  Printer,
  Eye,
  Briefcase,
  Users,
  Boxes,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';
import { useCivic } from '../../context/CivicContext';

export function ProgressReports() {
  const {
    progressReports,
    workOrders,
    workers,
    submitProgressReport,
    supervisorProfile,
  } = useCivic();

  const [searchTerm, setSearchTerm] = useState('');
  const [woFilter, setWoFilter] = useState('ALL');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingReport, setViewingReport] = useState(null);

  // Form Fields (Section 13)
  const [reportWO, setReportWO] = useState(workOrders[0]?.id || '');
  const [workCompleted, setWorkCompleted] = useState('');
  const [currentProgress, setCurrentProgress] = useState(65);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [materialsUsed, setMaterialsUsed] = useState('');
  const [remainingWork, setRemainingWork] = useState('');
  const [problemsOrDelays, setProblemsOrDelays] = useState('None');
  const [nextSteps, setNextSteps] = useState('');
  const [reportPhotos, setReportPhotos] = useState([]);

  // Active supervisor work orders
  const myWorkOrders = useMemo(() => {
    return workOrders.filter(
      (w) => !w.supervisor || w.supervisor.toLowerCase().includes('rao') || w.supervisor.toLowerCase().includes('supervisor')
    );
  }, [workOrders]);

  const filteredReports = useMemo(() => {
    return progressReports.filter((r) => {
      const matchSearch =
        r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.workOrderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.workCompleted.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.submittedBy && r.submittedBy.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchWO = woFilter === 'ALL' || r.workOrderId === woFilter;
      return matchSearch && matchWO;
    });
  }, [progressReports, searchTerm, woFilter]);

  // Open Create Modal
  const handleOpenCreate = () => {
    const defaultWO = myWorkOrders[0] || workOrders[0];
    setReportWO(defaultWO?.id || '');
    setCurrentProgress(defaultWO?.progress || 50);
    setWorkCompleted('');
    setSelectedWorkers(defaultWO?.assignedWorkers || []);
    setMaterialsUsed('');
    setRemainingWork('');
    setProblemsOrDelays('None');
    setNextSteps('');
    setReportPhotos(defaultWO?.beforePhotos || []);
    setShowCreateModal(true);
  };

  // Submit Progress Report
  const handleSubmitReport = (e) => {
    e.preventDefault();
    if (!reportWO || !workCompleted.trim()) {
      alert('Please fill out the required report summary fields.');
      return;
    }

    const newReport = submitProgressReport({
      workOrderId: reportWO,
      workCompleted: workCompleted.trim(),
      currentProgress,
      workersInvolved: selectedWorkers,
      materialsUsed: materialsUsed.trim() || 'Standard site materials',
      remainingWork: remainingWork.trim() || 'None',
      problemsOrDelays: problemsOrDelays.trim() || 'None',
      photoEvidence: reportPhotos,
      nextSteps: nextSteps.trim() || 'Continue according to schedule',
    });

    setShowCreateModal(false);
    setViewingReport(newReport);
    alert('Official municipal progress report successfully submitted!');
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-civic-text flex items-center space-x-2">
            <FileSpreadsheet className="w-6 h-6 text-civic-blue" />
            <span>Progress Reports & Inspection Logs</span>
          </h2>
          <p className="text-xs text-civic-muted mt-0.5">
            Log formal daily engineering reports for active municipal work orders. All records are archived and accessible to Executive Municipal Officers.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-civic-blue hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Generate Progress Report</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search report ID, work order, summary..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-civic-blue"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-500">Filter Work Order:</span>
          <select
            value={woFilter}
            onChange={(e) => setWoFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="ALL">All Active Work Orders</option>
            {myWorkOrders.map((wo) => (
              <option key={wo.id} value={wo.id}>
                {wo.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports Grid (Section 13) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredReports.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200">
            No formal progress reports found for this filter.
          </div>
        ) : (
          filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-blue-300 transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header row */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">
                      {report.id}
                    </span>
                    <span className="font-mono text-xs text-civic-blue font-semibold">
                      WO #{report.workOrderId}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{report.reportDateTime}</span>
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Current Progress</span>
                    <span className="text-civic-blue">{report.currentProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-civic-blue h-full rounded-full"
                      style={{ width: `${report.currentProgress}%` }}
                    />
                  </div>
                </div>

                {/* Work Completed */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Work Completed
                  </h4>
                  <p className="text-xs text-slate-800 leading-relaxed line-clamp-3">
                    {report.workCompleted}
                  </p>
                </div>

                {/* Workers & Materials Grid */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block font-semibold">Workers Involved:</span>
                    <span className="text-slate-800 font-medium truncate block">
                      {Array.isArray(report.workersInvolved)
                        ? report.workersInvolved.join(', ')
                        : report.workersInvolved || 'Field crew'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Materials Used:</span>
                    <span className="text-slate-800 font-medium truncate block">
                      {report.materialsUsed}
                    </span>
                  </div>
                </div>

                {/* Problems or delays */}
                {report.problemsOrDelays && report.problemsOrDelays !== 'None' && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 flex items-center space-x-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                    <span className="truncate"><strong>Obstacle:</strong> {report.problemsOrDelays}</span>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Logged by: <strong>{report.submittedBy}</strong>
                </span>

                <button
                  onClick={() => setViewingReport(report)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center space-x-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Full Report</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ==================================================== */}
      {/* MODAL: CREATE PROGRESS REPORT (Section 13)           */}
      {/* ==================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-civic-blue" />
                <span>Create Official Progress Report</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Work Order *</label>
                  <select
                    value={reportWO}
                    onChange={(e) => {
                      setReportWO(e.target.value);
                      const target = myWorkOrders.find((w) => w.id === e.target.value);
                      if (target) {
                        setCurrentProgress(target.progress || 0);
                        setSelectedWorkers(target.assignedWorkers || []);
                      }
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-civic-blue"
                    required
                  >
                    {myWorkOrders.map((wo) => (
                      <option key={wo.id} value={wo.id}>
                        {wo.id} - {wo.complaintTitle.substring(0, 40)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="font-bold text-slate-700">Current Progress Percentage</label>
                    <span className="font-bold text-civic-blue">{currentProgress}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={currentProgress}
                    onChange={(e) => setCurrentProgress(parseInt(e.target.value))}
                    className="w-full accent-civic-blue cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Work Completed on Site *</label>
                <textarea
                  value={workCompleted}
                  onChange={(e) => setWorkCompleted(e.target.value)}
                  rows={3}
                  placeholder="Detail the work completed during this shift (excavation depth, asphalt layers applied, pipe couplings welded)..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-civic-blue"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Materials Used</label>
                  <input
                    type="text"
                    value={materialsUsed}
                    onChange={(e) => setMaterialsUsed(e.target.value)}
                    placeholder="e.g. 9 bags Cold-Mix Asphalt, 1 sack lime powder"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Remaining Work Required</label>
                  <input
                    type="text"
                    value={remainingWork}
                    onChange={(e) => setRemainingWork(e.target.value)}
                    placeholder="e.g. Final 4-pass vibratory rolling and sealant bead"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Specialists Involved</label>
                <div className="flex flex-wrap gap-2 border border-slate-100 p-2.5 rounded-xl bg-slate-50">
                  {workers.map((w) => {
                    const isSelected = selectedWorkers.includes(w.name);
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedWorkers(selectedWorkers.filter((n) => n !== w.name));
                          } else {
                            setSelectedWorkers([...selectedWorkers, w.name]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          isSelected
                            ? 'bg-civic-blue text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {w.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Problems or Delays Encountered</label>
                  <input
                    type="text"
                    value={problemsOrDelays}
                    onChange={(e) => setProblemsOrDelays(e.target.value)}
                    placeholder="e.g. None or Rain shower paused rolling"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Next Immediate Steps</label>
                  <input
                    type="text"
                    value={nextSteps}
                    onChange={(e) => setNextSteps(e.target.value)}
                    placeholder="e.g. Morning compaction check and photo upload"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-civic-blue hover:bg-blue-700 text-white font-bold shadow-md"
                >
                  Submit Official Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: VIEW / PRINT OFFICIAL REPORT                 */}
      {/* ==================================================== */}
      {viewingReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in print:p-0">
            {/* Report Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="inline-flex items-center space-x-2 text-xs text-civic-blue font-bold uppercase tracking-wider mb-1">
                  <span>CivicConnect Field Engineering Office</span>
                  <span>•</span>
                  <span>Report #{viewingReport.id}</span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Municipal Field Work Progress Report
                </h3>
                <p className="text-xs text-slate-500">
                  Work Order: <strong>#{viewingReport.workOrderId}</strong> | Generated: <strong>{viewingReport.reportDateTime}</strong>
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center space-x-1"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Print</span>
                </button>
                <button
                  onClick={() => setViewingReport(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 text-xl font-bold"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-400 block font-semibold text-[10px]">PROGRESS</span>
                <span className="text-base font-extrabold text-civic-blue">{viewingReport.currentProgress}%</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold text-[10px]">SUPERVISOR</span>
                <span className="font-bold text-slate-800">{viewingReport.submittedBy}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold text-[10px]">DEPARTMENT</span>
                <span className="font-bold text-slate-800">{supervisorProfile.department}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold text-[10px]">ZONE</span>
                <span className="font-bold text-slate-800">Indiranagar Ward 14</span>
              </div>
            </div>

            {/* Narrative Sections */}
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">
                  Summary of Work Performed
                </h4>
                <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 leading-relaxed">
                  {viewingReport.workCompleted}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">
                    Crew Specialists Involved
                  </h4>
                  <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700">
                    {Array.isArray(viewingReport.workersInvolved)
                      ? viewingReport.workersInvolved.join(', ')
                      : viewingReport.workersInvolved}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">
                    Materials & Quantities Expended
                  </h4>
                  <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700">
                    {viewingReport.materialsUsed}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">
                    Remaining Scope of Work
                  </h4>
                  <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700">
                    {viewingReport.remainingWork}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">
                    Reported Obstacles / Delays
                  </h4>
                  <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700">
                    {viewingReport.problemsOrDelays}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">
                  Scheduled Next Steps
                </h4>
                <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700">
                  {viewingReport.nextSteps}
                </p>
              </div>
            </div>

            {/* Signature Area */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div>
                <p className="font-semibold text-slate-700">Prepared by: {viewingReport.submittedBy}</p>
                <p className="text-[10px] text-slate-400">Senior Field Works Supervisor</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700">Municipal Audit Log ID</p>
                <p className="font-mono text-[10px] text-slate-400">AUDIT-RPT-{viewingReport.id}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

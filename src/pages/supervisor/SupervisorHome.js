import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Users,
  Boxes,
  ClipboardList,
  ShieldCheck,
  PlusCircle,
  Camera,
  Calendar,
  Clock,
  ArrowRight,
  MapPin,
  ChevronRight,
  AlertCircle,
  Layers,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { useCivic } from '../../context/CivicContext';
import { PriorityBadge, StatusBadge } from '../../components/common/StatusBadge';

export function SupervisorHome() {
  const navigate = useNavigate();
  const {
    supervisorProfile,
    workOrders,
    workerTasks,
    workers,
    siteMaterials,
    materialRequests,
    verifications,
    complaints,
    updateWorkOrderProgress,
    addWorkerTask,
    submitSupervisorMaterialRequest,
  } = useCivic();

  // Modals for Quick Actions
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);

  // Quick Action Form States
  const [selectedWO, setSelectedWO] = useState('');
  const [assignWorkerId, setAssignWorkerId] = useState('');
  const [assignTaskDesc, setAssignTaskDesc] = useState('');
  const [assignDeadline, setAssignDeadline] = useState('');

  const [progressVal, setProgressVal] = useState(50);
  const [progressNotes, setProgressNotes] = useState('');
  const [progressBlockers, setProgressBlockers] = useState('');

  const [matName, setMatName] = useState('');
  const [matQty, setMatQty] = useState('');
  const [matUnit, setMatUnit] = useState('Bags');
  const [matPriority, setMatPriority] = useState('MEDIUM');
  const [matReason, setMatReason] = useState('');

  // Supervisor Work Orders
  const myWorkOrders = workOrders.filter(
    (w) => !w.supervisor || w.supervisor.toLowerCase().includes('rao') || w.supervisor.toLowerCase().includes('supervisor')
  );

  // Dynamic Calculated Metrics (Section 6)
  const totalAssignedWO = myWorkOrders.length;
  const ongoingRepairs = myWorkOrders.filter((w) => w.status === 'IN_PROGRESS').length;
  const completedTasksCount = workerTasks.filter((t) => t.status === 'Completed').length;
  const delayedTasksCount = myWorkOrders.filter((w) => w.status === 'OVERDUE' || w.status === 'REWORK_REQUIRED').length;
  const activeWorkersCount = workers.filter((w) => w.status === 'ACTIVE').length;
  const lowStockCount = siteMaterials.filter((m) => m.remainingQuantity <= 3).length;
  const pendingRequestsCount = materialRequests.filter(
    (m) => m.status === 'Pending Approval' || m.status === 'PENDING'
  ).length;
  const awaitingVerificationCount = myWorkOrders.filter(
    (w) => w.status === 'AWAITING_VERIFICATION' || w.verificationStatus === 'AWAITING_VERIFICATION'
  ).length;

  // Lists for lower sections
  const overdueTasks = myWorkOrders.filter((w) => w.status === 'OVERDUE');
  const reworkTasks = myWorkOrders.filter((w) => w.status === 'REWORK_REQUIRED');

  const upcomingDeadlines = [...myWorkOrders]
    .filter((w) => w.status !== 'COMPLETED')
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 4);

  const recentAssignedWO = [...myWorkOrders]
    .sort((a, b) => new Date(b.issuedDate) - new Date(a.issuedDate))
    .slice(0, 4);

  const pendingRequestsList = materialRequests
    .filter((m) => m.status === 'Pending Approval' || m.status === 'PENDING')
    .slice(0, 3);

  const lowStockAlerts = siteMaterials.filter((m) => m.remainingQuantity <= 3).slice(0, 4);

  // Handlers for Quick Action Modals
  const handleAssignWorkerSubmit = (e) => {
    e.preventDefault();
    if (!selectedWO || !assignWorkerId || !assignTaskDesc) {
      alert('Please fill out all task assignment fields.');
      return;
    }
    const targetWO = myWorkOrders.find((w) => w.id === selectedWO);
    addWorkerTask({
      workOrderId: selectedWO,
      complaintId: targetWO?.complaintId || '',
      workerId: assignWorkerId,
      taskDescription: assignTaskDesc,
      deadline: assignDeadline || targetWO?.deadline || '2026-10-25',
    });
    setShowAssignModal(false);
    setAssignTaskDesc('');
    alert('Worker task successfully scheduled!');
  };

  const handleUpdateProgressSubmit = (e) => {
    e.preventDefault();
    if (!selectedWO) {
      alert('Please select a work order.');
      return;
    }
    updateWorkOrderProgress(selectedWO, {
      progress: progressVal,
      progressNotes,
      blockers: progressBlockers ? [progressBlockers] : [],
      notifyOfficer: true,
    });
    setShowProgressModal(false);
    setProgressNotes('');
    setProgressBlockers('');
    alert('Progress updated and municipal officer alerted!');
  };

  const handleMaterialRequestSubmit = (e) => {
    e.preventDefault();
    if (!selectedWO || !matName || !matQty) {
      alert('Please specify work order, material name, and quantity.');
      return;
    }
    const targetWO = myWorkOrders.find((w) => w.id === selectedWO);
    submitSupervisorMaterialRequest({
      workOrderId: selectedWO,
      complaintId: targetWO?.complaintId,
      materialName: matName,
      requestedQty: matQty,
      unit: matUnit,
      priority: matPriority,
      reason: matReason || 'Site repair replenishment',
    });
    setShowMaterialModal(false);
    setMatName('');
    setMatQty('');
    setMatReason('');
    alert('Material requisition submitted to Municipal Officer queue!');
  };

  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#163A63] to-[#2563EB] rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-200 text-xs font-semibold mb-3 border border-white/10">
            <span>{supervisorProfile.assignedArea}</span>
            <span>•</span>
            <span>{supervisorProfile.shift}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome, {supervisorProfile.name}
          </h2>
          <p className="text-blue-100 text-xs md:text-sm mt-1 max-w-xl">
            On-site field operations management. Track assigned repairs, dispatch specialized field workers, manage site inventory, and submit photo verification.
          </p>
        </div>

        {/* Quick-Action Buttons (Section 6) */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              if (myWorkOrders.length > 0) setSelectedWO(myWorkOrders[0].id);
              setShowAssignModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white text-slate-800 hover:bg-slate-100 font-bold text-xs shadow-md transition-all hover:scale-105"
          >
            <Users className="w-4 h-4 text-civic-blue" />
            <span>Assign Worker</span>
          </button>

          <button
            onClick={() => {
              if (myWorkOrders.length > 0) {
                setSelectedWO(myWorkOrders[0].id);
                setProgressVal(myWorkOrders[0].progress || 50);
              }
              setShowProgressModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs shadow-md transition-all hover:scale-105"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Update Progress</span>
          </button>

          <button
            onClick={() => navigate('/supervisor/photo-evidence')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all hover:scale-105"
          >
            <Camera className="w-4 h-4" />
            <span>Upload Photos</span>
          </button>

          <button
            onClick={() => {
              if (myWorkOrders.length > 0) setSelectedWO(myWorkOrders[0].id);
              setShowMaterialModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all hover:scale-105"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Request Materials</span>
          </button>
        </div>
      </div>

      {/* Rework Alert Banner (If Any Repair Rejected by Officer) */}
      {reworkTasks.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-pulse">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl shrink-0 mt-0.5">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900 flex items-center space-x-2">
                <span>Corrective Rework Instructed by Municipal Officer</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-200 text-rose-800 font-bold">
                  Action Required
                </span>
              </h4>
              <p className="text-xs text-rose-700 mt-1">
                Work Order <strong>#{reworkTasks[0].id}</strong> ({reworkTasks[0].complaintTitle}): "{reworkTasks[0].rejectionReason || 'Inspection standard not met.'}"
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/supervisor/photo-evidence')}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm whitespace-nowrap transition-colors"
          >
            View Corrective Actions &rarr;
          </button>
        </div>
      )}

      {/* 8 SUMMARY CARDS (Section 6) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500">
            Field Supervision Key Metrics
          </h3>
          <span className="text-xs text-slate-400">Calculated from live municipal records</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Assigned Work Orders */}
          <div
            onClick={() => navigate('/supervisor/work-orders')}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Assigned Work Orders</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-3">{totalAssignedWO}</p>
            <p className="text-[11px] text-blue-600 font-medium mt-1 flex items-center space-x-1">
              <span>View all orders</span>
              <ChevronRight className="w-3 h-3" />
            </p>
          </div>

          {/* Card 2: Ongoing Repairs */}
          <div
            onClick={() => navigate('/supervisor/repair-progress')}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Ongoing Repairs</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-extrabold text-emerald-600 mt-3">{ongoingRepairs}</p>
            <p className="text-[11px] text-slate-400 mt-1">Crews active on site</p>
          </div>

          {/* Card 3: Completed Tasks */}
          <div
            onClick={() => navigate('/supervisor/worker-assignments')}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Completed Tasks</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-extrabold text-purple-600 mt-3">{completedTasksCount}</p>
            <p className="text-[11px] text-slate-400 mt-1">Worker task milestones</p>
          </div>

          {/* Card 4: Delayed Tasks */}
          <div
            onClick={() => navigate('/supervisor/repair-progress')}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-rose-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Delayed Tasks</span>
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-extrabold text-rose-600 mt-3">{delayedTasksCount}</p>
            <p className="text-[11px] text-rose-500 font-medium mt-1">Exceeding SLA target</p>
          </div>

          {/* Card 5: Active Workers */}
          <div
            onClick={() => navigate('/supervisor/worker-assignments')}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Active Workers</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-extrabold text-indigo-600 mt-3">{activeWorkersCount}</p>
            <p className="text-[11px] text-slate-400 mt-1">Available in field roster</p>
          </div>

          {/* Card 6: Low-Stock Materials */}
          <div
            onClick={() => navigate('/supervisor/material-inventory')}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Low-Stock Materials</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-extrabold text-amber-600 mt-3">{lowStockCount}</p>
            <p className="text-[11px] text-amber-600 font-medium mt-1">Remaining &le; 3 units</p>
          </div>

          {/* Card 7: Pending Material Requests */}
          <div
            onClick={() => navigate('/supervisor/material-requests')}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Pending Requests</span>
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ClipboardList className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-extrabold text-sky-600 mt-3">{pendingRequestsCount}</p>
            <p className="text-[11px] text-slate-400 mt-1">Awaiting officer dispatch</p>
          </div>

          {/* Card 8: Repairs Awaiting Verification */}
          <div
            onClick={() => navigate('/supervisor/photo-evidence')}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Awaiting Verification</span>
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-extrabold text-teal-600 mt-3">{awaitingVerificationCount}</p>
            <p className="text-[11px] text-teal-600 font-medium mt-1">Photos submitted to officer</p>
          </div>
        </div>
      </div>

      {/* LOWER SECTION: Two Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols wide) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Assigned Work Orders */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Briefcase className="w-4 h-4 text-civic-blue" />
                  <span>Recent Assigned Work Orders</span>
                </h3>
                <p className="text-xs text-slate-500">Assigned by Municipal Officers for Ward 14 Indiranagar</p>
              </div>
              <button
                onClick={() => navigate('/supervisor/work-orders')}
                className="text-xs text-civic-blue hover:underline font-semibold flex items-center space-x-1"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentAssignedWO.map((wo) => (
                <div key={wo.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl px-2 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                        {wo.id}
                      </span>
                      <PriorityBadge priority={wo.priority} />
                      <StatusBadge status={wo.status} />
                    </div>
                    <p className="text-xs font-bold text-slate-800">{wo.complaintTitle}</p>
                    <div className="flex items-center space-x-4 text-[11px] text-slate-500">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{wo.location || 'Indiranagar'}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Due: {wo.deadline}</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-civic-blue h-full rounded-full"
                          style={{ width: `${wo.progress || 0}%` }}
                        />
                      </div>
                      <span className="font-bold text-xs text-slate-700">{wo.progress || 0}%</span>
                    </div>
                    <button
                      onClick={() => navigate('/supervisor/repair-progress')}
                      className="text-[11px] font-semibold text-civic-blue hover:underline mt-1"
                    >
                      Track progress &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Worker Task Status & Breakdown */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Worker Task Status</span>
                </h3>
                <p className="text-xs text-slate-500">Active repair assignments and sub-task progress</p>
              </div>
              <button
                onClick={() => navigate('/supervisor/worker-assignments')}
                className="text-xs text-civic-blue hover:underline font-semibold flex items-center space-x-1"
              >
                <span>Manage roster</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                    <th className="pb-3">Task ID</th>
                    <th className="pb-3">Worker</th>
                    <th className="pb-3">Task Description</th>
                    <th className="pb-3">Progress</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {workerTasks.slice(0, 5).map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-mono font-bold text-slate-800">{t.id}</td>
                      <td className="py-3 font-medium text-slate-900">
                        {t.workerName}
                        <p className="text-[10px] text-slate-400">{t.workerRole}</p>
                      </td>
                      <td className="py-3 text-slate-600 max-w-xs truncate">{t.taskDescription}</td>
                      <td className="py-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold">{t.progress}%</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.status === 'Blocked'
                              ? 'bg-rose-100 text-rose-800'
                              : t.status === 'In Progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Before-and-After Photo Activity (Section 6) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span>Before-and-After Photo Activity</span>
                </h3>
                <p className="text-xs text-slate-500">Visual evidence log submitted to Municipal Officers</p>
              </div>
              <button
                onClick={() => navigate('/supervisor/photo-evidence')}
                className="text-xs text-civic-blue hover:underline font-semibold"
              >
                Open Photo Studio &rarr;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myWorkOrders.slice(0, 2).map((wo) => (
                <div key={wo.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-800">{wo.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                      {wo.verificationStatus || 'Inspection Queued'}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 line-clamp-1">{wo.complaintTitle}</p>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative rounded-lg overflow-hidden h-24 bg-slate-200">
                      <img
                        src={wo.beforePhotos?.[0] || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=300&auto=format&fit=crop&q=80'}
                        alt="Before"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-[9px] rounded font-bold">
                        Before
                      </span>
                    </div>

                    <div className="relative rounded-lg overflow-hidden h-24 bg-slate-200">
                      {wo.afterPhotos?.[0] ? (
                        <img
                          src={wo.afterPhotos[0]}
                          alt="After"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center text-[10px]">
                          <Camera className="w-4 h-4 mb-1" />
                          <span>Pending After Photo</span>
                        </div>
                      )}
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-emerald-600 text-white text-[9px] rounded font-bold">
                        After
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 col wide) */}
        <div className="space-y-8">
          {/* Upcoming Deadlines & Overdue Tasks */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Upcoming Deadlines</span>
              </h3>
              <span className="text-[11px] font-bold text-rose-600">
                {overdueTasks.length} Overdue
              </span>
            </div>

            <div className="space-y-3">
              {upcomingDeadlines.map((wo) => {
                const isOverdue = wo.status === 'OVERDUE';
                return (
                  <div
                    key={wo.id}
                    className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                      isOverdue
                        ? 'border-rose-200 bg-rose-50/50'
                        : 'border-slate-100 bg-slate-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-800">{wo.id}</span>
                      <span
                        className={`font-semibold text-[10px] ${
                          isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'
                        }`}
                      >
                        {isOverdue ? '⚠️ Overdue' : `Due: ${wo.deadline}`}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-800 line-clamp-1">{wo.complaintTitle}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Progress: {wo.progress || 0}%</span>
                      <button
                        onClick={() => navigate('/supervisor/repair-progress')}
                        className="text-civic-blue hover:underline font-semibold"
                      >
                        Update &rarr;
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Low-Stock Material Alerts (Section 6) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Boxes className="w-4 h-4 text-amber-600" />
                <span>Site Material Alerts</span>
              </h3>
              <button
                onClick={() => navigate('/supervisor/material-inventory')}
                className="text-xs text-civic-blue hover:underline font-semibold"
              >
                Inventory &rarr;
              </button>
            </div>

            <div className="space-y-2.5">
              {lowStockAlerts.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No critical material shortages.</p>
              ) : (
                lowStockAlerts.map((m) => (
                  <div key={m.id} className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/40 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{m.materialName}</p>
                      <p className="text-[10px] text-slate-500">WO: #{m.workOrderId}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md text-xs">
                        {m.remainingQuantity} {m.unit}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending Material Requests (Section 6) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <ClipboardList className="w-4 h-4 text-sky-600" />
                <span>Pending Supply Requisitions</span>
              </h3>
              <button
                onClick={() => navigate('/supervisor/material-requests')}
                className="text-xs text-civic-blue hover:underline font-semibold"
              >
                View all &rarr;
              </button>
            </div>

            <div className="space-y-2.5">
              {pendingRequestsList.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No material requests pending approval.</p>
              ) : (
                pendingRequestsList.map((req) => (
                  <div key={req.id} className="p-2.5 rounded-xl border border-sky-100 bg-sky-50/30 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-800">{req.id}</span>
                      <PriorityBadge priority={req.priority} />
                    </div>
                    <p className="font-semibold text-slate-800">{req.materialName}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Requested: {req.requestedQty} {req.unit}</span>
                      <span className="text-sky-700 font-bold bg-sky-100 px-1.5 py-0.5 rounded text-[10px]">
                        Officer Review
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACTION MODAL: Assign Worker */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Users className="w-5 h-5 text-civic-blue" />
                <span>Assign Worker Task</span>
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
            </div>

            <form onSubmit={handleAssignWorkerSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Work Order *</label>
                <select
                  value={selectedWO}
                  onChange={(e) => setSelectedWO(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-civic-blue"
                  required
                >
                  {myWorkOrders.map((wo) => (
                    <option key={wo.id} value={wo.id}>
                      {wo.id} - {wo.complaintTitle.substring(0, 45)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Field Specialist *</label>
                <select
                  value={assignWorkerId}
                  onChange={(e) => setAssignWorkerId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-civic-blue"
                  required
                >
                  <option value="">-- Choose Worker from Roster --</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.role}) - {w.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Task Description / Instructions *</label>
                <textarea
                  value={assignTaskDesc}
                  onChange={(e) => setAssignTaskDesc(e.target.value)}
                  rows={3}
                  placeholder="e.g. Vibratory roller compaction (min 4 passes) along CMH road curb"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-civic-blue"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Task Deadline</label>
                <input
                  type="date"
                  value={assignDeadline}
                  onChange={(e) => setAssignDeadline(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-civic-blue hover:bg-blue-700 text-white font-bold shadow-md"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ACTION MODAL: Update Progress */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-civic-blue" />
                <span>Quick Progress Update</span>
              </h3>
              <button onClick={() => setShowProgressModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
            </div>

            <form onSubmit={handleUpdateProgressSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Work Order *</label>
                <select
                  value={selectedWO}
                  onChange={(e) => {
                    setSelectedWO(e.target.value);
                    const wo = myWorkOrders.find((w) => w.id === e.target.value);
                    if (wo) setProgressVal(wo.progress || 0);
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-civic-blue"
                  required
                >
                  {myWorkOrders.map((wo) => (
                    <option key={wo.id} value={wo.id}>
                      {wo.id} - {wo.complaintTitle} (Currently {wo.progress || 0}%)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Repair Progress Percentage</label>
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
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>0% Started</span>
                  <span>50% Intermediate</span>
                  <span>100% Finished</span>
                </div>
              </div>

              {progressVal === 100 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
                  <strong>Notice:</strong> 100% progress reflects physical repair completion. The complaint will remain unresolved until you submit photo evidence and a Municipal Officer officially verifies the site.
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Progress Notes / Field Updates</label>
                <textarea
                  value={progressNotes}
                  onChange={(e) => setProgressNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. Tack coat cured; compacted cold mix overlay smoothly."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-civic-blue"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Any Active Blockers?</label>
                <input
                  type="text"
                  value={progressBlockers}
                  onChange={(e) => setProgressBlockers(e.target.value)}
                  placeholder="e.g. Rain shower, traffic jam, underground conduit"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProgressModal(false)}
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

      {/* QUICK ACTION MODAL: Request Materials */}
      {showMaterialModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <ClipboardList className="w-5 h-5 text-amber-600" />
                <span>Request Additional Materials</span>
              </h3>
              <button onClick={() => setShowMaterialModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
            </div>

            <form onSubmit={handleMaterialRequestSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Work Order *</label>
                <select
                  value={selectedWO}
                  onChange={(e) => setSelectedWO(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                  required
                >
                  {myWorkOrders.map((wo) => (
                    <option key={wo.id} value={wo.id}>
                      {wo.id} - {wo.complaintTitle.substring(0, 45)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Material Name *</label>
                <input
                  type="text"
                  value={matName}
                  onChange={(e) => setMatName(e.target.value)}
                  placeholder="e.g. Cold-Mix Asphalt Bags (50kg), LED Luminaire 65W"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={matQty}
                    onChange={(e) => setMatQty(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit</label>
                  <select
                    value={matUnit}
                    onChange={(e) => setMatUnit(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  >
                    <option value="Bags">Bags</option>
                    <option value="Units">Units</option>
                    <option value="Pipes">Pipes</option>
                    <option value="Sets">Sets</option>
                    <option value="Sacks">Sacks</option>
                    <option value="Meters">Meters</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Requisition Priority</label>
                <select
                  value={matPriority}
                  onChange={(e) => setMatPriority(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High (Urgent)</option>
                  <option value="CRITICAL">Critical Emergency</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason / Shortage Details</label>
                <textarea
                  value={matReason}
                  onChange={(e) => setMatReason(e.target.value)}
                  rows={2}
                  placeholder="e.g. Unforeseen crater depth requiring additional patching asphalt"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMaterialModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

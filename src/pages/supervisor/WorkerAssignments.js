import React, { useState, useMemo } from 'react';
import {
  Users,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlayCircle,
  Phone,
  Edit2,
  Trash2,
  Calendar,
  Briefcase,
  Layers,
  ChevronRight,
  Shield,
  RotateCcw,
} from 'lucide-react';
import { useCivic } from '../../context/CivicContext';

export function WorkerAssignments() {
  const {
    workers,
    workerTasks,
    workOrders,
    addWorkerTask,
    updateWorkerTask,
    deleteWorkerTask,
    supervisorProfile,
  } = useCivic();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [woFilter, setWoFilter] = useState('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Add Task Form State
  const [newWO, setNewWO] = useState(workOrders[0]?.id || '');
  const [newWorkerId, setNewWorkerId] = useState(workers[0]?.id || '');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newDeadline, setNewDeadline] = useState('2026-10-25');

  // Edit Task Form State
  const [editWorkerId, setEditWorkerId] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editProgress, setEditProgress] = useState(0);
  const [editStatus, setEditStatus] = useState('In Progress');
  const [editDelayReason, setEditDelayReason] = useState('');

  // Active supervisor work orders
  const myWorkOrders = useMemo(() => {
    return workOrders.filter(
      (w) => !w.supervisor || w.supervisor.toLowerCase().includes('rao') || w.supervisor.toLowerCase().includes('supervisor')
    );
  }, [workOrders]);

  const filteredTasks = useMemo(() => {
    return workerTasks.filter((t) => {
      const matchSearch =
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.taskDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.workOrderId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchWO = woFilter === 'ALL' || t.workOrderId === woFilter;

      return matchSearch && matchStatus && matchWO;
    });
  }, [workerTasks, searchTerm, statusFilter, woFilter]);

  // Open Edit Modal
  const handleOpenEdit = (task) => {
    setEditingTask(task);
    setEditWorkerId(task.workerId);
    setEditDesc(task.taskDescription);
    setEditDeadline(task.deadline);
    setEditProgress(task.progress || 0);
    setEditStatus(task.status || 'Not Started');
    setEditDelayReason(task.delayReason || '');
  };

  // Submit Add Task
  const handleAddTaskSubmit = (e) => {
    e.preventDefault();
    if (!newWO || !newWorkerId || !newTaskDesc.trim()) {
      alert('Please fill out all task details.');
      return;
    }
    const targetWO = workOrders.find((w) => w.id === newWO);
    addWorkerTask({
      workOrderId: newWO,
      complaintId: targetWO?.complaintId,
      workerId: newWorkerId,
      taskDescription: newTaskDesc.trim(),
      deadline: newDeadline,
    });
    setShowAddModal(false);
    setNewTaskDesc('');
    alert('New sub-task assigned to field specialist!');
  };

  // Submit Edit Task
  const handleEditTaskSubmit = (e) => {
    e.preventDefault();
    if (!editingTask) return;
    updateWorkerTask(editingTask.id, {
      workerId: editWorkerId,
      taskDescription: editDesc,
      deadline: editDeadline,
      progress: parseInt(editProgress) || 0,
      status: editStatus,
      delayReason: editStatus === 'Blocked' ? editDelayReason : '',
    });
    setEditingTask(null);
    alert('Task assignment updated!');
  };

  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-civic-text flex items-center space-x-2">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>Worker Task Assignments</span>
          </h2>
          <p className="text-xs text-civic-muted mt-0.5">
            Manage field repair specialists, decompose work orders into granular sub-tasks, schedule deadlines, and monitor task status.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Sub-Task</span>
        </button>
      </div>

      {/* Field Specialist Roster Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Active Field Specialists Roster ({workers.length} Personnel)
          </h3>
          <span className="text-[11px] text-slate-400">Department: {supervisorProfile.department}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workers.map((w) => {
            const assignedCount = workerTasks.filter(
              (t) => t.workerId === w.id && t.status !== 'Completed'
            ).length;

            return (
              <div
                key={w.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-indigo-300 transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={w.avatar}
                      alt={w.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-50"
                    />
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{w.name}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">{w.role}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      w.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {w.status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {w.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{w.phone}</span>
                  </span>
                  <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {assignedCount} Active {assignedCount === 1 ? 'Task' : 'Tasks'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Filters & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search task ID, worker, description..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status filter pills */}
          <div className="flex items-center space-x-1 overflow-x-auto text-xs">
            {['ALL', 'Not Started', 'In Progress', 'Completed', 'Blocked'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-colors whitespace-nowrap text-[11px] ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Work order filter */}
          <select
            value={woFilter}
            onChange={(e) => setWoFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="ALL">All Work Orders</option>
            {myWorkOrders.map((wo) => (
              <option key={wo.id} value={wo.id}>
                {wo.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Worker Tasks Table (Section 8) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-4 px-4">Task ID</th>
                <th className="py-4 px-4">Assigned Worker</th>
                <th className="py-4 px-4">Work Order</th>
                <th className="py-4 px-4">Task Description</th>
                <th className="py-4 px-4">Assigned Date</th>
                <th className="py-4 px-4">Deadline</th>
                <th className="py-4 px-4">Progress</th>
                <th className="py-4 px-4">Task Status</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No worker task assignments found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {task.id}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{task.workerName}</p>
                      <p className="text-[10px] text-slate-500">{task.workerRole}</p>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-civic-blue">
                      #{task.workOrderId}
                    </td>

                    <td className="py-3.5 px-4 max-w-sm">
                      <p className="text-slate-800 leading-snug">{task.taskDescription}</p>
                      {task.status === 'Blocked' && task.delayReason && (
                        <p className="text-[10px] text-rose-600 font-medium mt-1 bg-rose-50 p-1.5 rounded-lg border border-rose-100">
                          <strong>Blocker:</strong> {task.delayReason}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {task.assignedDate}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      {task.deadline}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="w-20 space-y-1">
                        <span className="font-bold text-[11px] block">{task.progress}%</span>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              task.progress === 100
                                ? 'bg-emerald-500'
                                : task.status === 'Blocked'
                                ? 'bg-rose-500'
                                : 'bg-indigo-600'
                            }`}
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          task.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : task.status === 'Blocked'
                            ? 'bg-rose-100 text-rose-800'
                            : task.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {task.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(task)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                          title="Edit Task & Reassign"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete task #${task.id}?`)) {
                              deleteWorkerTask(task.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 className="w-4 h-4" />
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
      {/* MODAL: CREATE NEW SUB-TASK                           */}
      {/* ==================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-indigo-600" />
                <span>Create Worker Sub-Task</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleAddTaskSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Work Order *</label>
                <select
                  value={newWO}
                  onChange={(e) => setNewWO(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-indigo-600"
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
                <label className="font-bold text-slate-700 block mb-1">Assign to Specialist *</label>
                <select
                  value={newWorkerId}
                  onChange={(e) => setNewWorkerId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-indigo-600"
                  required
                >
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.role}) - {w.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Sub-Task Description *</label>
                <textarea
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  rows={3}
                  placeholder="e.g. Excavate pavement around cracked pipe collar and level sub-base"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Deadline</label>
                <input
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: EDIT WORKER ASSIGNMENT & STATUS               */}
      {/* ==================================================== */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                  {editingTask.id}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Edit Task & Progress
                </h3>
              </div>
              <button onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleEditTaskSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Reassign Worker</label>
                <select
                  value={editWorkerId}
                  onChange={(e) => setEditWorkerId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-indigo-600"
                >
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Task Instructions</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Task Status *</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Deadline Date</label>
                  <input
                    type="date"
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Sub-Task Progress Percentage</label>
                  <span className="font-extrabold text-indigo-600 text-xs">{editProgress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={editProgress}
                  onChange={(e) => setEditProgress(e.target.value)}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {editStatus === 'Blocked' && (
                <div className="space-y-1 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <label className="font-bold text-rose-800 block">Reason for Block / Delay *</label>
                  <textarea
                    value={editDelayReason}
                    onChange={(e) => setEditDelayReason(e.target.value)}
                    rows={2}
                    placeholder="Specify obstacle (e.g. Utility pipe interference, rain, missing materials)..."
                    className="w-full p-2 rounded-lg border border-rose-300 text-xs focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md"
                >
                  Update Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

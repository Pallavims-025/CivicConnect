import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowDownLeft,
  Calendar,
  Building,
  Check,
  Package,
} from 'lucide-react';
import { useCivic } from '../../context/CivicContext';
import { PriorityBadge } from '../../components/common/StatusBadge';

export function MaterialRequests() {
  const {
    materialRequests,
    workOrders,
    inventory,
    submitSupervisorMaterialRequest,
    receiveMaterialSupplies,
    supervisorProfile,
  } = useCivic();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [isUrgentShortage, setIsUrgentShortage] = useState(false);

  // Form Fields (Section 12)
  const [reqWO, setReqWO] = useState(workOrders[0]?.id || '');
  const [reqMatName, setReqMatName] = useState('');
  const [reqQty, setReqQty] = useState('');
  const [reqUnit, setReqUnit] = useState('Bags');
  const [reqPriority, setReqPriority] = useState('MEDIUM');
  const [reqReason, setReqReason] = useState('');
  const [reqShortageDesc, setReqShortageDesc] = useState('');
  const [reqAdditionalNotes, setReqAdditionalNotes] = useState('');

  // Active supervisor work orders
  const myWorkOrders = useMemo(() => {
    return workOrders.filter(
      (w) => !w.supervisor || w.supervisor.toLowerCase().includes('rao') || w.supervisor.toLowerCase().includes('supervisor')
    );
  }, [workOrders]);

  const filteredRequests = useMemo(() => {
    return materialRequests.filter((r) => {
      const matchSearch =
        r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.workOrderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.materialName && r.materialName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.reason && r.reason.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'ALL' || r.status.toUpperCase() === statusFilter.toUpperCase();
      return matchSearch && matchStatus;
    });
  }, [materialRequests, searchTerm, statusFilter]);

  // Open modal with urgent shortage preset
  const handleOpenUrgentShortage = () => {
    setIsUrgentShortage(true);
    setReqPriority('CRITICAL');
    setReqReason('Critical stockout on site halting emergency repair progress');
    setReqShortageDesc('Ward buffer depleted; urgent central dispatch required');
    setShowNewModal(true);
  };

  const handleOpenStandard = () => {
    setIsUrgentShortage(false);
    setReqPriority('MEDIUM');
    setReqReason('');
    setReqShortageDesc('');
    setShowNewModal(true);
  };

  // Submit Request
  const handleSubmitRequest = (e) => {
    e.preventDefault();
    if (!reqWO || !reqMatName.trim() || !reqQty) {
      alert('Please fill out all required requisition fields.');
      return;
    }

    const targetWO = workOrders.find((w) => w.id === reqWO);

    submitSupervisorMaterialRequest({
      workOrderId: reqWO,
      complaintId: targetWO?.complaintId,
      materialName: reqMatName.trim(),
      requestedQty: reqQty,
      unit: reqUnit,
      priority: isUrgentShortage ? 'CRITICAL' : reqPriority,
      reason: reqReason.trim(),
      shortageDescription: reqShortageDesc.trim(),
      additionalNotes: reqAdditionalNotes.trim(),
    });

    setShowNewModal(false);
    setReqMatName('');
    setReqQty('');
    setReqReason('');
    setReqShortageDesc('');
    setReqAdditionalNotes('');
    alert('Material requisition submitted! This requisition now appears in the Municipal Officer Dashboard.');
  };

  // Receive Supplies into Site Inventory
  const handleReceiveSupplies = (requestId) => {
    try {
      receiveMaterialSupplies(requestId);
      alert('Supplies received! Site inventory updated with approved materials.');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-civic-text flex items-center space-x-2">
            <ClipboardList className="w-6 h-6 text-amber-600" />
            <span>Material Requests & Shortage Reports</span>
          </h2>
          <p className="text-xs text-civic-muted mt-0.5">
            Submit material requisitions to Municipal Officers, report critical site shortages, and record incoming supply receipts.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleOpenUrgentShortage}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Report Urgent Shortage</span>
          </button>

          <button
            onClick={handleOpenStandard}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-civic-blue hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Material Requisition</span>
          </button>
        </div>
      </div>

      {/* Sync Policy Info Box (Section 12) */}
      <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start space-x-3">
        <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <p className="font-bold">Inventory Sync Policy:</p>
          <p className="text-amber-800">
            Every submitted request appears immediately in the Municipal Officer Dashboard. Stock is <strong>not</strong> increased simply upon submission or approval.
            Site inventory is incremented only when you click <strong>"Record Received Supplies"</strong> after actual delivery to the job site.
          </p>
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
            placeholder="Search request ID, work order, material..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Status filter pills (Section 12 statuses) */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto text-xs">
          {['ALL', 'Pending Approval', 'Approved', 'Rejected', 'Fulfilled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors whitespace-nowrap text-[11px] ${
                statusFilter === st
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Material Requests History Table (Section 12) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-4 px-4">Request ID</th>
                <th className="py-4 px-4">Work Order / Complaint</th>
                <th className="py-4 px-4">Material Name</th>
                <th className="py-4 px-4 text-center">Requested Qty</th>
                <th className="py-4 px-4 text-center">Approved Qty</th>
                <th className="py-4 px-4">Priority</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Officer Remarks</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No material requests found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const isApproved = req.status.toLowerCase() === 'approved';
                  const isPending = req.status.toLowerCase().includes('pending');
                  const isRejected = req.status.toLowerCase() === 'rejected';
                  const isFulfilled = req.status.toLowerCase() === 'fulfilled' || req.status.toLowerCase() === 'issued';

                  const approvedQty = req.approvedQty !== undefined ? req.approvedQty : (isApproved ? req.requestedQty : 0);

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {req.id}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {req.requestDate?.split(' ')[0]}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-semibold text-civic-blue block">
                          #{req.workOrderId}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          #{req.complaintId}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-bold text-slate-900">{req.materialName}</p>
                        <p className="text-[11px] text-slate-500 truncate">{req.reason}</p>
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {req.requestedQty} {req.unit}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-extrabold ${
                            approvedQty > 0 ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          {approvedQty} {req.unit}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <PriorityBadge priority={req.priority} />
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800'
                              : isPending
                              ? 'bg-amber-100 text-amber-800'
                              : isRejected
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs text-slate-600 text-[11px]">
                        {req.decisionNotes ? (
                          <span className="italic">"{req.decisionNotes}"</span>
                        ) : (
                          <span className="text-slate-400 italic">Pending officer review</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isApproved && (
                          <button
                            onClick={() => handleReceiveSupplies(req.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs flex items-center space-x-1 ml-auto"
                            title="Acknowledge Delivery and Add to Site Inventory"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            <span>Record Received</span>
                          </button>
                        )}

                        {isFulfilled && (
                          <span className="text-[11px] text-emerald-600 font-bold flex items-center justify-end space-x-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>Received in Site Stock</span>
                          </span>
                        )}

                        {isPending && (
                          <span className="text-[11px] text-amber-600 font-semibold italic">
                            Awaiting Dispatch
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================================================== */}
      {/* MODAL: SUBMIT MATERIAL REQUEST / URGENT SHORTAGE     */}
      {/* ==================================================== */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                {isUrgentShortage ? (
                  <>
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    <span className="text-rose-700">Report Urgent Material Shortage</span>
                  </>
                ) : (
                  <>
                    <ClipboardList className="w-5 h-5 text-amber-600" />
                    <span>Material Requisition Form</span>
                  </>
                )}
              </h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Work Order *</label>
                <select
                  value={reqWO}
                  onChange={(e) => setReqWO(e.target.value)}
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
                  value={reqMatName}
                  onChange={(e) => setReqMatName(e.target.value)}
                  placeholder="e.g. Cold-Mix Asphalt Bags (50kg), Ductile Iron Sleeve 110mm"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Requested Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={reqQty}
                    onChange={(e) => setReqQty(e.target.value)}
                    placeholder="e.g. 15"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit of Measurement</label>
                  <select
                    value={reqUnit}
                    onChange={(e) => setReqUnit(e.target.value)}
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
                  value={reqPriority}
                  onChange={(e) => setReqPriority(e.target.value)}
                  disabled={isUrgentShortage}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold disabled:bg-slate-100"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High (Urgent)</option>
                  <option value="CRITICAL">Critical Emergency</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Shortage Description *</label>
                <input
                  type="text"
                  value={reqShortageDesc}
                  onChange={(e) => setReqShortageDesc(e.target.value)}
                  placeholder="e.g. Ward emergency reserves empty; site work at risk of delay"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Justification / Work Reason *</label>
                <textarea
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  rows={2}
                  placeholder="Explain why this material is required for the repair..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Additional Notes</label>
                <input
                  type="text"
                  value={reqAdditionalNotes}
                  onChange={(e) => setReqAdditionalNotes(e.target.value)}
                  placeholder="e.g. Deliver before 08:30 AM tomorrow for morning compaction"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-white font-bold shadow-md ${
                    isUrgentShortage ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {isUrgentShortage ? 'Transmit Urgent Shortage' : 'Submit Requisition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

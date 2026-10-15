import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Calendar,
  User,
  ShieldCheck,
  Building,
  Image as ImageIcon,
} from 'lucide-react';
import { useCivic } from '../../context/CivicContext';

export function RepairVerification() {
  const { verifications, verifyRepair } = useCivic();

  const [selectedVerif, setSelectedVerif] = useState(null);
  const [decision, setDecision] = useState('APPROVED'); // 'APPROVED' | 'REWORK'
  const [remarks, setRemarks] = useState('Field repair verified and asphalt compaction meets quality standards.');

  const handleDecisionSubmit = (e) => {
    e.preventDefault();
    if (!selectedVerif) return;
    verifyRepair(selectedVerif.id, decision, remarks);
    setSelectedVerif(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-extrabold text-civic-text flex items-center space-x-2">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          <span>Field Repair Quality Verification</span>
        </h2>
        <p className="text-xs text-civic-muted">
          Review evidence photos submitted by field supervisors. Approving transitions the complaint to "Resolved" and notifies the citizen for rating.
        </p>
      </div>

      {/* Verification Cards */}
      <div className="space-y-6">
        {verifications.map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-3xl p-6 md:p-8 border shadow-xs space-y-6 ${
              item.status === 'VERIFIED_APPROVED'
                ? 'border-emerald-200 bg-emerald-50/10'
                : item.status === 'REWORK_REQUESTED'
                ? 'border-rose-200 bg-rose-50/10'
                : 'border-slate-200'
            }`}
          >
            {/* Top metadata */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">
                  {item.id}
                </span>
                <span className="font-mono text-xs text-civic-blue font-semibold">
                  Complaint: #{item.complaintId}
                </span>
                <span className="font-mono text-xs text-slate-500">
                  WO: #{item.workOrderId}
                </span>
              </div>

              <div>
                {item.status === 'AWAITING_VERIFICATION' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    Awaiting Officer Inspection
                  </span>
                )}
                {item.status === 'VERIFIED_APPROVED' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Quality Approved & Resolved</span>
                  </span>
                )}
                {item.status === 'REWORK_REQUESTED' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 flex items-center space-x-1">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Rework Instructed to Field Crew</span>
                  </span>
                )}
              </div>
            </div>

            {/* Complaint Header */}
            <div>
              <h3 className="text-base font-bold text-slate-900">{item.complaintTitle}</h3>
              <div className="flex flex-wrap items-center gap-x-4 text-xs text-slate-500 mt-1">
                <span>Department: <strong className="text-slate-700">{item.department}</strong></span>
                <span>Supervisor: <strong className="text-slate-700">{item.supervisor}</strong></span>
                <span>Submitted: <strong className="text-slate-700">{item.submittedAt}</strong></span>
              </div>
            </div>

            {/* Before vs After Photos Side by Side */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Original Hazard Photo (Before)
                </span>
                <div className="rounded-2xl overflow-hidden aspect-video border border-slate-200 bg-slate-100">
                  <img
                    src={item.beforePhoto}
                    alt="Before Repair"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                  Field Completion Photo (After Repair)
                </span>
                <div className="rounded-2xl overflow-hidden aspect-video border border-emerald-300 bg-slate-100">
                  <img
                    src={item.completionPhoto}
                    alt="After Repair"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Field Supervisor Completion Notes */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-800 block mb-1">
                Supervisor Completion Notes:
              </span>
              <p className="text-slate-600">{item.completionDetails}</p>
            </div>

            {/* Officer Remarks if completed */}
            {item.officerRemarks && (
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-xs text-emerald-950">
                <span className="font-bold block mb-1">Municipal Engineer Review Remarks:</span>
                <p>{item.officerRemarks}</p>
              </div>
            )}

            {/* Actions */}
            {item.status === 'AWAITING_VERIFICATION' && (
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setSelectedVerif(item);
                    setDecision('REWORK');
                    setRemarks('Repair surface uneven. Please re-compact asphalt and clean edge gravel.');
                  }}
                  className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-xl text-xs transition-colors flex items-center space-x-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Request Crew Rework</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedVerif(item);
                    setDecision('APPROVED');
                    setRemarks('Field repair verified and asphalt compaction meets quality standards.');
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Mark Resolved</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Verification Decision Modal */}
      {selectedVerif && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              {decision === 'APPROVED' ? 'Approve Repair & Close Complaint' : 'Request Rework from Field Crew'}
            </h3>
            <p className="text-xs text-slate-500">
              {decision === 'APPROVED'
                ? `Complaint #${selectedVerif.complaintId} will be marked RESOLVED and citizen ${selectedVerif.citizenName || 'reporting user'} will be prompted for feedback.`
                : `Work Order #${selectedVerif.workOrderId} will be set to REWORK REQUIRED.`}
            </p>

            <form onSubmit={handleDecisionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Engineer Verification Remarks
                </label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedVerif(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-white font-bold ${
                    decision === 'APPROVED'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Confirm {decision === 'APPROVED' ? 'Approval' : 'Rework Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import {
  Copy,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MapPin,
  Calendar,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { useCivic } from '../../context/CivicContext';

export function DuplicateDetection() {
  const { duplicates, confirmDuplicate, dismissDuplicate } = useCivic();

  const [confirmModalItem, setConfirmModalItem] = useState(null);
  const [reason, setReason] = useState('Identical geographic location and visual issue reported within 24 hours.');

  const handleConfirmSubmit = (e) => {
    e.preventDefault();
    if (!confirmModalItem) return;
    confirmDuplicate(confirmModalItem.id, reason);
    setConfirmModalItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-extrabold text-civic-text flex items-center space-x-2">
          <Copy className="w-6 h-6 text-purple-600" />
          <span>AI-Powered Duplicate Detection</span>
        </h2>
        <p className="text-xs text-civic-muted">
          Identify overlapping civic complaints reported by multiple citizens in the same ward to prevent duplicated work orders.
        </p>
      </div>

      {/* Methodology Banner */}
      <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-4 text-xs text-purple-900 flex items-start space-x-3">
        <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Algorithmic Match Engine (Simulation):</span> Candidates are flagged
          using proximity radius (under 50 meters) and perceptual image similarity analysis. Confirming a match links the secondary report to the primary work order.
        </div>
      </div>

      {/* Candidate Cards */}
      <div className="space-y-6">
        {duplicates.map((dup) => (
          <div
            key={dup.id}
            className={`bg-white rounded-3xl p-6 md:p-8 border shadow-xs transition-all ${
              dup.reviewStatus === 'CONFIRMED_DUPLICATE'
                ? 'border-emerald-200 bg-emerald-50/20'
                : dup.reviewStatus === 'DISMISSED'
                ? 'border-slate-200 opacity-60'
                : 'border-purple-200'
            }`}
          >
            {/* Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center space-x-3">
                <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                  {dup.id}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Method: <strong className="text-slate-800">{dup.matchType}</strong>
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1.5 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">
                  <span>Match Confidence:</span>
                  <span className="text-sm font-extrabold">{dup.similarityScore}%</span>
                </div>

                {dup.reviewStatus === 'PENDING_REVIEW' && (
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full">
                    Awaiting Officer Review
                  </span>
                )}
                {dup.reviewStatus === 'CONFIRMED_DUPLICATE' && (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirmed Duplicate</span>
                  </span>
                )}
                {dup.reviewStatus === 'DISMISSED' && (
                  <span className="px-2.5 py-1 bg-slate-200 text-slate-700 text-[11px] font-bold rounded-full">
                    Dismissed (Unique Issue)
                  </span>
                )}
              </div>
            </div>

            {/* Side by Side Comparison Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Original Complaint (Primary) */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Primary Report (Original)
                  </span>
                  <span className="font-mono font-bold text-xs text-civic-blue">
                    {dup.originalComplaintId}
                  </span>
                </div>

                <div className="aspect-video rounded-xl overflow-hidden bg-slate-200 border border-slate-200">
                  <img
                    src={dup.originalPhoto}
                    alt="Original issue"
                    className="w-full h-full object-cover"
                  />
                </div>

                <h4 className="font-bold text-sm text-slate-900">{dup.originalTitle}</h4>
                <div className="text-xs text-slate-600 space-y-1">
                  <p className="flex items-center">
                    <MapPin className="w-3.5 h-3.5 text-civic-blue mr-1 shrink-0" />
                    <span className="truncate">{dup.originalLocation}</span>
                  </p>
                  <p className="flex items-center text-slate-400">
                    <Calendar className="w-3.5 h-3.5 mr-1 shrink-0" />
                    <span>{dup.originalDate}</span>
                  </p>
                </div>
              </div>

              {/* Suspected Duplicate */}
              <div className="bg-purple-50/40 p-5 rounded-2xl border border-purple-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                    Suspected Duplicate Report
                  </span>
                  <span className="font-mono font-bold text-xs text-purple-700">
                    {dup.suspectedComplaintId}
                  </span>
                </div>

                <div className="aspect-video rounded-xl overflow-hidden bg-slate-200 border border-purple-200">
                  <img
                    src={dup.suspectedPhoto}
                    alt="Suspected duplicate"
                    className="w-full h-full object-cover"
                  />
                </div>

                <h4 className="font-bold text-sm text-slate-900">{dup.suspectedTitle}</h4>
                <div className="text-xs text-slate-600 space-y-1">
                  <p className="flex items-center">
                    <MapPin className="w-3.5 h-3.5 text-purple-600 mr-1 shrink-0" />
                    <span className="truncate">{dup.suspectedLocation}</span>
                  </p>
                  <p className="flex items-center text-slate-400">
                    <Calendar className="w-3.5 h-3.5 mr-1 shrink-0" />
                    <span>{dup.suspectedDate}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Confirmation Reason Note if confirmed */}
            {dup.reviewReason && (
              <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                <strong>Officer Review Note:</strong> {dup.reviewReason}
              </div>
            )}

            {/* Action Buttons */}
            {dup.reviewStatus === 'PENDING_REVIEW' && (
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  onClick={() => dismissDuplicate(dup.id)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Dismiss Match (Not a Duplicate)
                </button>
                <button
                  onClick={() => setConfirmModalItem(dup)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-colors shadow-sm flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Duplicate & Link</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {confirmModalItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              Confirm Duplicate & Link Records
            </h3>
            <p className="text-xs text-slate-500">
              Complaint #{confirmModalItem.suspectedComplaintId} will be merged into #{confirmModalItem.originalComplaintId}. The citizen will receive status updates from the primary work order.
            </p>

            <form onSubmit={handleConfirmSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Officer Review Reason
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-600 outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setConfirmModalItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                >
                  Confirm & Merge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Tag,
  Star,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ShieldAlert,
  User,
  Wrench,
  ExternalLink,
} from 'lucide-react';
import { useCivic } from '../../context/CivicContext';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';

export function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { complaints, submitFeedback, workOrders } = useCivic();

  const complaint = complaints.find((c) => c.id === id);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  if (!complaint) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Complaint Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          The requested complaint identifier "{id}" does not exist in the system.
        </p>
        <button
          onClick={() => navigate('/citizen/complaints')}
          className="px-4 py-2 bg-civic-blue text-white rounded-xl text-xs font-semibold"
        >
          Back to My Complaints
        </button>
      </div>
    );
  }

  const linkedWorkOrder = workOrders.find((w) => w.id === complaint.workOrderId);

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      alert('Please add a brief comment on the resolution quality.');
      return;
    }
    submitFeedback(complaint.id, rating, comment);
    setFeedbackSuccess(true);
    setShowFeedbackModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-600 hover:text-civic-blue transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Complaints</span>
        </button>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Tracking Reference:</span>
          <span className="font-mono font-bold text-xs bg-slate-100 text-civic-blue px-2.5 py-1 rounded-lg">
            {complaint.id}
          </span>
        </div>
      </div>

      {/* Main Details Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                <Tag className="w-3 h-3 mr-1 text-slate-400" />
                {complaint.category}
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 leading-snug">
              {complaint.title}
            </h2>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
              <span className="flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Reported: {complaint.reportedDate}
              </span>
              <span className="flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Last Update: {complaint.lastUpdated}
              </span>
              <span className="flex items-center text-slate-700 font-medium">
                <MapPin className="w-3.5 h-3.5 mr-1 text-civic-blue" />
                {complaint.address}
              </span>
            </div>
          </div>

          {complaint.status === 'RESOLVED' && !complaint.feedback && (
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md self-start"
            >
              <Star className="w-4 h-4 fill-current" />
              <span>Rate Resolution</span>
            </button>
          )}
        </div>

        {/* Description */}
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            Description of Public Hazard
          </h3>
          <p className="text-xs md:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
            {complaint.description}
          </p>
        </div>

        {/* Evidence Photos */}
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            Initial Evidence Photos ({complaint.photos?.length || 0})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {complaint.photos?.map((photoUrl, idx) => (
              <div
                key={idx}
                className="rounded-2xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 group relative"
              >
                <img
                  src={photoUrl}
                  alt={`Evidence ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-[10px] text-white font-medium">
                  Evidence Photo #{idx + 1}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Resolution Evidence (If resolved) */}
        {complaint.resolutionEvidence && complaint.resolutionEvidence.length > 0 && (
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Municipal Repair Verification Evidence</span>
            </h3>
            <p className="text-xs text-emerald-800 mb-3">
              Inspected and verified by Municipal Field Engineering.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {complaint.resolutionEvidence.map((photo, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-emerald-300 aspect-video">
                  <img src={photo} alt="Resolution" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feedback Section if already submitted */}
        {complaint.feedback && (
          <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-900 flex items-center space-x-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Your Citizen Feedback</span>
              </span>
              <span className="text-[11px] text-slate-500">
                Submitted {complaint.feedback.submittedAt}
              </span>
            </div>
            <div className="flex items-center space-x-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= complaint.feedback.rating
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate-200'
                  }`}
                />
              ))}
              <span className="text-xs font-bold text-slate-700 ml-2">
                {complaint.feedback.rating} / 5 Stars
              </span>
            </div>
            <p className="text-xs text-slate-700 italic">
              "{complaint.feedback.comment}"
            </p>
          </div>
        )}

        {/* Status Timeline */}
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
            Official Resolution Timeline
          </h3>
          <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
            {complaint.timeline.map((event, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-white border-4 border-civic-blue"></div>
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{event.title}</span>
                    <span className="text-[11px] text-slate-400">• {event.date}</span>
                    {event.by && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                        By: {event.by}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Rate Complaint Resolution
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              How satisfied are you with the municipal repair for #{complaint.id}?
            </p>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Rating (1 to 5 Stars)
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-600 ml-2">
                    {rating} of 5
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Comments & Feedback
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details on promptness, cleanliness, or suggestions..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-civic-blue outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

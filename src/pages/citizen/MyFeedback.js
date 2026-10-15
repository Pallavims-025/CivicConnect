import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star,
  MessageSquare,
  CheckCircle2,
  Calendar,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useCivic } from '../../context/CivicContext';

export function MyFeedback() {
  const navigate = useNavigate();
  const { complaints, submitFeedback, citizenProfile } = useCivic();

  // Find resolved complaints that belong to this citizen
  const myComplaints = complaints.filter(
    (c) => c.citizenId === citizenProfile.id || c.citizenName === citizenProfile.name
  );
  const resolvedUnrated = myComplaints.filter(
    (c) => c.status === 'RESOLVED' && !c.feedback
  );
  const previouslyRated = myComplaints.filter((c) => c.feedback);

  const [selectedComplaintId, setSelectedComplaintId] = useState(
    resolvedUnrated.length > 0 ? resolvedUnrated[0].id : ''
  );
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [successMessage, setSuccessMessage] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedComplaintId) {
      alert('Please select an eligible resolved complaint to rate.');
      return;
    }
    if (!comment.trim()) {
      alert('Please provide feedback comments.');
      return;
    }

    submitFeedback(selectedComplaintId, rating, comment);
    setSuccessMessage(true);
    setComment('');
    setTimeout(() => setSuccessMessage(false), 4000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-extrabold text-civic-text">
          My Feedback & Ratings
        </h2>
        <p className="text-xs text-civic-muted">
          Your reviews hold municipal departments accountable and drive quality civic infrastructure repairs.
        </p>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            Thank you! Your feedback has been recorded and submitted to municipal officers for contractor evaluation.
          </span>
        </div>
      )}

      {/* Form: Rate a resolved complaint */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center space-x-2">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          <span>Rate a Resolved Complaint</span>
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Complaints can only be rated once municipal engineering teams mark them as Resolved.
        </p>

        {resolvedUnrated.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">All resolved complaints have been rated!</p>
            <p className="mt-1">
              When another of your pending or in-progress issues is marked resolved, it will appear here for feedback.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Select Resolved Complaint
              </label>
              <select
                value={selectedComplaintId}
                onChange={(e) => setSelectedComplaintId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-civic-blue outline-hidden bg-white"
              >
                {resolvedUnrated.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.id} — {c.title} ({c.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Resolution Quality Rating
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
                  {rating} of 5 Stars
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Comments on Workmanship & Timeliness
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Was the repair neat? Did the field crew leave debris behind? How was the speed of resolution?"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-civic-blue outline-hidden"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-civic-blue hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
            >
              Submit Feedback
            </button>
          </form>
        )}
      </div>

      {/* Previously Submitted Feedback */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-civic-blue" />
          <span>Previously Submitted Feedback ({previouslyRated.length})</span>
        </h3>

        {previouslyRated.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No feedback submitted yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {previouslyRated.map((c) => (
              <div
                key={c.id}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2 hover:border-blue-200 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-civic-blue">#{c.id}</span>
                  <span className="text-[10px] text-slate-400">{c.feedback.submittedAt}</span>
                </div>
                <p className="font-semibold text-slate-800 line-clamp-1">{c.title}</p>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= c.feedback.rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                  <span className="font-bold text-slate-700 ml-1">
                    {c.feedback.rating} / 5
                  </span>
                </div>
                <p className="text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-100">
                  "{c.feedback.comment}"
                </p>
                <button
                  onClick={() => navigate(`/citizen/complaints/${c.id}`)}
                  className="text-civic-blue font-semibold hover:underline text-[11px] inline-flex items-center space-x-1"
                >
                  <span>View Complaint</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

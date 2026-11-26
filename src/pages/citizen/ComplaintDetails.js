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
import { DEFAULT_PHOTO_LOCATION_THRESHOLD_METRES } from '../../../shared/photoLocation.js';
import { retryComplaintPhotoVerification } from '../../services/api';

export function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { complaints, submitFeedback, workOrders, syncPersistedComplaints } = useCivic();

  const complaint = complaints.find((c) => c.id === id);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [retryFiles, setRetryFiles] = useState([]);
  const [retryBusy, setRetryBusy] = useState(false);
  const [retryError, setRetryError] = useState('');
  const [retrySuccess, setRetrySuccess] = useState('');

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
  const hasVerifiedPhoto = complaint.photoLocationEvidence?.some((photo) => photo.locationVerificationStatus === 'VERIFIED');

  const handleRetryPhotoVerification = async (event) => {
    event.preventDefault();
    if (!retryFiles.length || retryBusy) return;
    setRetryBusy(true);
    setRetryError('');
    setRetrySuccess('');
    try {
      const photos = await Promise.all(retryFiles.map((file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ imageUrl: reader.result, photoSource: 'GALLERY' });
        reader.onerror = () => reject(new Error('A selected photograph could not be read.'));
        reader.readAsDataURL(file);
      })));
      const updated = await retryComplaintPhotoVerification(complaint.databaseId || complaint.id, photos);
      syncPersistedComplaints([
        ...complaints.filter((item) => (item.databaseId || item.id) !== (updated.databaseId || updated.id)),
        updated,
      ]);
      setRetryFiles([]);
      setRetrySuccess(updated.photoLocationEvidence?.some((photo) => photo.locationVerificationStatus === 'VERIFIED')
        ? 'A photograph passed location verification. The complaint is now available to the municipal department.'
        : 'The new photograph was checked. Review its result below and upload another corrected photograph if needed.');
    } catch (error) {
      setRetryError(error.details?.photos || error.message || 'The corrected photograph could not be verified.');
    } finally {
      setRetryBusy(false);
    }
  };

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

        {complaint.photoLocationEvidence?.length > 0 && <section className="space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Photo GPS verification</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{complaint.photoLocationEvidence.map((photo, index) => {
            const status = photo.locationVerificationStatus;
            const extractionLabel = photo.locationExtractionMethod === 'EXIF'
              ? 'EXIF metadata'
              : photo.locationExtractionMethod === 'OCR'
                ? 'OCR · visible image stamp (not authenticated camera metadata)'
                : 'No valid coordinates extracted';
            const label = status === 'VERIFIED' ? 'Verified' : status === 'REJECTED_LOCATION_MISMATCH' ? 'REJECTED – LOCATION MISMATCH' : status === 'GPS_COORDINATES_NOT_FOUND' ? 'GPS Coordinates Not Found' : status === 'INVALID_GPS_METADATA' ? 'Invalid GPS Metadata' : status === 'COMPLAINT_LOCATION_NOT_AVAILABLE' ? 'COMPLAINT LOCATION NOT AVAILABLE' : status === 'VERIFICATION_FAILED' ? 'Verification Failed' : 'Verification pending';
            const failureReason = {
              REJECTED_LOCATION_MISMATCH: 'The calculated distance exceeds the 500 metre limit.',
              GPS_COORDINATES_NOT_FOUND: 'Neither EXIF GPS metadata nor a readable GPS stamp was found on the original photograph.',
              INVALID_GPS_METADATA: 'The photograph contains incomplete, malformed, or out-of-range GPS coordinates.',
              COMPLAINT_LOCATION_NOT_AVAILABLE: 'Confirmed complaint coordinates are unavailable.',
              VERIFICATION_FAILED: 'The uploaded image could not be checked for GPS metadata.',
            }[status];
            const style = status === 'VERIFIED' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : status === 'REJECTED_LOCATION_MISMATCH' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-amber-200 bg-amber-50 text-amber-900';
            return <article key={photo.id || index} className="rounded-xl border border-slate-200 p-3 space-y-2">
              <img src={photo.imageUrl} alt={`Verified evidence ${index + 1}`} className="w-full aspect-video rounded-lg object-cover" />
              <span className={`inline-block rounded-full border px-2 py-1 text-[10px] font-bold ${style}`}>{label}</span>
              <p className="text-[11px] text-slate-600">Photo GPS: {Number.isFinite(photo.captureLatitude) && Number.isFinite(photo.captureLongitude) ? `${photo.captureLatitude.toFixed(6)}, ${photo.captureLongitude.toFixed(6)}` : 'Unavailable'}</p>
              <p className="text-[11px] text-slate-600">Extraction method: {extractionLabel}</p>
              <p className="text-[11px] text-slate-600">Confirmed complaint GPS: {Number.isFinite(complaint.latitude) && Number.isFinite(complaint.longitude) ? `${complaint.latitude.toFixed(6)}, ${complaint.longitude.toFixed(6)}` : 'Not available'}</p>
              <p className="text-[11px] text-slate-600">Distance from reported location: {Number.isFinite(photo.locationDistanceMetres) ? `${photo.locationDistanceMetres.toFixed(1)} m` : 'Unavailable'}</p>
              <p className="text-[11px] text-slate-600">Maximum permitted distance: {DEFAULT_PHOTO_LOCATION_THRESHOLD_METRES} m</p>
              {failureReason && <p className="text-[11px] text-slate-700">Reason: {failureReason}</p>}
            </article>;
          })}</div>
        </section>}

        {!hasVerifiedPhoto && <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-amber-950">Municipal review requires a verified photograph</h3>
            <p className="mt-1 text-xs text-amber-900">Your complaint and history are saved. Upload a corrected original photo with EXIF GPS or a readable printed GPS stamp. The server will retry verification against the confirmed complaint location.</p>
          </div>
          <form onSubmit={handleRetryPhotoVerification} className="flex flex-col sm:flex-row sm:items-end gap-3">
            <label className="flex-1 text-xs font-semibold text-slate-700">Corrected photograph(s)
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={(event) => {
                const files = Array.from(event.target.files || []);
                event.target.value = '';
                if (files.length > 5) { setRetryError('Upload up to 5 photographs per attempt.'); return; }
                if (files.some((file) => !file.size || file.size > 5 * 1024 * 1024)) { setRetryError('Each photograph must be 5 MB or smaller.'); return; }
                setRetryError('');
                setRetryFiles(files);
              }} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-xs" />
            </label>
            <button type="submit" disabled={!retryFiles.length || retryBusy} className="rounded-xl bg-civic-blue px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{retryBusy ? 'Checking photograph…' : 'Upload and retry verification'}</button>
          </form>
          {retryFiles.length > 0 && <p className="text-xs text-slate-600">{retryFiles.length} photograph(s) selected.</p>}
          {retryError && <p role="alert" className="text-xs text-rose-700">{retryError}</p>}
          {retrySuccess && <p role="status" className="text-xs text-emerald-800">{retrySuccess}</p>}
        </section>}

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
                    <span className="text-[11px] text-slate-400">â€¢ {event.date}</span>
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

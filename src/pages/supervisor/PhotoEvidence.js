import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  MapPin,
  Clock,
  Trash2,
  Eye,
  FileText,
  ShieldCheck,
  Compass,
  Navigation,
  Image as ImageIcon,
  Check,
  Info,
} from 'lucide-react';
import { useCivic } from '../../context/CivicContext';
import { PriorityBadge, StatusBadge } from '../../components/common/StatusBadge';

export function PhotoEvidence() {
  const navigate = useNavigate();
  const {
    workOrders,
    complaints,
    submitRepairEvidence,
    supervisorProfile,
  } = useCivic();

  // Supervisor work orders
  const myWorkOrders = workOrders.filter(
    (w) => !w.supervisor || w.supervisor.toLowerCase().includes('rao') || w.supervisor.toLowerCase().includes('supervisor')
  );

  const [selectedWOId, setSelectedWOId] = useState(
    myWorkOrders[0]?.id || ''
  );

  const currentWO = myWorkOrders.find((w) => w.id === selectedWOId) || myWorkOrders[0];
  const linkedComplaint = complaints.find((c) => c.id === currentWO?.complaintId);

  // Before Photos State
  const [beforePhotos, setBeforePhotos] = useState([]);
  const [beforeCaption, setBeforeCaption] = useState('Site condition prior to excavation and grading');

  // After Photos State
  const [afterPhotos, setAfterPhotos] = useState([]);
  const [afterNotes, setAfterNotes] = useState('Surface patched with cold-mix asphalt, leveled, and compacted to road grade.');

  // Geolocation & Manual Address State
  const [gpsCoords, setGpsCoords] = useState('12.9784° N, 77.6408° E (CMH Road GPS Tagged)');
  const [manualAddress, setManualAddress] = useState(currentWO?.location || 'Near Metro Pillar 142, CMH Road, Indiranagar');
  const [isCapturingGPS, setIsCapturingGPS] = useState(false);
  const [gpsConfirmed, setGpsConfirmed] = useState(true);

  // File Validation Errors
  const [errorMessage, setErrorMessage] = useState('');
  const [successBanner, setSuccessBanner] = useState(false);

  // Sync state when selected work order changes
  useEffect(() => {
    if (currentWO) {
      setBeforePhotos(currentWO.beforePhotos || []);
      setAfterPhotos(currentWO.afterPhotos || []);
      setManualAddress(currentWO.location || linkedComplaint?.address || '');
      setSuccessBanner(false);
      setErrorMessage('');
    }
  }, [selectedWOId]);

  // Capture Live Browser Geolocation
  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      setGpsCoords('12.9716° N, 77.5946° E (Bengaluru Central)');
      setGpsConfirmed(true);
      return;
    }
    setIsCapturingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setGpsCoords(`${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`);
        setIsCapturingGPS(false);
        setGpsConfirmed(true);
      },
      () => {
        // Fallback default
        setGpsCoords('12.9784° N, 77.6408° E (Indiranagar Ward 14)');
        setIsCapturingGPS(false);
        setGpsConfirmed(true);
      },
      { timeout: 5000 }
    );
  };

  // Validate File (Format & Size < 5MB)
  const validateFile = (file) => {
    const validFormats = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSizeBytes = 5 * 1024 * 1024; // 5 MB

    if (!validFormats.includes(file.type)) {
      setErrorMessage(`Invalid format: ${file.name}. Only JPEG, PNG, or WebP files are allowed.`);
      return false;
    }
    if (file.size > maxSizeBytes) {
      setErrorMessage(`File too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB. Limit is 5MB.`);
      return false;
    }
    setErrorMessage('');
    return true;
  };

  // Mock Upload Handler (simulates file reading into preview URL)
  const handleFileUpload = (e, section) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    for (const file of files) {
      if (!validateFile(file)) return;
    }

    const newPhotoUrls = files.map((file) => URL.createObjectURL(file));

    if (section === 'BEFORE') {
      setBeforePhotos((prev) => [...prev, ...newPhotoUrls]);
    } else {
      setAfterPhotos((prev) => [...prev, ...newPhotoUrls]);
    }
  };

  // Remove Photo
  const handleRemovePhoto = (index, section) => {
    if (section === 'BEFORE') {
      setBeforePhotos((prev) => prev.filter((_, i) => i !== index));
    } else {
      setAfterPhotos((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Submit Evidence for Municipal Officer Verification
  const handleSubmitEvidence = (e) => {
    e.preventDefault();
    if (!afterPhotos.length) {
      setErrorMessage('Please upload at least one After-Repair photograph before submitting for verification.');
      return;
    }

    const success = submitRepairEvidence(currentWO.id, {
      beforePhotos: beforePhotos.length > 0 ? beforePhotos : currentWO.beforePhotos,
      afterPhotos,
      repairNotes: afterNotes,
      gpsCoordinates: gpsCoords,
      manualLocation: manualAddress,
    });

    if (success) {
      setSuccessBanner(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isRework = currentWO?.verificationStatus === 'REWORK_REQUESTED';
  const isAwaiting = currentWO?.verificationStatus === 'AWAITING_VERIFICATION';

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-civic-text flex items-center space-x-2">
            <Camera className="w-6 h-6 text-emerald-600" />
            <span>Before-and-After Photo Evidence</span>
          </h2>
          <p className="text-xs text-civic-muted mt-0.5">
            Photographic proof of repair completion. Submitting transitions the work order to "Awaiting Verification" for Municipal Officer inspection.
          </p>
        </div>
      </div>

      {/* Success Banner */}
      {successBanner && (
        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-5 shadow-sm space-y-2 animate-in fade-in">
          <div className="flex items-center space-x-3 text-emerald-900 font-extrabold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Evidence Submitted to Municipal Officer Verification Queue!</span>
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed pl-8">
            Work Order <strong>#{currentWO.id}</strong> status changed to <strong>AWAITING_VERIFICATION</strong>.
            Er. Rajesh Kumar has been notified to review the side-by-side evidence. The citizen complaint remains safely unresolved until municipal officer signoff.
          </p>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-rose-600 font-bold ml-4">&times;</button>
        </div>
      )}

      {/* Work Order Selector & Overview */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Select Assigned Work Order for Evidence Documentation *
            </label>
            <select
              value={selectedWOId}
              onChange={(e) => setSelectedWOId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-civic-blue bg-white"
            >
              {myWorkOrders.map((wo) => (
                <option key={wo.id} value={wo.id}>
                  {wo.id} - {wo.complaintTitle} [{wo.status}]
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2 md:pt-4">
            <StatusBadge status={currentWO?.status || 'IN_PROGRESS'} />
            <span className="font-mono text-xs font-bold text-civic-blue bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
              Complaint #{currentWO?.complaintId}
            </span>
          </div>
        </div>

        {/* Officer Rejection Notice (Section 10) */}
        {isRework && (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 text-xs text-rose-900 space-y-1.5 animate-in fade-in">
            <div className="flex items-center space-x-2 font-bold text-sm text-rose-800">
              <RotateCcw className="w-4 h-4 text-rose-700" />
              <span>Repair Rejected during Municipal Officer Quality Inspection</span>
            </div>
            <p className="text-rose-800 pl-6">
              <strong>Officer Rejection Reason:</strong> "{currentWO.rejectionReason || 'Loose asphalt observed along curb edges. Corrective compaction required.'}"
            </p>
            <p className="text-[11px] text-rose-700 pl-6">
              &rarr; Mobilize crew for corrective re-work, take fresh post-repair photographs, and re-submit for second verification.
            </p>
          </div>
        )}

        {isAwaiting && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              This repair is currently <strong>Awaiting Municipal Officer Verification</strong>. You may update or supplement photos if required.
            </span>
          </div>
        )}
      </div>

      {/* Location Confirmation Widget (Section 10) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Compass className="w-4 h-4 text-civic-blue" />
            <span>GPS Geotag & Location Confirmation</span>
          </h3>
          <span className="text-[11px] text-slate-400">Section 10 Compliance</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Captured Geolocation (GPS)</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={gpsCoords}
                onChange={(e) => setGpsCoords(e.target.value)}
                className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-medium text-slate-800 bg-slate-50"
              />
              <button
                type="button"
                onClick={handleCaptureGPS}
                disabled={isCapturingGPS}
                className="px-3 py-2.5 bg-blue-50 text-civic-blue font-bold rounded-xl hover:bg-blue-100 border border-blue-200 flex items-center space-x-1 whitespace-nowrap"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>{isCapturingGPS ? 'Tagging...' : 'Capture GPS'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Manual Site Address / Landmark Confirmation</label>
            <input
              type="text"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              placeholder="Confirm street address / pillar number / cross road..."
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-civic-blue"
            />
          </div>
        </div>
      </div>

      {/* Two Separate Photo Sections: BEFORE and AFTER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ==================================================== */}
        {/* SECTION 1: BEFORE REPAIR                             */}
        {/* ==================================================== */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-700 font-extrabold text-xs flex items-center justify-center">
                  1
                </span>
                <h3 className="text-sm font-bold text-slate-900">Before Repair Evidence</h3>
              </div>
              <span className="text-[11px] text-slate-400">
                {beforePhotos.length} photo(s)
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Photographs depicting initial damage, unexcavated potholes, blocked culverts, or dark street fixtures before repair commencement.
            </p>

            {/* Upload Area */}
            <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/20">
              <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-xs font-bold text-slate-700">Click to upload before-repair images</span>
              <span className="text-[10px] text-slate-400 mt-0.5">JPEG, PNG, WebP up to 5MB each</span>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleFileUpload(e, 'BEFORE')}
                className="hidden"
              />
            </label>

            {/* Photo Previews Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {beforePhotos.map((url, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden border border-slate-200 h-28 bg-slate-100">
                  <img src={url} alt={`Before ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(i, 'BEFORE')}
                    className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove Image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-[9px] rounded font-bold">
                    #{i + 1}
                  </span>
                </div>
              ))}
            </div>

            {/* Caption Input */}
            <div>
              <label className="font-bold text-xs text-slate-700 block mb-1">
                Before Caption & Description
              </label>
              <input
                type="text"
                value={beforeCaption}
                onChange={(e) => setBeforeCaption(e.target.value)}
                placeholder="e.g. 3 deep potholes measuring 1.2 ft wide with exposed rubble"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Timestamp: {currentWO?.issuedDate || '2026-10-12'}</span>
            <span className="text-emerald-600 font-semibold flex items-center space-x-1">
              <Check className="w-3 h-3" />
              <span>Initial Evidence Logged</span>
            </span>
          </div>
        </div>

        {/* ==================================================== */}
        {/* SECTION 2: AFTER REPAIR                              */}
        {/* ==================================================== */}
        <div className="bg-white rounded-3xl p-6 border-2 border-emerald-300 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center">
                  2
                </span>
                <h3 className="text-sm font-bold text-slate-900">Completed Repair Evidence (After)</h3>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                {afterPhotos.length} photo(s)
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Photographs demonstrating finished on-site repair work (fresh asphalt patch, cleaned culvert, active streetlight, sealed pipe sleeve).
            </p>

            {/* Upload Area */}
            <label className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-emerald-50/20 hover:bg-emerald-50/40">
              <UploadCloud className="w-8 h-8 text-emerald-600 mb-2" />
              <span className="text-xs font-bold text-emerald-800">Click to upload completed repair photographs</span>
              <span className="text-[10px] text-slate-400 mt-0.5">JPEG, PNG, WebP up to 5MB</span>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleFileUpload(e, 'AFTER')}
                className="hidden"
              />
            </label>

            {/* Photo Previews Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {afterPhotos.length === 0 ? (
                <div className="col-span-full py-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                  No post-repair photos uploaded yet. Upload required before submitting.
                </div>
              ) : (
                afterPhotos.map((url, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden border border-emerald-200 h-28 bg-slate-100">
                    <img src={url} alt={`After ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(i, 'AFTER')}
                      className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove Image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-emerald-600 text-white text-[9px] rounded font-bold">
                      After #{i + 1}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Repair Notes */}
            <div>
              <label className="font-bold text-xs text-slate-700 block mb-1">
                Field Completion Notes & Work Summary *
              </label>
              <textarea
                value={afterNotes}
                onChange={(e) => setAfterNotes(e.target.value)}
                rows={3}
                placeholder="Detail the materials compacted, joints sealed, hydraulic tests run, or safety checks performed..."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Inspector: Er. Rajesh Kumar</span>
            <span className="font-semibold text-slate-700">Field Supervisor: {supervisorProfile.name}</span>
          </div>
        </div>
      </div>

      {/* Verification Submit CTA Card (Section 10) */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1 max-w-2xl">
          <h3 className="text-xl font-bold flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-emerald-200" />
            <span>Submit Repair for Municipal Officer Verification</span>
          </h3>
          <p className="text-emerald-100 text-xs leading-relaxed">
            Upon clicking submit, this work order transitions to <strong>Awaiting Verification</strong>.
            The Municipal Officer will review the Before and After photo evidence on their dashboard before officially approving resolution.
          </p>
        </div>

        <button
          onClick={handleSubmitEvidence}
          className="px-6 py-3 bg-white text-emerald-800 hover:bg-emerald-50 font-extrabold text-xs rounded-xl shadow-lg transition-all hover:scale-105 shrink-0"
        >
          Submit Photo Evidence &rarr;
        </button>
      </div>
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  X,
  CheckCircle2,
  Navigation,
  ArrowLeft,
  Camera,
  MapPin,
} from 'lucide-react';
import { useCivic } from '../../context/CivicContext';
import { createComplaint as createComplaintRequest, getComplaintCategories } from '../../services/api';
import { PlaceAutocomplete, LocationMap, reverseGeocodeLocation } from '../../components/common/LocationMap';
import { perceptualHashFromImage } from '../../utils/perceptualHash';
import { DEFAULT_PHOTO_LOCATION_THRESHOLD_METRES } from '../../../shared/photoLocation.js';

export function ReportIssue() {
  const navigate = useNavigate();
  const { submitComplaint } = useCivic();
  const [categories, setCategories] = useState([]);
  const [categoryStatus, setCategoryStatus] = useState('loading');
  const [categoryRetry, setCategoryRetry] = useState(0);

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('1');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState(null);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [focusLocation, setFocusLocation] = useState(null);
  const [locationMessage, setLocationMessage] = useState('Click the map to choose the issue location, or use GPS.');
  const addressRequestRef = useRef(0);
  const [photos, setPhotos] = useState([]);
  const [photoInputUrl, setPhotoInputUrl] = useState('');
  const [photoNotice, setPhotoNotice] = useState('');
  const [errors, setErrors] = useState({});
  const [submittedData, setSubmittedData] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    setCategoryStatus('loading');
    getComplaintCategories().then((items) => {
      if (!active) return;
      const available = Array.isArray(items) ? items : [];
      setCategories(available);
      setCategoryId(available.length ? String(available[0].id) : '');
      setCategoryStatus(available.length ? 'loaded' : 'empty');
      setErrors((previous) => ({ ...previous, categoryId: undefined }));
    }).catch(() => {
      if (!active) return;
      setCategories([]);
      setCategoryId('');
      setCategoryStatus('error');
    });
    return () => { active = false; };
  }, [categoryRetry]);

  const selectPoint = (lat, lng, source = 'map', accuracy = null) => {
    const point = { lat, lng, accuracy, source };
    const requestId = ++addressRequestRef.current;
    setLocation(point);
    setFocusLocation(null);
    setLocationConfirmed(false);
    setAddress('');
    setLocationMessage(source === 'gps'
      ? `GPS position selected${Number.isFinite(accuracy) ? ` (reported accuracy Â±${Math.round(accuracy)} m)` : ''}. Adjust the marker if needed; the GPS reading is an estimate.`
      : 'Selected map coordinates. Looking up the nearest addressâ€¦');
    setErrors((previous) => ({ ...previous, location: undefined }));
    reverseGeocodeLocation([lat, lng]).then((formattedAddress) => {
      if (requestId !== addressRequestRef.current) return;
      if (formattedAddress) {
        setAddress(formattedAddress);
        if (source !== 'gps') setLocationMessage('Nearest address found for the selected coordinates. Confirm the point when it is accurate.');
      } else if (source !== 'gps') setLocationMessage('No address was returned for this point. You can enter a landmark manually.');
    }).catch(() => {
      if (requestId === addressRequestRef.current && source !== 'gps') setLocationMessage('Address lookup failed. You can enter the landmark manually.');
    });
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const point = { lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy };
          setCurrentLocation(point);
          selectPoint(point.lat, point.lng, 'gps', point.accuracy);
        },
        (error) => setLocationMessage(error.code === 1
          ? 'Location permission was denied. You can still choose a location by clicking the map.'
          : 'Current location is unavailable. You can choose a location by clicking the map.'),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
      );
    } else setLocationMessage('This browser does not support GPS. Choose a location by clicking the map.');
  };

  const handlePlaceSearch = (place) => {
    setFocusLocation({ lat: place.lat, lng: place.lng });
    setLocationMessage(`Map centered on ${place.address || 'the search result'}. Search results are approximate places; click or drag to choose the exact issue point.`);
  };

  const handleAddPhotoUrl = () => {
    const nextUrl = photoInputUrl.trim();
    if (!nextUrl) return;
    if (photos.length >= 5) {
      setErrors((current) => ({ ...current, photos: 'A complaint can include up to 5 photos.' }));
      return;
    }
    const duplicate = photos.some((photo) => {
      try { const old = new URL(photo.imageUrl); const next = new URL(nextUrl); old.hash = ''; next.hash = ''; return old.toString() === next.toString(); }
      catch { return photo.imageUrl === nextUrl; }
    });
    if (!duplicate) setPhotos((previous) => [...previous, { imageUrl: nextUrl, photoSource: 'GALLERY' }]);
    setPhotoNotice('Image links cannot be checked as uploaded photo files. Upload the original image to verify its EXIF GPS.');
    setErrors((current) => ({ ...current, photos: undefined }));
    setPhotoInputUrl('');
  };

  const handleRemovePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e, photoSource = 'GALLERY') => {
    const file = e.target.files[0];
    e.target.value = '';
    if (file) {
      const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      const acceptedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      const extension = `.${file.name.split('.').pop()?.toLowerCase() || ''}`;
      if (!(acceptedTypes.includes(file.type) || (!file.type && acceptedExtensions.includes(extension)))) {
        setErrors((current) => ({ ...current, photos: 'Choose a valid JPG, PNG, WebP, or GIF image.' }));
        return;
      }
      if (!file.size || file.size > 5 * 1024 * 1024) {
        setErrors((current) => ({ ...current, photos: 'Each photo must be 5 MB or smaller.' }));
        return;
      }
      if (photos.length >= 5) {
        setErrors((current) => ({ ...current, photos: 'A complaint can include up to 5 photos.' }));
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => setErrors((current) => ({ ...current, photos: 'The selected image could not be read.' }));
      reader.onload = async (event) => {
        const image = event.target.result;
        const photo = {
          imageUrl: image,
          photoSource,
        };
        setPhotos((prev) => prev.some((item) => item.imageUrl === image) ? prev : [...prev, photo]);
        setPhotoNotice('The server checks GPS embedded in the original photo after submission.');
        setErrors((current) => ({ ...current, photos: undefined }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!title.trim()) newErrors.title = 'Issue title is required.';
    else if (title.trim().length < 5) newErrors.title = 'Title must be at least 5 characters.';

    if (!categoryId) newErrors.categoryId = 'Please select a complaint category.';

    if (!description.trim()) newErrors.description = 'Detailed description is required.';
    else if (description.trim().length < 15) newErrors.description = 'Please provide at least 15 characters describing the issue.';

    if (!address.trim()) newErrors.address = 'Location address or landmark is required.';
    if (!location || !locationConfirmed || !Number.isFinite(location.lat) || !Number.isFinite(location.lng)) newErrors.location = 'Choose and confirm a complaint location on the map.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    setSubmitting(true);
    try {
      const photosWithHashes = await Promise.all(photos.map(async (photo) => ({
        imageUrl: photo.imageUrl,
        photoSource: photo.photoSource,
        perceptualHash: await perceptualHashFromImage(photo.imageUrl),
      })));
      const record = await createComplaintRequest({
        title, categoryId: Number(categoryId), description, address,
        latitude: location.lat, longitude: location.lng,
        photos: photosWithHashes,
      });
      const newComplaint = submitComplaint(record);
      setSubmittedData(newComplaint);
    } catch (error) {
      setErrors(error.details && Object.keys(error.details).length ? error.details : { submit: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const submissionHasVerifiedPhoto = submittedData?.photoLocationEvidence?.some((photo) => photo.locationVerificationStatus === 'VERIFIED') || false;
  const latestPhotoStatus = submittedData?.photoLocationEvidence?.at(-1)?.locationVerificationStatus;
  const submissionVerificationLabel = submissionHasVerifiedPhoto
    ? 'VERIFIED'
    : latestPhotoStatus?.replaceAll('_', ' ') || 'NO PHOTOGRAPH SUBMITTED';

  if (submittedData) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 border border-slate-200 shadow-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10" />
        </div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
            Complaint Registered
        </span>
        <h2 className="text-2xl font-extrabold text-civic-text mb-2">
          Complaint Successfully Lodged!
        </h2>
        <p className="text-xs text-civic-muted max-w-md mx-auto mb-6">
          {submissionHasVerifiedPhoto
            ? 'A photograph passed the 500 metre location check. Your complaint is available to the municipal department for review.'
            : 'Your complaint and history are saved to your account. It will become available to the municipal department after a photograph passes location verification. Open the complaint details to upload a corrected photograph and retry.'}
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left max-w-md mx-auto mb-6 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Tracking Reference:</span>
            <span className="font-mono font-bold text-civic-blue">{submittedData.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Category:</span>
            <span className="font-semibold text-slate-800">{submittedData.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Location:</span>
            <span className="font-semibold text-slate-800 truncate max-w-[200px]">{submittedData.address}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Photo verification:</span>
            <span className={`font-bold ${submissionHasVerifiedPhoto ? 'text-emerald-700' : 'text-amber-700'}`}>{submissionVerificationLabel}</span>
          </div>
        </div>

        {submittedData.photoLocationEvidence?.length > 0 && <div className="max-w-md mx-auto mb-6 text-left space-y-2">
          <h3 className="text-xs font-bold text-slate-800">Photo GPS verification</h3>
          {submittedData.photoLocationEvidence.map((photo, index) => {
            const labels = { VERIFIED: 'Verified', REJECTED_LOCATION_MISMATCH: 'REJECTED – LOCATION MISMATCH', GPS_COORDINATES_NOT_FOUND: 'GPS Coordinates Not Found', INVALID_GPS_METADATA: 'Invalid GPS Metadata', COMPLAINT_LOCATION_NOT_AVAILABLE: 'COMPLAINT LOCATION NOT AVAILABLE', VERIFICATION_FAILED: 'Verification Failed' };
            const status = photo.locationVerificationStatus;
            const extractionLabel = photo.locationExtractionMethod === 'EXIF'
              ? 'EXIF metadata'
              : photo.locationExtractionMethod === 'OCR'
                ? 'OCR · visible image stamp (not authenticated camera metadata)'
                : 'No valid coordinates extracted';
            const failureReason = {
              REJECTED_LOCATION_MISMATCH: 'The calculated distance exceeds the 500 metre limit.',
              GPS_COORDINATES_NOT_FOUND: 'Neither EXIF GPS metadata nor a readable GPS stamp was found on the original photograph.',
              INVALID_GPS_METADATA: 'The photograph contains incomplete, malformed, or out-of-range GPS coordinates.',
              COMPLAINT_LOCATION_NOT_AVAILABLE: 'Confirmed complaint coordinates are unavailable.',
              VERIFICATION_FAILED: 'The uploaded image could not be checked for GPS metadata.',
            }[status];
            return <div key={photo.id || index} className={`rounded-xl border p-3 text-[11px] ${status === 'VERIFIED' ? 'border-emerald-200 bg-emerald-50' : status === 'REJECTED_LOCATION_MISMATCH' ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50'}`}>
              <p className="font-bold">Photo {index + 1}: {labels[status] || 'Verification Failed'}</p>
              <p className="mt-1 text-slate-600">Extracted GPS: {Number.isFinite(photo.captureLatitude) && Number.isFinite(photo.captureLongitude) ? `${photo.captureLatitude.toFixed(6)}, ${photo.captureLongitude.toFixed(6)}` : 'Unavailable'}</p>
              <p className="text-slate-600">Extraction method: {extractionLabel}</p>
              <p className="text-slate-600">Confirmed complaint GPS: {Number.isFinite(submittedData.latitude) && Number.isFinite(submittedData.longitude) ? `${submittedData.latitude.toFixed(6)}, ${submittedData.longitude.toFixed(6)}` : 'Not available'}</p>
              <p className="text-slate-600">Distance: {Number.isFinite(photo.locationDistanceMetres) ? `${photo.locationDistanceMetres.toFixed(1)} m` : 'Unavailable'}</p>
              <p className="text-slate-600">Maximum permitted distance: {DEFAULT_PHOTO_LOCATION_THRESHOLD_METRES} m</p>
              {failureReason && <p className="text-slate-700">Reason: {failureReason}</p>}
            </div>;
          })}
        </div>}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate(`/citizen/complaints/${submittedData.id}`)}
            className="w-full sm:w-auto px-5 py-2.5 bg-civic-blue hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
          >
            View Complaint Details & Timeline
          </button>
          <button
            onClick={() => {
              setSubmittedData(null);
              setTitle('');
              setDescription('');
              setAddress('');
              setPhotos([]);
              setPhotoNotice('');
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
          >
            Report Another Issue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 mb-2">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-civic-text">
            Report a Civic Issue
          </h2>
          <p className="text-xs text-civic-muted">
            Provide details, upload photos, and pinpoint the issue for municipal field teams.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
        {/* Issue Title */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Issue Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Deep pothole cluster near Metro Pillar 142"
            className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-civic-blue outline-hidden transition-all ${
              errors.title ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
            }`}
          />
          {errors.title && <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.title}</p>}
        </div>

        {/* Category Dropdown */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Category <span className="text-rose-500">*</span>
          </label>
          <select
            disabled={categoryStatus !== 'loaded'}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-civic-blue outline-hidden transition-all bg-white"
          >
            {categoryStatus === 'loading' && <option value="">Loading categories...</option>}
            {categoryStatus === 'empty' && <option value="">No categories available. Please contact the administrator.</option>}
            {categoryStatus === 'error' && <option value="">Failed to load categories. Please try again.</option>}
            {categoryStatus === 'loaded' && categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}{cat.description ? ` â€” ${cat.description}` : ''}
              </option>
            ))}
          </select>
          {categoryStatus === 'error' && <button type="button" onClick={() => setCategoryRetry((attempt) => attempt + 1)} className="mt-1 text-[11px] font-semibold text-civic-blue underline">Try again</button>}
          {categoryStatus === 'loaded' && errors.categoryId && <p className="text-[11px] text-rose-500 mt-1">{errors.categoryId}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Detailed Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the severity, duration, hazards, and exact nature of the problem..."
            className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-civic-blue outline-hidden transition-all ${
              errors.description ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
            }`}
          />
          {errors.description && <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.description}</p>}
        </div>

        {/* Location & Address */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Street Address / Landmark <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleGetLocation}
                className="text-[11px] text-civic-blue font-semibold hover:underline flex items-center space-x-1"
              >
                <Navigation className="w-3 h-3" />
                <span>Auto-Detect My GPS</span>
              </button>
            </div>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Near Metro Pillar 142, CMH Road, Indiranagar"
              className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-civic-blue outline-hidden transition-all ${
                errors.address ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
              }`}
            />
            {errors.address && <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.address}</p>}
          </div>

          <div className="rounded-2xl border border-slate-200 p-3 space-y-3">
            <PlaceAutocomplete onPlaceSelected={handlePlaceSearch} />
            <LocationMap center={[20, 0]} zoom={2} focusLocation={focusLocation} selected={location} currentLocation={currentLocation} onSelect={(point) => selectPoint(point[0], point[1], 'map')} className="h-[340px] sm:h-[400px]" />
            <p className="text-[11px] text-slate-500">Search moves the map to a place; it does not set your complaint location. Click the exact point or drag the marker there.</p>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
              <span className={errors.location ? 'text-rose-600 font-semibold' : 'text-slate-500'}>{errors.location || locationMessage}</span>
              {location && <span className="font-mono text-slate-700">{location.lat.toFixed(7)}, {location.lng.toFixed(7)} {locationConfirmed ? 'Â· confirmed' : 'Â· not confirmed'}</span>}
            </div>
            {currentLocation && Number.isFinite(currentLocation.accuracy) && <p className="text-[11px] text-blue-700">Device-reported GPS accuracy: Â±{Math.round(currentLocation.accuracy)} m. The GPS point is an estimate; map clicks and marker movement set the final coordinates.</p>}
            {location && <button type="button" onClick={() => { setLocationConfirmed(true); setLocationMessage('Location confirmed.'); setErrors((previous) => ({ ...previous, location: undefined })); }} className="px-3 py-1.5 bg-blue-50 text-civic-blue rounded-lg text-[11px] font-bold">{locationConfirmed ? 'Location confirmed' : 'Confirm selected location'}</button>}
          </div>
        </div>

        {/* Photo Upload & Preview */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Evidence Photos
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            {photos.map((photo, idx) => {
              return (
                <div key={`${photo.imageUrl.slice(0, 40)}-${idx}`} className="relative rounded-xl overflow-hidden bg-white border border-slate-200">
                  <div className="aspect-video bg-slate-100">
                    <img src={photo.imageUrl} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-1.5 p-2">
                    <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 text-blue-800 px-2 py-0.5 text-[10px] font-bold">
                      Verification after upload
                    </span>
                    <p className="text-[10px] text-slate-500">{photo.photoSource === 'CAMERA' ? 'Captured with camera' : 'Gallery photo'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-full transition-colors"
                    title={photo.photoSource === 'CAMERA' ? 'Remove or retake photo' : 'Remove photo'}
                    aria-label={`Remove photo ${idx + 1}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            <label className="border-2 border-dashed border-slate-300 hover:border-civic-blue rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/30 aspect-video">
              <Camera className="w-5 h-5 text-civic-blue mb-1" />
              <span className="text-[11px] font-semibold text-slate-700">Take Photo</span>
              <span className="text-[10px] text-slate-400">Camera capture + GPS check</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                capture="environment"
                onChange={(event) => handleFileUpload(event, 'CAMERA')}
                className="hidden"
              />
            </label>

            <label className="border-2 border-dashed border-slate-300 hover:border-civic-blue rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/30 aspect-video">
              <Upload className="w-5 h-5 text-slate-400 mb-1" />
              <span className="text-[11px] font-semibold text-slate-600">Choose from Gallery</span>
              <span className="text-[10px] text-slate-400">JPG, PNG, WebP, GIF up to 5MB</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(event) => handleFileUpload(event, 'GALLERY')}
                className="hidden"
              />
            </label>
          </div>

          {photoNotice && <p role="status" className="text-[11px] text-blue-700 mb-2 flex items-start gap-1.5"><MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />{photoNotice}</p>}

          <div className="flex items-center space-x-2">
            <input
              type="url"
              value={photoInputUrl}
              onChange={(e) => setPhotoInputUrl(e.target.value)}
              placeholder="Or paste an image URL..."
              className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <button
              type="button"
              onClick={handleAddPhotoUrl}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
            >
              Add URL
            </button>
          </div>
          {errors.photos && <p className="text-[11px] text-rose-600 mt-2" role="alert">{errors.photos}</p>}
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/citizen')}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          {errors.submit && <p className="mr-auto text-[11px] text-rose-600">{errors.submit}</p>}
          <button
            type="submit"
            disabled={submitting || !categories.length}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-civic-blue hover:bg-blue-700 text-white transition-colors shadow-md flex items-center space-x-2 disabled:opacity-60"
          >
            <span>{submitting ? 'Submittingâ€¦' : 'Submit Complaint'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

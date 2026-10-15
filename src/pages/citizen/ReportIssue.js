import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  X,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Image,
  Navigation,
  ArrowLeft,
} from 'lucide-react';
import { useCivic } from '../../context/CivicContext';

export function ReportIssue() {
  const navigate = useNavigate();
  const { categories, submitComplaint } = useCivic();

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('1');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('12.9784');
  const [longitude, setLongitude] = useState('77.6408');
  const [photos, setPhotos] = useState([
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
  ]);
  const [photoInputUrl, setPhotoInputUrl] = useState('');
  const [errors, setErrors] = useState({});
  const [submittedData, setSubmittedData] = useState(null);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toFixed(4));
          setLongitude(position.coords.longitude.toFixed(4));
          if (!address) {
            setAddress(`GPS Coord: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
          }
        },
        () => {
          // Fallback location for demo
          setLatitude('12.9716');
          setLongitude('77.5946');
          if (!address) setAddress('Bangalore Central Zone, MG Road');
        }
      );
    }
  };

  const handleAddPhotoUrl = () => {
    if (photoInputUrl.trim()) {
      setPhotos((prev) => [...prev, photoInputUrl.trim()]);
      setPhotoInputUrl('');
    }
  };

  const handleRemovePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotos((prev) => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!title.trim()) newErrors.title = 'Issue title is required.';
    else if (title.trim().length < 5) newErrors.title = 'Title must be at least 5 characters.';

    if (!categoryId) newErrors.categoryId = 'Please select a complaint category.';

    if (!description.trim()) newErrors.description = 'Detailed description is required.';
    else if (description.trim().length < 15) newErrors.description = 'Please provide at least 15 characters describing the issue.';

    if (!address.trim()) newErrors.address = 'Location address or landmark is required.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    const newComplaint = submitComplaint({
      title,
      categoryId,
      description,
      address,
      latitude,
      longitude,
      photos,
    });

    setSubmittedData(newComplaint);
  };

  if (submittedData) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 border border-slate-200 shadow-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
          Demonstration Complaint Registered
        </span>
        <h2 className="text-2xl font-extrabold text-civic-text mb-2">
          Complaint Successfully Lodged!
        </h2>
        <p className="text-xs text-civic-muted max-w-md mx-auto mb-6">
          Your complaint has been synchronized with the Municipal Operations Dashboard.
          An assigned engineer will review this issue and deploy field crews.
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
            <span className="text-slate-500 font-medium">Status:</span>
            <span className="font-bold text-amber-600">PENDING REVIEW</span>
          </div>
        </div>

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
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-civic-blue outline-hidden transition-all bg-white"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} — {cat.description}
              </option>
            ))}
          </select>
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

          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Latitude (Optional)
              </label>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="12.9716"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Longitude (Optional)
              </label>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="77.5946"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
              />
            </div>
          </div>
        </div>

        {/* Photo Upload & Preview */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Evidence Photos
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            {photos.map((url, idx) => (
              <div key={idx} className="relative group rounded-xl overflow-hidden aspect-video bg-slate-100 border border-slate-200">
                <img src={url} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(idx)}
                  className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-full transition-colors"
                  title="Remove photo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <label className="border-2 border-dashed border-slate-300 hover:border-civic-blue rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/30 aspect-video">
              <Upload className="w-5 h-5 text-slate-400 mb-1" />
              <span className="text-[11px] font-semibold text-slate-600">Upload Photo</span>
              <span className="text-[10px] text-slate-400">JPG, PNG up to 5MB</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

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
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-civic-blue hover:bg-blue-700 text-white transition-colors shadow-md flex items-center space-x-2"
          >
            <span>Submit Complaint</span>
          </button>
        </div>
      </form>
    </div>
  );
}

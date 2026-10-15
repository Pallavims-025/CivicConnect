import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Layers,
  Filter,
  Navigation,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Info,
  List,
  Map as MapIcon,
  ExternalLink,
} from 'lucide-react';
import { useCivic } from '../../context/CivicContext';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';

export function ComplaintMap() {
  const navigate = useNavigate();
  const { complaints, categories } = useCivic();

  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedPin, setSelectedPin] = useState(complaints[0]);
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'list'

  const filtered = complaints.filter((c) => {
    const sMatch = selectedStatus === 'ALL' || c.status === selectedStatus;
    const cMatch = selectedCategory === 'ALL' || c.category === selectedCategory;
    return sMatch && cMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-civic-text">
            Geospatial Complaint Map
          </h2>
          <p className="text-xs text-civic-muted">
            Interactive ward map plotting citizen issue reports with GPS coordinates and priority clustering.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs self-start sm:self-auto text-xs">
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-colors ${
              viewMode === 'map'
                ? 'bg-civic-blue text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Map View</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-colors ${
              viewMode === 'list'
                ? 'bg-civic-blue text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List Fallback</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-500">
          Showing <strong>{filtered.length}</strong> geocoded pins
        </span>
      </div>

      {viewMode === 'map' ? (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Simulated Geographic Canvas */}
          <div className="lg:col-span-2 bg-[#E5ECF4] rounded-3xl p-6 border border-slate-200 shadow-xs relative min-h-[480px] overflow-hidden flex flex-col justify-between">
            {/* Map Grid Pattern Background */}
            <div
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(#94a3b8 1.5px, transparent 1.5px), radial-gradient(#cbd5e1 1.5px, #E5ECF4 1.5px)',
                backgroundSize: '30px 30px',
                backgroundPosition: '0 0, 15px 15px',
              }}
            ></div>

            {/* Simulated Road Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-slate-300 stroke-[3] fill-none opacity-60">
              <path d="M 50 100 Q 200 150 450 120 T 800 200" />
              <path d="M 120 450 L 300 250 L 500 300 L 750 100" />
              <path d="M 400 50 L 400 450" />
            </svg>

            {/* Top Map Banner */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-xl text-xs font-bold text-slate-700 shadow-xs border border-slate-200">
                Bangalore East Ward 14 (Indiranagar Zone)
              </span>
              <span className="px-2.5 py-1 bg-blue-600 text-white rounded-xl text-[11px] font-bold shadow-xs">
                Live Geolocation Grid
              </span>
            </div>

            {/* Simulated Map Markers */}
            <div className="relative z-10 flex-1 my-6 flex flex-wrap items-center justify-around gap-8">
              {filtered.map((item, idx) => {
                const isSelected = selectedPin?.id === item.id;
                const getPinColor = () => {
                  if (item.priority === 'CRITICAL') return 'bg-red-500 ring-red-300';
                  if (item.status === 'RESOLVED') return 'bg-emerald-500 ring-emerald-300';
                  if (item.status === 'IN_PROGRESS') return 'bg-blue-500 ring-blue-300';
                  return 'bg-amber-500 ring-amber-300';
                };

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedPin(item)}
                    className={`group relative flex flex-col items-center transition-transform hover:scale-125 focus:outline-hidden ${
                      isSelected ? 'scale-125 z-20' : 'z-10'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full ${getPinColor()} text-white flex items-center justify-center shadow-lg ring-4 transition-all`}
                    >
                      <MapPin className="w-4 h-4 fill-white text-transparent" />
                    </div>
                    <span className="mt-1 px-2 py-0.5 bg-slate-900/80 text-white rounded text-[10px] font-mono font-bold whitespace-nowrap shadow-xs">
                      {item.id}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Map Legend */}
            <div className="relative z-10 bg-white/90 backdrop-blur-md rounded-2xl p-3 border border-slate-200 flex flex-wrap items-center gap-4 text-[11px] text-slate-700 font-medium">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span>Critical Issue</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span>Pending Review</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span>In Progress</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span>Resolved</span>
              </div>
            </div>
          </div>

          {/* Selected Marker Detail Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
            {selectedPin ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-civic-blue bg-blue-50 px-2 py-0.5 rounded">
                    {selectedPin.id}
                  </span>
                  <StatusBadge status={selectedPin.status} />
                </div>

                <div>
                  <PriorityBadge priority={selectedPin.priority} />
                  <h3 className="font-bold text-sm text-slate-900 mt-2 leading-snug">
                    {selectedPin.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-3">
                    {selectedPin.description}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5">
                  <p className="text-slate-500 flex items-center">
                    <MapPin className="w-3.5 h-3.5 text-civic-blue mr-1 shrink-0" />
                    <span className="font-medium text-slate-800 truncate">{selectedPin.address}</span>
                  </p>
                  <p className="text-slate-400 font-mono text-[11px] pl-4">
                    Lat: {selectedPin.latitude} | Long: {selectedPin.longitude}
                  </p>
                </div>

                {selectedPin.photos?.[0] && (
                  <div className="rounded-xl overflow-hidden aspect-video border border-slate-200">
                    <img
                      src={selectedPin.photos[0]}
                      alt="Pin photo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                Click a pin on the map to inspect details
              </div>
            )}

            {selectedPin && (
              <button
                onClick={() => navigate('/officer/complaints')}
                className="w-full py-2.5 bg-civic-blue text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
              >
                Open in Complaint Management
              </button>
            )}
          </div>
        </div>
      ) : (
        /* List Fallback */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Complaint ID</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4">GPS Coordinates</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-civic-blue">{c.id}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{c.title}</td>
                    <td className="py-3 px-4 text-slate-600">{c.category}</td>
                    <td className="py-3 px-4 text-slate-600">{c.address}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {c.latitude}, {c.longitude}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

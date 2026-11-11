import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Circle, CircleMarker, MapContainer, Marker, Popup, TileLayer, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';

const API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;
const TILE_URL = `https://maps.geoapify.com/v1/tile/osm-carto/{z}/{x}/{y}.png?apiKey=${encodeURIComponent(API_KEY || '')}`;
const PLACE_GROUPS = [
  { id: 'health', label: 'Health', icon: '✚', categories: 'healthcare.hospital,healthcare.clinic' },
  { id: 'education', label: 'Education', icon: '▣', categories: 'education.school,education.college' },
  { id: 'food', label: 'Food & cafes', icon: '☕', categories: 'catering.restaurant,catering.cafe' },
  { id: 'shops', label: 'Shops', icon: '▤', categories: 'commercial.supermarket,commercial.shopping_mall' },
  { id: 'parks', label: 'Parks', icon: '♧', categories: 'leisure.park' },
  { id: 'transport', label: 'Transport', icon: '↗', categories: 'public_transport,public_transport.bus' },
  { id: 'services', label: 'Public services', icon: '◆', categories: 'office.government,public_service' },
  { id: 'landmarks', label: 'Landmarks', icon: '★', categories: 'tourism.attraction' },
];

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const selectedLocationIcon = L.divIcon({
  className: 'cc-selected-location-icon',
  html: '<svg viewBox="0 0 32 42" aria-hidden="true" focusable="false"><path d="M16 1C7.72 1 1 7.72 1 16c0 10.7 15 25 15 25s15-14.3 15-25C31 7.72 24.28 1 16 1Z" fill="#dc2626" stroke="#fff" stroke-width="2"/><circle cx="16" cy="16" r="5.5" fill="#fff"/></svg>',
  iconSize: [36, 46],
  iconAnchor: [18, 44],
});

export async function reverseGeocodeLocation(point) {
  if (!API_KEY) throw new Error('Address lookup is not configured. Add VITE_GEOAPIFY_API_KEY to your local .env file.');
  const params = new URLSearchParams({ lat: String(point[0]), lon: String(point[1]), limit: '5', format: 'json', apiKey: API_KEY });
  const response = await fetch(`https://api.geoapify.com/v1/geocode/reverse?${params}`);
  if (!response.ok) throw new Error('Address lookup failed.');
  const payload = await response.json();
  const results = (payload.results || []).filter((result) => result.formatted);
  const rank = (result) => {
    const type = result.result_type;
    const hasStreet = Boolean(result.street);
    const hasHouseNumber = Boolean(result.housenumber);
    const detail = hasStreet && hasHouseNumber ? 6
      : type === 'building' || type === 'amenity' ? 5
        : hasStreet || type === 'street' ? 4
          : type === 'suburb' || type === 'district' || result.suburb || result.neighbourhood ? 3
            : type === 'city' || result.city ? 2
              : type === 'state' || type === 'county' ? 1
                : type === 'country' ? 0 : -1;
    return [detail, Number(result.rank?.confidence_street_level) || 0, -(Number(result.distance) || 0)];
  };
  const outranks = (candidate, current) => {
    const candidateRank = rank(candidate);
    const currentRank = rank(current);
    for (let index = 0; index < candidateRank.length; index += 1) {
      if (candidateRank[index] !== currentRank[index]) return candidateRank[index] > currentRank[index];
    }
    return false;
  };
  const best = results.reduce((selected, result) => {
    if (!selected) return result;
    return outranks(result, selected) ? result : selected;
  }, null);
  return best?.formatted || '';
}

const statusColor = (status) => ({
  PENDING: '#dc2626', UNDER_REVIEW: '#2563eb', ASSIGNED: '#2563eb',
  IN_PROGRESS: '#f97316', RESOLVED: '#16a34a', REJECTED: '#64748b', CLOSED: '#64748b',
}[status] || '#64748b');

export function PlaceAutocomplete({ onPlaceSelected, disabled = false }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const requestRef = useRef(0);
  const onPlaceRef = useRef(onPlaceSelected);
  onPlaceRef.current = onPlaceSelected;

  useEffect(() => {
    const term = query.trim();
    if (disabled || term.length < 3 || !API_KEY) {
      setSuggestions([]);
      setError(!API_KEY && term.length >= 3 ? 'Address search is not configured. Add VITE_GEOAPIFY_API_KEY to your local .env file.' : '');
      return undefined;
    }
    const requestId = ++requestRef.current;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({ text: term, limit: '5', filter: 'countrycode:in', format: 'json', apiKey: API_KEY });
        const response = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Address search failed. Try another query.');
        const payload = await response.json();
        if (requestId === requestRef.current) setSuggestions((payload.results || []).filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lon)));
      } catch (fetchError) {
        if (fetchError.name !== 'AbortError' && requestId === requestRef.current) setError(fetchError.message || 'Address search failed.');
      } finally {
        if (requestId === requestRef.current) setLoading(false);
      }
    }, 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, disabled]);

  const choose = (place) => {
    setQuery(place.formatted || '');
    setSuggestions([]);
    onPlaceRef.current?.({ lat: place.lat, lng: place.lon, address: place.formatted || '', viewport: place.bbox || null });
  };

  return (
    <div className="space-y-1">
      <label className="sr-only" htmlFor="civic-place-search">Search an address, street, locality, or landmark</label>
      <input id="civic-place-search" type="search" value={query} disabled={disabled} onChange={(event) => setQuery(event.target.value)} placeholder="Search an address, street, locality, or landmark" autoComplete="off" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-civic-blue disabled:opacity-60" />
      {loading && <p className="text-[11px] text-slate-500">Searching…</p>}
      {suggestions.length > 0 && <ul className="max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg" role="listbox">{suggestions.map((place, index) => <li key={`${place.place_id || place.formatted}-${index}`}><button type="button" role="option" onClick={() => choose(place)} className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50">{place.formatted}</button></li>)}</ul>}
      {error && <p className="text-[11px] text-rose-600">{error}</p>}
    </div>
  );
}

function MapClickHandler({ onSelectRef }) {
  useMapEvents({ click: (event) => onSelectRef.current?.([event.latlng.lat, event.latlng.lng], 'map') });
  return null;
}

function MapControls({ onPlaces }) {
  const map = useMap();
  useMapEvents({ moveend: () => onPlaces(map), zoomend: () => onPlaces(map) });
  useEffect(() => { const timer = window.setTimeout(() => map.invalidateSize(), 100); return () => window.clearTimeout(timer); }, [map]);
  const toggleFullscreen = async () => {
    const container = map.getContainer().parentElement;
    if (!document.fullscreenElement) await container.requestFullscreen?.();
    else await document.exitFullscreen?.();
    window.setTimeout(() => map.invalidateSize(), 150);
  };
  return <button type="button" aria-label="Toggle map fullscreen" title="Fullscreen" onClick={toggleFullscreen} className="cc-map-fullscreen leaflet-bar">⛶</button>;
}

function NearbyPlaces({ enabled, onPlaces }) {
  const map = useMap();
  useEffect(() => { onPlaces(map); }, [map, enabled, onPlaces]);
  return null;
}

function MapViewport({ center, selected, selectedId, complaints, focusLocation }) {
  const map = useMap();
  useEffect(() => {
    if (selectedId) {
      const focused = complaints.find((item) => item.databaseId === selectedId);
      if (focused) {
        map.setView([focused.latitude, focused.longitude], 18);
        return;
      }
    }
    if (focusLocation) {
      map.setView([focusLocation.lat, focusLocation.lng], 17);
      return;
    }
    if (selected) {
      map.setView([selected.lat, selected.lng], 17);
      return;
    }
    const points = complaints.filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
    if (points.length === 1) map.setView([points[0].latitude, points[0].longitude], 16);
    else if (points.length > 1) map.fitBounds(points.map((item) => [item.latitude, item.longitude]), { padding: [36, 36] });
    else if (center) map.setView(center, map.getZoom());
  }, [map, center, selected?.lat, selected?.lng, selectedId, complaints, focusLocation?.lat, focusLocation?.lng]);
  return null;
}

export function LocationMap({
  center = [20, 0], zoom = 2, selected, onSelect, currentLocation,
  complaints = [], selectedId, onComplaintSelect, focusLocation,
  className = 'h-[360px]',
}) {
  const onSelectRef = useRef(onSelect);
  const onComplaintSelectRef = useRef(onComplaintSelect);
  const [mapError, setMapError] = useState('');
  const [nearbyEnabled, setNearbyEnabled] = useState([]);
  const [places, setPlaces] = useState([]);
  const [showComplaints, setShowComplaints] = useState(true);
  const placesRequest = useRef(0);
  onSelectRef.current = onSelect;
  onComplaintSelectRef.current = onComplaintSelect;

  const validComplaints = complaints.filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
  const initialCenter = center || (validComplaints.length ? [validComplaints[0].latitude, validComplaints[0].longitude] : [20, 0]);
  const loadPlaces = useCallback((map) => {
    if (!API_KEY || nearbyEnabled.length === 0 || map.getZoom() < 12) { setPlaces([]); return; }
    const bounds = map.getBounds();
    const categories = PLACE_GROUPS.filter((group) => nearbyEnabled.includes(group.id)).map((group) => group.categories).join(',');
    const requestId = ++placesRequest.current;
    const params = new URLSearchParams({ categories, filter: `rect:${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()},${bounds.getSouth()}`, limit: '60', apiKey: API_KEY });
    fetch(`https://api.geoapify.com/v2/places?${params}`).then((response) => {
      if (!response.ok) throw new Error('Nearby places could not be loaded.');
      return response.json();
    }).then((payload) => {
      if (requestId === placesRequest.current) setPlaces((payload.features || []).filter((feature) => Number.isFinite(feature.properties?.lat) && Number.isFinite(feature.properties?.lon)));
    }).catch(() => { if (requestId === placesRequest.current) setPlaces([]); });
  }, [nearbyEnabled]);

  return (
    <div className="cc-map-wrapper relative">
      {API_KEY && <div className="absolute left-3 top-3 z-[500] flex max-w-[calc(100%-4rem)] flex-wrap gap-1.5 rounded-xl bg-white/95 p-2 shadow-md backdrop-blur">
        {complaints.length > 0 && <button type="button" aria-pressed={showComplaints} onClick={() => setShowComplaints((value) => !value)} className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${showComplaints ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>● Complaints</button>}
        {PLACE_GROUPS.map((group) => <button type="button" key={group.id} aria-pressed={nearbyEnabled.includes(group.id)} onClick={() => setNearbyEnabled((current) => current.includes(group.id) ? current.filter((item) => item !== group.id) : [...current, group.id])} className={`rounded-lg px-2 py-1.5 text-[11px] font-medium ${nearbyEnabled.includes(group.id) ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-600'}`}>{group.icon} {group.label}</button>)}
        {nearbyEnabled.length > 0 && <span className="w-full px-1 text-[10px] text-slate-500">Nearby places load from zoom 12</span>}
      </div>}
      {API_KEY ? <MapContainer center={initialCenter} zoom={zoom} scrollWheelZoom zoomControl={false} className={`cc-leaflet-map ${className}`} aria-label="Interactive street map">
        <ZoomControl position="topright" />
        <TileLayer url={TILE_URL} maxZoom={20} attribution={'Powered by <a href="https://www.geoapify.com/" target="_blank" rel="noreferrer">Geoapify</a> | <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>'} eventHandlers={{ tileerror: () => setMapError('Map tiles could not be loaded. Check the Geoapify key, quota, and network connection.') }} />
        <MapControls onPlaces={loadPlaces} />
        <NearbyPlaces enabled={nearbyEnabled} onPlaces={loadPlaces} />
        <MapClickHandler onSelectRef={onSelectRef} />
        <MapViewport center={center} selected={selected} selectedId={selectedId} complaints={complaints} focusLocation={focusLocation} />
        {currentLocation && <>
          {Number.isFinite(currentLocation.accuracy) && currentLocation.accuracy > 0 && <Circle center={[currentLocation.lat, currentLocation.lng]} radius={currentLocation.accuracy} pathOptions={{ color: '#2563eb', opacity: 0.65, weight: 1, fillColor: '#3b82f6', fillOpacity: 0.12 }} />}
          <CircleMarker center={[currentLocation.lat, currentLocation.lng]} radius={8} pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }}><Popup>Current location{Number.isFinite(currentLocation.accuracy) ? ` · accuracy ±${Math.round(currentLocation.accuracy)} m` : ''}</Popup></CircleMarker>
        </>}
        {selected && onSelect && <Marker position={[selected.lat, selected.lng]} icon={selectedLocationIcon} zIndexOffset={1000} draggable title="Selected location — drag to adjust" eventHandlers={{ dragend: (event) => { const point = event.target.getLatLng(); onSelectRef.current?.([point.lat, point.lng], 'marker'); } }} />}
        {showComplaints && validComplaints.map((item) => <CircleMarker key={item.databaseId || item.id} center={[item.latitude, item.longitude]} radius={9} pathOptions={{ color: '#ffffff', weight: 2, fillColor: statusColor(item.status), fillOpacity: 1 }} eventHandlers={{ click: () => onComplaintSelectRef.current?.(item) }}><Popup><strong>{item.id}</strong><br />{item.title}</Popup></CircleMarker>)}
        {places.map((feature) => {
          const group = PLACE_GROUPS.find((item) => nearbyEnabled.includes(item.id) && item.categories.split(',').some((category) => feature.properties?.categories?.includes(category.split('.')[0])));
          const icon = L.divIcon({ className: 'cc-place-marker', html: `<span>${group?.icon || '•'}</span>`, iconSize: [27, 27], iconAnchor: [13, 13] });
          return <Marker key={feature.properties.place_id} position={[feature.properties.lat, feature.properties.lon]} icon={icon} title={feature.properties.name || group?.label || 'Nearby place'}><Popup><strong>{group?.icon || '•'} {feature.properties.name || feature.properties.address_line1 || 'Nearby place'}</strong>{feature.properties.address_line2 && <><br />{feature.properties.address_line2}</>}</Popup></Marker>;
        })}
      </MapContainer> : <div className={`cc-leaflet-map ${className} grid place-items-center bg-slate-100 p-6 text-center text-xs text-rose-700`} role="alert">Map is not configured. Add VITE_GEOAPIFY_API_KEY to your local .env file.</div>}
      {mapError && <div role="alert" className="absolute inset-x-3 top-3 z-[1000] rounded-lg bg-white/95 p-2 text-center text-xs text-rose-700 shadow">{mapError}</div>}
    </div>
  );
}

export { statusColor };

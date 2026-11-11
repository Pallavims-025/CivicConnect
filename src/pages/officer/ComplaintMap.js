import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, RefreshCw, Search, AlertCircle, ExternalLink } from 'lucide-react';
import { getOfficerMapComplaints } from '../../services/api';
import { LocationMap } from '../../components/common/LocationMap';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';

const labelStatus = (status) => status.replaceAll('_', ' ');

export function ComplaintMap() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [unmappedCount, setUnmappedCount] = useState(0);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [priority, setPriority] = useState('ALL');
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState('map');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const refresh = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    else setRefreshing(true);
    try {
      const result = await getOfficerMapComplaints();
      const records = result?.complaints || [];
      setComplaints(records);
      setUnmappedCount(result?.unmappedCount || 0);
      setError('');
      setLastUpdated(new Date());
      setSelected((current) => current ? (records || []).find((item) => item.databaseId === current.databaseId) || null : null);
    } catch (fetchError) {
      setError(fetchError.message || 'Could not load complaint locations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refresh(true);
    const timer = window.setInterval(() => refresh(false), 60000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const categories = useMemo(() => [...new Set(complaints.map((item) => item.category).filter(Boolean))].sort(), [complaints]);
  const statuses = useMemo(() => [...new Set(complaints.map((item) => item.status).filter(Boolean))].sort(), [complaints]);
  const priorities = useMemo(() => [...new Set(complaints.map((item) => item.priority).filter(Boolean))].sort(), [complaints]);
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return complaints.filter((item) =>
      (status === 'ALL' || item.status === status) &&
      (category === 'ALL' || item.category === category) &&
      (priority === 'ALL' || item.priority === priority) &&
      (!term || item.id.toLocaleLowerCase().includes(term) || item.title.toLocaleLowerCase().includes(term))
    );
  }, [complaints, status, category, priority, query]);

  const openDetails = (item) => setSelected(item);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-civic-text">Geospatial Complaint Map</h2>
          <p className="text-xs text-civic-muted">Authorized complaint locations from the municipal database.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 text-xs">
            <button onClick={() => setViewMode('map')} className={`px-3 py-1.5 rounded-lg font-semibold ${viewMode === 'map' ? 'bg-civic-blue text-white' : 'text-slate-600'}`}>Map View</button>
            <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded-lg font-semibold ${viewMode === 'list' ? 'bg-civic-blue text-white' : 'text-slate-600'}`}>List</button>
          </div>
          <button onClick={() => refresh(false)} disabled={refreshing} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 disabled:opacity-50"><RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-wrap gap-3 items-center">
        <select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50"><option value="ALL">All statuses</option>{statuses.map((value) => <option key={value} value={value}>{labelStatus(value)}</option>)}</select>
        <select aria-label="Filter by category" value={category} onChange={(event) => setCategory(event.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50"><option value="ALL">All categories</option>{categories.map((value) => <option key={value} value={value}>{value}</option>)}</select>
        <select aria-label="Filter by priority" value={priority} onChange={(event) => setPriority(event.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50"><option value="ALL">All priorities</option>{priorities.map((value) => <option key={value} value={value}>{value}</option>)}</select>
        <label className="flex items-center gap-2 min-w-[210px] flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"><Search className="w-3.5 h-3.5 text-slate-400" /><input aria-label="Search complaint ID or title" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search complaint ID or title" className="w-full bg-transparent outline-none text-xs" /></label>
        <span className="text-xs text-slate-500 ml-auto">Showing <strong className="text-slate-800">{filtered.length}</strong> of {complaints.length} mapped</span>
      </div>

      {error && <div role="alert" className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}<button onClick={() => refresh(false)} className="ml-auto underline font-semibold">Retry</button></div>}
      {loading ? <div className="bg-white rounded-2xl p-14 text-center text-sm text-slate-500">Loading authorized complaint locations…</div> : viewMode === 'map' ? (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white rounded-3xl p-3 border border-slate-200 shadow-xs">
            {filtered.length ? <LocationMap complaints={filtered} onComplaintSelect={openDetails} selectedId={selected?.databaseId} center={undefined} className="h-[480px] sm:h-[560px]" /> : <div className="h-[480px] grid place-items-center text-center text-sm text-slate-500 px-8">{complaints.length ? 'No complaints match these filters.' : 'No geocoded complaints are available to map for your account.'}</div>}
            {unmappedCount > 0 && <p className="px-3 pt-3 text-[11px] text-slate-500">{unmappedCount} authorized complaint{unmappedCount === 1 ? '' : 's'} have no saved coordinates and cannot be plotted.</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-2 px-3 py-3 text-[11px] text-slate-700 border-t border-slate-100 mt-3">
              {[
                ['PENDING', 'Pending', '#dc2626'], ['UNDER_REVIEW', 'Assigned / Under Review', '#2563eb'], ['ASSIGNED', 'Assigned', '#2563eb'],
                ['IN_PROGRESS', 'In Progress', '#f97316'], ['RESOLVED', 'Resolved', '#16a34a'], ['REJECTED', 'Rejected / Closed', '#64748b'],
              ].map(([key, text, color]) => <span key={key} className="inline-flex items-center gap-1.5"><i className="w-3 h-3 rounded-full" style={{ background: color }} />{text}</span>)}
            </div>
            {lastUpdated && <p className="px-3 pb-1 text-[10px] text-slate-400">Updated {lastUpdated.toLocaleTimeString()}</p>}
          </div>
          <ComplaintInfo complaint={selected} navigate={navigate} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">Complaint ID</th><th className="p-3">Title</th><th className="p-3">Category</th><th className="p-3">Priority / Status</th><th className="p-3">Coordinates</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((item) => <tr key={item.databaseId} onClick={() => openDetails(item)} className="cursor-pointer hover:bg-slate-50"><td className="p-3 font-mono text-civic-blue">{item.id}</td><td className="p-3 font-semibold">{item.title}</td><td className="p-3">{item.category}</td><td className="p-3">{item.priority} · {labelStatus(item.status)}</td><td className="p-3 font-mono">{item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}</td></tr>)}</tbody></table>
          {filtered.length === 0 && <p className="p-8 text-center text-slate-500">No complaints match these filters.</p>}
        </div>
      )}
    </div>
  );
}

function ComplaintInfo({ complaint, navigate }) {
  if (!complaint) return <div className="bg-white rounded-3xl p-8 border border-slate-200 grid place-items-center text-center text-xs text-slate-400 min-h-[230px]"><MapPin className="w-8 h-8 mb-2 text-slate-300" />Select a marker to inspect its complaint.</div>;
  return (
    <aside className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4 min-w-0">
      <div className="flex items-center justify-between gap-2"><span className="font-mono font-bold text-xs text-civic-blue bg-blue-50 px-2 py-1 rounded">{complaint.id}</span><StatusBadge status={complaint.status} /></div>
      <div><PriorityBadge priority={complaint.priority} /><h3 className="font-bold text-sm text-slate-900 mt-2">{complaint.title}</h3><p className="text-xs text-slate-600 mt-2 whitespace-pre-wrap">{complaint.description}</p></div>
      <dl className="text-xs space-y-2 border-t border-slate-100 pt-3">
        <InfoRow label="Category" value={complaint.category} /><InfoRow label="Customer" value={complaint.citizenName} />
        {complaint.citizenEmail && <InfoRow label="Email" value={complaint.citizenEmail} />} {complaint.citizenPhone && <InfoRow label="Phone" value={complaint.citizenPhone} />}
        <InfoRow label="Address" value={complaint.address || 'Not provided'} /><InfoRow label="Coordinates" value={`${complaint.latitude}, ${complaint.longitude}`} mono />
        <InfoRow label="Submitted" value={complaint.reportedDate ? new Date(complaint.reportedDate).toLocaleString() : 'Not available'} />
        <InfoRow label="Status" value={labelStatus(complaint.status)} /><InfoRow label="Priority" value={complaint.priority} />
        {complaint.assignedOfficer && <InfoRow label="Assigned officer" value={`${complaint.assignedOfficer.name}${complaint.assignedOfficer.phone ? ` · ${complaint.assignedOfficer.phone}` : ''}`} />}
        {complaint.assignedFieldOfficer && <InfoRow label="Field officer / crew" value={complaint.assignedFieldOfficer} />}
        {complaint.workOrderId && <InfoRow label="Work order" value={complaint.workOrderId} />}
      </dl>
      {complaint.rejectionReason && <p className="p-3 rounded-xl bg-slate-50 text-xs text-slate-600"><strong>Rejection reason:</strong> {complaint.rejectionReason}</p>}
      {complaint.resolutionNotes && <p className="p-3 rounded-xl bg-emerald-50 text-xs text-emerald-800"><strong>Resolution notes:</strong> {complaint.resolutionNotes}</p>}
      {complaint.timeline?.length > 0 && <div className="border-t border-slate-100 pt-3"><h4 className="text-[11px] font-bold text-slate-600 mb-2">Status history</h4><div className="space-y-2">{complaint.timeline.map((item, index) => <div key={`${item.date}-${index}`} className="text-[11px] border-l-2 pl-2" style={{ borderColor: '#cbd5e1' }}><p className="font-semibold text-slate-700">{item.title} · {new Date(item.date).toLocaleString()}</p>{item.description && <p className="text-slate-500">{item.description}</p>}<p className="text-slate-400">{item.by}</p></div>)}</div></div>}
      {complaint.photos?.length > 0 && <div className="grid grid-cols-2 gap-2">{complaint.photos.map((src, index) => <a key={`${src}-${index}`} href={src} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-slate-200"><img src={src} alt={`Complaint evidence ${index + 1}`} className="w-full h-24 object-cover" /></a>)}</div>}
      <button onClick={() => navigate('/officer/complaints')} className="w-full py-2.5 bg-civic-blue text-white rounded-xl text-xs font-bold hover:bg-blue-700 inline-flex items-center justify-center gap-2">Open Complaint Management <ExternalLink className="w-3.5 h-3.5" /></button>
    </aside>
  );
}

function InfoRow({ label, value, mono = false }) {
  return <div className="grid grid-cols-[90px_1fr] gap-2"><dt className="text-slate-400">{label}</dt><dd className={`text-slate-700 break-words ${mono ? 'font-mono' : ''}`}>{value || 'Not provided'}</dd></div>;
}

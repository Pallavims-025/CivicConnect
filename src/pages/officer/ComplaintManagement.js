import React, { useMemo, useState } from 'react';
import { AlertCircle, ExternalLink, Eye, MapPin, RefreshCw, Search, X } from 'lucide-react';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';
import { useOfficerComplaints } from '../../hooks/useOfficerComplaints';
import { assignComplaintToSupervisor, getActiveFieldSupervisors, getOfficerComplaint, updateOfficerComplaintStatus } from '../../services/api';

const STATUSES = ['PENDING', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];
const labelStatus = (status = '') => status.replaceAll('_', ' ');

export function ComplaintManagement() {
  const { complaints, setComplaints, loading, refreshing, error, refresh } = useOfficerComplaints();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const [nextStatus, setNextStatus] = useState('PENDING');
  const [remarks, setRemarks] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [supervisors, setSupervisors] = useState([]);
  const [supervisorsLoading, setSupervisorsLoading] = useState(false);
  const [assignmentSupervisor, setAssignmentSupervisor] = useState('');
  const [assignmentInstructions, setAssignmentInstructions] = useState('');
  const [assignmentPriority, setAssignmentPriority] = useState('MEDIUM');
  const [assignmentDueDate, setAssignmentDueDate] = useState(() => new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const [assignmentError, setAssignmentError] = useState('');
  const [assignmentSuccess, setAssignmentSuccess] = useState('');

  const categories = useMemo(() => [...new Set(complaints.map((item) => item.category).filter(Boolean))].sort(), [complaints]);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return complaints.filter((item) => {
      const matchesTerm = !term || [item.id, item.title, item.description, item.citizenName, item.citizenEmail, item.citizenPhone, item.address]
        .some((value) => String(value || '').toLowerCase().includes(term));
      return matchesTerm && (statusFilter === 'ALL' || item.status === statusFilter) && (categoryFilter === 'ALL' || item.category === categoryFilter) && (priorityFilter === 'ALL' || item.priority === priorityFilter);
    });
  }, [complaints, query, statusFilter, categoryFilter, priorityFilter]);

  const openComplaint = async (item) => {
    setSelected(item);
    setNextStatus(item.status);
    setRemarks('');
    setSaveError('');
    try {
      const details = await getOfficerComplaint(item.databaseId || item.id);
      setSelected(details);
      setNextStatus(details.status);
      const activeAssignment = details.assignments?.find((assignment) => ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'AWAITING_VERIFICATION', 'REWORK_REQUIRED'].includes(assignment.status));
      setAssignmentSupervisor(activeAssignment?.supervisor?.id || '');
      setAssignmentInstructions(activeAssignment?.workDescription || '');
      setAssignmentPriority(activeAssignment?.priority || details.priority || 'MEDIUM');
      setAssignmentDueDate(activeAssignment?.deadline ? new Date(activeAssignment.deadline).toISOString().slice(0, 10) : new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
      setAssignmentError('');
      setAssignmentSuccess('');
      setSupervisors([]);
      setSupervisorsLoading(true);
      getActiveFieldSupervisors()
        .then((records) => setSupervisors(Array.isArray(records) ? records : []))
        .catch((error) => {
          setSupervisors([]);
          setAssignmentError(error.message || 'Could not load registered Field Supervisors.');
        })
        .finally(() => setSupervisorsLoading(false));
    } catch (error) {
      setSaveError(error.message || 'Could not load complaint details.');
    }
  };

  const saveAssignment = async () => {
    if (!selected) return;
    setAssignmentSaving(true);
    setAssignmentError('');
    setAssignmentSuccess('');
    try {
      const assignment = await assignComplaintToSupervisor(selected.databaseId || selected.id, {
        supervisorId: assignmentSupervisor,
        instructions: assignmentInstructions,
        priority: assignmentPriority,
        dueDate: assignmentDueDate,
      });
      const assigned = {
        id: assignment.id,
        workOrderCode: assignment.workOrderCode,
        status: assignment.status,
        priority: assignment.priority,
        workDescription: assignment.workDescription,
        deadline: assignment.deadline,
        assignedAt: assignment.assignedAt,
        acceptedAt: assignment.acceptedAt,
        supervisor: assignment.supervisor,
      };
      setSelected((current) => ({ ...current, assignments: [assigned], assignedFieldOfficer: assignment.supervisor?.name }));
      setAssignmentSuccess(`Assigned to ${assignment.supervisor?.name || 'Field Supervisor'}.`);
      await refresh(false);
    } catch (error) {
      setAssignmentError(error.message || 'Could not assign this complaint.');
    } finally {
      setAssignmentSaving(false);
    }
  };

  const saveStatus = async () => {
    if (!selected) return;
    setSaving(true);
    setSaveError('');
    try {
      const saved = await updateOfficerComplaintStatus(selected.databaseId || selected.id, { status: nextStatus, remarks });
      setComplaints((current) => current.map((item) => (item.databaseId || item.id) === (saved.databaseId || saved.id) ? saved : item));
      setSelected(saved);
      setRemarks('');
    } catch (error) {
      setSaveError(error.message || 'Could not save this complaint update.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-xl md:text-2xl font-extrabold text-civic-text">Complaint Management</h1><p className="text-xs text-civic-muted mt-1">Customer submissions loaded from the municipal database.</p></div>
        <button onClick={() => refresh(false)} disabled={refreshing} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold disabled:opacity-50"><RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />Refresh</button>
      </header>

      {error && <div role="alert" className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}<button onClick={() => refresh(false)} className="ml-auto underline font-semibold">Retry</button></div>}

      <section className="bg-white rounded-2xl p-4 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"><Search className="w-4 h-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ID, title, customer, address" className="min-w-0 w-full bg-transparent outline-none text-xs" /></label>
        <select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"><option value="ALL">All statuses</option>{STATUSES.map((status) => <option key={status} value={status}>{labelStatus(status)}</option>)}</select>
        <select aria-label="Filter by category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"><option value="ALL">All categories</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select>
        <select aria-label="Filter by priority" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"><option value="ALL">All priorities</option>{['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((priority) => <option key={priority} value={priority}>{priority}</option>)}</select>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 text-xs text-slate-500">Showing <strong className="text-slate-900">{filtered.length}</strong> of {complaints.length} customer complaints</div>
        {loading ? <p className="p-12 text-center text-sm text-slate-500">Loading complaints…</p> : filtered.length === 0 ? <div className="p-12 text-center"><p className="font-semibold text-slate-700">{error ? 'Complaint records could not be loaded.' : complaints.length ? 'No complaints match these filters.' : 'No complaints have been submitted yet.'}</p><p className="text-xs text-slate-500 mt-1">New customer submissions appear automatically while this dashboard is open.</p></div> : <>
          <div className="hidden md:block overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">Complaint</th><th className="p-3">Customer</th><th className="p-3">Category</th><th className="p-3">Priority</th><th className="p-3">Status</th><th className="p-3">Submitted</th><th className="p-3">Details</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((item) => <tr key={item.databaseId || item.id} className="hover:bg-slate-50"><td className="p-3"><span className="font-mono text-civic-blue">{item.id}</span><p className="font-semibold text-slate-800 mt-1">{item.title}</p><p className="text-slate-500 truncate max-w-[250px]">{item.address || 'Location not provided'}</p><p className="text-[10px] text-slate-400">{item.photoCount || 0} photo(s)</p></td><td className="p-3">{item.citizenName || 'Customer'}<p className="text-slate-500">{item.citizenPhone || item.citizenEmail || 'Contact not provided'}</p></td><td className="p-3">{item.category}</td><td className="p-3"><PriorityBadge priority={item.priority} /></td><td className="p-3"><StatusBadge status={item.status} /></td><td className="p-3 whitespace-nowrap">{item.reportedDate ? new Date(item.reportedDate).toLocaleString() : '—'}</td><td className="p-3"><button onClick={() => openComplaint(item)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-civic-blue font-semibold"><Eye className="w-3.5 h-3.5" />Open</button></td></tr>)}</tbody></table></div>
          <div className="md:hidden divide-y divide-slate-100">{filtered.map((item) => <article key={item.databaseId || item.id} className="p-4 space-y-2"><div className="flex justify-between gap-2"><span className="font-mono text-xs text-civic-blue">{item.id}</span><StatusBadge status={item.status} /></div><h2 className="font-bold text-sm">{item.title}</h2><p className="text-xs text-slate-500">{item.citizenName || 'Customer'} · {item.category}</p><p className="text-xs text-slate-500 flex items-start gap-1"><MapPin className="w-3 h-3 mt-0.5" />{item.address || 'Location not provided'}</p><button onClick={() => openComplaint(item)} className="px-3 py-2 rounded-lg bg-blue-50 text-civic-blue text-xs font-semibold">View details</button></article>)}</div>
        </>}
      </section>

      {selected && <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm p-3 sm:p-6 grid place-items-center" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="complaint-title" className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[94vh] overflow-y-auto">
          <header className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 p-4 sm:p-5 flex justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap gap-2 items-center"><span className="font-mono text-xs text-civic-blue">{selected.id}</span><StatusBadge status={selected.status} /><PriorityBadge priority={selected.priority} /></div><h2 id="complaint-title" className="font-bold text-lg mt-2">{selected.title}</h2></div><button aria-label="Close complaint details" onClick={() => setSelected(null)} className="p-2 h-fit rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button></header>
          <div className="p-4 sm:p-5 space-y-5">
            <div className="grid sm:grid-cols-2 gap-4 text-xs"><Detail label="Description" value={selected.description} wide /><Detail label="Category" value={selected.category} /><Detail label="Customer" value={selected.citizenName} /><Detail label="Email" value={selected.citizenEmail} /><Detail label="Phone" value={selected.citizenPhone} /><Detail label="Address" value={selected.address} /><Detail label="Coordinates" value={Number.isFinite(selected.latitude) && Number.isFinite(selected.longitude) ? `${selected.latitude}, ${selected.longitude}` : 'Not provided'} /><Detail label="Submitted" value={selected.reportedDate ? new Date(selected.reportedDate).toLocaleString() : 'Not available'} /><Detail label="Department" value={selected.assignedDepartment} /><Detail label="Work order" value={selected.workOrderId} />{selected.rejectionReason && <Detail label="Rejection reason" value={selected.rejectionReason} wide />}{selected.resolutionNotes && <Detail label="Resolution notes" value={selected.resolutionNotes} wide />}</div>
            {selected.photos?.length > 0 && <section><h3 className="text-sm font-bold mb-2">Submitted photographs ({selected.photos.length})</h3><div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{selected.photos.map((src, index) => <a key={`${src}-${index}`} href={src} target="_blank" rel="noreferrer" title="Open full size photograph" className="group relative block overflow-hidden rounded-xl border border-slate-200"><img src={src} alt={`Customer photograph ${index + 1}`} className="w-full aspect-video object-cover group-hover:scale-[1.02] transition-transform" /><span className="absolute right-2 bottom-2 p-1.5 rounded-lg bg-black/60 text-white"><ExternalLink className="w-3.5 h-3.5" /></span></a>)}</div></section>}
            <section className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3"><div><h3 className="text-sm font-bold">Assign field work</h3><p className="text-xs text-slate-500 mt-1">Active, approved supervisors are loaded from the user database.</p></div>
              {selected.assignments?.map((assignment) => <div key={assignment.id} className="p-3 rounded-lg bg-white border border-blue-100 text-xs"><p className="font-semibold">{assignment.workOrderCode || assignment.id} · {assignment.status.replaceAll('_', ' ')}</p><p className="text-slate-600 mt-1">Assigned to {assignment.supervisor?.name || 'Supervisor'} · Due {new Date(assignment.deadline).toLocaleDateString()}</p><p className="text-slate-500 mt-1">{assignment.workDescription}</p></div>)}
              {supervisorsLoading ? <p role="status" className="text-xs text-slate-500">Loading registered Field Supervisors…</p> : supervisors.length === 0 && !assignmentError ? <p className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">No registered Field Supervisors available. Please wait until a Field Supervisor creates an account.</p> : null}
              <div className="grid sm:grid-cols-2 gap-3"><label className="text-xs font-semibold text-slate-600">Field Supervisor<select value={assignmentSupervisor} onChange={(event) => setAssignmentSupervisor(event.target.value)} disabled={supervisorsLoading || supervisors.length === 0} className="block w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 bg-white disabled:bg-slate-100"><option value="">Select a supervisor</option>{supervisors.map((supervisor) => <option key={supervisor.id} value={supervisor.id}>{supervisor.name} · {supervisor.email}{supervisor.department?.name ? ` · ${supervisor.department.name}` : ''}</option>)}</select></label><label className="text-xs font-semibold text-slate-600">Priority<select value={assignmentPriority} onChange={(event) => setAssignmentPriority(event.target.value)} className="block w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 bg-white">{['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label className="text-xs font-semibold text-slate-600">Due date<input type="date" value={assignmentDueDate} onChange={(event) => setAssignmentDueDate(event.target.value)} className="block w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 bg-white" /></label><label className="text-xs font-semibold text-slate-600 sm:col-span-2">Assignment instructions<textarea value={assignmentInstructions} onChange={(event) => setAssignmentInstructions(event.target.value)} rows={3} maxLength={5000} placeholder="Describe the inspection or repair work required" className="block w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 bg-white" /></label></div>
              {assignmentError && <p role="alert" className="text-xs text-rose-700">{assignmentError}</p>}{assignmentSuccess && <p role="status" className="text-xs text-emerald-700">{assignmentSuccess}</p>}<button onClick={saveAssignment} disabled={assignmentSaving || supervisorsLoading || supervisors.length === 0} className="px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-bold disabled:opacity-50">{assignmentSaving ? 'Saving assignment…' : 'Assign work'}</button>
            </section>
            {selected.timeline?.length > 0 && <section><h3 className="text-sm font-bold mb-2">Updates</h3><div className="space-y-3 border-l-2 border-slate-200 ml-1 pl-4">{selected.timeline.map((item, index) => <article key={`${item.date}-${index}`} className="text-xs"><p className="font-semibold text-slate-800">{item.title}</p><p className="text-slate-500">{item.date ? new Date(item.date).toLocaleString() : ''}{item.by ? ` · ${item.by}` : ''}</p>{item.description && <p className="mt-1 text-slate-600 whitespace-pre-wrap">{item.description}</p>}</article>)}</div></section>}
            <section className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3"><h3 className="text-sm font-bold">Update complaint status</h3><div className="grid sm:grid-cols-2 gap-3"><label className="text-xs font-semibold text-slate-600">Status<select value={nextStatus} onChange={(event) => setNextStatus(event.target.value)} className="block w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 bg-white">{STATUSES.map((status) => <option key={status} value={status}>{labelStatus(status)}</option>)}</select></label><label className="text-xs font-semibold text-slate-600">Remarks<textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} maxLength={5000} rows={2} placeholder="Optional progress note or resolution detail" className="block w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 bg-white resize-y" /></label></div>{saveError && <p role="alert" className="text-xs text-rose-700">{saveError}</p>}<button onClick={saveStatus} disabled={saving} className="px-4 py-2 rounded-lg bg-civic-blue text-white text-xs font-bold disabled:opacity-50">{saving ? 'Saving…' : 'Save update'}</button></section>
          </div>
        </section>
      </div>}
    </div>
  );
}

function Detail({ label, value, wide = false }) {
  return <div className={wide ? 'sm:col-span-2' : ''}><p className="text-slate-400 font-medium">{label}</p><p className="text-slate-800 mt-0.5 whitespace-pre-wrap break-words">{value || 'Not provided'}</p></div>;
}

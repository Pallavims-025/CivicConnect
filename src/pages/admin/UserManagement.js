import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw, UserCheck, UserX, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export function UserManagement() {
  const { getToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(API_BASE + '/auth/users?limit=100', {
        headers: { Authorization: 'Bearer ' + getToken() },
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error?.message || 'Could not load user accounts.');
      setUsers(body.data || []);
    } catch (err) {
      setError(err.message || 'Could not reach the CivicConnect API.');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const filtered = useMemo(() => users.filter((user) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
    return matchesSearch && (roleFilter === 'ALL' || user.role === roleFilter);
  }), [users, search, roleFilter]);

  async function sendAdminAction(user, path, body, successMessage) {
    setSavingId(user.id);
    setError('');
    setNotice('');
    try {
      const response = await fetch(API_BASE + path, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error?.message || 'The account update failed.');
      setNotice(successMessage);
      await loadUsers();
    } catch (err) {
      setError(err.message || 'The account update failed.');
    } finally {
      setSavingId(null);
    }
  }

  const approveStaff = (user, action) => sendAdminAction(
    user,
    '/auth/approve-officer/' + user.id,
    { action },
    user.name + ' was ' + (action === 'APPROVE' ? 'approved' : 'rejected') + '.',
  );

  const toggleActive = (user) => sendAdminAction(
    user,
    '/auth/users/' + user.id + '/status',
    { isActive: !user.isActive },
    user.name + "'s account was " + (user.isActive ? 'deactivated' : 'activated') + '.',
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-end gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User & Role Management</h1>
          <p className="text-sm text-slate-500">Review staff access and manage accounts from the CivicConnect database.</p>
        </div>
        <button onClick={loadUsers} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input type="search" placeholder="Search users by name or email..." value={search} onChange={(event) => setSearch(event.target.value)} className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
        </div>
        <div className="flex flex-wrap gap-2">
          {['ALL', 'CITIZEN', 'OFFICER', 'SUPERVISOR', 'ADMIN'].map((role) => (
            <button key={role} onClick={() => setRoleFilter(role)} className={roleFilter === role ? 'px-3 py-1.5 rounded-lg text-xs font-semibold transition bg-[#163A63] text-white' : 'px-3 py-1.5 rounded-lg text-xs font-semibold transition bg-slate-100 text-slate-600 hover:bg-slate-200'}>{role}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[760px] text-left border-collapse text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
            <tr><th className="p-4">User</th><th className="p-4">Role</th><th className="p-4">Department</th><th className="p-4">Access</th><th className="p-4 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && users.length === 0 ? (
              <tr><td colSpan="5" className="p-8 text-center text-slate-500">Loading user accounts…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="5" className="p-8 text-center text-slate-500">No database accounts match these filters.</td></tr>
            ) : filtered.map((user) => {
              const pending = ['OFFICER', 'SUPERVISOR'].includes(user.role) && user.approvalStatus === 'PENDING';
              return (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="p-4"><div className="font-semibold text-slate-900">{user.name}</div><div className="text-xs text-slate-500">{user.email}</div><div className="text-xs text-slate-400">{user.phone || 'No mobile on file'}</div></td>
                  <td className="p-4"><span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">{user.role}</span></td>
                  <td className="p-4 text-slate-600">{user.department?.name || user.ward || '—'}</td>
                  <td className="p-4"><span className={'inline-block w-2 h-2 rounded-full mr-2 ' + (user.isActive && user.approvalStatus === 'APPROVED' ? 'bg-emerald-500' : user.approvalStatus === 'PENDING' ? 'bg-amber-500' : 'bg-slate-400')} /><span className="text-xs font-medium text-slate-700">{user.approvalStatus === 'PENDING' ? 'PENDING APPROVAL' : user.approvalStatus === 'REJECTED' ? 'REJECTED' : user.isActive ? 'ACTIVE' : 'INACTIVE'}</span></td>
                  <td className="p-4 text-right">
                    {pending ? (
                      <div className="inline-flex gap-2">
                        <button disabled={savingId === user.id} onClick={() => approveStaff(user, 'APPROVE')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"><UserCheck size={14} /> Approve</button>
                        <button disabled={savingId === user.id} onClick={() => approveStaff(user, 'REJECT')} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 disabled:opacity-50"><UserX size={14} /> Reject</button>
                      </div>
                    ) : (
                      <button disabled={savingId === user.id || user.role === 'ADMIN'} onClick={() => toggleActive(user)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50"><ShieldCheck size={14} /> {user.isActive ? 'Deactivate' : 'Activate'}</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">Only administrator-approved Municipal and Field Officer accounts can sign in. New staff registrations remain pending until reviewed.</p>
    </div>
  );
}

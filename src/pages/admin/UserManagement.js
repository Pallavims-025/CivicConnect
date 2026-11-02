<<<<<<< HEAD
import React, { useState } from 'react';
import { Search, Plus, Shield, User, Building2, Phone, Mail, Edit3, Trash2, X, Check, AlertCircle } from 'lucide-react';
import { useCivic } from '../../context/CivicContext';

export function UserManagement() {
  const { users, addUser, updateUser, deleteUser, departments } = useCivic();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);

  // New user form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'officer',
    dept: 'Road Infrastructure & Maintenance',
    status: 'ACTIVE',
  });

  const [formError, setFormError] = useState('');

  // Filtering
  const filtered = (users || []).filter((u) => {
    const matchSearch =
      (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.dept || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || (u.role || '').toUpperCase() === roleFilter;
    return matchSearch && matchRole;
  });

  // KPI counts
  const totalUsers = users?.length || 0;
  const officersCount = users?.filter((u) => (u.role || '').toLowerCase() === 'officer').length || 0;
  const supervisorsCount = users?.filter((u) => (u.role || '').toLowerCase() === 'supervisor').length || 0;
  const citizensCount = users?.filter((u) => (u.role || '').toLowerCase() === 'citizen').length || 0;

  const handleAddSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!newUser.name.trim() || !newUser.email.trim()) {
      setFormError('Please fill in both name and email.');
      return;
    }

    // Check duplicate email
    if (users.some((u) => u.email.toLowerCase() === newUser.email.trim().toLowerCase())) {
      setFormError('A user with this email already exists.');
      return;
    }

    addUser({
      name: newUser.name.trim(),
      email: newUser.email.trim(),
      phone: newUser.phone.trim(),
      role: newUser.role,
      dept: newUser.role === 'citizen' ? 'N/A' : newUser.dept,
      status: newUser.status,
    });

    setNewUser({
      name: '',
      email: '',
      phone: '',
      role: 'officer',
      dept: departments?.[0]?.name || 'Road Infrastructure & Maintenance',
      status: 'ACTIVE',
    });
    setShowAddModal(false);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingUser) return;

    updateUser(editingUser.id, {
      name: editingUser.name,
      role: editingUser.role,
      dept: editingUser.role === 'citizen' ? 'N/A' : editingUser.dept,
      status: editingUser.status,
      phone: editingUser.phone,
    });

    setEditingUser(null);
  };

  const handleDelete = (userId) => {
    deleteUser(userId);
    setDeleteConfirmUser(null);
  };

  const getRoleBadgeClass = (role) => {
    switch ((role || '').toLowerCase()) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'officer':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'supervisor':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'citizen':
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User & Role Management</h1>
          <p className="text-sm text-slate-500">
            Configure platform permissions across Citizens, Municipal Officers, Supervisors, and Administrators
          </p>
        </div>
        <button
          onClick={() => {
            setFormError('');
            setShowAddModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 shadow-xs transition"
        >
          <Plus size={16} /> Add System User
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Users</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalUsers}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Platform registered accounts</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Officers</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">{officersCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Triage & verification staff</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Supervisors</div>
          <div className="text-2xl font-extrabold text-amber-700 mt-1">{supervisorsCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Field operations units</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Citizens</div>
          <div className="text-2xl font-extrabold text-blue-700 mt-1">{citizensCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Public portal users</div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {['ALL', 'ADMIN', 'OFFICER', 'SUPERVISOR', 'CITIZEN'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                roleFilter === r
                  ? 'bg-[#163A63] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r}
            </button>
=======
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
>>>>>>> c4ea025775427627c398aca7f22d92c3685098df
          ))}
        </div>
      </div>

<<<<<<< HEAD
      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Department / Jurisdiction</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400 text-xs">
                    No system users match the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="p-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        {u.name}
                        {u.role === 'admin' && (
                          <span className="p-0.5 bg-purple-100 text-purple-700 rounded text-[10px]" title="Platform Admin">
                            <Shield size={12} />
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <Mail size={12} className="text-slate-400" />
                        <span>{u.email}</span>
                        {u.phone && (
                          <>
                            <span className="text-slate-300">•</span>
                            <Phone size={12} className="text-slate-400" />
                            <span>{u.phone}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase ${getRoleBadgeClass(
                          u.role
                        )}`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Building2 size={13} className="text-slate-400" />
                        <span>{u.dept || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            u.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        <span className="text-xs font-medium text-slate-700">{u.status || 'ACTIVE'}</span>
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingUser({ ...u })}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition flex items-center gap-1"
                        >
                          <Edit3 size={13} /> Edit
                        </button>
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => setDeleteConfirmUser(u)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete User"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD USER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Add New System User</h3>
                <p className="text-xs text-slate-500">Create an account with role-based access rights</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Nayak"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="ramesh@municipal.gov"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 94480 12345"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">Assigned Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="officer">Municipal Officer</option>
                    <option value="supervisor">Field Supervisor</option>
                    <option value="citizen">Citizen</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">Initial Status</label>
                  <select
                    value={newUser.status}
                    onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>

              {newUser.role !== 'citizen' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">Department Assignment</label>
                  <select
                    value={newUser.dept}
                    onChange={(e) => setNewUser({ ...newUser, dept: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    {(departments || []).map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                    <option value="IT & Governance">IT & Governance</option>
                    <option value="Central Ward Operations">Central Ward Operations</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                >
                  Create User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Edit User Access & Role</h3>
                <p className="text-xs text-slate-500">Updating credentials for {editingUser.name}</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">Email (Read-Only)</label>
                <input
                  type="email"
                  disabled
                  value={editingUser.email}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">Role</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="admin">System Admin</option>
                    <option value="officer">Municipal Officer</option>
                    <option value="supervisor">Field Supervisor</option>
                    <option value="citizen">Citizen</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">Account Status</label>
                  <select
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              {editingUser.role !== 'citizen' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">Department Assignment</label>
                  <select
                    value={editingUser.dept}
                    onChange={(e) => setEditingUser({ ...editingUser, dept: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    {(departments || []).map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                    <option value="IT & Governance">IT & Governance</option>
                    <option value="Central Ward Operations">Central Ward Operations</option>
                    <option value="N/A">N/A</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base">Remove User Account?</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to delete <span className="font-semibold text-slate-800">{deleteConfirmUser.name}</span> ({deleteConfirmUser.email})? This action will be logged in system audit history.
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmUser.id)}
                className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
=======
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
>>>>>>> c4ea025775427627c398aca7f22d92c3685098df
    </div>
  );
}

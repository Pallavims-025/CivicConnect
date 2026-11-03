import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Shield,
  User,
  Building2,
  Phone,
  Mail,
  Edit3,
  Trash2,
  X,
  Check,
  AlertCircle,
  RefreshCw,
  UserCheck,
  UserX,
  ShieldCheck,
} from 'lucide-react';
import { useCivic } from '../../context/CivicContext';
import { useAuth } from '../../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export function UserManagement() {
  const { users: contextUsers, addUser, updateUser, deleteUser, departments } = useCivic();
  const auth = useAuth();
  const getToken = auth?.getToken;

  const [dbUsers, setDbUsers] = useState([]);
  const [useBackend, setUseBackend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [apiError, setApiError] = useState('');
  const [apiNotice, setApiNotice] = useState('');

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

  // Fetch users from backend if token exists
  const loadUsers = useCallback(async () => {
    if (!getToken) return;
    setLoading(true);
    setApiError('');
    try {
      const response = await fetch(`${API_BASE}/auth/users?limit=100`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const body = await response.json().catch(() => ({}));
      if (response.ok && Array.isArray(body.data)) {
        setDbUsers(body.data);
        setUseBackend(true);
      } else {
        setUseBackend(false);
      }
    } catch {
      setUseBackend(false);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Combine database users or context fallback
  const activeUsers = useBackend && dbUsers.length > 0 ? dbUsers : (contextUsers || []);

  // Filtering
  const filtered = useMemo(() => {
    return activeUsers.filter((u) => {
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        (u.name || '').toLowerCase().includes(query) ||
        (u.email || '').toLowerCase().includes(query) ||
        (u.dept || u.department?.name || '').toLowerCase().includes(query);
      const roleStr = (u.role || '').toUpperCase();
      const matchesRole = roleFilter === 'ALL' || roleStr === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [activeUsers, search, roleFilter]);

  // KPI counts
  const totalUsers = activeUsers.length;
  const officersCount = activeUsers.filter((u) => (u.role || '').toLowerCase() === 'officer').length;
  const supervisorsCount = activeUsers.filter((u) => (u.role || '').toLowerCase() === 'supervisor').length;
  const citizensCount = activeUsers.filter((u) => (u.role || '').toLowerCase() === 'citizen').length;

  const handleAddSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!newUser.name.trim() || !newUser.email.trim()) {
      setFormError('Please fill in both name and email.');
      return;
    }

    if (activeUsers.some((u) => u.email.toLowerCase() === newUser.email.trim().toLowerCase())) {
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

  // Backend actions (Approve staff, toggle status)
  async function sendAdminAction(user, path, body, successMessage) {
    if (!getToken) return;
    setSavingId(user.id);
    setApiError('');
    setApiNotice('');
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error?.message || 'Action failed.');
      setApiNotice(successMessage);
      await loadUsers();
    } catch (err) {
      setApiError(err.message || 'Action failed.');
    } finally {
      setSavingId(null);
    }
  }

  const approveStaff = (user, action) =>
    sendAdminAction(
      user,
      `/auth/approve-officer/${user.id}`,
      { action },
      `${user.name} was ${action === 'APPROVE' ? 'approved' : 'rejected'}.`
    );

  const toggleActive = (user) =>
    sendAdminAction(
      user,
      `/auth/users/${user.id}/status`,
      { isActive: !user.isActive },
      `${user.name}'s account was ${user.isActive ? 'deactivated' : 'activated'}.`
    );

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
        <div className="flex items-center gap-2">
          {useBackend && (
            <button
              onClick={loadUsers}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh DB
            </button>
          )}
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
      </div>

      {apiError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{apiError}</span>
        </div>
      )}
      {apiNotice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 flex items-center gap-2">
          <Check size={16} />
          <span>{apiNotice}</span>
        </div>
      )}

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
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Department / Jurisdiction</th>
                <th className="p-4">Status / Access</th>
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
                filtered.map((u) => {
                  const roleLower = (u.role || '').toLowerCase();
                  const isStaff = ['officer', 'supervisor'].includes(roleLower);
                  const isPendingApproval = isStaff && u.approvalStatus === 'PENDING';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      <td className="p-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          {u.name}
                          {roleLower === 'admin' && (
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
                          <span>{u.dept || u.department?.name || u.ward || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {isPendingApproval ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            PENDING APPROVAL
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {u.status || (u.isActive ? 'ACTIVE' : 'INACTIVE')}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {isPendingApproval && useBackend ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              disabled={savingId === u.id}
                              onClick={() => approveStaff(u, 'APPROVE')}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              <UserCheck size={13} /> Approve
                            </button>
                            <button
                              disabled={savingId === u.id}
                              onClick={() => approveStaff(u, 'REJECT')}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                            >
                              <UserX size={13} /> Reject
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => setEditingUser({ ...u })}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <Edit3 size={13} /> Edit
                            </button>
                            {roleLower !== 'admin' && (
                              <button
                                onClick={() => setDeleteConfirmUser(u)}
                                className="text-xs font-semibold text-rose-500 hover:text-rose-700 flex items-center gap-1 ml-2"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
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
                    <option value="INACTIVE">INACTIVE</option>
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
                  Create User
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
                <h3 className="font-bold text-slate-900 text-lg">Edit User Permissions</h3>
                <p className="text-xs text-slate-500">Update role assignment and account status</p>
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
                <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">Email Address</label>
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
    </div>
  );
}

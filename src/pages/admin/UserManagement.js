import React, { useState } from 'react';
import { Search, UserCheck, Shield, Plus } from 'lucide-react';

export function UserManagement() {
    const [users, setUsers] = useState([
        { id: 'USR-01', name: 'Dr. Aruna Rao', email: 'aruna.rao@municipal.gov', role: 'officer', dept: 'Public Works', status: 'ACTIVE' },
        { id: 'USR-02', name: 'Rajesh Kumar', email: 'rajesh.k@field.gov', role: 'supervisor', dept: 'Zone 4 Operations', status: 'ACTIVE' },
        { id: 'USR-03', name: 'Priya Sharma', email: 'priya.s@gmail.com', role: 'citizen', dept: 'N/A', status: 'ACTIVE' },
        { id: 'USR-04', name: 'Santosh (Admin)', email: 'admin@civicconnect.org', role: 'admin', dept: 'IT & Governance', status: 'ACTIVE' }
    ]);

    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');

    const filtered = users.filter(u => {
        const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
        const matchRole = roleFilter === 'ALL' || u.role.toUpperCase() === roleFilter;
        return matchSearch && matchRole;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">User & Role Management</h1>
                    <p className="text-sm text-slate-500">Configure access rights across Citizens, Municipal Officers, and Field Supervisors</p>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 hover:bg-blue-700 transition">
                    <Plus size={16} /> Add System User
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
                <div className="relative flex-1 min-w-[240px]">
                    <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                </div>

                <div className="flex gap-2">
                    {['ALL', 'CITIZEN', 'OFFICER', 'SUPERVISOR', 'ADMIN'].map((r) => (
                        <button
                            key={r}
                            onClick={() => setRoleFilter(r)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${roleFilter === r ? 'bg-[#163A63] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                        <tr>
                            <th className="p-4">User</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Department</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50">
                                <td className="p-4">
                                    <div className="font-semibold text-slate-900">{u.name}</div>
                                    <div className="text-xs text-slate-500">{u.email}</div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                        u.role === 'officer' ? 'bg-emerald-100 text-emerald-700' :
                                            u.role === 'supervisor' ? 'bg-amber-100 text-amber-700' :
                                                'bg-blue-100 text-blue-700'
                                        }`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="p-4 text-slate-600">{u.dept}</td>
                                <td className="p-4">
                                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                                    <span className="text-xs font-medium text-slate-700">{u.status}</span>
                                </td>
                                <td className="p-4 text-right">
                                    <button className="text-xs font-semibold text-blue-600 hover:underline mr-3">Edit Role</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
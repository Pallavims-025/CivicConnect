import React, { useState } from 'react';
import { Building2, Plus } from 'lucide-react';

export function DepartmentConfig() {
    const [departments, setDepartments] = useState([
        { id: 'D-1', name: 'Road Infrastructure & Maintenance', head: 'Er. Sandeep Verma', categories: ['Potholes', 'Road Resurfacing', 'Footpath Repair'] },
        { id: 'D-2', name: 'Solid Waste Management', head: 'Dr. Kavita Nair', categories: ['Garbage Overflow', 'Illegal Dumping', 'Drainage Cleaning'] },
        { id: 'D-3', name: 'Street Lighting & Electrical Works', head: 'Er. Mohammed Farooq', categories: ['Streetlight Outage', 'Sparking Cable', 'Broken Pole'] },
        { id: 'D-4', name: 'Water Supply & Sewage Board', head: 'Er. Lakshmi Narayan', categories: ['Pipe Leakage', 'Contaminated Water', 'Low Pressure'] }
    ]);

    const [name, setName] = useState('');
    const [head, setHead] = useState('');

    const handleAdd = (e) => {
        e.preventDefault();
        if (!name) return;
        setDepartments([...departments, { id: `D-${departments.length + 1}`, name, head: head || 'Assigned Officer', categories: ['General Civic Work'] }]);
        setName('');
        setHead('');
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Municipal Departments & Categories</h1>
                <p className="text-sm text-slate-500">Configure civic departments and assign issue classification categories</p>
            </div>

            <form onSubmit={handleAdd} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Department Name</label>
                    <input
                        type="text"
                        placeholder="e.g. Parks & Gardens"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Department Head</label>
                    <input
                        type="text"
                        placeholder="Officer in charge"
                        value={head}
                        onChange={(e) => setHead(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                </div>
                <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 hover:bg-blue-700 transition">
                    <Plus size={16} /> Add Department
                </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {departments.map((dept) => (
                    <div key={dept.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Building2 size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">{dept.name}</h4>
                                <p className="text-xs text-slate-500">Head: {dept.head}</p>
                            </div>
                        </div>
                        <div>
                            <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Categories Handled</div>
                            <div className="flex flex-wrap gap-1.5">
                                {dept.categories.map((c, i) => (
                                    <span key={i} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs">
                                        {c}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
import React, { useState } from 'react';
import { Building2, Plus, X, Edit3, Trash2, Mail, Phone, MapPin, Tag, Check, AlertCircle } from 'lucide-react';
import { useCivic } from '../../context/CivicContext';

export function DepartmentConfig() {
  const {
    departments,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    addCategoryToDepartment,
    removeCategoryFromDepartment,
  } = useCivic();

  // New Department Form State
  const [name, setName] = useState('');
  const [head, setHead] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [zone, setZone] = useState('Zone 1-4');
  const [categoriesInput, setCategoriesInput] = useState('');
  const [formError, setFormError] = useState('');

  // Inline Category Adding state per department card
  const [activeCategoryInputDeptId, setActiveCategoryInputDeptId] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Edit Department Modal State
  const [editingDept, setEditingDept] = useState(null);

  // Delete Confirmation State
  const [deletingDept, setDeletingDept] = useState(null);

  const handleCreateDepartment = (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Please enter a department name.');
      return;
    }

    const categoriesList = categoriesInput
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    addDepartment({
      name: name.trim(),
      head: head.trim() || 'Officer in Charge',
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      zone: zone.trim() || 'Zone 1-4',
      categories: categoriesList.length > 0 ? categoriesList : ['General Civic Work'],
    });

    setName('');
    setHead('');
    setContactEmail('');
    setContactPhone('');
    setZone('Zone 1-4');
    setCategoriesInput('');
  };

  const handleAddCategoryInline = (deptId) => {
    if (!newCategoryName.trim()) {
      setActiveCategoryInputDeptId(null);
      return;
    }
    addCategoryToDepartment(deptId, newCategoryName.trim());
    setNewCategoryName('');
    setActiveCategoryInputDeptId(null);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingDept) return;

    updateDepartment(editingDept.id, {
      name: editingDept.name.trim(),
      head: editingDept.head.trim(),
      contactEmail: editingDept.contactEmail.trim(),
      contactPhone: editingDept.contactPhone.trim(),
      zone: editingDept.zone.trim(),
    });

    setEditingDept(null);
  };

  const handleDelete = (deptId) => {
    deleteDepartment(deptId);
    setDeletingDept(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Municipal Departments & Categories</h1>
        <p className="text-sm text-slate-500">
          Configure municipal divisions, assign engineering heads, and define civic issue classification categories
        </p>
      </div>

      {/* Add Department Form */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Building2 className="text-blue-600 w-4 h-4" /> Add Municipal Department
        </h3>

        {formError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateDepartment} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Department Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Parks, Lakes & Biodiversity"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Department Head (Officer)
              </label>
              <input
                type="text"
                placeholder="e.g. Er. Ananya Deshmukh"
                value={head}
                onChange={(e) => setHead(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Operational Zone / Jurisdiction
              </label>
              <input
                type="text"
                placeholder="e.g. Central Zone (Wards 1-8)"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Official Email
              </label>
              <input
                type="email"
                placeholder="parks@civicconnect.org"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Helpline / Phone
              </label>
              <input
                type="text"
                placeholder="+91 80 2297 5005"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Categories (Comma Separated)
              </label>
              <input
                type="text"
                placeholder="Fallen Trees, Park Maintenance"
                value={categoriesInput}
                onChange={(e) => setCategoriesInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 shadow-xs transition"
            >
              <Plus size={16} /> Register Department
            </button>
          </div>
        </form>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {(departments || []).map((dept) => (
          <div
            key={dept.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover:border-slate-300 transition"
          >
            {/* Top Row: Icon + Name + Actions */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Building2 size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{dept.name}</h4>
                  <p className="text-xs text-slate-500 font-medium">Head: {dept.head || 'Unassigned'}</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingDept({ ...dept })}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  title="Edit Department"
                >
                  <Edit3 size={15} />
                </button>
                <button
                  onClick={() => setDeletingDept(dept)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Delete Department"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* Jurisdiction & Contact Details */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
              <div className="flex items-center gap-1.5 truncate">
                <MapPin size={13} className="text-slate-400 shrink-0" />
                <span className="truncate">{dept.zone || 'Zone 1-4'}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <Phone size={13} className="text-slate-400 shrink-0" />
                <span className="truncate">{dept.contactPhone || 'N/A'}</span>
              </div>
              <div className="col-span-2 flex items-center gap-1.5 truncate">
                <Mail size={13} className="text-slate-400 shrink-0" />
                <span className="truncate">{dept.contactEmail || 'N/A'}</span>
              </div>
            </div>

            {/* Categories Section */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Tag size={12} /> Categories Handled ({dept.categories?.length || 0})
                </span>
                {activeCategoryInputDeptId !== dept.id && (
                  <button
                    onClick={() => {
                      setActiveCategoryInputDeptId(dept.id);
                      setNewCategoryName('');
                    }}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                  >
                    <Plus size={12} /> Add Category
                  </button>
                )}
              </div>

              {/* Inline category input */}
              {activeCategoryInputDeptId === dept.id && (
                <div className="flex items-center gap-2 mb-2 p-2 bg-blue-50/60 rounded-xl border border-blue-100">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Enter category name..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCategoryInline(dept.id);
                      } else if (e.key === 'Escape') {
                        setActiveCategoryInputDeptId(null);
                      }
                    }}
                    className="flex-1 px-2.5 py-1 text-xs border border-blue-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                  <button
                    onClick={() => handleAddCategoryInline(dept.id)}
                    className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setActiveCategoryInputDeptId(null)}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Category Pills with Remove Action */}
              <div className="flex flex-wrap gap-1.5">
                {(dept.categories || []).map((cat, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 group"
                  >
                    <span>{cat}</span>
                    <button
                      onClick={() => removeCategoryFromDepartment(dept.id, cat)}
                      className="text-slate-400 hover:text-rose-600 transition ml-0.5"
                      title={`Remove ${cat}`}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* EDIT DEPARTMENT MODAL */}
      {editingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Edit Department</h3>
                <p className="text-xs text-slate-500">Update organizational and contact details</p>
              </div>
              <button
                onClick={() => setEditingDept(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  Department Name
                </label>
                <input
                  type="text"
                  required
                  value={editingDept.name}
                  onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                    Department Head
                  </label>
                  <input
                    type="text"
                    value={editingDept.head}
                    onChange={(e) => setEditingDept({ ...editingDept, head: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                    Zone Coverage
                  </label>
                  <input
                    type="text"
                    value={editingDept.zone || ''}
                    onChange={(e) => setEditingDept({ ...editingDept, zone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={editingDept.contactEmail || ''}
                    onChange={(e) => setEditingDept({ ...editingDept, contactEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={editingDept.contactPhone || ''}
                    onChange={(e) => setEditingDept({ ...editingDept, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base">Delete Department?</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to remove <span className="font-semibold text-slate-800">{deletingDept.name}</span>?
              Associated complaints and categories will need to be reallocated.
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setDeletingDept(null)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingDept.id)}
                className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700"
              >
                Delete Department
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

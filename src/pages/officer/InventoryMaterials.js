import React, { useState } from 'react';
import {
  Package,
  Layers,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  Search,
  Box,
  Truck,
  RotateCcw,
} from 'lucide-react';
import { useCivic } from '../../context/CivicContext';
import { StatusBadge } from '../../components/common/StatusBadge';

export function InventoryMaterials() {
  const {
    inventory,
    materialRequests,
    adjustInventoryStock,
    addInventoryItem,
    handleMaterialRequest,
  } = useCivic();

  const [activeTab, setActiveTab] = useState('INVENTORY'); // 'INVENTORY' | 'REQUESTS'
  const [searchTerm, setSearchTerm] = useState('');

  // Stock Adjustment Modal
  const [adjustItem, setAdjustItem] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState(10);
  const [adjustReason, setAdjustReason] = useState('Quarterly Municipal Yard Restock');

  // New Item Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Road Repair');
  const [newDesc, setNewDesc] = useState('');
  const [newQty, setNewQty] = useState(50);
  const [newUnit, setNewUnit] = useState('Bags');
  const [newMin, setNewMin] = useState(20);
  const [newCost, setNewCost] = useState('₹ 500');

  // Request Decision Modal
  const [decisionModalReq, setDecisionModalReq] = useState(null);
  const [decisionType, setDecisionType] = useState('APPROVED');
  const [decisionNotes, setDecisionNotes] = useState('Approved according to standard ward allocation.');

  const filteredInventory = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdjustSubmit = (e) => {
    e.preventDefault();
    if (!adjustItem) return;
    adjustInventoryStock(adjustItem.id, parseInt(adjustAmount), adjustReason);
    setAdjustItem(null);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      alert('Please specify an item name.');
      return;
    }
    addInventoryItem({
      name: newName,
      category: newCategory,
      description: newDesc,
      availableQuantity: parseInt(newQty),
      unit: newUnit,
      minThreshold: parseInt(newMin),
      unitCost: newCost,
    });
    setShowAddModal(false);
    setNewName('');
    setNewDesc('');
  };

  const handleDecisionSubmit = (e) => {
    e.preventDefault();
    if (!decisionModalReq) return;
    handleMaterialRequest(decisionModalReq.id, decisionType, null, decisionNotes);
    setDecisionModalReq(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-civic-text flex items-center space-x-2">
            <Package className="w-6 h-6 text-civic-blue" />
            <span>Materials & Central Yard Inventory</span>
          </h2>
          <p className="text-xs text-civic-muted">
            Track spare parts, asphalt bags, lighting units, and approve material dispatches for field work orders.
          </p>
        </div>

        {activeTab === 'INVENTORY' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-2 bg-civic-blue hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-sm self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Stock Item</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-bold space-x-4">
        <button
          onClick={() => setActiveTab('INVENTORY')}
          className={`pb-3 px-2 border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'INVENTORY'
              ? 'border-civic-blue text-civic-blue'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Box className="w-4 h-4" />
          <span>Warehouse Inventory ({inventory.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('REQUESTS')}
          className={`pb-3 px-2 border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'REQUESTS'
              ? 'border-civic-blue text-civic-blue'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Material Requests ({materialRequests.length})</span>
          {materialRequests.filter((r) => r.status === 'PENDING').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          )}
        </button>
      </div>

      {/* TAB 1: INVENTORY TABLE */}
      {activeTab === 'INVENTORY' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search items by name or category..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60"
              />
            </div>
            <span className="text-xs text-slate-500">
              Low Stock Alert: <strong>{inventory.filter((i) => i.stockStatus !== 'IN_STOCK').length} items</strong>
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Item Code</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Available Stock</th>
                    <th className="py-3 px-4">Min Threshold</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Stock Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-civic-blue">
                        {item.id}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-bold text-slate-800">{item.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{item.description}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{item.category}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-sm font-extrabold text-slate-900">
                          {item.availableQuantity}
                        </span>{' '}
                        <span className="text-slate-500 text-[11px]">{item.unit}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {item.minThreshold} {item.unit}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={item.stockStatus} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setAdjustItem(item);
                            setAdjustAmount(10);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-civic-blue hover:text-white rounded-lg font-semibold text-slate-700 transition-colors"
                        >
                          Adjust Stock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MATERIAL REQUESTS */}
      {activeTab === 'REQUESTS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Request ID</th>
                    <th className="py-3 px-4">Work Order Ref</th>
                    <th className="py-3 px-4">Requested By</th>
                    <th className="py-3 px-4">Materials Requested</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {materialRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-civic-blue">
                        {req.id}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                        {req.workOrderId}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">{req.requestedBy}</p>
                        <p className="text-[11px] text-slate-400">{req.department}</p>
                      </td>
                      <td className="py-3.5 px-4 space-y-1">
                        {req.items.map((it, idx) => (
                          <div key={idx} className="flex items-center space-x-1.5">
                            <span className="font-bold text-slate-800">
                              {it.requestedQty} {it.unit}
                            </span>
                            <span className="text-slate-600">— {it.itemName}</span>
                          </div>
                        ))}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {req.status === 'PENDING' ? (
                          <div className="space-x-1.5">
                            <button
                              onClick={() => {
                                setDecisionModalReq(req);
                                setDecisionType('APPROVED');
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px]"
                            >
                              Approve Dispatch
                            </button>
                            <button
                              onClick={() => {
                                setDecisionModalReq(req);
                                setDecisionType('REJECTED');
                              }}
                              className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg font-bold text-[11px]"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            {req.decisionNotes || 'Completed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              Adjust Stock: {adjustItem.name}
            </h3>
            <p className="text-xs text-slate-500">
              Current Available Quantity: <strong>{adjustItem.availableQuantity} {adjustItem.unit}</strong>
            </p>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Quantity Adjustment (+ to add stock, - to write off)
                </label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reason for Adjustment
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAdjustItem(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-civic-blue text-white font-bold hover:bg-blue-700"
                >
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Stock Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Add Central Yard Stock Item</h3>
            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Item Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Bitumen Emulsion Drums (200L)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Road Repair">Road Repair</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Drainage">Drainage</option>
                    <option value="Sanitation">Sanitation</option>
                    <option value="Water Works">Water Works</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    placeholder="Bags, Units, Pipes"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Quantity</label>
                  <input
                    type="number"
                    value={newQty}
                    onChange={(e) => setNewQty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Threshold</label>
                  <input
                    type="number"
                    value={newMin}
                    onChange={(e) => setNewMin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Item Description</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Specification details and storage notes..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-civic-blue text-white font-bold hover:bg-blue-700"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decision Modal for Material Request */}
      {decisionModalReq && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              {decisionType === 'APPROVED' ? 'Approve' : 'Reject'} Material Request #{decisionModalReq.id}
            </h3>
            <p className="text-xs text-slate-500">
              For Work Order #{decisionModalReq.workOrderId} ({decisionModalReq.department}).
              {decisionType === 'APPROVED' && ' Approving will automatically deduct units from yard inventory.'}
            </p>

            <form onSubmit={handleDecisionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Decision Remarks</label>
                <textarea
                  rows={3}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setDecisionModalReq(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-white font-bold ${
                    decisionType === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Confirm {decisionType === 'APPROVED' ? 'Approval' : 'Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  PlusCircle,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  AlertTriangle,
  History,
  Building,
  ClipboardList,
  CheckCircle2,
  Trash2,
  Info,
} from 'lucide-react';
import { useCivic } from '../../context/CivicContext';

export function MaterialInventory() {
  const navigate = useNavigate();
  const {
    siteMaterials,
    materialTransactions,
    inventory,
    workOrders,
    recordMaterialTransaction,
    supervisorProfile,
  } = useCivic();

  const [searchTerm, setSearchTerm] = useState('');
  const [woFilter, setWoFilter] = useState('ALL');

  // Transaction Modal State
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [selectedMatId, setSelectedMatId] = useState('');
  const [txnWO, setTxnWO] = useState(workOrders[0]?.id || '');
  const [txnType, setTxnType] = useState('USED'); // 'RECEIVED' | 'USED' | 'RETURNED' | 'WASTE'
  const [txnQuantity, setTxnQuantity] = useState(1);
  const [txnReason, setTxnReason] = useState('');
  const [txnError, setTxnError] = useState('');

  // Active supervisor work orders
  const myWorkOrders = useMemo(() => {
    return workOrders.filter(
      (w) => !w.supervisor || w.supervisor.toLowerCase().includes('rao') || w.supervisor.toLowerCase().includes('supervisor')
    );
  }, [workOrders]);

  const filteredMaterials = useMemo(() => {
    return siteMaterials.filter((m) => {
      const matchSearch =
        m.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.materialId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.workOrderId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchWO = woFilter === 'ALL' || m.workOrderId === woFilter;
      return matchSearch && matchWO;
    });
  }, [siteMaterials, searchTerm, woFilter]);

  // Open transaction modal for a specific item
  const handleOpenTxnFor = (item, type = 'USED') => {
    setSelectedMatId(item.materialId);
    setTxnWO(item.workOrderId);
    setTxnType(type);
    setTxnQuantity(1);
    setTxnReason('');
    setTxnError('');
    setShowTxnModal(true);
  };

  // Submit Transaction
  const handleTransactionSubmit = (e) => {
    e.preventDefault();
    setTxnError('');

    try {
      const chosenItem = siteMaterials.find(
        (m) => m.materialId === selectedMatId && m.workOrderId === txnWO
      );

      const targetMat = chosenItem || inventory.find((inv) => inv.id === selectedMatId);

      recordMaterialTransaction({
        workOrderId: txnWO,
        materialId: selectedMatId,
        materialName: targetMat ? targetMat.name || targetMat.materialName : 'Site Material',
        unit: targetMat ? targetMat.unit : 'Units',
        type: txnType,
        quantity: parseInt(txnQuantity),
        reason: txnReason.trim() || `Recorded ${txnType.toLowerCase()} at work site`,
      });

      setShowTxnModal(false);
      alert('Material transaction successfully recorded!');
    } catch (err) {
      setTxnError(err.message || 'Error processing transaction.');
    }
  };

  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-civic-text flex items-center space-x-2">
            <Boxes className="w-6 h-6 text-civic-blue" />
            <span>Material Inventory Tracking</span>
          </h2>
          <p className="text-xs text-civic-muted mt-0.5">
            Track materials issued to work orders, record daily site consumption, calculate live balances, and return surplus supplies.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedMatId(inventory[0]?.id || '');
              setTxnType('RECEIVED');
              setShowTxnModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-civic-blue hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Material Transaction</span>
          </button>

          <button
            onClick={() => navigate('/supervisor/material-requests')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-colors"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Request Supplies</span>
          </button>
        </div>
      </div>

      {/* Distinction Banner: Central Warehouse vs. Site Issued Inventory (Section 11) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-civic-blue flex items-center justify-center shrink-0">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Central Municipal Stores
            </span>
            <p className="text-sm font-bold text-slate-800">Warehouse Inventory</p>
            <p className="text-[11px] text-slate-500">{inventory.length} Cataloged bulk items</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Issued to Work Orders
            </span>
            <p className="text-sm font-bold text-slate-800">Dispatched to Site</p>
            <p className="text-[11px] text-slate-500">{siteMaterials.length} Active job allocations</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Live Remaining Balance
            </span>
            <p className="text-sm font-bold text-slate-800">Site Usable Stock</p>
            <p className="text-[11px] text-slate-500">Remaining = Received - Used - Returned</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search material, ID, work order..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-civic-blue"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-500">Filter Work Order:</span>
          <select
            value={woFilter}
            onChange={(e) => setWoFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="ALL">All Active Work Orders</option>
            {myWorkOrders.map((wo) => (
              <option key={wo.id} value={wo.id}>
                {wo.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Work Site Inventory Table (Section 11) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Work Site Material Inventory Breakdown
          </h3>
          <span className="text-[11px] text-slate-400">
            Strict Mathematical Balance Verification Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-4 px-4">Material ID</th>
                <th className="py-4 px-4">Material Name & Unit</th>
                <th className="py-4 px-4">Work Order</th>
                <th className="py-4 px-4 text-center">Required</th>
                <th className="py-4 px-4 text-center">Approved</th>
                <th className="py-4 px-4 text-center text-blue-700 bg-blue-50/50">Received</th>
                <th className="py-4 px-4 text-center text-amber-700 bg-amber-50/50">Used</th>
                <th className="py-4 px-4 text-center text-purple-700 bg-purple-50/50">Returned</th>
                <th className="py-4 px-4 text-center text-emerald-800 bg-emerald-50/70 font-extrabold">Remaining</th>
                <th className="py-4 px-4">Last Txn</th>
                <th className="py-4 px-4 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    No material allocations found for this work order.
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((item) => {
                  const calculatedRemaining =
                    item.receivedQuantity - item.usedQuantity - item.returnedQuantity;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {item.materialId}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-bold text-slate-900">{item.materialName}</p>
                        <span className="text-[10px] text-slate-400">{item.unit}</span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-civic-blue">
                        #{item.workOrderId}
                      </td>

                      <td className="py-3.5 px-4 text-center font-medium text-slate-600">
                        {item.requiredQuantity}
                      </td>

                      <td className="py-3.5 px-4 text-center font-medium text-slate-600">
                        {item.approvedQuantity}
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-blue-700 bg-blue-50/20">
                        {item.receivedQuantity}
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-amber-700 bg-amber-50/20">
                        {item.usedQuantity}
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-purple-700 bg-purple-50/20">
                        {item.returnedQuantity}
                      </td>

                      <td className="py-3.5 px-4 text-center bg-emerald-50/30">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                            calculatedRemaining > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {calculatedRemaining} {item.unit}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                        {item.transactionDate}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleOpenTxnFor(item, 'USED')}
                            disabled={calculatedRemaining <= 0}
                            className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[10px] disabled:opacity-40 transition-colors"
                            title="Record Material Used"
                          >
                            Record Used
                          </button>

                          <button
                            onClick={() => handleOpenTxnFor(item, 'RETURNED')}
                            disabled={calculatedRemaining <= 0}
                            className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[10px] disabled:opacity-40 transition-colors"
                            title="Return Surplus Material to Warehouse"
                          >
                            Return Surplus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction History Audit Log (Section 11) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
            <History className="w-4 h-4 text-slate-400" />
            <span>Material Transaction Audit Log</span>
          </h3>
          <span className="text-[11px] text-slate-400">
            {materialTransactions.length} Recorded Movements
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Txn ID</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Material</th>
                <th className="py-3 px-4">Work Order</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Reason / Notes</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Supervisor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {materialTransactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{txn.id}</td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        txn.type === 'RECEIVED'
                          ? 'bg-blue-100 text-blue-800'
                          : txn.type === 'USED'
                          ? 'bg-amber-100 text-amber-800'
                          : txn.type === 'RETURNED'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {txn.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800">{txn.materialName}</td>
                  <td className="py-2.5 px-4 font-mono text-civic-blue">#{txn.workOrderId}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">
                    {txn.quantity} {txn.unit}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate">{txn.reason}</td>
                  <td className="py-2.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">{txn.timestamp}</td>
                  <td className="py-2.5 px-4 text-slate-700 font-medium">{txn.performedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================================================== */}
      {/* MODAL: RECORD MATERIAL TRANSACTION                  */}
      {/* ==================================================== */}
      {showTxnModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-civic-blue" />
                <span>Record Material Movement</span>
              </h3>
              <button onClick={() => setShowTxnModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>

            {txnError && (
              <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-xl flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{txnError}</span>
              </div>
            )}

            <form onSubmit={handleTransactionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Work Order *</label>
                <select
                  value={txnWO}
                  onChange={(e) => setTxnWO(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-civic-blue"
                  required
                >
                  {myWorkOrders.map((wo) => (
                    <option key={wo.id} value={wo.id}>
                      {wo.id} - {wo.complaintTitle.substring(0, 45)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Material *</label>
                <select
                  value={selectedMatId}
                  onChange={(e) => setSelectedMatId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-civic-blue"
                  required
                >
                  <option value="">-- Choose Material Item --</option>
                  {inventory.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.name} ({inv.unit}) - Central Stock: {inv.availableQuantity}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Movement Type *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { type: 'RECEIVED', label: 'Received', color: 'border-blue-300 bg-blue-50 text-blue-800' },
                    { type: 'USED', label: 'Used On-Site', color: 'border-amber-300 bg-amber-50 text-amber-800' },
                    { type: 'RETURNED', label: 'Return Surplus', color: 'border-purple-300 bg-purple-50 text-purple-800' },
                    { type: 'WASTE', label: 'Damaged/Wasted', color: 'border-rose-300 bg-rose-50 text-rose-800' },
                  ].map((btn) => (
                    <button
                      key={btn.type}
                      type="button"
                      onClick={() => setTxnType(btn.type)}
                      className={`p-2 rounded-xl text-center font-bold border transition-all ${
                        txnType === btn.type
                          ? `${btn.color} ring-2 ring-slate-800`
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  value={txnQuantity}
                  onChange={(e) => setTxnQuantity(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason / Site Location Notes</label>
                <textarea
                  value={txnReason}
                  onChange={(e) => setTxnReason(e.target.value)}
                  rows={2}
                  placeholder="e.g. Applied 4 bags to Metro Pillar 142 crater #1"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-civic-blue"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTxnModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-civic-blue hover:bg-blue-700 text-white font-bold shadow-md"
                >
                  Confirm Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

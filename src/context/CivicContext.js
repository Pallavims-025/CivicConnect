import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  INITIAL_CATEGORIES,
  INITIAL_CITIZEN,
  INITIAL_OFFICER,
  INITIAL_COMPLAINTS,
  INITIAL_WORK_ORDERS,
  INITIAL_INVENTORY,
  INITIAL_MATERIAL_REQUESTS,
  INITIAL_REPAIR_VERIFICATIONS,
  INITIAL_DUPLICATES,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
} from '../data/mockData';

const CivicContext = createContext();

export function CivicProvider({ children }) {
  const [currentRole, setCurrentRole] = useState('citizen'); // 'citizen' | 'officer'
  const [citizenProfile, setCitizenProfile] = useState(INITIAL_CITIZEN);
  const [officerProfile, setOfficerProfile] = useState(INITIAL_OFFICER);

  const [categories] = useState(INITIAL_CATEGORIES);
  const [complaints, setComplaints] = useState(INITIAL_COMPLAINTS);
  const [workOrders, setWorkOrders] = useState(INITIAL_WORK_ORDERS);
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [materialRequests, setMaterialRequests] = useState(INITIAL_MATERIAL_REQUESTS);
  const [verifications, setVerifications] = useState(INITIAL_REPAIR_VERIFICATIONS);
  const [duplicates, setDuplicates] = useState(INITIAL_DUPLICATES);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);

  const nowString = () => {
    const d = new Date();
    return d.toISOString().replace('T', ' ').substring(0, 16);
  };

  // Helper to log simulated audit action
  const logAudit = (actor, action, affectedRecord, details) => {
    const newLog = {
      id: `AUDIT-${Date.now().toString().slice(-4)}`,
      actor,
      action,
      affectedRecord,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Helper to push notification
  const pushNotification = (role, title, message, linkId) => {
    const newNotif = {
      id: `NOTIF-${Date.now().toString().slice(-4)}`,
      role,
      title,
      message,
      timestamp: nowString(),
      read: false,
      linkId,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // CITIZEN ACTION: Submit a new complaint
  const submitComplaint = ({ title, categoryId, description, address, latitude, longitude, photos }) => {
    const categoryObj = categories.find((c) => c.id === parseInt(categoryId)) || categories[0];
    const newId = `CC-2026-${1050 + complaints.length}`;
    const timestamp = nowString();

    const newComplaint = {
      id: newId,
      title,
      category: categoryObj.name,
      categoryId: categoryObj.id,
      description,
      address: address || 'Location specified on map',
      latitude: latitude ? parseFloat(latitude) : 12.9716,
      longitude: longitude ? parseFloat(longitude) : 77.5946,
      status: 'PENDING',
      priority: 'MEDIUM',
      reportedDate: timestamp,
      lastUpdated: timestamp,
      citizenId: citizenProfile.id,
      citizenName: citizenProfile.name,
      citizenPhone: citizenProfile.phone,
      assignedDepartment: 'Unassigned',
      workOrderId: null,
      photos: photos && photos.length > 0 ? photos : [
        'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
      ],
      timeline: [
        {
          date: timestamp,
          title: 'Complaint Registered',
          description: `Citizen submitted complaint under ${categoryObj.name}.`,
          by: citizenProfile.name,
        },
      ],
      feedback: null,
    };

    setComplaints((prev) => [newComplaint, ...prev]);

    // Cross-dashboard sync: push notification to municipal officers
    pushNotification(
      'officer',
      'New Citizen Complaint Reported',
      `${citizenProfile.name} submitted #${newId}: "${title}" in ${categoryObj.name}.`,
      newId
    );

    // Audit log
    logAudit(
      `${citizenProfile.name} (Citizen)`,
      'SUBMIT_COMPLAINT',
      `Complaint #${newId}`,
      `Filed new civic complaint "${title}" at ${address}.`
    );

    return newComplaint;
  };

  // OFFICER ACTION: Approve / classify complaint
  const approveComplaint = (complaintId, department, priority) => {
    const timestamp = nowString();
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === complaintId) {
          return {
            ...c,
            status: 'UNDER_REVIEW',
            assignedDepartment: department,
            priority: priority || c.priority,
            lastUpdated: timestamp,
            timeline: [
              ...c.timeline,
              {
                date: timestamp,
                title: 'Complaint Approved for Processing',
                description: `Assigned to ${department} with ${priority} priority.`,
                by: officerProfile.name,
              },
            ],
          };
        }
        return c;
      })
    );

    pushNotification(
      'citizen',
      'Complaint Under Review',
      `Your complaint #${complaintId} has been reviewed and assigned to ${department}.`,
      complaintId
    );

    logAudit(
      `${officerProfile.name} (Officer)`,
      'APPROVE_COMPLAINT',
      `Complaint #${complaintId}`,
      `Assigned to ${department} with ${priority} priority.`
    );
  };

  // OFFICER ACTION: Reject complaint with required reason
  const rejectComplaint = (complaintId, reason) => {
    const timestamp = nowString();
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === complaintId) {
          return {
            ...c,
            status: 'REJECTED',
            lastUpdated: timestamp,
            timeline: [
              ...c.timeline,
              {
                date: timestamp,
                title: 'Complaint Rejected',
                description: `Reason: ${reason}`,
                by: officerProfile.name,
              },
            ],
          };
        }
        return c;
      })
    );

    pushNotification(
      'citizen',
      'Complaint Update',
      `Your complaint #${complaintId} was reviewed: ${reason}`,
      complaintId
    );

    logAudit(
      `${officerProfile.name} (Officer)`,
      'REJECT_COMPLAINT',
      `Complaint #${complaintId}`,
      `Rejected with reason: ${reason}`
    );
  };

  // OFFICER ACTION: Create Work Order
  const createWorkOrder = ({ complaintId, department, supervisor, priority, workDescription, deadline, estimatedCost, assignedCrew }) => {
    const newWoId = `WO-2026-${(100 + workOrders.length).toString().padStart(3, '0')}`;
    const timestamp = nowString();
    const complaint = complaints.find((c) => c.id === complaintId);

    const newWO = {
      id: newWoId,
      complaintId,
      complaintTitle: complaint ? complaint.title : 'Municipal Civic Issue',
      department,
      supervisor,
      priority,
      workDescription,
      issuedDate: timestamp.split(' ')[0],
      deadline: deadline || '2026-10-25',
      status: 'IN_PROGRESS',
      estimatedCost: estimatedCost || '₹ 15,000',
      assignedCrew: assignedCrew || 'Ward Field Response Unit',
    };

    setWorkOrders((prev) => [newWO, ...prev]);

    // Update complaint status to IN_PROGRESS and link work order
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === complaintId) {
          return {
            ...c,
            status: 'IN_PROGRESS',
            workOrderId: newWoId,
            assignedDepartment: department,
            lastUpdated: timestamp,
            timeline: [
              ...c.timeline,
              {
                date: timestamp,
                title: 'Work Order Issued',
                description: `Work Order #${newWoId} assigned to ${supervisor} (${department}).`,
                by: officerProfile.name,
              },
            ],
          };
        }
        return c;
      })
    );

    pushNotification(
      'citizen',
      'Work Order Issued',
      `Field team deployed under #${newWoId} for your complaint #${complaintId}.`,
      complaintId
    );

    logAudit(
      `${officerProfile.name} (Officer)`,
      'CREATE_WORK_ORDER',
      `Work Order #${newWoId}`,
      `Created for #${complaintId}: ${workDescription}`
    );

    return newWO;
  };

  // OFFICER ACTION: Update work order status
  const updateWorkOrderStatus = (workOrderId, status) => {
    setWorkOrders((prev) =>
      prev.map((wo) => (wo.id === workOrderId ? { ...wo, status } : wo))
    );
    logAudit(`${officerProfile.name} (Officer)`, 'UPDATE_WORK_ORDER', `Work Order #${workOrderId}`, `Status updated to ${status}`);
  };

  // OFFICER ACTION: Inventory item stock adjustment
  const adjustInventoryStock = (itemId, adjustmentAmount, reason) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const newQty = Math.max(0, item.availableQuantity + adjustmentAmount);
          let stockStatus = 'IN_STOCK';
          if (newQty === 0) stockStatus = 'OUT_OF_STOCK';
          else if (newQty <= item.minThreshold) stockStatus = 'LOW_STOCK';

          return {
            ...item,
            availableQuantity: newQty,
            stockStatus,
            lastUpdated: nowString().split(' ')[0],
          };
        }
        return item;
      })
    );

    logAudit(
      `${officerProfile.name} (Officer)`,
      'ADJUST_INVENTORY',
      `Inventory Item #${itemId}`,
      `Stock adjusted by ${adjustmentAmount > 0 ? '+' : ''}${adjustmentAmount}. Reason: ${reason}`
    );
  };

  // OFFICER ACTION: Add new inventory item
  const addInventoryItem = (newItemData) => {
    const newItem = {
      id: `INV-${(inventory.length + 1).toString().padStart(2, '0')}`,
      ...newItemData,
      lastUpdated: nowString().split(' ')[0],
      stockStatus: newItemData.availableQuantity <= newItemData.minThreshold ? 'LOW_STOCK' : 'IN_STOCK',
    };
    setInventory((prev) => [...prev, newItem]);
    logAudit(`${officerProfile.name} (Officer)`, 'ADD_INVENTORY', `Item #${newItem.id}`, `Added ${newItem.name}`);
  };

  // OFFICER ACTION: Approve / Reject Material Request
  const handleMaterialRequest = (requestId, decision, approvedQtyMap, notes) => {
    const timestamp = nowString();
    setMaterialRequests((prev) =>
      prev.map((mr) => {
        if (mr.id === requestId) {
          const updatedItems = mr.items.map((item) => {
            const approved = approvedQtyMap && approvedQtyMap[item.itemId] !== undefined
              ? approvedQtyMap[item.itemId]
              : item.requestedQty;
            return {
              ...item,
              approvedQty: decision === 'APPROVED' ? approved : 0,
            };
          });

          return {
            ...mr,
            status: decision,
            decisionNotes: notes || '',
            items: updatedItems,
          };
        }
        return mr;
      })
    );

    // If approved, deduct inventory accordingly
    if (decision === 'APPROVED') {
      const mr = materialRequests.find((m) => m.id === requestId);
      if (mr) {
        mr.items.forEach((item) => {
          const deductAmount = approvedQtyMap && approvedQtyMap[item.itemId] !== undefined
            ? approvedQtyMap[item.itemId]
            : item.requestedQty;
          adjustInventoryStock(item.itemId, -deductAmount, `Dispatched for Work Order #${mr.workOrderId}`);
        });
      }
    }

    logAudit(
      `${officerProfile.name} (Officer)`,
      decision === 'APPROVED' ? 'APPROVE_MATERIAL_REQUEST' : 'REJECT_MATERIAL_REQUEST',
      `Material Request #${requestId}`,
      `Decision: ${decision}. Notes: ${notes}`
    );
  };

  // OFFICER ACTION: Repair Verification
  const verifyRepair = (verificationId, decision, remarks) => {
    const timestamp = nowString();
    const verif = verifications.find((v) => v.id === verificationId);
    if (!verif) return;

    setVerifications((prev) =>
      prev.map((v) =>
        v.id === verificationId
          ? {
              ...v,
              status: decision === 'APPROVED' ? 'VERIFIED_APPROVED' : 'REWORK_REQUESTED',
              officerRemarks: remarks,
              verifiedAt: timestamp,
            }
          : v
      )
    );

    if (decision === 'APPROVED') {
      // Transition complaint to RESOLVED
      setComplaints((prev) =>
        prev.map((c) => {
          if (c.id === verif.complaintId) {
            return {
              ...c,
              status: 'RESOLVED',
              lastUpdated: timestamp,
              resolutionEvidence: [verif.completionPhoto],
              timeline: [
                ...c.timeline,
                {
                  date: timestamp,
                  title: 'Repair Verified & Resolved',
                  description: `Field inspection approved by ${officerProfile.name}. Remarks: ${remarks || 'Quality standards met.'}`,
                  by: officerProfile.name,
                },
              ],
            };
          }
          return c;
        })
      );

      // Complete work order
      setWorkOrders((prev) =>
        prev.map((wo) =>
          wo.id === verif.workOrderId ? { ...wo, status: 'COMPLETED' } : wo
        )
      );

      // Notify citizen to rate and give feedback
      pushNotification(
        'citizen',
        'Issue Resolved! Please Share Feedback',
        `Your complaint #${verif.complaintId} has been verified as repaired. How did we do?`,
        verif.complaintId
      );

      logAudit(
        `${officerProfile.name} (Officer)`,
        'VERIFY_AND_RESOLVE',
        `Complaint #${verif.complaintId}`,
        `Repair approved and resolved. Remarks: ${remarks}`
      );
    } else {
      // Rework requested
      setWorkOrders((prev) =>
        prev.map((wo) =>
          wo.id === verif.workOrderId ? { ...wo, status: 'REWORK_REQUIRED' } : wo
        )
      );

      setComplaints((prev) =>
        prev.map((c) => {
          if (c.id === verif.complaintId) {
            return {
              ...c,
              timeline: [
                ...c.timeline,
                {
                  date: timestamp,
                  title: 'Rework Requested by Officer',
                  description: `Repair rejected during inspection: ${remarks}. Crew sent back for correction.`,
                  by: officerProfile.name,
                },
              ],
            };
          }
          return c;
        })
      );

      logAudit(
        `${officerProfile.name} (Officer)`,
        'REWORK_REQUESTED',
        `Work Order #${verif.workOrderId}`,
        `Rework instructed: ${remarks}`
      );
    }
  };

  // CITIZEN ACTION: Submit feedback for resolved complaint
  const submitFeedback = (complaintId, rating, comment) => {
    const timestamp = nowString();
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === complaintId) {
          return {
            ...c,
            feedback: {
              rating: parseInt(rating),
              comment,
              submittedAt: timestamp,
            },
          };
        }
        return c;
      })
    );

    pushNotification(
      'officer',
      'Citizen Feedback Received',
      `${citizenProfile.name} rated resolution for #${complaintId} with ${rating} stars.`,
      complaintId
    );

    logAudit(
      `${citizenProfile.name} (Citizen)`,
      'SUBMIT_FEEDBACK',
      `Complaint #${complaintId}`,
      `Submitted ${rating}-star feedback: "${comment}"`
    );
  };

  // OFFICER ACTION: Duplicate Detection confirmation / dismissal
  const confirmDuplicate = (duplicateId, reason) => {
    const dup = duplicates.find((d) => d.id === duplicateId);
    if (!dup) return;

    setDuplicates((prev) =>
      prev.map((d) =>
        d.id === duplicateId
          ? { ...d, reviewStatus: 'CONFIRMED_DUPLICATE', reviewReason: reason }
          : d
      )
    );

    // Update suspected complaint notes
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === dup.suspectedComplaintId) {
          return {
            ...c,
            status: 'UNDER_REVIEW',
            description: `${c.description} [LINKED DUPLICATE OF ${dup.originalComplaintId}]`,
            timeline: [
              ...c.timeline,
              {
                date: nowString(),
                title: 'Duplicate Confirmed',
                description: `Linked to primary report #${dup.originalComplaintId}. Reason: ${reason}`,
                by: officerProfile.name,
              },
            ],
          };
        }
        return c;
      })
    );

    logAudit(
      `${officerProfile.name} (Officer)`,
      'CONFIRM_DUPLICATE',
      `Duplicate Review #${duplicateId}`,
      `Confirmed #${dup.suspectedComplaintId} duplicates #${dup.originalComplaintId}. Reason: ${reason}`
    );
  };

  const dismissDuplicate = (duplicateId) => {
    setDuplicates((prev) =>
      prev.map((d) => (d.id === duplicateId ? { ...d, reviewStatus: 'DISMISSED' } : d))
    );
    logAudit(`${officerProfile.name} (Officer)`, 'DISMISS_DUPLICATE', `Duplicate Review #${duplicateId}`, 'Marked as not a duplicate.');
  };

  // Notification actions
  const markNotificationRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Profile actions
  const updateCitizenProfile = (updated) => {
    setCitizenProfile((prev) => ({ ...prev, ...updated }));
    logAudit(`${citizenProfile.name} (Citizen)`, 'UPDATE_PROFILE', 'Citizen Account', 'Updated profile information.');
  };

  const updateOfficerProfile = (updated) => {
    setOfficerProfile((prev) => ({ ...prev, ...updated }));
    logAudit(`${officerProfile.name} (Officer)`, 'UPDATE_PROFILE', 'Officer Account', 'Updated officer contact details.');
  };

  return (
    <CivicContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        citizenProfile,
        setCitizenProfile,
        officerProfile,
        setOfficerProfile,
        categories,
        complaints,
        workOrders,
        inventory,
        materialRequests,
        verifications,
        duplicates,
        notifications,
        auditLogs,
        submitComplaint,
        approveComplaint,
        rejectComplaint,
        createWorkOrder,
        updateWorkOrderStatus,
        adjustInventoryStock,
        addInventoryItem,
        handleMaterialRequest,
        verifyRepair,
        submitFeedback,
        confirmDuplicate,
        dismissDuplicate,
        markNotificationRead,
        markAllNotificationsRead,
        updateCitizenProfile,
        updateOfficerProfile,
      }}
    >
      {children}
    </CivicContext.Provider>
  );
}

export const useCivic = () => {
  const context = useContext(CivicContext);
  if (!context) {
    throw new Error('useCivic must be used within a CivicProvider');
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  INITIAL_CATEGORIES,
  INITIAL_CITIZEN,
  INITIAL_OFFICER,
  INITIAL_SUPERVISOR,
  INITIAL_WORKERS,
  INITIAL_WORKER_TASKS,
  INITIAL_COMPLAINTS,
  INITIAL_WORK_ORDERS,
  INITIAL_INVENTORY,
  INITIAL_SITE_MATERIALS,
  INITIAL_MATERIAL_TRANSACTIONS,
  INITIAL_MATERIAL_REQUESTS,
  INITIAL_PROGRESS_REPORTS,
  INITIAL_REPAIR_VERIFICATIONS,
  INITIAL_DUPLICATES,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
} from '../data/mockData';

const CivicContext = createContext();

export function CivicProvider({ children }) {
  // Roles: 'citizen' | 'officer' | 'supervisor' | 'admin'
  const [currentRole, setCurrentRole] = useState('citizen');
  const [citizenProfile, setCitizenProfile] = useState(INITIAL_CITIZEN);
  const [officerProfile, setOfficerProfile] = useState(INITIAL_OFFICER);
  const [supervisorProfile, setSupervisorProfile] = useState(INITIAL_SUPERVISOR);

  const [categories] = useState(INITIAL_CATEGORIES);
  const [complaints, setComplaints] = useState(INITIAL_COMPLAINTS);
  const [workOrders, setWorkOrders] = useState(INITIAL_WORK_ORDERS);
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [materialRequests, setMaterialRequests] = useState(INITIAL_MATERIAL_REQUESTS);
  const [verifications, setVerifications] = useState(INITIAL_REPAIR_VERIFICATIONS);
  const [duplicates, setDuplicates] = useState(INITIAL_DUPLICATES);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);

  // Field Supervisor Specific Reactive States (Member 3)
  const [workers, setWorkers] = useState(INITIAL_WORKERS);
  const [workerTasks, setWorkerTasks] = useState(INITIAL_WORKER_TASKS);
  const [siteMaterials, setSiteMaterials] = useState(INITIAL_SITE_MATERIALS);
  const [materialTransactions, setMaterialTransactions] = useState(INITIAL_MATERIAL_TRANSACTIONS);
  const [progressReports, setProgressReports] = useState(INITIAL_PROGRESS_REPORTS);

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
  const pushNotification = (role, title, message, linkId, type = 'GENERAL') => {
    const newNotif = {
      id: `NOTIF-${Date.now().toString().slice(-4)}`,
      role,
      type,
      title,
      message,
      timestamp: nowString(),
      read: false,
      linkId,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // ==========================================
  // CITIZEN ACTIONS (Member 1)
  // ==========================================
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
      newId,
      'COMPLAINT'
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
      complaintId,
      'FEEDBACK'
    );

    logAudit(
      `${citizenProfile.name} (Citizen)`,
      'SUBMIT_FEEDBACK',
      `Complaint #${complaintId}`,
      `Submitted ${rating}-star feedback: "${comment}"`
    );
  };

  // ==========================================
  // MUNICIPAL OFFICER ACTIONS (Member 2)
  // ==========================================
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
      complaintId,
      'STATUS_UPDATE'
    );

    logAudit(
      `${officerProfile.name} (Officer)`,
      'APPROVE_COMPLAINT',
      `Complaint #${complaintId}`,
      `Assigned to ${department} with ${priority} priority.`
    );
  };

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
      complaintId,
      'STATUS_UPDATE'
    );

    logAudit(
      `${officerProfile.name} (Officer)`,
      'REJECT_COMPLAINT',
      `Complaint #${complaintId}`,
      `Rejected with reason: ${reason}`
    );
  };

  const createWorkOrder = ({ complaintId, department, supervisor, priority, workDescription, deadline, estimatedCost, assignedCrew }) => {
    const newWoId = `WO-2026-${(100 + workOrders.length).toString().padStart(3, '0')}`;
    const timestamp = nowString();
    const complaint = complaints.find((c) => c.id === complaintId);

    const newWO = {
      id: newWoId,
      complaintId,
      complaintTitle: complaint ? complaint.title : 'Municipal Civic Issue',
      category: complaint?.category || 'General Civic Issue',
      location: complaint?.address || 'Indiranagar Central Zone',
      department,
      supervisor: supervisor || supervisorProfile.name,
      priority,
      workDescription,
      issuedDate: timestamp.split(' ')[0],
      startDate: timestamp.split(' ')[0],
      deadline: deadline || '2026-10-25',
      estimatedCompletionDate: deadline || '2026-10-25',
      actualCompletionDate: null,
      status: 'IN_PROGRESS',
      progress: 0,
      estimatedCost: estimatedCost || '₹ 15,000',
      assignedCrew: assignedCrew || 'Ward Field Response Unit',
      assignedWorkers: [],
      siteNotes: [],
      blockers: [],
      delayReport: null,
      beforePhotos: complaint?.photos || [],
      afterPhotos: [],
      verificationStatus: 'NOT_SUBMITTED',
      rejectionReason: '',
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
                description: `Work Order #${newWoId} assigned to ${supervisor || supervisorProfile.name} (${department}).`,
                by: officerProfile.name,
              },
            ],
          };
        }
        return c;
      })
    );

    // Sync notification to citizen
    pushNotification(
      'citizen',
      'Work Order Issued',
      `Field team deployed under #${newWoId} for your complaint #${complaintId}.`,
      complaintId,
      'WORK_ORDER'
    );

    // Sync notification to field supervisor
    pushNotification(
      'supervisor',
      'New Work Order Assigned',
      `Officer ${officerProfile.name} assigned #${newWoId} (${complaint ? complaint.title : 'Civic Issue'}) to you. Target: ${deadline}.`,
      newWoId,
      'WORK_ORDER'
    );

    logAudit(
      `${officerProfile.name} (Officer)`,
      'CREATE_WORK_ORDER',
      `Work Order #${newWoId}`,
      `Created for #${complaintId}: ${workDescription}`
    );

    return newWO;
  };

  const updateWorkOrderStatus = (workOrderId, status) => {
    setWorkOrders((prev) =>
      prev.map((wo) => (wo.id === workOrderId ? { ...wo, status } : wo))
    );
    logAudit(`${officerProfile.name} (Officer)`, 'UPDATE_WORK_ORDER', `Work Order #${workOrderId}`, `Status updated to ${status}`);
  };

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

  const handleMaterialRequest = (requestId, decision, approvedQtyMap, notes) => {
    const timestamp = nowString();
    setMaterialRequests((prev) =>
      prev.map((mr) => {
        if (mr.id === requestId) {
          const updatedItems = (mr.items || []).map((item) => {
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
            status: decision === 'APPROVED' ? 'Approved' : 'Rejected',
            approvedQty: decision === 'APPROVED' ? (mr.requestedQty || mr.items?.[0]?.requestedQty || 0) : 0,
            decisionNotes: notes || '',
            items: updatedItems,
          };
        }
        return mr;
      })
    );

    // If approved, deduct central municipal warehouse inventory accordingly
    if (decision === 'APPROVED') {
      const mr = materialRequests.find((m) => m.id === requestId);
      if (mr && mr.items) {
        mr.items.forEach((item) => {
          const deductAmount = approvedQtyMap && approvedQtyMap[item.itemId] !== undefined
            ? approvedQtyMap[item.itemId]
            : item.requestedQty;
          adjustInventoryStock(item.itemId, -deductAmount, `Dispatched for Work Order #${mr.workOrderId}`);
        });
      }
    }

    // Sync notification to Field Supervisor!
    pushNotification(
      'supervisor',
      `Material Request ${decision === 'APPROVED' ? 'Approved' : 'Rejected'}`,
      `Officer ${officerProfile.name} ${decision.toLowerCase()} Request #${requestId}. ${notes ? `Notes: "${notes}"` : ''}`,
      requestId,
      decision === 'APPROVED' ? 'MATERIAL_APPROVED' : 'MATERIAL_REJECTED'
    );

    logAudit(
      `${officerProfile.name} (Officer)`,
      decision === 'APPROVED' ? 'APPROVE_MATERIAL_REQUEST' : 'REJECT_MATERIAL_REQUEST',
      `Material Request #${requestId}`,
      `Decision: ${decision}. Notes: ${notes}`
    );
  };

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
      // Transition complaint to RESOLVED (Only Municipal Officer can approve!)
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
          wo.id === verif.workOrderId
            ? {
                ...wo,
                status: 'COMPLETED',
                verificationStatus: 'VERIFIED_APPROVED',
                actualCompletionDate: timestamp.split(' ')[0],
              }
            : wo
        )
      );

      // Notify citizen to rate and give feedback
      pushNotification(
        'citizen',
        'Issue Resolved! Please Share Feedback',
        `Your complaint #${verif.complaintId} has been verified as repaired. How did we do?`,
        verif.complaintId,
        'RESOLVED'
      );

      // Notify supervisor that repair passed inspection
      pushNotification(
        'supervisor',
        'Repair Verification Completed',
        `Officer ${officerProfile.name} verified and approved #${verif.workOrderId}. Citizen notified for feedback.`,
        verif.workOrderId,
        'VERIFICATION_PASSED'
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
          wo.id === verif.workOrderId
            ? {
                ...wo,
                status: 'REWORK_REQUIRED',
                verificationStatus: 'REWORK_REQUESTED',
                rejectionReason: remarks,
              }
            : wo
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

      // Notify supervisor about corrective rework required
      pushNotification(
        'supervisor',
        'Corrective Rework Required',
        `Officer ${officerProfile.name} rejected verification for #${verif.workOrderId}: "${remarks}". Perform corrective work and re-upload evidence.`,
        verif.workOrderId,
        'REWORK'
      );

      logAudit(
        `${officerProfile.name} (Officer)`,
        'REWORK_REQUESTED',
        `Work Order #${verif.workOrderId}`,
        `Rework instructed: ${remarks}`
      );
    }
  };

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

  // ==========================================
  // FIELD SUPERVISOR ACTIONS (Member 3)
  // ==========================================

  // Profile update
  const updateSupervisorProfile = (updated) => {
    setSupervisorProfile((prev) => ({ ...prev, ...updated }));
    logAudit(`${supervisorProfile.name} (Field Supervisor)`, 'UPDATE_PROFILE', 'Supervisor Account', 'Updated profile information.');
  };

  // Worker task assignment actions
  const addWorkerTask = (taskData) => {
    const newTaskId = `TSK-${Date.now().toString().slice(-4)}`;
    const worker = workers.find((w) => w.id === taskData.workerId);
    const newTask = {
      id: newTaskId,
      workOrderId: taskData.workOrderId,
      complaintId: taskData.complaintId || '',
      workerId: taskData.workerId,
      workerName: worker ? worker.name : taskData.workerName,
      workerRole: worker ? worker.role : taskData.workerRole,
      taskDescription: taskData.taskDescription,
      assignedDate: nowString().split(' ')[0],
      deadline: taskData.deadline,
      progress: 0,
      status: 'Not Started',
      delayReason: '',
    };

    setWorkerTasks((prev) => [newTask, ...prev]);

    // Link worker to work order's assignedWorkers list
    if (worker) {
      setWorkOrders((prev) =>
        prev.map((wo) => {
          if (wo.id === taskData.workOrderId) {
            const currentWorkers = wo.assignedWorkers || [];
            if (!currentWorkers.includes(worker.name)) {
              return { ...wo, assignedWorkers: [...currentWorkers, worker.name] };
            }
          }
          return wo;
        })
      );
    }

    logAudit(
      `${supervisorProfile.name} (Supervisor)`,
      'CREATE_WORKER_TASK',
      `Task #${newTaskId}`,
      `Assigned "${taskData.taskDescription}" to ${newTask.workerName} under #${taskData.workOrderId}`
    );

    return newTask;
  };

  const updateWorkerTask = (taskId, updatedFields) => {
    setWorkerTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updated = { ...t, ...updatedFields };
          // If worker changed, update name and role
          if (updatedFields.workerId && updatedFields.workerId !== t.workerId) {
            const w = workers.find((w) => w.id === updatedFields.workerId);
            if (w) {
              updated.workerName = w.name;
              updated.workerRole = w.role;
            }
          }
          return updated;
        }
        return t;
      })
    );

    logAudit(
      `${supervisorProfile.name} (Supervisor)`,
      'UPDATE_WORKER_TASK',
      `Task #${taskId}`,
      `Updated fields: ${Object.keys(updatedFields).join(', ')}`
    );
  };

  const deleteWorkerTask = (taskId) => {
    setWorkerTasks((prev) => prev.filter((t) => t.id !== taskId));
    logAudit(`${supervisorProfile.name} (Supervisor)`, 'DELETE_WORKER_TASK', `Task #${taskId}`, 'Task deleted.');
  };

  // Assign multiple workers to a work order
  const assignWorkersToWorkOrder = (workOrderId, workerNames) => {
    setWorkOrders((prev) =>
      prev.map((wo) => (wo.id === workOrderId ? { ...wo, assignedWorkers: workerNames } : wo))
    );

    const timestamp = nowString();
    const wo = workOrders.find((w) => w.id === workOrderId);
    if (wo) {
      setComplaints((prev) =>
        prev.map((c) => {
          if (c.id === wo.complaintId) {
            return {
              ...c,
              timeline: [
                ...c.timeline,
                {
                  date: timestamp,
                  title: 'Crew Assigned to Work Order',
                  description: `Field supervisor ${supervisorProfile.name} deployed crew: ${workerNames.join(', ')}.`,
                  by: supervisorProfile.name,
                },
              ],
            };
          }
          return c;
        })
      );
    }

    logAudit(
      `${supervisorProfile.name} (Supervisor)`,
      'ASSIGN_CREW',
      `Work Order #${workOrderId}`,
      `Assigned workers: ${workerNames.join(', ')}`
    );
  };

  // Repair Progress Update (Section 9)
  // CRITICAL REQUIREMENT: Even at 100%, complaint MUST NOT automatically become Resolved!
  const updateWorkOrderProgress = (workOrderId, { progress, progressNotes, blockers, estimatedCompletionDate, notifyOfficer }) => {
    const numProgress = Math.min(100, Math.max(0, parseInt(progress) || 0));
    const timestamp = nowString();

    setWorkOrders((prev) =>
      prev.map((wo) => {
        if (wo.id === workOrderId) {
          const notes = wo.siteNotes || [];
          const updatedNotes = progressNotes
            ? [{ date: timestamp, text: progressNotes, author: supervisorProfile.name }, ...notes]
            : notes;

          return {
            ...wo,
            progress: numProgress,
            estimatedCompletionDate: estimatedCompletionDate || wo.estimatedCompletionDate,
            blockers: blockers || wo.blockers,
            siteNotes: updatedNotes,
            lastUpdated: timestamp,
          };
        }
        return wo;
      })
    );

    const wo = workOrders.find((w) => w.id === workOrderId);
    if (wo) {
      // Append timeline event to citizen complaint without auto-resolving
      setComplaints((prev) =>
        prev.map((c) => {
          if (c.id === wo.complaintId) {
            const isFinished = numProgress === 100;
            return {
              ...c,
              lastUpdated: timestamp,
              timeline: [
                ...c.timeline,
                {
                  date: timestamp,
                  title: `Repair Progress: ${numProgress}%`,
                  description: isFinished
                    ? `Physical repair completed on-site (100%). Awaiting supervisor photo submission and municipal officer verification.`
                    : progressNotes || `Repair progress updated to ${numProgress}%. Blockers: ${blockers?.length ? blockers.join(', ') : 'None'}`,
                  by: supervisorProfile.name,
                },
              ],
            };
          }
          return c;
        })
      );

      // Notify officer if requested
      if (notifyOfficer) {
        pushNotification(
          'officer',
          'Field Repair Progress Update',
          `Supervisor ${supervisorProfile.name} updated #${workOrderId} to ${numProgress}%. ${progressNotes ? `Note: "${progressNotes}"` : ''}`,
          workOrderId,
          'PROGRESS_UPDATE'
        );
      }
    }

    logAudit(
      `${supervisorProfile.name} (Supervisor)`,
      'UPDATE_PROGRESS',
      `Work Order #${workOrderId}`,
      `Progress updated to ${numProgress}%. Notes: ${progressNotes || 'None'}`
    );
  };

  // Report Delay (Section 9)
  const reportWorkOrderDelay = (workOrderId, { delayReason, revisedDeadline }) => {
    const timestamp = nowString();
    setWorkOrders((prev) =>
      prev.map((wo) => {
        if (wo.id === workOrderId) {
          return {
            ...wo,
            status: 'OVERDUE',
            deadline: revisedDeadline || wo.deadline,
            delayReport: {
              reportedDate: timestamp,
              reason: delayReason,
              revisedDeadline: revisedDeadline || wo.deadline,
            },
            siteNotes: [
              { date: timestamp, text: `Delay Reported: ${delayReason}. New target: ${revisedDeadline}`, author: supervisorProfile.name },
              ...(wo.siteNotes || []),
            ],
          };
        }
        return wo;
      })
    );

    const wo = workOrders.find((w) => w.id === workOrderId);
    if (wo) {
      setComplaints((prev) =>
        prev.map((c) => {
          if (c.id === wo.complaintId) {
            return {
              ...c,
              timeline: [
                ...c.timeline,
                {
                  date: timestamp,
                  title: 'Field Repair Delay Reported',
                  description: `Delay reported: "${delayReason}". Revised target date: ${revisedDeadline}.`,
                  by: supervisorProfile.name,
                },
              ],
            };
          }
          return c;
        })
      );

      // Alert officer
      pushNotification(
        'officer',
        'Work Order Delay Alert',
        `Supervisor ${supervisorProfile.name} reported delay on #${workOrderId}: "${delayReason}". Target revised to ${revisedDeadline}.`,
        workOrderId,
        'OVERDUE'
      );
    }

    logAudit(
      `${supervisorProfile.name} (Supervisor)`,
      'REPORT_DELAY',
      `Work Order #${workOrderId}`,
      `Reason: ${delayReason}. New target: ${revisedDeadline}`
    );
  };

  // Add site notes
  const addWorkOrderSiteNotes = (workOrderId, noteText) => {
    const timestamp = nowString();
    setWorkOrders((prev) =>
      prev.map((wo) => {
        if (wo.id === workOrderId) {
          return {
            ...wo,
            siteNotes: [{ date: timestamp, text: noteText, author: supervisorProfile.name }, ...(wo.siteNotes || [])],
          };
        }
        return wo;
      })
    );
    logAudit(`${supervisorProfile.name} (Supervisor)`, 'ADD_SITE_NOTE', `Work Order #${workOrderId}`, noteText);
  };

  // Submit Photo Evidence for Verification (Section 10)
  const submitRepairEvidence = (workOrderId, { beforePhotos, afterPhotos, repairNotes, gpsCoordinates, manualLocation }) => {
    const timestamp = nowString();
    const wo = workOrders.find((w) => w.id === workOrderId);
    if (!wo) return false;

    // Update work order state
    setWorkOrders((prev) =>
      prev.map((w) => {
        if (w.id === workOrderId) {
          return {
            ...w,
            status: 'AWAITING_VERIFICATION',
            verificationStatus: 'AWAITING_VERIFICATION',
            progress: 100,
            beforePhotos: beforePhotos && beforePhotos.length > 0 ? beforePhotos : w.beforePhotos,
            afterPhotos: afterPhotos && afterPhotos.length > 0 ? afterPhotos : w.afterPhotos,
            actualCompletionDate: timestamp.split(' ')[0],
            rejectionReason: '', // cleared on resubmit
            siteNotes: [
              { date: timestamp, text: `Repair evidence submitted for officer inspection: ${repairNotes}`, author: supervisorProfile.name },
              ...(w.siteNotes || []),
            ],
          };
        }
        return w;
      })
    );

    // Create or update Repair Verification entry in officer's verification queue
    const existingVerifIndex = verifications.findIndex((v) => v.workOrderId === workOrderId);
    const primaryBefore = (beforePhotos && beforePhotos[0]) || wo.beforePhotos?.[0] || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80';
    const primaryAfter = (afterPhotos && afterPhotos[0]) || 'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=600&auto=format&fit=crop&q=80';

    if (existingVerifIndex >= 0) {
      setVerifications((prev) =>
        prev.map((v, idx) =>
          idx === existingVerifIndex
            ? {
                ...v,
                status: 'AWAITING_VERIFICATION',
                completionDetails: repairNotes,
                beforePhoto: primaryBefore,
                completionPhoto: primaryAfter,
                submittedAt: timestamp,
                officerRemarks: '',
                verifiedAt: null,
              }
            : v
        )
      );
    } else {
      const newVerif = {
        id: `RV-2026-${(verifications.length + 20).toString().padStart(3, '0')}`,
        complaintId: wo.complaintId,
        workOrderId: wo.id,
        complaintTitle: wo.complaintTitle,
        department: wo.department,
        supervisor: supervisorProfile.name,
        submittedAt: timestamp,
        completionDetails: repairNotes,
        beforePhoto: primaryBefore,
        completionPhoto: primaryAfter,
        status: 'AWAITING_VERIFICATION',
        officerRemarks: '',
        verifiedAt: null,
      };
      setVerifications((prev) => [newVerif, ...prev]);
    }

    // Append to complaint timeline; keep complaint status IN_PROGRESS until officer verifies!
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === wo.complaintId) {
          return {
            ...c,
            lastUpdated: timestamp,
            timeline: [
              ...c.timeline,
              {
                date: timestamp,
                title: 'Repair Completed — Awaiting Officer Verification',
                description: `Supervisor ${supervisorProfile.name} submitted Before/After photo evidence (Location: ${gpsCoordinates || manualLocation || 'GPS Tagged'}). Pending municipal officer review.`,
                by: supervisorProfile.name,
              },
            ],
          };
        }
        return c;
      })
    );

    // Notify Municipal Officer
    pushNotification(
      'officer',
      'Repair Awaiting Verification',
      `Supervisor ${supervisorProfile.name} submitted completion photos for Work Order #${wo.id} (#${wo.complaintId}). Please inspect and verify.`,
      wo.id,
      'VERIFICATION'
    );

    logAudit(
      `${supervisorProfile.name} (Supervisor)`,
      'SUBMIT_REPAIR_EVIDENCE',
      `Work Order #${workOrderId}`,
      `Submitted Before/After photos for verification. Notes: ${repairNotes}`
    );

    return true;
  };

  // Material Inventory Tracking (Section 11)
  // Formula: Remaining = Received - Used - Returned
  const recordMaterialTransaction = ({ workOrderId, materialId, materialName, unit, type, quantity, reason }) => {
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      throw new Error('Transaction quantity must be a positive number greater than zero.');
    }

    const timestamp = nowString();
    let currentItem = siteMaterials.find(
      (m) => m.workOrderId === workOrderId && (m.materialId === materialId || m.materialName === materialName)
    );

    if (!currentItem) {
      currentItem = {
        id: `SMAT-${Date.now().toString().slice(-4)}`,
        materialId: materialId || `INV-${(inventory.length + 1).toString().padStart(2, '0')}`,
        materialName: materialName,
        unit: unit || 'Units',
        workOrderId,
        complaintId: workOrders.find((w) => w.id === workOrderId)?.complaintId || '',
        requiredQuantity: qty,
        approvedQuantity: type === 'RECEIVED' ? qty : 0,
        receivedQuantity: type === 'RECEIVED' ? qty : 0,
        usedQuantity: type === 'USED' ? qty : 0,
        returnedQuantity: type === 'RETURNED' ? qty : 0,
        remainingQuantity: type === 'RECEIVED' ? qty : 0,
        transactionDate: timestamp.split(' ')[0],
        status: 'IN_USE',
        notes: reason || '',
      };
    }

    let { receivedQuantity, usedQuantity, returnedQuantity } = currentItem;

    if (type === 'RECEIVED') {
      receivedQuantity += qty;
    } else if (type === 'USED' || type === 'WASTE') {
      const remainingBefore = receivedQuantity - usedQuantity - returnedQuantity;
      if (qty > remainingBefore) {
        throw new Error(`Cannot record usage of ${qty} ${currentItem.unit}. Only ${remainingBefore} remaining at site!`);
      }
      usedQuantity += qty;
    } else if (type === 'RETURNED') {
      const remainingBefore = receivedQuantity - usedQuantity - returnedQuantity;
      if (qty > remainingBefore) {
        throw new Error(`Cannot return ${qty} ${currentItem.unit}. Only ${remainingBefore} remaining at site!`);
      }
      returnedQuantity += qty;
      // Also adjust central municipal warehouse stock
      if (currentItem.materialId) {
        adjustInventoryStock(currentItem.materialId, +qty, `Unused return from Work Order #${workOrderId}`);
      }
    }

    const remainingQuantity = Math.max(0, receivedQuantity - usedQuantity - returnedQuantity);

    const updatedItem = {
      ...currentItem,
      receivedQuantity,
      usedQuantity,
      returnedQuantity,
      remainingQuantity,
      transactionDate: timestamp.split(' ')[0],
      status: remainingQuantity === 0 && receivedQuantity > 0 ? 'FULFILLED' : 'IN_USE',
    };

    setSiteMaterials((prev) => {
      const exists = prev.some((m) => m.id === currentItem.id);
      if (exists) {
        return prev.map((m) => (m.id === currentItem.id ? updatedItem : m));
      }
      return [updatedItem, ...prev];
    });

    // Record in transaction log
    const newTxn = {
      id: `TXN-${Date.now().toString().slice(-4)}`,
      workOrderId,
      materialId: currentItem.materialId,
      materialName: currentItem.materialName,
      type, // 'RECEIVED', 'USED', 'RETURNED', 'WASTE'
      quantity: qty,
      unit: currentItem.unit,
      performedBy: supervisorProfile.name,
      timestamp,
      reason: reason || `Recorded ${type.toLowerCase()} at work site`,
    };

    setMaterialTransactions((prev) => [newTxn, ...prev]);

    logAudit(
      `${supervisorProfile.name} (Supervisor)`,
      'MATERIAL_TRANSACTION',
      `Work Order #${workOrderId}`,
      `${type} ${qty} ${currentItem.unit} of ${currentItem.materialName}. Remaining: ${remainingQuantity}`
    );

    return updatedItem;
  };

  // Material Request Submission (Section 12)
  const submitSupervisorMaterialRequest = ({
    workOrderId,
    complaintId,
    materialName,
    requestedQty,
    unit,
    priority,
    reason,
    shortageDescription,
    additionalNotes,
  }) => {
    const qty = parseInt(requestedQty);
    if (!qty || qty <= 0) {
      throw new Error('Requested quantity must be greater than zero.');
    }

    const newReqId = `MR-2026-${(materialRequests.length + 50).toString().padStart(3, '0')}`;
    const timestamp = nowString();
    const wo = workOrders.find((w) => w.id === workOrderId);

    const newRequest = {
      id: newReqId,
      workOrderId,
      complaintId: complaintId || wo?.complaintId || 'CC-2026-1041',
      requestedBy: supervisorProfile.name,
      department: supervisorProfile.department,
      requestDate: timestamp,
      status: 'Pending Approval', // 'Draft', 'Pending Approval', 'Approved', 'Partially Approved', 'Rejected', 'Issued', 'Fulfilled'
      priority: priority || 'MEDIUM',
      materialName,
      requestedQty: qty,
      approvedQty: 0,
      unit: unit || 'Units',
      reason: reason || 'Essential material requisition for site repairs',
      shortageDescription: shortageDescription || 'Ward stores depleted',
      decisionNotes: '',
      additionalNotes: additionalNotes || '',
      items: [
        {
          itemId: `INV-${Date.now().toString().slice(-3)}`,
          itemName: materialName,
          requestedQty: qty,
          approvedQty: 0,
          unit: unit || 'Units',
        },
      ],
    };

    setMaterialRequests((prev) => [newRequest, ...prev]);

    // Push notification to Municipal Officer
    pushNotification(
      'officer',
      'New Material Requisition Submitted',
      `Supervisor ${supervisorProfile.name} requested ${qty} ${unit || 'Units'} of ${materialName} for Work Order #${workOrderId}.`,
      newReqId,
      'MATERIAL_REQUEST'
    );

    logAudit(
      `${supervisorProfile.name} (Supervisor)`,
      'SUBMIT_MATERIAL_REQUEST',
      `Request #${newReqId}`,
      `Requested ${qty} ${unit} of "${materialName}" for #${workOrderId}. Priority: ${priority}`
    );

    return newRequest;
  };

  // Record received supplies when Officer approves request (Section 12)
  const receiveMaterialSupplies = (requestId) => {
    const req = materialRequests.find((r) => r.id === requestId);
    if (!req) return;

    const approvedQty = req.approvedQty || req.requestedQty || 0;
    if (approvedQty <= 0) {
      throw new Error('Cannot record receipt for a request without approved quantities.');
    }

    // Mark request status as Issued / Fulfilled
    setMaterialRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'Fulfilled' } : r))
    );

    // Record into site inventory as RECEIVED
    recordMaterialTransaction({
      workOrderId: req.workOrderId,
      materialId: req.items?.[0]?.itemId || `INV-${Date.now().toString().slice(-3)}`,
      materialName: req.materialName,
      unit: req.unit,
      type: 'RECEIVED',
      quantity: approvedQty,
      reason: `Received approved supplies from Municipal Request #${requestId}`,
    });

    pushNotification(
      'supervisor',
      'Supplies Issued to Site Inventory',
      `Received ${approvedQty} ${req.unit} of ${req.materialName} into Work Order #${req.workOrderId} inventory.`,
      req.workOrderId,
      'SUPPLIES_RECEIVED'
    );
  };

  // Progress Reports (Section 13)
  const submitProgressReport = (reportData) => {
    const newReportId = `PR-2026-${(progressReports.length + 20).toString().padStart(3, '0')}`;
    const timestamp = nowString();

    const newReport = {
      id: newReportId,
      workOrderId: reportData.workOrderId,
      complaintId: reportData.complaintId || workOrders.find((w) => w.id === reportData.workOrderId)?.complaintId || '',
      reportDateTime: timestamp,
      workCompleted: reportData.workCompleted,
      currentProgress: parseInt(reportData.currentProgress) || 0,
      workersInvolved: reportData.workersInvolved || [],
      materialsUsed: reportData.materialsUsed || 'Standard site materials',
      remainingWork: reportData.remainingWork || 'None',
      problemsOrDelays: reportData.problemsOrDelays || 'None',
      photoEvidence: reportData.photoEvidence || [],
      nextSteps: reportData.nextSteps || 'Proceed with next phase',
      submittedBy: supervisorProfile.name,
    };

    setProgressReports((prev) => [newReport, ...prev]);

    // Notify Officer
    pushNotification(
      'officer',
      'Formal Progress Report Filed',
      `Supervisor ${supervisorProfile.name} submitted official progress report #${newReportId} for #${reportData.workOrderId}.`,
      newReportId,
      'PROGRESS_REPORT'
    );

    logAudit(
      `${supervisorProfile.name} (Supervisor)`,
      'SUBMIT_PROGRESS_REPORT',
      `Report #${newReportId}`,
      `Filed progress report for #${reportData.workOrderId}. Progress: ${newReport.currentProgress}%`
    );

    return newReport;
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
        // Common & State
        currentRole,
        setCurrentRole,
        citizenProfile,
        officerProfile,
        supervisorProfile,
        categories,
        complaints,
        workOrders,
        inventory,
        materialRequests,
        verifications,
        duplicates,
        notifications,
        auditLogs,
        // Supervisor states
        workers,
        workerTasks,
        siteMaterials,
        materialTransactions,
        progressReports,
        // Citizen actions
        submitComplaint,
        submitFeedback,
        updateCitizenProfile,
        // Officer actions
        approveComplaint,
        rejectComplaint,
        createWorkOrder,
        updateWorkOrderStatus,
        adjustInventoryStock,
        addInventoryItem,
        handleMaterialRequest,
        verifyRepair,
        confirmDuplicate,
        dismissDuplicate,
        updateOfficerProfile,
        // Supervisor actions (Member 3)
        updateSupervisorProfile,
        addWorkerTask,
        updateWorkerTask,
        deleteWorkerTask,
        assignWorkersToWorkOrder,
        updateWorkOrderProgress,
        reportWorkOrderDelay,
        addWorkOrderSiteNotes,
        submitRepairEvidence,
        recordMaterialTransaction,
        submitSupervisorMaterialRequest,
        receiveMaterialSupplies,
        submitProgressReport,
        // Notification actions
        markNotificationRead,
        markAllNotificationsRead,
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

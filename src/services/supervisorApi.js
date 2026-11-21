/**
 * CivicConnect - Member 3: Field Supervisor API Client
 * Connects frontend supervisor components to Express backend REST endpoints,
 * with seamless fallback to reactive mock data when server is in offline demonstration mode.
 */

import { API_BASE_URL } from './api';

export async function fetchSupervisorProfile() {
  try {
    const res = await fetch(`${API_BASE_URL}/supervisor/profile`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function apiUpdateProgress(workOrderId, progressPayload) {
  try {
    const res = await fetch(`${API_BASE_URL}/supervisor/work-orders/${workOrderId}/progress`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progressPayload),
    });
    return await res.json();
  } catch (err) {
    return { success: false, fallback: true, error: err.message };
  }
}

export async function apiReportDelay(workOrderId, delayPayload) {
  try {
    const res = await fetch(`${API_BASE_URL}/supervisor/work-orders/${workOrderId}/delay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(delayPayload),
    });
    return await res.json();
  } catch (err) {
    return { success: false, fallback: true, error: err.message };
  }
}

export async function apiCreateWorkerTask(taskPayload) {
  try {
    const res = await fetch(`${API_BASE_URL}/supervisor/worker-tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskPayload),
    });
    return await res.json();
  } catch (err) {
    return { success: false, fallback: true, error: err.message };
  }
}

export async function apiRecordMaterialTxn(txnPayload) {
  try {
    const res = await fetch(`${API_BASE_URL}/supervisor/materials/transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(txnPayload),
    });
    return await res.json();
  } catch (err) {
    return { success: false, fallback: true, error: err.message };
  }
}

export async function apiSubmitMaterialRequest(requestPayload) {
  try {
    const res = await fetch(`${API_BASE_URL}/supervisor/material-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload),
    });
    return await res.json();
  } catch (err) {
    return { success: false, fallback: true, error: err.message };
  }
}

export async function apiSubmitPhotoEvidence(evidencePayload) {
  try {
    const res = await fetch(`${API_BASE_URL}/supervisor/photo-evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evidencePayload),
    });
    return await res.json();
  } catch (err) {
    return { success: false, fallback: true, error: err.message };
  }
}

export async function apiSubmitProgressReport(reportPayload) {
  try {
    const res = await fetch(`${API_BASE_URL}/supervisor/progress-reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportPayload),
    });
    return await res.json();
  } catch (err) {
    return { success: false, fallback: true, error: err.message };
  }
}

export default {
  fetchSupervisorProfile,
  apiUpdateProgress,
  apiReportDelay,
  apiCreateWorkerTask,
  apiRecordMaterialTxn,
  apiSubmitMaterialRequest,
  apiSubmitPhotoEvidence,
  apiSubmitProgressReport,
};

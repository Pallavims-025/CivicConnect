/**
 * CivicConnect - Member 3: Field Supervisor API Client
 * Authenticated Field Supervisor API client. Supervisor records are always loaded
 * from the backend; network failures never fall back to demonstration data.
 */

import { API_BASE_URL } from './api';

async function supervisorRequest(path, options = {}) {
  const token = localStorage.getItem('cc_auth_token');
  const response = await fetch(`${API_BASE_URL}/supervisor${path}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.error?.message || json.errors?.general || 'Supervisor data could not be loaded.');
  return json.data;
}

export const fetchSupervisorDashboardData = () => supervisorRequest('/dashboard-data');
export const updateSupervisorCrew = (workOrderId, workerNames) => supervisorRequest(`/work-orders/${encodeURIComponent(workOrderId)}/crew`, { method: 'PUT', body: JSON.stringify({ workerNames }) });
export const addSupervisorSiteNote = (workOrderId, note) => supervisorRequest(`/work-orders/${encodeURIComponent(workOrderId)}/notes`, { method: 'POST', body: JSON.stringify({ note }) });
export const updateSupervisorProfileRequest = (profile) => supervisorRequest('/profile', { method: 'PUT', body: JSON.stringify(profile) });
export const updateSupervisorWorkerTask = (taskId, payload) => supervisorRequest(`/worker-tasks/${encodeURIComponent(taskId)}`, { method: 'PUT', body: JSON.stringify(payload) });
export const deleteSupervisorWorkerTask = (taskId) => supervisorRequest(`/worker-tasks/${encodeURIComponent(taskId)}`, { method: 'DELETE' });

export async function fetchSupervisorProfile() {
  try {
    return { ok: true, data: await supervisorRequest('/profile') };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function apiUpdateProgress(workOrderId, progressPayload) {
  try {
    return { success: true, data: await supervisorRequest(`/work-orders/${encodeURIComponent(workOrderId)}/progress`, { method: 'PUT', body: JSON.stringify(progressPayload) }) };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function apiReportDelay(workOrderId, delayPayload) {
  try {
    return { success: true, data: await supervisorRequest(`/work-orders/${encodeURIComponent(workOrderId)}/delay`, { method: 'POST', body: JSON.stringify(delayPayload) }) };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function apiCreateWorkerTask(taskPayload) {
  try {
    return { success: true, data: await supervisorRequest('/worker-tasks', { method: 'POST', body: JSON.stringify(taskPayload) }) };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function apiRecordMaterialTxn(txnPayload) {
  try {
    return { success: true, data: await supervisorRequest('/materials/transaction', { method: 'POST', body: JSON.stringify(txnPayload) }) };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function apiSubmitMaterialRequest(requestPayload) {
  try {
    return { success: true, data: await supervisorRequest('/material-requests', { method: 'POST', body: JSON.stringify(requestPayload) }) };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function apiSubmitPhotoEvidence(evidencePayload) {
  try {
    return { success: true, data: await supervisorRequest('/photo-evidence', { method: 'POST', body: JSON.stringify(evidencePayload) }) };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function apiSubmitProgressReport(reportPayload) {
  try {
    return { success: true, data: await supervisorRequest('/progress-reports', { method: 'POST', body: JSON.stringify(reportPayload) }) };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export default {
  fetchSupervisorDashboardData,
  updateSupervisorCrew,
  addSupervisorSiteNote,
  updateSupervisorProfileRequest,
  updateSupervisorWorkerTask,
  deleteSupervisorWorkerTask,
  fetchSupervisorProfile,
  apiUpdateProgress,
  apiReportDelay,
  apiCreateWorkerTask,
  apiRecordMaterialTxn,
  apiSubmitMaterialRequest,
  apiSubmitPhotoEvidence,
  apiSubmitProgressReport,
};

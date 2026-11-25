/**
 * CivicConnect Frontend API Client Configuration
 * Allows configurable communication with the backend Express server
 * via VITE_API_BASE_URL or Vite development proxy (/api).
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || '/api';

function authHeaders(extra = {}) {
  const token = localStorage.getItem('cc_auth_token');
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function request(path, options = {}) {
  const token = localStorage.getItem('cc_auth_token');
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error?.message || data.errors?.general || 'The request could not be completed.');
    error.details = data.errors || {};
    throw error;
  }
  return data.data;
}

export const getComplaintCategories = () => request('/complaints/categories');
export const getMyComplaints = () => request('/complaints/mine');
export const retryComplaintPhotoVerification = (id, photos) => request(`/complaints/${encodeURIComponent(id)}/photos/retry`, {
  method: 'POST',
  body: JSON.stringify({ photos }),
});
export const updateCitizenProfileRequest = (profile) => request('/auth/citizen-profile', { method: 'PATCH', body: JSON.stringify(profile) });
export const updateOfficerProfileRequest = (profile) => request('/auth/officer-profile', { method: 'PATCH', body: JSON.stringify(profile) });
export const createComplaint = (complaint) => request('/complaints', {
  method: 'POST',
  body: JSON.stringify(complaint),
});
export const getOfficerMapComplaints = () => request('/complaints/officer-map');
export const getOfficerComplaints = () => request('/complaints/officer');
export const getOfficerComplaint = (id) => request(`/complaints/officer/${encodeURIComponent(id)}`);
export const reviewComplaintPhotoLocation = (complaintId, photoId, decision, notes = '') => request(
  `/complaints/officer/${encodeURIComponent(complaintId)}/photos/${encodeURIComponent(photoId)}/location-review`,
  { method: 'PATCH', body: JSON.stringify({ decision, notes }) },
);
export const updateOfficerComplaintStatus = (id, update) => request(`/complaints/${encodeURIComponent(id)}/status`, {
  method: 'PATCH',
  body: JSON.stringify(update),
});
export const getActiveFieldSupervisors = () => request('/assignments/supervisors');
export const assignComplaintToSupervisor = (complaintId, assignment) => request(`/assignments/complaints/${encodeURIComponent(complaintId)}`, {
  method: 'POST',
  body: JSON.stringify(assignment),
});
export const getOfficerAssignments = () => request('/assignments/officer');
export const getOfficerMaterialRequests = () => request('/assignments/material-requests');
export const reviewOfficerMaterialRequest = (id, decision, approvedQtyMap, notes) => request(`/assignments/material-requests/${encodeURIComponent(id)}`, {
  method: 'PATCH', body: JSON.stringify({ decision, approvedQtyMap, notes }),
});
export const getMyAssignments = () => request('/assignments/mine');
export const updateAssignmentStatus = (id, update) => request(`/assignments/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: JSON.stringify(update) });
export const submitAssignmentCompletion = (id, completion) => request(`/assignments/${encodeURIComponent(id)}/complete`, { method: 'POST', body: JSON.stringify(completion) });
export const getPendingVerifications = () => request('/assignments/verifications');
export const reviewAssignmentCompletion = (id, review) => request(`/assignments/verifications/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(review) });
export const getNotifications = () => request('/notifications');
export const getUnreadNotificationCount = () => request('/notifications/unread-count');
export const markNotificationReadRequest = (id) => request(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' });
export const markAllNotificationsReadRequest = () => request('/notifications/read-all', { method: 'PATCH' });
export const deleteNotificationRequest = (id) => request(`/notifications/${encodeURIComponent(id)}`, { method: 'DELETE' });
export const getDuplicateReviews = () => request('/complaints/officer/duplicates');
export const reviewDuplicate = (matchId, decision, matchedComplaintId) => request(`/complaints/officer/duplicates/${encodeURIComponent(matchId)}`, {
  method: 'PATCH',
  body: JSON.stringify({ decision, matchedComplaintId }),
});

/**
 * Checks backend health and database connectivity
 * @returns {Promise<{ ok: boolean, data?: object, error?: string }>}
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    const data = await res.json().catch(() => ({}));
    return {
      ok: res.ok,
      status: res.status,
      data,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err.message || 'Network error connecting to backend',
    };
  }
}

// -----------------------------------------------------------------------------
// MEMBER 4: SYSTEM ADMINISTRATOR API METHODS
// -----------------------------------------------------------------------------

/**
 * Fetch platform telemetry metrics and resolution KPIs
 */
export async function fetchAdminStats() {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/stats`, { headers: authHeaders() });
    const json = await res.json();
    return { ok: res.ok, data: json.data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Fetch master user list
 */
export async function fetchAdminUsers() {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/users`, { headers: authHeaders() });
    const json = await res.json();
    return { ok: res.ok, data: json.data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Create new user account in database
 */
export async function createAdminUser(userData) {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(userData),
    });
    const json = await res.json();
    return { ok: res.ok, data: json.data, error: json.error };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Update user role or status
 */
export async function updateAdminUser(userId, updatedFields) {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(updatedFields),
    });
    const json = await res.json();
    return { ok: res.ok, data: json.data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Remove user account
 */
export async function deleteAdminUser(userId) {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const json = await res.json();
    return { ok: res.ok, message: json.message };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Fetch municipal departments
 */
export async function fetchAdminDepartments() {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/departments`, { headers: authHeaders() });
    const json = await res.json();
    return { ok: res.ok, data: json.data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Create municipal department
 */
export async function createAdminDepartment(deptData) {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/departments`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(deptData),
    });
    const json = await res.json();
    return { ok: res.ok, data: json.data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Fetch system audit logs
 */
export async function fetchAdminAuditLogs(limit = 20) {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/audit?limit=${limit}`, { headers: authHeaders() });
    const json = await res.json();
    return { ok: res.ok, data: json.data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export default {
  API_BASE_URL,
  checkBackendHealth,
  fetchAdminStats,
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  fetchAdminDepartments,
  createAdminDepartment,
  fetchAdminAuditLogs,
  getComplaintCategories,
  getMyComplaints,
  createComplaint,
  getOfficerMapComplaints,
};

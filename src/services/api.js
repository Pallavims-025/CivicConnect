/**
 * CivicConnect Frontend API Client Configuration
 * Allows configurable communication with the backend Express server
 * via VITE_API_BASE_URL or Vite development proxy (/api).
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || '/api';

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
export const createComplaint = (complaint) => request('/complaints', {
  method: 'POST',
  body: JSON.stringify(complaint),
});
export const getOfficerMapComplaints = () => request('/complaints/officer-map');

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

export default {
  API_BASE_URL,
  checkBackendHealth,
  getComplaintCategories,
  getMyComplaints,
  createComplaint,
  getOfficerMapComplaints,
};

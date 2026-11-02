/**
 * CivicConnect Frontend API Client Configuration
 * Allows configurable communication with the backend Express server
 * via VITE_API_BASE_URL or Vite development proxy (/api).
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || '/api';

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
};

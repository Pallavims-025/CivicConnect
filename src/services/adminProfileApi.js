import { API_BASE_URL } from './api';

const apiRoot = API_BASE_URL.replace(/\/api\/?$/i, '').replace(/\/$/, '');

export function resolveAdminAvatarUrl(avatarUrl) {
  if (!avatarUrl) return '';
  if (/^(?:https?:|data:)/i.test(avatarUrl)) return avatarUrl;
  return `${apiRoot}${avatarUrl.startsWith('/') ? avatarUrl : `/${avatarUrl}`}`;
}

async function adminProfileRequest(path, options = {}) {
  const token = localStorage.getItem('cc_auth_token');
  const response = await fetch(`${API_BASE_URL}/admin${path}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error?.message || 'Administrator profile could not be loaded.');
  }
  return payload.data;
}

export const fetchAdminProfile = () => adminProfileRequest('/profile');
export const uploadAdminProfilePhoto = (imageData) => adminProfileRequest('/profile/photo', {
  method: 'POST',
  body: JSON.stringify({ imageData }),
});

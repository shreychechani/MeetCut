// ─── Centralised auth helpers ─────────────────────────────────────────────────
// FIX: API base URL — empty string means "use the Vite proxy" in dev.
// The proxy forwards /api/* → http://localhost:3000/api/*
// In production, set VITE_API_URL to your backend URL.
export const API = import.meta.env.VITE_API_URL || '';

/** Derive a readable display name from an email address */
function nameFromEmail(email) {
  if (!email) return '';
  const local = email.split('@')[0];
  return local
    .replace(/[._\-+]/g, ' ')
    .replace(/\d+/g, '')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase())
    || local;
}

/**
 * Save auth data returned by the backend into localStorage.
 * Expected backend shape: { token, user: { fullName, email, avatar, authMethod } }
 */
export const saveAuth = (data) => {
  if (!data || !data.token) {
    console.error('[saveAuth] Invalid data — missing token:', data);
    return;
  }

  const user    = data.user || {};
  const email   = (user.email || '').toLowerCase().trim();
  const rawName = (user.fullName || '').trim();
  const userName = rawName !== '' ? rawName : nameFromEmail(email);

  localStorage.setItem('token',      data.token);
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('userName',   userName);
  localStorage.setItem('userEmail',  email);
  localStorage.setItem('userAvatar', user.avatar     || '');
  localStorage.setItem('authMethod', user.authMethod || 'local');
};

/** Remove all auth data from localStorage (logout) */
export const clearAuth = () => {
  ['token', 'isLoggedIn', 'userName', 'userEmail', 'userAvatar', 'authMethod']
    .forEach(k => localStorage.removeItem(k));
};

/** Read auth state from localStorage — always returns a consistent shape */
export const getUser = () => ({
  token:      localStorage.getItem('token')      || '',
  isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
  userName:   localStorage.getItem('userName')   || '',
  userEmail:  localStorage.getItem('userEmail')  || '',
  userAvatar: localStorage.getItem('userAvatar') || '',
  authMethod: localStorage.getItem('authMethod') || 'local',
});

/** Check if the stored JWT token is still valid (client-side only check) */
export const isTokenValid = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // exp is in seconds; Date.now() is in milliseconds
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

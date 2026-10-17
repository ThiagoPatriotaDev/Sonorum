const TOKEN_KEY = 'sonorum_access_token_v1';
const BASE = '/api';

async function request(path, { method = 'GET', body, token } = {}) {
  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
  } catch { throw new Error('Não foi possível conectar ao servidor. Inicie o backend na porta 3333.'); }
  let result = {};
  try { result = await response.json(); } catch { /* resposta vazia */ }
  if (!response.ok) throw new Error(result.error || 'Não foi possível completar a solicitação.');
  return result;
}

export const CommunityApi = {
  getToken: () => localStorage.getItem(TOKEN_KEY) || '',
  saveToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
  me: (token) => request('/auth/me', { token }),
  register: (data) => request('/auth/register', { method: 'POST', body: data }),
  login: (data) => request('/auth/login', { method: 'POST', body: data }),
  videos: (instrumentId = '') => request(`/videos${instrumentId ? `?instrument=${encodeURIComponent(instrumentId)}` : ''}`),
  publish: (data, token) => request('/videos', { method: 'POST', body: data, token }),
  remove: (id, token) => request(`/videos/${encodeURIComponent(id)}`, { method: 'DELETE', token })
};

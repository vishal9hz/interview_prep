const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export const checkHealth = () => fetch(`${BASE.replace('/api', '')}/health`).then(r => r.json()).catch(() => null);
export const createSet = (body) => request('/sets', { method: 'POST', body: JSON.stringify(body) });
export const getSets = () => request('/sets');
export const getSet = (id) => request(`/sets/${id}`);
export const deleteSet = (id) => request(`/sets/${id}`, { method: 'DELETE' });
export const reattemptSet = (id) => request(`/sets/${id}/reattempt`, { method: 'POST' });
export const saveAnswer = (id, body) => request(`/questions/${id}/answer`, { method: 'PUT', body: JSON.stringify(body) });
export const evaluateAnswer = (id) => request(`/questions/${id}/evaluate`, { method: 'POST' });
export const getFollowUp = (id) => request(`/questions/${id}/followup`, { method: 'POST' });
export const toggleBookmark = (id) => request(`/questions/${id}/bookmark`, { method: 'PATCH' });
export const getBookmarks = () => request('/bookmarks');
export const getProgress = () => request('/progress');

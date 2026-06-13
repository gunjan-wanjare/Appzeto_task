import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const fetchTickets = (params) => api.get('/tickets', { params });
export const fetchStats = () => api.get('/tickets/stats');
export const fetchTicket = (id) => api.get(`/tickets/${id}`);
export const createTicket = (data) => api.post('/tickets', data);
export const patchTicket = (id, data) => api.patch(`/tickets/${id}`, data);
export const addComment = (id, text) => api.post(`/tickets/${id}/comments`, { text });

export default api;

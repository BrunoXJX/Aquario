/**
 * AIRV Incubação | Reservas – API Service
 * Camada de comunicação com o backend Express
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor de resposta para normalização de erros
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err?.message ||
      'Erro de comunicação com o servidor.';
    const error = new Error(message);
    error.status = err?.response?.status;
    error.conflicts = err?.response?.data?.conflicts;
    return Promise.reject(error);
  }
);

// ─── Health ───────────────────────────────────
export const checkHealth = () => api.get('/health').then(r => r.data);

// ─── Dashboard ────────────────────────────────
export const getDashboard = () => api.get('/dashboard/today').then(r => r.data);

// ─── Settings ─────────────────────────────────
export const getSettings = () => api.get('/settings').then(r => r.data);
export const updateSettings = (data) => api.put('/settings', data).then(r => r.data);

// ─── Companies ────────────────────────────────
export const getCompanies = (all = false) =>
  api.get(all ? '/companies/all' : '/companies').then(r => r.data);
export const createCompany = (data) => api.post('/companies', data).then(r => r.data);
export const updateCompany = (id, data) => api.put(`/companies/${id}`, data).then(r => r.data);

// ─── Rooms ────────────────────────────────────
export const getRooms = () => api.get('/rooms').then(r => r.data);

// ─── Reservations ─────────────────────────────
export const getReservations = (params = {}) =>
  api.get('/reservations', { params }).then(r => r.data);

export const getReservation = (id) =>
  api.get(`/reservations/${id}`).then(r => r.data);

export const createReservation = (data) =>
  api.post('/reservations', data).then(r => r.data);

export const updateReservation = (id, data) =>
  api.put(`/reservations/${id}`, data).then(r => r.data);

export const cancelReservation = (id) =>
  api.delete(`/reservations/${id}`).then(r => r.data);

export const checkConflicts = (data) =>
  api.post('/reservations/check', data).then(r => r.data);

// ─── Blocked Dates ────────────────────────────
export const getBlockedDates = () => api.get('/blocked-dates').then(r => r.data);
export const blockDate = (data) => api.post('/blocked-dates', data).then(r => r.data);
export const unblockDate = (id) => api.delete(`/blocked-dates/${id}`).then(r => r.data);

// ─── Admin ────────────────────────────────────
export const getAdminStats = () => api.get('/admin/stats').then(r => r.data);
export const confirmReservation = (id) => api.put(`/reservations/${id}/confirm`).then(r => r.data);
export const rejectReservation = (id) => api.put(`/reservations/${id}/reject`).then(r => r.data);
export const getPendingReservations = () => api.get('/dashboard/pending').then(r => r.data);

export default api;

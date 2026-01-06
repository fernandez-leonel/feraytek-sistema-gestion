// =====================================================================
// Servicio Soporte
// Encapsula llamadas al backend remoto usando apiClient
// - Métodos: crear, misTickets, obtener, estadisticas, responder, prioridad, cerrar
// =====================================================================

const { apiClient } = require('../lib/apiClient')

function authHeaders(req) {
  const auth = req.headers.authorization
  return auth ? { Authorization: auth } : {}
}

const soporteService = {
  // Crear ticket
  async crear(req, data) { const r = await apiClient.post('/soporte', data, { headers: authHeaders(req) }); return r.data },
  // Listar mis tickets
  async misTickets(req) { const r = await apiClient.get('/soporte/mis-tickets', { headers: authHeaders(req) }); return r.data },
  // Listar todos con filtros (admin)
  async listarTodos(req, { estado, prioridad, page=1, limit=25 }={}) {
    const qs = new URLSearchParams()
    if (estado) qs.set('estado', String(estado))
    if (prioridad) qs.set('prioridad', String(prioridad))
    qs.set('page', String(page))
    qs.set('limit', String(limit))
    const r = await apiClient.get(`/soporte?${qs.toString()}`, { headers: authHeaders(req) }); return r.data
  },
  // Obtener por id
  async obtener(req, id) { const r = await apiClient.get(`/soporte/${id}`, { headers: authHeaders(req) }); return r.data },
  // Estadísticas
  async estadisticas(req) { const r = await apiClient.get('/soporte/estadisticas', { headers: authHeaders(req) }); return r.data },
  // Responder
  async responder(req, id, data) { const r = await apiClient.put(`/soporte/${id}/responder`, data, { headers: authHeaders(req) }); return r.data },
  // Cambiar prioridad
  async prioridad(req, id, data) { const r = await apiClient.put(`/soporte/${id}/prioridad`, data, { headers: authHeaders(req) }); return r.data },
  // Cerrar
  async cerrar(req, id, data) { const r = await apiClient.put(`/soporte/${id}/cerrar`, data, { headers: authHeaders(req) }); return r.data }
}

module.exports = { soporteService }
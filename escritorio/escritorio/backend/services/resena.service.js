// =====================================================================
// ResenaService
// Encapsula llamadas al backend remoto para reseñas
// =====================================================================

const { apiClient } = require("../lib/apiClient")

function authHeaders(req) { const a = req.headers.authorization; return a ? { Authorization: a } : {} }

const ResenaService = {
  async crear(req, data) { const r = await apiClient.post('/resenas', data, { headers: authHeaders(req) }); return r.data },
  async listarTodas(req) { const r = await apiClient.get('/resenas', { headers: authHeaders(req) }); return r.data },
  async listarPorProducto(req, id_producto) { const r = await apiClient.get(`/resenas/producto/${id_producto}`, { headers: authHeaders(req) }); return r.data },
  async obtener(req, id) { const r = await apiClient.get(`/resenas/obtener?id=${encodeURIComponent(id)}`, { headers: authHeaders(req) }); return r.data },
  async actualizar(req, id, data) { const r = await apiClient.put(`/resenas/${id}`, data, { headers: authHeaders(req) }); return r.data }
}

module.exports = { ResenaService }

// ----------------------------------------------------------------------
// Explicación
// Servicio de reseñas: centraliza llamadas HTTP y normalización mínima.
// Usado por el Controller; ≤150 líneas con funciones simples.
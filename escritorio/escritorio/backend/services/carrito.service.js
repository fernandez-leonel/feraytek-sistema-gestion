// =====================================================================
// Servicio Carrito
// Lógica de negocio y puente hacia el backend remoto vía apiClient
// - Métodos: listar, agregar, eliminarItem, vaciar, adminTodos,
//            adminUsuario, abandonados, limpiarAbandonados, estadisticas
// =====================================================================

const { apiClient } = require('../lib/apiClient')

function authHeaders(req) { const a = req.headers.authorization; return a ? { Authorization: a } : {} }

const carritoService = {
  async listar(req) { const r = await apiClient.get('/carrito', { headers: authHeaders(req) }); return r.data },
  async agregar(req, data) { const r = await apiClient.post('/carrito', data, { headers: authHeaders(req) }); return r.data },
  async eliminarItem(req, data) { const r = await apiClient.delete('/carrito/item', { headers: authHeaders(req), data }); return r.data },
  async vaciar(req) { const r = await apiClient.delete('/carrito', { headers: authHeaders(req) }); return r.data },
  async adminTodos(req) { const r = await apiClient.get('/carrito/admin/todos', { headers: authHeaders(req) }); return r.data },
  async adminUsuario(req, id) { const r = await apiClient.get(`/carrito/admin/usuario/${id}`, { headers: authHeaders(req) }); return r.data },
  async abandonados(req, dias) { const r = await apiClient.get(`/carrito/admin/abandonados?dias=${encodeURIComponent(dias)}`, { headers: authHeaders(req) }); return r.data },
  async limpiarAbandonados(req, dias) { const r = await apiClient.delete('/carrito/admin/limpiar-abandonados', { headers: authHeaders(req), data: { dias } }); return r.data },
  async estadisticas(req) { const r = await apiClient.get('/carrito/admin/estadisticas', { headers: authHeaders(req) }); return r.data }
}

module.exports = { carritoService }

// ----------------------------------------------------------------------
// Explicación
// Este servicio encapsula la lógica y acceso al API remoto del carrito.
// Lo usa el controlador tras validar entradas en el modelo.
// ≤150 líneas: métodos simples y consistentes.
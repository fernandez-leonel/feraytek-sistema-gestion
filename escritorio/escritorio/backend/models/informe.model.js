// Descripción:
// Modelo de INFORME: obtiene datos crudos desde la API remota
// para cada submódulo (ventas, envíos, usuarios, productos, reseñas/soporte).
// Devuelve arreglos y objetos listos para agregarse en el servicio.
// ----------------------------------------------------------------------

const { apiClient } = require('../lib/apiClient')
const { extractArray } = require('../lib/utils')

module.exports = {
  // Ventas & Ganancias: pedidos y pagos
  async ventasDatos(headers, params = {}) {
    const qs = new URLSearchParams()
    if (params.fecha_inicio) qs.set('fecha_inicio', String(params.fecha_inicio))
    if (params.fecha_fin) qs.set('fecha_fin', String(params.fecha_fin))
    const pedidos = await apiClient.get(`/pedidos`, { headers }).catch(() => null)
    const pagosEst = await apiClient.get(`/facturas/admin/estadisticas`, { headers }).catch(() => null)
    const arrPedidos = extractArray(pedidos?.data)
    const estPagos = pagosEst?.data || {}
    return { pedidos: arrPedidos, facturasStats: estPagos }
  },
  // Envíos & Logística: envíos y pedidos
  async enviosDatos(headers) {
    const envios = await apiClient.get(`/envios`, { headers }).catch(() => null)
    const arrEnvios = extractArray(envios?.data)
    return { envios: arrEnvios }
  },
  // Usuarios & Actividad: usuarios, carritos
  async usuariosDatos(headers) {
    const users = await apiClient.get(`/admin/users/list?page=1&limit=500`, { headers }).catch(() => null)
    const carStats = await apiClient.get(`/carrito/admin/estadisticas`, { headers }).catch(() => null)
    const abandon = await apiClient.get(`/carrito/admin/abandonados?dias=7`, { headers }).catch(() => null)
    return {
      usuarios: extractArray(users?.data),
      carritosStats: carStats?.data || {},
      abandonados: extractArray(abandon?.data)
    }
  },
  // Productos & Stock: productos, variantes (rotación) y categorías
  async productosDatos(headers) {
    const productos = await apiClient.get(`/productos`, { headers }).catch(() => null)
    const arrProd = extractArray(productos?.data)
    return { productos: arrProd }
  },
  // Reseñas & Soporte
  async reseñasSoporteDatos(headers) {
    const rs = await apiClient.get(`/resenas`, { headers }).catch(() => null)
    const est = await apiClient.get(`/soporte/estadisticas`, { headers }).catch(() => null)
    return { reseñas: extractArray(rs?.data), soporteStats: est?.data || {} }
  }
}

// ----------------------------------------------------------------------
// Nota: Este modelo orquesta llamadas HTTP al backend oficial.
// Se mantiene ≤150 líneas, sin lógica de negocio ni agregaciones.
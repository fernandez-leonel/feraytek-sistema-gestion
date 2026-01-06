const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'
const LOCAL_BACKEND = process.env.REACT_APP_LOCAL_BACKEND_URL || 'http://localhost:4001'

export const facturasService = {
  estadisticas: async () => {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/facturas/admin/estadisticas`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error al obtener estadísticas')
    return j?.data ?? j
  },
  listarTodas: async ({ page = 1, limit = 25 } = {}) => {
    const token = sessionStorage.getItem('token')
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) })
    const res = await fetch(`${LOCAL_BACKEND}/facturas/admin/todas?${qs.toString()}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error al listar facturas')
    const arr = Array.isArray(j?.data) ? j.data : (Array.isArray(j) ? j : [])
    const total = Number(j?.total ?? arr.length)
    return { data: arr, total }
  },
  obtenerPorId: async (id) => {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/facturas/admin/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error al obtener factura')
    return j?.data ?? j
  },
  crear: async (payload) => {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/facturas/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(payload)
    })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error al crear factura')
    return j?.data ?? j
  },
  marcarEnviada: async (id) => {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/facturas/admin/${id}/marcar-enviada`, { method: 'PATCH', headers: token ? { Authorization: `Bearer ${token}` } : {} })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error al marcar enviada')
    return j?.data ?? j
  },
  enviarEmail: async (id) => {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/facturas/admin/${id}/enviar-email`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {} })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error al enviar email')
    return j?.data ?? j
  },
  generarPDF: async (id) => {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/facturas/admin/${id}/generar-pdf`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {} })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error al generar PDF')
    return j?.data ?? j
  },
  buscar: async ({ numero, usuario, id_usuario, fecha_desde, fecha_hasta, email_enviado, limite } = {}) => {
    const token = sessionStorage.getItem('token')
    const qs = new URLSearchParams()
    if (numero) qs.set('numero', String(numero))
    if (usuario) qs.set('usuario', String(usuario))
    if (id_usuario) qs.set('id_usuario', String(id_usuario))
    if (fecha_desde) qs.set('fecha_desde', String(fecha_desde))
    if (fecha_hasta) qs.set('fecha_hasta', String(fecha_hasta))
    if (email_enviado != null) qs.set('email_enviado', String(email_enviado))
    if (limite) qs.set('limite', String(limite))
    const res = await fetch(`${LOCAL_BACKEND}/facturas/admin/buscar?${qs.toString()}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error en búsqueda de facturas')
    const arr = Array.isArray(j?.data) ? j.data : (Array.isArray(j) ? j : [])
    const total = Number(j?.total ?? arr.length)
    return { data: arr, total }
  }
}
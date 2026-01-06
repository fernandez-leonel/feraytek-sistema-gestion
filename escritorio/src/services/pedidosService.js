const LOCAL_BACKEND = process.env.REACT_APP_LOCAL_BACKEND_URL || 'http://localhost:4001'

export const pedidosService = {
  listar: async (params = {}) => {
    const token = sessionStorage.getItem('token')
    const qs = new URLSearchParams()
    const { page = 1, per_page = 25, estado, metodo_pago, fecha_desde, fecha_hasta, id, id_usuario } = params
    qs.set('page', String(page))
    qs.set('per_page', String(per_page))
    if (estado) qs.set('estado', String(estado))
    if (metodo_pago) qs.set('metodo_pago', String(metodo_pago))
    if (fecha_desde) qs.set('fecha_desde', String(fecha_desde))
    if (fecha_hasta) qs.set('fecha_hasta', String(fecha_hasta))
    if (id) qs.set('id', String(id))
    if (id_usuario) qs.set('id_usuario', String(id_usuario))
    const res = await fetch(`${LOCAL_BACKEND}/pedidos?${qs.toString()}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error al listar pedidos')
    return j
  },
  listarUsuario: async (params = {}) => {
    const token = sessionStorage.getItem('token')
    const qs = new URLSearchParams()
    const { page = 1, per_page = 25, estado, id, fecha_desde, fecha_hasta } = params
    qs.set('page', String(page))
    qs.set('per_page', String(per_page))
    if (estado) qs.set('estado', String(estado))
    if (id) qs.set('id', String(id))
    if (fecha_desde) qs.set('fecha_desde', String(fecha_desde))
    if (fecha_hasta) qs.set('fecha_hasta', String(fecha_hasta))
    const res = await fetch(`${LOCAL_BACKEND}/pedidos/usuario?${qs.toString()}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error al listar mis pedidos')
    return j
  },
  obtener: async (id) => {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/pedidos/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error al obtener pedido')
    return j?.data ?? j
  },
  historial: async (id) => {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/pedidos/${id}/historial`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error al obtener historial')
    const arr = Array.isArray(j?.data) ? j.data : (Array.isArray(j) ? j : [])
    return arr
  },
  actualizarEstado: async (id, estado) => {
    const token = sessionStorage.getItem('token')
    const normalized = (() => { const s = String(estado).toLowerCase(); return s === 'devuelto' ? 'cancelado' : s })()
    const map = { pendiente: 1, procesando: 2, enviado: 3, entregado: 4, cancelado: 5 }
    const estado_id = map[normalized] ?? null
    const body = estado_id ? { estado: estado_id } : { estado: normalized }
    const res = await fetch(`${LOCAL_BACKEND}/pedidos/${id}/estado`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error al actualizar estado')
    return j?.data ?? j
  }
}
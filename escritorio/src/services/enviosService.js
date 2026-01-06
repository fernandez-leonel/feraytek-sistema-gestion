const LOCAL_BACKEND = process.env.REACT_APP_LOCAL_BACKEND_URL || 'http://localhost:4001'

export const enviosService = {
  listar: async () => {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/envios`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.message || j?.error || 'Error al listar envios')
    return j
  },
  obtener: async (id) => {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/envios/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.message || j?.error || 'Error al obtener envio')
    return j?.data ?? j
  },
  crear: async (payload) => {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/envios`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload) })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.message || j?.error || 'Error al crear envío')
    return j?.data ?? j
  },
  actualizar: async (id, payload) => {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/envios/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload) })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.message || j?.error || 'Error al actualizar envío')
    return j?.data ?? j
  },
  cambiarEstado: async (id, estado) => {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/envios/${id}/estado`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ estado_envio: estado }) })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.message || j?.error || 'Error al cambiar estado de envío')
    return j?.data ?? j
  },
  crearParaExistentes: async () => {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/envios/crear-para-existentes`, { method: 'POST', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.message || j?.error || 'Error al crear envíos para pedidos existentes')
    return j?.data ?? j
  }
}
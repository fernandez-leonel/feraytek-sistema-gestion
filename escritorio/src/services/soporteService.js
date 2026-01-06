// =====================================================================
// Soporte Service (Frontend)
// Consume endpoints locales para tickets de soporte
// - Métodos: crear, misTickets, obtener, estadisticas, responder, prioridad, cerrar
// =====================================================================

const LOCAL_BACKEND = process.env.REACT_APP_LOCAL_BACKEND_URL || 'http://localhost:4001'

export const soporteService = {
  async crear(payload) {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/soporte`, { method:'POST', headers:{ 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{}) }, body: JSON.stringify(payload) })
    const j = await res.json(); if (!res.ok) throw new Error(j?.error || 'Error al crear ticket'); return j
  },
  async misTickets() {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/soporte/mis-tickets`, { headers: token?{ Authorization:`Bearer ${token}` }:{} })
    const j = await res.json(); if (!res.ok) throw new Error(j?.error || 'Error al listar mis tickets'); return Array.isArray(j?.data)? j.data : (Array.isArray(j)? j : [])
  },
  async obtener(id) {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/soporte/${id}`, { headers: token?{ Authorization:`Bearer ${token}` }:{} })
    const j = await res.json(); if (!res.ok) throw new Error(j?.error || 'Error al obtener ticket'); return j?.data ?? j
  },
  async estadisticas() {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/soporte/estadisticas`, { headers: token?{ Authorization:`Bearer ${token}` }:{} })
    const j = await res.json(); if (!res.ok) throw new Error(j?.error || 'Error al obtener estadísticas'); return j?.data ?? j
  },
  async responder(id, payload) {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/soporte/${id}/responder`, { method:'PUT', headers:{ 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{}) }, body: JSON.stringify(payload) })
    const j = await res.json(); if (!res.ok) throw new Error(j?.error || 'Error al responder'); return j
  },
  async prioridad(id, prioridad) {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/soporte/${id}/prioridad`, { method:'PUT', headers:{ 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{}) }, body: JSON.stringify({ prioridad }) })
    const j = await res.json(); if (!res.ok) throw new Error(j?.error || 'Error al cambiar prioridad'); return j
  },
  async listarTodos(params = {}) {
    const token = sessionStorage.getItem('token')
    const qs = new URLSearchParams()
    if (params.estado) qs.set('estado', String(params.estado))
    if (params.prioridad) qs.set('prioridad', String(params.prioridad))
    qs.set('page', String(params.page ?? 1))
    qs.set('limit', String(params.limit ?? 10))
    const res = await fetch(`${LOCAL_BACKEND}/soporte?${qs.toString()}`, { headers: token?{ Authorization:`Bearer ${token}` }:{} })
    const j = await res.json(); if (!res.ok) throw new Error(j?.error || 'Error al listar tickets'); return j
  },
  async cerrar(id, payload) {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/soporte/${id}/cerrar`, { method:'PUT', headers:{ 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{}) }, body: JSON.stringify(payload) })
    const j = await res.json(); if (!res.ok) throw new Error(j?.error || 'Error al cerrar ticket'); return j
  }
}
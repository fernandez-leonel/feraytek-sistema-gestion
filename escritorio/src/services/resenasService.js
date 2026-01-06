// =====================================================================
// Reseñas Service (Frontend)
// Consume endpoints locales para reseñas de productos
// =====================================================================

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'

export const resenasService = {
  async crear(payload) {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${API_BASE}/resenas`, { method:'POST', headers:{ 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{}) }, body: JSON.stringify(payload) })
    const j = await res.json(); if (!res.ok) throw new Error(j?.error || 'Error al crear reseña'); return j?.data ?? j
  },
  async listarAdmin() {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${API_BASE}/resenas`, { headers: token?{ Authorization:`Bearer ${token}` }:{} })
    const j = await res.json(); if (!res.ok) throw new Error(j?.error || 'Error al listar reseñas'); return Array.isArray(j?.data)? j.data : (Array.isArray(j)? j : [])
  },
  async listarProducto(id_producto) {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${API_BASE}/resenas/producto/${encodeURIComponent(id_producto)}`, { headers: token?{ Authorization:`Bearer ${token}` }:{} })
    const j = await res.json(); if (!res.ok) throw new Error(j?.error || 'Error al listar reseñas del producto'); return Array.isArray(j?.data)? j.data : (Array.isArray(j)? j : [])
  },
  async listar(params = {}) { // helper: si hay producto usa endpoint específico
    if (params?.producto) return this.listarProducto(params.producto)
    return this.listarAdmin()
  },
  async listarEstado(estado) {
    const token = sessionStorage.getItem('token')
    const qs = new URLSearchParams()
    if (estado) qs.set('estado', String(estado))
    const res = await fetch(`${API_BASE}/resenas?${qs.toString()}`, { headers: token?{ Authorization:`Bearer ${token}` }:{} })
    const j = await res.json(); if (!res.ok) throw new Error(j?.error || 'Error al listar reseñas por estado'); return Array.isArray(j?.data)? j.data : (Array.isArray(j)? j : [])
  },
  async obtener(id) {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${API_BASE}/resenas/obtener?id=${encodeURIComponent(id)}`, { headers: token?{ Authorization:`Bearer ${token}` }:{} })
    const j = await res.json(); if (!res.ok) throw new Error(j?.error || 'Error al obtener reseña'); return j?.data ?? j
  },
  async actualizar(id, payload) {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${API_BASE}/resenas/${encodeURIComponent(id)}`, { method:'PUT', headers:{ 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{}) }, body: JSON.stringify(payload) })
    const j = await res.json(); if (!res.ok) throw new Error(j?.error || 'Error al actualizar reseña'); return j?.data ?? j
  },
  async cambiarEstado(id, estado, motivo='') {
    const token = sessionStorage.getItem('token')
    const headers = { 'Content-Type':'application/json', Accept:'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{}) }
    // Ruta principal según tu implementación
    const primary = `${API_BASE}/resenas/${encodeURIComponent(id)}/estado`
    const payload = { estado }
    if (motivo) payload.motivo = motivo
    let res, j
    try {
      res = await fetch(primary, { method:'PUT', headers, body: JSON.stringify(payload) })
      j = await res.json().catch(()=>({}))
      if (res.ok) return j?.data ?? j
    } catch {}
    // Fallback alternativo si el servidor usa otra ruta
    try {
      const fallback = `${API_BASE}/resenas/estado/${encodeURIComponent(id)}`
      const r2 = await fetch(fallback, { method:'PUT', headers, body: JSON.stringify(payload) })
      const j2 = await r2.json().catch(()=>({}))
      if (r2.ok) return j2?.data ?? j2
      throw new Error(j2?.error || `Error ${r2.status} en ${fallback}`)
    } catch (e) {
      throw new Error(j?.error || `Error ${res?.status||''} en ${primary}` || e.message)
    }
  }
}
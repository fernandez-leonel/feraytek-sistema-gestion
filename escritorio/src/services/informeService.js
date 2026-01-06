const LOCAL_BACKEND = process.env.REACT_APP_LOCAL_BACKEND_URL || 'http://localhost:4001'

const authHeaders = () => {
  const token = sessionStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const informeService = {
  ventas: async (params = {}) => {
    const qs = new URLSearchParams()
    if (params.fecha_inicio) qs.set('fecha_inicio', String(params.fecha_inicio))
    if (params.fecha_fin) qs.set('fecha_fin', String(params.fecha_fin))
    const res = await fetch(`${LOCAL_BACKEND}/api/informe/ventas?${qs.toString()}`, { headers: authHeaders() })
    const j = await res.json(); if (!res.ok) throw new Error(j?.error || j?.message || 'Error informe ventas'); return j
  },
  envios: async (params = {}) => {
    const qs = new URLSearchParams()
    if (params.fecha_inicio) qs.set('fecha_inicio', String(params.fecha_inicio))
    if (params.fecha_fin) qs.set('fecha_fin', String(params.fecha_fin))
    const res = await fetch(`${LOCAL_BACKEND}/api/informe/envios?${qs.toString()}`, { headers: authHeaders() })
    const j = await res.json(); if (!res.ok) throw new Error(j?.error || j?.message || 'Error informe envíos'); return j
  },
  usuarios: async (params = {}) => {
    const qs = new URLSearchParams()
    if (params.fecha_inicio) qs.set('fecha_inicio', String(params.fecha_inicio))
    if (params.fecha_fin) qs.set('fecha_fin', String(params.fecha_fin))
    const res = await fetch(`${LOCAL_BACKEND}/api/informe/usuarios?${qs.toString()}`, { headers: authHeaders() })
    const j = await res.json(); if (!res.ok) throw new Error(j?.error || j?.message || 'Error informe usuarios'); return j
  },
  productos: async (params = {}) => {
    const qs = new URLSearchParams()
    if (params.fecha_inicio) qs.set('fecha_inicio', String(params.fecha_inicio))
    if (params.fecha_fin) qs.set('fecha_fin', String(params.fecha_fin))
    const res = await fetch(`${LOCAL_BACKEND}/api/informe/productos?${qs.toString()}`, { headers: authHeaders() })
    const j = await res.json(); if (!res.ok) throw new Error(j?.error || j?.message || 'Error informe productos'); return j
  },
  resenasSoporte: async (params = {}) => {
    const qs = new URLSearchParams()
    if (params.fecha_inicio) qs.set('fecha_inicio', String(params.fecha_inicio))
    if (params.fecha_fin) qs.set('fecha_fin', String(params.fecha_fin))
    const res = await fetch(`${LOCAL_BACKEND}/api/informe/resenas-soporte?${qs.toString()}`, { headers: authHeaders() })
    const j = await res.json(); if (!res.ok) throw new Error(j?.error || j?.message || 'Error informe reseñas'); return j
  },
}
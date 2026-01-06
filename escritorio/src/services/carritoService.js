// =====================================================================
// Carrito Service (Frontend)
// Consume endpoints locales para carrito (usuario y admin)
// =====================================================================

const LOCAL_BACKEND = process.env.REACT_APP_LOCAL_BACKEND_URL || 'http://localhost:4001'

function auth() { const t = sessionStorage.getItem('token'); return t ? { Authorization: `Bearer ${t}` } : {} }

export const carritoService = {
  async listar() { const r = await fetch(`${LOCAL_BACKEND}/carrito`, { headers: auth() }); const j = await r.json(); if (!r.ok) throw new Error(j?.message||j?.error||'Error al listar'); return j?.data ?? j },
  async agregar(payload) { const r = await fetch(`${LOCAL_BACKEND}/carrito`, { method:'POST', headers:{ 'Content-Type':'application/json', ...auth() }, body: JSON.stringify(payload) }); const j = await r.json(); if (!r.ok) throw new Error(j?.message||j?.error||'Error al agregar'); return j?.data ?? j },
  async eliminarItem(payload) { const r = await fetch(`${LOCAL_BACKEND}/carrito/item`, { method:'DELETE', headers:{ 'Content-Type':'application/json', ...auth() }, body: JSON.stringify(payload) }); const j = await r.json(); if (!r.ok) throw new Error(j?.message||j?.error||'Error al eliminar'); return j?.data ?? j },
  async vaciar() { const r = await fetch(`${LOCAL_BACKEND}/carrito`, { method:'DELETE', headers: auth() }); const j = await r.json(); if (!r.ok) throw new Error(j?.message||j?.error||'Error al vaciar'); return j?.data ?? j },
  async todos() { const r = await fetch(`${LOCAL_BACKEND}/carrito/admin/todos`, { headers: auth() }); const j = await r.json(); if (!r.ok) throw new Error(j?.message||j?.error||'Error al listar todos'); return j?.data ?? j },
  async usuario(id) { const r = await fetch(`${LOCAL_BACKEND}/carrito/admin/usuario/${id}`, { headers: auth() }); const j = await r.json(); if (!r.ok) throw new Error(j?.message||j?.error||'Error al ver usuario'); return j?.data ?? j },
  async abandonados(dias=7) { const r = await fetch(`${LOCAL_BACKEND}/carrito/admin/abandonados?dias=${encodeURIComponent(dias)}`, { headers: auth() }); const j = await r.json(); if (!r.ok) throw new Error(j?.message||j?.error||'Error en abandonados'); return j?.data ?? j },
  async limpiarAbandonados(dias=30) { const r = await fetch(`${LOCAL_BACKEND}/carrito/admin/limpiar-abandonados`, { method:'DELETE', headers:{ 'Content-Type':'application/json', ...auth() }, body: JSON.stringify({ dias }) }); const j = await r.json(); if (!r.ok) throw new Error(j?.message||j?.error||'Error al limpiar'); return j?.data ?? j },
  async estadisticas() { const r = await fetch(`${LOCAL_BACKEND}/carrito/admin/estadisticas`, { headers: auth() }); const j = await r.json(); if (!r.ok) throw new Error(j?.message||j?.error||'Error en estadísticas'); return j?.data ?? j }
}
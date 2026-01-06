// Rutas de Pedidos: lista, detalle, historial y actualización de estado
const express = require('express')
const router = express.Router()

const { apiClient } = require('../lib/apiClient')
const { extractArray } = require('../lib/utils')
const { estadoTextFromNumber, estadoNumberFromText, normalizePedido } = require('../lib/pedidos')

router.get('/', async (req, res) => {
  try {
    const auth = req.headers.authorization
    const hdr = auth ? { Authorization: auth } : {}
    const { page = 1, per_page = 25, estado, metodo_pago, fecha_desde, fecha_hasta, id, id_usuario } = req.query
    const p = Number(page), pp = Number(per_page)
    if (!Number.isFinite(p) || p < 1) return res.status(400).json({ error: 'page inválido' })
    if (!Number.isFinite(pp) || pp < 1) return res.status(400).json({ error: 'per_page inválido' })
    const resp = id_usuario ? await apiClient.get(`/pedidos?id_usuario=${encodeURIComponent(id_usuario)}`, { headers: hdr }) : await apiClient.get('/pedidos', { headers: hdr })
    let arr = extractArray(resp.data)
    if (!arr.length) {
      try {
        const usersResp = await apiClient.get('/admin/users/list?page=1&limit=200', { headers: hdr })
        const usersArr = extractArray(usersResp.data)
        const ids = usersArr.map(u => Number(u.id ?? u.id_usuario ?? u.user_id)).filter(n => Number.isFinite(n) && n > 0)
        if (ids.length) {
          const results = await Promise.allSettled(ids.map(uid => apiClient.get(`/pedidos?id_usuario=${uid}`, { headers: hdr })))
          const merged = []
          for (const r of results) {
            if (r.status === 'fulfilled') {
              const a = extractArray(r.value.data)
              if (a.length) merged.push(...a)
            }
          }
          arr = merged
        }
      } catch {}
    }
    arr = arr.map(normalizePedido)
    arr = arr.filter(x => {
      if (id) { const xid = String(x.id ?? ''); if (xid !== String(id)) return false }
      if (estado) {
        const ef = Number.isFinite(Number(estado)) ? estadoTextFromNumber(Number(estado)).toLowerCase() : String(estado).toLowerCase()
        const est = String(x.estado || '').toLowerCase()
        if (est !== ef) return false
      }
      if (metodo_pago) { const mp = String(x.metodo_pago ?? '').toLowerCase(); if (mp !== String(metodo_pago).toLowerCase()) return false }
      const cd = new Date(x.created_at ?? 0).getTime()
      if (fecha_desde) { if (cd < new Date(fecha_desde).getTime()) return false }
      if (fecha_hasta) { if (cd > new Date(fecha_hasta).getTime()) return false }
      return true
    })
    arr.sort((a,b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
    const total = arr.length
    const start = (p-1)*pp
    const pageItems = arr.slice(start, start+pp)
    return res.json({ data: pageItems, total, page: p, per_page: pp })
  } catch (e) {
    return res.status(400).json({ error: e?.response?.data?.error || e?.message || 'Error al listar pedidos' })
  }
})

router.get('/usuario', async (req, res) => {
  try {
    const auth = req.headers.authorization
    const hdr = auth ? { Authorization: auth } : {}
    const { page = 1, per_page = 25, estado, id, fecha_desde, fecha_hasta } = req.query
    const p = Number(page), pp = Number(per_page)
    if (!Number.isFinite(p) || p < 1) return res.status(400).json({ error: 'page inválido' })
    if (!Number.isFinite(pp) || pp < 1) return res.status(400).json({ error: 'per_page inválido' })
    const r = await apiClient.get('/pedidos/usuario', { headers: hdr })
    let arr = extractArray(r.data).map(normalizePedido)
    arr = arr.filter(x => {
      if (id) { const xid = String(x.id ?? ''); if (xid !== String(id)) return false }
      if (estado) {
        const ef = Number.isFinite(Number(estado)) ? estadoTextFromNumber(Number(estado)).toLowerCase() : String(estado).toLowerCase()
        const est = String(x.estado || '').toLowerCase()
        if (est !== ef) return false
      }
      const cd = new Date(x.created_at ?? 0).getTime()
      if (fecha_desde) { if (cd < new Date(fecha_desde).getTime()) return false }
      if (fecha_hasta) { if (cd > new Date(fecha_hasta).getTime()) return false }
      return true
    })
    arr.sort((a,b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
    const total = arr.length
    const start = (p-1)*pp
    const pageItems = arr.slice(start, start+pp)
    return res.json({ data: pageItems, total, page: p, per_page: pp })
  } catch (e) { return res.status(400).json({ error: e?.response?.data?.error || e?.message || 'Error al listar pedidos del usuario' }) }
})

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: 'ID inválido' })
    const auth = req.headers.authorization
    const hdr = auth ? { Authorization: auth } : {}
    const r = await apiClient.get(`/pedidos/${id}`, { headers: hdr })
    const obj = r.data?.data ?? r.data
    const norm = obj && typeof obj === 'object' ? normalizePedido(obj) : obj
    return res.json({ data: norm })
  } catch (e) { return res.status(400).json({ error: e?.response?.data?.error || e?.message || 'Error al obtener pedido' }) }
})

router.get('/:id/historial', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: 'ID inválido' })
    const auth = req.headers.authorization
    const hdr = auth ? { Authorization: auth } : {}
    let r
    try { r = await apiClient.get(`/historial_pedidos/pedido/${id}`, { headers: hdr }) } catch {}
    if (!r) { try { r = await apiClient.get(`/historial-pedidos/pedido/${id}`, { headers: hdr }) } catch {} }
    if (!r) { try { r = await apiClient.get(`/historial_pedidos?pedido=${id}`, { headers: hdr }) } catch {} }
    if (!r) { try { r = await apiClient.get(`/pedidos/${id}/historial`, { headers: hdr }) } catch {} }
    if (!r) { r = await apiClient.get(`/pedidos/${id}/history`, { headers: hdr }) }
    return res.json(r.data)
  } catch (e) { return res.status(400).json({ error: e?.response?.data?.error || e?.message || 'Error al obtener historial' }) }
})

router.put('/:id/estado', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: 'ID inválido' })
    const { estado } = req.body || {}
    if (estado == null) return res.status(400).json({ error: 'Estado inválido' })
    const estadoNum = Number.isFinite(Number(estado)) ? Number(estado) : estadoNumberFromText(estado)
    if (!Number.isFinite(estadoNum) || estadoNum <= 0) return res.status(400).json({ error: 'Estado inválido' })
    const auth = req.headers.authorization
    const hdr = auth ? { Authorization: auth } : {}
    const r = await apiClient.put(`/pedidos/${id}/estado`, { estado: estadoNum }, { headers: hdr })
    return res.json(r.data)
  } catch (e) { return res.status(400).json({ error: e?.response?.data?.error || e?.message || 'Error al actualizar estado' }) }
})

module.exports = router
const express = require('express')
const router = express.Router()
const { apiClient } = require('../lib/apiClient')

function authHeaders(req) {
  const auth = req.headers.authorization
  return auth ? { Authorization: auth } : {}
}

router.get('/facturas/admin/estadisticas', async (req, res) => {
  try {
    const hdr = authHeaders(req)
    const r = await apiClient.get('/facturas/admin/estadisticas', { headers: hdr })
    return res.json(r.data)
  } catch (e) { return res.status(400).json({ error: e?.response?.data?.error || e?.message || 'Error al obtener estadísticas' }) }
})

router.get('/facturas/admin/todas', async (req, res) => {
  try {
    const hdr = authHeaders(req)
    const r = await apiClient.get('/facturas/admin/todas', { headers: hdr })
    const arr = Array.isArray(r.data?.data) ? r.data.data : (Array.isArray(r.data) ? r.data : [])
    const total = Number(r.data?.total ?? arr.length)
    const page = Number(req.query.page || 1)
    const limit = Number(req.query.limit || arr.length)
    const start = Math.max(0, (page - 1) * limit)
    const sliced = arr.slice(start, start + limit)
    return res.json({ data: sliced, total })
  } catch (e) { return res.status(400).json({ error: e?.response?.data?.error || e?.message || 'Error al listar facturas' }) }
})

router.get('/facturas/admin/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: 'ID inválido' })
    const hdr = authHeaders(req)
    const r = await apiClient.get(`/facturas/admin/${id}`, { headers: hdr })
    return res.json(r.data)
  } catch (e) { return res.status(404).json({ error: e?.response?.data?.error || e?.message || 'Factura no encontrada' }) }
})

router.post('/facturas/admin', async (req, res) => {
  try {
    const {
      id_usuario, id_pedido, total,
      tipo, subtotal, iva_total, id_pago, pdf_url
    } = req.body || {}
    if (!Number.isFinite(Number(id_usuario)) || !Number.isFinite(Number(id_pedido)) || !Number.isFinite(Number(total))) {
      return res.status(400).json({ error: 'Campos requeridos inválidos' })
    }
    const hdr = authHeaders(req)
    const r = await apiClient.post('/facturas/admin', { id_usuario, id_pedido, total, tipo, subtotal, iva_total, id_pago, pdf_url }, { headers: hdr })
    return res.status(201).json(r.data)
  } catch (e) { return res.status(400).json({ error: e?.response?.data?.error || e?.message || 'Error al crear factura' }) }
})

router.patch('/facturas/admin/:id/marcar-enviada', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: 'ID inválido' })
    const hdr = authHeaders(req)
    const r = await apiClient.patch(`/facturas/admin/${id}/marcar-enviada`, {}, { headers: hdr })
    return res.json(r.data)
  } catch (e) { return res.status(400).json({ error: e?.response?.data?.error || e?.message || 'Error al marcar enviada' }) }
})

router.post('/facturas/admin/:id/enviar-email', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: 'ID inválido' })
    const hdr = authHeaders(req)
    const r = await apiClient.post(`/facturas/admin/${id}/enviar-email`, {}, { headers: hdr })
    return res.json(r.data)
  } catch (e) { return res.status(400).json({ error: e?.response?.data?.error || e?.message || 'Error al enviar email' }) }
})

router.post('/facturas/admin/:id/generar-pdf', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: 'ID inválido' })
    const hdr = authHeaders(req)
    const r = await apiClient.post(`/facturas/admin/${id}/generar-pdf`, {}, { headers: hdr })
    return res.json(r.data)
  } catch (e) { return res.status(400).json({ error: e?.response?.data?.error || e?.message || 'Error al generar PDF' }) }
})

router.get('/facturas/admin/buscar', async (req, res) => {
  try {
    const hdr = authHeaders(req)
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(req.query || {})) {
      if (v != null && String(v).length) qs.set(k, String(v))
    }
    const r = await apiClient.get(`/facturas/admin/buscar?${qs.toString()}`, { headers: hdr })
    return res.json(r.data)
  } catch (e) { return res.status(400).json({ error: e?.response?.data?.error || e?.message || 'Error en búsqueda de facturas' }) }
})

module.exports = router
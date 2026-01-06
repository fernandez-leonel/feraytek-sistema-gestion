// Rutas de validación para Productos
const express = require('express')
const router = express.Router()
const { apiClient } = require('../lib/apiClient')

router.post('/productos', async (req, res) => {
  try {
    const { nombre, descripcion, precio_base, stock, iva_porcentaje, stock_minimo, id_categoria, estado } = req.body || {}
    const nums = { precio_base, stock, iva_porcentaje, stock_minimo, id_categoria }
    for (const [k, v] of Object.entries(nums)) {
      const n = Number(v)
      if (!Number.isFinite(n) || n < 0) return res.status(400).json({ error: `${k} debe ser un número positivo` })
    }
    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) return res.status(400).json({ error: 'nombre requerido' })
    const auth = req.headers.authorization
    const hdr = auth ? { Authorization: auth } : {}
    const payload = { nombre, descripcion, precio_base: Number(precio_base), stock: Number(stock), iva_porcentaje: Number(iva_porcentaje), stock_minimo: Number(stock_minimo), id_categoria: Number(id_categoria), estado }
    const r = await apiClient.post('/productos', payload, { headers: hdr })
    return res.json(r.data)
  } catch (e) { return res.status(400).json({ error: e?.response?.data?.error || e?.message || 'Error al crear producto' }) }
})

router.put('/productos/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, descripcion, precio_base, stock, iva_porcentaje, stock_minimo, id_categoria, estado } = req.body || {}
    const nums = { precio_base, stock, iva_porcentaje, stock_minimo, id_categoria }
    for (const [k, v] of Object.entries(nums)) {
      const n = Number(v)
      if (!Number.isFinite(n) || n < 0) return res.status(400).json({ error: `${k} debe ser un número positivo` })
    }
    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) return res.status(400).json({ error: 'nombre requerido' })
    const auth = req.headers.authorization
    const hdr = auth ? { Authorization: auth } : {}
    const payload = { nombre, descripcion, precio_base: Number(precio_base), stock: Number(stock), iva_porcentaje: Number(iva_porcentaje), stock_minimo: Number(stock_minimo), id_categoria: Number(id_categoria), estado }
    const r = await apiClient.put(`/productos/${id}`, payload, { headers: hdr })
    return res.json(r.data)
  } catch (e) { return res.status(400).json({ error: e?.response?.data?.error || e?.message || 'Error al actualizar producto' }) }
})

module.exports = router
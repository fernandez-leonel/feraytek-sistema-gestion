// Rutas de validación para Variantes
const express = require('express')
const router = express.Router()
const { apiClient } = require('../lib/apiClient')
const axios = require('axios')
const altClient = axios.create({ baseURL: (process.env.API_BASE_ALT || 'http://localhost:3001/api') })

router.post('/variantes', async (req, res) => {
  try {
    const { id_producto, nombre_variante, valor_variante, precio_adicional, stock } = req.body || {}
    const idsane = Number(id_producto)
    if (!Number.isFinite(idsane) || idsane <= 0) return res.status(400).json({ error: 'id_producto inválido' })
    const nums = { precio_adicional, stock }
    for (const [k, v] of Object.entries(nums)) {
      const n = Number(v)
      if (!Number.isFinite(n) || n < 0) return res.status(400).json({ error: `${k} debe ser un número positivo` })
    }
    if (!nombre_variante || !valor_variante) return res.status(400).json({ error: 'nombre_variante y valor_variante requeridos' })
    const auth = req.headers.authorization
    const hdr = auth ? { Authorization: auth } : {}
    // Intento 1: API con esquema variantes_productos
    const payloadA = { id_producto: idsane, atributo: nombre_variante, valor: valor_variante, precio: Number(precio_adicional), stock: Number(stock) }
    try {
      const r = await apiClient.post('/variantes_productos', payloadA, { headers: hdr })
      return res.json(r.data)
    } catch (e1) {
      // Intento 2: API con esquema variantes
      const payloadB = { id_producto: idsane, nombre_variante, valor_variante, precio_adicional: Number(precio_adicional), stock: Number(stock) }
      try {
        const r2 = await apiClient.post('/variantes', payloadB, { headers: hdr })
        return res.json(r2.data)
      } catch (e2) {
        const r3 = await altClient.post('/variantes', payloadB, { headers: hdr }).catch(() => null)
        if (!r3) throw e2
        return res.json(r3.data)
      }
    }
  } catch (e) { return res.status(400).json({ error: e?.response?.data?.error || e?.message || 'Error al crear variante' }) }
})

router.put('/variantes/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { nombre_variante, valor_variante, precio_adicional, stock } = req.body || {}
    const nums = { precio_adicional, stock }
    for (const [k, v] of Object.entries(nums)) {
      const n = Number(v)
      if (!Number.isFinite(n) || n < 0) return res.status(400).json({ error: `${k} debe ser un número positivo` })
    }
    if (!nombre_variante || !valor_variante) return res.status(400).json({ error: 'nombre_variante y valor_variante requeridos' })
    const auth = req.headers.authorization
    const hdr = auth ? { Authorization: auth } : {}
    // Intento 1: API variantes_productos
    const payloadA = { atributo: nombre_variante, valor: valor_variante, precio: Number(precio_adicional), stock: Number(stock) }
    try {
      const r = await apiClient.put(`/variantes_productos/${id}`, payloadA, { headers: hdr })
      return res.json(r.data)
    } catch (e1) {
      // Intento 2: API variantes
      const payloadB = { nombre_variante, valor_variante, precio_adicional: Number(precio_adicional), stock: Number(stock) }
      try {
        const r2 = await apiClient.put(`/variantes/${id}`, payloadB, { headers: hdr })
        return res.json(r2.data)
      } catch (e2) {
        const r3 = await altClient.put(`/variantes/${id}`, payloadB, { headers: hdr }).catch(() => null)
        if (!r3) throw e2
        return res.json(r3.data)
      }
    }
  } catch (e) { return res.status(400).json({ error: e?.response?.data?.error || e?.message || 'Error al actualizar variante' }) }
})

module.exports = router
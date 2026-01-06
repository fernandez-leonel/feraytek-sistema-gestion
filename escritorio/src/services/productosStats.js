// Estadísticas derivadas del módulo de Productos
// - Calcula métricas: activos, inactivos, críticos, top categorías.
// - Cruza datos de variantes e imágenes para enriquecer el dashboard.

import { productosService } from './productosService'
import { variantesService } from './variantesService'
import { imagenesService } from './imagenesService'

export const productosStats = async () => {
  let productos = []
  try { productos = await productosService.listar({ estado: 'todos' }) } catch {}
  if (!Array.isArray(productos) || productos.length === 0) {
    try {
      const activos = await productosService.listar({ estado: 'activo' })
      const inactivos = await productosService.listar({ estado: 'inactivo' })
      const map = new Map()
      ;[...(activos||[]), ...(inactivos||[])].forEach(p => { const id = p?.id || p?.id_producto || p?.producto_id || Math.random(); if (!map.has(id)) map.set(id, p) })
      productos = Array.from(map.values())
    } catch {}
  }
  const [variantes, imagenes] = await Promise.all([
    variantesService.listar().catch(() => []),
    imagenesService.listar().catch(() => [])
  ])
  const estadoNorm = (p) => String(p.estado ?? (p.activo === true ? 'activo' : 'inactivo')).toLowerCase()
  const activos = productos.filter(p => estadoNorm(p) === 'activo').length
  const inactivos = productos.filter(p => estadoNorm(p) !== 'activo').length
  const criticos = productos.filter(p => {
    const stock = p.stock ?? 0
    const min = p.stock_minimo ?? p.stockMinimo ?? 0
    return typeof stock === 'number' && typeof min === 'number' && stock <= min
  }).length
  const byCat = {}
  for (const p of productos) {
    const cid = p.id_categoria ?? p.categoria_id ?? p.categoria?.id ?? 'sin'
    byCat[cid] = (byCat[cid] || 0) + 1
  }
  const categoriasTop = Object.entries(byCat)
    .sort((a,b) => b[1]-a[1])
    .slice(0,5)
    .map(([id,count]) => ({ id, count }))
  const variantsByProduct = {}
  for (const v of variantes) {
    const pid = v.id_producto ?? v.producto_id
    if (pid != null) variantsByProduct[pid] = (variantsByProduct[pid] || 0) + 1
  }
  const imagesByProduct = {}
  for (const img of imagenes) {
    const pid = img.id_producto ?? img.producto_id
    if (pid != null) imagesByProduct[pid] = (imagesByProduct[pid] || 0) + 1
  }
  return { activos, inactivos, criticos, categoriasTop, variantsByProduct, imagesByProduct }
}
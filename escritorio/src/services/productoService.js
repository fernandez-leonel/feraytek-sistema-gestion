import axios from 'axios'

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'

const client = axios.create({ baseURL: API_BASE })

client.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers.Accept = 'application/json'
  return config
})

export const productosService = {
  listar: async () => {
    const { data } = await client.get('/productos')
    return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : (Array.isArray(data?.result) ? data.result : []))
  },
  obtener: async (id) => {
    const { data } = await client.get(`/productos/${id}`)
    return data?.data ?? data
  },
  crear: async (payload) => {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/validator/productos`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload) })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error de validación')
    return j?.data ?? j
  },
  actualizar: async (id, payload) => {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/validator/productos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload) })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error de validación')
    return j?.data ?? j
  },
  eliminar: async (id) => {
    const { data } = await client.delete(`/productos/${id}`)
    return data?.data ?? data
  }
}

export const categoriasService = {
  activas: async () => {
    const { data } = await client.get('/categorias/activas')
    return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : (Array.isArray(data?.result) ? data.result : []))
  },
  todas: async () => {
    const { data } = await client.get('/categorias')
    return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : (Array.isArray(data?.result) ? data.result : []))
  },
  obtener: async (id) => {
    const { data } = await client.get(`/categorias/${id}`)
    return data?.data ?? data
  }
}

export const variantesService = {
  listar: async () => {
    const { data } = await client.get('/variantes')
    return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : (Array.isArray(data?.result) ? data.result : []))
  },
  obtener: async (id) => {
    const { data } = await client.get(`/variantes/${id}`)
    return data?.data ?? data
  },
  crear: async (payload) => {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/validator/variantes`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload) })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error de validación')
    return j?.data ?? j
  },
  actualizar: async (id, payload) => {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/validator/variantes/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload) })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error de validación')
    return j?.data ?? j
  },
  eliminar: async (id) => {
    const { data } = await client.delete(`/variantes/${id}`)
    return data?.data ?? data
  }
}

const LOCAL_BACKEND = process.env.REACT_APP_LOCAL_BACKEND_URL || 'http://localhost:4001'

export const imagenesService = {
  listar: async () => {
    const { data } = await client.get('/imagenes_productos')
    return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : (Array.isArray(data?.result) ? data.result : []))
  },
  listarPorProducto: async (productoId) => {
    const { data } = await client.get(`/imagenes_productos/producto/${productoId}`)
    return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : (Array.isArray(data?.result) ? data.result : []))
  },
  crearUrl: async (payload) => {
    const body = { ...payload }
    if (body.id_producto != null && body.producto_id == null) body.producto_id = body.id_producto
    if (body.producto_id != null && body.id_producto == null) body.id_producto = body.producto_id
    const { data } = await client.post('/imagenes_productos', body)
    return data?.data ?? data
  },
  crearArchivo: async (productoId, posicion, alt_text, file, id_variante) => {
    const token = sessionStorage.getItem('token')
    const form = new FormData()
    form.append('productoId', String(productoId))
    form.append('posicion', String(posicion))
    form.append('alt_text', String(alt_text))
    if (id_variante) form.append('id_variante', String(id_variante))
    form.append('file', file)
    const res = await fetch(`${LOCAL_BACKEND}/local-images/upload`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error al subir imagen')
    return j
  },
  crearArchivos: async (productoId, alt_text, files, id_variante) => {
    const token = sessionStorage.getItem('token')
    const form = new FormData()
    form.append('productoId', String(productoId))
    form.append('alt_text', String(alt_text))
    if (id_variante) form.append('id_variante', String(id_variante))
    for (const f of files) form.append('files', f)
    const res = await fetch(`${LOCAL_BACKEND}/local-images/upload-multiple`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error al subir imágenes')
    return j
  },
  eliminar: async (id) => {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/local-images/${id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error al eliminar imagen')
    return j
  }
}

export const productosStats = async () => {
  const [productos, variantes, imagenes] = await Promise.all([
    productosService.listar(),
    variantesService.listar().catch(() => []),
    imagenesService.listar().catch(() => [])
  ])
  const activos = productos.filter(p => (p.estado ?? p.activo ?? 'activo') === 'activo').length
  const inactivos = productos.filter(p => (p.estado ?? p.activo ?? 'inactivo') !== 'activo').length
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
  const categoriasTop = Object.entries(byCat).sort((a,b) => b[1]-a[1]).slice(0,5).map(([id,count]) => ({ id, count }))
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

export const pedidosService = {
  listar: async (params = {}) => {
    const token = sessionStorage.getItem('token')
    const qs = new URLSearchParams()
    const { page = 1, per_page = 25, estado, metodo_pago, fecha_desde, fecha_hasta, id } = params
    qs.set('page', String(page))
    qs.set('per_page', String(per_page))
    if (estado) qs.set('estado', String(estado))
    if (metodo_pago) qs.set('metodo_pago', String(metodo_pago))
    if (fecha_desde) qs.set('fecha_desde', String(fecha_desde))
    if (fecha_hasta) qs.set('fecha_hasta', String(fecha_hasta))
    if (id) qs.set('id', String(id))
    const res = await fetch(`${LOCAL_BACKEND}/pedidos?${qs.toString()}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error al listar pedidos')
    return j
  },
  obtener: async (id) => {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/pedidos/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error al obtener pedido')
    return j?.data ?? j
  },
  historial: async (id) => {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/pedidos/${id}/historial`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error al obtener historial')
    const arr = Array.isArray(j?.data) ? j.data : (Array.isArray(j) ? j : [])
    return arr
  },
  actualizarEstado: async (id, estado) => {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/pedidos/${id}/estado`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ estado }) })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error al actualizar estado')
    return j?.data ?? j
  }
}

export const pagosService = {
  crear: async ({ id_pedido, descripcion, monto_total }) => {
    const token = sessionStorage.getItem('token')
    const body = { id_pedido: Number(id_pedido), descripcion: String(descripcion || ''), monto_total: Number(monto_total) }
    const res = await fetch(`${LOCAL_BACKEND}/validator/pagos`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error al crear pago')
    return j?.data ?? j
  },
  simularAprobacion: async ({ id_pedido, descripcion, monto_total }) => {
    const token = sessionStorage.getItem('token')
    const body = { id_pedido: Number(id_pedido), descripcion: String(descripcion || ''), monto_total: Number(monto_total) }
    const res = await fetch(`${LOCAL_BACKEND}/pagos/simular-aprobacion`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error al simular aprobación')
    return j?.data ?? j
  },
  adminList: async ({ page = 1, limit = 25 } = {}) => {
    const token = sessionStorage.getItem('token')
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) })
    const res = await fetch(`${LOCAL_BACKEND}/pagos/admin?${qs.toString()}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error al listar pagos')
    return j
  },
  consulta: async ({ estado, monto_min, page = 1, limit = 25 } = {}) => {
    const token = sessionStorage.getItem('token')
    const qs = new URLSearchParams()
    if (estado) qs.set('estado', String(estado))
    if (monto_min != null) qs.set('monto_min', String(monto_min))
    qs.set('page', String(page))
    qs.set('limit', String(limit))
    const res = await fetch(`${LOCAL_BACKEND}/pagos/consulta?${qs.toString()}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error en consulta de pagos')
    const arr = Array.isArray(j?.data) ? j.data : (Array.isArray(j) ? j : [])
    const total = Number(j?.total ?? arr.length)
    return { data: arr, total }
  }
}
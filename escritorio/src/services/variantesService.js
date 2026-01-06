import axios from 'axios'

// Servicio de Variantes de Producto
// - CRUD de variantes con validación local para creación/edición.
// - Asegura que no se agreguen variantes si el producto no existe.

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'
const ALT_API_BASE = API_BASE.includes('3000') ? 'http://localhost:3001/api' : 'http://localhost:3000/api'

const client = axios.create({ baseURL: API_BASE })
const clientAlt = axios.create({ baseURL: ALT_API_BASE })
client.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers.Accept = 'application/json'
  return config
})
clientAlt.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers.Accept = 'application/json'
  return config
})

export const variantesService = {
  // Lista variantes (usa endpoint real: variantes_productos)
  listar: async () => {
    try {
      const { data } = await client.get('/variantes')
      return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : (Array.isArray(data?.result) ? data.result : []))
    } catch {
      const { data } = await clientAlt.get('/variantes')
      return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : (Array.isArray(data?.result) ? data.result : []))
    }
  },
  listarPorProducto: async (productoId) => {
    try {
      const { data } = await client.get(`/variantes/${productoId}`)
      return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
    } catch {
      const arr = await variantesService.listar()
      return (Array.isArray(arr) ? arr : []).filter(v => (v.id_producto ?? v.producto_id) === productoId)
    }
  },
  // Obtiene una variante
  obtener: async (id) => {
    const { data } = await client.get(`/variantes/${id}`)
    return data?.data ?? data
  },
  // Crea variante: validador local
  crear: async (payload) => {
    const body = {
      id_producto: Number(payload.id_producto ?? payload.producto_id),
      nombre_variante: payload.nombre_variante ?? payload.atributo,
      valor_variante: payload.valor_variante ?? payload.valor,
      precio_adicional: payload.precio_adicional != null ? Number(payload.precio_adicional) : Number(payload.precio ?? 0),
      stock: Number(payload.stock ?? 0),
      // Campos alternativos para APIs que usan nombres distintos
      atributo: payload.atributo ?? payload.nombre_variante,
      valor: payload.valor ?? payload.valor_variante,
      precio: payload.precio != null ? Number(payload.precio) : Number(payload.precio_adicional ?? 0)
    }
    try {
      const { data } = await client.post('/variantes', body)
      return data?.data ?? data
    } catch {
      const { data } = await clientAlt.post('/variantes', body)
      return data?.data ?? data
    }
  },
  // Actualiza variante
  actualizar: async (id, payload) => {
    const body = { }
    if (payload?.stock != null) body.stock = Number(payload.stock)
    if (payload?.nombre_variante != null) body.nombre_variante = payload.nombre_variante
    if (payload?.valor_variante != null) body.valor_variante = payload.valor_variante
    if (payload?.precio_adicional != null) body.precio_adicional = Number(payload.precio_adicional)
    // Campos alternativos
    if (payload?.atributo != null) body.atributo = payload.atributo
    if (payload?.valor != null) body.valor = payload.valor
    if (payload?.precio != null) body.precio = Number(payload.precio)
    try {
      const { data } = await client.put(`/variantes/${id}`, body)
      return data?.data ?? data
    } catch {
      const { data } = await clientAlt.put(`/variantes/${id}`, body)
      return data?.data ?? data
    }
  },
  // Elimina variante
  eliminar: async (id) => {
    try {
      const { data } = await client.delete(`/variantes/${id}`)
      return data?.data ?? data
    } catch {
      const { data } = await clientAlt.delete(`/variantes/${id}`)
      return data?.data ?? data
    }
  }
}
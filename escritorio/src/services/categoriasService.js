import axios from 'axios'

// Servicio de Categorías
// - Lectura de categorías activas, todas y detalle por ID.
// - Normaliza respuestas y agrega token desde sessionStorage.

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'

const client = axios.create({ baseURL: API_BASE })
client.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers.Accept = 'application/json'
  return config
})

export const categoriasService = {
  // Categorías activas
  activas: async () => {
    const { data } = await client.get('/categorias/activas')
    return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : (Array.isArray(data?.result) ? data.result : []))
  },
  // Todas las categorías
  todas: async () => {
    const { data } = await client.get('/categorias')
    return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : (Array.isArray(data?.result) ? data.result : []))
  },
  // Detalle por ID
  obtener: async (id) => {
    const { data } = await client.get(`/categorias/${id}`)
    return data?.data ?? data
  },
  // Crear categoría (admin)
  crear: async (payload) => {
    const body = {
      nombre_categoria: payload.nombre_categoria ?? payload.nombre,
      descripcion: payload.descripcion ?? '',
      estado: payload.estado ?? 'activa'
    }
    const { data } = await client.post('/categorias', body)
    return data?.data ?? data
  },
  actualizar: async (id, payload) => {
    const body = {}
    if (payload?.nombre_categoria != null || payload?.nombre != null) body.nombre_categoria = payload.nombre_categoria ?? payload.nombre
    if (payload?.descripcion != null) body.descripcion = payload.descripcion
    if (payload?.estado != null) body.estado = payload.estado
    const { data } = await client.put(`/categorias/${id}`, body)
    return data?.data ?? data
  }
}
import axios from 'axios'

// Servicio de Productos
// - CRUD completo contra la API oficial (`API_BASE`).
// - Validaciones previas en backend local (`LOCAL_BACKEND`) para alta/edición.
// - Incluye normalización de respuestas para tolerar diferentes envoltorios.
// - No expone secretos ni tokens: se leen desde `sessionStorage`.

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'
const LOCAL_BACKEND = process.env.REACT_APP_LOCAL_BACKEND_URL || 'http://localhost:4001'

// Cliente Axios con token desde sessionStorage
const client = axios.create({ baseURL: API_BASE })
client.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers.Accept = 'application/json'
  return config
})

export const productosService = {
  // Lista productos
  // Acepta filtros opcionales: { estado, categoria, precio_min, precio_max, stock_max }
  // Normaliza `data.data`, `data.result` o arreglo plano para robustez.
  listar: async (params = {}) => {
    const normalize = (data) => (Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : (Array.isArray(data?.result) ? data.result : [])))
    const qs = {}
    if (params.estado) qs.estado = params.estado
    if (params.categoria) qs.id_categoria = params.categoria
    if (params.precio_min != null) qs.precio_min = params.precio_min
    if (params.precio_max != null) qs.precio_max = params.precio_max
    if (params.stock_max != null) qs.stock_max = params.stock_max
    let arr = []
    try {
      const { data } = await client.get('/productos', { params: qs })
      arr = normalize(data)
    } catch {
      const { data } = await client.get('/productos')
      arr = normalize(data)
    }
    // Si se pidió inactivos y la API no responde, intenta variantes comunes
    if (params.estado && String(params.estado).toLowerCase() === 'inactivo' && (!Array.isArray(arr) || arr.length === 0)) {
      try { const { data } = await client.get('/productos', { params: { estado: 'inactivo' } }); arr = normalize(data) } catch {}
      try { const { data } = await client.get('/productos', { params: { include_inactivos: true } }); arr = normalize(data) } catch {}
      try { const { data } = await client.get('/productos', { params: { inactivos: true } }); arr = normalize(data) } catch {}
    }
    return arr
  },
  // Obtiene un producto por ID
  // Retorna el objeto contenido en `data.data` o `data`.
  obtener: async (id) => {
    const { data } = await client.get(`/productos/${id}`)
    return data?.data ?? data
  },
  // Crea producto
  // Pasa por validador local para: tipos numéricos positivos, campos requeridos,
  // coherencia de categoría/estado, y evitar variantes antes de guardar producto.
  crear: async (payload) => {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/validator/productos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(payload)
    })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error de validación')
    return j?.data ?? j
  },
  // Actualiza producto
  // Valida coherencia de stock/precio y que los campos críticos estén presentes.
  actualizar: async (id, payload) => {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/validator/productos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(payload)
    })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error de validación')
    return j?.data ?? j
  },
  // Elimina producto
  // Se realiza directamente en la API oficial.
  eliminar: async (id) => {
    const { data } = await client.delete(`/productos/${id}`)
    return data?.data ?? data
  }
}
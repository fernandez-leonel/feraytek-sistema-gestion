import axios from 'axios'

// Servicio de Imágenes de Productos
// - Lectura y creación de imágenes mediante URL en API oficial.
// - Subida de archivos locales al backend de escritorio, con FormData.
// - Normaliza respuestas y agrega token desde sessionStorage.

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'
const LOCAL_BACKEND = process.env.REACT_APP_LOCAL_BACKEND_URL || 'http://localhost:4001'

const client = axios.create({ baseURL: API_BASE })
client.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers.Accept = 'application/json'
  return config
})

export const imagenesService = {
  // Lista de imágenes
  listar: async () => {
    const { data } = await client.get('/imagenes_productos')
    return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : (Array.isArray(data?.result) ? data.result : []))
  },
  // Lista por producto
  listarPorProducto: async (productoId) => {
    const { data } = await client.get(`/imagenes_productos/producto/${productoId}`)
    return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : (Array.isArray(data?.result) ? data.result : []))
  },
  // Crea imagen vía URL en API oficial
  crearUrl: async (payload) => {
    const body = { ...payload }
    if (body.id_producto != null && body.producto_id == null) body.producto_id = body.id_producto
    if (body.producto_id != null && body.id_producto == null) body.id_producto = body.producto_id
    const { data } = await client.post('/imagenes_productos', body)
    return data?.data ?? data
  },
  // Sube una imagen local (archivo único) al backend local y persiste ruta
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
  // Sube múltiples imágenes locales
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
  // Elimina imagen por ID en backend local
  eliminar: async (id) => {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/local-images/${id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error al eliminar imagen')
    return j
  }
}
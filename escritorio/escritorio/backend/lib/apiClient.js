// Cliente HTTP centralizado para el backend remoto
const axios = require('axios')

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api'

const apiClient = axios.create({ baseURL: API_BASE })

// Interceptor simple para aceptar JSON por defecto
apiClient.interceptors.request.use((config) => {
  config.headers = config.headers || {}
  config.headers.Accept = 'application/json'
  return config
})

module.exports = { apiClient }
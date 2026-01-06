import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import './styles/productos.css'

// Páginas modularizadas
import Layout from './modules/core/Layout'
import Login from './modules/core/Login'
import Dashboard from './modules/core/Dashboard'
import ProductosPage from './modules/productos/ProductosPage'
import PedidosPage from './modules/pedidos/PedidosPage'
import PagosPage from './modules/pagos/PagosPage'
import FacturasPage from './modules/facturas/FacturasPage'
import UsuariosPage from './modules/usuarios/UsuariosPage'
import SoportePage from './modules/soporte/SoportePage'
import ReseñasPage from './modules/resenas/ResenasPage'
import EnviosPage from './modules/envios/EnviosPage'
import InformesPage from './modules/informes/InformesPage'

import CarritosAdminPage from './modules/carrito/CarritosAdminPage'
// Config
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'

// Contexto de autenticación
export const AuthContext = React.createContext()

// App: estado de auth y ruteo principal
export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restaurar sesión
  useEffect(() => {
    const savedUser = sessionStorage.getItem('user')
    const token = sessionStorage.getItem('token')
    if (savedUser && token) setUser(JSON.parse(savedUser))
    setLoading(false)
  }, [])

  // Acciones de auth
  const login = (userData, token) => {
    sessionStorage.setItem('user', JSON.stringify(userData))
    sessionStorage.setItem('token', token)
    setUser(userData)
  }
  const logout = () => {
    sessionStorage.removeItem('user')
    sessionStorage.removeItem('token')
    setUser(null)
  }

  if (loading) return <div>Cargando...</div>

  return (
    <Router>
      <div className="App">
        <Toaster richColors position="top-center" />
        <Routes>
          {/* Ruta de login: delega en módulo */}
          <Route path="/login" element={!user ? <Login onLogin={login} /> : <Navigate to="/" replace />} />

          {/* Rutas protegidas dentro del Layout */}
          <Route path="/*" element={user ? (
            <Layout user={user} logout={logout}>
              <Routes>
                <Route path="/" element={<Dashboard user={user} />} />
                <Route path="/productos" element={<ProductosPage />} />
                <Route path="/facturas" element={<FacturasPage />} />
                <Route path="/pedidos" element={<PedidosPage />} />
                <Route path="/pagos" element={<PagosPage />} />
                <Route path="/envios" element={<EnviosPage />} />
                <Route path="/informes" element={<InformesPage />} />
                <Route path="/carritos-admin" element={<CarritosAdminPage />} />
                <Route path="/carrito" element={<CarritosAdminPage />} />
                <Route path="/soporte" element={<SoportePage />} />
                <Route path="/resenas" element={<ReseñasPage />} />
                <Route path="/usuarios" element={<UsuariosPage />} />
              </Routes>
            </Layout>
          ) : <Navigate to="/login" replace /> } />
        </Routes>
      </div>
    </Router>
  )
}
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, ShoppingCart, ClipboardList, CreditCard, FileText, Truck, BarChart3, LifeBuoy, Star, Users, LayoutDashboard, UserCircle, LogOut } from 'lucide-react'

// Layout principal: sidebar y contenido
export default function Layout({ user, logout, children }) {
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'
  const [showPwd, setShowPwd] = useState(false)
  const [pwdCurrent, setPwdCurrent] = useState('')
  const [pwdNew, setPwdNew] = useState('')
  const [pwdConfirm, setPwdConfirm] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [pwdInfo, setPwdInfo] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileInfo, setProfileInfo] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profile, setProfile] = useState({ nombre:'', apellido:'', nombre_usuario:'', email:'', telefono:'', direccion:'', ciudad:'', provincia:'', pais:'', codigo_postal:'', fecha_nacimiento:'', cargo:'' })

  const submitChangePassword = async (e) => {
    e.preventDefault()
    setPwdError('')
    setPwdInfo('')
    setPwdLoading(true)
    try {
      if (!pwdCurrent || !pwdNew || !pwdConfirm) { setPwdError('Completa todos los campos'); setPwdLoading(false); return }
      if (pwdNew !== pwdConfirm) { setPwdError('La confirmación no coincide'); setPwdLoading(false); return }
      if (pwdNew.length < 6) { setPwdError('La nueva contraseña debe tener al menos 6 caracteres'); setPwdLoading(false); return }
      if (pwdCurrent === pwdNew) { setPwdError('La nueva contraseña debe ser distinta a la actual'); setPwdLoading(false); return }
      const token = sessionStorage.getItem('token')
      const u = user || {}
      const body = { currentPassword: pwdCurrent, newPassword: pwdNew, confirmPassword: pwdConfirm, email: u.email, id_usuario: u.id_usuario ?? u.id, current_password: pwdCurrent, new_password: pwdNew, confirm_password: pwdConfirm }
      const res = await fetch(`${API_BASE}/users/password`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Accept:'application/json', ...(token?{ Authorization: `Bearer ${token}` }:{}) }, body: JSON.stringify(body) })
      let data = {}
      const ct = res.headers.get('content-type') || ''
      if (ct.includes('application/json')) { try { data = await res.json() } catch { data = {} } } else { try { const t = await res.text(); const pre = (t.match(/<pre>([\s\S]*?)<\/pre>/i)||[])[1]; data = { message: (pre||t).replace(/<[^>]+>/g,'').trim() } } catch { data = {} } }
      if (!res.ok) { setPwdError(data?.message || 'No se pudo cambiar la contraseña'); return }
      setPwdInfo('Contraseña actualizada')
      setPwdCurrent('')
      setPwdNew('')
      setPwdConfirm('')
      setShowPwd(false)
    } catch { setPwdError('Error de conexión') } finally { setPwdLoading(false) }
  }

  const openProfile = async () => {
    setProfileError('')
    setProfileInfo('')
    setProfileLoading(true)
    try {
      const token = sessionStorage.getItem('token')
      const role = (user?.rol || user?.role || '').toLowerCase()
      const uid = user?.id_usuario ?? user?.id
      const url = role.includes('admin') ? `${API_BASE}/users/profile/${uid}` : `${API_BASE}/users/profile`
      const res = await fetch(url, { headers: { Accept:'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{}) } })
      let data = {}
      const ct = res.headers.get('content-type') || ''
      if (ct.includes('application/json')) { try { data = await res.json() } catch { data = {} } } else { try { const t = await res.text(); data = { message: t } } catch { data = {} } }
      if (!res.ok) throw new Error(data?.message || 'No autorizado')
      const root = data?.data ?? data
      const p = {
        nombre: root?.nombre ?? '',
        apellido: root?.apellido ?? '',
        nombre_usuario: root?.nombre_usuario ?? root?.username ?? '',
        email: root?.email ?? '',
        telefono: root?.telefono ?? '',
        direccion: root?.direccion ?? '',
        ciudad: root?.ciudad ?? '',
        provincia: root?.provincia ?? '',
        pais: root?.pais ?? '',
        codigo_postal: root?.codigo_postal ?? root?.cp ?? '',
        fecha_nacimiento: (root?.fecha_nacimiento ?? '').slice(0,10),
        cargo: root?.cargo ?? ''
      }
      setProfile(p)
      setShowProfile(true)
    } catch (e) {
      const fallback = {
        nombre: user?.nombre ?? '',
        apellido: user?.apellido ?? '',
        nombre_usuario: user?.nombre_usuario ?? user?.username ?? '',
        email: user?.email ?? '',
        telefono: user?.telefono ?? '',
        direccion: user?.direccion ?? '',
        ciudad: user?.ciudad ?? '',
        provincia: user?.provincia ?? '',
        pais: user?.pais ?? '',
        codigo_postal: user?.codigo_postal ?? '',
        fecha_nacimiento: (user?.fecha_nacimiento ?? '').slice(0,10),
        cargo: user?.cargo ?? ''
      }
      setProfile(fallback)
      setShowProfile(true)
      setProfileError(e?.message || 'No se pudo cargar perfil')
    } finally { setProfileLoading(false) }
  }

  const submitProfileUpdate = async (e) => {
    e.preventDefault()
    setProfileError('')
    setProfileInfo('')
    setProfileLoading(true)
    try {
      const token = sessionStorage.getItem('token')
      const role = (user?.rol || user?.role || '').toLowerCase()
      const uid = user?.id_usuario ?? user?.id
      let url = `${API_BASE}/users/profile`
      let payload = { ...profile }
      if (role.includes('admin')) {
        url = `${API_BASE}/users/profile/admin/${uid}`
        const allow = ['nombre','apellido','email','telefono','dni','nombre_usuario','cargo','direccion','ciudad','provincia','pais','codigo_postal','fecha_nacimiento']
        payload = Object.fromEntries(Object.entries(profile).filter(([k]) => allow.includes(k)))
      }
      const res = await fetch(url, { method:'PUT', headers:{ 'Content-Type':'application/json', Accept:'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{}) }, body: JSON.stringify(payload) })
      let data = {}
      const ct = res.headers.get('content-type') || ''
      if (ct.includes('application/json')) { try { data = await res.json() } catch { data = {} } } else { try { const t = await res.text(); data = { message: t } } catch { data = {} } }
      if (!res.ok) { setProfileError(data?.message || 'No se pudo actualizar perfil'); return }
      setProfileInfo('Perfil actualizado')
      setShowProfile(false)
    } catch (err) { setProfileError(err?.message || 'Error de conexión') } finally { setProfileLoading(false) }
  }

  return (
    <div className="app-container">
      <nav className="sidebar">
        <h3 style={{color: 'white', marginBottom: 30}}>Feraytek Admin</h3>
        <ul className="nav-menu">
          <li><Link to="/"><span style={{display:'inline-flex', alignItems:'center', gap:8}}><LayoutDashboard size={16}/> Panel</span></Link></li>
          <li><Link to="/productos"><span style={{display:'inline-flex', alignItems:'center', gap:8}}><Package size={16}/> Productos</span></Link></li>
          <li><Link to="/carrito"><span style={{display:'inline-flex', alignItems:'center', gap:8}}><ShoppingCart size={16}/> Carrito</span></Link></li>
          <li><Link to="/pedidos"><span style={{display:'inline-flex', alignItems:'center', gap:8}}><ClipboardList size={16}/> Pedidos</span></Link></li>
          <li><Link to="/pagos"><span style={{display:'inline-flex', alignItems:'center', gap:8}}><CreditCard size={16}/> Pagos</span></Link></li>
          <li><Link to="/facturas"><span style={{display:'inline-flex', alignItems:'center', gap:8}}><FileText size={16}/> Facturas</span></Link></li>
          <li><Link to="/envios"><span style={{display:'inline-flex', alignItems:'center', gap:8}}><Truck size={16}/> Envios</span></Link></li>
          <li><Link to="/informes"><span style={{display:'inline-flex', alignItems:'center', gap:8}}><BarChart3 size={16}/> Informes</span></Link></li>
          <li><Link to="/soporte"><span style={{display:'inline-flex', alignItems:'center', gap:8}}><LifeBuoy size={16}/> Soporte</span></Link></li>
          <li><Link to="/resenas"><span style={{display:'inline-flex', alignItems:'center', gap:8}}><Star size={16}/> Reseñas</span></Link></li>
          {user?.rol === 'superadmin' && <li><Link to="/usuarios"><span style={{display:'inline-flex', alignItems:'center', gap:8}}><Users size={16}/> Usuarios</span></Link></li>}
        </ul>
        <div style={{marginTop: 'auto', paddingTop: 20, borderTop: '1px solid #34495e'}}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <button className="btn" onClick={openProfile} title="Perfil" aria-label="Perfil" style={{background:'#111827', color:'#e5e7eb', border:'1px solid #1f2937'}}><UserCircle size={18}/></button>
            <div>
              <p style={{color: '#bdc3c7', fontSize: 14}}>{user?.nombre} {user?.apellido}</p>
              <p style={{color: '#95a5a6', fontSize: 12}}>{user?.rol}</p>
            </div>
          </div>
          <div style={{display:'flex', gap:8}}>
            <button onClick={logout} className="btn" style={{marginTop: 10, background: '#ef4444', color: '#fff', border:'1px solid #b91c1c', padding:'10px 16px', borderRadius:10}}>
              <span style={{display:'inline-flex', alignItems:'center', gap:8}}><LogOut size={16}/> Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </nav>
      <main className="main-content">{children}</main>

      {showPwd && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Cambiar Contraseña</h3>
            {pwdError && <div className="error-box" style={{marginBottom:10}}>{pwdError}</div>}
            {pwdInfo && <div className="card" style={{marginBottom:10, color:'#d1fae5', background:'#064e3b', border:'1px solid #10b981'}}>{pwdInfo}</div>}
            <form onSubmit={submitChangePassword}>
              <div className="form-group"><label>Contraseña actual</label><input type="password" value={pwdCurrent} onChange={(e)=>setPwdCurrent(e.target.value)} required /></div>
              <div className="form-group"><label>Nueva contraseña</label><input type="password" value={pwdNew} onChange={(e)=>setPwdNew(e.target.value)} required /></div>
              <div className="form-group"><label>Confirmar contraseña</label><input type="password" value={pwdConfirm} onChange={(e)=>setPwdConfirm(e.target.value)} required /></div>
              <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
                <button type="button" className="btn" onClick={()=>setShowPwd(false)} disabled={pwdLoading}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={pwdLoading}>{pwdLoading?'Guardando...':'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProfile && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Perfil</h3>
            {profileError && <div className="error-box" style={{marginBottom:10}}>{profileError}</div>}
            {profileInfo && <div className="card" style={{marginBottom:10, color:'#d1fae5', background:'#064e3b', border:'1px solid #10b981'}}>{profileInfo}</div>}
            <form onSubmit={submitProfileUpdate}>
              <div className="grid2" style={{marginTop:8}}>
                <div className="form-group"><label>Nombre</label><input value={profile.nombre} onChange={(e)=> setProfile(p => ({ ...p, nombre: e.target.value }))} /></div>
                <div className="form-group"><label>Apellido</label><input value={profile.apellido} onChange={(e)=> setProfile(p => ({ ...p, apellido: e.target.value }))} /></div>
                <div className="form-group"><label>Usuario</label><input value={profile.nombre_usuario} onChange={(e)=> setProfile(p => ({ ...p, nombre_usuario: e.target.value }))} /></div>
                <div className="form-group"><label>Email</label><input type="email" value={profile.email} onChange={(e)=> setProfile(p => ({ ...p, email: e.target.value }))} /></div>
                <div className="form-group"><label>Teléfono</label><input value={profile.telefono} onChange={(e)=> setProfile(p => ({ ...p, telefono: e.target.value }))} /></div>
                <div className="form-group"><label>Dirección</label><input value={profile.direccion} onChange={(e)=> setProfile(p => ({ ...p, direccion: e.target.value }))} /></div>
                <div className="form-group"><label>Ciudad</label><input value={profile.ciudad} onChange={(e)=> setProfile(p => ({ ...p, ciudad: e.target.value }))} /></div>
                <div className="form-group"><label>Provincia</label><input value={profile.provincia} onChange={(e)=> setProfile(p => ({ ...p, provincia: e.target.value }))} /></div>
                <div className="form-group"><label>País</label><input value={profile.pais} onChange={(e)=> setProfile(p => ({ ...p, pais: e.target.value }))} /></div>
                <div className="form-group"><label>Código postal</label><input value={profile.codigo_postal} onChange={(e)=> setProfile(p => ({ ...p, codigo_postal: e.target.value }))} /></div>
                <div className="form-group"><label>Fecha nacimiento</label><input type="date" value={profile.fecha_nacimiento} onChange={(e)=> setProfile(p => ({ ...p, fecha_nacimiento: e.target.value }))} /></div>
                <div className="form-group"><label>Cargo</label><input value={profile.cargo} onChange={(e)=> setProfile(p => ({ ...p, cargo: e.target.value }))} /></div>
              </div>
              <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:10}}>
                <button type="button" className="btn" onClick={()=>setShowProfile(false)} disabled={profileLoading}>Cancelar</button>
                <button type="button" className="btn" onClick={()=> { setShowProfile(false); setShowPwd(true) }} disabled={profileLoading} style={{background:'#2563eb', color:'#fff'}}>Cambiar Contraseña</button>
                <button type="submit" className="btn btn-primary" disabled={profileLoading}>{profileLoading?'Guardando...':'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
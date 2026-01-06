import React, { useState } from 'react'

export default function Login({ onLogin }) {
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [channelModal, setChannelModal] = useState(false)
  const [channel, setChannel] = useState('email')
  const [resetModal, setResetModal] = useState(false)
  const parse = async (res) => { const ct = res.headers.get('content-type')||''; if (ct.includes('application/json')) { try { return await res.json() } catch { return {} } } try { return { message: await res.text() } } catch { return {} } }

  const submitLogin = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/users/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept:'application/json' }, body: JSON.stringify({ email, password }) })
      const data = await parse(res)
      if (!res.ok) {
        const msg = data?.message || `Error (${res.status})`
        if (res.status === 401) setError('Credenciales inválidas')
        else if (res.status === 403) setError('Usuario no permitido o sin permisos')
        else setError(msg)
        return
      }
      if (data.user && (data.user.rol === 'admin' || data.user.rol === 'superadmin')) onLogin(data.user, data.token)
      else setError('Usuario no permitido o sin permisos')
    } catch { setError('Error de conexión') } finally { setLoading(false) }
  }

  const submitForgot = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const data = await res.json().catch(async () => ({ message: await res.text() }))
      if (!res.ok) { setError(data?.message || `Error (${res.status}) al solicitar código`); return }
      setInfo('Código enviado al correo')
    } catch { setError('Error de conexión') } finally { setLoading(false) }
  }

  const submitReset = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      const body = { email, code, newPassword, confirmPassword }
      const res = await fetch(`${API_BASE}/auth/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json().catch(async () => ({ message: await res.text() }))
      if (!res.ok) { setError(data?.message || 'No se pudo restablecer'); return }
      setInfo('Contraseña restablecida')
      setMode('login')
      setPassword('')
      setCode('')
      setNewPassword('')
      setConfirmPassword('')
    } catch { setError('Error de conexión') } finally { setLoading(false) }
  }

  const requestCode = async () => {
    if (!email) { setError('Ingrese su email para solicitar código'); return }
    setChannelModal(true)
  }

  const confirmChannel = async () => {
    setError('')
    setInfo('')
    if (channel !== 'email') { setInfo('Canal seleccionado no disponible, use correo electrónico'); setChannel('email') }
    const res = await fetch(`${API_BASE}/auth/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
    const data = await res.json().catch(async () => ({ message: await res.text() }))
    if (!res.ok) { setError(data?.message || `Error (${res.status}) al solicitar código`); return }
    setInfo('Código enviado a su correo electrónico')
    setChannelModal(false)
    setResetModal(true)
  }

  const resetAndLogin = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      const body = { email, code, newPassword, confirmPassword }
      const r1 = await fetch(`${API_BASE}/auth/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const d1 = await parse(r1)
      if (!r1.ok) { setError(d1?.message || `Error (${r1.status}) al restablecer`); setLoading(false); return }
      const r2 = await fetch(`${API_BASE}/users/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: newPassword }) })
      const d2 = await parse(r2)
      if (!r2.ok) { setError(r2.status===401?'Credenciales inválidas':(r2.status===403?'Usuario no permitido o sin permisos':(d2?.message || `Error (${r2.status}) al iniciar sesión`))); setLoading(false); return }
      if (d2.user && (d2.user.rol === 'admin' || d2.user.rol === 'superadmin')) onLogin(d2.user, d2.token)
      else setError('Usuario no permitido o sin permisos')
    } catch { setError('Error de conexión') } finally { setLoading(false) }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>{mode==='login'?'Iniciar Sesión':mode==='forgot'?'Recuperar contraseña':'Restablecer contraseña'}</h2>
        {error && <div className="error-box" style={{marginBottom:10}}>{error}</div>}
        {info && <div className="card" style={{marginBottom:10, color:'#d1fae5', background:'#064e3b', border:'1px solid #10b981'}}>{info}</div>}
        {mode==='login' && (
          <form onSubmit={submitLogin}>
            <div className="form-group"><label>Email</label><input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required /></div>
            <div className="form-group"><label>Contraseña</label><input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required /></div>
            <div style={{display:'flex', gap:8}}>
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Iniciando...':'Iniciar Sesión'}</button>
              <button type="button" className="btn btn-primary" onClick={requestCode} disabled={loading}>Olvidé mi contraseña</button>
            </div>
          </form>
        )}
        {mode==='forgot' && (
          <form onSubmit={submitForgot}>
            <div className="form-group"><label>Email</label><input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required /></div>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Enviando...':'Enviar código'}</button>
          </form>
        )}
        {mode==='reset' && (
          <form onSubmit={submitReset}>
            <div className="form-group"><label>Email</label><input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required /></div>
            <div className="form-group"><label>Código</label><input value={code} onChange={(e)=>setCode(e.target.value)} required /></div>
            <div className="form-group"><label>Nueva contraseña</label><input type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} required /></div>
            <div className="form-group"><label>Confirmar contraseña</label><input type="password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} required /></div>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Restableciendo...':'Restablecer'}</button>
          </form>
        )}
      </div>
      {channelModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Elija cómo quiere recibir el código</h3>
            <div className="form-group"><label><input type="radio" name="channel" value="sms" checked={channel==='sms'} onChange={(e)=>setChannel(e.target.value)} /> SMS</label></div>
            <div className="form-group"><label><input type="radio" name="channel" value="whatsapp" checked={channel==='whatsapp'} onChange={(e)=>setChannel(e.target.value)} /> WhatsApp</label></div>
            <div className="form-group"><label><input type="radio" name="channel" value="email" checked={channel==='email'} onChange={(e)=>setChannel(e.target.value)} /> Correo electrónico</label></div>
            <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
              <button className="btn" onClick={()=>setChannelModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={confirmChannel}>Continuar</button>
            </div>
          </div>
        </div>
      )}
      {resetModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Restablecer contraseña</h3>
            {error && <div className="error-box" style={{marginBottom:10}}>{error}</div>}
            {info && <div className="card" style={{marginBottom:10, color:'#d1fae5', background:'#064e3b', border:'1px solid #10b981'}}>{info}</div>}
            <form onSubmit={resetAndLogin}>
              <div className="form-group"><label>Email</label><input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required /></div>
              <div className="form-group"><label>Código</label><input value={code} onChange={(e)=>setCode(e.target.value)} required /></div>
              <div className="form-group"><label>Nueva contraseña</label><input type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} required /></div>
              <div className="form-group"><label>Confirmar contraseña</label><input type="password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} required /></div>
              <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
                <button type="button" className="btn" onClick={()=>setResetModal(false)} disabled={loading}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Iniciando...':'Iniciar Sesión'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
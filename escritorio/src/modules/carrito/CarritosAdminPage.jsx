// =====================================================================
// Carritos Admin Page
// Panel admin: ver todos, ver carrito de usuario y estadísticas (solo lectura)
// =====================================================================

import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { carritoService } from '../../services/carritoService'
import '../../styles/productos.css'
import { ShoppingCart, ChevronsLeft, ChevronLeft, ChevronRight } from 'lucide-react'

export default function CarritosAdminPage() {
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'
  const [stats, setStats] = useState(null)
  const [todos, setTodos] = useState([])
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [usuarioId, setUsuarioId] = useState('')
  const [usuarioNombre, setUsuarioNombre] = useState('')
  const [usuarioCart, setUsuarioCart] = useState([])
  const [showUserModal, setShowUserModal] = useState(false)
  const [userDetail, setUserDetail] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingAb, setLoadingAb] = useState(false)
  const [abandonadosDias, setAbandonadosDias] = useState('')
  const [abDesde, setAbDesde] = useState('')
  const [abHasta, setAbHasta] = useState('')
  const [abandonados, setAbandonados] = useState([])
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [showAbModal, setShowAbModal] = useState(false)

  const loadStats = async () => { try { const j = await carritoService.estadisticas(); setStats(j) } catch (e) { setError(e.message) } }
  const loadTodos = async () => { setLoading(true); setError(''); try { const arr = await carritoService.todos(); setTodos(Array.isArray(arr?.data)?arr.data:(Array.isArray(arr)?arr:[])) } catch (e) { setError(e.message) } finally { setLoading(false) } }
  const loadAbandonados = async () => {
    setLoadingAb(true); setError('')
    try {
      const dias = Math.max(1, Number.parseInt(String(abandonadosDias||'').trim()) || 7)
      const arr = await carritoService.abandonados(dias)
      setAbandonados(Array.isArray(arr?.data)?arr.data:(Array.isArray(arr)?arr:[]))
    } catch (e) { setError(e.message) }
    finally { setLoadingAb(false) }
  }
  useEffect(() => { loadStats(); loadTodos(); loadAbandonados() }, [])

  const buscarUsuarioIdPorNombre = async (query) => {
    const token = sessionStorage.getItem('token')
    const hdr = token ? { Authorization: `Bearer ${token}`, Accept: 'application/json' } : { Accept: 'application/json' }
    const tryEndpoint = async (url) => {
      const res = await fetch(url, { headers: hdr })
      let j = {}
      try { j = await res.json() } catch {}
      return Array.isArray(j?.data) ? j.data : (Array.isArray(j) ? j : [])
    }
    let list = []
    try { list = await tryEndpoint(`${API_BASE}/users`) } catch {}
    if (!Array.isArray(list) || list.length===0) {
      try { list = await tryEndpoint(`${API_BASE}/users/all`) } catch {}
    }
    const q = String(query || '').toLowerCase()
    const match = list.find(u => String((u.nombre_usuario||u.username||u.email||`${u.nombre||''} ${u.apellido||''}`)).toLowerCase().includes(q))
    return match?.id ?? match?.id_usuario ?? match?.user_id ?? null
  }

  const verUsuario = async () => {
    let id = Number(usuarioId)
    if (!Number.isFinite(id) || id <= 0) {
      if (usuarioNombre && usuarioNombre.trim().length > 0) {
        try { id = Number(await buscarUsuarioIdPorNombre(usuarioNombre)) } catch { id = NaN }
      }
    }
    if (!Number.isFinite(id) || id <= 0) { setError('Usuario no encontrado'); return }
    setError('')
    let j = null
    try { j = await carritoService.usuario(id) } catch { j = null }
    let arr = []
    if (j) {
      if (Array.isArray(j?.items)) arr = j.items
      else if (Array.isArray(j?.data?.items)) arr = j.data.items
      else if (Array.isArray(j)) arr = j
      else if (Array.isArray(j?.data)) arr = j.data
    }
    const norm = arr.map(it => ({
      id_producto: it.id_producto ?? it.producto_id ?? it.id ?? 0,
      id_variante: it.id_variante ?? it.variante_id ?? it.variante ?? null,
      cantidad: Number(it.cantidad ?? 1),
      precio_unitario: Number(it.precio_unitario ?? it.precio ?? 0)
    }))
    let perfil = null
    try {
      const token = sessionStorage.getItem('token')
      const hdr = token ? { Authorization: `Bearer ${token}`, Accept: 'application/json' } : { Accept: 'application/json' }
      const r = await fetch(`${API_BASE}/users/profile/${id}`, { headers: hdr })
      if (r.ok) {
        const pj = await r.json().catch(()=>({}))
        perfil = pj?.data ?? pj ?? {}
      } else { perfil = {} }
    } catch { perfil = {} }
    setUsuarioCart(norm)
    setUserDetail({ id, perfil, items: norm, historial: Array.isArray(j?.historial) ? j.historial : (Array.isArray(j?.data?.historial) ? j.data.historial : []) })
    setShowUserModal(true)
  }
  const limpiarAbandonadosAction = async () => {
    try {
      setError('')
      const dias = Math.max(1, Number.parseInt(String(abandonadosDias||'').trim()) || 7)
      await carritoService.limpiarAbandonados(dias)
      toast.success('Carritos abandonados limpiados')
      setShowConfirm(false); setConfirmText('')
      await Promise.all([loadAbandonados(), loadTodos(), loadStats()])
    } catch (e) { setError(e.message || 'Error al limpiar abandonados') }
  }
  const abrirConfirmacion = () => { setShowConfirm(true); setConfirmText('') }
  const countAbFiltered = () => {
    const from = abDesde ? new Date(abDesde).getTime() : null
    const to = abHasta ? new Date(abHasta).getTime() : null
    return (abandonados||[]).filter(c => {
      const t = new Date(c.updated_at ?? Date.now()).getTime()
      if (from && t < from) return false
      if (to && t > to) return false
      return true
    }).length
  }

  const countItems = (c) => {
    if (typeof c.cantidad_items === 'number') return c.cantidad_items
    if (typeof c.items_count === 'number') return c.items_count
    if (Array.isArray(c.items)) return c.items.length
    return 0
  }

  const totalCarritos = Number(stats?.total_carritos ?? stats?.total ?? stats?.carritos_total ?? (Array.isArray(todos) ? todos.length : 0))
  const derivadosAbandonados = Array.isArray(abandonados) ? abandonados.length : 0
  const totalAbandonados = Number(stats?.abandonados ?? stats?.carritos_abandonados ?? derivadosAbandonados)
  const totalActivos = Number(stats?.activos ?? stats?.carritos_activos ?? (totalCarritos - totalAbandonados))
  const totalCompletados = Number(stats?.completados ?? stats?.carritos_completados ?? 0)
  const valorTotal = Number(stats?.valor_total ?? stats?.total_valor ?? 0)

  return (
    <div className="productos-module">
      <h1 style={{display:'flex', alignItems:'center', gap:8, color:'var(--color-orange)'}}><ShoppingCart size={22}/> Carrito</h1>

      <div className="productos-filters" style={{display:'flex', gap:12, alignItems:'center', flexWrap:'wrap', marginTop:12}}>
        <h3>Acciones rápidas</h3>
        <input inputMode="numeric" placeholder="ID usuario" value={usuarioId} onChange={(e)=> setUsuarioId(e.target.value.replace(/[^0-9]/g,''))} />
        <input placeholder="Nombre/Email usuario" value={usuarioNombre} onChange={(e)=> setUsuarioNombre(e.target.value)} />
        <button className="btn btn-orange" onClick={verUsuario}>Buscar usuario</button>
        <input inputMode="numeric" placeholder="Días (por defecto 7)" value={String(abandonadosDias)} onChange={(e)=> {
          const v = e.target.value.replace(/[^0-9]/g,'')
          setAbandonadosDias(v)
        }} />
        <input type="date" placeholder="Desde" value={abDesde} onChange={(e)=> setAbDesde(e.target.value)} />
        <input type="date" placeholder="Hasta" value={abHasta} onChange={(e)=> setAbHasta(e.target.value)} />
        <button className="btn btn-orange" onClick={async ()=> { await loadAbandonados(); setShowAbModal(true) }}>Buscar abandonados</button>
        <button className="btn btn-view" onClick={abrirConfirmacion} disabled={(abandonados||[]).length===0}>Limpiar abandonados</button>
      </div>

      <div className="card" style={{marginTop:12}}>
        <h3>Estadísticas</h3>
        {stats ? (
          <div style={{display:'flex', gap:18, flexWrap:'wrap', marginTop:8}}>
            <div className="stat-box"><b>Total:</b> {Number.isFinite(totalCarritos)? totalCarritos : '-'}</div>
            <div className="stat-box"><b>Activos:</b> {Number.isFinite(totalActivos)? totalActivos : '-'}</div>
            <div className="stat-box"><b>Completados:</b> {Number.isFinite(totalCompletados)? totalCompletados : '-'}</div>
            <div className="stat-box"><b>Abandonados:</b> {Number.isFinite(totalAbandonados)? totalAbandonados : '-'}</div>
            <div className="stat-box"><b>Valor total:</b> ${Number(valorTotal).toFixed(2)}</div>
          </div>
        ) : <div>Cargando estadísticas...</div>}
      </div>

      <div className="table" style={{marginTop:12}}>
        <h3>Todos los carritos</h3>
        {error && <div className="error-box" style={{marginTop:8}}>{error}</div>}
        {loading ? <div>Cargando...</div> : (
          <table style={{width:'100%'}}>
            <thead><tr><th>ID Usuario</th><th>Items</th><th>Actualizado</th></tr></thead>
            <tbody>
              {todos.length===0 ? (
                <tr><td colSpan="3" style={{textAlign:'center', padding:20}}>No hay carritos</td></tr>
              ) : (() => {
                const totalPages = Math.max(1, Math.ceil(todos.length / pageSize))
                const start = (page - 1) * pageSize
                const end = start + pageSize
                const paged = todos.slice(start, end)
                return (
                  <>
                    {paged.map(c => (
                      <tr key={c.id_usuario ?? c.user_id}><td>{c.id_usuario ?? c.user_id}</td><td>{countItems(c)}</td><td>{new Date(c.updated_at ?? Date.now()).toLocaleString()}</td></tr>
                    ))}
                  </>
                )
              })()}
            </tbody>
          </table>
        )}
      </div>

      {(() => { const totalPages = Math.max(1, Math.ceil(todos.length / pageSize)); const canPrev = page>1; const canNext = page<totalPages && (todos.length >= page*pageSize); return (
        <div style={{display:'flex', alignItems:'center', justifyContent:'flex-start', gap:12, marginTop:12}}>
          <div style={{color:'#374151'}}>Total: {todos.length}</div>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <button className="btn" onClick={()=> setPage(1)} disabled={!canPrev} style={{background:'#2563eb', color:'#fff'}}><ChevronsLeft size={16}/></button>
            <button className="btn" onClick={()=> setPage(p => Math.max(1, p-1))} disabled={!canPrev} style={{background:'#2563eb', color:'#fff'}}><ChevronLeft size={16}/></button>
            <span style={{minWidth:80, textAlign:'center'}}>Página {page} de {totalPages}</span>
            <button className="btn" onClick={()=> setPage(p => Math.min(totalPages, p+1))} disabled={!canNext} style={{background:'#2563eb', color:'#fff'}}><ChevronRight size={16}/></button>
          </div>
        </div>
      ) })()}

      {showUserModal && (
        <div className="modal-overlay" onClick={()=> { setShowUserModal(false); setUserDetail(null) }}>
          <div className="modal" onClick={(e)=> e.stopPropagation()} style={{width:'900px', maxWidth:'95vw'}}>
            <div className="side-panel-header" style={{padding:0, border:'none', marginBottom:12}}>
              <h3 style={{margin:0}}>Carrito del usuario</h3>
              <button className="btn btn-view" onClick={()=> { setShowUserModal(false); setUserDetail(null) }}>Cerrar</button>
            </div>
            <div className="card" style={{marginBottom:12}}>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <div>
                  <p><b>ID:</b> {userDetail?.id}</p>
                  <p><b>Usuario:</b> {userDetail?.perfil?.nombre_usuario ?? userDetail?.perfil?.username ?? '-'}</p>
                  <p><b>Email:</b> {userDetail?.perfil?.email ?? '-'}</p>
                </div>
              </div>
            </div>
            <div className="table" style={{marginBottom:12}}>
              <table style={{width:'100%'}}>
                <thead><tr><th>Producto</th><th>Variante</th><th>Cantidad</th><th>Precio</th></tr></thead>
                <tbody>
                  {(userDetail?.items?.length ?? 0)===0 ? (
                    <tr><td colSpan="4" style={{textAlign:'center', padding:16}}>Carrito vacío</td></tr>
                  ) : userDetail.items.map(it => (
                    <tr key={(it.id_producto||0)+'-'+(it.id_variante||0)}><td>{it.id_producto}</td><td>{it.id_variante ?? '-'}</td><td>{it.cantidad}</td><td>${Number(it.precio_unitario).toFixed(2)}</td></tr>
                  ))}
                  {(userDetail?.items?.length ?? 0)>0 && (
                    <tr>
                      <td colSpan="4" style={{textAlign:'right', padding:12}}>
                        <b>Total:</b> ${userDetail.items.reduce((acc, it) => acc + Number(it.precio_unitario ?? 0) * Number(it.cantidad ?? 1), 0).toFixed(2)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="table">
              <table style={{width:'100%'}}>
                <thead><tr><th>Fecha</th><th>Acción</th><th>Detalle</th></tr></thead>
                <tbody>
                  {(userDetail?.historial?.length ?? 0)===0 ? (
                    <tr><td colSpan="3" style={{textAlign:'center', padding:16}}>Sin historial disponible</td></tr>
                  ) : userDetail.historial.map((h, idx) => (
                    <tr key={h.id ?? idx}><td>{new Date(h.fecha ?? h.created_at ?? Date.now()).toLocaleString()}</td><td>{h.accion ?? h.action ?? '-'}</td><td>{h.detalle ?? '-'}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showAbModal && (
        <div className="modal-overlay" onClick={()=> { setShowAbModal(false) }}>
          <div className="modal" onClick={(e)=> e.stopPropagation()} style={{width:'900px', maxWidth:'95vw'}}>
            <div className="side-panel-header" style={{padding:0, border:'none', marginBottom:12}}>
              <h3 style={{margin:0}}>Carritos abandonados</h3>
              <button className="btn btn-view" onClick={()=> setShowAbModal(false)}>Cerrar</button>
            </div>
            <div className="table" style={{marginTop:12}}>
              <table style={{width:'100%'}}>
                <thead><tr><th>ID Usuario</th><th>Items</th><th>Actualizado</th></tr></thead>
                <tbody>
                  {loadingAb ? (
                    <tr><td colSpan="3" style={{textAlign:'center', padding:20}}>Cargando...</td></tr>
                  ) : abandonados.length===0 ? (
                    <tr><td colSpan="3" style={{textAlign:'center', padding:20}}>Sin abandonados</td></tr>
                  ) : (() => {
                    let list = abandonados
                    const from = abDesde ? new Date(abDesde).getTime() : null
                    const to = abHasta ? new Date(abHasta).getTime() : null
                    if (from || to) {
                      list = list.filter(c => {
                        const t = new Date(c.updated_at ?? Date.now()).getTime()
                        if (from && t < from) return false
                        if (to && t > to) return false
                        return true
                      })
                    }
                    return list.map(c => (
                      <tr key={c.id_usuario ?? c.user_id}><td>{c.id_usuario ?? c.user_id}</td><td>{countItems(c)}</td><td>{new Date(c.updated_at ?? Date.now()).toLocaleString()}</td></tr>
                    ))
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="modal-overlay" onClick={()=> { setShowConfirm(false); setConfirmText('') }}>
          <div className="modal" onClick={(e)=> e.stopPropagation()} style={{width:'700px', maxWidth:'95vw'}}>
            <div className="side-panel-header" style={{padding:0, border:'none', marginBottom:12}}>
              <h3 style={{margin:0}}>Confirmar limpieza de abandonados</h3>
              <button className="btn btn-view" onClick={()=> { setShowConfirm(false); setConfirmText('') }}>Cancelar</button>
            </div>
            <div className="card" style={{marginBottom:12}}>
              <p><b>Días:</b> {String(abandonadosDias||'7')}</p>
              <p><b>Rango:</b> {abDesde||'-'} a {abHasta||'-'}</p>
              <p><b>Se eliminarán:</b> {countAbFiltered()} carritos abandonados</p>
              <p>Escribe <b>CONFIRMAR</b> para proceder.</p>
              <input placeholder="CONFIRMAR" value={confirmText} onChange={(e)=> setConfirmText(e.target.value)} />
              <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:12}}>
                <button className="btn btn-orange" onClick={limpiarAbandonadosAction} disabled={confirmText!=='CONFIRMAR'}>Confirmar limpieza</button>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>
  )
}
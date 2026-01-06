// =====================================================================
// Reseñas Page (Frontend)
// Panel admin: crear y listar reseñas de productos
// - UI: formulario de alta y tabla con reseñas
// =====================================================================

import React, { useEffect, useMemo, useState } from 'react'
import { resenasService } from '../../services/resenasService'
import { Star, ChevronsLeft, ChevronLeft, ChevronRight, CheckCircle, EyeOff, Ban, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { productosService } from '../../services/productosService'

export default function ReseñasPage() {
  const [form, setForm] = useState({ id_producto:'', calificacion:'5', comentario:'' })
  const [list, setList] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ producto:'', estado:'' })
  const [productoNombre, setProductoNombre] = useState('')
  const [productoMap, setProductoMap] = useState({})
  const [productoOptions, setProductoOptions] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [selected, setSelected] = useState({})
  const [editOpen, setEditOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [editForm, setEditForm] = useState({ calificacion:'5', comentario:'' })
  

  const canTransition = (from, to) => {
    const f = String(from||'').toLowerCase()
    const t = String(to||'').toLowerCase()
    if (f === t) return false
    if (f === 'pendiente') return ['aprobada','rechazada','oculta'].includes(t)
    if (f === 'aprobada') return ['oculta'].includes(t)
    if (f === 'rechazada') return ['pendiente'].includes(t)
    if (f === 'oculta') return ['aprobada','rechazada','pendiente'].includes(t)
    return true
  }
  const role = useMemo(() => { try { const u = JSON.parse(sessionStorage.getItem('user')||'{}'); return String(u?.rol||'').toLowerCase() } catch { return '' } }, [])
  const userId = useMemo(() => { try { const u = JSON.parse(sessionStorage.getItem('user')||'{}'); return Number(u?.id ?? u?.id_usuario ?? 0) } catch { return 0 } }, [])
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const resetListado = async () => {
    setPage(1)
    setFilters(f => ({ ...f, producto: '' }))
    setProductoNombre('')
    setSuggestions([])
    setError('')
    setLoading(true)
    try {
      const arr = filters.estado ? await resenasService.listarEstado(filters.estado) : await resenasService.listarAdmin()
      setList(Array.isArray(arr) ? arr : [])
      try { await enrichProductNames(Array.isArray(arr) ? arr : []) } catch {}
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const load = async () => {
    setLoading(true); setError('')
    try {
      const arr = await resenasService.listarAdmin()
      setList(Array.isArray(arr) ? arr : [])
      try { await enrichProductNames(Array.isArray(arr) ? arr : []) } catch {}
      try {
        const prods = await productosService.listar()
        const map = {}
        const opts = []
        (Array.isArray(prods)?prods:[]).forEach(p => { const idp = p.id ?? p.id_producto; const name = p.nombre ?? p.titulo ?? p.nombre_producto ?? ''; if (idp!=null) { map[String(idp)] = name; opts.push({ id:String(idp), nombre:name }) } })
        setProductoMap(map)
        setProductoOptions(opts)
      } catch {}
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])
  useEffect(() => { load() }, [filters.estado])

  const enrichProductNames = async (arr) => {
    const ids = Array.from(new Set((arr||[]).map(r => (r.id_producto ?? r.producto_id ?? r.idProduct)).filter(id => id!=null)))
    const missing = ids.filter(id => !(String(id) in productoMap))
    if (missing.length===0) return
    const map = { ...productoMap }
    await Promise.all(missing.map(async (id) => {
      try {
        const p = await productosService.obtener(id)
        const name = p?.nombre ?? p?.titulo ?? ''
        if (name) map[String(id)] = name
      } catch {}
    }))
    setProductoMap(map)
  }

  const aplicar = async () => {
    setPage(1)
    setError('')
    try {
      const idp = String(filters.producto || '').trim()
      let arr = []
      if (idp) {
        try { arr = await resenasService.listar({ producto: idp }) } catch { arr = [] }
        if (!Array.isArray(arr) || arr.length === 0) {
          const all = await resenasService.listarAdmin()
          arr = (Array.isArray(all) ? all.filter(r => String((r.id_producto ?? r.producto_id ?? r.idProduct)) === String(idp)) : [])
        }
        setFilters(f => ({ ...f, producto: idp }))
        const name = productoMap[String(idp)] || ''
        if (name) setProductoNombre(name)
      } else {
        arr = await resenasService.listarAdmin()
        setFilters(f => ({ ...f, producto: '' }))
      }
      setList(Array.isArray(arr) ? arr : [])
      try { await enrichProductNames(Array.isArray(arr) ? arr : []) } catch {}
    } catch (e) { setError(e.message || 'No se pudo aplicar filtro') }
  }

  const onNombreChange = (text) => {
    setProductoNombre(text)
    const q = text.trim().toLowerCase()
    if (!q) { setSuggestions([]); return }
    const source = productoOptions
    const s = source.filter(p => String(p.nombre||'').toLowerCase().includes(q)).slice(0,8)
    setSuggestions(s)
  }

  const crear = async () => {
    const idp = Number(form.id_producto); const cal = Number(form.calificacion); const com = form.comentario.trim()
    if (!Number.isFinite(idp) || idp<=0) { setError('ID de producto inválido'); return }
    if (!Number.isFinite(cal) || cal<1 || cal>5) { setError('Calificación debe ser 1..5'); return }
    if (!com) { setError('Comentario requerido'); return }
    try { setError(''); await resenasService.crear({ id_producto:idp, calificacion:cal, comentario:com }); setForm({ id_producto:'', calificacion:'5', comentario:'' }); await load() } catch (e) { setError(e.message) }
  }

  const toggleSelect = () => {}
  const clearSelection = () => {}

  const startEdit = (r) => { const id = r.id ?? r.id_resena; const isMine = Number(r.id_usuario ?? r.usuario_id ?? 0) === userId; if (!isMine) { setError('Solo puedes editar tu reseña'); return } setEditItem({ id, ...r }); setEditForm({ calificacion: String(r.calificacion ?? '5'), comentario: String(r.comentario ?? '') }); setEditOpen(true) }
  const guardarEdicion = async () => { const id = editItem?.id; const cal = Number(editForm.calificacion); const com = editForm.comentario.trim(); if (!Number.isFinite(cal) || cal<1 || cal>5) { setError('Calificación debe ser 1..5'); return } if (!com) { setError('Comentario requerido'); return } try { await resenasService.actualizar(id, { calificacion: cal, comentario: com }); setEditOpen(false); setEditItem(null); await load() } catch (e) { setError(e.message) } }
  const aprobar = async (r) => { try { const cur = String(r.estado||'').toLowerCase(); if (!canTransition(cur,'aprobada')) { setError('Transición de estado no permitida'); toast.error('Transición de estado no permitida'); return } const id = r.id ?? r.id_resena; await resenasService.cambiarEstado(id, 'aprobada'); await load(); toast.success('Reseña aprobada') } catch (e) { setError(e.message); toast.error(e.message || 'No se pudo aprobar') } }
  const ocultar = async (r) => { try { const cur = String(r.estado||'').toLowerCase(); if (!canTransition(cur,'oculta')) { setError('Transición de estado no permitida'); toast.error('Transición de estado no permitida'); return } const id = r.id ?? r.id_resena; await resenasService.cambiarEstado(id, 'oculta'); await load(); toast.success('Reseña ocultada') } catch (e) { setError(e.message); toast.error(e.message || 'No se pudo ocultar') } }
  const rechazar = async (r) => { try { const cur = String(r.estado||'').toLowerCase(); if (!canTransition(cur,'rechazada')) { setError('Transición de estado no permitida'); toast.error('Transición de estado no permitida'); return } const id = r.id ?? r.id_resena; await resenasService.cambiarEstado(id, 'rechazada'); await load(); toast.success('Reseña rechazada') } catch (e) { setError(e.message); toast.error(e.message || 'No se pudo rechazar') } }
  const reabrir = async (r) => { try { const cur = String(r.estado||'').toLowerCase(); if (!canTransition(cur,'pendiente')) { setError('Transición de estado no permitida'); toast.error('Transición de estado no permitida'); return } const id = r.id ?? r.id_resena; await resenasService.cambiarEstado(id, 'pendiente'); await load(); toast.success('Reseña movida a pendiente') } catch (e) { setError(e.message); toast.error(e.message || 'No se pudo reabrir') } }


  const exportCSV = () => {
    const headers = ['id','id_producto','calificacion','comentario','estado','created_at']
    const rows = list.map(r => [r.id ?? r.id_resena, r.id_producto ?? '', r.calificacion ?? '', (r.comentario ?? '').replace(/\n/g,' ').replace(/"/g,'""'), r.estado ?? '', new Date(r.created_at ?? Date.now()).toLocaleString()])
    const csv = [headers.join(','), ...rows.map(a => a.map(v => typeof v==='string' ? `"${v}"` : String(v)).join(','))].join('\n')
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'resenas.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  return (
    <div className="productos-module">
      <h1 style={{display:'flex', alignItems:'center', gap:8, color:'#3b82f6'}}><Star size={22}/> Reseñas</h1>

      {role==='cliente' && (
        <div className="card" style={{marginTop:12}}>
          <div className="productos-filters" style={{display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'}}>
            <h3>Crear reseña</h3>
            <input inputMode="numeric" placeholder="ID producto" value={form.id_producto} onChange={(e)=> setForm(f => ({ ...f, id_producto: e.target.value.replace(/[^0-9]/g,'') }))} />
            <select value={form.calificacion} onChange={(e)=> setForm(f => ({ ...f, calificacion: e.target.value }))}>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <input placeholder="Comentario" value={form.comentario} onChange={(e)=> setForm(f => ({ ...f, comentario: e.target.value }))} />
            <button className="btn" onClick={crear} style={{background:'#1f2937', color:'#fff'}}>Crear</button>
          </div>
        </div>
      )}

      <div className="card" style={{marginTop:12}}>
          <div className="productos-filters" style={{display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'}}>
            <h3>Filtros</h3>
            <input inputMode="numeric" placeholder="ID producto" value={filters.producto} onChange={(e)=> setFilters(f => ({ ...f, producto: e.target.value.replace(/[^0-9]/g,'') }))} />
            <div style={{position:'relative'}}>
              <input placeholder="Nombre producto" value={productoNombre} onChange={(e)=> onNombreChange(e.target.value)} />
              {suggestions.length>0 && (
          <div style={{position:'absolute', top:'100%', left:0, right:0, background:'#0F172A', border:'1px solid #1E2330', borderRadius:10, padding:6, zIndex:10}}>
            {suggestions.map(s => (
              <div key={String(s.id)} style={{padding:'6px 8px', borderRadius:8, cursor:'pointer'}} onClick={async ()=>{ setProductoNombre(s.nombre||''); setFilters(f => ({ ...f, producto: String(s.id) })); setSuggestions([]); await aplicar() }}>
                {String(s.id)} - {s.nombre}
              </div>
            ))}
              </div>
            )}
          </div>
            {(role==='admin' || role==='superadmin') && (
              <select value={filters.estado} onChange={(e)=> setFilters(f => ({ ...f, estado: e.target.value }))}>
                <option value="">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="aprobada">Aprobada</option>
                <option value="rechazada">Rechazada</option>
                <option value="oculta">Oculta</option>
              </select>
            )}
            <button className="btn" onClick={aplicar} style={{background:'#1f2937', color:'#fff'}}>Aplicar</button>
          </div>
        </div>

      <div className="table" style={{marginTop:12}}>
        <h3>Listado</h3>
        {error && <div className="error-box" style={{marginTop:8}}>{error}</div>}
        {loading ? <div>Cargando...</div> : (
          <table style={{width:'100%'}}>
            <thead>
              <tr>
                <th>ID</th><th>Producto</th><th>Calificación</th><th>Comentario</th><th>Fecha</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const arr = list.filter(r => {
                  const pid = r.id_producto ?? r.producto_id ?? r.idProduct
                  const idOk = filters.producto ? String(pid) === String(filters.producto) : true
                  const nameQ = productoNombre.trim().toLowerCase()
                  const nameOk = nameQ ? String(productoMap[String(pid)]||'').toLowerCase().includes(nameQ) : true
                  const estOk = filters.estado ? String(r.estado||'').toLowerCase() === String(filters.estado).toLowerCase() : true
                  return idOk && nameOk && estOk
                })
                const total = arr.length
                const pages = Math.max(1, Math.ceil(total / perPage))
                const start = (page - 1) * perPage
                const pageItems = arr.slice(start, start + perPage)
                if (pageItems.length === 0) return (<tr><td colSpan="6" style={{textAlign:'center', padding:20}}>Sin reseñas</td></tr>)
                return pageItems.map(r => {
                  const id = r.id ?? r.id_resena
                  const cal = Number(r.calificacion ?? 0)
                  const isMine = Number(r.id_usuario ?? r.usuario_id ?? 0) === userId
                  return (
                    <tr key={id}>
                      <td>{id}</td>
                    <td>{(() => { const pid = r.id_producto ?? r.producto_id ?? r.idProduct ?? (filters.producto || null); const name = pid ? productoMap[String(pid)] : ''; return pid ? `${pid}${name?` - ${name}`:''}` : (name? name : '-') })()}</td>
                      <td>
                        <span className="badge badge-neutral" title={`${cal} / 5`}>
                          {[...Array(5)].map((_,i)=> <Star key={i} size={12} color={i<cal?'#f59e0b':'#9CA3AF'} fill={i<cal?'#f59e0b':'none'} />)}
                        </span>
                      </td>
                      <td>{r.comentario ?? '-'}</td>
                      <td>{new Date(r.created_at ?? r.fecharesena ?? Date.now()).toLocaleString()}</td>
                      <td>
                        <div className="actions" style={{display:'flex', gap:8}}>
                          {(role==='admin' || role==='superadmin') && (
                            <>
                              <button className="icon-btn btn-primary" onClick={()=> aprobar(r)} title="Aprobar" aria-label="Aprobar" disabled={String(r.estado||'').toLowerCase()==='aprobada'}><CheckCircle size={16} color="#fff"/></button>
                              <button className="icon-btn btn-primary" onClick={()=> ocultar(r)} title="Ocultar" aria-label="Ocultar" disabled={String(r.estado||'').toLowerCase()==='oculta'}><EyeOff size={16} color="#fff"/></button>
                              <button className="icon-btn btn-primary" onClick={()=> rechazar(r)} title="Rechazar" aria-label="Rechazar" disabled={String(r.estado||'').toLowerCase()==='rechazada'}><Ban size={16} color="#fff"/></button>
                              <button className="icon-btn btn-primary" onClick={()=> reabrir(r)} title="Reabrir" aria-label="Reabrir" disabled={String(r.estado||'').toLowerCase()==='pendiente'}><RotateCcw size={16} color="#fff"/></button>
                            </>
                          )}
                          {isMine && (
                            <button className="btn" onClick={()=> startEdit(r)} style={{background:'#1f2937', color:'#fff'}}>Editar</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              })()}
            </tbody>
          </table>
        )}
      </div>

      {(() => { const arr = list.filter(r => filters.producto ? String(r.id_producto) === String(filters.producto) : true); const total = arr.length; const pages = Math.max(1, Math.ceil(total / perPage)); const canPrev = page>1; const canNext = page<pages; return (
        <div style={{display:'flex', alignItems:'center', justifyContent:'flex-start', gap:12, marginTop:12}}>
          <div style={{color:'#374151'}}>Total: {total}</div>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <button className="btn" onClick={resetListado} style={{background:'#2563eb', color:'#fff'}}><ChevronsLeft size={16}/></button>
            <button className="btn" onClick={()=> setPage(p => Math.max(1, p-1))} disabled={!canPrev} style={{background:'#2563eb', color:'#fff'}}><ChevronLeft size={16}/></button>
            <span style={{minWidth:80, textAlign:'center'}}>Página {page} de {pages}</span>
            <button className="btn" onClick={()=> setPage(p => Math.min(pages, p+1))} disabled={!canNext} style={{background:'#2563eb', color:'#fff'}}><ChevronRight size={16}/></button>
          </div>
        </div>
      ) })()}

      {editOpen && (
        <div className="modal-overlay" onClick={()=> { setEditOpen(false); setEditItem(null) }}>
          <div className="modal" onClick={(e)=> e.stopPropagation()}>
            <h3>Editar reseña</h3>
            <div className="form-group"><label>Calificación</label>
              <select value={editForm.calificacion} onChange={(e)=> setEditForm(f => ({ ...f, calificacion: e.target.value }))}>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Comentario</label>
              <textarea value={editForm.comentario} onChange={(e)=> setEditForm(f => ({ ...f, comentario: e.target.value }))} placeholder="Actualiza tu comentario" />
            </div>
            <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
              <button className="btn" onClick={guardarEdicion} style={{background:'#2563eb', color:'#fff'}}>Guardar</button>
              <button className="btn" onClick={()=> { setEditOpen(false); setEditItem(null) }} style={{background:'#1f2937', color:'#fff'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      

    </div>
  )
}
// =====================================================================
// Soporte Page (Frontend)
// Panel admin: crear ticket, listar, responder y cerrar
// - UI: tarjetas, filtros y tabla con acciones
// - Validaciones básicas en inputs
// =====================================================================

import React, { useEffect, useState } from 'react'
import { ChevronsLeft, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react'
import { soporteService } from '../../services/soporteService'

export default function SoportePage() {
  const [stats, setStats] = useState(null)
  const [form, setForm] = useState({ asunto:'', descripcion:'', prioridad:'media' })
  const [list, setList] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ estado:'', prioridad:'' })
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyId, setReplyId] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [prioOpen, setPrioOpen] = useState(false)
  const [prioId, setPrioId] = useState(null)
  const [prioValue, setPrioValue] = useState('alta')
  const [closeOpen, setCloseOpen] = useState(false)
  const [closeId, setCloseId] = useState(null)
  const [closeMotivo, setCloseMotivo] = useState('')

  const loadStats = async () => {
    try { const j = await soporteService.estadisticas(); setStats(j?.data ?? j) }
    catch (e) { try { const local = { total: list.length, abiertos: list.filter(t => String(t.estado||'').toLowerCase()!=='cerrado').length, cerrados: list.filter(t => String(t.estado||'').toLowerCase()==='cerrado').length }; setStats(local) } catch { setError(e.message) } }
  }
  const loadList = async () => {
    setLoading(true); setError('')
    try {
      const r = await soporteService.listarTodos({ page: 1, limit: 500 })
      const arr = Array.isArray(r?.data) ? r.data : (Array.isArray(r) ? r : [])
      setList(arr)
      setTotal(Number(arr.length))
      const statsLocal = { total: arr.length, abiertos: arr.filter(t => String(t.estado||'').toLowerCase()!=='cerrado').length, cerrados: arr.filter(t => String(t.estado||'').toLowerCase()==='cerrado').length }
      setStats(statsLocal)
    } catch (e) { setError(e.message); setStats({ total: 0, abiertos: 0, cerrados: 0 }) } finally { setLoading(false) }
  }

  useEffect(() => { loadList(); loadStats() }, [])

  // Enviar creación de ticket (valida campos vacíos)
  const crear = async () => {
    if (!form.asunto.trim() || !form.descripcion.trim()) { setError('Completa asunto y descripción'); return }
    try { setError(''); await soporteService.crear(form); setForm({ asunto:'', descripcion:'', prioridad:'media' }); await loadList() } catch (e) { setError(e.message) }
  }

  // Acciones: responder, prioridad, cerrar
  const responder = async (id) => { setReplyId(id); setReplyText(''); setReplyOpen(true) }
  const enviarRespuesta = async () => { if (!replyText.trim()) { setError('Respuesta requerida'); return } try { await soporteService.responder(replyId, { respuesta: replyText.trim() }); setReplyOpen(false); setReplyId(null); setReplyText(''); await loadList() } catch (e) { setError(e.message) } }
  const cambiarPrioridad = async (id) => { setPrioId(id); setPrioValue('alta'); setPrioOpen(true) }
  const guardarPrioridad = async () => { const val = String(prioValue||'').toLowerCase(); if (!['baja','media','alta'].includes(val)) { setError('Prioridad inválida'); return } try { await soporteService.prioridad(prioId, val); setPrioOpen(false); setPrioId(null); await loadList() } catch (e) { setError(e.message) } }
  const cerrar = async (id) => { setCloseId(id); setCloseMotivo(''); setCloseOpen(true) }
  const confirmarCierre = async () => { if (!closeMotivo.trim()) { setError('Motivo requerido'); return } try { await soporteService.cerrar(closeId, { motivo: closeMotivo.trim(), estado: 'cerrado' }); setCloseOpen(false); setCloseId(null); setCloseMotivo(''); await loadList() } catch (e) { setError(e.message) } }

  return (
    <div className="productos-module">
      <h1 style={{display:'flex', alignItems:'center', gap:8, color:'#3b82f6'}}><MessageSquare size={22}/> Soporte</h1>

      <div className="card" style={{marginTop:12}}>
        <h3>Estadísticas</h3>
        {stats ? (
          <div style={{display:'flex', gap:18, flexWrap:'wrap', marginTop:8}}>
            <div className="stat-box"><b>Total:</b> {stats.total ?? '-'}</div>
            <div className="stat-box"><b>Abiertos:</b> {stats.abiertos ?? '-'}</div>
            <div className="stat-box"><b>Cerrados:</b> {stats.cerrados ?? '-'}</div>
          </div>
        ) : <div>Cargando estadísticas...</div>}
      </div>

      {/* Se oculta creación de ticket en módulo Admin */}

      <div className="table" style={{marginTop:12}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <h3>Tickets</h3>
          <div className="productos-filters" style={{display:'flex', alignItems:'center', gap:12}}>
            <select value={filters.estado} onChange={(e)=> { setFilters(f => ({ ...f, estado: e.target.value })); setPage(1) }}>
              <option value="">Todos</option>
              <option value="pendiente">Pendientes</option>
              <option value="respondido">Respondidos</option>
              <option value="cerrado">Cerrados</option>
            </select>
            <select value={filters.prioridad} onChange={(e)=> { setFilters(f => ({ ...f, prioridad: e.target.value })); setPage(1) }}>
              <option value="">Todas</option>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
            <button className="btn" onClick={()=> { setPage(1) }} style={{background:'#1f2937', color:'#fff'}}>Aplicar</button>
          </div>
        </div>
        {error && <div className="error-box" style={{marginTop:8}}>{error}</div>}
        {loading ? <div>Cargando...</div> : (
          <table style={{width:'100%'}}>
            <thead>
              <tr>
                <th>ID</th><th>Asunto</th><th>Prioridad</th><th>Estado</th><th>Creado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const norm = (s) => String(s||'').trim().toLowerCase()
                const filtered = list.filter(t => {
                  const okE = filters.estado ? (norm(t.estado) === norm(filters.estado)) : true
                  const okP = filters.prioridad ? (norm(t.prioridad) === norm(filters.prioridad)) : true
                  return okE && okP
                })
                const pages = Math.max(1, Math.ceil(filtered.length / limit))
                const start = (page-1)*limit
                const pageItems = filtered.slice(start, start+limit)
                if (pageItems.length===0) return (<tr><td colSpan="6" style={{textAlign:'center', padding:20}}>Sin tickets</td></tr>)
                return pageItems.map(t => (
                  <tr key={t.id ?? t.id_soporte}>
                    <td>{t.id ?? t.id_soporte}</td>
                    <td>{t.asunto ?? '-'}</td>
                    <td>{t.prioridad ?? '-'}</td>
                    <td>{t.estado ?? '-'}</td>
                    <td>{new Date(t.created_at ?? Date.now()).toLocaleString()}</td>
                    <td>
                    <button className="btn" onClick={()=> responder(t.id ?? t.id_soporte)} style={{background:'#2563eb', color:'#fff', marginRight:6}}>Responder</button>
                    <button className="btn" onClick={()=> cambiarPrioridad(t.id ?? t.id_soporte)} style={{background:'#2563eb', color:'#fff', marginRight:6}}>Prioridad</button>
                    <button className="btn" onClick={()=> cerrar(t.id ?? t.id_soporte)} style={{background:'#2563eb', color:'#fff'}}>Cerrar</button>
                  </td>
                </tr>
              ))
            })()}
            </tbody>
          </table>
        )}
        {(() => { const norm = (s) => String(s||'').trim().toLowerCase(); const filtered = list.filter(t => { const okE = filters.estado ? (norm(t.estado) === norm(filters.estado)) : true; const okP = filters.prioridad ? (norm(t.prioridad) === norm(filters.prioridad)) : true; return okE && okP }); const totalCount = filtered.length; const totalPages = Math.max(1, Math.ceil(totalCount / limit)); const canPrev = page>1; const canNext = page<totalPages; return (
          <div style={{display:'flex', alignItems:'center', justifyContent:'flex-start', gap:12, marginTop:12}}>
            <div style={{color:'#374151'}}>Total: {totalCount}</div>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <button className="btn" onClick={()=> setPage(1)} disabled={!canPrev} style={{background:'#2563eb', color:'#fff'}}><ChevronsLeft size={16}/></button>
              <button className="btn" onClick={()=> setPage(p => Math.max(1, p-1))} disabled={!canPrev} style={{background:'#2563eb', color:'#fff'}}><ChevronLeft size={16}/></button>
              <span style={{minWidth:80, textAlign:'center'}}>Página {page} de {totalPages}</span>
              <button className="btn" onClick={()=> setPage(p => Math.min(totalPages, p+1))} disabled={!canNext} style={{background:'#2563eb', color:'#fff'}}><ChevronRight size={16}/></button>
            </div>
          </div>
      ) })()}

      {replyOpen && (
        <div className="modal-overlay" onClick={()=> { setReplyOpen(false); setReplyId(null) }}>
          <div className="modal" onClick={(e)=> e.stopPropagation()}>
            <div className="card" style={{width:'700px', maxWidth:'95vw'}}>
              <h3 style={{marginTop:0}}>Responder ticket</h3>
              <div className="form-group">
                <label>Respuesta</label>
                <textarea value={replyText} onChange={(e)=> setReplyText(e.target.value)} placeholder="Escribe tu respuesta" style={{minHeight:140, border:'1px solid #1E2330', borderRadius:10, background:'#111827', color:'#E5E7EB', padding:'10px 12px'}} />
              </div>
              <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
                <button className="btn" onClick={enviarRespuesta} style={{background:'#2563eb', color:'#fff'}}>Enviar</button>
                <button className="btn" onClick={()=> { setReplyOpen(false); setReplyId(null) }} style={{background:'#1f2937', color:'#fff'}}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {prioOpen && (
        <div className="modal-overlay" onClick={()=> { setPrioOpen(false); setPrioId(null) }}>
          <div className="modal" onClick={(e)=> e.stopPropagation()}>
            <h3>Cambiar prioridad</h3>
            <div className="form-group"><label>Prioridad</label>
              <select value={prioValue} onChange={(e)=> setPrioValue(e.target.value)} style={{background:'#111827', color:'#E5E7EB', border:'1px solid #1E2330', borderRadius:10, height:44, padding:'0 12px', WebkitAppearance:'none', MozAppearance:'none', appearance:'none'}}>
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>
            <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
              <button className="btn" onClick={guardarPrioridad} style={{background:'#2563eb', color:'#fff'}}>Guardar</button>
              <button className="btn" onClick={()=> { setPrioOpen(false); setPrioId(null) }} style={{background:'#2563eb', color:'#fff'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {closeOpen && (
        <div className="modal-overlay" onClick={()=> { setCloseOpen(false); setCloseId(null) }}>
          <div className="modal" onClick={(e)=> e.stopPropagation()}>
            <h3>Cerrar ticket</h3>
            <div className="form-group"><label>Motivo</label><input type="text" value={closeMotivo} onChange={(e)=> setCloseMotivo(e.target.value)} placeholder="Motivo de cierre" /></div>
            <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
              <button className="btn" onClick={confirmarCierre} style={{background:'#2563eb', color:'#fff'}}>Cerrar</button>
              <button className="btn" onClick={()=> { setCloseOpen(false); setCloseId(null) }} style={{background:'#2563eb', color:'#fff'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
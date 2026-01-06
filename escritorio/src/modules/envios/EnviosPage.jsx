import React, { useEffect, useState } from 'react'
import { enviosService } from '../../services/enviosService'
import { RefreshCcw, CheckCircle, Truck, Edit, Tag, FileText, Printer, History, ChevronLeft, ChevronRight, ChevronsLeft } from 'lucide-react'
import { toast } from 'sonner'

export default function EnviosPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [trackingOpen, setTrackingOpen] = useState(false)
  const [trackingForm, setTrackingForm] = useState({ empresa_envio:'', numero_seguimiento:'' })
  const [trackingId, setTrackingId] = useState(null)
  const [pendingEstadoId, setPendingEstadoId] = useState(null)
  const [pendingEstado, setPendingEstado] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ destinatario:'', direccion_envio:'', ciudad:'', provincia:'', pais:'Argentina', codigo_postal:'' })
  const [editId, setEditId] = useState(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyItems, setHistoryItems] = useState([])
  

  const cargar = async () => {
    setLoading(true); setError('')
    try {
      const j = await enviosService.listar()
      setItems(Array.isArray(j?.data) ? j.data : (Array.isArray(j) ? j : []))
      setPage(1)
    } catch (e) { setError(e.message || 'Error al listar envios') }
    finally { setLoading(false) }
  }

  const marcarEntregado = async (envio) => {
    try {
      const id = envio.id_envio ?? envio.id
      await enviosService.cambiarEstado(id, 'entregado')
      setItems(arr => arr.map(x => (String(x.id_envio ?? x.id) === String(id)) ? { ...x, estado_envio: 'entregado', fecha_entrega: new Date().toISOString() } : x))
      toast.success('Envío marcado como entregado')
    } catch (e) { setError(e.message || 'No se pudo marcar entregado') }
  }

  const updateEnvioRow = (id, patch) => {
    setItems(arr => arr.map(x => (String(x.id_envio ?? x.id) === String(id)) ? { ...x, ...patch } : x))
  }

  const cambiarEstado = async (id, estado) => {
    const row = items.find(x => String(x.id_envio ?? x.id) === String(id))
    if (estado === 'en_camino' && (!row?.empresa_envio || !row?.numero_seguimiento)) {
      setTrackingId(id)
      setTrackingForm({ empresa_envio: row?.empresa_envio || '', numero_seguimiento: row?.numero_seguimiento || '' })
      setPendingEstadoId(id)
      setPendingEstado('en_camino')
      setTrackingOpen(true)
      return
    }
    try {
      await enviosService.cambiarEstado(id, estado)
      updateEnvioRow(id, { estado_envio: estado, ...(estado==='en_camino' ? { fecha_envio: new Date().toISOString() } : {}), ...(estado==='entregado' ? { fecha_entrega: new Date().toISOString() } : {}) })
      toast.success('Estado actualizado')
    } catch (e) { setError(e.message || 'No se pudo cambiar estado') }
  }

  

  const openTracking = (envio) => {
    const id = envio.id_envio ?? envio.id
    setTrackingId(id)
    setTrackingForm({ empresa_envio: envio.empresa_envio || '', numero_seguimiento: envio.numero_seguimiento || '' })
    setTrackingOpen(true)
  }

  const saveTracking = async () => {
    if (!trackingId) return
    setLoading(true); setError('')
    try {
      const r = await enviosService.actualizar(trackingId, { empresa_envio: trackingForm.empresa_envio, numero_seguimiento: trackingForm.numero_seguimiento })
      const obj = r?.data ?? r
      updateEnvioRow(trackingId, { empresa_envio: obj?.empresa_envio ?? trackingForm.empresa_envio, numero_seguimiento: obj?.numero_seguimiento ?? trackingForm.numero_seguimiento })
      setTrackingOpen(false)
      setTrackingId(null)
      if (pendingEstadoId && String(pendingEstadoId) === String(trackingId) && pendingEstado) {
        await cambiarEstado(trackingId, pendingEstado)
        setPendingEstadoId(null)
        setPendingEstado('')
      }
      toast.success('Seguimiento asignado')
    } catch (e) { setError(e.message || 'Error al asignar seguimiento') } finally { setLoading(false) }
  }

  const openEdit = (envio) => {
    const id = envio.id_envio ?? envio.id
    setEditId(id)
    setEditForm({ destinatario: envio.destinatario || '', direccion_envio: envio.direccion_envio || '', ciudad: envio.ciudad || '', provincia: envio.provincia || '', pais: envio.pais || 'Argentina', codigo_postal: envio.codigo_postal || '' })
    setEditOpen(true)
  }

  const saveEdit = async () => {
    if (!editId) return
    setLoading(true); setError('')
    try {
      const r = await enviosService.actualizar(editId, { destinatario: editForm.destinatario, direccion_envio: editForm.direccion_envio, ciudad: editForm.ciudad, provincia: editForm.provincia, pais: editForm.pais, codigo_postal: editForm.codigo_postal })
      const obj = r?.data ?? r
      updateEnvioRow(editId, { destinatario: obj?.destinatario ?? editForm.destinatario, direccion_envio: obj?.direccion_envio ?? editForm.direccion_envio, ciudad: obj?.ciudad ?? editForm.ciudad, provincia: obj?.provincia ?? editForm.provincia, pais: obj?.pais ?? editForm.pais, codigo_postal: obj?.codigo_postal ?? editForm.codigo_postal })
      setEditOpen(false)
      setEditId(null)
      toast.success('Datos de envío actualizados')
    } catch (e) { setError(e.message || 'Error al actualizar datos') } finally { setLoading(false) }
  }


  const buildLabelHtml = (e) => {
    const destinatario = e.destinatario || '-'
    const direccion = [e.direccion_envio, e.ciudad, e.provincia, e.pais, e.codigo_postal].filter(Boolean).join(', ')
    const tracking = [e.empresa_envio, e.numero_seguimiento].filter(Boolean).join(' ')
    const idEnvio = e.id_envio ?? e.id
    const idPedido = e.id_pedido ?? '-'
    return `<!doctype html><html><head><meta charset="utf-8"/><title>Etiqueta</title><style>body{font-family:Arial, sans-serif; padding:20px;} .card{border:1px solid #e5e7eb; border-radius:8px; padding:16px;} .title{font-size:18px; font-weight:600; color:#1f2937; display:flex; align-items:center; gap:8px;} .row{margin-top:8px} .label{color:#374151} .big{font-size:24px; font-weight:700; margin-top:12px} .grid{display:grid; grid-template-columns:1fr 1fr; gap:12px;}</style></head><body><div class="card"><div class="title">Etiqueta de envío</div><div class="row"><span class="label">Envío</span>: ${idEnvio}</div><div class="row"><span class="label">Pedido</span>: ${idPedido}</div><div class="row big">${destinatario}</div><div class="row">${direccion}</div><div class="row"><span class="label">Seguimiento</span>: ${tracking || '-'}</div></div></body></html>`
  }

  const printLabel = (envio) => {
    setPreviewHtml(buildLabelHtml(envio))
    setPreviewOpen(true)
  }

  const openHistory = async (envio) => {
    setLoading(true); setError('')
    try {
      const id = envio.id_envio ?? envio.id
      const obj = await enviosService.obtener(id)
      const h = Array.isArray(obj?.historial) ? obj.historial : (Array.isArray(obj?.estado_historial) ? obj.estado_historial : [])
      setHistoryItems(h)
      setHistoryOpen(true)
    } catch (e) { setError(e.message || 'No se pudo obtener historial') } finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 style={{display:'flex', alignItems:'center', gap:8, color:'#3b82f6'}}><Truck size={20}/> Envios</h2>
        <div style={{display:'flex', gap:8}}>
          <button className="btn" onClick={cargar} title="Actualizar" aria-label="Actualizar" style={{background:'#2563eb', color:'#fff'}}><RefreshCcw size={16}/></button>
        </div>
      </div>

      {error && <div className="error-box" style={{marginTop:8}}>{error}</div>}
      {loading ? <div>Cargando envios...</div> : (
        <div className="table" style={{marginTop:12}}>
          <table style={{width:'100%'}}>
            <thead>
              <tr>
                <th>ID Envio</th>
                <th>ID Pedido</th>
                <th>Destinatario</th>
                <th>Dirección</th>
                <th>Ciudad</th>
                <th>Provincia</th>
                <th>Estado</th>
                <th>Fecha envio</th>
                <th>Fecha entrega</th>
                <th style={{width:320}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.length===0 ? (
                <tr><td colSpan="9" style={{textAlign:'center', padding:20}}>No hay envios</td></tr>
              ) : items.slice((page-1)*limit, (page-1)*limit+limit).map(e => (
                <tr key={e.id_envio ?? e.id ?? (e.id_pedido+'-'+e.estado_envio)}>
                  <td>{e.id_envio ?? e.id}</td>
                  <td>{e.id_pedido ?? '-'}</td>
                  <td>{e.destinatario ?? '-'}</td>
                  <td>{e.direccion_envio ?? '-'}</td>
                  <td>{e.ciudad ?? '-'}</td>
                  <td>{e.provincia ?? '-'}</td>
                  <td>
                    <select
                      value={e.estado_envio || ''}
                      onChange={ev=> cambiarEstado(e.id_envio ?? e.id, ev.target.value)}
                      style={{
                        background:'#0f172a',
                        color:'#fff',
                        border:'1px solid #334155',
                        borderRadius:8,
                        padding:'8px 12px'
                      }}
                    >
                      <option value="preparando">preparando</option>
                      <option value="en_camino">en_camino</option>
                      <option value="entregado">entregado</option>
                      <option value="devuelto">devuelto</option>
                    </select>
                  </td>
                  <td>{e.fecha_envio ? new Date(e.fecha_envio).toLocaleString() : '-'}</td>
                  <td>{e.fecha_entrega ? new Date(e.fecha_entrega).toLocaleString() : '-'}</td>
                  <td>
                    <div style={{display:'flex', alignItems:'center', gap:6, flexWrap:'nowrap', whiteSpace:'nowrap'}}>
                      <button className="btn" onClick={()=> marcarEntregado(e)} title="Marcar entregado" aria-label="Marcar entregado" style={{background:'#2563eb', color:'#fff', width:32, height:32, padding:0, display:'inline-flex', alignItems:'center', justifyContent:'center'}}><CheckCircle size={12}/></button>
                      <button className="btn" onClick={()=> openTracking(e)} title="Asignar seguimiento" aria-label="Asignar seguimiento" style={{background:'#2563eb', color:'#fff', width:32, height:32, padding:0, display:'inline-flex', alignItems:'center', justifyContent:'center'}}><Tag size={12}/></button>
                      <button className="btn" onClick={()=> openEdit(e)} title="Editar dirección" aria-label="Editar dirección" style={{background:'#2563eb', color:'#fff', width:32, height:32, padding:0, display:'inline-flex', alignItems:'center', justifyContent:'center'}}><Edit size={12}/></button>
                      <button className="btn" onClick={()=> printLabel(e)} title="Imprimir etiqueta" aria-label="Imprimir etiqueta" style={{background:'#2563eb', color:'#fff', width:32, height:32, padding:0, display:'inline-flex', alignItems:'center', justifyContent:'center'}}><Printer size={12}/></button>
                      <button className="btn" onClick={()=> openHistory(e)} title="Ver historial" aria-label="Ver historial" style={{background:'#2563eb', color:'#fff', width:32, height:32, padding:0, display:'inline-flex', alignItems:'center', justifyContent:'center'}}><History size={12}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{display:'flex', alignItems:'center', justifyContent:'flex-start', gap:12, marginTop:12}}>
            <div style={{color:'#374151'}}>Total: {items.length}</div>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <button className="btn" onClick={()=> setPage(1)} disabled={page<=1} style={{background:'#2563eb', color:'#fff'}}><ChevronsLeft size={16}/></button>
              <button className="btn" onClick={()=> setPage(p => Math.max(1, p-1))} disabled={page<=1} style={{background:'#2563eb', color:'#fff'}}><ChevronLeft size={16}/></button>
              <span style={{minWidth:80, textAlign:'center'}}>Página {page} de {Math.max(1, Math.ceil(items.length/limit))}</span>
              <button className="btn" onClick={()=> setPage(p => Math.min(Math.max(1, Math.ceil(items.length/limit)), p+1))} disabled={page>=Math.max(1, Math.ceil(items.length/limit))} style={{background:'#2563eb', color:'#fff'}}><ChevronRight size={16}/></button>
            </div>
          </div>
        </div>
      )}
      {trackingOpen && (
        <div className="modal-overlay" onClick={()=> { setTrackingOpen(false); setTrackingId(null) }}>
          <div className="modal" onClick={(e)=> e.stopPropagation()}>
            <h3 style={{display:'flex', alignItems:'center', gap:8}}><Tag size={20}/> Asignar seguimiento</h3>
            <div className="form-group"><label>Empresa</label><input type="text" placeholder="Empresa de envío" value={trackingForm.empresa_envio} onChange={e=> setTrackingForm(f => ({ ...f, empresa_envio: e.target.value }))} /></div>
            <div className="form-group"><label>Número de seguimiento</label><input type="text" placeholder="Ej. 781817227" value={trackingForm.numero_seguimiento} onChange={e=> setTrackingForm(f => ({ ...f, numero_seguimiento: e.target.value }))} /></div>
            <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
              <button className="btn btn-primary" onClick={saveTracking}>Guardar</button>
              <button className="btn" onClick={()=> { setTrackingOpen(false); setTrackingId(null) }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
      {editOpen && (
        <div className="modal-overlay" onClick={()=> { setEditOpen(false); setEditId(null) }}>
          <div className="modal" onClick={(e)=> e.stopPropagation()}>
            <h3 style={{display:'flex', alignItems:'center', gap:8}}><Edit size={20}/> Editar dirección</h3>
            <div className="form-group"><label>Destinatario</label><input type="text" placeholder="Nombre completo" value={editForm.destinatario} onChange={e=> setEditForm(f => ({ ...f, destinatario: e.target.value }))} /></div>
            <div className="form-group"><label>Dirección</label><input type="text" placeholder="Calle y número" value={editForm.direccion_envio} onChange={e=> setEditForm(f => ({ ...f, direccion_envio: e.target.value }))} /></div>
            <div className="form-group"><label>Ciudad</label><input type="text" placeholder="Ciudad" value={editForm.ciudad} onChange={e=> setEditForm(f => ({ ...f, ciudad: e.target.value }))} /></div>
            <div className="form-group"><label>Provincia</label><input type="text" placeholder="Provincia" value={editForm.provincia} onChange={e=> setEditForm(f => ({ ...f, provincia: e.target.value }))} /></div>
            <div className="form-group"><label>País</label><input type="text" placeholder="País" value={editForm.pais} onChange={e=> setEditForm(f => ({ ...f, pais: e.target.value }))} /></div>
            <div className="form-group"><label>Código postal</label><input type="text" placeholder="Código postal" value={editForm.codigo_postal} onChange={e=> setEditForm(f => ({ ...f, codigo_postal: e.target.value }))} /></div>
            <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
              <button className="btn btn-primary" onClick={saveEdit}>Guardar</button>
              <button className="btn" onClick={()=> { setEditOpen(false); setEditId(null) }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
      {previewOpen && (
        <div className="modal-overlay" onClick={()=> { setPreviewOpen(false); setPreviewHtml('') }}>
          <div className="modal" style={{maxWidth:800}} onClick={(e)=> e.stopPropagation()}>
            <div className="panel-header" style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
              <h3 style={{display:'flex', alignItems:'center', gap:8}}><FileText size={20}/> Vista previa de etiqueta</h3>
              <button className="btn" onClick={()=> { const w = window.open('', '_blank'); if (w) { w.document.write(previewHtml); w.document.close(); w.focus(); w.print(); } }} style={{background:'#2563eb', color:'#fff'}}><Printer size={18}/></button>
            </div>
            <div style={{border:'1px solid #e5e7eb', borderRadius:8, overflow:'hidden', marginTop:12}}>
              <iframe title="vista-etiqueta" srcDoc={previewHtml} style={{width:'100%', height:500, border:0}} />
            </div>
            <div style={{display:'flex', justifyContent:'flex-end', gap:10, marginTop:14}}>
              <button className="btn" onClick={()=> { setPreviewOpen(false); setPreviewHtml('') }} style={{background:'#1d4ed8', color:'#fff'}}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
      {historyOpen && (
        <div className="modal-overlay" onClick={()=> setHistoryOpen(false)}>
          <div className="modal" onClick={(e)=> e.stopPropagation()}>
            <div className="panel-header" style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
              <h3 style={{display:'flex', alignItems:'center', gap:8}}><History size={20}/> Historial de estado</h3>
            </div>
            <div className="panel-body" style={{marginTop:12}}>
              {historyItems && historyItems.length > 0 ? (
                <ul>
                  {historyItems.map((h, i) => (
                    <li key={i} style={{padding:'6px 0', borderBottom:'1px solid #e5e7eb'}}>{String(h.fecha || h.date || h.created_at || '').slice(0,19)} — {h.estado || h.status || '-'}</li>
                  ))}
                </ul>
              ) : (
                <div style={{padding:10}}>Sin historial</div>
              )}
            </div>
            <div style={{display:'flex', justifyContent:'flex-end', gap:10, marginTop:14}}>
              <button className="btn" onClick={()=> setHistoryOpen(false)} style={{background:'#1d4ed8', color:'#fff'}}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
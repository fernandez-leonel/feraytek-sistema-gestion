import React, { useEffect, useState } from 'react'
import { CreditCard, ChevronLeft, ChevronRight, ChevronsLeft } from 'lucide-react'
import { pagosService } from '../../services/pagosService'

export default function PagosPage() {
  const [consulta, setConsulta] = useState({ estado:'', monto_min:'', page:1, limit:25 })
  const [creacion, setCreacion] = useState({ id_pedido:'', id_pago:'', descripcion:'', monto_total:'', code:'' })
  const [dataConsulta, setDataConsulta] = useState([])
  const [adminList, setAdminList] = useState({ page:1, limit:10 })
  const [dataAdmin, setDataAdmin] = useState([])
  const [totalAdmin, setTotalAdmin] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [consultaActiva, setConsultaActiva] = useState(false)

  const doConsulta = async () => {
    setLoading(true); setError('')
    try {
      const { data, total } = await pagosService.consulta({ estado: consulta.estado, monto_min: consulta.monto_min ? Number(consulta.monto_min) : undefined, page: consulta.page, limit: consulta.limit })
      setDataConsulta(Array.isArray(data) ? data : [])
      setConsultaActiva(true)
    } catch (e) { setError(e?.message || 'Error en consulta de pagos') } finally { setLoading(false) }
  }
  const loadAdmin = async () => {
    setLoading(true); setError('')
    try {
      const j = await pagosService.adminList({ page: adminList.page, limit: adminList.limit })
      const arr = Array.isArray(j?.data) ? j.data : (Array.isArray(j) ? j : [])
      setDataAdmin(arr)
      setTotalAdmin(Number(j?.total ?? arr.length))
    } catch (e) { setError(e?.message || 'Error al cargar pagos admin') } finally { setLoading(false) }
  }
  useEffect(() => { loadAdmin() }, [adminList.page, adminList.limit])

  const simulateApproval = async () => {
    const pid = creacion.id_pedido ? Number(creacion.id_pedido) : undefined
    const idPago = creacion.id_pago ? Number(creacion.id_pago) : undefined
    if (!Number.isFinite(idPago) && !Number.isFinite(pid)) { setError('Ingrese ID pago o ID pedido'); return }
    setLoading(true); setError('')
    try {
      await pagosService.aprobar({ id_pago: idPago, id_pedido: pid })
      setCreacion({ id_pedido:'', id_pago:'', descripcion:'', monto_total:'', code:'' })
      await loadAdmin()
    } catch (e) { setError(e?.message || 'Error al aprobar pago') } finally { setLoading(false) }
  }
  

  

  return (
    <div className="productos-module">
      <h1 style={{display:'flex', alignItems:'center', gap:8, color:'#3b82f6'}}><CreditCard size={22}/> Pagos</h1>
      <div className="card" style={{marginTop:12}}>
        <div className="productos-filters" style={{display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'}}>
          <h3>Crear / Simular</h3>
          <input inputMode="numeric" placeholder="ID pedido" value={creacion.id_pedido} onChange={(e)=> setCreacion(c => ({ ...c, id_pedido: e.target.value.replace(/[^0-9]/g,'') }))} />
          <input placeholder="Descripción" value={creacion.descripcion} onChange={(e)=> setCreacion(c => ({ ...c, descripcion: e.target.value }))} />
          <input inputMode="decimal" placeholder="Monto total" value={creacion.monto_total} onChange={(e)=> setCreacion(c => ({ ...c, monto_total: e.target.value.replace(/[^0-9.]/g,'') }))} />
          <input inputMode="numeric" placeholder="ID pago (opc.)" value={creacion.id_pago} onChange={(e)=> setCreacion(c => ({ ...c, id_pago: e.target.value.replace(/[^0-9]/g,'') }))} />
          <button className="btn" onClick={simulateApproval} disabled={!creacion.id_pedido && !creacion.id_pago} style={{background:'#1f2937', color:'#fff'}}>Simular aprobación</button>
        </div>
      </div>

      <div className="card" style={{marginTop:12}}>
        <div className="productos-filters" style={{display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'}}>
          <h3>Consulta</h3>
          <select value={consulta.estado} onChange={(e)=> setConsulta(c => ({ ...c, estado: e.target.value }))}>
            <option value="">Todos los estados</option>
            <option value="aprobado">Aprobado</option>
            <option value="pendiente">Pendiente</option>
            <option value="rechazado">Rechazado</option>
          </select>
          <input inputMode="decimal" placeholder="Monto mínimo" value={consulta.monto_min} onChange={(e)=> setConsulta(c => ({ ...c, monto_min: e.target.value.replace(/[^0-9.]/g,'') }))} />
          <button className="btn" onClick={doConsulta} style={{background:'#1f2937', color:'#fff'}}>Buscar</button>
          <button className="btn" onClick={()=> { setDataConsulta([]); setConsultaActiva(false) }} style={{background:'#1f2937', color:'#fff'}}>Limpiar</button>
        </div>
        {dataConsulta.length>0 && (
          <div className="table" style={{marginTop:12}}>
            <table style={{width:'100%'}}>
              <thead>
                <tr>
                  <th>ID Pago</th>
                  <th>ID Pedido</th>
                  <th>Cliente</th>
                  <th>Descripción</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Creado</th>
                </tr>
              </thead>
              <tbody>
                {dataConsulta.map(p => (
                  <tr key={p.id ?? p.id_pago ?? p.created_at}>
                    <td>{p.id ?? p.id_pago}</td>
                    <td>{p.id_pedido ?? '-'}</td>
                    <td>{p.cliente_nombre ?? (p.cliente?.nombre ?? '-')}</td>
                    <td>{p.descripcion ?? p.detalle ?? p.descripcion_pago ?? (p.id_pedido ? `Pago pedido #${p.id_pedido}` : (p.simulacion ? 'Simulación de pago' : '-'))}</td>
                    <td>${Number(p.monto_total ?? p.monto ?? 0).toFixed(2)}</td>
                    <td>{p.estado ?? p.estado_pago ?? p.status ?? (p.simulacion ? 'aprobado' : 'pendiente')}</td>
                    <td>{(()=>{ const raw = p.created_at ?? p.fecha_pago ?? p.updated_at; const d = raw ? new Date(raw) : null; return d && !isNaN(d.getTime()) ? d.toLocaleString() : '-' })()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!consultaActiva && (
        <div className="table" style={{marginTop:12}}>
          <h3>Listado Admin</h3>
          {error && <div className="error-box" style={{marginTop:8}}>{error}</div>}
          {loading ? <div>Cargando pagos...</div> : (
            <table style={{width:'100%'}}>
              <thead>
                <tr>
                  <th>ID Pago</th>
                  <th>ID Pedido</th>
                  <th>Cliente</th>
                  <th>Descripción</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Creado</th>
                </tr>
              </thead>
              <tbody>
                {dataAdmin.length===0 ? (
                  <tr><td colSpan="7" style={{textAlign:'center', padding:20}}>No se encontraron pagos</td></tr>
                ) : dataAdmin.map(p => (
                  <tr key={p.id ?? p.id_pago ?? p.created_at}>
                    <td>{p.id ?? p.id_pago}</td>
                    <td>{p.id_pedido ?? '-'}</td>
                    <td>{p.cliente_nombre ?? (p.cliente?.nombre ?? '-')}</td>
                    <td>{p.descripcion ?? p.detalle ?? p.descripcion_pago ?? (p.id_pedido ? `Pago pedido #${p.id_pedido}` : (p.simulacion ? 'Simulación de pago' : '-'))}</td>
                    <td>${Number(p.monto_total ?? p.monto ?? 0).toFixed(2)}</td>
                    <td>{p.estado ?? p.estado_pago ?? p.status ?? (p.simulacion ? 'aprobado' : 'pendiente')}</td>
                    <td>{(()=>{ const raw = p.created_at ?? p.fecha_pago ?? p.updated_at; const d = raw ? new Date(raw) : null; return d && !isNaN(d.getTime()) ? d.toLocaleString() : '-' })()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {(() => { const pages = Math.max(1, Math.ceil(totalAdmin / adminList.limit)); const canPrev = adminList.page > 1; const canNext = adminList.page < pages; return (
            <div style={{display:'flex', alignItems:'center', justifyContent:'flex-start', gap:12, marginTop:12}}>
              <div style={{color:'#374151'}}>Total: {totalAdmin}</div>
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <button className="btn" onClick={()=> setAdminList(a => ({ ...a, page: 1 }))} disabled={!canPrev} style={{background:'#2563eb', color:'#fff'}}><ChevronsLeft size={16}/></button>
                <button className="btn" onClick={()=> setAdminList(a => ({ ...a, page: Math.max(1, a.page-1) }))} disabled={!canPrev} style={{background:'#2563eb', color:'#fff'}}><ChevronLeft size={16}/></button>
                <span style={{minWidth:80, textAlign:'center'}}>Página {adminList.page} de {pages}</span>
                <button className="btn" onClick={()=> setAdminList(a => ({ ...a, page: a.page+1 }))} disabled={!canNext} style={{background:'#2563eb', color:'#fff'}}><ChevronRight size={16}/></button>
              </div>
            </div>
          ) })()}
        </div>
      )}

    </div>
  )
}
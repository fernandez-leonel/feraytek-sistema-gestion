import React, { useState, useEffect } from 'react'
import { pedidosService } from '../../services/pedidosService'
import { pagosService } from '../../services/pagosService'
import PedidoDetailPanel from './PedidoDetailPanel'
import { Eye, ClipboardList, ChevronsLeft, ChevronLeft, ChevronRight } from 'lucide-react'

export default function PedidosPage() {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ estado:'', metodo_pago:'', fecha_desde:'', fecha_hasta:'', id:'', id_usuario:'' })
  const [detail, setDetail] = useState(null)
  const [mineOnly, setMineOnly] = useState(false)
  const [userMap, setUserMap] = useState({})
  const [payMap, setPayMap] = useState({})
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'

  const load = async () => {
    setError('')
    setLoading(true)
    try {
      const j = mineOnly ? await pedidosService.listarUsuario({ page, per_page: perPage }) : await pedidosService.listar({ page, per_page: perPage, ...filters })
      const arr = Array.isArray(j?.data) ? j.data : (Array.isArray(j) ? j : [])
      setItems(arr)
      setTotal(Number(j?.total ?? arr.length))
      await enrich(arr)
    } catch (e) { setError(e?.message || 'Error al cargar pedidos') } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [page, perPage, filters.estado, filters.metodo_pago, filters.fecha_desde, filters.fecha_hasta, mineOnly])

  const pages = Math.max(1, Math.ceil(total / perPage))
  const changePage = (p) => setPage(Math.min(pages, Math.max(1, p)))
  const handlePositiveId = (val) => { const clean = val.replace(/[^0-9]/g, ''); setFilters(f => ({ ...f, id: clean })) }
  const enrich = async (arr) => {
    const token = sessionStorage.getItem('token')
    const uids = Array.from(new Set((arr||[]).map(p => Number(p.id_usuario)).filter(id => Number.isFinite(id) && id>0 && !(id in userMap))))
    const newUserMap = { ...userMap }
    await Promise.all(uids.map(async (id) => {
      try {
        const hdr = token ? { Authorization: `Bearer ${token}`, Accept: 'application/json' } : { Accept: 'application/json' }
        const r = await fetch(`${API_BASE}/users/profile/${id}`, { headers: hdr })
        const j = await r.json().catch(()=>({}))
        const perfil = j?.data ?? j ?? {}
        const nombre = perfil.nombre_usuario || (perfil.nombre || perfil.apellido ? `${perfil.nombre||''} ${perfil.apellido||''}`.trim() : '')
        newUserMap[id] = nombre || perfil.email || `Usuario ${id}`
      } catch { newUserMap[id] = `Usuario ${id}` }
    }))
    setUserMap(newUserMap)
    const ids = Array.from(new Set((arr||[]).map(p => (p.id ?? p.id_pedido)).filter(x => x != null && !(String(x) in payMap))))
    try {
      const res = await pagosService.adminList({ page:1, limit:500 })
      const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
      const map = { ...payMap }
      for (const id of ids) {
        const m = data.find(pp => String(pp.id_pedido ?? pp.pedido_id) === String(id))
        map[String(id)] = m?.metodo_pago ?? m?.metodo ?? ''
      }
      setPayMap(map)
    } catch {}
  }

  return (
    <div className="productos-module">
      <h1 style={{display:'flex', alignItems:'center', gap:8, color:'#3b82f6'}}><ClipboardList size={22}/> Pedidos</h1>
      <div className="card" style={{marginTop:12}}>
        <div className="productos-filters" style={{display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'}}>
          <label style={{display:'inline-flex', alignItems:'center', gap:8}}>
            <input type="checkbox" checked={mineOnly} onChange={(e)=> {
              const checked = e.target.checked
              setMineOnly(checked)
              if (checked) {
                const u = sessionStorage.getItem('user')
                let uid = ''
                try { uid = String(JSON.parse(u)?.id ?? JSON.parse(u)?.id_usuario ?? '') } catch {}
                setFilters(f => ({ ...f, id_usuario: uid, id: '' }))
              } else {
                setFilters(f => ({ ...f, id_usuario: '' }))
              }
              setPage(1)
            }} />
            Mis pedidos
          </label>
          <select value={filters.estado} onChange={(e)=> setFilters(f => ({ ...f, estado: e.target.value }))}>
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="procesando">Procesando</option>
            <option value="enviado">Enviado</option>
            <option value="entregado">Entregado</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <select value={filters.metodo_pago} onChange={(e)=> setFilters(f => ({ ...f, metodo_pago: e.target.value }))}>
            <option value="">Todos los métodos</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option>
            <option value="simulado">Simulado</option>
          </select>
          <input type="date" value={filters.fecha_desde} onChange={(e)=> setFilters(f => ({ ...f, fecha_desde: e.target.value }))} />
          <input type="date" value={filters.fecha_hasta} onChange={(e)=> setFilters(f => ({ ...f, fecha_hasta: e.target.value }))} />
          <input inputMode="numeric" placeholder="ID pedido" value={filters.id} onChange={(e)=> handlePositiveId(e.target.value)} style={{width:120}} disabled={mineOnly} />
          <input inputMode="numeric" placeholder="ID usuario" value={filters.id_usuario} onChange={(e)=> setFilters(f => ({ ...f, id_usuario: e.target.value.replace(/[^0-9]/g,'') }))} style={{width:120}} disabled={mineOnly} />
          <button className="btn" onClick={()=> { setPage(1); load() }} style={{background:'#1f2937', color:'#fff'}}>Aplicar</button>
        </div>
      </div>

      {error && <div className="error-box" style={{marginTop:8}}>{error}</div>}
      {loading ? <div>Cargando pedidos...</div> : (
        <div className="table" style={{marginTop:12}}>
          <table style={{width:'100%'}}>
            <thead>
              <tr>
                <th># Pedido</th>
                <th>Cliente</th>
                <th>Creado</th>
                <th>Estado</th>
                <th>Total</th>
                <th>Método</th>
                <th>Ítems</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.length===0 ? (
                <tr><td colSpan="8" style={{textAlign:'center', padding:20}}>No se encontraron pedidos con los filtros seleccionados</td></tr>
              ) : items.map(p => {
                const id = p.id ?? p.id_pedido
                const cliente = (
                  p.cliente?.nombre ||
                  p.cliente_nombre ||
                  p.nombre_cliente ||
                  p.usuario ||
                  p.nombre_usuario ||
                  (p.user?.nombre_usuario) ||
                  `${(p.cliente?.nombre || p.user?.nombre || '')} ${(p.cliente?.apellido || p.user?.apellido || '')}`.trim() ||
                  (p.email ? p.email : (p.id_usuario ? (userMap[p.id_usuario] || `Usuario ${p.id_usuario}`) : '-'))
                )
                const creado = new Date(p.created_at ?? p.fecha_creacion ?? p.fecha_pedido ?? Date.now()).toLocaleString()
                const estado = p.estado ?? '-'
                const total = Number(p.total_final ?? p.total ?? 0).toFixed(2)
                const metodo = p.metodo_pago ?? p.payment_method ?? p.metodo ?? p.pago?.metodo ?? p.pago?.tipo ?? payMap[String(id)] ?? '-'
                const count = Array.isArray(p.items) ? p.items.length : (Number(p.cantidad_items ?? p.items_count ?? 0))
                return (
                  <tr key={id ?? creado}>
                    <td>{id}</td>
                    <td>{cliente}</td>
                    <td>{creado}</td>
                    <td><span className={`badge ${estado==='cancelado'?'badge-danger':'badge-success'}`}>{estado}</span></td>
                    <td>${total}</td>
                    <td>{metodo}</td>
                    <td>{count}</td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-view" onClick={async()=>{
                          try {
                            const d = await pedidosService.obtener(id)
                            const listItems = Array.isArray(p.items) ? p.items : []
                            const root = d?.data ?? d
                            if (!Array.isArray(root?.detalle) && listItems.length>0) {
                              setDetail({ ...root, detalle: listItems })
                            } else {
                              setDetail(root)
                            }
                          } catch {}
                        }}><Eye size={14}/> Ver detalle</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{display:'flex', alignItems:'center', justifyContent:'flex-start', gap:12, marginTop:12}}>
        <div style={{color:'#374151'}}>Total: {total}</div>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <button className="btn" onClick={()=> changePage(1)} disabled={page===1} style={{background:'#2563eb', color:'#fff'}}><ChevronsLeft size={16}/></button>
          <button className="btn" onClick={()=> changePage(page-1)} disabled={page===1} style={{background:'#2563eb', color:'#fff'}}><ChevronLeft size={16}/></button>
          <span style={{minWidth:80, textAlign:'center'}}>Página {page} de {pages}</span>
          <button className="btn" onClick={()=> changePage(page+1)} disabled={page>=pages} style={{background:'#2563eb', color:'#fff'}}><ChevronRight size={16}/></button>
        </div>
      </div>

      {detail && (
        <PedidoDetailPanel pedido={detail} onClose={()=> setDetail(null)} onChanged={async()=>{ await load(); }} />
      )}
    </div>
  )
}
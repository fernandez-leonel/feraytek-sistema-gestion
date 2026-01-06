import React, { useState, useEffect } from 'react'
import { pedidosService } from '../../services/pedidosService'
import { pagosService } from '../../services/pagosService'
import { productosService } from '../../services/productosService'
import { variantesService } from '../../services/variantesService'
import { toast } from 'sonner'

// Panel lateral de detalle de un pedido. Muestra datos del cliente,
// dirección, totales, ítems y historial. Permite cambiar el estado
// del pedido con validación de opciones permitidas.
export default function PedidoDetailPanel({ pedido, onClose, onChanged }) {
  // Envoltorio raíz y pedido interno según respuesta de API
  const root = pedido?.data ?? pedido
  const src = root?.pedido ?? root?.order ?? root
  // ID del pedido. Se acepta `id` o `id_pedido` para compatibilidad
  const idRaw = src?.id ?? src?.id_pedido
  const id = Number.isFinite(Number(idRaw)) ? Number(idRaw) : null
  // Estado editable del pedido
  const [estado, setEstado] = useState(String(pedido?.estado || ''))
  // Flag de guardado para deshabilitar el botón mientras se actualiza
  const [saving, setSaving] = useState(false)
  const [perfil, setPerfil] = useState({ nombre:'', apellido:'', email:'', telefono:'' })
  const [envioInfo, setEnvioInfo] = useState(null)
  useEffect(() => {
    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'
    const token = sessionStorage.getItem('token')
    const uid = Number(src?.id_usuario ?? src?.usuario_id ?? src?.user?.id_usuario ?? src?.cliente?.id_usuario)
    if (!Number.isFinite(uid) || uid<=0) { setPerfil({ nombre:'', apellido:'', email:'', telefono:'' }); return }
    (async () => {
      try {
        const hdr = token ? { Authorization: `Bearer ${token}`, Accept: 'application/json' } : { Accept: 'application/json' }
        const r = await fetch(`${API_BASE}/users/profile/${uid}`, { headers: hdr })
        const j = await r.json().catch(()=>({}))
        const d = j?.data ?? j ?? {}
        setPerfil({ nombre: d.nombre_usuario || d.nombre || '', apellido: d.apellido || '', email: d.email || '', telefono: d.telefono || '' })
      } catch { setPerfil({ nombre:'', apellido:'', email:'', telefono:'' }) }
    })()
  }, [src?.id_usuario, src?.usuario_id])
  useEffect(() => {
    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'
    const token = sessionStorage.getItem('token')
    if (id == null) { setEnvioInfo(null); return }
    (async () => {
      try {
        const hdr = token ? { Authorization: `Bearer ${token}`, Accept: 'application/json' } : { Accept: 'application/json' }
        const r = await fetch(`${API_BASE}/envios`, { headers: hdr })
        const j = await r.json().catch(()=>({}))
        const arr = Array.isArray(j?.data) ? j.data : (Array.isArray(j) ? j : [])
        const m = arr.find(e => String(e.id_pedido ?? e.pedido_id) === String(id))
        setEnvioInfo(m || null)
      } catch { setEnvioInfo(null) }
    })()
  }, [id])
  // Estados válidos según el backend
  const states = ['pendiente','procesando','enviado','entregado','cancelado']
  // Acción de guardado: llama a `actualizarEstado` y notifica al padre
  const save = async () => {
    if (id == null || !Number.isFinite(id) || id <= 0) { toast.error('ID inválido'); return }
    setSaving(true)
    try {
      await pedidosService.actualizarEstado(id, estado)
      toast.success('Estado actualizado')
      try { const d = await pedidosService.obtener(id); if (d?.estado) setEstado(String(d.estado)) } catch {}
      await onChanged()
    } catch (e) { toast.error(e?.message || 'No se pudo actualizar estado') } finally { setSaving(false) }
  }
  // Datos derivados del payload de pedido, tolerando estructuras distintas
  const cliente = src.cliente || src.user || {}
  const direccion = (src.direccion || src.envio?.direccion || envioInfo || {})
  const baseItems = (
    Array.isArray(root?.detalle) ? root.detalle : (
      Array.isArray(src.items) ? src.items : (
        Array.isArray(src.data?.items) ? src.data.items : (
          Array.isArray(src.detalles) ? src.detalles : (
            Array.isArray(src.productos) ? src.productos : (
              Array.isArray(src.line_items) ? src.line_items : (
                Array.isArray(src.lineas) ? src.lineas : []
              )
            )
          )
        )
      )
    )
  )
  const toNum = (v) => { if (typeof v === 'number') return v; if (typeof v === 'string' && v.trim().length>0 && !isNaN(Number(v))) return Number(v); return null }
  const normItem = (it) => ({
    nombre: it.nombre || it.producto?.nombre || it.nombre_producto || it.producto || it.titulo || '-',
    precio: (typeof it.precio_unitario==='number' ? it.precio_unitario : (typeof it.precio==='number' ? it.precio : (typeof it.precio_base==='number' ? it.precio_base : toNum(it.precio_unitario ?? it.precio ?? it.precio_base) ?? 0))),
    cantidad: (typeof it.cantidad==='number' ? it.cantidad : (typeof it.qty==='number' ? it.qty : (typeof it.cantidad_items==='number' ? it.cantidad_items : toNum(it.cantidad ?? it.qty) ?? 1))),
    subtotal: (typeof it.subtotal==='number' ? it.subtotal : toNum(it.subtotal) ?? ((typeof it.precio_unitario==='number' ? it.precio_unitario : (typeof it.precio==='number' ? it.precio : toNum(it.precio_unitario ?? it.precio) ?? 0)) * (typeof it.cantidad==='number' ? it.cantidad : (typeof it.qty==='number' ? it.qty : toNum(it.cantidad ?? it.qty) ?? 1))))
  })
  const [itemsNorm, setItemsNorm] = useState(baseItems.map(normItem))
  const [productMap, setProductMap] = useState({})
  useEffect(() => { setItemsNorm(baseItems.map(normItem)) }, [src])
  useEffect(() => {
    (async () => {
      const map = { ...productMap }
      const next = []
      for (const raw of baseItems) {
        let nm = normItem(raw)
        if (!nm.nombre || nm.nombre==='-') {
          let pid = Number(raw.id_producto ?? raw.producto_id)
          if (!Number.isFinite(pid) || pid<=0) {
            const vid = Number(raw.id_variante ?? raw.variante_id)
            if (Number.isFinite(vid) && vid>0) {
              try {
                const v = await variantesService.obtener(vid)
                pid = Number(v?.id_producto ?? v?.producto_id)
                if (!nm.nombre && v?.producto?.nombre) nm.nombre = String(v.producto.nombre)
              } catch {}
            }
          }
          if ((!nm.nombre || nm.nombre==='-') && Number.isFinite(pid) && pid>0) {
            if (!(pid in map)) {
              try { const p = await productosService.obtener(pid); map[pid] = p?.nombre ?? p?.nombre_producto ?? '' } catch { map[pid] = '' }
            }
            const name = map[pid]
            if (name && String(name).trim().length>0) nm.nombre = String(name)
          }
          if ((!nm.nombre || nm.nombre==='-') && (raw.nombre_producto || raw.producto)) {
            nm.nombre = String(raw.nombre_producto || raw.producto)
          }
        }
        next.push(nm)
      }
      setProductMap(map)
      setItemsNorm(next)
    })()
  }, [baseItems])
  useEffect(() => {
    if (itemsNorm.length>0 || id==null) return
    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'
    const token = sessionStorage.getItem('token')
    ;(async () => {
      try {
        const hdr = token ? { Authorization: `Bearer ${token}`, Accept: 'application/json' } : { Accept: 'application/json' }
        const r = await fetch(`${API_BASE}/pedidos/${id}`, { headers: hdr })
        const j = await r.json().catch(()=>({}))
        const rt = j?.data ?? j
        const arr = Array.isArray(rt?.detalle) ? rt.detalle : (Array.isArray(rt?.pedido?.items) ? rt.pedido.items : [])
        if (Array.isArray(arr) && arr.length>0) setItemsNorm(arr.map(normItem))
      } catch {}
    })()
  }, [id, itemsNorm.length])
  // Fechas y montos calculados con fallback seguro
  const toDateStr = (v) => { if (!v) return '-'; const d = new Date(v); return isNaN(d.getTime()) ? '-' : d.toLocaleString() }
  const creado = toDateStr(src.created_at ?? src.fecha_creacion)
  const actualizado = toDateStr(src.updated_at ?? src.fecha_actualizacion)
  const totalNum = toNum(src.total_final ?? src.total)
  const subtotalNum = toNum(src.subtotal)
  const ivaNum = toNum(src.total_iva ?? src.iva)
  const total = (totalNum != null) ? totalNum.toFixed(2) : '-'
  const subtotal = (subtotalNum != null) ? subtotalNum.toFixed(2) : '-'
  const iva = (ivaNum != null) ? ivaNum.toFixed(2) : '-'
  const [metodoP, setMetodoP] = useState('')
  const normalizeEnvio = (s) => {
    const v = String(s||'').trim().toLowerCase().replace(/\s+/g,'_')
    if (!v) return '-'
    if (v==='envio_domicilio' || v==='envío_domicilio') return 'envío a domicilio'
    if (v==='retiro_sucursal' || v==='retira_sucursal') return 'retiro en sucursal'
    if (v==='punto_entrega' || v==='punto_de_entrega') return 'punto de entrega'
    if (v==='correo') return 'correo'
    return s || '-'
  }
  useEffect(() => {
    let mounted = true
    const loadPay = async () => {
      if (id == null) { setMetodoP(''); return }
      try {
        const res = await pagosService.adminList({ page:1, limit:500 })
        const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
        const m = data.find(pp => String(pp.id_pedido ?? pp.pedido_id) === String(id))
        if (mounted) setMetodoP(m?.metodo_pago ?? m?.metodo ?? '')
      } catch { if (mounted) setMetodoP('') }
    }
    loadPay()
    return () => { mounted = false }
  }, [id])
  const metodo = (src.metodo_pago ?? src.payment_method ?? src.metodo ?? src.pago?.metodo ?? src.pago?.tipo ?? metodoP ?? '-')
  const envio = normalizeEnvio(src.metodo_entrega ?? src.tipo_envio ?? src.envio?.metodo_entrega ?? src.envio?.tipo ?? envioInfo?.metodo_entrega ?? envioInfo?.tipo_envio ?? '-')
  return (
    <div className="side-panel">
      {/* Encabezado del panel con acción de cierre */}
      <div className="side-panel-header">
        <h3 style={{color:'#3b82f6'}}>Detalle de pedido</h3>
        <button className="btn" onClick={onClose} style={{background:'#1f2937', color:'#fff'}}>Cerrar</button>
      </div>
      {/* Contenido principal con tarjetas informativas */}
      <div style={{padding:16}}>
        {/* Resumen del cliente y metadatos del pedido */}
        <div className="card" style={{marginBottom:12}}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
            <div>
              <p>ID: {id ?? '-'}</p>
              <p>Cliente: {perfil.nombre || cliente.nombre || cliente.email || '-'}</p>
              <p>Email: {perfil.email || cliente.email || '-'}</p>
              <p>Teléfono: {perfil.telefono || cliente.telefono || '-'}</p>
            </div>
            <div>
              <p>Dirección: {(() => { const calle = direccion.calle || direccion.direccion || direccion.direccion_entrega || ''; const numero = direccion.numero || direccion.altura || ''; const loc = direccion.localidad || ''; const prov = direccion.provincia || ''; const cp = direccion.cp || direccion.codigo_postal || ''; const parts = [calle && `${calle} ${numero||''}`.trim(), loc, prov, cp && `CP ${cp}`].filter(Boolean); return parts.length? parts.join(', ') : '-' })()}</p>
              <p>Creado: {creado}</p>
              <p>Actualizado: {actualizado}</p>
            </div>
          </div>
        </div>
        {/* Totales y selector de estado */}
        <div className="card" style={{marginBottom:12}}>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12}}>
            <div><p>Estado: <span className={`badge ${estado==='cancelado'?'badge-danger':'badge-success'}`}>{estado}</span></p></div>
            <div><p>Subtotal: {subtotal!=='-'?`$${subtotal}`:'-'}</p><p>Descuento: {(toNum(src.descuento_total)!=null)?`$${toNum(src.descuento_total).toFixed(2)}`:'-'}</p><p>Envío: {(toNum(src.costo_envio)!=null)?`$${toNum(src.costo_envio).toFixed(2)}`:(toNum(envioInfo?.costo)!=null?`$${toNum(envioInfo?.costo).toFixed(2)}`:'-')}</p><p>Total: {total!=='-'?`$${total}`:'-'}</p></div>
            <div><p>Método: {metodo}</p><p>Envío: {envio}</p></div>
          </div>
          {/* Acciones para cambiar el estado del pedido */}
          <div style={{display:'flex', gap:8, alignItems:'center', marginTop:12}}>
            <select
              value={estado}
              onChange={(e)=> setEstado(e.target.value)}
              style={{
                background:'#0f172a',
                color:'#fff',
                border:'1px solid #334155',
                borderRadius:8,
                padding:'8px 12px'
              }}
            >
              {states.map(s => {
                const label = s.charAt(0).toUpperCase() + s.slice(1)
                return <option key={s} value={s}>{label}</option>
              })}
            </select>
            <button className="btn btn-orange" onClick={save} disabled={saving || id==null}>{saving?'Guardando...':'Actualizar estado'}</button>
          </div>
        </div>
        {/* Tabla de ítems del pedido */}
        <div className="table" style={{marginBottom:12}}>
          <table style={{width:'100%'}}>
            <thead><tr><th>Producto</th><th>Precio</th><th>Cantidad</th><th>Subtotal</th></tr></thead>
            <tbody>
              {itemsNorm.length===0 ? <tr><td colSpan="4" style={{textAlign:'center', padding:16}}>Sin ítems</td></tr> : itemsNorm.map((it, idx) => (
                <tr key={idx}><td>{it.nombre}</td><td>${Number(it.precio ?? 0).toFixed(2)}</td><td>{it.cantidad ?? 1}</td><td>${Number(it.subtotal ?? 0).toFixed(2)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Historial removido según solicitud: sección no mostrada */}
      </div>
    </div>
  )
}
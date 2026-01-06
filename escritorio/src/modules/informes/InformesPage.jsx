import React, { useEffect, useMemo, useRef, useState } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { informeService } from '../../services/informeService'
import { CalendarRange, RefreshCcw, TrendingUp, CreditCard, Truck, Users, Package, Star, FileDown, BarChart3 } from 'lucide-react'
import { pagosService } from '../../services/pagosService'
import { pedidosService } from '../../services/pedidosService'
import { productosService } from '../../services/productosService'
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'
  const LOCAL_BACKEND = process.env.REACT_APP_LOCAL_BACKEND_URL || 'http://localhost:4001'
const PIE_COLORS = ['#3b82f6','#0ea5e9','#22c55e','#ef4444','#a78bfa','#f59e0b']
const ROLE_COLOR_MAP = { cliente:'#60a5fa', admin:'#a78bfa', superadmin:'#22c55e',  }
const roleColor = (label) => { const k = String(label||'').toLowerCase(); const base = ROLE_COLOR_MAP[k]; if (base) return base; const pool = ['#60a5fa','#a78bfa','#22c55e','#f59e0b','#ef4444','#10b981','#0ea5e9']; let h = 0; for (let i=0;i<k.length;i++) h = (h*31 + k.charCodeAt(i))>>>0; return pool[h % pool.length] }
const PRODUCT_COLORS = ['#60a5fa','#34d399','#f59e0b','#f472b6','#eab308','#ef4444','#22c55e','#a78bfa','#0ea5e9','#fb7185']
const productColor = (label) => { const s = String(label||''); let h = 0; for (let i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i))>>>0; return PRODUCT_COLORS[h % PRODUCT_COLORS.length] }

function IconBadge({ children, tone = '#1f2937' }) {
  return (
    <span style={{display:'inline-flex', alignItems:'center', justifyContent:'center', width:28, height:28, borderRadius:8, background:'#0b1220', border:`1px solid ${tone}`}}>
      {children}
    </span>
  )
}

function RangeFilter({ fechaInicio, fechaFin, onChangeInicio, onChangeFin, onApply, onPreset, tone = '#3b82f6' }) {
  const fmtDate = (d) => { const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const day = String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}` }
  const now = new Date()
  const presets = {
    hoy: [fmtDate(now), fmtDate(now)],
    '7': [fmtDate(new Date(now.getTime()-7*86400000)), fmtDate(now)],
    '30': [fmtDate(new Date(now.getTime()-30*86400000)), fmtDate(now)],
    mes: [fmtDate(new Date(now.getFullYear(), now.getMonth(), 1)), fmtDate(new Date(now.getFullYear(), now.getMonth()+1, 0))],
    mesprev: [fmtDate(new Date(now.getFullYear(), now.getMonth()-1, 1)), fmtDate(new Date(now.getFullYear(), now.getMonth(), 0))]
  }
  const isActive = (type) => { const [s,e] = presets[type]; return String(fechaInicio)===s && String(fechaFin)===e }
  const selectedPreset = isActive('hoy') ? 'hoy' : (isActive('7') ? '7' : (isActive('30') ? '30' : (isActive('mes') ? 'mes' : (isActive('mesprev') ? 'mesprev' : ''))))
  return (
    <div style={{display:'flex', gap:12, alignItems:'flex-end'}}>
      <div style={{display:'grid', gap:6}}>
        <div style={{fontSize:12, color:'#9ca3af'}}>Desde</div>
        <input type="date" value={fechaInicio} max={fechaFin} onChange={e=> onChangeInicio(e.target.value)} style={{minWidth:160}} />
      </div>
      <div style={{display:'grid', gap:6}}>
        <div style={{fontSize:12, color:'#9ca3af'}}>Hasta</div>
        <input type="date" value={fechaFin} min={fechaInicio} onChange={e=> onChangeFin(e.target.value)} style={{minWidth:160}} />
      </div>
      <button className="btn btn-primary" onClick={onApply}>Aplicar</button>
      <select value={selectedPreset} onChange={(e)=> onPreset(e.target.value)} style={{border:`1px solid ${tone}`, background:'#0b1220', color:'#e5e7eb', borderRadius:10, padding:'6px 10px'}}>
        <option value="">Seleccionar rango</option>
        <option value="hoy">Hoy</option>
        <option value="7">7 días</option>
        <option value="30">30 días</option>
        <option value="mes">Mes actual</option>
        <option value="mesprev">Mes anterior</option>
      </select>
    </div>
  )
}

function BarChart({ data, labelKey = 'label', valueKey = 'value', height = 160 }) {
  const max = Math.max(1, ...data.map(d => Number(d[valueKey] || 0)))
  if (!data || data.length === 0) return <div style={{height, display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af'}}>Sin datos</div>
  return (
    <div style={{display:'flex', alignItems:'flex-end', gap:8, height}}>
      {data.map((d, i) => (
        <div key={i} style={{width:28, background:'#0b1220', border:'1px solid #374151', borderRadius:6, overflow:'hidden'}}>
          <div style={{height: `${(Number(d[valueKey])/max)*100}%`, background:'#3b82f6'}} />
          <div style={{fontSize:10, textAlign:'center', color:'#9ca3af', padding:'2px 0'}}>{String(d[labelKey]).slice(0,4)}</div>
        </div>
      ))}
    </div>
  )
}

function StatesChart({ estados }) {
  const colors = {
    preparando: '#3b82f6',
    en_camino: '#22c55e',
    entregado: '#10b981',
    devuelto: '#8b5cf6'
  }
  const norm = (s) => {
    const k = String(s||'').toLowerCase().trim()
    if (["prep","preparando","procesando","en preparación"].includes(k)) return 'preparando'
    if (["en_camino","en camino","camino","enviado"].includes(k)) return 'en_camino'
    if (["entregado","entrega","finalizado"].includes(k)) return 'entregado'
    if (["devuelto","devolucion","devolución","returned"].includes(k)) return 'devuelto'
    return k || 'desconocido'
  }
  const keys = ['preparando','en_camino','entregado','devuelto']
  const counts = {}
  Object.entries(estados||{}).forEach(([k,v])=>{ const nk = norm(k); counts[nk] = (counts[nk]||0) + Number(v||0) })
  const total = keys.reduce((a,k)=> a + Number(counts[k]||0), 0)
  if (!total) return <div style={{height:120, display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af'}}>Sin datos</div>
  return (
    <div style={{display:'grid', gap:8}}>
      {keys.map(k => {
        const val = Number(counts[k]||0)
        const pct = Math.max(0, Math.round((val/Math.max(1,total))*100))
        return (
          <div key={k} style={{display:'grid', gridTemplateColumns:'1fr 60px', gap:10, alignItems:'center'}}>
            <div style={{background:'#0b1220', border:'1px solid #1f2937', borderRadius:8, overflow:'hidden'}}>
              <div style={{width:`${pct}%`, height:16, background:colors[k]}} />
            </div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <span style={{color:'#e5e7eb', fontSize:12, textTransform:'capitalize'}}>{k.replace('_',' ')}</span>
              <span style={{color:'#9ca3af', fontSize:12}}>{val}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function LineChart({ points, height = 180 }) {
  const width = 360
  const sum = points.reduce((a,p)=> a + Number(p.value||0), 0)
  const max = Math.max(1, ...points.map(p => Number(p.value || 0)))
  const step = points.length ? width / (points.length - 1 || 1) : 0
  const coords = points.map((p, i) => {
    const x = i * step
    const y = height - (Number(p.value)/max) * (height-20) - 10
    return { x, y, v: Number(p.value||0), l: p.label }
  })
  const path = coords.map((c, i) => `${i===0?'M':'L'}${c.x},${c.y}`).join(' ')
  const area = `${path} L${coords.length?coords[coords.length-1].x:0},${height-10} L0,${height-10} Z`
  const gridSteps = 4
  const limited = coords.slice(Math.max(0, coords.length - 10))
  return (
    <svg width={width} height={height} style={{background:'#0b1220', border:'1px solid #1f2937', borderRadius:10}}>
      {[...Array(gridSteps+1)].map((_,i)=>{
        const y = 10 + i*((height-20)/gridSteps)
        const val = Math.round(max - i*(max/gridSteps))
        return (
          <g key={i}>
            <line x1={0} y1={y} x2={width} y2={y} stroke="#1f2937" strokeDasharray="4 4" />
            <text x={4} y={y-2} fill="#6b7280" fontSize={10}>{val.toLocaleString('es-AR')}</text>
          </g>
        )
      })}
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {points.length>0 && sum>0 && <path d={area} fill="url(#areaFill)" />}
      {points.length>0 && sum>0 && <path d={path} stroke="#3b82f6" fill="none" strokeWidth={2} />}
      {limited.map((c, i) => (
        <g key={i}>
          {sum>0 && <circle cx={c.x} cy={c.y} r={3} fill="#3b82f6" />}
          {sum>0 && <text x={c.x} y={c.y-10} fill="#9ca3af" fontSize={11} textAnchor="middle">{c.v.toLocaleString('es-AR')}</text>}
          <text x={c.x} y={height-4} fill="#9ca3af" fontSize={9} textAnchor="middle">{String(c.l||'').slice(5)}</text>
        </g>
      ))}
    </svg>
  )
}

//

function PieChart({ items, valueKey = 'value', size = 160, title = 'Ventas' }) {
  const total = items.reduce((a,b)=> a + Number(b[valueKey] || 0), 0)
  if (!items || items.length === 0 || !total) return <div style={{height:size, display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af'}}>Sin datos</div>
  const colors = PIE_COLORS
  const cx = size/2, cy = size/2
  const r = size/2 - 16
  const t = 18
  const circ = 2 * Math.PI * r
  let offset = 0
  const arcs = items.map((it, idx) => {
    const val = Number(it[valueKey] || 0)
    const frac = val / total
    const dash = frac * circ
    const el = (
      <circle key={idx}
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={colors[idx % colors.length]}
        strokeWidth={t}
        strokeDasharray={`${dash} ${circ-dash}`}
        strokeDashoffset={-offset}
        style={{transition:'stroke-dasharray .3s ease'}}
      />
    )
    offset += dash
    return el
  })
  return (
    <svg width={size} height={size} style={{background:'#0b1220', border:'1px solid #1f2937', borderRadius:10}}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#111827" strokeWidth={t} />
      {arcs}
      <text x={cx} y={cy-4} fill="#e5e7eb" fontSize={12} textAnchor="middle">{title}</text>
      <text x={cx} y={cy+14} fill="#3b82f6" fontSize={14} fontWeight={600} textAnchor="middle">{Number(total).toLocaleString('es-AR')}</text>
    </svg>
  )
}

export default function InformesPage() {
  const [tab, setTab] = useState('ventas')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ventas, setVentas] = useState({ ingresosDia: [], totalVentas: 0, montoTotal: 0, porMetodo: {} })
  const [envios, setEnvios] = useState({ estados: {}, promedioDias: 0, en_curso: 0, entregados: 0, demorados: 0 })
  const [usuarios, setUsuarios] = useState({ roles: {}, activos: 0, inactivos: 0, nuevosMes: 0, carritosAbandonados: 0 })
  const [productos, setProductos] = useState({ top10: [], bajos: [], rotacion: [] })
  const [reseñas, setReseñas] = useState({ global: 0, califPorProducto: [], positivas: 0, negativas: 0, reseñasPorMes: [], soporte: {} })
  const timer = useRef(null)

  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date(); const prev = new Date(d.getTime() - 30*86400000)
    return prev.toISOString().slice(0,10)
  })
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().slice(0,10))

  const fmtDate = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth()+1).padStart(2,'0')
    const day = String(d.getDate()).padStart(2,'0')
    return `${y}-${m}-${day}`
  }
  const presetRange = (type) => {
    const now = new Date()
    let s = fmtDate(now), e = fmtDate(now)
    if (type === '7') { const st = new Date(now.getTime() - 7*86400000); s = fmtDate(st) }
    else if (type === '30') { const st = new Date(now.getTime() - 30*86400000); s = fmtDate(st) }
    else if (type === 'mes') { const st = new Date(now.getFullYear(), now.getMonth(), 1); const en = new Date(now.getFullYear(), now.getMonth()+1, 0); s = fmtDate(st); e = fmtDate(en) }
    else if (type === 'mesprev') { const y = now.getFullYear(); const m = now.getMonth()-1; const st = new Date(y, m, 1); const en = new Date(y, m+1, 0); s = fmtDate(st); e = fmtDate(en) }
    setFechaInicio(s); setFechaFin(e); cargar()
  }

  const cargar = async () => {
    setLoading(true); setError('')
    try {
      const v = await informeService.ventas({ fecha_inicio: fechaInicio, fecha_fin: fechaFin }).catch(()=>null)
      const base = v?.ok ? (v.data || {}) : {}
      let porMetodo = base.porMetodo || {}
      let montoTotal = Number(base.montoTotal || 0)
      let ingresosDia = Array.isArray(base.ingresosDia) ? base.ingresosDia : []
      const startTs = new Date(fechaInicio).getTime()
      const endTs = new Date(fechaFin).getTime()
      const mergeCounts = (a={}, b={}) => {
        const out = { ...a }
        for (const [k, v] of Object.entries(b || {})) out[k] = (out[k] || 0) + Number(v || 0)
        return out
      }
      try {
        const pagos = await pagosService.adminList({ page:1, limit:500 })
        const arr = Array.isArray(pagos?.data) ? pagos.data : (Array.isArray(pagos) ? pagos : [])
        const map = {}
        arr.forEach(p => {
          const rawDate = p.fecha_pago ?? p.created_at ?? p.fecha ?? p.fecha_transaccion ?? null
          const dt = rawDate ? new Date(typeof rawDate === 'string' ? rawDate.slice(0,10) : rawDate).getTime() : null
          if (dt && (isNaN(dt) || dt < startTs || dt > endTs)) return
          const m = (p.metodo_pago ?? p.metodo ?? p.payment_method ?? p.medio_pago ?? p.forma_pago ?? p.tipo ?? p.tipo_pago ?? '').toString().trim().toLowerCase()
          if (!m) return
          map[m] = (map[m] || 0) + 1
        })
        porMetodo = Object.keys(map).length ? mergeCounts(porMetodo, map) : porMetodo
      } catch {}
      if (!porMetodo || Object.keys(porMetodo).length === 0) {
        try {
          const token = sessionStorage.getItem('token')
          const hdr = token ? { Authorization: `Bearer ${token}`, Accept:'application/json' } : { Accept:'application/json' }
          const r = await fetch(`${LOCAL_BACKEND}/pedidos`, { headers: hdr })
          const j = await r.json().catch(()=>({}))
          const arr = Array.isArray(j?.data) ? j.data : (Array.isArray(j) ? j : [])
          const map = {}
          arr.forEach(p => {
            const rawDate = p.fecha_pedido ?? p.created_at ?? p.fecha_creacion ?? p.fecha ?? null
            const dt = rawDate ? new Date(typeof rawDate === 'string' ? rawDate.slice(0,10) : rawDate).getTime() : null
            if (dt && (isNaN(dt) || dt < startTs || dt > endTs)) return
            const m = (p.metodo_pago ?? p.payment_method ?? p.metodo ?? p.pago?.metodo ?? p.pago?.tipo ?? p.medio_pago ?? p.forma_pago ?? '').toString().trim().toLowerCase()
            if (!m) return
            map[m] = (map[m] || 0) + 1
          })
          porMetodo = map
        } catch {}
      }
      try {
        const token = sessionStorage.getItem('token')
        const hdr = token ? { Authorization: `Bearer ${token}`, Accept:'application/json' } : { Accept:'application/json' }
        const r = await fetch(`${LOCAL_BACKEND}/pedidos`, { headers: hdr })
        const j = await r.json().catch(()=>({}))
        const arr = Array.isArray(j?.data) ? j.data : (Array.isArray(j) ? j : [])
        const start = startTs
        const end = endTs
        const inRange = arr.filter(p => {
          const raw = p.fecha_pedido ?? p.created_at ?? p.fecha_creacion ?? p.fecha ?? Date.now()
          const d = typeof raw === 'string' ? new Date(raw.slice(0,10)).getTime() : new Date(raw).getTime()
          return (!isNaN(d) && d >= start && d <= end)
        })
        const m = {}; const pm = {}
        inRange.forEach(p => {
          const raw = p.fecha_pedido ?? p.created_at ?? p.fecha_creacion ?? p.fecha ?? Date.now()
          const dkey = typeof raw === 'string' ? raw.slice(0,10) : new Date(raw).toISOString().slice(0,10)
          const val = Number(p.total_final ?? p.monto_total ?? p.total ?? p.subtotal ?? 0)
          m[dkey] = (m[dkey] || 0) + (Number.isFinite(val) ? val : 0)
          const met = (p.metodo_pago ?? p.payment_method ?? p.metodo ?? p.pago?.metodo ?? p.pago?.tipo ?? p.medio_pago ?? p.forma_pago ?? '').toString().trim().toLowerCase()
          if (met) pm[met] = (pm[met] || 0) + 1
        })
        ingresosDia = Object.entries(m).sort((a,b)=> a[0].localeCompare(b[0])).map(([date, value])=> ({ date, value }))
        porMetodo = mergeCounts(porMetodo, pm)
        if (!montoTotal || montoTotal === 0) montoTotal = inRange.reduce((a,b)=> a + Number(b.total_final ?? b.monto_total ?? b.total ?? b.subtotal ?? 0), 0)
        const totalVentas = Number.isFinite(base.totalVentas) && base.totalVentas>0 ? base.totalVentas : inRange.length
        setVentas({ ingresosDia, totalVentas, montoTotal, porMetodo })
      } catch {
        const serie = Array.isArray(base.ingresosDia) ? base.ingresosDia : []
        if (!montoTotal || montoTotal === 0) montoTotal = serie.reduce((a,b)=> a + Number(b.value||0), 0)
        const totalVentas = Number.isFinite(base?.totalVentas) ? base.totalVentas : 0
        setVentas({ ingresosDia: serie, totalVentas, montoTotal, porMetodo })
      }
      const [e, u, p, r] = await Promise.all([
        informeService.envios({ fecha_inicio: fechaInicio, fecha_fin: fechaFin }).catch(()=>null),
        informeService.usuarios({ fecha_inicio: fechaInicio, fecha_fin: fechaFin }).catch(()=>null),
        informeService.productos({ fecha_inicio: fechaInicio, fecha_fin: fechaFin }).catch(()=>null),
        informeService.resenasSoporte({ fecha_inicio: fechaInicio, fecha_fin: fechaFin }).catch(()=>null),
      ])
      if (e?.ok) setEnvios(e.data || {})
      {
        let udata = u?.ok ? (u.data || {}) : {}
        const rolesEmpty = !udata.roles || Object.keys(udata.roles).length===0 || Object.values(udata.roles||{}).reduce((a,b)=> a + Number(b||0), 0)===0
        const totalsZero = (!Number.isFinite(Number(udata.activos)) ? 0 : Number(udata.activos)) + (!Number.isFinite(Number(udata.inactivos)) ? 0 : Number(udata.inactivos))
        const needFallback = rolesEmpty || totalsZero===0
        if (needFallback) {
          try {
            const token = sessionStorage.getItem('token')
            const hdr = token ? { Authorization: `Bearer ${token}`, Accept:'application/json' } : { Accept:'application/json' }
            let arr = []
            try {
              const r1 = await fetch(`${API_BASE}/admin/users/list?page=1&limit=500`, { headers: hdr })
              const j1 = await r1.json().catch(()=>({}))
              arr = Array.isArray(j1?.data) ? j1.data : (Array.isArray(j1?.users) ? j1.users : (Array.isArray(j1) ? j1 : []))
            } catch {}
            if (!Array.isArray(arr) || arr.length===0) {
              try {
                const r2 = await fetch(`${API_BASE}/users`, { headers: hdr })
                const j2 = await r2.json().catch(()=>({}))
                arr = Array.isArray(j2?.data) ? j2.data : (Array.isArray(j2) ? j2 : [])
              } catch {}
            }
            if (!Array.isArray(arr) || arr.length===0) {
              try {
                const r3 = await fetch(`${LOCAL_BACKEND}/admin/users/list?page=1&limit=500`, { headers: hdr })
                const j3 = await r3.json().catch(()=>({}))
                arr = Array.isArray(j3?.data) ? j3.data : (Array.isArray(j3?.users) ? j3.users : (Array.isArray(j3) ? j3 : []))
              } catch {}
            }
            if (!Array.isArray(arr) || arr.length===0) {
              try {
                const r4 = await fetch(`${LOCAL_BACKEND}/users`, { headers: hdr })
                const j4 = await r4.json().catch(()=>({}))
                arr = Array.isArray(j4?.data) ? j4.data : (Array.isArray(j4) ? j4 : [])
              } catch {}
            }
            const parseTs = (raw) => {
              if (!raw) return null
              if (raw instanceof Date) return raw.getTime()
              if (typeof raw === 'number') return Number(raw)
              const s = String(raw)
              const mIso = s.match(/^(\d{4})[-\/](\d{2})[-\/](\d{2})/)
              if (mIso) { const y = Number(mIso[1]), m = Number(mIso[2]), d = Number(mIso[3]); const dt = new Date(y, m-1, d); return isNaN(dt.getTime())? null : dt.getTime() }
              const mDMY = s.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})/)
              if (mDMY) { const d = Number(mDMY[1]), m = Number(mDMY[2]), y = Number(mDMY[3]); const dt = new Date(y, m-1, d); return isNaN(dt.getTime())? null : dt.getTime() }
              const mYMD = s.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})/)
              if (mYMD) { const y = Number(mYMD[1]), m = Number(mYMD[2]), d = Number(mYMD[3]); const dt = new Date(y, m-1, d); return isNaN(dt.getTime())? null : dt.getTime() }
              const dt = new Date(s)
              return isNaN(dt.getTime()) ? null : dt.getTime()
            }
            const endSel = new Date(String(fechaFin||'').slice(0,10))
            const monthStart = new Date(endSel.getFullYear(), endSel.getMonth(), 1).getTime()
            const monthEnd = new Date(endSel.getFullYear(), endSel.getMonth()+1, 0).getTime()
            const startTsU = new Date(String(fechaInicio||'').slice(0,10)).getTime()
            const endTsU = new Date(String(fechaFin||'').slice(0,10)).getTime()
            const roles = {}
            let activos = 0
            let inactivos = 0
            let nuevosMes = 0
            let nuevosRango = 0
            ;(arr||[]).forEach(uo => {
              const rolRaw = String(uo.rol ?? uo.role ?? '').toLowerCase()
              const rol = rolRaw === 'user' || rolRaw === 'customer' ? 'cliente' : (rolRaw || 'desconocido')
              roles[rol] = (roles[rol] || 0) + 1
              const estRaw = String(uo.estado ?? uo.status ?? '').toLowerCase()
              const actFlag = (uo.activo === true || String(uo.activo).toLowerCase()==='true' || String(uo.activo).toLowerCase()==='1' || estRaw==='activo' || estRaw==='active' || estRaw==='')
              if (actFlag) activos++; else inactivos++
              const rawDate = uo.created_at ?? uo.fecha_creacion ?? uo.createdAt ?? uo.fecha_registro ?? uo.registrado_en ?? uo.creado_el ?? uo.created ?? null
              const t = parseTs(rawDate)
              if (Number.isFinite(t)) {
                if (t >= monthStart && t <= monthEnd) nuevosMes++
                if (t >= startTsU && t <= endTsU) nuevosRango++
              }
            })
            let carritosAbandonados = 0
            try {
              const rstats = await fetch(`${API_BASE}/carrito/admin/estadisticas`, { headers: hdr })
              const jstats = await rstats.json().catch(()=>({}))
              const d = jstats?.data ?? jstats ?? {}
              const val = d?.abandonados ?? d?.carritos_abandonados ?? d?.totalAbandonados ?? (Array.isArray(d) ? d.length : 0)
              if (Number.isFinite(Number(val))) carritosAbandonados = Number(val)
              if (!carritosAbandonados || carritosAbandonados===0) {
                const rab = await fetch(`${API_BASE}/carrito/admin/abandonados?dias=30`, { headers: hdr })
                const jab = await rab.json().catch(()=>({}))
                const arrAb = Array.isArray(jab?.data) ? jab.data : (Array.isArray(jab) ? jab : [])
                carritosAbandonados = Array.isArray(arrAb) ? arrAb.length : 0
              }
              if (!carritosAbandonados || carritosAbandonados===0) {
                const rloc = await fetch(`${LOCAL_BACKEND}/carrito/admin/abandonados?dias=30`, { headers: hdr })
                const jloc = await rloc.json().catch(()=>({}))
                const arrAb2 = Array.isArray(jloc?.data) ? jloc.data : (Array.isArray(jloc) ? jloc : [])
                if (Array.isArray(arrAb2)) carritosAbandonados = arrAb2.length
              }
            } catch {}
            udata = { roles, activos, inactivos, nuevosMes, nuevosRango, carritosAbandonados }
          } catch {}
        }
        setUsuarios(udata)
      }
      if (p?.ok) {
        let pdata = p.data || {}
        const needProdFallback = !Array.isArray(pdata.top10) || pdata.top10.length===0 || (pdata.top10||[]).every(x => Number(x.rotacion||x.unidades||0)===0)
        if (needProdFallback) {
          try {
            const token = sessionStorage.getItem('token')
            const hdr = token ? { Authorization: `Bearer ${token}`, Accept:'application/json' } : { Accept:'application/json' }
            const rlist = await fetch(`${LOCAL_BACKEND}/pedidos`, { headers: hdr })
            const jlist = await rlist.json().catch(()=>({}))
            const arr = Array.isArray(jlist?.data) ? jlist.data : (Array.isArray(jlist) ? jlist : [])
            const start = new Date(String(fechaInicio||'').slice(0,10)).getTime()
            const end = new Date(String(fechaFin||'').slice(0,10)).getTime()
            const inRange = arr.filter(p => {
              const raw = p.fecha_pedido ?? p.created_at ?? p.fecha_creacion ?? p.fecha ?? Date.now()
              const d = typeof raw === 'string' ? new Date(raw.slice(0,10)).getTime() : new Date(raw).getTime()
              return (!isNaN(d) && d >= start && d <= end)
            })
            const agg = {}
            inRange.forEach(p => {
              const dets = Array.isArray(p.detalles) ? p.detalles : (Array.isArray(p.items) ? p.items : (Array.isArray(p.productos) ? p.productos : []))
              dets.forEach(it => {
                const nombre = it.nombre_producto ?? it.producto ?? it.nombre ?? (`Prod #${it.id_producto ?? it.producto_id ?? ''}`)
                const cant = Number(it.cantidad ?? it.qty ?? it.cant ?? 1)
                if (!agg[nombre]) agg[nombre] = 0
                agg[nombre] += Number.isFinite(cant) ? cant : 0
              })
            })
            const top10 = Object.entries(agg).map(([nombre, unidades])=> ({ nombre, unidades }))
              .sort((a,b)=> b.unidades - a.unidades)
              .slice(0,10)
            pdata = { ...pdata, top10 }
          } catch {}
        }
        setProductos(pdata)
      }
      if (r?.ok) setReseñas(r.data || {})
      {
        let rdata = r?.ok ? (r.data || {}) : {}
        const isZero = (!Number.isFinite(Number(rdata.global)) || Number(rdata.global)===0) && (!Number(rdata.positivas) && !Number(rdata.negativas))
        if (isZero) {
          try {
            let arr = []
            try { arr = await resenasService.listarAdmin() } catch {
              try {
                const token = sessionStorage.getItem('token')
                const hdr = token ? { Authorization: `Bearer ${token}`, Accept:'application/json' } : { Accept:'application/json' }
                const rlist = await fetch(`${API_BASE}/resenas`, { headers: hdr })
                const jlist = await rlist.json().catch(()=>({}))
                arr = Array.isArray(jlist?.data) ? jlist.data : (Array.isArray(jlist) ? jlist : [])
              } catch {}
            }
            const start = new Date(String(fechaInicio||'').slice(0,10)).getTime()
            const end = new Date(String(fechaFin||'').slice(0,10)).getTime()
            const ts = (raw) => { if (!raw) return NaN; const s = String(raw).slice(0,10); const t = new Date(s).getTime(); return t }
            const inRange = (arr||[]).filter(rw => { const t = ts(rw.created_at ?? rw.fecharesena ?? rw.fecha ?? rw.updated_at); return Number.isFinite(t) && t>=start && t<=end })
            const ratings = inRange.map(rw => Number(rw.calificacion ?? rw.calificacion_resena ?? rw.rating ?? rw.score ?? 0)).filter(n => Number.isFinite(n) && n>0)
            const global = ratings.length ? (ratings.reduce((a,b)=> a + b, 0) / ratings.length) : 0
            let positivas = 0; let negativas = 0
            ratings.forEach(n => { if (n>=4) positivas++; else if (n<=2) negativas++ })
            rdata = { ...rdata, global, positivas, negativas }
          } catch {}
        }
        setReseñas(rdata)
      }
    } catch (err) { setError(err.message || 'Error al cargar informes') } finally { setLoading(false) }
  }

  useEffect(() => { cargar(); timer.current = setInterval(cargar, 15000); return () => { if (timer.current) clearInterval(timer.current) } }, [fechaInicio, fechaFin])

  const metodoData = useMemo(() => {
    const canon = (s) => {
      const k = String(s||'').toLowerCase().trim()
      if (!k) return ''
      if (['mp','mercado pago','mercadopago','mercado_pago','mercado'].includes(k)) return 'mercado pago'
      if (['tarjeta','credit','credito','debito','visa','mastercard','card','card_payment','cardpayment'].includes(k)) return 'tarjeta'
      if (['transferencia','bank','banco','depósito','deposito','transfer','wire'].includes(k)) return 'transferencia'
      if (['efectivo','cash'].includes(k)) return 'efectivo'
      if (['paypal'].includes(k)) return 'paypal'
      return k
    }
    const map = {}
    for (const [label, value] of Object.entries(ventas.porMetodo||{})) {
      const c = canon(label)
      if (!c) continue
      map[c] = (map[c] || 0) + Number(value||0)
    }
    return Object.entries(map)
      .map(([label, value])=>({ label, value: Number(value||0) }))
      .sort((a,b)=> b.value - a.value)
  }, [ventas])
  const estadosEnvio = useMemo(() => Object.entries(envios.estados||{}).map(([label, value])=>({ label, value })), [envios])
  const rolesDist = useMemo(() => Object.entries(usuarios.roles||{}).map(([label, value])=>({ label, value })), [usuarios])
  const fmt = (n) => Number(n||0).toLocaleString('es-AR')
  const money = (n) => `$${Number(n||0).toLocaleString('es-AR', { minimumFractionDigits:2, maximumFractionDigits:2 })}`
  const generarPDF = async () => {
    const doc = new jsPDF()
    const start = String(fechaInicio||'').slice(0,10)
    const end = String(fechaFin||'').slice(0,10)
    const startTime = new Date(start).getTime()
    const endTime = new Date(end).getTime()
    const rangeLabel = `${start} a ${end}`
    let ingresosRango = []; let totalVentasRango = 0; let montoTotalRango = 0; let porMetodoRango = {}
    let topProductos = []
    const mergeCounts = (a={}, b={}) => {
      const out = { ...a }
      for (const [k, v] of Object.entries(b || {})) out[k] = (out[k] || 0) + Number(v || 0)
      return out
    }
    try {
      const token = sessionStorage.getItem('token')
      const hdr = token ? { Authorization: `Bearer ${token}`, Accept:'application/json' } : { Accept:'application/json' }
      const r = await fetch(`${LOCAL_BACKEND}/pedidos`, { headers: hdr })
      const j = await r.json().catch(()=>({}))
      const arr = Array.isArray(j?.data) ? j.data : (Array.isArray(j) ? j : [])
      const inRange = arr.filter(p => {
        const raw = p.fecha_pedido ?? p.created_at ?? p.fecha_creacion ?? p.fecha ?? Date.now()
        const d = typeof raw === 'string' ? new Date(raw.slice(0,10)).getTime() : new Date(raw).getTime()
        return (!isNaN(d) && d >= startTime && d <= endTime)
      })
      const mmap = {}; const pm = {}
      inRange.forEach(p => {
        const raw = p.fecha_pedido ?? p.created_at ?? p.fecha_creacion ?? p.fecha ?? Date.now()
        const key = typeof raw === 'string' ? raw.slice(0,10) : new Date(raw).toISOString().slice(0,10)
        const val = Number(p.total_final ?? p.monto_total ?? p.total ?? p.subtotal ?? 0)
        mmap[key] = (mmap[key] || 0) + (Number.isFinite(val) ? val : 0)
        const met = (p.metodo_pago ?? p.payment_method ?? p.metodo ?? p.pago?.metodo ?? p.pago?.tipo ?? p.medio_pago ?? p.forma_pago ?? '').toString().trim().toLowerCase()
        if (met) pm[met] = (pm[met] || 0) + 1
      })
      ingresosRango = Object.entries(mmap).sort((a,b)=> a[0].localeCompare(b[0])).map(([date, value])=> ({ date, value }))
      montoTotalRango = inRange.reduce((a,b)=> a + Number(b.total_final ?? b.monto_total ?? b.total ?? b.subtotal ?? 0), 0)
      totalVentasRango = inRange.length
      porMetodoRango = pm
      try {
        const pagos = await pagosService.adminList({ page:1, limit:500 })
        const arr2 = Array.isArray(pagos?.data) ? pagos.data : (Array.isArray(pagos) ? pagos : [])
        const pm2 = {}
        arr2.forEach(p => {
          const rawDate = p.fecha_pago ?? p.created_at ?? p.fecha ?? p.fecha_transaccion ?? null
          const dt = rawDate ? new Date(typeof rawDate === 'string' ? rawDate.slice(0,10) : rawDate).getTime() : null
          if (dt && (isNaN(dt) || dt < startTime || dt > endTime)) return
          const mth = (p.metodo_pago ?? p.metodo ?? p.payment_method ?? p.medio_pago ?? p.forma_pago ?? p.tipo ?? p.tipo_pago ?? '').toString().trim().toLowerCase()
          if (!mth) return
          pm2[mth] = (pm2[mth] || 0) + 1
        })
        porMetodoRango = mergeCounts(porMetodoRango, pm2)
      } catch {}
      if (!porMetodoRango || Object.keys(porMetodoRango).length === 0) porMetodoRango = ventas.porMetodo || {}
      const ids = inRange.map(p => p.id_pedido ?? p.id).filter(id => Number.isFinite(Number(id)))
      const detailResults = await Promise.allSettled(ids.slice(0,50).map(id => pedidosService.obtener(id)))
      const agg = {}
      const extractArrays = (obj) => {
        const arrays = []
        if (!obj || typeof obj !== 'object') return arrays
        const candidates = [
          obj.items, obj.productos, obj.detalle, obj.detalles,
          obj.lineas, obj.pedido_items, obj.product_items, obj.cart_items
        ].filter(Array.isArray)
        arrays.push(...candidates)
        // búsqueda genérica: cualquier propiedad arreglo con elementos con nombre/cantidad/precio
        for (const [k, v] of Object.entries(obj)) {
          if (Array.isArray(v) && v.length && typeof v[0] === 'object') {
            const keys = Object.keys(v[0] || {})
            const ok = keys.some(kk => ['nombre','producto','nombre_producto','cantidad','qty','precio','precio_unitario','total'].includes(kk))
            if (ok) arrays.push(v)
          }
        }
        return arrays
      }
      detailResults.forEach(dr => {
        if (dr.status !== 'fulfilled') return
        const root = dr.value?.data ?? dr.value
        const src = root?.pedido ?? root?.order ?? root
        const arrays = extractArrays(src)
        arrays.forEach(itemsRaw => {
          itemsRaw.forEach(it => {
            const nombre = it.nombre_producto || it.producto?.nombre || it.producto || it.nombre || it.titulo || '-'
            const cantidad = Number(it.cantidad ?? it.qty ?? it.cant ?? it.unidades ?? it.cantidad_vendida ?? 1)
            const precio = Number(it.precio_unitario ?? it.precio ?? it.precio_final ?? it.monto_unitario ?? it.monto ?? 0)
            const total = Number(it.total ?? it.monto_total ?? (cantidad * precio))
            if (!agg[nombre]) agg[nombre] = { unidades: 0, monto: 0 }
            agg[nombre].unidades += Number.isFinite(cantidad) ? cantidad : 0
            agg[nombre].monto += Number.isFinite(total) ? total : 0
          })
        })
      })
      try {
        const token = sessionStorage.getItem('token')
        const hdr2 = token ? { Authorization: `Bearer ${token}`, Accept:'application/json' } : { Accept:'application/json' }
        const rlist = await fetch(`${API_BASE}/pedidos`, { headers: hdr2 })
        const jl = await rlist.json().catch(()=>({}))
        const arrL = Array.isArray(jl?.data) ? jl.data : (Array.isArray(jl) ? jl : [])
        const inRangeL = arrL.filter(p => {
          const raw = p.fecha_pedido ?? p.created_at ?? p.fecha_creacion ?? p.fecha ?? Date.now()
          const d = typeof raw === 'string' ? new Date(raw.slice(0,10)).getTime() : new Date(raw).getTime()
          return (!isNaN(d) && d >= startTime && d <= endTime)
        })
        inRangeL.forEach(p => {
          const dets = Array.isArray(p.detalles) ? p.detalles : []
          dets.forEach(it => {
            const nombre = it.nombre_producto ?? it.producto ?? '-'
            const cant = Number(it.cantidad ?? 0)
            const pu = Number(it.precio_unitario ?? 0)
            const iva = Number(it.iva_monto ?? 0)
            const total = Number.isFinite(cant*pu + iva) ? cant*pu + iva : cant*pu
            if (!agg[nombre]) agg[nombre] = { unidades: 0, monto: 0 }
            agg[nombre].unidades += Number.isFinite(cant) ? cant : 0
            agg[nombre].monto += Number.isFinite(total) ? total : 0
          })
        })
      } catch {}
      topProductos = Object.entries(agg).map(([nombre, v])=> ({ nombre, unidades: v.unidades, monto: v.monto }))
      topProductos.sort((a,b)=> b.monto - a.monto)
    } catch {}
    doc.setFillColor(59,130,246)
    doc.rect(0, 0, 210, 28, 'F')
    doc.setTextColor(255,255,255)
    doc.setFontSize(12)
    doc.text('Feraytek Admin', 14, 12)
    doc.setFontSize(18)
    const monthNames = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
    const [sY,sM,sD] = String(start).split('-').map(n=> Number(n))
    const [eY,eM,eD] = String(end).split('-').map(n=> Number(n))
    const sd = new Date(sY, (sM||1)-1, sD||1)
    const ed = new Date(eY, (eM||1)-1, eD||1)
    const sm = monthNames[sd.getMonth()] || ''
    const sy = sd.getFullYear()
    const em = monthNames[ed.getMonth()] || ''
    const ey = ed.getFullYear()
    const sameMonth = sd.getMonth() === ed.getMonth() && sy === ey
    const title = sameMonth ? `Informe de Ventas de ${sm} ${sy}` : `Informe de Ventas (${sm} ${sy} – ${em} ${ey})`
    doc.text(title, 14, 18)
    doc.setTextColor(0,0,0)
    doc.setFontSize(11)
    doc.text(`Rango: ${rangeLabel}`, 14, 36)
    doc.setFillColor(247,250,252)
    doc.setDrawColor(148,163,184)
    doc.roundedRect(12, 42, 186, 26, 3, 3, 'FD')
    doc.setFontSize(12)
    doc.setTextColor(17,24,39)
    doc.text(`Monto Total: ${money(montoTotalRango)}`, 18, 58)
    doc.text(`Total Ventas: ${fmt(totalVentasRango)}`, 128, 58, { align:'right' })
    autoTable(doc, {
      columns: [
        { header: 'Método', dataKey: 'metodo' },
        { header: 'Cantidad', dataKey: 'cantidad' }
      ],
      body: Object.entries(porMetodoRango||{})
        .sort((a,b)=> Number(b[1]) - Number(a[1]))
        .map(([k,v])=> ({ metodo: String(k).replace('_',' '), cantidad: fmt(v) })),
      startY: 74,
      styles: { fontSize:11 },
      headStyles: { fillColor:[14,165,233], textColor:255 },
      columnStyles: { metodo: { halign:'left' }, cantidad: { halign:'right' } },
      margin: { left:12, right:12 },
      didParseCell: (data) => {
        if (data.cell.section === 'head') {
          if (data.column.dataKey === 'cantidad') data.cell.styles.halign = 'right'
          if (data.column.dataKey === 'metodo') data.cell.styles.halign = 'left'
        }
      }
    })
    autoTable(doc, {
      columns: [
        { header: 'Fecha', dataKey: 'fecha' },
        { header: 'Ingresos', dataKey: 'ingresos' }
      ],
      body: ingresosRango.map(d=> ({ fecha: String(d.date||'').slice(0,10), ingresos: money(d.value||0) })),
      styles: { fontSize:11 },
      headStyles: { fillColor:[59,130,246], textColor:255 },
      columnStyles: { fecha: { halign:'left' }, ingresos: { halign:'right' } },
      margin: { left:12, right:12 },
      didParseCell: (data) => {
        if (data.cell.section === 'head') {
          if (data.column.dataKey === 'ingresos') data.cell.styles.halign = 'right'
          if (data.column.dataKey === 'fecha') data.cell.styles.halign = 'left'
        }
      },
      foot: [["Total", money(montoTotalRango)]],
      footStyles: { fillColor:[59,130,246], textColor:255 }
    })
    if (!topProductos.length) {
      try {
        const lista = await productosService.listar({ estado: 'todos' })
        const agg = []
        for (const p of (Array.isArray(lista) ? lista : [])) {
          const unidades = Number(p.ventas ?? p.vendidos ?? p.total_vendidos ?? p.cantidad_vendida ?? 0)
          const precio = Number(p.precio_base ?? p.precio ?? p.precio_final ?? p.precio_publico ?? 0)
          const monto = Number.isFinite(unidades*precio) ? unidades*precio : 0
          agg.push({ nombre: p.nombre ?? '-', unidades, monto })
        }
        agg.sort((a,b)=> b.monto - a.monto)
        topProductos = agg.slice(0,10)
      } catch {}
    }
    const tops = (topProductos.length ? topProductos : (productos.top10||[]).slice(0,10).map(t=>({ nombre: t.nombre, unidades: Number(t.ventas ?? 0), monto: 0 })) )
    autoTable(doc, {
      head: [["Producto", "Unidades", "Monto"]],
      body: tops.map(t=> [t.nombre, fmt(t.unidades||0), money(t.monto||0)]),
      styles: { fontSize:11 },
      headStyles: { fillColor:[245,158,11], textColor:255 },
      columnStyles: { 0: { halign:'left' }, 1: { halign:'right' }, 2: { halign:'right' } },
      margin: { left:12, right:12 },
      didParseCell: (data) => {
        if (data.cell.section === 'head') {
          if (data.column.index === 1 || data.column.index === 2) data.cell.styles.halign = 'right'
        }
      }
    })
    const estadosRows = Object.entries(envios.estados||{}).map(([k,v])=>[k, fmt(v)])
    const lastY = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY : 74
    doc.setFontSize(12)
    doc.text('Estados de envíos ', 14, lastY + 8)
    autoTable(doc, {
      head: [["Estado", "Cantidad"]],
      body: estadosRows,
      startY: lastY + 12,
      styles: { fontSize:11 },
      headStyles: { fillColor:[34,197,94], textColor:255 },
      columnStyles: { 0: { halign:'left' }, 1: { halign:'right' } },
      margin: { left:12, right:12 },
      didParseCell: (data) => {
        if (data.cell.section === 'head' && data.column.index === 1) {
          data.cell.styles.halign = 'right'
        }
      }
    })
    
    const pageCount = doc.getNumberOfPages()
    for (let i=1; i<=pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(10)
      doc.text(`Página ${i} de ${pageCount}`, 198, 290, { align:'right' })
    }
    doc.save(`informe_mensual_${start}_${end}.pdf`)
  }

  const resumenDia = useMemo(() => {
    const endStr = String(fechaFin||'').slice(0,10)
    const startStr = String(fechaInicio||'').slice(0,10)
    const arr = (ventas.ingresosDia||[]).map(d=>({ v: Number(d.value||0), d: String(d.date||d.label||'').slice(0,10) }))
    const inRange = arr.filter(p => p.d >= startStr && p.d <= endStr).sort((a,b)=> a.d.localeCompare(b.d))
    const exact = inRange.find(p => p.d === endStr) || arr.find(p => p.d === endStr)
    const sel = exact || (inRange.length ? inRange[inRange.length-1] : (arr.length ? arr[arr.length-1] : { v: 0, d: endStr }))
    return sel
  }, [ventas.ingresosDia, fechaInicio, fechaFin])

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 style={{display:'flex', alignItems:'center', gap:10, color:'#3b82f6'}}><IconBadge tone="#3b82f6"><BarChart3 size={16} color="#3b82f6"/></IconBadge> Informes</h2>
        <div style={{display:'flex', gap:8}}>
          <button className="btn btn-primary" onClick={cargar}><RefreshCcw size={16}/> Actualizar</button>
        </div>
      </div>

      <div className="tabs">
        {[
          {k:'ventas', icon:<IconBadge tone="#3b82f6"><TrendingUp size={14} color="#3b82f6"/></IconBadge>, label:'ventas'},
          {k:'envios', icon:<IconBadge tone="#22c55e"><Truck size={14} color="#22c55e"/></IconBadge>, label:'envios'},
          {k:'usuarios', icon:<IconBadge tone="#a78bfa"><Users size={14} color="#a78bfa"/></IconBadge>, label:'usuarios'},
          {k:'productos', icon:<IconBadge tone="#f59e0b"><Package size={14} color="#f59e0b"/></IconBadge>, label:'productos'},
          {k:'resenas', icon:<IconBadge tone="#0ea5e9"><Star size={14} color="#0ea5e9"/></IconBadge>, label:'resenas'},
      ].map(t => (
        <button key={t.k} className={`tab ${tab===t.k?'active':''}`} onClick={()=> setTab(t.k)}>{t.icon} {t.label}</button>
      ))}
      </div>

      {error && <div className="error-box" style={{marginTop:8}}>{error}</div>}
      {loading && <div>Cargando...</div>}

      {tab==='ventas' && (
        <div className="grid2" style={{marginTop:12}}>
          <div className="card">
            <h3 style={{display:'flex', alignItems:'center', gap:10}}><IconBadge tone="#3b82f6"><CalendarRange size={16} color="#3b82f6"/></IconBadge> Rango de fechas</h3>
            <RangeFilter fechaInicio={fechaInicio} fechaFin={fechaFin} onChangeInicio={v=> setFechaInicio(v)} onChangeFin={v=> setFechaFin(v)} onApply={cargar} onPreset={(t)=> presetRange(t)} tone="#3b82f6" />
            <div style={{marginTop:8}}><button className="btn" onClick={generarPDF}><FileDown size={16}/> Generar Informe PDF</button></div>
          </div>
          <div className="card">
            <h3 style={{display:'flex', alignItems:'center', gap:10}}><IconBadge tone="#3b82f6"><TrendingUp size={16} color="#3b82f6"/></IconBadge> Ingresos por día</h3>
            {(() => {
              const pts = (ventas.ingresosDia||[]).map(d=>({ value: Number(d.value||0), label: String(d.date||'').slice(0,10) }))
              const startStr = String(fechaInicio||'').slice(0,10)
              const endStr = String(fechaFin||'').slice(0,10)
              const inRange = pts.filter(p => p.label >= startStr && p.label <= endStr).sort((a,b)=> a.label.localeCompare(b.label))
              return <LineChart points={inRange} />
            })()}
          </div>
          <div className="card">
            <h3 style={{display:'flex', alignItems:'center', gap:10}}><IconBadge tone="#0ea5e9"><CreditCard size={16} color="#0ea5e9"/></IconBadge> Ventas por método</h3>
            <PieChart items={metodoData} />
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:10}}>
              {metodoData.map((m, i) => {
                const total = metodoData.reduce((a,b)=> a + Number(b.value||0), 0) || 1
                const pct = Math.round((Number(m.value||0)/total)*100)
                return (
                  <div key={m.label} style={{display:'flex', alignItems:'center', gap:8, background:'#0b1220', border:'1px solid #1f2937', padding:'6px 8px', borderRadius:8}}>
                    <span style={{width:10, height:10, borderRadius:999, background:PIE_COLORS[i % PIE_COLORS.length]}} />
                    <span style={{color:'#e5e7eb'}}>{String(m.label).replace('_',' ')}</span>
                    <span style={{marginLeft:'auto', color:'#9ca3af'}}>{Number(m.value||0).toLocaleString('es-AR')} · {pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="card"><h3>Total Ventas</h3><div className="stat-number">{fmt(ventas.totalVentas??0)}</div></div>
          <div className="card"><h3>Monto Total</h3><div className="stat-number">{money(ventas.montoTotal??0)}</div></div>
        </div>
      )}

      {tab==='envios' && (
        <div className="grid2" style={{marginTop:12}}>
          <div className="card">
            <h3 style={{display:'flex', alignItems:'center', gap:10}}><IconBadge tone="#22c55e"><CalendarRange size={16} color="#22c55e"/></IconBadge> Rango de fechas</h3>
            <RangeFilter fechaInicio={fechaInicio} fechaFin={fechaFin} onChangeInicio={v=> setFechaInicio(v)} onChangeFin={v=> setFechaFin(v)} onApply={cargar} onPreset={(t)=> presetRange(t)} tone="#22c55e" />
          </div>
          <div className="card"><h3 style={{display:'flex', alignItems:'center', gap:10}}><IconBadge tone="#22c55e"><Truck size={16} color="#22c55e"/></IconBadge> Estados</h3><StatesChart estados={envios.estados||{}} /></div>
          <div className="card"><h3>Promedio días entrega</h3><div className="stat-number">{envios.promedioDias??0}</div></div>
          <div className="card"><h3>En curso</h3><div className="stat-number">{envios.en_curso??0}</div></div>
          <div className="card"><h3>Entregados</h3><div className="stat-number">{envios.entregados??0}</div></div>
          <div className="card"><h3>Devueltos</h3><div className="stat-number">{envios.devueltos??0}</div></div>
        </div>
      )}

      {tab==='usuarios' && (
        <div className="grid2" style={{marginTop:12}}>
          <div className="card">
            <h3 style={{display:'flex', alignItems:'center', gap:10}}><IconBadge tone="#a78bfa"><CalendarRange size={16} color="#a78bfa"/></IconBadge> Rango de fechas</h3>
            <RangeFilter fechaInicio={fechaInicio} fechaFin={fechaFin} onChangeInicio={v=> setFechaInicio(v)} onChangeFin={v=> setFechaFin(v)} onApply={cargar} onPreset={(t)=> presetRange(t)} tone="#a78bfa" />
          </div>
          <div className="card"><h3 style={{display:'flex', alignItems:'center', gap:10}}><IconBadge tone="#a78bfa"><Users size={16} color="#a78bfa"/></IconBadge> Roles</h3>
            {(() => {
              const items = rolesDist
              const total = items.reduce((a,b)=> a + Number(b.value||0), 0) || 1
              const colors = items.map(it => roleColor(it.label))
              return (
                <>
                  <PieChart items={items} title="Usuarios" colors={colors} />
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:10}}>
                    {items.map((m, i) => {
                      const pct = Math.round((Number(m.value||0)/total)*100)
                      const color = colors[i]
                      return (
                        <div key={m.label} style={{display:'flex', alignItems:'center', gap:8, background:'#0b1220', border:'1px solid #1f2937', padding:'6px 8px', borderRadius:8}}>
                          <span style={{width:10, height:10, borderRadius:999, background:color}} />
                          <span style={{color:'#e5e7eb'}}>{String(m.label).replace('_',' ')}</span>
                          <span style={{marginLeft:'auto', color:'#9ca3af'}}>{Number(m.value||0).toLocaleString('es-AR')} · {pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                </>
              )
            })()}
          </div>
          <div className="card"><h3>Activos</h3><div className="stat-number">{usuarios.activos??0}</div></div>
          <div className="card"><h3>Inactivos</h3><div className="stat-number">{usuarios.inactivos??0}</div></div>
          <div className="card"><h3>Nuevos del mes</h3><div className="stat-number">{usuarios.nuevosMes??0}</div></div>
          <div className="card"><h3>Nuevos en rango</h3><div className="stat-number">{usuarios.nuevosRango??0}</div></div>
          <div className="card"><h3>Carritos abandonados</h3><div className="stat-number">{usuarios.carritosAbandonados??0}</div></div>
        </div>
      )}

      {tab==='productos' && (
        <div className="grid2" style={{marginTop:12}}>
          <div className="card">
            <h3 style={{display:'flex', alignItems:'center', gap:10}}><IconBadge tone="#f59e0b"><CalendarRange size={16} color="#f59e0b"/></IconBadge> Rango de fechas</h3>
            <RangeFilter fechaInicio={fechaInicio} fechaFin={fechaFin} onChangeInicio={v=> setFechaInicio(v)} onChangeFin={v=> setFechaFin(v)} onApply={cargar} onPreset={(t)=> presetRange(t)} tone="#f59e0b" />
          </div>
          <div className="card">
            <h3 style={{display:'flex', alignItems:'center', gap:10}}><IconBadge tone="#f59e0b"><Package size={16} color="#f59e0b"/></IconBadge> Top 10 más vendidos</h3>
            {(() => {
              const items = (productos.top10||[]).map(x=>({ label: x.nombre||x.id, value: Number(x.unidades ?? x.rotacion ?? 0) }))
              const total = items.reduce((a,b)=> a + Number(b.value||0), 0) || 1
              const colors = items.map(it => productColor(it.label))
              return (
                <>
                  <PieChart items={items} title="Productos" colors={colors} />
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:10}}>
                    {items.map((m, i) => {
                      const pct = Math.round((Number(m.value||0)/total)*100)
                      const color = colors[i]
                      return (
                        <div key={m.label} style={{display:'flex', alignItems:'center', gap:8, background:'#0b1220', border:'1px solid #1f2937', padding:'6px 8px', borderRadius:8}}>
                          <span style={{width:10, height:10, borderRadius:999, background:color}} />
                          <span style={{color:'#e5e7eb'}}>{String(m.label)}</span>
                          <span style={{marginLeft:'auto', color:'#9ca3af'}}>{Number(m.value||0).toLocaleString('es-AR')} unidades · {pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                </>
              )
            })()}
          </div>
          <div className="card"><h3>Bajo stock</h3><div>{(productos.bajos||[]).map(b=> (<span key={b.id} className="badge" style={{marginRight:6}}>{b.nombre} · {b.stock}</span>))}</div></div>
          <div className="card"><h3>Nuevos en rango</h3><div className="stat-number">{productos.nuevosRango??0}</div></div>
        </div>
      )}

      {tab==='resenas' && (
        <div className="grid2" style={{marginTop:12}}>
          <div className="card">
            <h3 style={{display:'flex', alignItems:'center', gap:10}}><IconBadge tone="#0ea5e9"><CalendarRange size={16} color="#0ea5e9"/></IconBadge> Rango de fechas</h3>
            <RangeFilter fechaInicio={fechaInicio} fechaFin={fechaFin} onChangeInicio={v=> setFechaInicio(v)} onChangeFin={v=> setFechaFin(v)} onApply={cargar} onPreset={(t)=> presetRange(t)} tone="#0ea5e9" />
          </div>
          <div className="card"><h3 style={{display:'flex', alignItems:'center', gap:10}}><IconBadge tone="#0ea5e9"><Star size={16} color="#0ea5e9"/></IconBadge> Global</h3><div className="stat-number">{reseñas.global??0}</div></div>
          <div className="card"><h3>Positivas</h3><div className="stat-number">{reseñas.positivas??0}</div></div>
          <div className="card"><h3>Negativas</h3><div className="stat-number">{reseñas.negativas??0}</div></div>
        </div>
      )}
    </div>
  )
}
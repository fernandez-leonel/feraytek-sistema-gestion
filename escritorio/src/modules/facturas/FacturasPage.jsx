import React, { useEffect, useState } from 'react'
import { FileText, MailCheck, MailX, User, Contact, Calendar, Receipt, ClipboardList, CheckCircle, Mail, Eye, ChevronsLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { facturasService } from '../../services/facturasService'
import { pedidosService } from '../../services/pedidosService'
import { pagosService } from '../../services/pagosService'
import { toast } from 'sonner'

export default function FacturasPage() {
  const [stats, setStats] = useState(null)
  const [adminList, setAdminList] = useState({ page:1, limit:10 })
  const [dataAdmin, setDataAdmin] = useState([])
  const [totalAdmin, setTotalAdmin] = useState(0)
  const [busqueda, setBusqueda] = useState({ numero:'', usuario:'', fecha_desde:'', fecha_hasta:'', email_enviado:'' })
  const [resultados, setResultados] = useState([])
  const [selectedFactura, setSelectedFactura] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const updateFacturaRow = (id, patch) => {
    setDataAdmin(arr => arr.map(x => (String(x.id_factura ?? x.id) === String(id)) ? { ...x, ...patch } : x))
  }

  const loadStats = async () => {
    setError('')
    try {
      const base = await facturasService.estadisticas()
      let enriched = { ...base }
      const toNum = (v) => { const n = typeof v === 'string' ? parseFloat(v) : (typeof v === 'number' ? v : null); return Number.isFinite(n) ? n : null }
      const isValid = (v) => Number.isFinite(toNum(v))
      try {
        const all = await facturasService.listarTodas({ page:1, limit:1000 })
        const arr = Array.isArray(all?.data) ? all.data : []
        const sent = arr.filter(x => x.enviado_email === true || x.enviado_email === 1 || String(x.enviado_email).toLowerCase() === '1' || String(x.enviado_email).toLowerCase() === 'true').length
        const pending = arr.length - sent
        enriched.facturas_enviadas = sent
        enriched.facturas_pendientes = pending
        if (!isValid(enriched?.total_facturas) && !isValid(enriched?.total)) enriched.total_facturas = Number(all?.total ?? arr.length)
      } catch {}
      if (!isValid(enriched?.total_facturas) && !isValid(enriched?.total)) {
        try { const r = await facturasService.listarTodas({ page:1, limit:1 }); enriched.total_facturas = Number(r?.total ?? (Array.isArray(r?.data)? r.data.length : 0)) } catch {}
      }
      setStats(enriched)
    } catch (e) { setError(e?.message || 'Error al cargar estadísticas') }
  }
  const loadAdmin = async () => {
    setLoading(true); setError('')
    try {
      const j = await facturasService.listarTodas({ page: adminList.page, limit: adminList.limit })
      const arr = Array.isArray(j?.data) ? j.data : []
      setDataAdmin(arr)
      setTotalAdmin(Number(j?.total ?? arr.length))
    } catch (e) { setError(e?.message || 'Error al cargar facturas') } finally { setLoading(false) }
  }
  const doBuscar = async () => {
    setLoading(true); setError('')
    try {
      const j = await facturasService.listarTodas({ page: 1, limit: 1000 })
      let arr = Array.isArray(j?.data) ? j.data : []
      const qNum = String(busqueda.numero || '').trim().toLowerCase()
      const qUser = String(busqueda.usuario || '').trim().toLowerCase()
      const qDesde = busqueda.fecha_desde ? new Date(busqueda.fecha_desde).getTime() : null
      const qHasta = busqueda.fecha_hasta ? new Date(busqueda.fecha_hasta).getTime() : null
      const qEnviado = busqueda.email_enviado === '' ? null : (busqueda.email_enviado === 'true')
      arr = arr.filter(f => {
        if (qNum) { const s = String(f.numero_factura || '').toLowerCase(); if (!s.includes(qNum)) return false }
        if (qUser) { const s = String(f.nombre_usuario || f.usuario || '').toLowerCase(); if (!s.includes(qUser)) return false }
        const t = new Date(f.fecha_emision || f.created_at || 0).getTime()
        if (Number.isFinite(qDesde) && t < qDesde) return false
        if (Number.isFinite(qHasta) && t > qHasta) return false
        if (qEnviado != null) { const flag = (f.enviado_email === true || f.enviado_email === 1 || String(f.enviado_email).toLowerCase() === '1' || String(f.enviado_email).toLowerCase() === 'true'); if (flag !== qEnviado) return false }
        return true
      })
      setAdminList(a => ({ ...a, page: 1 }))
      setDataAdmin(arr)
      setTotalAdmin(arr.length)
    } catch (e) { setError(e?.message || 'Error en búsqueda') } finally { setLoading(false) }
  }

  useEffect(() => { loadStats() }, [])
  useEffect(() => { loadAdmin() }, [adminList.page, adminList.limit])

  const totalPages = Math.max(1, Math.ceil(totalAdmin / adminList.limit))
  const canNext = (adminList.page < totalPages) && (totalAdmin >= adminList.page * adminList.limit)

  const verDetalle = async (id) => {
    setLoading(true); setError('')
    try { const j = await facturasService.obtenerPorId(id); setSelectedFactura(j?.data ?? j); setDetailOpen(true) } catch (e) { setError(e?.message || 'No se pudo obtener detalle') } finally { setLoading(false) }
  }
  const marcarEnviada = async (id) => {
    setError('')
    try {
      await facturasService.marcarEnviada(id)
      updateFacturaRow(id, { enviado_email: true })
      setSelectedFactura(s => (s && (String(s.id_factura??s.id)===String(id))) ? { ...s, enviado_email: true } : s)
      setStats(st => {
        if (!st) return st
        const ya = dataAdmin.find(x => String(x.id_factura ?? x.id) === String(id))
        const estaba = ya && (ya.enviado_email === true || ya.enviado_email === 1 || String(ya.enviado_email).toLowerCase() === '1' || String(ya.enviado_email).toLowerCase() === 'true')
        if (estaba) return st
        const e2 = Number(st.facturas_enviadas ?? 0) + 1
        const p2 = Math.max(0, Number(st.facturas_pendientes ?? 0) - 1)
        return { ...st, facturas_enviadas: e2, facturas_pendientes: p2 }
      })
      toast.success('Factura marcada como enviada')
    } catch (e) { setError(e?.message || 'Error al marcar enviada') }
  }
  const enviarEmail = async (id) => {
    setError('')
    try {
      await facturasService.enviarEmail(id)
      updateFacturaRow(id, { enviado_email: true })
      setSelectedFactura(s => (s && (String(s.id_factura??s.id)===String(id))) ? { ...s, enviado_email: true } : s)
      toast.success('Email reenviado correctamente')
    } catch (e) { setError(e?.message || 'Error al enviar email') }
  }
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const abrirVistaFactura = async (id) => {
    setLoading(true); setError('')
    try {
      const det = await facturasService.obtenerPorId(id)
      const f = det?.data ?? det
      setSelectedFactura(f)
      setDetailOpen(false)
      await openInvoicePreview(f)
    } catch (e) { setError(e?.message || 'Error al preparar vista previa') } finally { setLoading(false) }
  }
  const generarPDF = async (id) => {
    setLoading(true); setError('')
    try {
      const j = await facturasService.generarPDF(id)
      const isElectron = typeof window !== 'undefined' && ((window.process && window.process.type === 'renderer') || String(navigator.userAgent||'').includes('Electron'))
      if (j?.pdf_url) {
        let f = selectedFactura
        if (!f) { const det = await facturasService.obtenerPorId(id); f = det?.data ?? det }
        const nombre = `factura-${f?.numero_factura||f?.id||'sin'}`
        await descargarFacturaPDF(id, nombre, j.pdf_url)
        return
      }
      const f = selectedFactura
      if (!f) { const det = await facturasService.obtenerPorId(id); await openInvoicePrint(det?.data ?? det); return }
      await openInvoicePrint(f)
    } catch (e) {
      setError(e?.message || 'Error al generar PDF')
      try {
        let f = selectedFactura
        if (!f) { const det = await facturasService.obtenerPorId(id); f = det?.data ?? det }
        if (f) await openInvoicePreview(f)
      } catch {}
    } finally { setLoading(false) }
  }

  const formatMoney = (n) => `$${Number(n ?? 0).toFixed(2)}`
  const formatDate = (d) => new Date(d ?? Date.now()).toLocaleString()
  const openInvoicePrint = async (f) => {
    let pedido = null
    try { if (f?.id_pedido) { pedido = await pedidosService.obtener(f.id_pedido) } } catch {}
    const root = pedido?.data ?? pedido
    const src = root?.pedido ?? root?.order ?? root
    const itemsRaw = Array.isArray(src?.items) ? src.items : (Array.isArray(src?.productos) ? src.productos : [])
    const mapItem = (it) => {
      const nombre = it.nombre_producto || it.producto || it.nombre || '-'
      const cantidad = Number(it.cantidad ?? it.qty ?? it.cant ?? 1)
      const precio = Number(it.precio_unitario ?? it.precio ?? it.precio_final ?? 0)
      const total = Number(it.total ?? (cantidad * precio))
      return { nombre, cantidad, precio, total }
    }
    const rowsHtml = itemsRaw.map(it => mapItem(it)).map(m => `<tr><td>${m.nombre}</td><td style="text-align:center">${m.cantidad}</td><td style="text-align:right">${formatMoney(m.precio)}</td><td style="text-align:right">${formatMoney(m.total)}</td></tr>`).join('')
    const d = (typeof src?.direccion === 'object' && src?.direccion) || src?.envio?.direccion || {}
    const s1 = typeof src?.direccion_entrega === 'string' ? src.direccion_entrega : ''
    const s2 = typeof src?.direccion_envio === 'string' ? src.direccion_envio : ''
    const s3 = typeof src?.direccion === 'string' ? src.direccion : ''
    const calle = d.calle || d.direccion || d.direccion_entrega || ''
    const numero = d.numero || d.altura || ''
    const loc = d.localidad || ''
    const prov = d.provincia || ''
    const cp = d.cp || d.codigo_postal || ''
    const parts = [calle && `${calle} ${numero||''}`.trim(), loc, prov, cp && `CP ${cp}`].filter(Boolean)
    let direccionEnvio = s1 || s2 || s3 || (parts.length ? parts.join(', ') : '')
    if (!direccionEnvio) {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'
      const token = sessionStorage.getItem('token')
      const uid = src?.id_usuario ?? src?.usuario_id ?? src?.user?.id_usuario ?? src?.cliente?.id_usuario ?? f?.id_usuario ?? f?.usuario_id ?? f?.id_user ?? f?.user_id
      if (uid != null) {
        try {
          const hdr = token ? { Authorization: `Bearer ${token}`, Accept: 'application/json' } : { Accept: 'application/json' }
          const r = await fetch(`${API_BASE}/users/profile/${uid}`, { headers: hdr })
          const j = await r.json().catch(()=>({}))
          const pre = j?.data ?? j ?? {}
          const perfil = pre?.perfil ?? pre?.user ?? pre
          const pcalle = perfil.direccion || perfil.calle || ''
          const ploc = perfil.ciudad || perfil.localidad || ''
          const pprov = perfil.provincia || ''
          const pcp = perfil.codigo_postal || perfil.cp || ''
          const ppais = perfil.pais || ''
          const pparts = [pcalle, ploc, pprov, ppais, pcp && `CP ${pcp}`].filter(x => x && String(x).trim().length>0)
          if (pparts.length>0) direccionEnvio = pparts.join(', ')
        } catch {}
        if (!direccionEnvio) {
          try {
            const hdr = token ? { Authorization: `Bearer ${token}`, Accept: 'application/json' } : { Accept: 'application/json' }
            const ru = await fetch(`${API_BASE}/users`, { headers: hdr })
            const uj = await ru.json().catch(()=>({}))
            const arru = Array.isArray(uj?.data) ? uj.data : (Array.isArray(uj) ? uj : [])
            const u = arru.find(x => String(x.id_usuario ?? x.id) === String(uid))
            if (u) {
              const ucalle = u.direccion || u.calle || ''
              const uloc = u.localidad || u.ciudad || ''
              const uprov = u.provincia || ''
              const upais = u.pais || ''
              const ucp = u.codigo_postal || u.cp || ''
              const uparts = [ucalle, uloc, uprov, upais, ucp && `CP ${ucp}`].filter(x => x && String(x).trim().length>0)
              if (uparts.length>0) direccionEnvio = uparts.join(', ')
            }
          } catch {}
        }
      }
      if (!direccionEnvio && f?.id_pedido) {
        try {
          const hdr = token ? { Authorization: `Bearer ${token}`, Accept: 'application/json' } : { Accept: 'application/json' }
          const re = await fetch(`${API_BASE}/envios`, { headers: hdr })
          const ej = await re.json().catch(()=>({}))
          const arr = Array.isArray(ej?.data) ? ej.data : (Array.isArray(ej) ? ej : [])
          const m = arr.find(e => String(e.id_pedido ?? e.pedido_id) === String(f.id_pedido))
          if (m) {
            const md = (typeof m?.direccion === 'object' && m.direccion) || {}
            const mcalle = md.calle || md.direccion || md.direccion_entrega || m?.direccion_entrega || ''
            const mnumero = md.numero || md.altura || ''
            const mloc = md.localidad || ''
            const mprov = md.provincia || ''
            const mcp = md.cp || md.codigo_postal || ''
            const mpais = md.pais || ''
            const mparts = [mcalle && `${mcalle} ${mnumero||''}`.trim(), mloc, mprov, mpais, mcp && `CP ${mcp}`].filter(Boolean)
            if (mparts.length>0) direccionEnvio = mparts.join(', ')
          }
        } catch {}
      }
      if (!direccionEnvio && f?.id_pedido) {
        try {
          const hdr = token ? { Authorization: `Bearer ${token}`, Accept: 'application/json' } : { Accept: 'application/json' }
          const rp = await fetch(`${API_BASE}/pedidos/${f.id_pedido}`, { headers: hdr })
          const pj = await rp.json().catch(()=>({}))
          const pr = pj?.data ?? pj ?? {}
          const ps = pr?.pedido ?? pr?.order ?? pr
          const pd = (typeof ps?.direccion === 'object' && ps?.direccion) || ps?.envio?.direccion || {}
          const pcalle2 = pd.calle || pd.direccion || pd.direccion_entrega || ps?.direccion_entrega || ps?.direccion_envio || f?.direccion_envio || f?.direccion || ''
          const pnum2 = pd.numero || pd.altura || ''
          const ploc2 = pd.localidad || ''
          const pprov2 = pd.provincia || ''
          const pcp2 = pd.cp || pd.codigo_postal || ''
          const ppais2 = pd.pais || ''
          const mparts2 = [pcalle2 && `${pcalle2} ${pnum2||''}`.trim(), ploc2, pprov2, ppais2, pcp2 && `CP ${pcp2}`].filter(Boolean)
          if (mparts2.length>0) direccionEnvio = mparts2.join(', ')
        } catch {}
      }
    }
    if (!direccionEnvio) direccionEnvio = '-'
    let metodoPago = (src?.metodo_pago ?? src?.payment_method ?? src?.metodo ?? src?.pago?.metodo ?? src?.pago?.tipo ?? '')
    if ((!metodoPago || metodoPago==='-') && f?.id_pedido) {
      try {
        const res = await pagosService.adminList({ page:1, limit:500 })
        const arr = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
        const m = arr.find(pp => String(pp.id_pedido ?? pp.pedido_id) === String(f.id_pedido))
        metodoPago = m?.metodo_pago ?? m?.metodo ?? ''
      } catch {}
    }
    if (!metodoPago) metodoPago = '-'
    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Factura ${f?.numero_factura ?? ''}</title>
        <style>
          body { font-family: system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif; background:#f3f4f6; margin:0; padding:20px; color:#111827 }
          .sheet { width:900px; margin:0 auto; background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:24px }
          .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px }
          .brand { display:flex; align-items:center; gap:10px; font-size:22px; font-weight:700; color:#1f2937 }
          .badge { padding:6px 10px; border-radius:999px; font-size:12px }
          .badge-success { background:#d1fae5; color:#065f46; border:1px solid #10b981 }
          .badge-danger { background:#fee2e2; color:#7f1d1d; border:1px solid #ef4444 }
          .section { border:1px solid #e5e7eb; border-radius:12px; padding:16px; margin-top:12px }
          .title { font-size:18px; font-weight:700; color:#1f2937; margin:0 0 10px }
          .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px }
          .row { display:flex; align-items:center; gap:8px; padding:6px 0; border-top:1px solid #f3f4f6 }
          .label { font-weight:600; color:#374151 }
          .sep { color:#9ca3af }
          .stat { display:flex; gap:18px; flex-wrap:wrap }
          .stat-box { background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:10px 12px }
          .footer { display:flex; justify-content:flex-end; margin-top:16px; color:#6b7280; font-size:12px }
          table { width:100%; border-collapse:collapse; margin-top:8px }
          th, td { border:1px solid #e5e7eb; padding:8px }
          th { background:#f9fafb; text-align:left }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="header">
            <div class="brand">Feraytek · Factura ${f?.numero_factura ?? ''}</div>
            <span class="badge ${f?.enviado_email ? 'badge-success':'badge-danger'}">${f?.enviado_email ? 'Enviada' : 'Pendiente'}</span>
          </div>
          <div class="section">
            <div class="title">Información</div>
            <div class="grid2">
              <div>
                <div class="row"><span class="label">ID</span><span class="sep">:</span> ${f?.id_factura ?? f?.id ?? '-'}</div>
                <div class="row"><span class="label">Tipo</span><span class="sep">:</span> ${f?.tipo ?? '-'}</div>
                <div class="row"><span class="label">Fecha</span><span class="sep">:</span> ${formatDate(f?.fecha_emision)}</div>
              </div>
              <div>
                <div class="row"><span class="label">Pedido</span><span class="sep">:</span> ${f?.id_pedido ?? '-'}</div>
                <div class="row"><span class="label">Usuario</span><span class="sep">:</span> ${f?.nombre_usuario ?? '-'}</div>
                <div class="row"><span class="label">Email</span><span class="sep">:</span> ${f?.email ?? '-'}</div>
              </div>
            </div>
          </div>
          <div class="section">
            <div class="title">Cliente y Envío</div>
            <div class="grid2">
              <div>
                <div class="row"><span class="label">Cliente</span><span class="sep">:</span> ${f?.nombre_usuario ?? '-'}</div>
                <div class="row"><span class="label">Email</span><span class="sep">:</span> ${f?.email ?? '-'}</div>
              </div>
              <div>
                <div class="row"><span class="label">Dirección</span><span class="sep">:</span> ${direccionEnvio}</div>
                <div class="row"><span class="label">Método de pago</span><span class="sep">:</span> ${metodoPago}</div>
              </div>
            </div>
          </div>
          <div class="section">
            <div class="title">Totales</div>
            <div class="stat">
              <div class="stat-box"><b>Subtotal</b>: ${formatMoney(f?.subtotal)}</div>
              <div class="stat-box"><b>IVA</b>: ${formatMoney(f?.iva_total)}</div>
              <div class="stat-box"><b>Total</b>: ${formatMoney(f?.total)}</div>
            </div>
          </div>
          <div class="section">
            <div class="title">Detalle</div>
            ${rowsHtml ? `<table><thead><tr><th>Producto</th><th style="width:100px">Cant.</th><th style="width:140px">Precio</th><th style="width:160px">Total</th></tr></thead><tbody>${rowsHtml}</tbody></table>` : '<div style="color:#6b7280">Sin detalle</div>'}
          </div>
          <div class="footer">Generado desde Feraytek Admin</div>
        </div>
        <script>window.onload = () => { window.print() }</script>
      </body>
      </html>
    `
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)
    const doc = iframe.contentWindow.document
    doc.open()
    doc.write(html)
    doc.close()
    setTimeout(() => { try { iframe.contentWindow.focus(); iframe.contentWindow.print() } catch {} setTimeout(() => { document.body.removeChild(iframe) }, 1000) }, 250)
  }
  const openInvoicePreview = async (f) => {
    let pedido = null
    try { if (f?.id_pedido) { pedido = await pedidosService.obtener(f.id_pedido) } } catch {}
    const root = pedido?.data ?? pedido
    const src = root?.pedido ?? root?.order ?? root
    const itemsRaw = Array.isArray(src?.items) ? src.items : (Array.isArray(src?.productos) ? src.productos : [])
    const mapItem = (it) => {
      const nombre = it.nombre_producto || it.producto || it.nombre || '-'
      const cantidad = Number(it.cantidad ?? it.qty ?? it.cant ?? 1)
      const precio = Number(it.precio_unitario ?? it.precio ?? it.precio_final ?? 0)
      const total = Number(it.total ?? (cantidad * precio))
      return { nombre, cantidad, precio, total }
    }
    const rowsHtml = itemsRaw.map(it => mapItem(it)).map(m => `<tr><td>${m.nombre}</td><td style=\"text-align:center\">${m.cantidad}</td><td style=\"text-align:right\">${formatMoney(m.precio)}</td><td style=\"text-align:right\">${formatMoney(m.total)}</td></tr>`).join('')
    let direccionEnvio = (() => {
      const d = (typeof src?.direccion === 'object' && src?.direccion) || src?.envio?.direccion || {}
      const s1 = typeof src?.direccion_entrega === 'string' ? src.direccion_entrega : ''
      const s2 = typeof src?.direccion_envio === 'string' ? src.direccion_envio : ''
      const s3 = typeof src?.direccion === 'string' ? src.direccion : ''
      const calle = d.calle || d.direccion || d.direccion_entrega || ''
      const numero = d.numero || d.altura || ''
      const loc = d.localidad || ''
      const prov = d.provincia || ''
      const cp = d.cp || d.codigo_postal || ''
      const parts = [calle && `${calle} ${numero||''}`.trim(), loc, prov, cp && `CP ${cp}`].filter(Boolean)
      return s1 || s2 || s3 || (parts.length ? parts.join(', ') : '')
    })()
    if (!direccionEnvio || direccionEnvio==='-') {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'
      const token = sessionStorage.getItem('token')
      const uid = src?.id_usuario ?? src?.usuario_id ?? src?.user?.id_usuario ?? src?.cliente?.id_usuario ?? f?.id_usuario ?? f?.usuario_id ?? f?.id_user ?? f?.user_id
      if (uid != null) {
        try {
          const hdr = token ? { Authorization: `Bearer ${token}`, Accept: 'application/json' } : { Accept: 'application/json' }
          const r = await fetch(`${API_BASE}/users/profile/${uid}`, { headers: hdr })
          const j = await r.json().catch(()=>({}))
          const pre = j?.data ?? j ?? {}
          const perfil = pre?.perfil ?? pre?.user ?? pre
          const pcalle = perfil.direccion || perfil.calle || ''
          const ploc = perfil.ciudad || perfil.localidad || ''
          const pprov = perfil.provincia || ''
          const pcp = perfil.codigo_postal || perfil.cp || ''
          const ppais = perfil.pais || ''
          const pparts = [pcalle, ploc, pprov, ppais, pcp && `CP ${pcp}`].filter(x => x && String(x).trim().length>0)
          if (pparts.length>0) direccionEnvio = pparts.join(', ')
        } catch {}
        if (!direccionEnvio) {
          try {
            const hdr = token ? { Authorization: `Bearer ${token}`, Accept: 'application/json' } : { Accept: 'application/json' }
            const ru = await fetch(`${API_BASE}/users`, { headers: hdr })
            const uj = await ru.json().catch(()=>({}))
            const arru = Array.isArray(uj?.data) ? uj.data : (Array.isArray(uj) ? uj : [])
            const u = arru.find(x => String(x.id_usuario ?? x.id) === String(uid))
            if (u) {
              const ucalle = u.direccion || u.calle || ''
              const uloc = u.localidad || u.ciudad || ''
              const uprov = u.provincia || ''
              const upais = u.pais || ''
              const ucp = u.codigo_postal || u.cp || ''
              const uparts = [ucalle, uloc, uprov, upais, ucp && `CP ${ucp}`].filter(x => x && String(x).trim().length>0)
              if (uparts.length>0) direccionEnvio = uparts.join(', ')
            }
          } catch {}
        }
      }
      if ((!direccionEnvio || direccionEnvio==='-') && f?.id_pedido) {
        try {
          const hdr = token ? { Authorization: `Bearer ${token}`, Accept: 'application/json' } : { Accept: 'application/json' }
          const re = await fetch(`${API_BASE}/envios`, { headers: hdr })
          const ej = await re.json().catch(()=>({}))
          const arr = Array.isArray(ej?.data) ? ej.data : (Array.isArray(ej) ? ej : [])
          const m = arr.find(e => String(e.id_pedido ?? e.pedido_id) === String(f.id_pedido))
          if (m) {
            const md = (typeof m?.direccion === 'object' && m.direccion) || {}
            const mcalle = md.calle || md.direccion || md.direccion_entrega || m?.direccion_entrega || ''
            const mnumero = md.numero || md.altura || ''
            const mloc = md.localidad || ''
            const mprov = md.provincia || ''
            const mcp = md.cp || md.codigo_postal || ''
            const mpais = md.pais || ''
            const mparts = [mcalle && `${mcalle} ${mnumero||''}`.trim(), mloc, mprov, mpais, mcp && `CP ${mcp}`].filter(Boolean)
            if (mparts.length>0) direccionEnvio = mparts.join(', ')
          }
        } catch {}
      }
      if ((!direccionEnvio || direccionEnvio==='-') && f?.id_pedido) {
        try {
          const hdr = token ? { Authorization: `Bearer ${token}`, Accept: 'application/json' } : { Accept: 'application/json' }
          const rp = await fetch(`${API_BASE}/pedidos/${f.id_pedido}`, { headers: hdr })
          const pj = await rp.json().catch(()=>({}))
          const pr = pj?.data ?? pj ?? {}
          const ps = pr?.pedido ?? pr?.order ?? pr
          const pd = (typeof ps?.direccion === 'object' && ps?.direccion) || ps?.envio?.direccion || {}
          const pcalle2 = pd.calle || pd.direccion || pd.direccion_entrega || ps?.direccion_entrega || ps?.direccion_envio || f?.direccion_envio || f?.direccion || ''
          const pnum2 = pd.numero || pd.altura || ''
          const ploc2 = pd.localidad || ''
          const pprov2 = pd.provincia || ''
          const pcp2 = pd.cp || pd.codigo_postal || ''
          const ppais2 = pd.pais || ''
          const mparts2 = [pcalle2 && `${pcalle2} ${pnum2||''}`.trim(), ploc2, pprov2, ppais2, pcp2 && `CP ${pcp2}`].filter(Boolean)
          if (mparts2.length>0) direccionEnvio = mparts2.join(', ')
        } catch {}
      }
    }
    if (!direccionEnvio) direccionEnvio = '-'
    let metodoPago = (src?.metodo_pago ?? src?.payment_method ?? src?.metodo ?? src?.pago?.metodo ?? src?.pago?.tipo ?? '')
    if ((!metodoPago || metodoPago==='-') && f?.id_pedido) {
      try {
        const res = await pagosService.adminList({ page:1, limit:500 })
        const arr = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
        const m = arr.find(pp => String(pp.id_pedido ?? pp.pedido_id) === String(f.id_pedido))
        metodoPago = m?.metodo_pago ?? m?.metodo ?? ''
      } catch {}
    }
    if (!metodoPago) metodoPago = '-'
    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset=\"utf-8\" />
        <title>Factura ${f?.numero_factura ?? ''}</title>
        <style>
          body { font-family: system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif; background:#f3f4f6; margin:0; padding:20px; color:#111827 }
          .sheet { width:900px; margin:0 auto; background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:24px }
          .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px }
          .brand { display:flex; align-items:center; gap:10px; font-size:22px; font-weight:700; color:#1f2937 }
          .badge { padding:6px 10px; border-radius:999px; font-size:12px }
          .badge-success { background:#d1fae5; color:#065f46; border:1px solid #10b981 }
          .badge-danger { background:#fee2e2; color:#7f1d1d; border:1px solid #ef4444 }
          .section { border:1px solid #e5e7eb; border-radius:12px; padding:16px; margin-top:12px }
          .title { font-size:18px; font-weight:700; color:#1f2937; margin:0 0 10px }
          .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px }
          .row { display:flex; align-items:center; gap:8px; padding:6px 0; border-top:1px solid #f3f4f6 }
          .label { font-weight:600; color:#374151 }
          .sep { color:#9ca3af }
          .stat { display:flex; gap:18px; flex-wrap:wrap }
          .stat-box { background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:10px 12px }
          .footer { display:flex; justify-content:flex-end; margin-top:16px; color:#6b7280; font-size:12px }
          table { width:100%; border-collapse:collapse; margin-top:8px }
          th, td { border:1px solid #e5e7eb; padding:8px }
          th { background:#f9fafb; text-align:left }
        </style>
      </head>
      <body>
        <div class=\"sheet\">
          <div class=\"header\">
            <div class=\"brand\">Feraytek · Factura ${f?.numero_factura ?? ''}</div>
            <span class=\"badge ${f?.enviado_email ? 'badge-success':'badge-danger'}\">${f?.enviado_email ? 'Enviada' : 'Pendiente'}</span>
          </div>
          <div class=\"section\">
            <div class=\"title\">Información</div>
            <div class=\"grid2\">
              <div>
                <div class=\"row\"><span class=\"label\">ID</span><span class=\"sep\">:</span> ${f?.id_factura ?? f?.id ?? '-'}</div>
                <div class=\"row\"><span class=\"label\">Tipo</span><span class=\"sep\">:</span> ${f?.tipo ?? '-'}</div>
                <div class=\"row\"><span class=\"label\">Fecha</span><span class=\"sep\">:</span> ${formatDate(f?.fecha_emision)}</div>
              </div>
              <div>
                <div class=\"row\"><span class=\"label\">Pedido</span><span class=\"sep\">:</span> ${f?.id_pedido ?? '-'}</div>
                <div class=\"row\"><span class=\"label\">Usuario</span><span class=\"sep\">:</span> ${f?.nombre_usuario ?? '-'}</div>
                <div class=\"row\"><span class=\"label\">Email</span><span class=\"sep\">:</span> ${f?.email ?? '-'}</div>
              </div>
            </div>
          </div>
          <div class=\"section\">
            <div class=\"title\">Cliente y Envío</div>
            <div class=\"grid2\">
              <div>
                <div class=\"row\"><span class=\"label\">Cliente</span><span class=\"sep\">:</span> ${f?.nombre_usuario ?? '-'}</div>
                <div class=\"row\"><span class=\"label\">Email</span><span class=\"sep\">:</span> ${f?.email ?? '-'}</div>
              </div>
              <div>
                <div class=\"row\"><span class=\"label\">Dirección</span><span class=\"sep\">:</span> ${direccionEnvio}</div>
                <div class=\"row\"><span class=\"label\">Método de pago</span><span class=\"sep\">:</span> ${metodoPago}</div>
              </div>
            </div>
          </div>
          <div class=\"section\">
            <div class=\"title\">Totales</div>
            <div class=\"stat\">
              <div class=\"stat-box\"><b>Subtotal</b>: ${formatMoney(f?.subtotal)}</div>
              <div class=\"stat-box\"><b>IVA</b>: ${formatMoney(f?.iva_total)}</div>
              <div class=\"stat-box\"><b>Total</b>: ${formatMoney(f?.total)}</div>
            </div>
          </div>
          <div class=\"section\">
            <div class=\"title\">Detalle</div>
            ${rowsHtml ? `<table><thead><tr><th>Producto</th><th style=\"width:100px\">Cant.</th><th style=\"width:140px\">Precio</th><th style=\"width:160px\">Total</th></tr></thead><tbody>${rowsHtml}</tbody></table>` : '<div style=\"color:#6b7280\">Sin detalle</div>'}
          </div>
          <div class=\"footer\">Generado desde Feraytek Admin</div>
        </div>
      </body>
      </html>
    `
    setPreviewHtml(html)
    setPreviewOpen(true)
    return html
  }
  const descargarFacturaHTML = async (nombre='factura') => {
    setLoading(true); setError('')
    try {
      let html = previewHtml
      if (!html) {
        const f = selectedFactura
        if (f) html = await openInvoicePreview(f)
      }
      if (!html) throw new Error('No hay contenido de factura para descargar')
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${nombre}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) { setError(e?.message || 'Error al descargar factura') } finally { setLoading(false) }
  }
  const descargarFacturaPDF = async (id, nombre='factura', pdfUrl) => {
    setLoading(true); setError('')
    try {
      if (!Number.isFinite(Number(id))) throw new Error('ID inválido')
      const j = pdfUrl ? { pdf_url: pdfUrl } : await facturasService.generarPDF(id)
      if (j?.pdf_url) {
        const LOCAL_BACKEND = process.env.REACT_APP_LOCAL_BACKEND_URL || 'http://localhost:4001'
        let fetchUrl = String(j.pdf_url || '')
        if (!/^https?:\/\//i.test(fetchUrl)) {
          const trimmed = fetchUrl.replace(/^\/+/, '')
          fetchUrl = `${LOCAL_BACKEND}/${trimmed}`
        }
        const token = sessionStorage.getItem('token')
        const hdr = token ? { Authorization: `Bearer ${token}`, Accept: 'application/pdf' } : { Accept: 'application/pdf' }
        const r = await fetch(fetchUrl, { headers: hdr })
        if (!r.ok) throw new Error(`Error (${r.status}) al obtener PDF`)
        const ct = (r.headers.get('Content-Type') || r.headers.get('content-type') || '').toLowerCase()
        const b = await r.blob()
        const isPdf = ct.includes('application/pdf') && (b && b.size > 0)
        if (!isPdf) throw new Error('Contenido no válido para PDF')
        const url = URL.createObjectURL(b)
        const a = document.createElement('a')
        a.href = url
        a.download = `${nombre}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        return
      }
      if (previewHtml) {
        const blob = new Blob([previewHtml], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${nombre}.html`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (e) {
      setError(e?.message || 'Error al descargar factura')
      try {
        if (previewHtml) {
          const blob = new Blob([previewHtml], { type: 'text/html' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${nombre}.html`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        } else {
          let f = selectedFactura
          if (!f && Number.isFinite(Number(id))) {
            const det = await facturasService.obtenerPorId(id)
            f = det?.data ?? det
          }
          if (f) await openInvoicePreview(f)
        }
      } catch {}
    } finally { setLoading(false) }
  }

  return (
    <div className="productos-module">
      <h1 style={{display:'flex', alignItems:'center', gap:8, color:'#3b82f6'}}><FileText size={22}/> Facturas</h1>

      <div className="card" style={{marginTop:12}}>
        <h3>Estadísticas</h3>
        {stats ? (
          <div style={{display:'flex', gap:18, flexWrap:'wrap', marginTop:8}}>
            <div className="stat-box"><b>Total facturas:</b> {stats.total_facturas ?? stats.total ?? '-'}</div>
            <div className="stat-box"><b>Monto facturado:</b> ${Number(stats.total_facturado ?? stats.monto_total ?? 0).toFixed(2)}</div>
            <div className="stat-box"><b>Enviadas:</b> {stats.facturas_enviadas ?? '-'}</div>
            <div className="stat-box"><b>Pendientes:</b> {stats.facturas_pendientes ?? '-'}</div>
          </div>
        ) : <div>Cargando estadísticas...</div>}
      </div>

      <div className="card" style={{marginTop:12}}>
        <div className="productos-filters" style={{display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'}}>
          <h3>Búsqueda avanzada</h3>
          <input placeholder="Número de factura" value={busqueda.numero} onChange={(e)=> setBusqueda(b => ({ ...b, numero: e.target.value }))} />
          <input placeholder="Usuario (nombre/email)" value={busqueda.usuario} onChange={(e)=> setBusqueda(b => ({ ...b, usuario: e.target.value }))} />
          <input type="date" placeholder="Desde" value={busqueda.fecha_desde} onChange={(e)=> setBusqueda(b => ({ ...b, fecha_desde: e.target.value }))} />
          <input type="date" placeholder="Hasta" value={busqueda.fecha_hasta} onChange={(e)=> setBusqueda(b => ({ ...b, fecha_hasta: e.target.value }))} />
          <select value={busqueda.email_enviado} onChange={(e)=> setBusqueda(b => ({ ...b, email_enviado: e.target.value }))}>
            <option value="">Todos</option>
            <option value="true">Enviadas</option>
            <option value="false">Pendientes</option>
          </select>
          <button className="btn" onClick={doBuscar} style={{background:'#1f2937', color:'#fff'}}>Buscar</button>
        </div>
      </div>

      <div className="table" style={{marginTop:12}}>
        <h3>Listado Admin</h3>
        {error && <div className="error-box" style={{marginTop:8}}>{error}</div>}
        {loading ? <div>Cargando facturas...</div> : (
          <table style={{width:'100%'}}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Número</th>
                <th>Usuario</th>
                <th>Total</th>
                <th>Acciones</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {dataAdmin.length===0 ? (
                <tr><td colSpan="6" style={{textAlign:'center', padding:20}}>No se encontraron facturas</td></tr>
              ) : dataAdmin.map(f => (
                <tr key={f.id_factura ?? f.id ?? f.numero_factura}>
                  <td>{f.id_factura ?? f.id}</td>
                  <td>{f.numero_factura ?? '-'}</td>
                  <td>{f.nombre_usuario ?? '-'}</td>
                  <td>${Number(f.total ?? 0).toFixed(2)}</td>
                  <td>
                    <button className="btn" onClick={()=> verDetalle(f.id_factura ?? f.id)} title="Ver" aria-label="Ver" style={{background:'#2563eb', color:'#fff', marginRight:6, display:'inline-flex', alignItems:'center', gap:8}}><Eye size={16}/></button>
                    <button className="btn" onClick={()=> abrirVistaFactura(f.id_factura ?? f.id)} title="Generar PDF" aria-label="Generar PDF" style={{background:'#2563eb', color:'#fff', marginRight:6, display:'inline-flex', alignItems:'center', gap:8}}><FileText size={16}/></button>
                    <button className="btn" onClick={()=> enviarEmail(f.id_factura ?? f.id)} title="Reenviar email" aria-label="Reenviar email" style={{background:'#2563eb', color:'#fff', display:'inline-flex', alignItems:'center', gap:8}}><Mail size={16}/></button>
                  </td>
                  <td>{new Date(f.fecha_emision ?? Date.now()).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div style={{display:'flex', alignItems:'center', justifyContent:'flex-start', gap:12, marginTop:12}}>
          <div style={{color:'#374151'}}>Total: {totalAdmin}</div>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <button className="btn" onClick={async ()=> {
              try {
                const j = await facturasService.listarTodas({ page: 1, limit: adminList.limit })
                const arr = Array.isArray(j?.data) ? j.data : []
                setDataAdmin(arr)
                setTotalAdmin(Number(j?.total ?? arr.length))
                setAdminList(a => ({ ...a, page: 1 }))
              } catch (e) { setError(e?.message || 'Error al cargar facturas') }
            }} disabled={adminList.page===1} style={{background:'#2563eb', color:'#fff'}}><ChevronsLeft size={16}/></button>
            <button className="btn" onClick={()=> setAdminList(a => ({ ...a, page: Math.max(1, a.page-1) }))} disabled={adminList.page===1} style={{background:'#2563eb', color:'#fff'}}><ChevronLeft size={16}/></button>
            <span style={{minWidth:80, textAlign:'center'}}>Página {adminList.page} de {totalPages}</span>
            <button className="btn" onClick={()=> setAdminList(a => ({ ...a, page: a.page+1 }))} disabled={!canNext} style={{background:'#2563eb', color:'#fff'}}><ChevronRight size={16}/></button>
          </div>
        </div>
      </div>

      {detailOpen && selectedFactura && (
        <div className="modal-overlay" onClick={()=> setSelectedFactura(null)}>
          <div className="modal" onClick={(e)=> e.stopPropagation()}>
            <div className="panel-header" style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
              <h3 style={{display:'flex', alignItems:'center', gap:8}}><FileText size={20}/> Factura {selectedFactura.numero_factura ?? '-'}</h3>
              <span className={`badge ${selectedFactura.enviado_email ? 'badge-success' : 'badge-danger'}`} style={{textTransform:'capitalize'}}>{selectedFactura.enviado_email ? 'enviada' : 'pendiente'}</span>
            </div>
            <div className="grid2" style={{marginTop:12}}>
              <div className="card">
                <h3>Información</h3>
                <div style={{display:'flex', flexDirection:'column', gap:0, marginTop:10}}>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, padding:'8px 0', borderTop:'1px solid #374151'}}>
                    <div style={{display:'flex', alignItems:'center', gap:10}}><Contact size={16}/> <span style={{fontWeight:600, color:'#e5e7eb'}}>ID</span> <span style={{color:'#9ca3af'}}>:</span> {selectedFactura.id_factura ?? selectedFactura.id ?? '-'}</div>
                    <div style={{display:'flex', alignItems:'center', gap:10}}><Receipt size={16}/> <span style={{fontWeight:600, color:'#e5e7eb'}}>Tipo</span> <span style={{color:'#9ca3af'}}>:</span> {selectedFactura.tipo ?? '-'}</div>
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, padding:'8px 0', borderTop:'1px solid #374151'}}>
                    <div style={{display:'flex', alignItems:'center', gap:10}}><Calendar size={16}/> <span style={{fontWeight:600, color:'#e5e7eb'}}>Fecha</span> <span style={{color:'#9ca3af'}}>:</span> {new Date(selectedFactura.fecha_emision ?? Date.now()).toLocaleString()}</div>
                    <div style={{display:'flex', alignItems:'center', gap:10}}><ClipboardList size={16}/> <span style={{fontWeight:600, color:'#e5e7eb'}}>Pedido</span> <span style={{color:'#9ca3af'}}>:</span> {selectedFactura.id_pedido ?? '-'}</div>
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, padding:'8px 0', borderTop:'1px solid #374151'}}>
                    <div style={{display:'flex', alignItems:'center', gap:10}}><User size={16}/> <span style={{fontWeight:600, color:'#e5e7eb'}}>Usuario</span> <span style={{color:'#9ca3af'}}>:</span> {selectedFactura.nombre_usuario ?? '-'}</div>
                    <div style={{display:'flex', alignItems:'center', gap:10}}><User size={16}/> <span style={{fontWeight:600, color:'#e5e7eb'}}>Email</span> <span style={{color:'#9ca3af'}}>:</span> {selectedFactura.email ?? '-'}</div>
                  </div>
                </div>
              </div>
              <div className="card">
                <h3>Totales</h3>
                <div style={{display:'flex', gap:18, flexWrap:'wrap', marginTop:8}}>
                  <div className="stat-box"><b>Subtotal:</b> ${Number(selectedFactura.subtotal ?? 0).toFixed(2)}</div>
                  <div className="stat-box"><b>IVA:</b> ${Number(selectedFactura.iva_total ?? 0).toFixed(2)}</div>
                  <div className="stat-box"><b>Total:</b> ${Number(selectedFactura.total ?? 0).toFixed(2)}</div>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:8, marginTop:8}}>
                  {selectedFactura.enviado_email ? <span style={{display:'inline-flex', alignItems:'center', gap:6, color:'#10b981'}}><MailCheck size={18}/> Email enviado</span> : <span style={{display:'inline-flex', alignItems:'center', gap:6, color:'#f59e0b'}}><MailX size={18}/> Email pendiente</span>}
                </div>
              </div>
            </div>
            <div style={{display:'flex', justifyContent:'flex-end', gap:10, marginTop:14}}>
              <button className="btn" onClick={()=> abrirVistaFactura(selectedFactura.id_factura ?? selectedFactura.id)} title="Generar PDF" aria-label="Generar PDF" style={{background:'#2563eb', color:'#fff', display:'inline-flex', alignItems:'center', gap:8}}><FileText size={18}/></button>
              <button className="btn" onClick={()=> enviarEmail(selectedFactura.id_factura ?? selectedFactura.id)} title="Reenviar email" aria-label="Reenviar email" style={{background:'#2563eb', color:'#fff', display:'inline-flex', alignItems:'center', gap:8}}><Mail size={18}/></button>
              <button className="btn" onClick={()=> { setDetailOpen(false); setSelectedFactura(null) }} style={{background:'#1d4ed8', color:'#fff'}}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
      {previewOpen && (
        <div className="modal-overlay" onClick={()=> { setPreviewOpen(false); setPreviewHtml('') }}>
          <div className="modal" style={{maxWidth:1000}} onClick={(e)=> e.stopPropagation()}>
            <div className="panel-header" style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
              <h3 style={{display:'flex', alignItems:'center', gap:8}}><FileText size={20}/> Vista previa de factura</h3>
            </div>
            <div style={{border:'1px solid #e5e7eb', borderRadius:8, overflow:'hidden', marginTop:12}}>
              <iframe title="vista-factura" srcDoc={previewHtml} style={{width:'100%', height:600, border:0}} />
            </div>
            <div style={{display:'flex', justifyContent:'flex-end', gap:10, marginTop:14}}>
              <button className="btn" onClick={()=> { const f = selectedFactura; const nombre = `factura-${f?.numero_factura||f?.id||'sin'}`; descargarFacturaHTML(nombre) }} style={{background:'#2563eb', color:'#fff'}}>Descargar</button>
              <button className="btn" onClick={()=> { setPreviewOpen(false); setPreviewHtml('') }} style={{background:'#1f2937', color:'#fff'}}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
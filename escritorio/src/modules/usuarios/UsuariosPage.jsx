import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Users as UsersIcon, Eye, Pencil, ChevronsLeft, ChevronLeft, ChevronRight } from 'lucide-react'

export default function UsuariosPage() {
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'
  const token = sessionStorage.getItem('token')
  const me = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem('user') || '{}') } catch { return {} }
  }, [])
  const client = useMemo(() => {
    const c = axios.create({ baseURL: API_BASE })
    c.interceptors.request.use((config) => {
      if (token) config.headers.Authorization = `Bearer ${token}`
      config.headers.Accept = 'application/json'
      return config
    })
    return c
  }, [API_BASE, token])

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [viewing, setViewing] = useState(null)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ rol:'cliente', nombre_usuario:'', email:'', password:'', confirmPassword:'', nombre:'', apellido:'', telefono:'', dni:'', direccion:'', ciudad:'', provincia:'', pais:'', codigo_postal:'', fecha_nacimiento:'', cargo:'' })
  const [createErrors, setCreateErrors] = useState({})
  const [createMsg, setCreateMsg] = useState('')
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await client.get(`/admin/users/list`, { params: { page, limit } })
      let list = Array.isArray(data?.data) ? data.data : (Array.isArray(data?.users) ? data.users : (Array.isArray(data) ? data : []))
      try {
        const needs = list.filter(u => {
          const rol = String(u?.rol || u?.role || '').toLowerCase()
          const idc = Number(u?.id_cliente)
          return rol === 'cliente' && !(Number.isFinite(idc) && idc > 0)
        })
        if (needs.length) {
          const results = await Promise.allSettled(needs.map(u => {
            const id = u?.id_usuario || u?.id || u?.usuario_id
            return client.get(`/users/profile/${id}`)
          }))
          const byId = {}
          results.forEach((r, i) => {
            if (r.status === 'fulfilled') {
              const d = r.value?.data?.data ?? r.value?.data ?? {}
              const idc = d?.id_cliente ?? d?.perfil?.id_cliente ?? d?.cliente?.id_cliente ?? null
              const idu = needs[i]?.id_usuario || needs[i]?.id || needs[i]?.usuario_id
              if (Number.isFinite(Number(idu))) byId[String(idu)] = Number(idc) || null
            }
          })
          list = list.map(u => {
            const idu = u?.id_usuario || u?.id || u?.usuario_id
            const idc = byId[String(idu)]
            return (idc && !u?.id_cliente) ? { ...u, id_cliente: idc } : u
          })
        }
      } catch {}
      try {
        const enrich = list.filter(u => {
          const n = String(u?.nombre||'').trim(); const a = String(u?.apellido||'').trim();
          return !(n && a)
        })
        if (enrich.length) {
          const results = await Promise.allSettled(enrich.map(u => {
            const id = u?.id_usuario || u?.id || u?.usuario_id
            return client.get(`/users/profile/${id}`)
          }))
          const mergedById = {}
          results.forEach((r, i) => {
            if (r.status === 'fulfilled') {
              const pre = r.value?.data?.data ?? r.value?.data ?? {}
              const base = (pre?.perfil ?? pre?.user ?? pre) || {}
              const idu = enrich[i]?.id_usuario || enrich[i]?.id || enrich[i]?.usuario_id
              mergedById[String(idu)] = base
            }
          })
          const adminExtra = await Promise.allSettled(enrich.map(async (u) => {
            const rol = String(u?.rol || u?.role || '').toLowerCase()
            const id = u?.id_usuario || u?.id || u?.usuario_id
            if (rol === 'admin' || rol === 'superadmin') {
              try { const ar = await client.get(`/users/profile/admin/${id}`); return { id, data: (ar?.data?.data ?? ar?.data ?? {}) } } catch { return { id, data: {} } }
            }
            return { id, data: {} }
          }))
          adminExtra.forEach(r => { const id = r?.value?.id; const d = r?.value?.data || {}; if (id) mergedById[String(id)] = { ...(mergedById[String(id)]||{}), ...d } })
          list = list.map(u => {
            const idu = u?.id_usuario || u?.id || u?.usuario_id
            const m = mergedById[String(idu)] || {}
            const nombre = String(m?.nombre || u?.nombre || '').trim()
            const apellido = String(m?.apellido || u?.apellido || '').trim()
            return (nombre || apellido) ? { ...u, nombre, apellido } : u
          })
        }
      } catch {}
      setUsers(list)
      const totalVal = Number(data?.total ?? data?.count ?? data?.meta?.total)
      if (Number.isFinite(totalVal) && totalVal > 0) {
        setTotal(totalVal)
        const pagesCalc = Math.max(1, Math.ceil(totalVal / Number(limit||10)))
        setHasMore(page < pagesCalc)
      } else {
        setTotal(list.length)
        setHasMore(list.length === Number(limit||10))
      }
      } catch (e) {
        try {
          const { data } = await client.get('/users')
          let list = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
        try {
          const needs = list.filter(u => {
            const rol = String(u?.rol || u?.role || '').toLowerCase()
            const idc = Number(u?.id_cliente)
            return rol === 'cliente' && !(Number.isFinite(idc) && idc > 0)
          })
          if (needs.length) {
            const results = await Promise.allSettled(needs.map(u => {
              const id = u?.id_usuario || u?.id || u?.usuario_id
              return client.get(`/users/profile/${id}`)
            }))
            const byId = {}
            results.forEach((r, i) => {
              if (r.status === 'fulfilled') {
                const d = r.value?.data?.data ?? r.value?.data ?? {}
                const idc = d?.id_cliente ?? d?.perfil?.id_cliente ?? d?.cliente?.id_cliente ?? null
                const idu = needs[i]?.id_usuario || needs[i]?.id || needs[i]?.usuario_id
                if (Number.isFinite(Number(idu))) byId[String(idu)] = Number(idc) || null
              }
            })
            list = list.map(u => {
              const idu = u?.id_usuario || u?.id || u?.usuario_id
              const idc = byId[String(idu)]
              return (idc && !u?.id_cliente) ? { ...u, id_cliente: idc } : u
            })
          }
        } catch {}
        try {
          const enrich = list.filter(u => {
            const n = String(u?.nombre||'').trim(); const a = String(u?.apellido||'').trim();
            return !(n && a)
          })
          if (enrich.length) {
            const results = await Promise.allSettled(enrich.map(u => {
              const id = u?.id_usuario || u?.id || u?.usuario_id
              return client.get(`/users/profile/${id}`)
            }))
            const mergedById = {}
            results.forEach((r, i) => {
              if (r.status === 'fulfilled') {
                const pre = r.value?.data?.data ?? r.value?.data ?? {}
                const base = (pre?.perfil ?? pre?.user ?? pre) || {}
                const idu = enrich[i]?.id_usuario || enrich[i]?.id || enrich[i]?.usuario_id
                mergedById[String(idu)] = base
              }
            })
            const adminExtra = await Promise.allSettled(enrich.map(async (u) => {
              const rol = String(u?.rol || u?.role || '').toLowerCase()
              const id = u?.id_usuario || u?.id || u?.usuario_id
              if (rol === 'admin' || rol === 'superadmin') {
                try { const ar = await client.get(`/users/profile/admin/${id}`); return { id, data: (ar?.data?.data ?? ar?.data ?? {}) } } catch { return { id, data: {} } }
              }
              return { id, data: {} }
            }))
            adminExtra.forEach(r => { const id = r?.value?.id; const d = r?.value?.data || {}; if (id) mergedById[String(id)] = { ...(mergedById[String(id)]||{}), ...d } })
            list = list.map(u => {
              const idu = u?.id_usuario || u?.id || u?.usuario_id
              const m = mergedById[String(idu)] || {}
              const nombre = String(m?.nombre || u?.nombre || '').trim()
              const apellido = String(m?.apellido || u?.apellido || '').trim()
              return (nombre || apellido) ? { ...u, nombre, apellido } : u
            })
          }
        } catch {}
        setUsers(list)
        setTotal(Array.isArray(list) ? list.length : 0)
        setHasMore(false)
      } catch (err) {
        setError('No se pudieron cargar usuarios')
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { loadUsers() }, [page])

  const viewUser = async (u) => {
    setError('')
    setViewing({ loading: true, data: null })
    try {
      const id = u?.id_usuario || u?.id || u?.usuario_id
      const base = await client.get(`/users/profile/${id}`)
      const pre = base?.data?.data ?? base?.data ?? {}
      const rootObj = (pre && typeof pre === 'object') ? pre : {}
      const perfilBase = (rootObj.perfil ?? rootObj.user ?? rootObj)
      const rol = String((perfilBase && typeof perfilBase==='object' ? (perfilBase.rol ?? perfilBase.role) : (u?.rol ?? u?.role)) || '').toLowerCase()
      let extra = {}
      if (rol === 'cliente') {
        const idc = Number((perfilBase && typeof perfilBase==='object' ? perfilBase.id_cliente : undefined) ?? u?.id_cliente)
        if (Number.isFinite(idc) && idc > 0) {
          try { const cr = await client.get(`/users/profile/cliente/${idc}`); extra = cr?.data?.data ?? cr?.data ?? {} } catch {}
        }
      } else if (rol === 'admin' || rol === 'superadmin') {
        try { const ar = await client.get(`/users/profile/admin/${id}`); extra = ar?.data?.data ?? ar?.data ?? {} } catch {}
      }
      let merged = { ...(perfilBase && typeof perfilBase==='object' ? perfilBase : {}), ...(extra && typeof extra==='object' ? extra : {}) }
      try {
        const ru = await client.get('/users')
        const uj = ru?.data
        const arru = Array.isArray(uj?.data) ? uj.data : (Array.isArray(uj) ? uj : [])
        const uid = u?.id_usuario || u?.id || id
        const baseUser = arru.find(x => String(x.id_usuario ?? x.id) === String(uid)) || {}
        merged = { ...baseUser, ...merged }
      } catch {}
      if (pre && typeof pre === 'object') {
        if (pre.cliente && typeof pre.cliente === 'object') merged = { ...pre.cliente, ...merged }
        if (pre.admin && typeof pre.admin === 'object') merged = { ...pre.admin, ...merged }
      }
      setViewing({ loading: false, data: merged })
    } catch { setViewing({ loading: false, data: null }); setError('No se pudo obtener el perfil') }
  }

  const openEdit = async (u) => {
    const id = u?.id_usuario || u?.id || u?.usuario_id
    let merged = { ...(u || {}) }
    try {
      const base = await client.get(`/users/profile/${id}`)
      const pre = base?.data?.data ?? base?.data ?? {}
      const rootObj = (pre && typeof pre === 'object') ? pre : {}
      const perfilBase = (rootObj.perfil ?? rootObj.user ?? rootObj)
      const rol = String((perfilBase && typeof perfilBase==='object' ? (perfilBase.rol ?? perfilBase.role) : (u?.rol ?? u?.role)) || '').toLowerCase()
      let extra = {}
      if (rol === 'cliente') {
        const idc = Number((perfilBase && typeof perfilBase==='object' ? perfilBase.id_cliente : undefined) ?? u?.id_cliente)
        if (Number.isFinite(idc) && idc > 0) {
          try { const cr = await client.get(`/users/profile/cliente/${idc}`); extra = cr?.data?.data ?? cr?.data ?? {} } catch {}
        }
        merged.id_cliente = Number.isFinite(idc) && idc>0 ? idc : (merged.id_cliente ?? null)
      } else if (rol === 'admin' || rol === 'superadmin') {
        try { const ar = await client.get(`/users/profile/admin/${id}`); extra = ar?.data?.data ?? ar?.data ?? {} } catch {}
      }
      merged = { ...merged, ...(perfilBase && typeof perfilBase==='object' ? perfilBase : {}), ...(extra && typeof extra==='object' ? extra : {}) }
      try {
        const ru = await client.get('/users')
        const arru = Array.isArray(ru?.data?.data) ? ru.data.data : (Array.isArray(ru?.data) ? ru.data : [])
        const baseUser = arru.find(x => String(x.id_usuario ?? x.id) === String(id)) || {}
        merged = { ...baseUser, ...merged }
      } catch {}
    } catch {}
    const base = {
      id_usuario: merged?.id_usuario || merged?.id || null,
      id_cliente: merged?.id_cliente ?? null,
      nombre_usuario: merged?.nombre_usuario || merged?.username || '',
      email: merged?.email || '',
      estado: merged?.estado || 'activo',
      dni: merged?.dni || merged?.documento || '',
      nombre: (merged?.nombre || merged?.nombre_usuario || merged?.username || ''),
      apellido: merged?.apellido || '',
      telefono: merged?.telefono || merged?.telephone || '',
      direccion: merged?.direccion || merged?.calle || '',
      ciudad: merged?.ciudad || merged?.localidad || '',
      provincia: merged?.provincia || '',
      pais: merged?.pais || '',
      codigo_postal: merged?.codigo_postal || merged?.cp || '',
      fecha_nacimiento: merged?.fecha_nacimiento || '',
      cargo: merged?.cargo || ''
    }
    setEditing({ original: merged, form: base })
  }

  const saveEdit = async () => {
    if (!editing) return
    setSaving(true)
    setError('')
    try {
      const u = editing.original
      const form = editing.form
      const rol = u?.rol || u?.role
      if (rol === 'cliente' && !form.id_cliente && (form.id_usuario || u?.id_usuario || u?.id)) {
        try {
          const id = form.id_usuario || u?.id_usuario || u?.id
          const { data } = await client.get(`/users/profile/${id}`)
          const d = data?.data ?? data ?? {}
          const idc = d?.id_cliente ?? d?.perfil?.id_cliente ?? d?.cliente?.id_cliente ?? null
          if (Number.isFinite(Number(idc)) && Number(idc) > 0) editing.form.id_cliente = Number(idc)
        } catch {}
      }
      const orig = u || {}
      const diff = {}
      const keysAdmin = ['nombre','apellido','email','telefono','dni','nombre_usuario','cargo']
      const keysCliente = ['nombre','apellido','email','telefono','dni','direccion','ciudad','provincia','pais','codigo_postal','fecha_nacimiento','nombre_usuario']
      const keys = (String(rol).toLowerCase()==='cliente') ? keysCliente : keysAdmin
      for (const k of keys) { if (form[k] !== orig[k]) diff[k] = form[k] }
      if (me?.id_usuario && u?.id_usuario === me.id_usuario && (rol === 'admin' || rol === 'superadmin')) {
        const payload = {}
        if ('nombre' in diff) payload.nombre = diff.nombre
        if ('nombre_usuario' in diff) payload.nombre_usuario = diff.nombre_usuario
        if ('email' in diff) payload.email = diff.email
        if ('telefono' in diff) payload.telefono = diff.telefono
        if (Object.keys(payload).length===0) { setEditing(null); await loadUsers(); setSaving(false); return }
        const { data } = await client.put('/users/profile', payload)
        if (!data) throw new Error('Perfil no guardado')
      } else if (rol === 'cliente' && form.id_cliente) {
        const { data } = await client.put(`/users/profile/cliente/${form.id_cliente}`, diff)
        if (!data) throw new Error('Cliente no guardado')
      } else if (rol === 'admin' && form.id_usuario) {
        const payload = {}
        for (const k of ['nombre','apellido','email','telefono','dni','nombre_usuario','cargo']) { if (k in diff) payload[k] = diff[k] }
        if (Object.keys(payload).length===0) { setEditing(null); await loadUsers(); setSaving(false); return }
        const { data } = await client.put(`/users/profile/admin/${form.id_usuario}`, payload)
        if (!data) throw new Error('Admin no guardado')
      } else {
        throw new Error('No se pudo determinar el flujo de edición')
      }
      setEditing(null)
      await loadUsers()
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'No se pudo guardar')
    } finally { setSaving(false) }
  }

  const toggleStatus = async (u) => {
    setError('')
    try {
      const id = u?.id_usuario || u?.id
      const next = (u?.estado === 'activo') ? 'inactivo' : 'activo'
      const rol = String(u?.rol || u?.role || '').toLowerCase()
      let done = false
      if (rol === 'admin' && String(me?.rol).toLowerCase()==='superadmin') {
        try { const r = await client.put(`/superadmin/admin/${id}/status`, { estado: next }); if (r?.data) done = true } catch {}
      }
      if (!done && rol === 'cliente') {
        try {
          if (next === 'inactivo') { const r = await client.delete(`/users/${id}`); if (r?.data) done = true }
        } catch {}
      }
      if (!done) { await client.put(`/admin/users/${id}/status`, { estado: next }) }
      await loadUsers()
    } catch { setError('No se pudo cambiar el estado') }
  }

  const changeRole = async (u, nextRole) => {
    setError('')
    try {
      const id = u?.id_usuario || u?.id
      await client.put(`/admin/users/${id}/role`, { rol: nextRole })
      await loadUsers()
    } catch { setError('No se pudo cambiar el rol') }
  }

  const canPrev = page > 1

  return (
    <div className="productos-module">
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <h1 style={{display:'flex', alignItems:'center', gap:8, color:'#3b82f6'}}><UsersIcon size={22}/> Gestión de Usuarios</h1>
        {(me?.rol==='superadmin' || me?.rol==='admin') && (
          <button className="btn" onClick={()=>{ setShowCreate(true); setCreateForm({ rol: (me?.rol==='superadmin' ? 'admin' : 'cliente'), nombre_usuario:'', email:'', password:'', confirmPassword:'', nombre:'', apellido:'', telefono:'', dni:'', direccion:'', ciudad:'', provincia:'', pais:'', codigo_postal:'' }); setCreateErrors({}); setCreateMsg('') }} style={{background:'#2563eb', color:'#fff'}}>Nuevo Usuario</button>
        )}
      </div>
      {error && !showCreate && <div className="error-box" style={{marginBottom:10}}>{error}</div>}
      {loading ? (
        <div>Cargando usuarios...</div>
      ) : (
        <div>
          <div className="table" style={{marginTop:12}}>
            <table style={{width:'100%'}}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => {
                  const id = u?.id_usuario || u?.id || idx
                  const rol = u?.rol || u?.role || 'cliente'
                  const puedeRol = (me?.rol === 'superadmin') || (me?.rol === 'admin' && String(rol) !== 'superadmin')
                  const isActive = u?.estado === 'activo'
                  const realName = [u?.nombre, u?.apellido].filter(Boolean).join(' ').trim()
                  const displayName = realName || (u?.email || '-')
                  return (
                    <tr key={id}>
                      <td style={{whiteSpace:'nowrap'}}>{id}</td>
                      <td style={{maxWidth:200, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}} title={displayName}>{displayName}</td>
                      <td style={{maxWidth:200, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}} title={u?.nombre_usuario ?? u?.username ?? '-'}>{u?.nombre_usuario ?? u?.username ?? '-'}</td>
                      <td style={{maxWidth:240, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}} title={u?.email || ''}>{u?.email}</td>
                      <td style={{whiteSpace:'nowrap'}} title={rol}>{rol}</td>
                      <td style={{whiteSpace:'nowrap'}}>{isActive ? (<span className="badge badge-success">activo</span>) : (<span className="badge badge-danger">inactivo</span>)}</td>
                      <td style={{minWidth:360, whiteSpace:'nowrap'}}>
                        <div className="actions" style={{display:'inline-flex', alignItems:'center', gap:4, flexWrap:'nowrap', overflow:'visible'}}>
                          <button className="btn btn-view" onClick={()=>viewUser(u)} title="Ver" aria-label="Ver" style={{display:'inline-flex', alignItems:'center', gap:4, padding:'4px 6px', height:30, fontSize:11}}><Eye size={11}/> Ver</button>
                          <button className="btn" onClick={()=>openEdit(u)} title="Editar" aria-label="Editar" style={{background:'#2563eb', color:'#fff', display:'inline-flex', alignItems:'center', gap:4, padding:'4px 6px', height:30, fontSize:11}}><Pencil size={11}/> Editar</button>
                          <button className="btn" onClick={()=>toggleStatus(u)} style={{background:'#2563eb', color:'#fff', padding:'4px 6px', height:30, fontSize:11}}>{isActive?'Desact.':'Activar'}</button>
                          {puedeRol && (
                            <select defaultValue={rol} onChange={(e)=>changeRole(u,e.target.value)} style={{marginLeft:6, width:100, background:'#111827', color:'#E5E7EB', border:'1px solid #1E2330', borderRadius:10, height:30, padding:'0 6px', WebkitAppearance:'none', MozAppearance:'none', appearance:'none', fontSize:11}}>
                              {me?.rol === 'superadmin' ? (
                                <>
                                  <option value="cliente">cliente</option>
                                  <option value="admin">admin</option>
                                  <option value="superadmin">superadmin</option>
                                </>
                              ) : (
                                <>
                                  <option value="cliente">cliente</option>
                                  <option value="admin">admin</option>
                                </>
                              )}
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {(() => { const pages = Math.max(1, Math.ceil(Number(total||0) / Number(limit||10))); const canPrevLocal = page > 1; const canNextLocal = hasMore; return (
            <div style={{display:'flex', alignItems:'center', justifyContent:'flex-start', gap:12, marginTop:12}}>
              <div style={{color:'#374151'}}>Página {page}{Number(total)>0 ? ` de ${pages}` : ''}</div>
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <button className="btn" onClick={()=>setPage(1)} disabled={!canPrevLocal} style={{background:'#2563eb', color:'#fff'}}><ChevronsLeft size={16}/></button>
                <button className="btn" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={!canPrevLocal} style={{background:'#2563eb', color:'#fff'}}><ChevronLeft size={16}/></button>
                <span style={{minWidth:80, textAlign:'center'}}>Página {page}</span>
                <button className="btn" onClick={()=>setPage(p=>p+1)} disabled={!canNextLocal} style={{background:'#2563eb', color:'#fff'}}><ChevronRight size={16}/></button>
              </div>
            </div>
          ) })()}
        </div>
      )}

      {viewing && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Perfil</h3>
            {viewing.loading ? <div>Cargando...</div> : viewing.data ? (() => {
              const d = viewing.data || {}
              const val = (x) => {
                if (x==null) return ''
                const s = String(x)
                return s.trim().length>0 && s !== '-' ? s : ''
              }
              const cuentaPairs = [
                ['ID', val(d.id_usuario ?? d.id)],
                ['Usuario', val(d.nombre_usuario ?? d.username)],
                ['Email', val(d.email)],
                ['Rol', val(d.rol ?? d.role)],
                ['Estado', val(d.estado)],
                ['Registro', (d.fecha_registro ? new Date(d.fecha_registro).toLocaleString() : '')],
                ['Último login', (d.ultimo_login ? new Date(d.ultimo_login).toLocaleString() : '')]
              ].filter(([_, v]) => v)
              const perfilPairs = [
                ['Nombre', val(d.nombre)],
                ['Apellido', val(d.apellido)],
                ['DNI', val(d.dni ?? d.documento)],
                ['Teléfono', val(d.telefono ?? d.telephone)]
              ].filter(([_, v]) => v)
              const dirPairs = [
                ['Dirección', val(d.direccion ?? d.calle)],
                ['Ciudad', val(d.ciudad ?? d.localidad)],
                ['Provincia', val(d.provincia)],
                ['País', val(d.pais)],
                ['Código postal', val(d.codigo_postal ?? d.cp)]
              ].filter(([_, v]) => v)
              return (
                <div className="grid2">
                  {cuentaPairs.length>0 && (
                    <div className="card">
                      <h4 style={{marginTop:0}}>Cuenta</h4>
                      <div style={{display:'grid', gridTemplateColumns:'140px 1fr', rowGap:8, columnGap:12}}>
                        {cuentaPairs.map(([k,v], idx) => (
                          <React.Fragment key={'c-'+idx}>
                            <div><b>{k}</b></div><div>{k==='Rol' ? (<span className="badge badge-neutral">{v}</span>) : (k==='Estado' ? (v==='activo' ? (<span className="badge badge-success">activo</span>) : (<span className="badge badge-danger">inactivo</span>)) : v)}</div>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}
                  {perfilPairs.length>0 && (
                    <div className="card">
                      <h4 style={{marginTop:0}}>Perfil</h4>
                      <div style={{display:'grid', gridTemplateColumns:'140px 1fr', rowGap:8, columnGap:12}}>
                        {perfilPairs.map(([k,v], idx) => (
                          <React.Fragment key={'p-'+idx}>
                            <div><b>{k}</b></div><div>{v}</div>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}
                  {dirPairs.length>0 && (
                    <div className="card" style={{gridColumn:'1 / -1'}}>
                      <h4 style={{marginTop:0}}>Dirección</h4>
                      <div style={{display:'grid', gridTemplateColumns:'140px 1fr', rowGap:8, columnGap:12}}>
                        {dirPairs.map(([k,v], idx) => (
                          <React.Fragment key={'d-'+idx}>
                            <div><b>{k}</b></div><div>{v}</div>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })() : <div>No disponible</div>}
            <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:12}}>
              <button className="btn" onClick={()=>setViewing(null)} style={{background:'#2563eb', color:'#fff'}}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="modal-overlay">
          <div className="modal" style={{width:'760px', maxWidth:'95vw', maxHeight:'85vh', overflowY:'auto'}}>
            <h3>Editar Usuario</h3>
            <div className="form-group"><label>Nombre</label><input value={editing.form.nombre||''} onChange={(e)=>setEditing(s=>({ ...s, form:{...s.form, nombre:e.target.value} }))} /></div>
            <div className="form-group"><label>Apellido</label><input value={editing.form.apellido||''} onChange={(e)=>setEditing(s=>({ ...s, form:{...s.form, apellido:e.target.value} }))} /></div>
            <div className="form-group"><label>Nombre de usuario</label><input value={editing.form.nombre_usuario||''} onChange={(e)=>setEditing(s=>({ ...s, form:{...s.form, nombre_usuario:e.target.value} }))} /></div>
            <div className="form-group"><label>DNI</label><input value={editing.form.dni||''} onChange={(e)=>setEditing(s=>({ ...s, form:{...s.form, dni:e.target.value} }))} /></div>
            <div className="form-group"><label>Email</label><input type="email" value={editing.form.email||''} onChange={(e)=>setEditing(s=>({ ...s, form:{...s.form, email:e.target.value} }))} /></div>
            <div className="form-group"><label>Teléfono</label><input value={editing.form.telefono||''} onChange={(e)=>setEditing(s=>({ ...s, form:{...s.form, telefono:e.target.value} }))} /></div>
            <div className="form-group"><label>Dirección</label><input value={editing.form.direccion||''} onChange={(e)=>setEditing(s=>({ ...s, form:{...s.form, direccion:e.target.value} }))} /></div>
            <div className="form-group"><label>Ciudad</label><input value={editing.form.ciudad||''} onChange={(e)=>setEditing(s=>({ ...s, form:{...s.form, ciudad:e.target.value} }))} /></div>
            <div className="form-group"><label>Provincia</label><input value={editing.form.provincia||''} onChange={(e)=>setEditing(s=>({ ...s, form:{...s.form, provincia:e.target.value} }))} /></div>
            <div className="form-group"><label>País</label><input value={editing.form.pais||''} onChange={(e)=>setEditing(s=>({ ...s, form:{...s.form, pais:e.target.value} }))} /></div>
            <div className="form-group"><label>Código postal</label><input value={editing.form.codigo_postal||''} onChange={(e)=>setEditing(s=>({ ...s, form:{...s.form, codigo_postal:e.target.value} }))} /></div>
            <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
              <button className="btn" onClick={()=>setEditing(null)} disabled={saving} style={{background:'#1f2937', color:'#fff'}}>Cancelar</button>
              <button className="btn" onClick={saveEdit} disabled={saving} style={{background:'#2563eb', color:'#fff'}}>{saving?'Guardando...':'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay">
          <div className="modal" style={{width:'760px', maxWidth:'95vw', maxHeight:'85vh', overflowY:'auto'}}>
            <h3>Nuevo Usuario</h3>
            {createMsg && <div className="error-box" style={{marginBottom:10}}>{createMsg}</div>}
            <div className="form-group"><label>Rol</label><select value={createForm.rol} onChange={(e)=> setCreateForm(f=>({ ...f, rol: e.target.value }))}>
              {me?.rol==='superadmin' ? (<><option value="admin">admin</option><option value="cliente">cliente</option></>) : (<option value="cliente">cliente</option>)}
            </select></div>
            <div className="form-group"><label>Nombre de usuario</label><input value={createForm.nombre_usuario||''} onChange={(e)=> setCreateForm(f=>({ ...f, nombre_usuario: e.target.value }))} style={createErrors.nombre_usuario?{borderColor:'#ef4444'}:{}} />{createErrors.nombre_usuario && <div style={{color:'#ef4444', fontSize:12, marginTop:4}}>{createErrors.nombre_usuario}</div>}</div>
            <div className="form-group"><label>Email</label><input type="email" value={createForm.email||''} onChange={(e)=> setCreateForm(f=>({ ...f, email: e.target.value }))} style={createErrors.email?{borderColor:'#ef4444'}:{}} />{createErrors.email && <div style={{color:'#ef4444', fontSize:12, marginTop:4}}>{createErrors.email}</div>}</div>
            <div className="form-group"><label>Contraseña</label><input type="password" value={createForm.password||''} onChange={(e)=> setCreateForm(f=>({ ...f, password: e.target.value }))} placeholder="Auto si se deja vacío" /></div>
            <div className="form-group"><label>Confirmar contraseña</label><input type="password" value={createForm.confirmPassword||''} onChange={(e)=> setCreateForm(f=>({ ...f, confirmPassword: e.target.value }))} placeholder="Auto si se deja vacío" /></div>
            <div className="form-group"><label>Nombre</label><input value={createForm.nombre||''} onChange={(e)=> setCreateForm(f=>({ ...f, nombre: e.target.value }))} style={createErrors.nombre?{borderColor:'#ef4444'}:{}} />{createErrors.nombre && <div style={{color:'#ef4444', fontSize:12, marginTop:4}}>{createErrors.nombre}</div>}</div>
            <div className="form-group"><label>Apellido</label><input value={createForm.apellido||''} onChange={(e)=> setCreateForm(f=>({ ...f, apellido: e.target.value }))} style={createErrors.apellido?{borderColor:'#ef4444'}:{}} />{createErrors.apellido && <div style={{color:'#ef4444', fontSize:12, marginTop:4}}>{createErrors.apellido}</div>}</div>
            <div className="form-group"><label>DNI</label><input value={createForm.dni||''} onChange={(e)=> setCreateForm(f=>({ ...f, dni: e.target.value }))} style={createErrors.dni?{borderColor:'#ef4444'}:{}} />{createErrors.dni && <div style={{color:'#ef4444', fontSize:12, marginTop:4}}>{createErrors.dni}</div>}</div>
            <div className="form-group"><label>Teléfono</label><input value={createForm.telefono||''} onChange={(e)=> setCreateForm(f=>({ ...f, telefono: e.target.value }))} style={createErrors.telefono?{borderColor:'#ef4444'}:{}} />{createErrors.telefono && <div style={{color:'#ef4444', fontSize:12, marginTop:4}}>{createErrors.telefono}</div>}</div>
            {createForm.rol === 'admin' && (
              <div className="form-group"><label>Cargo</label><input value={createForm.cargo||''} onChange={(e)=> setCreateForm(f=>({ ...f, cargo: e.target.value }))} style={createErrors.cargo?{borderColor:'#ef4444'}:{}} />{createErrors.cargo && <div style={{color:'#ef4444', fontSize:12, marginTop:4}}>{createErrors.cargo}</div>}</div>
            )}
            <>
              <div className="form-group"><label>Dirección</label><input value={createForm.direccion||''} onChange={(e)=> setCreateForm(f=>({ ...f, direccion: e.target.value }))} style={createErrors.direccion?{borderColor:'#ef4444'}:{}} />{createErrors.direccion && <div style={{color:'#ef4444', fontSize:12, marginTop:4}}>{createErrors.direccion}</div>}</div>
              <div className="form-group"><label>Ciudad</label><input value={createForm.ciudad||''} onChange={(e)=> setCreateForm(f=>({ ...f, ciudad: e.target.value }))} style={createErrors.ciudad?{borderColor:'#ef4444'}:{}} />{createErrors.ciudad && <div style={{color:'#ef4444', fontSize:12, marginTop:4}}>{createErrors.ciudad}</div>}</div>
              <div className="form-group"><label>Provincia</label><input value={createForm.provincia||''} onChange={(e)=> setCreateForm(f=>({ ...f, provincia: e.target.value }))} style={createErrors.provincia?{borderColor:'#ef4444'}:{}} />{createErrors.provincia && <div style={{color:'#ef4444', fontSize:12, marginTop:4}}>{createErrors.provincia}</div>}</div>
              <div className="form-group"><label>País</label><input value={createForm.pais||''} onChange={(e)=> setCreateForm(f=>({ ...f, pais: e.target.value }))} style={createErrors.pais?{borderColor:'#ef4444'}:{}} />{createErrors.pais && <div style={{color:'#ef4444', fontSize:12, marginTop:4}}>{createErrors.pais}</div>}</div>
              <div className="form-group"><label>Código postal</label><input value={createForm.codigo_postal||''} onChange={(e)=> setCreateForm(f=>({ ...f, codigo_postal: e.target.value }))} style={createErrors.codigo_postal?{borderColor:'#ef4444'}:{}} />{createErrors.codigo_postal && <div style={{color:'#ef4444', fontSize:12, marginTop:4}}>{createErrors.codigo_postal}</div>}</div>
              <div className="form-group"><label>Fecha de nacimiento</label><input type="date" value={createForm.fecha_nacimiento||''} onChange={(e)=> setCreateForm(f=>({ ...f, fecha_nacimiento: e.target.value }))} /></div>
            </>
            <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
              <button className="btn" onClick={()=> setShowCreate(false)} disabled={creating} style={{background:'#1f2937', color:'#fff'}}>Cancelar</button>
              <button className="btn" onClick={async () => {
                setError(''); setCreating(true)
                try {
                  const errs = {}
                  const emailOk = String(createForm.email||'').trim().match(/^\S+@\S+\.\S+$/)
                  if (!createForm.nombre_usuario) errs.nombre_usuario = 'Requerido'
                  if (!emailOk) errs.email = 'Email inválido'
                  if (createForm.rol === 'cliente') {
                    for (const k of ['nombre','apellido','dni','telefono','direccion','ciudad','provincia','pais','codigo_postal']) {
                      if (!String(createForm[k]||'').trim()) errs[k] = 'Requerido'
                    }
                  } else if (createForm.rol === 'admin') {
                    for (const k of ['nombre','apellido','dni','telefono','cargo']) {
                      if (!String(createForm[k]||'').trim()) errs[k] = 'Requerido'
                    }
                  }
                  setCreateErrors(errs)
                  if (Object.keys(errs).length) { setCreateMsg('Completa los campos obligatorios'); throw new Error('VALIDATION') }
                  const genPass = () => Math.random().toString(36).slice(2,10) + 'A1!'
                  const pwd = createForm.password && createForm.password.length>=6 ? createForm.password : genPass()
                  const cpwd = createForm.confirmPassword && createForm.confirmPassword.length>=6 ? createForm.confirmPassword : pwd
                  const base = { email: String(createForm.email||'').trim(), password: pwd, confirmPassword: cpwd, nombre_usuario: String(createForm.nombre_usuario||'').trim() || null, rol: createForm.rol }
                  const payload = (() => {
                    if (createForm.rol === 'admin') {
                      return { ...base, nombre: createForm.nombre||'', apellido: createForm.apellido||'', telefono: createForm.telefono||'', dni: createForm.dni||'', cargo: createForm.cargo||'', direccion: createForm.direccion||'', ciudad: createForm.ciudad||'', provincia: createForm.provincia||'', pais: createForm.pais||'', codigo_postal: createForm.codigo_postal||'', fecha_nacimiento: createForm.fecha_nacimiento||'' }
                    } else {
                      return { ...base, nombre: createForm.nombre||'', apellido: createForm.apellido||'', telefono: createForm.telefono||'', dni: createForm.dni||'', direccion: createForm.direccion||'', ciudad: createForm.ciudad||'', provincia: createForm.provincia||'', pais: createForm.pais||'', codigo_postal: createForm.codigo_postal||'', fecha_nacimiento: createForm.fecha_nacimiento||'' }
                    }
                  })()
                  const url = (createForm.rol==='admin' || createForm.rol==='superadmin') ? '/superadmin/register-admin' : '/users/register'
                  const r = await client.post(url, payload, { headers: { 'Content-Type': 'application/json' } })
                  const data = r?.data?.data ?? r?.data
                  if (!data) throw new Error('No se pudo crear usuario')
                  setShowCreate(false)
                  await new Promise(res => setTimeout(res, 300))
                  await loadUsers()
                } catch (e) {
                  const status = e?.response?.status
                  const msg = e?.response?.data?.error || e?.response?.data?.message || e?.message || 'Error al crear usuario'
                  if (String(e?.message||'') === 'VALIDATION') {
                  } else if (status === 409) {
                    const lower = String(msg||'').toLowerCase()
                    const errs = { ...createErrors }
                    if (lower.includes('email')) errs.email = 'Email ya registrado'
                    if (lower.includes('usuario') || lower.includes('username')) errs.nombre_usuario = 'Nombre de usuario en uso'
                    if (lower.includes('dni')) errs.dni = 'DNI ya registrado'
                    setCreateErrors(errs)
                    setCreateMsg(msg)
                  } else {
                    setCreateMsg(msg)
                    try {
                      const { data } = await client.get('/admin/users/list', { params: { page: 1, limit: 200 } })
                      const list = Array.isArray(data?.data) ? data.data : (Array.isArray(data?.users) ? data.users : (Array.isArray(data) ? data : []))
                      const found = list.find(u => String(u.email||'').toLowerCase() === String(createForm.email||'').toLowerCase() || String(u.nombre_usuario||u.username||'').toLowerCase() === String(createForm.nombre_usuario||'').toLowerCase())
                      if (found) {
                        setShowCreate(false)
                        await loadUsers()
                        setCreateMsg('Usuario creado, pero la respuesta fue inválida. Lista actualizada.')
                      }
                    } catch {}
                  }
                }
                finally { setCreating(false) }
              }} disabled={creating} style={{background:'#2563eb', color:'#fff'}}>{creating?'Creando...':'Crear'}</button>
            </div>
            {createMsg && <div className="error-box" style={{marginTop:10}}>{createMsg}</div>}
          </div>
        </div>
      )}
    </div>
  )
}
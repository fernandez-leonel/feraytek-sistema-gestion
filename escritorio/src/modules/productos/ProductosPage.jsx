import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Search, Plus, Pencil, Eye, Ban, ChevronLeft, ChevronRight, ChevronsLeft, Package } from 'lucide-react'
import { productosService } from '../../services/productosService'
import { categoriasService } from '../../services/categoriasService'
import { productosStats } from '../../services/productosStats'
import ProductoFormModal from './ProductoFormModal'
import ProductoDetailPanel from './ProductoDetailPanel'
import ProductosStatsPanel from './ProductosStatsPanel'
import ProductosTable from './ProductosTable'

export default function ProductosPage() {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [stats, setStats] = useState({ activos: 0, inactivos: 0, criticos: 0, categoriasTop: [] })
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ categoria: '', estado: '', precioMin: '', precioMax: '', stockMinimo: '', stockMax: '', id: '' })
  const [filterErrors, setFilterErrors] = useState({ precioMin: '', precioMax: '', stockMinimo: '', stockMax: '' })
  const [sort, setSort] = useState({ field: 'fecha_creacion', dir: 'desc' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detail, setDetail] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [variantsByProduct, setVariantsByProduct] = useState({})
  const [imagesByProduct, setImagesByProduct] = useState({})
  const [soloCriticos, setSoloCriticos] = useState(false)
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [newCat, setNewCat] = useState({ nombre_categoria:'', descripcion:'', estado:'activa' })
  const [categoriasAdmin, setCategoriasAdmin] = useState([])
  const [showViewCategories, setShowViewCategories] = useState(false)
  const [editingCat, setEditingCat] = useState(null)
  const [page, setPage] = useState(1)
  const pageSize = 10

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [prods, cats, catsAll, s] = await Promise.all([
        productosService.listar(filters.estado ? { estado: String(filters.estado).toLowerCase() } : {}),
        categoriasService.activas().catch(() => []),
        categoriasService.todas().catch(() => []),
        productosStats()
      ])
      setProductos(prods)
      setCategorias(cats)
      setCategoriasAdmin(catsAll)
      setStats(s)
      setVariantsByProduct(s.variantsByProduct || {})
      setImagesByProduct(s.imagesByProduct || {})
    } catch (e) {
      setError('Error al cargar productos')
    } finally { setLoading(false) }
  }
  useEffect(() => { loadData() }, [])
  useEffect(() => { loadData() }, [filters.estado])

  const getId = (p) => p.id ?? p.id_producto ?? p.producto_id
  const getCategoriaId = (p) => p.id_categoria ?? p.categoria_id ?? p.categoria?.id
  const getEstado = (p) => (p.estado ?? (p.activo === true ? 'activo' : 'inactivo'))
  const getPrecio = (p) => p.precio_base ?? p.precio ?? p.valor ?? 0
  const isCritico = (p) => { const stock = p.stock ?? 0; const min = p.stock_minimo ?? p.stockMinimo ?? 0; return typeof stock === 'number' && typeof min === 'number' && stock <= min }

  const filtered = productos.filter(p => {
    const t = `${p.nombre || ''} ${getId(p) || ''} ${getEstado(p) || ''}`.toLowerCase()
    const matchQuery = t.includes(query.toLowerCase())
    const matchCat = filters.categoria ? String(getCategoriaId(p)) === String(filters.categoria) : true
    const matchEstado = (filters.estado && filters.estado !== 'todos') ? String(getEstado(p)).toLowerCase() === String(filters.estado).toLowerCase() : true
    const precio = Number(getPrecio(p))
    const matchPrecioMin = filters.precioMin ? precio >= Number(filters.precioMin) : true
    const matchPrecioMax = filters.precioMax ? precio <= Number(filters.precioMax) : true
    const matchStockMin = filters.stockMinimo ? (Number(p.stock ?? 0) <= Number(filters.stockMinimo)) : true
    const matchStockMax = filters.stockMax ? (Number(p.stock ?? 0) <= Number(filters.stockMax)) : true
    const matchId = filters.id ? String(getId(p)) === String(filters.id) : true
    const matchCritico = soloCriticos ? isCritico(p) : true
    return matchQuery && matchCat && matchEstado && matchPrecioMin && matchPrecioMax && matchStockMin && matchStockMax && matchId && matchCritico
  })
  const sorted = [...filtered].sort((a,b) => {
    const dir = sort.dir === 'asc' ? 1 : -1
    const f = sort.field
    const va = f === 'precio' ? getPrecio(a) : (f === 'stock' ? (a.stock ?? 0) : (f === 'estado' ? getEstado(a) : (f === 'fecha_creacion' ? new Date(a.created_at ?? a.fecha_creacion ?? a.fecha ?? 0).getTime() : String(a[f] ?? '').toLowerCase())))
    const vb = f === 'precio' ? getPrecio(b) : (f === 'stock' ? (b.stock ?? 0) : (f === 'estado' ? getEstado(b) : (f === 'fecha_creacion' ? new Date(b.created_at ?? b.fecha_creacion ?? b.fecha ?? 0).getTime() : String(b[f] ?? '').toLowerCase())))
    if (va < vb) return -1 * dir; if (va > vb) return 1 * dir; return 0
  })
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paged = sorted.slice(start, end)
  const canPrev = page > 1
  const canNext = (page < totalPages) && (sorted.length >= page * pageSize)

  const openDetail = async (p) => { try { const full = await productosService.obtener(getId(p)); setDetail(full) } catch { setDetail(p) } }
  const startEdit = async (p) => { try { const full = await productosService.obtener(getId(p)); setEditItem(full) } catch { setEditItem(p) } }
  const handleDelete = async (p) => { try { await productosService.eliminar(getId(p)); toast.success('Producto eliminado'); await loadData() } catch { toast.error('No se pudo eliminar') } }
  const toggleSort = (field) => setSort(s => ({ field, dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc' }))
  const handlePositiveFilter = (key, val) => {
    const cleaned = val.replace(/[^0-9.]/g, '')
    const num = cleaned === '' ? '' : Number(cleaned)
    if (cleaned === '' || (Number.isFinite(num) && num >= 0)) { setFilters(f => ({ ...f, [key]: cleaned })); setFilterErrors(e => ({ ...e, [key]: '' })) }
    else { setFilters(f => ({ ...f, [key]: '' })); setFilterErrors(e => ({ ...e, [key]: 'No se permiten valores negativos' })) }
  }

  useEffect(() => { setPage(1) }, [query, filters.categoria, filters.estado, filters.precioMin, filters.precioMax, filters.stockMinimo, filters.stockMax, filters.id, sort.field, sort.dir])
  useEffect(() => { if (page > totalPages) setPage(totalPages) }, [sorted.length])

  return (
    <div className="productos-module">
      <h1 style={{display:'flex', alignItems:'center', gap:8, color: 'var(--color-orange)'}}><Package size={22}/> Productos</h1>
      <div className="card" style={{marginTop: 12}}>
        <div className="productos-filters" style={{display: 'flex', gap: 12, alignItems: 'center'}}>
          <div style={{position: 'relative', flex: 1}}>
            <Search size={18} style={{position: 'absolute', left: 10, top: 10, color: '#9ca3af'}} />
            <input style={{paddingLeft: 34}} type="text" placeholder="Buscar por nombre, ID, estado" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select value={filters.categoria} onChange={(e) => setFilters({ ...filters, categoria: e.target.value })}>
            <option value="">Todas las categorías</option>
            {categorias.map(c => <option key={c.id ?? c.id_categoria} value={String(c.id ?? c.id_categoria)}>{c.nombre_categoria ?? c.nombre ?? `Cat ${c.id}`}</option>)}
          </select>
          <select value={filters.estado} onChange={(e) => setFilters({ ...filters, estado: e.target.value })}>
            <option value="todos">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
          <button className={soloCriticos? 'chip-btn active':'chip-btn'} onClick={()=> setSoloCriticos(v=>!v)}>
            <span className="chip-dot"></span>
            Críticos
          </button>
          <input type="number" placeholder="Precio mín" value={filters.precioMin} onChange={(e) => handlePositiveFilter('precioMin', e.target.value)} style={{width: 120}} />
          <input type="number" placeholder="Precio máx" value={filters.precioMax} onChange={(e) => handlePositiveFilter('precioMax', e.target.value)} style={{width: 120}} />
          <input type="number" placeholder="Stock ≤" value={filters.stockMinimo} onChange={(e) => handlePositiveFilter('stockMinimo', e.target.value)} style={{width: 120}} />
          <input type="number" placeholder="Stock máx" value={filters.stockMax} onChange={(e) => handlePositiveFilter('stockMax', e.target.value)} style={{width: 120}} />
          <button className="btn btn-orange" onClick={() => setShowCreate(true)}><Plus size={16} /> Nuevo</button>
          <button className="btn" onClick={() => setShowCreateCategory(true)} style={{background:'#1f2937', color:'#fff'}}><Plus size={16}/> Categoría</button>
          <button className="btn" onClick={() => setShowViewCategories(true)} style={{background:'#1f2937', color:'#fff'}}><Eye size={16}/> Ver</button>
        </div>
        <div style={{display:'flex', gap:12, marginTop:8}}>
          {filterErrors.precioMin && <small style={{color:'#3b82f6'}}>{filterErrors.precioMin}</small>}
          {filterErrors.precioMax && <small style={{color:'#3b82f6'}}>{filterErrors.precioMax}</small>}
          {filterErrors.stockMinimo && <small style={{color:'#3b82f6'}}>{filterErrors.stockMinimo}</small>}
          {filterErrors.stockMax && <small style={{color:'#3b82f6'}}>{filterErrors.stockMax}</small>}
        </div>
      </div>

      <ProductosStatsPanel stats={stats} categorias={categorias} />

      {error && <div className="error-box" style={{marginTop:8}}>{error}</div>}
      {loading ? <div>Cargando productos...</div> : (
        <ProductosTable
          items={paged}
          sort={sort}
          toggleSort={toggleSort}
          getPrecio={getPrecio}
          getEstado={getEstado}
          isCritico={isCritico}
          variantsByProduct={variantsByProduct}
          imagesByProduct={imagesByProduct}
          openDetail={openDetail}
          startEdit={startEdit}
          handleDelete={handleDelete}
        />
      )}
      {!loading && (
        <div style={{display:'flex', alignItems:'center', justifyContent:'flex-start', gap:12, marginTop:12}}>
          <div style={{color:'#374151'}}>Total: {sorted.length}</div>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <button className="btn" onClick={()=> setPage(1)} disabled={!canPrev} style={{background:'#2563eb', color:'#fff'}}><ChevronsLeft size={16}/></button>
            <button className="btn" onClick={()=> canPrev && setPage(p=> Math.max(1, p-1))} disabled={!canPrev} style={{background:'#2563eb', color:'#fff'}}><ChevronLeft size={16}/></button>
            <span style={{minWidth:80, textAlign:'center'}}>Página {page} de {totalPages}</span>
            <button className="btn" onClick={()=> canNext && setPage(p=> Math.min(totalPages, p+1))} disabled={!canNext} style={{background:'#2563eb', color:'#fff'}}><ChevronRight size={16}/></button>
          </div>
        </div>
      )}

      {showCreate && (
        <ProductoFormModal categorias={categorias} onClose={() => setShowCreate(false)} onSaved={async ()=>{ setShowCreate(false); await loadData(); toast.success('Producto creado') }} />
      )}
      {editItem && (
        <ProductoFormModal categorias={categorias} initial={editItem} onClose={() => setEditItem(null)} onSaved={async ()=>{ setEditItem(null); await loadData(); toast.success('Producto actualizado') }} />
      )}
      {detail && (
        <ProductoDetailPanel producto={detail} onClose={() => setDetail(null)} onChanged={async ()=>{ await loadData() }} />
      )}
      {showCreateCategory && (
        <div className="modal-overlay" onClick={()=> setShowCreateCategory(false)}>
          <div className="modal" onClick={(e)=> e.stopPropagation()}>
            <h3>Nueva categoría</h3>
            <div className="variant-form">
              <div className="form-row">
                <label>Nombre</label>
                <input type="text" placeholder="Nombre" value={newCat.nombre_categoria} onChange={(e)=> setNewCat(c=>({ ...c, nombre_categoria: e.target.value }))} />
              </div>
              <div className="form-row">
                <label>Descripción</label>
                <input type="text" placeholder="Descripción" value={newCat.descripcion} onChange={(e)=> setNewCat(c=>({ ...c, descripcion: e.target.value }))} />
              </div>
              <div className="form-row">
                <label>Estado</label>
                <select value={newCat.estado} onChange={(e)=> setNewCat(c=>({ ...c, estado: e.target.value }))}>
                  <option value="activa">Activa</option>
                  <option value="inactiva">Inactiva</option>
                </select>
              </div>
            </div>
            <div style={{display:'flex', gap:8, marginTop:12}}>
              <button className="btn btn-orange" onClick={async ()=>{ if (!newCat.nombre_categoria.trim()) { toast.error('Nombre de categoría requerido'); return } try { await categoriasService.crear({ nombre_categoria: newCat.nombre_categoria, descripcion: newCat.descripcion, estado: newCat.estado||'activa' }); toast.success('Categoría creada'); setShowCreateCategory(false); setNewCat({ nombre_categoria:'', descripcion:'', estado:'activa' }); const [catsAct, catsAll] = await Promise.all([categoriasService.activas().catch(()=>[]), categoriasService.todas().catch(()=>[])]); setCategorias(catsAct); setCategoriasAdmin(catsAll) } catch (e) { toast.error(e.message || 'No se pudo crear categoría') } }}>Crear</button>
              <button className="btn btn-secondary" onClick={()=> setShowCreateCategory(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showViewCategories && (
        <div className="modal-overlay" onClick={()=> { setShowViewCategories(false); setEditingCat(null) }}>
          <div className="modal" onClick={(e)=> e.stopPropagation()} style={{width:'1000px', maxWidth:'95vw'}}>
            <div className="side-panel-header" style={{padding:0, border:'none', marginBottom:12}}>
              <h3 style={{margin:0}}>Categorías</h3>
            </div>
            {!editingCat ? (
              <div className="table">
                <table style={{width:'100%'}}>
                  <thead><tr><th>Nombre</th><th>Descripción</th><th>Estado</th><th>Acciones</th></tr></thead>
                  <tbody>
                    {categoriasAdmin.length===0 ? (
                      <tr><td colSpan="4" style={{textAlign:'center', padding:20}}>Sin categorías</td></tr>
                    ) : categoriasAdmin.map(c => (
                      <tr key={c.id ?? c.id_categoria}>
                        <td>{c.nombre_categoria ?? c.nombre}</td>
                        <td>{c.descripcion ?? '-'}</td>
                        <td><span className={`badge ${String(c.estado).toLowerCase()==='activa'?'badge-success':'badge-danger'}`}>{String(c.estado).toLowerCase()}</span></td>
                        <td>
                          <div className="actions">
                            <button className="icon-btn btn-edit" title="Editar" onClick={()=> setEditingCat({ id: c.id ?? c.id_categoria, nombre_categoria: c.nombre_categoria ?? c.nombre ?? '', descripcion: c.descripcion ?? '', estado: String(c.estado).toLowerCase() })}><Pencil size={16}/></button>
                            <button className="icon-btn btn-delete" title="Desactivar/Activar" onClick={async ()=>{ try { const id = c.id ?? c.id_categoria; const nuevo = String(c.estado).toLowerCase()==='activa' ? 'inactiva' : 'activa'; await categoriasService.actualizar(id, { nombre_categoria: (c.nombre_categoria ?? c.nombre ?? ''), descripcion: (c.descripcion ?? ''), estado: nuevo }); const [catsAct, catsAll] = await Promise.all([categoriasService.activas().catch(()=>[]), categoriasService.todas().catch(()=>[])]); setCategorias(catsAct); setCategoriasAdmin(catsAll); toast.success(`Estado cambiado a ${nuevo}`) } catch (e) { toast.error(e.message || 'No se pudo actualizar') } }}><Ban size={16}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="variant-form">
                <div className="form-row"><label>Nombre</label><input type="text" value={editingCat.nombre_categoria} onChange={(e)=> setEditingCat(c=>({ ...c, nombre_categoria: e.target.value }))} /></div>
                <div className="form-row"><label>Descripción</label><input type="text" value={editingCat.descripcion} onChange={(e)=> setEditingCat(c=>({ ...c, descripcion: e.target.value }))} /></div>
                <div className="form-row"><label>Estado</label>
                  <select value={editingCat.estado} onChange={(e)=> setEditingCat(c=>({ ...c, estado: e.target.value }))}>
                    <option value="activa">Activa</option>
                    <option value="inactiva">Inactiva</option>
                  </select>
                </div>
                <div style={{display:'flex', gap:8, marginTop:12}}>
                  <button className="btn btn-orange" onClick={async ()=>{ try { await categoriasService.actualizar(editingCat.id, { nombre_categoria: editingCat.nombre_categoria, descripcion: editingCat.descripcion, estado: editingCat.estado }); const [catsAct, catsAll] = await Promise.all([categoriasService.activas().catch(()=>[]), categoriasService.todas().catch(()=>[])]); setCategorias(catsAct); setCategoriasAdmin(catsAll); setEditingCat(null); toast.success('Categoría actualizada') } catch (e) { toast.error(e.message || 'No se pudo actualizar') } }}>Guardar</button>
                  <button className="btn btn-secondary" onClick={()=> setEditingCat(null)}>Cancelar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
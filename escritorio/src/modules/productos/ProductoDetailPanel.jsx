import React, { useState, useEffect } from 'react'
import { categoriasService } from '../../services/categoriasService'
import { variantesService } from '../../services/variantesService'
import { imagenesService } from '../../services/imagenesService'
import VariantesManager from './VariantesManager'
import ImagenesManager from './ImagenesManager'

// Panel lateral de detalle de producto con pestañas
export default function ProductoDetailPanel({ producto, onClose, onChanged }) {
  const id = producto.id ?? producto.id_producto
  const [cat, setCat] = useState(null)
  const [variantes, setVariantes] = useState([])
  const [imagenes, setImagenes] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('info')

  const load = async () => {
    setLoading(true)
    try {
      const [c, vars, imgsDirect] = await Promise.all([
        (producto.id_categoria || producto.categoria_id || producto.categoria?.id) ? categoriasService.obtener(producto.id_categoria ?? producto.categoria_id ?? producto.categoria?.id).catch(()=>null) : Promise.resolve(null),
        variantesService.listarPorProducto(id).catch(() => []),
        imagenesService.listarPorProducto(id).catch(() => [])
      ])
      setCat(c); setVariantes(vars); setImagenes(imgsDirect)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [id])

  const precio = producto.precio_base ?? producto.precio ?? 0
  const iva = producto.iva_porcentaje ?? producto.iva ?? 0

  return (
    <div className="side-panel">
      <div className="side-panel-header">
        <h3 style={{color:'#FF7A00'}}>Detalle de producto</h3>
        <button className="btn" onClick={onClose} style={{background:'#1f2937', color:'#fff'}}>Cerrar</button>
      </div>
      <div className="tabs">
        <button className={`tab ${tab==='info'?'active':''}`} onClick={()=>setTab('info')}>Información</button>
        <button className={`tab ${tab==='variantes'?'active':''}`} onClick={()=>setTab('variantes')}>Variantes</button>
        <button className={`tab ${tab==='imagenes'?'active':''}`} onClick={()=>setTab('imagenes')}>Imágenes</button>
      </div>
      {loading ? <div style={{padding:16}}>Cargando...</div> : (
        <div style={{padding:16}}>
          {tab==='info' && (
            <div className="card">
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                <div>
                  <h2 style={{margin:0}}>{producto.nombre}</h2>
                  <p>{producto.descripcion}</p>
                  <p>Precio base: ${precio}</p>
                  <p>IVA: {iva}%</p>
                  <p>Stock: {producto.stock}</p>
                  <p>Stock mínimo: {producto.stock_minimo ?? producto.stockMinimo}</p>
                </div>
                <div>
                  <p>Estado: <span className={`badge ${ (producto.estado ?? (producto.activo===true?'activo':'inactivo'))==='activo'?'badge-success':'badge-danger'}`}>{producto.estado ?? (producto.activo===true?'activo':'inactivo')}</span></p>
                  <p>Categoría: {cat?.nombre_categoria ?? cat?.nombre ?? producto.id_categoria ?? '-'}</p>
                </div>
              </div>
            </div>
          )}
          {tab==='variantes' && (
            <VariantesManager variantes={variantes} productoId={id} onChanged={async()=>{ await load(); await onChanged(); }} />
          )}
          {tab==='imagenes' && (
            <ImagenesManager imagenes={imagenes} productoId={id} onChanged={async()=>{ await load(); await onChanged(); }} />
          )}
        </div>
      )}
    </div>
  )
}
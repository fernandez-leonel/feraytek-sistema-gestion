import React from 'react'
import { SortAsc, SortDesc, Eye, Pencil, Trash, Layers, Image as ImageIcon, AlertTriangle } from 'lucide-react'

// Tabla de productos con ordenamiento y acciones
export default function ProductosTable({ items, sort, toggleSort, getPrecio, getEstado, isCritico, variantsByProduct, imagesByProduct, openDetail, startEdit, handleDelete }) {
  return (
    <div className="table">
      <table style={{width:'100%'}}>
        <thead>
          <tr>
            <th onClick={() => toggleSort('nombre')} style={{cursor:'pointer'}}>Nombre {sort.field==='nombre' ? (sort.dir==='asc'?<SortAsc size={14}/> : <SortDesc size={14}/>):null}</th>
            <th onClick={() => toggleSort('precio')} style={{cursor:'pointer'}}>Precio {sort.field==='precio' ? (sort.dir==='asc'?<SortAsc size={14}/> : <SortDesc size={14}/>):null}</th>
            <th onClick={() => toggleSort('stock')} style={{cursor:'pointer'}}>Stock {sort.field==='stock' ? (sort.dir==='asc'?<SortAsc size={14}/> : <SortDesc size={14}/>):null}</th>
            <th>Estado</th>
            <th>Categoría</th>
            <th>Indicadores</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.length===0 ? (
            <tr><td colSpan="7" style={{textAlign:'center', padding:20}}>Sin resultados</td></tr>
          ) : items.map(p => {
            const id = p.id ?? p.id_producto ?? p.producto_id
            const estado = getEstado(p)
            const precio = getPrecio(p)
            const vcount = variantsByProduct[id] || 0
            const icount = imagesByProduct[id] || 0
            return (
              <tr key={id ?? p.nombre}>
                <td>{p.nombre}</td>
                <td>${precio}</td>
                <td>{p.stock ?? 0}</td>
                <td><span className={`badge ${estado==='activo'?'badge-success':'badge-danger'}`}>{estado}</span></td>
                <td>{p.categoria?.nombre_categoria ?? p.categoria?.nombre ?? p.id_categoria ?? '-'}</td>
                <td>
                  {isCritico(p) && <span className="badge" style={{background:'#7f1d1d', color:'#fecaca', border:'1px solid #ef4444'}}><AlertTriangle size={12}/> crítico</span>}
                  <span className="badge badge-neutral" style={{marginLeft:6}}><Layers size={12}/> {vcount>0?'con variantes':'sin variantes'}</span>
                  <span className="badge badge-neutral" style={{marginLeft:6}}><ImageIcon size={12}/> {icount>0?'con imágenes':'sin imágenes'}</span>
                </td>
                <td>
                  <div className="actions">
                    <button className="icon-btn btn-view" title="Ver" onClick={() => openDetail(p)}><Eye size={16}/></button>
                    <button className="icon-btn btn-edit" title="Editar" onClick={() => startEdit(p)}><Pencil size={16}/></button>
                    <button className="icon-btn btn-delete" title="Eliminar" onClick={() => handleDelete(p)}><Trash size={16}/></button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
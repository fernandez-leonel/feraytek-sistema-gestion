import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { variantesService } from '../../services/variantesService'

// Gestión de variantes dentro del detalle de producto
export default function VariantesManager({ variantes, productoId, onChanged }) {
  const [local, setLocal] = useState(variantes || [])
  const [form, setForm] = useState({ nombre_variante:'', valor_variante:'', precio_adicional:'0', stock:'0' })
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const canVariants = Boolean(productoId)

  useEffect(() => { setLocal(variantes || []) }, [variantes])

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  const numSanitize = (name, val, allowDecimal=false) => {
    const clean = val.replace(/[^0-9.]/g, '')
    if (!allowDecimal) setForm(f => ({ ...f, [name]: clean.replace(/\./g, '') })); else setForm(f => ({ ...f, [name]: clean }))
  }

  const save = async () => {
    setError('')
    if (!productoId) { setError('Debes guardar el producto antes de agregar variantes'); return }
    const stock = Number(form.stock || '0'), precio = Number(form.precio_adicional || '0')
    if (!Number.isFinite(stock) || stock < 0) { setError('Stock debe ser positivo'); return }
    if (!Number.isFinite(precio) || precio < 0) { setError('Precio adicional debe ser positivo'); return }
    if (!form.nombre_variante.trim() || !form.valor_variante.trim()) { setError('Completa nombre y valor de variante'); return }
    try {
      if (editing) {
        await variantesService.actualizar(editing.id ?? editing.id_variante, { nombre_variante: form.nombre_variante, valor_variante: form.valor_variante, precio_adicional: Number(form.precio_adicional), stock: Number(form.stock) })
      } else {
        await variantesService.crear({ id_producto: productoId, nombre_variante: form.nombre_variante, valor_variante: form.valor_variante, precio_adicional: Number(form.precio_adicional), stock: Number(form.stock) })
      }
      toast.success('Variante guardada')
      setForm({ nombre_variante:'', valor_variante:'', precio_adicional:'0', stock:'0' })
      setEditing(null)
      await onChanged()
    } catch (e) { toast.error(e?.message || 'Error al guardar variante') }
  }

  const remove = async (v) => {
    try { await variantesService.eliminar(v.id ?? v.id_variante); toast.success('Variante eliminada'); await onChanged() } catch { toast.error('No se pudo eliminar variante') }
  }

  return (
    <div>
      {!canVariants && <div className="error-box" style={{marginBottom:8}}>Debes guardar el producto antes de agregar variantes</div>}
      {error && <div className="error-box" style={{marginBottom:8}}>{error}</div>}
      <div className="card" style={{marginBottom:12}}>
        <div className="variant-form">
          <div className="form-row">
            <label>Atributo</label>
            <input name="nombre_variante" placeholder="Ej.: RAM, Color" value={form.nombre_variante} onChange={handleChange} disabled={!canVariants} />
          </div>
          <div className="form-row">
            <label>Valor</label>
            <input name="valor_variante" placeholder="Ej.: 32GB, Rojo" value={form.valor_variante} onChange={handleChange} disabled={!canVariants} />
          </div>
          <div className="form-row">
            <label>Precio</label>
            <input name="precio_adicional" inputMode="decimal" placeholder="Ej.: 1199.99" value={form.precio_adicional} onChange={(e)=>numSanitize('precio_adicional', e.target.value, true)} disabled={!canVariants} />
          </div>
          <div className="form-row">
            <label>Stock</label>
            <input name="stock" inputMode="numeric" placeholder="Ej.: 25" value={form.stock} onChange={(e)=>numSanitize('stock', e.target.value)} disabled={!canVariants} />
          </div>
          <div style={{display:'flex', justifyContent:'flex-end'}}>
            <button className="btn btn-orange" onClick={save} disabled={!canVariants}>{editing?'Actualizar':'Agregar'}</button>
          </div>
        </div>
      </div>
      <div className="table">
        <table style={{width:'100%'}}>
          <thead><tr><th>Atributo</th><th>Valor</th><th>Precio</th><th>Stock</th><th>Acciones</th></tr></thead>
          <tbody>
            {local.length===0 ? <tr><td colSpan="5" style={{textAlign:'center', padding:20}}>Sin variantes</td></tr> : local.map(v => (
              <tr key={v.id ?? v.id_variante}><td>{v.nombre_variante ?? v.atributo}</td><td>{v.valor_variante ?? v.valor}</td><td>{v.precio_adicional ?? v.precio ?? 0}</td><td>{v.stock ?? 0}</td><td>
                <div className="actions">
                  <button className="btn btn-edit" onClick={()=>{ setEditing(v); setForm({ nombre_variante: (v.nombre_variante ?? v.atributo ?? ''), valor_variante: (v.valor_variante ?? v.valor ?? ''), precio_adicional: String(v.precio_adicional ?? v.precio ?? 0), stock: String(v.stock ?? 0) }) }}>Editar</button>
                  <button className="btn btn-delete" onClick={()=>remove(v)}>Eliminar</button>
                </div>
              </td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
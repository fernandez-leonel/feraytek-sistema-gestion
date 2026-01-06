import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { productosService } from '../../services/productosService'

// Modal de creación/edición de producto
export default function ProductoFormModal({ categorias, initial, onClose, onSaved }) {
  const [form, setForm] = useState({ nombre:'', descripcion:'', precio_base:'', stock:'', iva_porcentaje:'', stock_minimo:'', id_categoria:'', estado:'activo' })
  const [errors, setErrors] = useState({ nombre:'', precio_base:'', stock:'', iva_porcentaje:'', stock_minimo:'', id_categoria:'' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initial) setForm({
      nombre: initial.nombre ?? '',
      descripcion: initial.descripcion ?? '',
      precio_base: initial.precio_base ?? initial.precio ?? '',
      stock: initial.stock ?? '',
      iva_porcentaje: initial.iva_porcentaje ?? initial.iva ?? '',
      stock_minimo: initial.stock_minimo ?? initial.stockMinimo ?? '',
      id_categoria: initial.id_categoria ?? initial.categoria_id ?? initial.categoria?.id ?? '',
      estado: initial.estado ?? (initial.activo===true?'activo':'inactivo')
    })
  }, [initial])

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  const handlePositiveNumeric = (name, val, allowDecimal=false) => {
    const clean = val.replace(/[^0-9.]/g, '')
    if (!allowDecimal) {
      const onlyDigits = clean.replace(/\./g, '')
      setForm(f => ({ ...f, [name]: onlyDigits }))
      if (onlyDigits === '' || Number(onlyDigits) < 0) setErrors(e => ({ ...e, [name]: 'Ingrese un número positivo' })); else setErrors(e => ({ ...e, [name]: '' }))
    } else {
      const valid = /^\d*(?:\.\d{0,2})?$/.test(clean)
      const v = valid ? clean : ''
      setForm(f => ({ ...f, [name]: v }))
      if (v === '' || Number(v) < 0) setErrors(e => ({ ...e, [name]: 'Ingrese un número positivo' })); else setErrors(e => ({ ...e, [name]: '' }))
    }
  }

  const normalizePayload = (f) => ({
    nombre: f.nombre,
    descripcion: f.descripcion,
    precio_base: Number(f.precio_base),
    stock: Number(f.stock),
    iva_porcentaje: Number(f.iva_porcentaje),
    stock_minimo: Number(f.stock_minimo),
    id_categoria: Number(f.id_categoria),
    estado: f.estado
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (initial?.id ?? initial?.id_producto) {
        const id = initial.id ?? initial.id_producto
        await productosService.actualizar(id, normalizePayload(form))
      } else {
        await productosService.crear(normalizePayload(form))
      }
      await onSaved()
    } catch { toast.error('Error al guardar') } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3 style={{color:'#FF7A00'}}>{initial?'Editar producto':'Crear producto'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="grid2">
            <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} required />
            <input name="descripcion" placeholder="Descripción" value={form.descripcion} onChange={handleChange} />
            <input name="precio_base" inputMode="numeric" placeholder="Precio base" value={form.precio_base} onChange={(e)=>handlePositiveNumeric('precio_base', e.target.value, true)} required />
            <input name="stock" inputMode="numeric" placeholder="Stock" value={form.stock} onChange={(e)=>handlePositiveNumeric('stock', e.target.value)} required />
            <input name="iva_porcentaje" inputMode="numeric" placeholder="IVA %" value={form.iva_porcentaje} onChange={(e)=>handlePositiveNumeric('iva_porcentaje', e.target.value, true)} required />
            <input name="stock_minimo" inputMode="numeric" placeholder="Stock mínimo" value={form.stock_minimo} onChange={(e)=>handlePositiveNumeric('stock_minimo', e.target.value)} required />
            <select name="id_categoria" value={form.id_categoria} onChange={handleChange} required>
              <option value="">Seleccionar categoría</option>
              {categorias.map(c => <option key={c.id ?? c.id_categoria} value={c.id ?? c.id_categoria}>{c.nombre_categoria ?? c.nombre}</option>)}
            </select>
            <select name="estado" value={form.estado} onChange={handleChange}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8}}>
            {errors.precio_base && <small style={{color:'#FF7A00'}}>{errors.precio_base}</small>}
            {errors.stock && <small style={{color:'#FF7A00'}}>{errors.stock}</small>}
            {errors.iva_porcentaje && <small style={{color:'#FF7A00'}}>{errors.iva_porcentaje}</small>}
            {errors.stock_minimo && <small style={{color:'#FF7A00'}}>{errors.stock_minimo}</small>}
          </div>
          <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:12}}>
            <button type="button" className="btn" onClick={onClose} style={{background:'#1f2937', color:'#fff'}}>Cancelar</button>
            <button type="submit" className="btn btn-orange" disabled={saving}>{saving?'Guardando...':'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { imagenesService } from '../../services/imagenesService'
import { Eye, X } from 'lucide-react'

// Gestión de imágenes (URL y archivos locales) para productos
export default function ImagenesManager({ imagenes, productoId, onChanged }) {
  const [local, setLocal] = useState(imagenes || [])
  const [form, setForm] = useState({ url_imagen:'', posicion:'1', alt_text:'', id_variante:'', file:null, files:[] })
  const [error, setError] = useState('')
  const [source, setSource] = useState('url')
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef(null)
  const [preview, setPreview] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => { setLocal(imagenes || []) }, [imagenes])
  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  const numSanitize = (name, val) => setForm(f => ({ ...f, [name]: val.replace(/[^0-9]/g, '') }))

  useEffect(() => {
    const taken = new Set((local||[]).map(i => Number(i.posicion)))
    const next = [1,2,3].find(p => !taken.has(p)) || 1
    setForm(f => ({ ...f, posicion: String(next) }))
  }, [local])

  useEffect(() => {
    let url = ''
    if (source === 'url' && form.url_imagen) url = form.url_imagen
    if (source === 'file') {
      const f = form.file || (form.files && form.files[0])
      if (f) url = URL.createObjectURL(f)
    }
    setPreview(url)
    return () => { if (url && url.startsWith('blob:')) URL.revokeObjectURL(url) }
  }, [source, form.url_imagen, form.file, form.files])

  const onDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = (e) => { e.preventDefault(); setDragging(false) }
  const onDrop = (e) => {
    e.preventDefault(); setDragging(false)
    const files = Array.from(e.dataTransfer.files || [])
    if (files.length === 0) return
    if (local.length >= 3) { setError('Máximo permitido: 3 imágenes'); return }
    setSource('file')
    setForm(f => ({ ...f, files: files.slice(0, 3 - local.length), file: files[0] || null }))
  }

  const save = async () => {
    setError('')
    if (local.length >= 3) { setError('Máximo permitido: 3 imágenes'); return }
    if (!productoId) { setError('Falta el identificador del producto'); return }
    const pos = Number(form.posicion || '0')
    if (!Number.isFinite(pos) || pos < 1 || pos > 3) { setError('Posición debe ser 1, 2 o 3'); return }
    const alt = form.alt_text && form.alt_text.trim() ? form.alt_text.trim() : (form.file?.name || 'Imagen')
    try {
      if (source === 'file' && (form.files?.length || form.file)) {
        if (form.files && form.files.length > 1) {
          await imagenesService.crearArchivos(productoId, alt, form.files, undefined)
        } else {
          await imagenesService.crearArchivo(productoId, pos, alt, form.file, undefined)
        }
      } else {
        if (!form.url_imagen) { setError('Debe ingresar URL válida o seleccionar archivo'); return }
        await imagenesService.crearUrl({ url_imagen: form.url_imagen, posicion: pos, alt_text: alt, id_producto: productoId })
      }
      toast.success('Imagen agregada')
      setForm({ url_imagen:'', posicion:'1', alt_text:'', file:null, files:[] })
      await onChanged()
    } catch (e) { toast.error(e?.message || 'Error al agregar imagen') }
  }

  const remove = async (img) => {
    try { await imagenesService.eliminar(img.id ?? img.id_imagen); toast.success('Imagen eliminada'); await onChanged() } catch { toast.error('No se pudo eliminar imagen') }
  }

  return (
    <div>
      {error && <div className="error-box" style={{marginBottom:8}}>{error}</div>}
      <div className="card" style={{marginBottom:12}}>
        <div style={{display:'flex', flexDirection:'column', gap:8}}>
          <select value={source} onChange={(e)=> setSource(e.target.value)} disabled={local.length>=3}>
            <option value="url">Usar URL</option>
            <option value="file">Subir archivo</option>
          </select>
          {source==='url' ? (
            <input name="url_imagen" placeholder="URL imagen" value={form.url_imagen} onChange={handleChange} />
          ) : (
            <div className={`dropzone ${dragging?'dragging':''}`} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} onClick={()=> fileInputRef.current && fileInputRef.current.click()}>
              {form.files && form.files.length>0 ? (`${form.files.length} archivo(s) listo(s)`) : (form.file ? (form.file.name) : ('Arrastra aquí la imagen o haz click para seleccionar'))}
              <input ref={fileInputRef} name="file" type="file" accept="image/*" multiple onChange={(e)=> {
                const arr = Array.from(e.target.files || [])
                setForm(f => ({ ...f, files: arr.slice(0, 3 - local.length), file: arr[0] || null }))
              }} style={{display:'none'}} />
            </div>
          )}
          <div className="image-form">
            <input name="posicion" inputMode="numeric" placeholder="Posición" value={form.posicion} onChange={(e)=>numSanitize('posicion', e.target.value)} />
            <input name="alt_text" placeholder="Alt text" value={form.alt_text} onChange={handleChange} />
          </div>
          {source==='file' && <button className="btn btn-view" onClick={()=> fileInputRef.current && fileInputRef.current.click()}>Seleccionar archivo(s)</button>}
          <button className="btn btn-orange" onClick={save}>{source==='file' ? (form.files && form.files.length>1 ? 'Guardar archivos' : 'Guardar archivo') : 'Agregar URL'}</button>
        </div>
        <div className="image-preview">
          {preview ? <img src={preview} alt="preview" /> : <div className="info">Sin previsualización</div>}
          <div className="info">{local.length}/3 imágenes</div>
        </div>
      </div>
      <div className="card" style={{marginTop:12}}>
        <div className="image-slots">
          {[1,2,3].map(pos => {
            const img = (local||[]).find(i => Number(i.posicion) === pos)
            return (
              <div key={pos} className="image-slot">
                <div className="badge-pos">Pos {pos}</div>
                {img ? (
                  <>
                    <img src={img.url_imagen} alt={img.alt_text || ''} />
                    <div className="overlay">
                      <a href={img.url_imagen} target="_blank" rel="noreferrer" className="icon-btn btn-view" aria-label="Ver" title="Ver"><Eye size={18} /></a>
                      <button className="icon-btn btn-delete" aria-label="Eliminar" title="Eliminar" onClick={()=> setConfirmDelete(img)}><X size={18} /></button>
                    </div>
                  </>
                ) : <div className="info">Vacío</div>}
              </div>
            )
          })}
        </div>
        {/* Se elimina el listado de URLs; acciones disponibles en overlay de cada imagen */}
        {confirmDelete && (
          <div className="modal-overlay" onClick={()=> setConfirmDelete(null)}>
            <div className="modal" onClick={(e)=> e.stopPropagation()}>
              <h3>Confirmar eliminación</h3>
              <div style={{marginTop:8, color:'#9ca3af'}}>¿Estás seguro de eliminar esta imagen?</div>
              <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:12}}>
                <button className="btn" onClick={()=> setConfirmDelete(null)}>No</button>
                <button className="btn" onClick={()=> { remove(confirmDelete); setConfirmDelete(null) }} style={{background:'#7f1d1d', color:'#fecaca'}}>Sí</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
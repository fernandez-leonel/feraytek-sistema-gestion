// =====================================================================
// ResenaModel
// Valida creación y actualización de reseñas
// =====================================================================

class ResenaModel {
  // Crear reseña
  static validateCreate(payload = {}) {
    const id_producto = Number(payload.id_producto)
    const calificacion = Number(payload.calificacion)
    const comentario = String(payload.comentario || '').trim()
    if (!Number.isFinite(id_producto) || id_producto<=0) throw new Error('id_producto inválido')
    if (!Number.isFinite(calificacion) || calificacion<1 || calificacion>5) throw new Error('calificación debe ser 1..5')
    if (!comentario) throw new Error('comentario requerido')
    return { id_producto, calificacion, comentario }
  }
  // Actualizar reseña
  static validateUpdate(payload = {}) {
    const calificacion = payload.calificacion!=null ? Number(payload.calificacion) : undefined
    const comentario = payload.comentario!=null ? String(payload.comentario).trim() : undefined
    if (calificacion!=null && (!Number.isFinite(calificacion) || calificacion<1 || calificacion>5)) throw new Error('calificación debe ser 1..5')
    if (comentario!=null && !comentario) throw new Error('comentario vacío')
    const res = {}
    if (calificacion!=null) res.calificacion = calificacion
    if (comentario!=null) res.comentario = comentario
    if (!Object.keys(res).length) throw new Error('Sin cambios')
    return res
  }
}

module.exports = { ResenaModel }
// =====================================================================
// Modelo Soporte
// Define estructura y sanitiza entradas para tickets de soporte
// - Campos: asunto, descripcion, prioridad
// - Métodos: validateCreate, validateUpdate
// =====================================================================

class SoporteModel {
  // -------------------------------------------------------------------
  // validateCreate(payload)
  // Valida datos de creación de ticket
  // Parámetros: payload { asunto, descripcion, prioridad }
  // Retorna: objeto saneado
  // Errores: lanza Error si faltan campos o tipos inválidos
  // -------------------------------------------------------------------
  static validateCreate(payload = {}) {
    const asunto = String(payload.asunto || '').trim()
    const descripcion = String(payload.descripcion || '').trim()
    const prioridad = String(payload.prioridad || 'media').trim().toLowerCase()
    if (!asunto) throw new Error('Asunto es requerido')
    if (!descripcion) throw new Error('Descripción es requerida')
    if (!['baja','media','alta'].includes(prioridad)) throw new Error('Prioridad inválida')
    return { asunto, descripcion, prioridad }
  }

  // -------------------------------------------------------------------
  // validateResponder(payload)
  // Valida respuesta del admin al ticket
  // Parámetros: payload { respuesta }
  // Retorna: objeto saneado
  // Errores: lanza Error si faltan campos
  // -------------------------------------------------------------------
  static validateResponder(payload = {}) {
    const respuesta = String(payload.respuesta || '').trim()
    if (!respuesta) throw new Error('Respuesta es requerida')
    return { respuesta }
  }

  // -------------------------------------------------------------------
  // validatePrioridad(payload)
  // Valida cambio de prioridad
  // Parámetros: payload { prioridad }
  // Retorna: objeto saneado
  // Errores: lanza Error si prioridad inválida
  // -------------------------------------------------------------------
  static validatePrioridad(payload = {}) {
    const prioridad = String(payload.prioridad || '').trim().toLowerCase()
    if (!['baja','media','alta'].includes(prioridad)) throw new Error('Prioridad inválida')
    return { prioridad }
  }

  // -------------------------------------------------------------------
  // validateCerrar(payload)
  // Valida cierre de ticket
  // Parámetros: payload { motivo, estado }
  // Retorna: objeto saneado
  // Errores: lanza Error si faltan campos
  // -------------------------------------------------------------------
  static validateCerrar(payload = {}) {
    const motivo = String(payload.motivo || '').trim()
    const estado = String(payload.estado || 'cerrado').trim().toLowerCase()
    if (!motivo) throw new Error('Motivo es requerido')
    if (!['cerrado'].includes(estado)) throw new Error('Estado inválido')
    return { motivo, estado }
  }
}

module.exports = { SoporteModel }
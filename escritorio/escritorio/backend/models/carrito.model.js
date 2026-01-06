// =====================================================================
// Modelo Carrito
// Valida y sanitiza entradas para operaciones del carrito
// - Métodos: validateAddItem, validateRemoveItem, validateDias
// =====================================================================

class CarritoModel {
  // ----------------------------------------------------------------------
  // validateAddItem(payload)
  // Valida alta de producto al carrito
  // Parámetros: { id_producto, id_variante, cantidad, precio_unitario, iva_porcentaje }
  // Retorna: objeto saneado
  // Errores: campos faltantes o valores inválidos
  // ----------------------------------------------------------------------
  static validateAddItem(payload = {}) {
    const id_producto = Number(payload.id_producto)
    const id_variante = Number(payload.id_variante)
    const cantidad = Number(payload.cantidad)
    const precio_unitario = Number(payload.precio_unitario)
    const iva_porcentaje = Number(payload.iva_porcentaje ?? 21)
    if (!Number.isFinite(id_producto) || id_producto <= 0) throw new Error("id_producto inválido")
    if (!Number.isFinite(id_variante) || id_variante <= 0) throw new Error("id_variante inválido")
    if (!Number.isFinite(cantidad) || cantidad <= 0) throw new Error("cantidad debe ser positiva")
    if (!Number.isFinite(precio_unitario) || precio_unitario <= 0) throw new Error("precio_unitario inválido")
    if (!Number.isFinite(iva_porcentaje) || iva_porcentaje < 0 || iva_porcentaje > 100) throw new Error("iva_porcentaje inválido")
    return { id_producto, id_variante, cantidad, precio_unitario, iva_porcentaje }
  }

  // ----------------------------------------------------------------------
  // validateRemoveItem(payload)
  // Valida eliminación de producto del carrito
  // Parámetros: { id_producto, id_variante }
  // Retorna: objeto saneado
  // Errores: ids faltantes o no numéricos
  // ----------------------------------------------------------------------
  static validateRemoveItem(payload = {}) {
    const id_producto = Number(payload.id_producto)
    const id_variante = Number(payload.id_variante)
    if (!Number.isFinite(id_producto) || id_producto <= 0) throw new Error("id_producto inválido")
    if (!Number.isFinite(id_variante) || id_variante <= 0) throw new Error("id_variante inválido")
    return { id_producto, id_variante }
  }

  // ----------------------------------------------------------------------
  // validateDias(payload)
  // Valida cantidad de días para abandono/limpieza
  // Parámetros: { dias }
  // Retorna: número de días
  // Errores: días inválidos
  // ----------------------------------------------------------------------
  static validateDias(payload = {}, def = 7) {
    const dias = Number(payload.dias ?? def)
    if (!Number.isFinite(dias) || dias <= 0) throw new Error("dias inválido")
    return dias
  }
}

module.exports = { CarritoModel }

// ----------------------------------------------------------------------
// Explicación
// Este modelo concentra validaciones y sanitización de entradas del carrito.
// Se conecta con el controlador que lo usa antes de invocar el servicio.
// Mantiene ≤150 líneas al limitarse a reglas de negocio básicas.
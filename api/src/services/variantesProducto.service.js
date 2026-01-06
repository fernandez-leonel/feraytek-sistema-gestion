const VariantesProducto = require("../models/variantesProducto.model");
const db = require("../config/database");
class VariantesProductoService {
  // Listar todas las variantes
  static async listarTodas() {
    return await VariantesProducto.obtenerTodas();
  }

  // Listar variantes de un producto específico
  static async listarPorProducto(id_producto) {
    if (!id_producto) throw new Error("Debe indicar el ID del producto.");
    return await VariantesProducto.obtenerPorProducto(id_producto);
  }

  // Crear una nueva variante
  static async crearVariante(data) {
    const { id_producto, atributo, valor } = data;
    if (!id_producto || !atributo || !valor)
      throw new Error(
        "Faltan datos obligatorios: id_producto, atributo o valor."
      );

    const payload = {
      id_producto,
      atributo,
      valor,
      precio: data.precio ?? 0,
      stock: data.stock ?? 0,
      sku: data.sku ?? null,
    };
    return await VariantesProducto.agregarVariante(payload);
  }

  // src/services/variantesProducto.service.js
  static async actualizarVariante(id_variante, data) {
    try {
      // Filtramos solo los campos definidos
      const campos = [];
      const valores = [];

      // Recorremos las propiedades que vengan en data
      for (const [clave, valor] of Object.entries(data)) {
        if (valor !== undefined) {
          campos.push(`${clave} = ?`);
          valores.push(valor);
        }
      }

      // Si no hay campos válidos, lanzamos error
      if (campos.length === 0) {
        throw new Error("No se enviaron campos para actualizar");
      }

      // Agregamos el ID al final del array de valores
      valores.push(id_variante);

      // Construimos la query dinámicamente
      const sql = `UPDATE variantes_producto SET ${campos.join(
        ", "
      )}, updated_at = NOW() WHERE id_variante = ?`;
      const [result] = await db.query(sql, valores);

      if (result.affectedRows === 0) {
        throw new Error("Variante no encontrada");
      }

      return { message: "Variante actualizada correctamente" };
    } catch (error) {
      throw error;
    }
  }

  // Eliminar una variante
  static async eliminarVariante(id_variante) {
    if (!id_variante)
      throw new Error("Debe indicar el ID de la variante a eliminar.");
    const eliminado = await VariantesProducto.eliminarVariante(id_variante);
    if (!eliminado)
      throw new Error("No se encontró la variante para eliminar.");
    return { ok: true, message: "Variante eliminada correctamente." };
  }
}

module.exports = VariantesProductoService;

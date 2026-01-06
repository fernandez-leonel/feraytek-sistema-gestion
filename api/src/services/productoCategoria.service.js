const ProductoCategoria = require("../models/productoCategoria.model");

class ProductoCategoriaService {
  // Listar todas las relaciones producto ↔ categoría
  static async listarTodas() {
    return await ProductoCategoria.obtenerTodas();
  }

  // Obtener categorías por ID de producto
  static async listarPorProducto(id_producto) {
    if (!id_producto) throw new Error("Debe especificar el ID del producto.");
    return await ProductoCategoria.obtenerPorProducto(id_producto);
  }

  // Asociar producto con una categoría secundaria
  static async agregarRelacion(id_producto, id_categoria) {
    if (!id_producto || !id_categoria) {
      throw new Error("Debe indicar el producto y la categoría.");
    }
    return await ProductoCategoria.agregarRelacion(id_producto, id_categoria);
  }

  // Eliminar relación producto categoría
  static async eliminarRelacion(id_producto, id_categoria) {
    if (!id_producto || !id_categoria) {
      throw new Error("Debe indicar el producto y la categoría.");
    }
    const eliminado = await ProductoCategoria.eliminarRelacion(
      id_producto,
      id_categoria
    );
    if (!eliminado)
      throw new Error("No se encontró la relación para eliminar.");
    return { ok: true, message: "Relación eliminada correctamente." };
  }
}

module.exports = ProductoCategoriaService;

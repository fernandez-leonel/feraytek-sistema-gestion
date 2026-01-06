const ImagenesProducto = require("../models/imagenesProducto.model");

const ImagenesProductoService = {
  // Listar todas las imágenes
  listar: async () => {
    return await ImagenesProducto.getAll();
  },

  // Listar imágenes por producto
  listarPorProducto: async (id_producto) => {
    if (!id_producto) throw new Error("Debe indicar el ID del producto.");
    return await ImagenesProducto.getByProducto(id_producto);
  },

  // Registrar una nueva imagen
  agregar: async (id_producto, id_variante, url_imagen, posicion, alt_text) => {
    if (!id_producto || !url_imagen)
      throw new Error("El producto y la URL de imagen son obligatorios.");

    // Validar que no se excedan las 3 imágenes por producto
    const existentes = await ImagenesProducto.getByProducto(id_producto);
    if (existentes.length >= 3)
      throw new Error("Cada producto puede tener un máximo de 3 imágenes.");

    return await ImagenesProducto.create(
      id_producto,
      id_variante,
      url_imagen,
      posicion || existentes.length + 1,
      alt_text || null
    );
  },

  // Eliminar imagen por ID
  eliminar: async (id_imagen) => {
    if (!id_imagen) throw new Error("Debe indicar el ID de la imagen.");
    const eliminado = await ImagenesProducto.delete(id_imagen);
    if (!eliminado) throw new Error("No se encontró la imagen especificada.");
    return { mensaje: "Imagen eliminada correctamente." };
  },
};

module.exports = ImagenesProductoService;

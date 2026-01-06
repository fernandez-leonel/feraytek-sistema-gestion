const ProductoCategoriaService = require("../services/productoCategoria.service");

class ProductoCategoriaController {
  static async obtenerTodas(req, res) {
    try {
      //Lista completa de los datos de los productos
      const data = await ProductoCategoriaService.listarTodas();
      // Si todo sale bien, se devuelve un código HTTP 200 (OK)
      res.status(200).json(data);
    } catch (error) {
      // Manejo de errores
      res.status(500).json({ error: error.message });
    }
  }

  // Llama al servicio para listar las categorías y devuelve los datos en JSON.
  static async obtenerPorProducto(req, res) {
    try {
      const { id_producto } = req.params; // Extrae el ID del producto desde la URL
      // Consulta al servicio
      const data = await ProductoCategoriaService.listarPorProducto(
        id_producto
      );
      res.status(200).json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Asocia una categoría a un producto existente.
  static async agregar(req, res) {
    try {
      const { id_producto, id_categoria } = req.body; // Datos enviados por el cliente
      const result = await ProductoCategoriaService.agregarRelacion(
        id_producto,
        id_categoria
      );
      res.status(201).json(result); // Respuesta de éxito (201 = creado)
    } catch (error) {
      res.status(400).json({ error: error.message }); // Error en datos o proceso
    }
  }

  //Elimina la relación entre un producto y una categoría.
  static async eliminar(req, res) {
    try {
      const { id_producto, id_categoria } = req.params;
      const result = await ProductoCategoriaService.eliminarRelacion(
        id_producto,
        id_categoria
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = ProductoCategoriaController;

const ImagenesProductoService = require("../services/imagenesProducto.service");

const ImagenesProductoController = {
  // GET /api/imagenes_productos
  listar: async (req, res) => {
    try {
      const data = await ImagenesProductoService.listar();
      res.status(200).json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // GET /api/imagenes_productos/producto/:id_producto
  listarPorProducto: async (req, res) => {
    try {
      const { id_producto } = req.params;
      const data = await ImagenesProductoService.listarPorProducto(id_producto);
      res.status(200).json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // POST /api/imagenes_productos
  agregar: async (req, res) => {
    try {
      const { id_producto, id_variante, url_imagen, posicion, alt_text } =
        req.body;
      const result = await ImagenesProductoService.agregar(
        id_producto,
        id_variante,
        url_imagen,
        posicion,
        alt_text
      );
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // DELETE /api/imagenes_productos/:id_imagen
  eliminar: async (req, res) => {
    try {
      const { id_imagen } = req.params;
      const result = await ImagenesProductoService.eliminar(id_imagen);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
};

module.exports = ImagenesProductoController;

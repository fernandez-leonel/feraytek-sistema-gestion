const db = require("../config/database"); // Conexión MySQL

const ImagenesProducto = {
  // Obtener todas las imágenes registradas
  getAll: async () => {
    const [rows] = await db.query("SELECT * FROM imagenes_productos");
    return rows;
  },

  // Obtener imágenes por producto (ordenadas por posición)
  getByProducto: async (id_producto) => {
    const [rows] = await db.query(
      "SELECT * FROM imagenes_productos WHERE id_producto = ? ORDER BY posicion ASC",
      [id_producto]
    );
    return rows;
  },

  // Crear una nueva imagen asociada a un producto
  create: async (id_producto, id_variante, url_imagen, posicion, alt_text) => {
    const [result] = await db.query(
      `INSERT INTO imagenes_productos (id_producto, id_variante, url_imagen, posicion, alt_text)
       VALUES (?, ?, ?, ?, ?)`,
      [id_producto, id_variante || null, url_imagen, posicion, alt_text]
    );
    return { id_imagen: result.insertId };
  },

  // Eliminar una imagen específica
  delete: async (id_imagen) => {
    const [result] = await db.query(
      "DELETE FROM imagenes_productos WHERE id_imagen = ?",
      [id_imagen]
    );
    return result.affectedRows > 0;
  },
};

module.exports = ImagenesProducto;

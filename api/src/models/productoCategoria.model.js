const db = require("../config/database");

class ProductoCategoria {
  // Obtener todas las relaciones producto ↔ categoría
  static async obtenerTodas() {
    const sql = `
      SELECT 
        pc.id_producto, 
        p.nombre AS nombre_producto, 
        pc.id_categoria, 
        c.nombre_categoria
      FROM productos_categorias pc
      JOIN productos p ON pc.id_producto = p.id_producto
      JOIN categorias c ON pc.id_categoria = c.id_categoria
      ORDER BY p.nombre ASC;
    `;
    const [rows] = await db.execute(sql);
    return rows;
  }

  //  Obtener categorías asociadas a un producto
  static async obtenerPorProducto(id_producto) {
    const sql = `
      SELECT 
        c.id_categoria, c.nombre_categoria, c.descripcion
      FROM productos_categorias pc
      JOIN categorias c ON pc.id_categoria = c.id_categoria
      WHERE pc.id_producto = ?;
    `;
    const [rows] = await db.execute(sql, [id_producto]);
    return rows;
  }

  // Asociar un producto con una categoría secundaria
  static async agregarRelacion(id_producto, id_categoria) {
    const sql = `
      INSERT INTO productos_categorias (id_producto, id_categoria)
      VALUES (?, ?);
    `;
    await db.execute(sql, [id_producto, id_categoria]);
    return {
      ok: true,
      message: "Relación producto-categoría agregada correctamente.",
    };
  }

  // Eliminar una relación producto categoría
  static async eliminarRelacion(id_producto, id_categoria) {
    const sql = `
      DELETE FROM productos_categorias
      WHERE id_producto = ? AND id_categoria = ?;
    `;
    const [result] = await db.execute(sql, [id_producto, id_categoria]);
    return result.affectedRows > 0;
  }
}

module.exports = ProductoCategoria;

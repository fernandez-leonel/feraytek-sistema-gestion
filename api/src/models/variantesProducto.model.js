const db = require("../config/database");

class VariantesProducto {
  // Obtener todas las variantes registradas
  static async obtenerTodas() {
    const sql = `
      SELECT 
        v.id_variante,
        v.id_producto,
        p.nombre AS nombre_producto,
        v.atributo,
        v.valor,
        v.precio,
        v.stock,
        v.sku,
        v.created_at,
        v.updated_at
      FROM variantes_producto v
      JOIN productos p ON v.id_producto = p.id_producto
      ORDER BY p.nombre ASC, v.atributo ASC;
    `;
    const [rows] = await db.execute(sql);
    return rows;
  }

  // Obtener todas las variantes de un producto específico
  static async obtenerPorProducto(id_producto) {
    const sql = `
      SELECT 
        id_variante, atributo, valor, precio, stock, sku, created_at
      FROM variantes_producto
      WHERE id_producto = ?;
    `;
    const [rows] = await db.execute(sql, [id_producto]);
    return rows;
  }

  // Agregar una nueva variante
  static async agregarVariante({
    id_producto,
    atributo,
    valor,
    precio,
    stock,
    sku,
  }) {
    const sql = `
      INSERT INTO variantes_producto
      (id_producto, atributo, valor, precio, stock, sku)
      VALUES (?, ?, ?, ?, ?, ?);
    `;
    const [result] = await db.execute(sql, [
      id_producto,
      atributo,
      valor,
      precio,
      stock,
      sku,
    ]);
    return {
      id_variante: result.insertId,
      message: "Variante agregada correctamente.",
    };
  }

  // Actualizar datos de una variante existente
  static async actualizarVariante(
    id_variante,
    { atributo, valor, precio, stock, sku }
  ) {
    const sql = `
      UPDATE variantes_producto
      SET atributo = ?, valor = ?, precio = ?, stock = ?, sku = ?, updated_at = NOW()
      WHERE id_variante = ?;
    `;
    const [result] = await db.execute(sql, [
      atributo,
      valor,
      precio,
      stock,
      sku,
      id_variante,
    ]);
    return result.affectedRows > 0;
  }

  // Eliminar una variante
  static async eliminarVariante(id_variante) {
    const sql = `DELETE FROM variantes_producto WHERE id_variante = ?;`;
    const [result] = await db.execute(sql, [id_variante]);
    return result.affectedRows > 0;
  }
}

module.exports = VariantesProducto;

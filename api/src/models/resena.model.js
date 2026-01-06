const db = require("../config/database");

async function ensureModerationSchema() {
  try {
    const [c1] = await db.query("SHOW COLUMNS FROM resenas LIKE 'estado'");
    if (c1.length === 0) {
      await db.query("ALTER TABLE resenas ADD COLUMN estado ENUM('pendiente','aprobada','rechazada','oculta') DEFAULT 'pendiente'");
    }
    const [c2] = await db.query("SHOW COLUMNS FROM resenas LIKE 'moderado_por'");
    if (c2.length === 0) {
      await db.query("ALTER TABLE resenas ADD COLUMN moderado_por INT NULL");
    }
    const [c3] = await db.query("SHOW COLUMNS FROM resenas LIKE 'moderado_at'");
    if (c3.length === 0) {
      await db.query("ALTER TABLE resenas ADD COLUMN moderado_at DATETIME NULL");
    }
    const [c4] = await db.query("SHOW COLUMNS FROM resenas LIKE 'motivo'");
    if (c4.length === 0) {
      await db.query("ALTER TABLE resenas ADD COLUMN motivo VARCHAR(255) NULL");
    }
  } catch (e) {
    console.error("Error asegurando esquema de resenas:", e.message);
  }
}

ensureModerationSchema();

const ResenaModel = {
  /**
   * Crear una nueva reseña
   * @param {number} id_usuario - ID del autor (cliente autenticado)
   * @param {number} id_producto - ID del producto reseñado
   * @param {number} calificacion - Valor numérico (1 a 5)
   * @param {string} comentario - Texto libre (opcional)
   */

  async crear(id_usuario, id_producto, calificacion, comentario) {
    const sql = `
      INSERT INTO resenas (id_usuario, id_producto, calificacion, comentario, estado)
      VALUES (?, ?, ?, ?, COALESCE(?, 'pendiente'))
    `;
    const [result] = await db.execute(sql, [
      id_usuario,
      id_producto,
      calificacion,
      comentario,
      'pendiente'
    ]);
    return result.insertId;
  },

  /**
   * Obtener todas las reseñas de un producto específico.
   * Permite al usuario o visitante leer reseñas públicas.
   */
  async obtenerPorProducto(id_producto) {
    const sql = `
      SELECT r.id_resena, r.calificacion, r.comentario, r.fecharesena,
             u.nombre_usuario
      FROM resenas r
      JOIN usuarios u ON r.id_usuario = u.id_usuario
      WHERE r.id_producto = ?
      ORDER BY r.fecharesena DESC
    `;
    const [rows] = await db.execute(sql, [id_producto]);
    return rows;
  },

  async obtenerPorProductoFiltrado(id_producto, estado = 'aprobada') {
    const sql = `
      SELECT r.id_resena, r.id_producto, r.calificacion, r.comentario, r.fecharesena, r.estado,
             u.nombre_usuario
      FROM resenas r
      JOIN usuarios u ON r.id_usuario = u.id_usuario
      WHERE r.id_producto = ? AND r.estado = ?
      ORDER BY r.fecharesena DESC
    `;
    const [rows] = await db.execute(sql, [id_producto, estado]);
    return rows;
  },

  /**
   * Obtener todas las reseñas del sistema (solo admin).
   */
  async obtenerTodas() {
    const sql = `
      SELECT r.id_resena, r.id_producto, p.nombre AS producto,
             r.id_usuario, u.nombre_usuario, r.calificacion,
             r.comentario, r.fecharesena, r.estado, r.moderado_por, r.moderado_at, r.motivo
      FROM resenas r
      JOIN usuarios u ON r.id_usuario = u.id_usuario
      JOIN productos p ON r.id_producto = p.id_producto
      ORDER BY r.fecharesena DESC
    `;
    const [rows] = await db.execute(sql);
    return rows;
  },

  async obtenerTodasPorEstado(estado) {
    const sql = `
      SELECT r.id_resena, r.id_producto, p.nombre AS producto,
             r.id_usuario, u.nombre_usuario, r.calificacion,
             r.comentario, r.fecharesena, r.estado, r.moderado_por, r.moderado_at, r.motivo
      FROM resenas r
      JOIN usuarios u ON r.id_usuario = u.id_usuario
      JOIN productos p ON r.id_producto = p.id_producto
      WHERE r.estado = ?
      ORDER BY r.fecharesena DESC
    `;
    const [rows] = await db.execute(sql, [estado]);
    return rows;
  },

  async obtenerPorId(id_resena) {
    const sql = `
      SELECT * FROM resenas WHERE id_resena = ?
    `;
    const [rows] = await db.execute(sql, [id_resena]);
    return rows[0];
  },

  /**
   * Actualizar una reseña (solo autor).
   * Solo puede modificar su propio comentario y calificación.
   */
  async actualizar(id_reseña, id_usuario, calificacion, comentario) {
    const sql = `
      UPDATE resenas
      SET calificacion = ?, comentario = ?, fecharesena = NOW()
      WHERE id_resena = ? AND id_usuario = ?
    `;
    const [result] = await db.execute(sql, [
      calificacion,
      comentario,
      id_reseña,
      id_usuario,
    ]);
    return result.affectedRows > 0;
  },

  async actualizarEstado(id_resena, estado, moderado_por, motivo) {
    const sql = `
      UPDATE resenas
      SET estado = ?, moderado_por = ?, moderado_at = NOW(), motivo = ?
      WHERE id_resena = ?
    `;
    const [result] = await db.execute(sql, [estado, moderado_por, motivo || null, id_resena]);
    return result.affectedRows > 0;
  },
};

module.exports = ResenaModel;

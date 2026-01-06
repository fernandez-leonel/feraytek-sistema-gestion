const db = require("../config/database");

const LogModel = {
  //Obtener todos los logs del sistema. Solo accesible para roles 'admin' y 'super_admin'.
  async obtenerTodos() {
    const sql = `
      SELECT l.id_log, l.accion, l.fecha_hora, l.ip, l.user_agent,
             u.nombre_usuario AS usuario
      FROM logs l
      LEFT JOIN usuarios u ON l.id_usuario = u.id_usuario
      ORDER BY l.fecha_hora DESC
    `;
    const [rows] = await db.execute(sql);
    return rows;
  },

  ///Obtener logs filtrados por usuario
  async obtenerPorUsuario(id_usuario) {
    const sql = `
      SELECT l.id_log, l.accion, l.fecha_hora, l.ip, l.user_agent,
             u.nombre_usuario
      FROM logs l
      JOIN usuarios u ON l.id_usuario = u.id_usuario
      WHERE l.id_usuario = ?
      ORDER BY l.fecha_hora DESC
    `;
    const [rows] = await db.execute(sql, [id_usuario]);
    return rows;
  },

  // Obtener detalle de un log específico
  async obtenerPorId(id_log) {
    const sql = `
      SELECT l.*, u.nombre_usuario
      FROM logs l
      LEFT JOIN usuarios u ON l.id_usuario = u.id_usuario
      WHERE l.id_log = ?
    `;
    const [rows] = await db.execute(sql, [id_log]);
    return rows[0];
  },
};

module.exports = LogModel;

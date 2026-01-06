const db = require("../config/database");

const SoporteModel = {
  // Crear un nuevo ticket de soporte
  async crear(datosTicket) {
    const {
      id_usuario,
      asunto,
      mensaje,
      canal = "web",
      tipo = "reclamo",
      prioridad = "media",
      id_factura = null
    } = datosTicket;

    // Verificar compra si se proporciona id_factura
    let compra_verificada = false;
    if (id_factura) {
      const verificacion = await this.verificarCompra(id_usuario, id_factura);
      compra_verificada = verificacion;
    }

    const sql = `
      INSERT INTO soporte (id_usuario, asunto, mensaje, canal, tipo, prioridad, id_factura, compra_verificada)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(sql, [
      id_usuario,
      asunto,
      mensaje,
      canal,
      tipo,
      prioridad,
      id_factura,
      compra_verificada,
    ]);
    return result.insertId;
  },

  // Verificar si el usuario realizó la compra de la factura
  async verificarCompra(id_usuario, id_factura) {
    const sql = `
      SELECT COUNT(*) as count
      FROM facturas f
      JOIN pedidos p ON f.id_pedido = p.id_pedido
      WHERE f.id_factura = ? AND p.id_usuario = ?
    `;
    const [rows] = await db.execute(sql, [id_factura, id_usuario]);
    return rows[0].count > 0;
  },

  // Listar todos los tickets registrados
  async obtenerTodos() {
    const sql = `
      SELECT s.id_soporte, s.id_usuario, u.nombre_usuario, s.asunto, s.mensaje,
             s.canal, s.estado, s.tipo, s.prioridad, s.compra_verificada,
             s.id_factura, s.fecha_creacion, s.respuesta, s.fecha_respuesta,
             s.id_admin, admin.nombre_usuario as admin_nombre
      FROM soporte s
      JOIN usuarios u ON s.id_usuario = u.id_usuario
      LEFT JOIN usuarios admin ON s.id_admin = admin.id_usuario
      ORDER BY s.prioridad DESC, s.fecha_creacion DESC
    `;
    const [rows] = await db.execute(sql);
    return rows;
  },

  // Obtener tickets por filtros
  async obtenerPorFiltros(filtros = {}) {
    let sql = `
      SELECT s.*, u.nombre_usuario, admin.nombre_usuario as admin_nombre
      FROM soporte s
      JOIN usuarios u ON s.id_usuario = u.id_usuario
      LEFT JOIN usuarios admin ON s.id_admin = admin.id_usuario
      WHERE 1=1
    `;
    const params = [];

    if (filtros.estado) {
      sql += ` AND s.estado = ?`;
      params.push(filtros.estado);
    }
    if (filtros.tipo) {
      sql += ` AND s.tipo = ?`;
      params.push(filtros.tipo);
    }
    if (filtros.prioridad) {
      sql += ` AND s.prioridad = ?`;
      params.push(filtros.prioridad);
    }
    if (filtros.compra_verificada !== undefined) {
      sql += ` AND s.compra_verificada = ?`;
      params.push(filtros.compra_verificada);
    }

    sql += ` ORDER BY s.prioridad DESC, s.fecha_creacion DESC`;
    
    const [rows] = await db.execute(sql, params);
    return rows;
  },

  // Obtener un ticket específico por ID
  async obtenerPorId(id_soporte) {
    const sql = `
      SELECT s.*, u.nombre_usuario, u.email,
             admin.nombre_usuario as admin_nombre,
             f.numero_factura, f.total as factura_total
      FROM soporte s
      JOIN usuarios u ON s.id_usuario = u.id_usuario
      LEFT JOIN usuarios admin ON s.id_admin = admin.id_usuario
      LEFT JOIN facturas f ON s.id_factura = f.id_factura
      WHERE s.id_soporte = ?
    `;
    const [rows] = await db.execute(sql, [id_soporte]);
    return rows[0];
  },

  // Actualizar estado y respuesta del ticket
  async responder(id_soporte, datosRespuesta, id_admin) {
    const { respuesta, estado = "respondido" } = datosRespuesta;
    
    const sql = `
      UPDATE soporte
      SET respuesta = ?, estado = ?, fecha_respuesta = NOW(), id_admin = ?
      WHERE id_soporte = ?
    `;
    const [result] = await db.execute(sql, [respuesta, estado, id_admin, id_soporte]);
    return result.affectedRows > 0;
  },

  // Actualizar prioridad del ticket
  async actualizarPrioridad(id_soporte, prioridad) {
    const sql = `
      UPDATE soporte
      SET prioridad = ?
      WHERE id_soporte = ?
    `;
    const [result] = await db.execute(sql, [prioridad, id_soporte]);
    return result.affectedRows > 0;
  },

  // Cerrar ticket
  async cerrar(id_soporte, id_admin) {
    const sql = `
      UPDATE soporte
      SET estado = 'cerrado', id_admin = ?
      WHERE id_soporte = ?
    `;
    const [result] = await db.execute(sql, [id_admin, id_soporte]);
    return result.affectedRows > 0;
  },

  // Obtener estadísticas de soporte
  async obtenerEstadisticas() {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN estado = 'respondido' THEN 1 ELSE 0 END) as respondidos,
        SUM(CASE WHEN estado = 'cerrado' THEN 1 ELSE 0 END) as cerrados,
        SUM(CASE WHEN tipo = 'reclamo' THEN 1 ELSE 0 END) as reclamos,
        SUM(CASE WHEN tipo = 'consulta' THEN 1 ELSE 0 END) as consultas,
        SUM(CASE WHEN tipo = 'sugerencia' THEN 1 ELSE 0 END) as sugerencias,
        SUM(CASE WHEN prioridad = 'alta' THEN 1 ELSE 0 END) as alta_prioridad,
        SUM(CASE WHEN compra_verificada = 1 THEN 1 ELSE 0 END) as con_compra_verificada
      FROM soporte
    `;
    const [rows] = await db.execute(sql);
    return rows[0];
  },
};

module.exports = SoporteModel;

const pool = require("../config/database");

// Crear tabla de auditoría si no existe
async function createAuditTable() {
  // Primero, verificar la estructura de la tabla usuarios
  const [userTableInfo] = await pool.query(`
    DESCRIBE usuarios
  `);
  
  // Encontrar el tipo de dato de id_usuario
  const idUsuarioColumn = userTableInfo.find(col => col.Field === 'id_usuario');
  const columnType = idUsuarioColumn ? idUsuarioColumn.Type : 'INT';
  
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS auditoria (
      id_auditoria INT AUTO_INCREMENT PRIMARY KEY,
      tipo_accion ENUM('login', 'logout', 'cambio_rol', 'cambio_estado', 'reset_password', 'pedido', 'producto_cambio', 'error_sistema', 'acceso_denegado') NOT NULL,
      usuario_id ${columnType} NULL,
      usuario_afectado_id ${columnType} NULL,
      descripcion TEXT NOT NULL,
      detalles JSON NULL,
      ip_address VARCHAR(45) NULL,
      user_agent TEXT NULL,
      fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_tipo_accion (tipo_accion),
      INDEX idx_usuario_id (usuario_id),
      INDEX idx_fecha_accion (fecha_accion)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  
  try {
    await pool.query(createTableQuery);
    console.log('Tabla de auditoría verificada/creada exitosamente');
    
    // Agregar las claves foráneas después de crear la tabla
    try {
      await pool.query(`
        ALTER TABLE auditoria 
        ADD CONSTRAINT fk_auditoria_usuario 
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
      `);
    } catch (fkError) {
      // Si la clave foránea ya existe, ignorar el error
      if (!fkError.message.includes('Duplicate key name')) {
        console.log('Advertencia FK usuario_id:', fkError.message);
      }
    }
    
    try {
      await pool.query(`
        ALTER TABLE auditoria 
        ADD CONSTRAINT fk_auditoria_usuario_afectado 
        FOREIGN KEY (usuario_afectado_id) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
      `);
    } catch (fkError) {
      // Si la clave foránea ya existe, ignorar el error
      if (!fkError.message.includes('Duplicate key name')) {
        console.log('Advertencia FK usuario_afectado_id:', fkError.message);
      }
    }
    
  } catch (error) {
    console.error('Error al crear tabla de auditoría:', error);
    throw error;
  }
}

// Registrar una acción en el log de auditoría
async function logAction(actionData) {
  const {
    tipo_accion,
    usuario_id,
    usuario_afectado_id = null,
    descripcion,
    detalles = null,
    ip_address = null,
    user_agent = null
  } = actionData;

  try {
    const [result] = await pool.query(`
      INSERT INTO auditoria (
        tipo_accion, usuario_id, usuario_afectado_id, descripcion, 
        detalles, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      tipo_accion,
      usuario_id,
      usuario_afectado_id,
      descripcion,
      detalles ? JSON.stringify(detalles) : null,
      ip_address,
      user_agent
    ]);

    return result.insertId;
  } catch (error) {
    console.error('Error al registrar acción en auditoría:', error);
    throw error;
  }
}

// Obtener logs de auditoría con filtros
async function getAuditLogs(filters = {}) {
  let query = `
    SELECT 
      a.id_auditoria,
      a.tipo_accion,
      a.descripcion,
      a.detalles,
      a.ip_address,
      a.fecha_accion,
      u.nombre_usuario as usuario_ejecutor,
      ua.nombre_usuario as usuario_afectado
    FROM auditoria a
    LEFT JOIN usuarios u ON a.usuario_id = u.id_usuario
    LEFT JOIN usuarios ua ON a.usuario_afectado_id = ua.id_usuario
    WHERE 1=1
  `;
  const params = [];

  // Filtro por tipo de acción
  if (filters.tipo_accion) {
    query += ` AND a.tipo_accion = ?`;
    params.push(filters.tipo_accion);
  }

  // Filtro por usuario
  if (filters.usuario_id) {
    query += ` AND a.usuario_id = ?`;
    params.push(filters.usuario_id);
  }

  // Filtro por fecha desde
  if (filters.fecha_desde) {
    query += ` AND DATE(a.fecha_accion) >= ?`;
    params.push(filters.fecha_desde);
  }

  // Filtro por fecha hasta
  if (filters.fecha_hasta) {
    query += ` AND DATE(a.fecha_accion) <= ?`;
    params.push(filters.fecha_hasta);
  }

  // Búsqueda en descripción
  if (filters.busqueda) {
    query += ` AND a.descripcion LIKE ?`;
    params.push(`%${filters.busqueda}%`);
  }

  // Ordenamiento
  const orderBy = filters.orden || 'fecha_accion';
  const direction = filters.direccion || 'DESC';
  query += ` ORDER BY a.${orderBy} ${direction}`;

  // Paginación
  if (filters.limite) {
    const offset = (filters.pagina - 1) * filters.limite || 0;
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(filters.limite), offset);
  }

  try {
    const [rows] = await pool.query(query, params);
    
    // Parsear detalles JSON
    return rows.map(row => ({
      ...row,
      detalles: row.detalles ? JSON.parse(row.detalles) : null
    }));
  } catch (error) {
    console.error('Error al obtener logs de auditoría:', error);
    throw error;
  }
}

// Contar logs de auditoría con filtros
async function countAuditLogs(filters = {}) {
  let query = `SELECT COUNT(*) as total FROM auditoria a WHERE 1=1`;
  const params = [];

  if (filters.tipo_accion) {
    query += ` AND a.tipo_accion = ?`;
    params.push(filters.tipo_accion);
  }

  if (filters.usuario_id) {
    query += ` AND a.usuario_id = ?`;
    params.push(filters.usuario_id);
  }

  if (filters.fecha_desde) {
    query += ` AND DATE(a.fecha_accion) >= ?`;
    params.push(filters.fecha_desde);
  }

  if (filters.fecha_hasta) {
    query += ` AND DATE(a.fecha_accion) <= ?`;
    params.push(filters.fecha_hasta);
  }

  if (filters.busqueda) {
    query += ` AND a.descripcion LIKE ?`;
    params.push(`%${filters.busqueda}%`);
  }

  try {
    const [result] = await pool.query(query, params);
    return result[0].total;
  } catch (error) {
    console.error('Error al contar logs de auditoría:', error);
    throw error;
  }
}

// Obtener estadísticas de auditoría
async function getAuditStats() {
  try {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_acciones,
        SUM(CASE WHEN tipo_accion = 'login' THEN 1 ELSE 0 END) as logins,
        SUM(CASE WHEN tipo_accion = 'logout' THEN 1 ELSE 0 END) as logouts,
        SUM(CASE WHEN tipo_accion = 'cambio_rol' THEN 1 ELSE 0 END) as cambios_rol,
        SUM(CASE WHEN tipo_accion = 'cambio_estado' THEN 1 ELSE 0 END) as cambios_estado,
        SUM(CASE WHEN tipo_accion = 'pedido' THEN 1 ELSE 0 END) as pedidos,
        SUM(CASE WHEN tipo_accion = 'producto_cambio' THEN 1 ELSE 0 END) as cambios_producto,
        SUM(CASE WHEN tipo_accion = 'error_sistema' THEN 1 ELSE 0 END) as errores_sistema,
        SUM(CASE WHEN DATE(fecha_accion) = CURDATE() THEN 1 ELSE 0 END) as acciones_hoy,
        SUM(CASE WHEN DATE(fecha_accion) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as acciones_semana
      FROM auditoria
    `);

    return stats[0];
  } catch (error) {
    console.error('Error al obtener estadísticas de auditoría:', error);
    throw error;
  }
}

// Limpiar logs antiguos (mantener solo los últimos N días)
async function cleanOldLogs(daysToKeep = 90) {
  try {
    const [result] = await pool.query(`
      DELETE FROM auditoria 
      WHERE fecha_accion < DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [daysToKeep]);

    return result.affectedRows;
  } catch (error) {
    console.error('Error al limpiar logs antiguos:', error);
    throw error;
  }
}

module.exports = {
  createAuditTable,
  logAction,
  getAuditLogs,
  countAuditLogs,
  getAuditStats,
  cleanOldLogs
};
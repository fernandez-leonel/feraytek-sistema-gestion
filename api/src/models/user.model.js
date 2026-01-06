// ======================================================================
// Modelo de Usuario
// Responsable de interactuar directamente con la base de datos MySQL.
// Contiene las operaciones CRUD sobre la tabla "usuarios".
// ======================================================================

// Conexión al pool MySQL
const pool = require("../config/database");
const bcrypt = require('bcryptjs');

// ----------------------------------------------------------------------
// Obtener todos los usuarios (solo para administradores)
// ----------------------------------------------------------------------
async function getAll() {
  const [rows] = await pool.query(`
    SELECT 
      u.id_usuario,
      c.id_cliente,
      u.nombre_usuario,
      u.email,
      u.rol,
      u.estado,
      u.fecha_registro,
      u.ultimo_login
    FROM usuarios u
    LEFT JOIN clientes c ON c.id_usuario = u.id_usuario
    ORDER BY u.id_usuario DESC
  `);
  return rows;
}

// ----------------------------------------------------------------------
// Obtener un usuario específico por su ID
// ----------------------------------------------------------------------
async function getById(id) {
  const [rows] = await pool.query(
    `
    SELECT 
      u.id_usuario,
      c.id_cliente,
      u.nombre_usuario,
      u.email,
      u.rol,
      u.estado,
      u.fecha_registro,
      u.ultimo_login
    FROM usuarios u
    LEFT JOIN clientes c ON c.id_usuario = u.id_usuario
    WHERE u.id_usuario = ?
    `,
    [id]
  );
  return rows[0];
}

// ----------------------------------------------------------------------
// Obtener un usuario por su email (para login)
// ----------------------------------------------------------------------
async function getByEmail(email) {
  const [rows] = await pool.query(
    `
    SELECT *
    FROM usuarios
    WHERE email = ?
    `,
    [email]
  );
  return rows[0];
}

// ----------------------------------------------------------------------
// Obtener un usuario por su nombre de usuario
// ----------------------------------------------------------------------
async function getByUsername(nombreUsuario) {
  const [rows] = await pool.query(
    `
    SELECT *
    FROM usuarios
    WHERE nombre_usuario = ?
    `,
    [nombreUsuario]
  );
  return rows[0];
}

// ----------------------------------------------------------------------
// Crear un nuevo usuario (registro)
// ----------------------------------------------------------------------
async function create(userData) {
  const { nombre_usuario, email, password } = userData;
  
  // Generar hash de la contraseña
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  
  // Por defecto, los nuevos usuarios son clientes
  const rol = userData.rol || 'cliente';
  const estado = userData.estado || 'activo';
  
  const [result] = await pool.query(
    `
    INSERT INTO usuarios (nombre_usuario, email, password_hash, rol, estado, fecha_registro)
    VALUES (?, ?, ?, ?, ?, NOW())
    `,
    [nombre_usuario, email, hashedPassword, rol, estado]
  );
  
  return { id_usuario: result.insertId };
}

// ----------------------------------------------------------------------
// Actualizar un usuario existente
// ----------------------------------------------------------------------
async function update(id, userData) {
  const { nombre_usuario, email, estado } = userData;
  
  const [result] = await pool.query(
    `
    UPDATE usuarios
    SET 
      nombre_usuario = COALESCE(?, nombre_usuario), 
      email = COALESCE(?, email), 
      estado = COALESCE(?, estado)
    WHERE id_usuario = ?
    `,
    [
      nombre_usuario ?? null,
      email ?? null,
      estado ?? null,
      id
    ]
  );
  
  return result.affectedRows > 0;
}

// ----------------------------------------------------------------------
// Actualizar contraseña de usuario
// ----------------------------------------------------------------------
async function updatePassword(id, newPassword) {
  // Generar hash de la nueva contraseña
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
  
  const [result] = await pool.query(
    `
    UPDATE usuarios
    SET password_hash = ?
    WHERE id_usuario = ?
    `,
    [hashedPassword, id]
  );
  
  return result.affectedRows > 0;
}

// ----------------------------------------------------------------------
// Actualizar último login
// ----------------------------------------------------------------------
async function updateLastLogin(id) {
  await pool.query(
    `
    UPDATE usuarios
    SET ultimo_login = NOW()
    WHERE id_usuario = ?
    `,
    [id]
  );
}

// ----------------------------------------------------------------------
// Cambiar estado de usuario (activo/inactivo) - solo para administradores
// ----------------------------------------------------------------------
async function remove(id) {
  // Primero obtener el estado actual del usuario
  const [currentUser] = await pool.query(
    `SELECT estado FROM usuarios WHERE id_usuario = ?`,
    [id]
  );
  
  if (currentUser.length === 0) {
    return false; // Usuario no encontrado
  }
  
  // Cambiar el estado: si está activo lo pone inactivo, y viceversa
  const nuevoEstado = currentUser[0].estado === 'activo' ? 'inactivo' : 'activo';
  
  const [result] = await pool.query(
    `
    UPDATE usuarios 
    SET estado = ?
    WHERE id_usuario = ?
    `,
    [nuevoEstado, id]
  );
  
  return result.affectedRows > 0;
}

// ----------------------------------------------------------------------
// FUNCIONES AVANZADAS PARA SUPERADMIN
// ----------------------------------------------------------------------

// Obtener usuarios con filtros avanzados
async function getAllWithFilters(filters = {}) {
  let query = `
    SELECT 
      u.id_usuario,
      c.id_cliente,
      u.nombre_usuario,
      u.email,
      u.rol,
      u.estado,
      u.fecha_registro,
      u.ultimo_login
    FROM usuarios u
    LEFT JOIN clientes c ON c.id_usuario = u.id_usuario
    WHERE 1=1
  `;
  const params = [];

  // Filtro por rol
  if (filters.rol) {
    query += ` AND rol = ?`;
    params.push(filters.rol);
  }

  // Filtro por estado
  if (filters.estado) {
    query += ` AND estado = ?`;
    params.push(filters.estado);
  }

  // Filtro por fecha de registro (desde)
  if (filters.fecha_desde) {
    query += ` AND DATE(fecha_registro) >= ?`;
    params.push(filters.fecha_desde);
  }

  // Filtro por fecha de registro (hasta)
  if (filters.fecha_hasta) {
    query += ` AND DATE(fecha_registro) <= ?`;
    params.push(filters.fecha_hasta);
  }

  // Búsqueda por nombre o email
  if (filters.busqueda) {
    query += ` AND (nombre_usuario LIKE ? OR email LIKE ?)`;
    params.push(`%${filters.busqueda}%`, `%${filters.busqueda}%`);
  }

  // Ordenamiento
  const orderBy = filters.orden || 'fecha_registro';
  const direction = filters.direccion || 'DESC';
  query += ` ORDER BY ${orderBy} ${direction}`;

  // Paginación
  if (filters.limite) {
    const offset = (filters.pagina - 1) * filters.limite || 0;
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(filters.limite), offset);
  }

  const [rows] = await pool.query(query, params);
  return rows;
}

// Cambiar rol de usuario
async function updateRole(id, newRole) {
  const [result] = await pool.query(
    `UPDATE usuarios SET rol = ? WHERE id_usuario = ?`,
    [newRole, id]
  );
  return result.affectedRows > 0;
}

// Activar/desactivar cuenta de usuario
async function updateStatus(id, newStatus) {
  const [result] = await pool.query(
    `UPDATE usuarios SET estado = ? WHERE id_usuario = ?`,
    [newStatus, id]
  );
  return result.affectedRows > 0;
}

// Resetear contraseña de usuario (genera una temporal)
async function resetPassword(id, newPassword) {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const [result] = await pool.query(
    `UPDATE usuarios SET password = ? WHERE id_usuario = ?`,
    [hashedPassword, id]
  );
  return result.affectedRows > 0;
}

// Obtener estadísticas de usuarios
async function getUserStats() {
  const [stats] = await pool.query(`
    SELECT 
      COUNT(*) as total_usuarios,
      SUM(CASE WHEN estado = 'activo' THEN 1 ELSE 0 END) as usuarios_activos,
      SUM(CASE WHEN estado = 'inactivo' THEN 1 ELSE 0 END) as usuarios_inactivos,
      SUM(CASE WHEN rol = 'cliente' THEN 1 ELSE 0 END) as clientes,
      SUM(CASE WHEN rol = 'admin' THEN 1 ELSE 0 END) as admins,
      SUM(CASE WHEN rol = 'superadmin' THEN 1 ELSE 0 END) as superadmins,
      SUM(CASE WHEN DATE(fecha_registro) = CURDATE() THEN 1 ELSE 0 END) as registros_hoy,
      SUM(CASE WHEN DATE(fecha_registro) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as registros_semana,
      SUM(CASE WHEN DATE(ultimo_login) = CURDATE() THEN 1 ELSE 0 END) as logins_hoy
    FROM usuarios
  `);
  return stats[0];
}

// Contar total de usuarios con filtros (para paginación)
async function countWithFilters(filters = {}) {
  let query = `SELECT COUNT(*) as total FROM usuarios WHERE 1=1`;
  const params = [];

  if (filters.rol) {
    query += ` AND rol = ?`;
    params.push(filters.rol);
  }

  if (filters.estado) {
    query += ` AND estado = ?`;
    params.push(filters.estado);
  }

  if (filters.fecha_desde) {
    query += ` AND DATE(fecha_registro) >= ?`;
    params.push(filters.fecha_desde);
  }

  if (filters.fecha_hasta) {
    query += ` AND DATE(fecha_registro) <= ?`;
    params.push(filters.fecha_hasta);
  }

  if (filters.busqueda) {
    query += ` AND (nombre_usuario LIKE ? OR email LIKE ?)`;
    params.push(`%${filters.busqueda}%`, `%${filters.busqueda}%`);
  }

  const [result] = await pool.query(query, params);
  return result[0].total;
}

module.exports = {
  getAll,
  getById,
  getByEmail,
  getByUsername,
  create,
  update,
  updatePassword,
  updateLastLogin,
  remove,
  // Funciones avanzadas
  getAllWithFilters,
  updateRole,
  updateStatus,
  resetPassword,
  getUserStats,
  countWithFilters
};
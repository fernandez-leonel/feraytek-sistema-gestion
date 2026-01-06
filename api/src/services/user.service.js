// ======================================================================
// Servicio de Usuario
// Contiene la lógica de negocio relacionada con usuarios y autenticación
// ======================================================================

const userModel = require('../models/user.model');
const clienteModel = require('../models/cliente.model');
const adminModel = require('../models/admin.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Clave secreta para JWT (debería estar en variables de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'feraytek-secret-key';

// ----------------------------------------------------------------------
// Obtener todos los usuarios (solo para administradores)
// ----------------------------------------------------------------------
async function getAllUsers() {
  return await userModel.getAll();
}

// ----------------------------------------------------------------------
// Obtener un usuario por ID
// ----------------------------------------------------------------------
async function getUserById(id) {
  const user = await userModel.getById(id);
  if (!user) {
    throw createError('Usuario no encontrado', 404);
  }
  let perfil = null;
  if (user.rol === 'cliente') {
    perfil = await clienteModel.getByUserId(id);
  } else if (user.rol === 'admin' || user.rol === 'superadmin') {
    perfil = await adminModel.getByUserId(id);
  }
  if (perfil) {
    return { ...user, ...perfil };
  }
  return user;
}

// ----------------------------------------------------------------------
// Registrar un nuevo usuario cliente
// ----------------------------------------------------------------------
async function registerCliente(userData, clienteData) {
  // Verificar si el email ya existe
  const existingUserByEmail = await userModel.getByEmail(userData.email);
  if (existingUserByEmail) {
    throw createError('El email ya está registrado', 409);
  }
  
  // Verificar si el nombre de usuario ya existe
  const existingUserByUsername = await userModel.getByUsername(userData.nombre_usuario);
  if (existingUserByUsername) {
    throw createError('El nombre de usuario ya está registrado', 409);
  }
  
  // Crear el usuario con rol cliente
  userData.rol = 'cliente';
  const result = await userModel.create(userData);
  
  // Crear el perfil de cliente
  clienteData.id_usuario = result.id_usuario;
  await clienteModel.create(clienteData);
  
  return { id_usuario: result.id_usuario };
}

// ----------------------------------------------------------------------
// Registrar un nuevo usuario administrador
// ----------------------------------------------------------------------
async function registerAdmin(userData, adminData) {
  // Verificar si el email ya existe
  const existingUserByEmail = await userModel.getByEmail(userData.email);
  if (existingUserByEmail) {
    throw createError('El email ya está registrado', 409);
  }
  
  // Verificar si el nombre de usuario ya existe
  const existingUserByUsername = await userModel.getByUsername(userData.nombre_usuario);
  if (existingUserByUsername) {
    throw createError('El nombre de usuario ya está registrado', 409);
  }
  
  // Crear el usuario con rol admin
  userData.rol = 'admin';
  const result = await userModel.create(userData);
  
  // Crear el perfil de administrador
  adminData.id_usuario = result.id_usuario;
  await adminModel.create(adminData);
  
  return { id_usuario: result.id_usuario };
}

// ----------------------------------------------------------------------
// Login de usuario
// ----------------------------------------------------------------------
async function loginUser(identificador, password) {
  console.log('DEBUG LOGIN - Iniciando login para identificador:', identificador);
  
  // Buscar usuario por email o por nombre de usuario
  let user = null;
  if (identificador && identificador.includes('@')) {
    user = await userModel.getByEmail(identificador);
  } else {
    user = await userModel.getByUsername(identificador);
  }
  console.log('DEBUG LOGIN - Usuario encontrado:', user ? 'Sí' : 'No');
  if (!user) {
    throw createError('Credenciales inválidas', 401);
  }
  
  console.log('DEBUG LOGIN - Estado del usuario:', user.estado);
  // Verificar si el usuario está activo
  if (user.estado !== 'activo') {
    throw createError('Usuario inactivo. Contacte al administrador.', 403);
  }
  
  // Verificar contraseña
  console.log('DEBUG LOGIN - Password provided:', password);
  console.log('DEBUG LOGIN - Password hash from DB:', user.password_hash);
  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  console.log('DEBUG LOGIN - Password match result:', passwordMatch);
  if (!passwordMatch) {
    throw createError('Credenciales inválidas', 401);
  }
  
  // Actualizar último login
  await userModel.updateLastLogin(user.id_usuario);
  
  // Generar token JWT
  const token = jwt.sign(
    { 
      id: user.id_usuario, 
      email: user.email,
      username: user.nombre_usuario,
      rol: user.rol 
    }, 
    JWT_SECRET, 
    { expiresIn: '24h' }
  );
  
  // Obtener perfil adicional según rol
  let perfil = null;
  if (user.rol === 'cliente') {
    perfil = await clienteModel.getByUserId(user.id_usuario);
  } else if (user.rol === 'admin') {
    perfil = await adminModel.getByUserId(user.id_usuario);
  }
  
  // Devolver datos de usuario y token (sin la contraseña)
  const { password_hash: _, ...userWithoutPassword } = user;
  return {
    user: userWithoutPassword,
    perfil,
    token
  };
}

// ----------------------------------------------------------------------
// Actualizar perfil de usuario cliente
// ----------------------------------------------------------------------
async function updateClienteProfile(id, userData, clienteData) {
  // Verificar si el usuario existe
  const user = await userModel.getById(id);
  if (!user) {
    throw createError('Usuario no encontrado', 404);
  }
  
  // Verificar si es un cliente
  if (user.rol !== 'cliente') {
    throw createError('El usuario no es un cliente', 403);
  }
  
  // Si se está actualizando el email, verificar que no exista ya
  if (userData.email && userData.email !== user.email) {
    const existingUser = await userModel.getByEmail(userData.email);
    if (existingUser) {
      throw createError('El email ya está registrado por otro usuario', 409);
    }
  }
  
  // Si se está actualizando el nombre de usuario, verificar que no exista ya
  if (userData.nombre_usuario && userData.nombre_usuario !== user.nombre_usuario) {
    const existingUser = await userModel.getByUsername(userData.nombre_usuario);
    if (existingUser) {
      throw createError('El nombre de usuario ya está registrado por otro usuario', 409);
    }
  }
  
  // Actualizar usuario
  await userModel.update(id, userData);
  
  // Obtener el perfil de cliente
  const cliente = await clienteModel.getByUserId(id);
  if (!cliente) {
    throw createError('Perfil de cliente no encontrado', 404);
  }
  
  // Actualizar perfil de cliente
  await clienteModel.update(cliente.id_cliente, clienteData);
  
  return await getUserById(id);
}

// ----------------------------------------------------------------------
// Actualizar perfil de usuario administrador
// ----------------------------------------------------------------------
async function updateAdminProfile(id, userData, adminData) {
  // Verificar si el usuario existe
  const user = await userModel.getById(id);
  if (!user) {
    throw createError('Usuario no encontrado', 404);
  }
  
  // Verificar si es un administrador
  if (user.rol !== 'admin' && user.rol !== 'superadmin') {
    throw createError('El usuario no es un administrador', 403);
  }
  
  // Si se está actualizando el email, verificar que no exista ya
  if (userData.email && userData.email !== user.email) {
    const existingUser = await userModel.getByEmail(userData.email);
    if (existingUser) {
      throw createError('El email ya está registrado por otro usuario', 409);
    }
  }
  
  // Si se está actualizando el nombre de usuario, verificar que no exista ya
  if (userData.nombre_usuario && userData.nombre_usuario !== user.nombre_usuario) {
    const existingUser = await userModel.getByUsername(userData.nombre_usuario);
    if (existingUser) {
      throw createError('El nombre de usuario ya está registrado por otro usuario', 409);
    }
  }
  
  // Actualizar usuario
  await userModel.update(id, userData);
  
  // Obtener el perfil de administrador
  let admin = await adminModel.getByUserId(id);
  if (!admin) {
    await adminModel.create({ id_usuario: id, ...adminData });
    admin = await adminModel.getByUserId(id);
  } else {
    await adminModel.update(admin.id_admin, adminData);
  }
  
  return await getUserById(id);
}

// ----------------------------------------------------------------------
// Cambiar contraseña
// ----------------------------------------------------------------------
async function changePassword(id, currentPassword, newPassword) {
  // Verificar si el usuario existe
  const user = await userModel.getById(id);
  if (!user) {
    throw createError('Usuario no encontrado', 404);
  }
  
  // Obtener usuario completo con contraseña
  const userWithPassword = await userModel.getByEmail(user.email);
  
  // Verificar contraseña actual
  const passwordMatch = await bcrypt.compare(currentPassword, userWithPassword.password_hash);
  if (!passwordMatch) {
    throw createError('La contraseña actual es incorrecta', 401);
  }
  
  // Actualizar contraseña
  const updated = await userModel.updatePassword(id, newPassword);
  if (!updated) {
    throw createError('Error al cambiar la contraseña', 400);
  }
  
  return { success: true };
}

// ----------------------------------------------------------------------
// Cambiar estado de usuario (activo/inactivo) - solo para administradores
// ----------------------------------------------------------------------
async function deleteUser(id) {
  // Verificar si el usuario existe
  const user = await userModel.getById(id);
  if (!user) {
    throw new Error('Usuario no encontrado');
  }
  
  // Cambiar estado del usuario (activo/inactivo)
  const updated = await userModel.remove(id);
  if (!updated) {
    throw new Error('Error al cambiar el estado del usuario');
  }
  
  // Determinar el nuevo estado para el mensaje de respuesta
  const nuevoEstado = user.estado === 'activo' ? 'inactivo' : 'activo';
  
  return { 
    success: true, 
    message: `Usuario ${nuevoEstado === 'inactivo' ? 'desactivado' : 'activado'} exitosamente`,
    nuevoEstado 
  };
}

// ----------------------------------------------------------------------
// Verificar si ya existe un superadministrador
// ----------------------------------------------------------------------
async function checkSuperAdminExists() {
  const pool = require('../config/database');
  const [result] = await pool.query(
    'SELECT COUNT(*) as count FROM usuarios WHERE rol = ?',
    ['superadmin']
  );
  return result[0].count > 0;
}

// ----------------------------------------------------------------------
// Crear superadministrador
// ----------------------------------------------------------------------
async function createSuperAdmin(userData, adminData) {
  const pool = require('../config/database');
  
  // Verificar si ya existe un superadmin
  const exists = await checkSuperAdminExists();
  if (exists) {
    throw createError('Ya existe un superadministrador en el sistema', 400);
  }
  
  // Verificar si el email ya está en uso
  const existingUser = await userModel.getByEmail(userData.email);
  if (existingUser) {
    throw createError('El email ya está registrado', 400);
  }
  
  // Verificar si el nombre de usuario ya está en uso
  const existingUsername = await userModel.getByUsername(userData.nombre_usuario);
  if (existingUsername) {
    throw createError('El nombre de usuario ya está en uso', 400);
  }
  
  // Encriptar contraseña
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // Crear usuario con rol superadmin (usando la columna correcta 'password_hash')
    const [userResult] = await connection.query(
      `INSERT INTO usuarios (nombre_usuario, email, password_hash, rol, estado, fecha_registro) 
       VALUES (?, ?, ?, ?, 'activo', NOW())`,
      [userData.nombre_usuario, userData.email, hashedPassword, 'superadmin']
    );
    
    const userId = userResult.insertId;
    
    // Crear registro en tabla administradores
    await connection.query(
      `INSERT INTO administradores (id_usuario, dni, nombre, apellido, telefono, cargo, fecha_contratacion) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [userId, adminData.dni, adminData.nombre, adminData.apellido, adminData.telefono, adminData.cargo]
    );
    
    await connection.commit();
    return { id: userId, ...userData, ...adminData };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// ----------------------------------------------------------------------
// Obtener todos los administradores
// ----------------------------------------------------------------------
async function getAllAdmins() {
  const pool = require('../config/database');
  const [result] = await pool.query(`
    SELECT 
      u.id_usuario,
      u.nombre_usuario,
      u.email,
      u.rol,
      u.estado,
      u.fecha_registro,
      a.dni,
      a.nombre,
      a.apellido,
      a.telefono,
      a.cargo,
      a.created_at as fecha_contratacion
    FROM usuarios u
    INNER JOIN administradores a ON u.id_usuario = a.id_usuario
    WHERE u.rol IN ('admin', 'superadmin')
    ORDER BY u.fecha_registro DESC
  `);
  return result;
}

// ----------------------------------------------------------------------
// Cambiar estado de administrador
// ----------------------------------------------------------------------
async function toggleAdminStatus(id) {
  const pool = require('../config/database');
  
  // Verificar que el usuario existe y es admin
  const [user] = await pool.query(
    'SELECT * FROM usuarios WHERE id_usuario = ? AND rol IN ("admin", "superadmin")',
    [id]
  );
  
  if (user.length === 0) {
    throw createError('Administrador no encontrado', 404);
  }
  
  // No permitir desactivar al superadmin
  if (user[0].rol === 'superadmin') {
    throw createError('No se puede cambiar el estado del superadministrador', 400);
  }
  
  // Cambiar estado
  const nuevoEstado = user[0].estado === 'activo' ? 'inactivo' : 'activo';
  
  const [result] = await pool.query(
    'UPDATE usuarios SET estado = ? WHERE id_usuario = ?',
    [nuevoEstado, id]
  );
  
  if (result.affectedRows === 0) {
    throw createError('Error al cambiar el estado del administrador', 500);
  }
  
  return {
    success: true,
    message: `Administrador ${nuevoEstado === 'inactivo' ? 'desactivado' : 'activado'} exitosamente`,
    nuevoEstado
  };
}

// ----------------------------------------------------------------------
// Obtener estadísticas del sistema
// ----------------------------------------------------------------------
async function getSystemStats() {
  const pool = require('../config/database');
  
  const [stats] = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM usuarios WHERE rol = 'cliente') as total_clientes,
      (SELECT COUNT(*) FROM usuarios WHERE rol = 'admin') as total_admins,
      (SELECT COUNT(*) FROM usuarios WHERE rol = 'superadmin') as total_superadmins,
      (SELECT COUNT(*) FROM usuarios WHERE estado = 'activo') as usuarios_activos,
      (SELECT COUNT(*) FROM usuarios WHERE estado = 'inactivo') as usuarios_inactivos,
      (SELECT COUNT(*) FROM productos) as total_productos,
      (SELECT COUNT(*) FROM pedidos) as total_pedidos,
      (SELECT COUNT(*) FROM facturas) as total_facturas,
      (SELECT COUNT(*) FROM soporte) as total_tickets_soporte
  `);
  
  return stats[0];
}

module.exports = {
  getAllUsers,
  getUserById,
  registerCliente,
  registerAdmin,
  loginUser,
  updateClienteProfile,
  updateAdminProfile,
  changePassword,
  deleteUser,
  checkSuperAdminExists,
  createSuperAdmin,
  getAllAdmins,
  toggleAdminStatus,
  getSystemStats
};

// Helper para crear errores con código HTTP
function createError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}
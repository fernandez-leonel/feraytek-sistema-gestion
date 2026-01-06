// ======================================================================
// Controlador de Usuario
// Maneja las solicitudes HTTP relacionadas con usuarios y autenticación
// ======================================================================

const userService = require('../services/user.service');

// ----------------------------------------------------------------------
// Obtener todos los usuarios (solo para administradores)
// ----------------------------------------------------------------------
async function getAllUsers(req, res, next) {
  try {
    const users = await userService.getAllUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
}

// ----------------------------------------------------------------------
// Obtener un usuario por ID
// ----------------------------------------------------------------------
async function getUserById(req, res, next) {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

// ----------------------------------------------------------------------
// Registro de cliente
// ----------------------------------------------------------------------
async function registerCliente(req, res, next) {
  try {
    const { nombre_usuario, email, password, dni, nombre, apellido, telefono, direccion, ciudad, provincia, pais, codigo_postal, fecha_nacimiento } = req.body;
    
    // Datos para la tabla usuarios
    const userData = { nombre_usuario, email, password };
    
    // Datos para la tabla clientes
    const clienteData = { dni, nombre, apellido, telefono, direccion, ciudad, provincia, pais, codigo_postal, fecha_nacimiento };
    
    const result = await userService.registerCliente(userData, clienteData);
    res.status(201).json({ success: true, message: 'Cliente registrado exitosamente', data: result });
  } catch (error) {
    next(error);
  }
}

// ----------------------------------------------------------------------
// Registro de administrador (solo para superadmins)
// ----------------------------------------------------------------------
async function registerAdmin(req, res, next) {
  try {
    const { nombre, apellido, email, password, dni, telefono, cargo, direccion, ciudad, provincia, pais, codigo_postal, fecha_nacimiento } = req.body;
    
    // Usar el email como nombre_usuario si no se proporciona
    const nombre_usuario = req.body.nombre_usuario || email;
    
    // Datos para la tabla usuarios
    const userData = { nombre_usuario, email, password };
    
    // Datos para la tabla administradores
    const adminData = { dni, nombre, apellido, telefono, cargo, direccion, ciudad, provincia, pais, codigo_postal, fecha_nacimiento };
    
    const result = await userService.registerAdmin(userData, adminData);
    res.status(201).json({ success: true, message: 'Administrador registrado exitosamente', data: result });
  } catch (error) {
    next(error);
  }
}

// ----------------------------------------------------------------------
// Login de usuario
// ----------------------------------------------------------------------
async function login(req, res, next) {
  try {
    const identificador = req.body.identificador ?? req.body.email ?? req.body.nombre_usuario ?? req.body.username;
    const { password } = req.body;
    const result = await userService.loginUser(identificador, password);
    res.json({ success: true, message: 'Login exitoso', ...result });
  } catch (error) {
    next(error);
  }
}

// ----------------------------------------------------------------------
// Actualizar perfil de cliente
// ----------------------------------------------------------------------
async function updateClienteProfile(req, res, next) {
  try {
    const { id } = req.params;
    const { nombre_usuario, email, estado, dni, nombre, apellido, telefono, direccion, ciudad, provincia, pais, codigo_postal, fecha_nacimiento } = req.body;
    
    // Datos para la tabla usuarios
    const userData = { nombre_usuario, email, estado };
    
    // Datos para la tabla clientes
    const clienteData = { dni, nombre, apellido, telefono, direccion, ciudad, provincia, pais, codigo_postal, fecha_nacimiento };
    
    const result = await userService.updateClienteProfile(id, userData, clienteData);
    res.json({ success: true, message: 'Perfil actualizado exitosamente', data: result });
  } catch (error) {
    next(error);
  }
}

// Actualizar datos del ususario propio//
async function actualizarUsuario(req, res, next) {
  try {
    const { id } = req.params;
    const { nombre_usuario, email, password } = req.body;

    if (!nombre_usuario || !email || !password)
      return res.status(400).json({ message: 'Faltan datos obligatorios' });

    const result = await userService.updateBasicUser(id, { nombre_usuario, email, password });
    res.status(200).json({ message: 'Usuario actualizado correctamente', data: result });
  } catch (error) {
    next(error);
  }
}

// ----------------------------------------------------------------------
// Actualizar perfil de administrador
// ----------------------------------------------------------------------
async function updateAdminProfile(req, res, next) {
  try {
    const { id } = req.params;
    const { nombre_usuario, email, estado, dni, nombre, apellido, telefono, cargo, direccion, ciudad, provincia, pais, codigo_postal, fecha_nacimiento } = req.body;
    
    // Datos para la tabla usuarios
    const userData = { nombre_usuario, email, estado };
    
    // Datos para la tabla administradores
    const adminData = { dni, nombre, apellido, telefono, cargo, direccion, ciudad, provincia, pais, codigo_postal, fecha_nacimiento };
    
    const result = await userService.updateAdminProfile(id, userData, adminData);
    res.json({ success: true, message: 'Perfil actualizado exitosamente', data: result });
  } catch (error) {
    next(error);
  }
}

// ----------------------------------------------------------------------
// Obtener perfil del usuario autenticado (sin ID)
// ----------------------------------------------------------------------
async function getProfile(req, res, next) {
  try {
    const userId = req.user.id; // Del token JWT
    const user = await userService.getUserById(userId);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

// ----------------------------------------------------------------------
// Actualizar perfil del usuario autenticado (sin ID)
// ----------------------------------------------------------------------
async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id; // Del token JWT (usar 'id' no 'id_usuario')
    const { nombre, apellido, telefono, direccion, ciudad, provincia, pais, codigo_postal } = req.body;
    
    // Solo datos del cliente (no del usuario base)
    const clienteData = { nombre, apellido, telefono, direccion, ciudad, provincia, pais, codigo_postal };
    
    const result = await userService.updateClienteProfile(userId, {}, clienteData);
    res.json({ success: true, message: 'Perfil actualizado exitosamente', data: result });
  } catch (error) {
    next(error);
  }
}

// ----------------------------------------------------------------------
// Cambiar contraseña del usuario autenticado (sin ID)
// ----------------------------------------------------------------------
async function updatePassword(req, res, next) {
  try {
    const userId = req.user.id; // Del token JWT (usar 'id' no 'id_usuario')
    const password_actual = req.body.password_actual ?? req.body.currentPassword ?? req.body.passwordActual;
    const password_nueva = req.body.password_nueva ?? req.body.newPassword ?? req.body.passwordNueva;
    const confirmar_password = req.body.confirmar_password ?? req.body.confirmPassword ?? req.body.confirmarPassword ?? req.body.confirmNewPassword;
    
    // Validar que las contraseñas nuevas coincidan
    if (password_nueva !== confirmar_password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Las contraseñas nuevas no coinciden' 
      });
    }
    
    const result = await userService.changePassword(userId, password_actual, password_nueva);
    res.json({ 
      success: true, 
      message: 'Contraseña actualizada exitosamente. Se ha enviado un email de confirmación.',
      data: {
        email_enviado: true,
        fecha_cambio: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
}

// ----------------------------------------------------------------------
// Cambiar contraseña (versión original con ID)
// ----------------------------------------------------------------------
async function changePassword(req, res, next) {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    const result = await userService.changePassword(id, currentPassword, newPassword);
    res.json({ success: true, message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    next(error);
  }
}

// ----------------------------------------------------------------------
// Cambiar estado de usuario (activo/inactivo) - solo para administradores
// ----------------------------------------------------------------------
async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    const result = await userService.deleteUser(id);
    res.json({ 
      success: true, 
      message: result.message,
      nuevoEstado: result.nuevoEstado 
    });
  } catch (error) {
    next(error);
  }
}

// ----------------------------------------------------------------------
// Crear el primer superadministrador (solo una vez)
// ----------------------------------------------------------------------
async function createFirstSuperAdmin(req, res, next) {
  try {
    const { nombre, email, password, telefono } = req.body;
    
    // Verificar si ya existe un superadmin
    const existingSuperAdmin = await userService.checkSuperAdminExists();
    if (existingSuperAdmin) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ya existe un superadministrador en el sistema' 
      });
    }
    
    // Datos para la tabla usuarios
    const userData = { 
      nombre_usuario: email, // Usar email como nombre de usuario
      email, 
      password, 
      rol: 'superadmin' 
    };
    
    // Datos para la tabla administradores
    const adminData = { 
      dni: '00000000', // DNI por defecto
      nombre: nombre.split(' ')[0] || nombre, // Primer nombre
      apellido: nombre.split(' ').slice(1).join(' ') || 'Admin', // Resto como apellido
      telefono, 
      cargo: 'Superadministrador' 
    };
    
    const result = await userService.createSuperAdmin(userData, adminData);
    res.status(201).json({ 
      success: true, 
      message: 'Superadministrador creado exitosamente', 
      data: result 
    });
  } catch (error) {
    next(error);
  }
}

// ----------------------------------------------------------------------
// Obtener todos los administradores (solo para superadmin)
// ----------------------------------------------------------------------
async function getAllAdmins(req, res, next) {
  try {
    const admins = await userService.getAllAdmins();
    res.json({ success: true, data: admins });
  } catch (error) {
    next(error);
  }
}

// ----------------------------------------------------------------------
// Cambiar estado de administrador (solo para superadmin)
// ----------------------------------------------------------------------
async function toggleAdminStatus(req, res, next) {
  try {
    const { id } = req.params;
    const result = await userService.toggleAdminStatus(id);
    res.json({ 
      success: true, 
      message: result.message,
      nuevoEstado: result.nuevoEstado 
    });
  } catch (error) {
    next(error);
  }
}

// ----------------------------------------------------------------------
// Obtener estadísticas del sistema (solo para superadmin)
// ----------------------------------------------------------------------
async function getSystemStats(req, res, next) {
  try {
    const stats = await userService.getSystemStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  registerCliente,
  registerAdmin,
  login,
  getProfile,
  updateProfile,
  updatePassword,
  updateClienteProfile,
  updateAdminProfile,
  changePassword,
  deleteUser,
  createFirstSuperAdmin,
  getAllAdmins,
  toggleAdminStatus,
  getSystemStats
};
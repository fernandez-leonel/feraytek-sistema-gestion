const userModel = require("../models/user.model");
const crypto = require("crypto");

// Obtener usuarios con filtros y paginación
async function getUsersWithFilters(filters) {
  try {
    // Validar y limpiar filtros
    const cleanFilters = {
      rol: filters.rol && ['cliente', 'admin', 'superadmin'].includes(filters.rol) ? filters.rol : null,
      estado: filters.estado && ['activo', 'inactivo'].includes(filters.estado) ? filters.estado : null,
      fecha_desde: filters.fecha_desde || null,
      fecha_hasta: filters.fecha_hasta || null,
      busqueda: filters.busqueda || null,
      orden: filters.orden && ['nombre_usuario', 'email', 'fecha_registro', 'ultimo_login'].includes(filters.orden) ? filters.orden : 'fecha_registro',
      direccion: filters.direccion && ['ASC', 'DESC'].includes(filters.direccion) ? filters.direccion : 'DESC',
      limite: filters.limite ? Math.min(parseInt(filters.limite), 100) : 20, // Máximo 100 por página
      pagina: filters.pagina ? Math.max(parseInt(filters.pagina), 1) : 1
    };

    // Obtener usuarios y total
    const [usuarios, total] = await Promise.all([
      userModel.getAllWithFilters(cleanFilters),
      userModel.countWithFilters(cleanFilters)
    ]);

    // Calcular información de paginación
    const totalPaginas = Math.ceil(total / cleanFilters.limite);
    const paginaActual = cleanFilters.pagina;

    return {
      usuarios,
      paginacion: {
        total,
        totalPaginas,
        paginaActual,
        limite: cleanFilters.limite,
        hayAnterior: paginaActual > 1,
        haySiguiente: paginaActual < totalPaginas
      },
      filtros: cleanFilters
    };
  } catch (error) {
    throw new Error(`Error al obtener usuarios: ${error.message}`);
  }
}

// Cambiar rol de usuario
async function changeUserRole(userId, newRole, adminId) {
  try {
    // Validar que el rol sea válido
    if (!['cliente', 'admin', 'superadmin'].includes(newRole)) {
      throw new Error('Rol inválido');
    }

    // Verificar que el usuario existe
    const user = await userModel.getById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // No permitir cambiar el rol de uno mismo
    if (userId == adminId) {
      throw new Error('No puedes cambiar tu propio rol');
    }

    // Actualizar rol
    const success = await userModel.updateRole(userId, newRole);
    if (!success) {
      throw new Error('Error al actualizar el rol');
    }

    return {
      message: `Rol cambiado exitosamente de '${user.rol}' a '${newRole}'`,
      usuario: {
        id: user.id_usuario,
        nombre: user.nombre_usuario,
        email: user.email,
        rol_anterior: user.rol,
        rol_nuevo: newRole
      }
    };
  } catch (error) {
    throw new Error(`Error al cambiar rol: ${error.message}`);
  }
}

// Activar/desactivar cuenta de usuario
async function toggleUserStatus(userId, adminId) {
  try {
    // Verificar que el usuario existe
    const user = await userModel.getById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // No permitir cambiar el estado de uno mismo
    if (userId == adminId) {
      throw new Error('No puedes cambiar tu propio estado');
    }

    // Determinar nuevo estado
    const newStatus = user.estado === 'activo' ? 'inactivo' : 'activo';

    // Actualizar estado
    const success = await userModel.updateStatus(userId, newStatus);
    if (!success) {
      throw new Error('Error al actualizar el estado');
    }

    return {
      message: `Usuario ${newStatus === 'activo' ? 'activado' : 'desactivado'} exitosamente`,
      usuario: {
        id: user.id_usuario,
        nombre: user.nombre_usuario,
        email: user.email,
        estado_anterior: user.estado,
        estado_nuevo: newStatus
      }
    };
  } catch (error) {
    throw new Error(`Error al cambiar estado: ${error.message}`);
  }
}

// Resetear contraseña de usuario
async function resetUserPassword(userId, adminId) {
  try {
    // Verificar que el usuario existe
    const user = await userModel.getById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // No permitir resetear la contraseña de uno mismo
    if (userId == adminId) {
      throw new Error('No puedes resetear tu propia contraseña');
    }

    // Generar contraseña temporal segura
    const tempPassword = generateTempPassword();

    // Actualizar contraseña
    const success = await userModel.resetPassword(userId, tempPassword);
    if (!success) {
      throw new Error('Error al resetear la contraseña');
    }

    return {
      message: 'Contraseña reseteada exitosamente',
      usuario: {
        id: user.id_usuario,
        nombre: user.nombre_usuario,
        email: user.email
      },
      contraseña_temporal: tempPassword,
      nota: 'El usuario debe cambiar esta contraseña en su próximo login'
    };
  } catch (error) {
    throw new Error(`Error al resetear contraseña: ${error.message}`);
  }
}

// Obtener estadísticas de usuarios
async function getUserStatistics() {
  try {
    const stats = await userModel.getUserStats();
    
    // Calcular porcentajes
    const totalUsuarios = stats.total_usuarios;
    
    return {
      totales: {
        usuarios: totalUsuarios,
        activos: stats.usuarios_activos,
        inactivos: stats.usuarios_inactivos
      },
      por_rol: {
        clientes: stats.clientes,
        admins: stats.admins,
        superadmins: stats.superadmins
      },
      actividad: {
        registros_hoy: stats.registros_hoy,
        registros_semana: stats.registros_semana,
        logins_hoy: stats.logins_hoy
      },
      porcentajes: {
        usuarios_activos: totalUsuarios > 0 ? ((stats.usuarios_activos / totalUsuarios) * 100).toFixed(1) : 0,
        clientes: totalUsuarios > 0 ? ((stats.clientes / totalUsuarios) * 100).toFixed(1) : 0,
        admins: totalUsuarios > 0 ? ((stats.admins / totalUsuarios) * 100).toFixed(1) : 0
      }
    };
  } catch (error) {
    throw new Error(`Error al obtener estadísticas: ${error.message}`);
  }
}

// Función auxiliar para generar contraseña temporal
function generateTempPassword() {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}

module.exports = {
  getUsersWithFilters,
  changeUserRole,
  toggleUserStatus,
  resetUserPassword,
  getUserStatistics
};
const userManagementService = require("../services/userManagement.service");

// Obtener usuarios con filtros
async function getUsers(req, res) {
  try {
    const filters = {
      rol: req.query.rol,
      estado: req.query.estado,
      fecha_desde: req.query.fecha_desde,
      fecha_hasta: req.query.fecha_hasta,
      busqueda: req.query.busqueda,
      orden: req.query.orden,
      direccion: req.query.direccion,
      limite: req.query.limite,
      pagina: req.query.pagina
    };

    const result = await userManagementService.getUsersWithFilters(filters);

    res.status(200).json({
      success: true,
      message: "Usuarios obtenidos exitosamente",
      data: result
    });
  } catch (error) {
    console.error("Error en getUsers:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
}

// Cambiar rol de usuario
async function changeRole(req, res) {
  try {
    const { userId } = req.params;
    const { rol } = req.body;
    const adminId = req.user.id_usuario;

    if (!rol) {
      return res.status(400).json({
        success: false,
        message: "El rol es requerido"
      });
    }

    const result = await userManagementService.changeUserRole(userId, rol, adminId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.usuario
    });
  } catch (error) {
    console.error("Error en changeRole:", error);
    
    if (error.message.includes('no encontrado') || error.message.includes('inválido')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('propio rol')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
}

// Activar/desactivar usuario
async function toggleStatus(req, res) {
  try {
    const { userId } = req.params;
    const adminId = req.user.id_usuario;

    const result = await userManagementService.toggleUserStatus(userId, adminId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.usuario
    });
  } catch (error) {
    console.error("Error en toggleStatus:", error);
    
    if (error.message.includes('no encontrado')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('propio estado')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
}

// Resetear contraseña
async function resetPassword(req, res) {
  try {
    const { userId } = req.params;
    const adminId = req.user.id_usuario;

    const result = await userManagementService.resetUserPassword(userId, adminId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        usuario: result.usuario,
        contraseña_temporal: result.contraseña_temporal,
        nota: result.nota
      }
    });
  } catch (error) {
    console.error("Error en resetPassword:", error);
    
    if (error.message.includes('no encontrado')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('propia contraseña')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
}

// Obtener estadísticas de usuarios
async function getStatistics(req, res) {
  try {
    const stats = await userManagementService.getUserStatistics();

    res.status(200).json({
      success: true,
      message: "Estadísticas obtenidas exitosamente",
      data: stats
    });
  } catch (error) {
    console.error("Error en getStatistics:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
}

module.exports = {
  getUsers,
  changeRole,
  toggleStatus,
  resetPassword,
  getStatistics
};
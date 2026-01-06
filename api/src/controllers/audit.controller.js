const auditService = require("../services/audit.service");

// Obtener logs de auditoría
async function getAuditLogs(req, res) {
  try {
    const filters = {
      tipo_accion: req.query.tipo_accion,
      usuario_id: req.query.usuario_id,
      fecha_desde: req.query.fecha_desde,
      fecha_hasta: req.query.fecha_hasta,
      busqueda: req.query.busqueda,
      orden: req.query.orden,
      direccion: req.query.direccion,
      limite: req.query.limite,
      pagina: req.query.pagina
    };

    const result = await auditService.getAuditLogs(filters);

    res.status(200).json({
      success: true,
      message: "Logs de auditoría obtenidos exitosamente",
      data: result
    });
  } catch (error) {
    console.error("Error en getAuditLogs:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
}

// Obtener estadísticas de auditoría
async function getStatistics(req, res) {
  try {
    const stats = await auditService.getAuditStatistics();

    res.status(200).json({
      success: true,
      message: "Estadísticas de auditoría obtenidas exitosamente",
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

// Obtener actividad reciente
async function getRecentActivity(req, res) {
  try {
    const activity = await auditService.getRecentActivity();

    res.status(200).json({
      success: true,
      message: "Actividad reciente obtenida exitosamente",
      data: activity
    });
  } catch (error) {
    console.error("Error en getRecentActivity:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
}

// Obtener logs de un usuario específico
async function getUserLogs(req, res) {
  try {
    const { userId } = req.params;
    const filters = {
      fecha_desde: req.query.fecha_desde,
      fecha_hasta: req.query.fecha_hasta,
      tipo_accion: req.query.tipo_accion,
      limite: req.query.limite,
      pagina: req.query.pagina
    };

    const result = await auditService.getUserAuditLogs(userId, filters);

    res.status(200).json({
      success: true,
      message: "Logs del usuario obtenidos exitosamente",
      data: result
    });
  } catch (error) {
    console.error("Error en getUserLogs:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
}

// Limpiar logs antiguos
async function cleanOldLogs(req, res) {
  try {
    const { days } = req.body;
    const daysToKeep = days && days > 0 ? parseInt(days) : 90;

    const result = await auditService.cleanOldAuditLogs(daysToKeep);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        registros_eliminados: result.registros_eliminados,
        dias_conservados: result.dias_conservados
      }
    });
  } catch (error) {
    console.error("Error en cleanOldLogs:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
}

// Obtener tipos de acciones disponibles
async function getActionTypes(req, res) {
  try {
    const types = auditService.getActionTypes();

    res.status(200).json({
      success: true,
      message: "Tipos de acciones obtenidos exitosamente",
      data: types
    });
  } catch (error) {
    console.error("Error en getActionTypes:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
}

module.exports = {
  getAuditLogs,
  getStatistics,
  getRecentActivity,
  getUserLogs,
  cleanOldLogs,
  getActionTypes
};
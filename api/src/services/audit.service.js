const auditModel = require("../models/audit.model");

// Obtener logs de auditoría con filtros
async function getAuditLogs(filters) {
  try {
    // Validar y limpiar filtros
    const cleanFilters = {
      tipo_accion: filters.tipo_accion && [
        'login', 'logout', 'cambio_rol', 'cambio_estado', 'reset_password', 
        'pedido', 'producto_cambio', 'error_sistema', 'acceso_denegado'
      ].includes(filters.tipo_accion) ? filters.tipo_accion : null,
      usuario_id: filters.usuario_id ? parseInt(filters.usuario_id) : null,
      fecha_desde: filters.fecha_desde || null,
      fecha_hasta: filters.fecha_hasta || null,
      busqueda: filters.busqueda || null,
      orden: filters.orden && ['fecha_accion', 'tipo_accion', 'usuario_id'].includes(filters.orden) ? filters.orden : 'fecha_accion',
      direccion: filters.direccion && ['ASC', 'DESC'].includes(filters.direccion) ? filters.direccion : 'DESC',
      limite: filters.limite ? Math.min(parseInt(filters.limite), 100) : 50,
      pagina: filters.pagina ? Math.max(parseInt(filters.pagina), 1) : 1
    };

    // Obtener logs y total
    const [logs, total] = await Promise.all([
      auditModel.getAuditLogs(cleanFilters),
      auditModel.countAuditLogs(cleanFilters)
    ]);

    // Calcular información de paginación
    const totalPaginas = Math.ceil(total / cleanFilters.limite);
    const paginaActual = cleanFilters.pagina;

    return {
      logs,
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
    throw new Error(`Error al obtener logs de auditoría: ${error.message}`);
  }
}

// Obtener estadísticas de auditoría
async function getAuditStatistics() {
  try {
    const stats = await auditModel.getAuditStats();
    
    return {
      resumen: {
        total_acciones: stats.total_acciones,
        acciones_hoy: stats.acciones_hoy,
        acciones_semana: stats.acciones_semana
      },
      por_tipo: {
        autenticacion: {
          logins: stats.logins,
          logouts: stats.logouts
        },
        administracion: {
          cambios_rol: stats.cambios_rol,
          cambios_estado: stats.cambios_estado
        },
        negocio: {
          pedidos: stats.pedidos,
          cambios_producto: stats.cambios_producto
        },
        sistema: {
          errores: stats.errores_sistema
        }
      },
      porcentajes: {
        logins: stats.total_acciones > 0 ? ((stats.logins / stats.total_acciones) * 100).toFixed(1) : 0,
        errores: stats.total_acciones > 0 ? ((stats.errores_sistema / stats.total_acciones) * 100).toFixed(1) : 0,
        administracion: stats.total_acciones > 0 ? (((stats.cambios_rol + stats.cambios_estado) / stats.total_acciones) * 100).toFixed(1) : 0
      }
    };
  } catch (error) {
    throw new Error(`Error al obtener estadísticas de auditoría: ${error.message}`);
  }
}

// Obtener actividad reciente (últimas 24 horas)
async function getRecentActivity() {
  try {
    const filters = {
      fecha_desde: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      limite: 20,
      pagina: 1
    };

    const result = await auditModel.getAuditLogs(filters);
    
    return {
      actividad_reciente: result,
      periodo: 'Últimas 24 horas'
    };
  } catch (error) {
    throw new Error(`Error al obtener actividad reciente: ${error.message}`);
  }
}

// Obtener logs por usuario específico
async function getUserAuditLogs(userId, filters = {}) {
  try {
    const userFilters = {
      ...filters,
      usuario_id: userId,
      limite: filters.limite || 20,
      pagina: filters.pagina || 1
    };

    return await getAuditLogs(userFilters);
  } catch (error) {
    throw new Error(`Error al obtener logs del usuario: ${error.message}`);
  }
}

// Limpiar logs antiguos
async function cleanOldAuditLogs(daysToKeep = 90) {
  try {
    const deletedCount = await auditModel.cleanOldLogs(daysToKeep);
    
    return {
      message: `Limpieza de logs completada`,
      registros_eliminados: deletedCount,
      dias_conservados: daysToKeep
    };
  } catch (error) {
    throw new Error(`Error al limpiar logs antiguos: ${error.message}`);
  }
}

// Obtener tipos de acciones disponibles
function getActionTypes() {
  return [
    { value: 'login', label: 'Inicios de sesión' },
    { value: 'logout', label: 'Cierres de sesión' },
    { value: 'cambio_rol', label: 'Cambios de rol' },
    { value: 'cambio_estado', label: 'Cambios de estado' },
    { value: 'reset_password', label: 'Reseteos de contraseña' },
    { value: 'pedido', label: 'Pedidos' },
    { value: 'producto_cambio', label: 'Cambios en productos' },
    { value: 'error_sistema', label: 'Errores del sistema' },
    { value: 'acceso_denegado', label: 'Accesos denegados' }
  ];
}

module.exports = {
  getAuditLogs,
  getAuditStatistics,
  getRecentActivity,
  getUserAuditLogs,
  cleanOldAuditLogs,
  getActionTypes
};
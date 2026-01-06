const auditModel = require("../models/audit.model");

// Middleware para registrar acciones automáticamente
function auditMiddleware(tipo_accion, descripcion_template) {
  return async (req, res, next) => {
    // Guardar la función original de res.json
    const originalJson = res.json;
    
    // Sobrescribir res.json para capturar la respuesta
    res.json = function(data) {
      // Solo registrar si la operación fue exitosa
      if (data && data.success) {
        // Ejecutar el logging de forma asíncrona para no bloquear la respuesta
        setImmediate(async () => {
          try {
            const usuario_id = req.user ? req.user.id_usuario : null;
            const ip_address = req.ip || req.connection.remoteAddress;
            const user_agent = req.get('User-Agent');
            
            // Generar descripción dinámica
            let descripcion = descripcion_template;
            if (req.params.userId) {
              descripcion = descripcion.replace('{userId}', req.params.userId);
            }
            if (req.body && req.body.rol) {
              descripcion = descripcion.replace('{rol}', req.body.rol);
            }
            
            // Preparar detalles adicionales
            const detalles = {
              endpoint: req.originalUrl,
              method: req.method,
              params: req.params,
              body: sanitizeBody(req.body),
              response_status: res.statusCode
            };
            
            await auditModel.logAction({
              tipo_accion,
              usuario_id,
              usuario_afectado_id: req.params.userId || null,
              descripcion,
              detalles,
              ip_address,
              user_agent
            });
          } catch (error) {
            console.error('Error en audit middleware:', error);
          }
        });
      }
      
      // Llamar a la función original
      return originalJson.call(this, data);
    };
    
    next();
  };
}

// Función para registrar acciones manualmente
async function logAuditAction(actionData, req = null) {
  try {
    const logData = {
      ...actionData,
      ip_address: req ? (req.ip || req.connection.remoteAddress) : null,
      user_agent: req ? req.get('User-Agent') : null
    };
    
    return await auditModel.logAction(logData);
  } catch (error) {
    console.error('Error al registrar acción de auditoría:', error);
    throw error;
  }
}

// Función para registrar errores del sistema
async function logSystemError(error, req = null, additionalInfo = {}) {
  try {
    const usuario_id = req && req.user ? req.user.id_usuario : null;
    const ip_address = req ? (req.ip || req.connection.remoteAddress) : null;
    const user_agent = req ? req.get('User-Agent') : null;
    
    const detalles = {
      error_message: error.message,
      error_stack: error.stack,
      endpoint: req ? req.originalUrl : null,
      method: req ? req.method : null,
      ...additionalInfo
    };
    
    await auditModel.logAction({
      tipo_accion: 'error_sistema',
      usuario_id,
      descripcion: `Error del sistema: ${error.message}`,
      detalles,
      ip_address,
      user_agent
    });
  } catch (auditError) {
    console.error('Error al registrar error en auditoría:', auditError);
  }
}

// Función para registrar intentos de acceso denegado
async function logAccessDenied(reason, req) {
  try {
    const usuario_id = req && req.user ? req.user.id_usuario : null;
    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('User-Agent');
    
    const detalles = {
      reason,
      endpoint: req.originalUrl,
      method: req.method,
      headers: sanitizeHeaders(req.headers)
    };
    
    await auditModel.logAction({
      tipo_accion: 'acceso_denegado',
      usuario_id,
      descripcion: `Acceso denegado: ${reason}`,
      detalles,
      ip_address,
      user_agent
    });
  } catch (error) {
    console.error('Error al registrar acceso denegado:', error);
  }
}

// Función para limpiar datos sensibles del body
function sanitizeBody(body) {
  if (!body) return null;
  
  const sanitized = { ...body };
  
  // Remover campos sensibles
  const sensitiveFields = ['password', 'contraseña', 'token', 'secret'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

// Función para limpiar headers sensibles
function sanitizeHeaders(headers) {
  if (!headers) return null;
  
  const sanitized = { ...headers };
  
  // Remover headers sensibles
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
  sensitiveHeaders.forEach(header => {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

module.exports = {
  auditMiddleware,
  logAuditAction,
  logSystemError,
  logAccessDenied
};
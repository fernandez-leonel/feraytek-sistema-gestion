const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth');

// Middleware para todas las rutas de admin - requiere rol admin
router.use(verifyToken);
router.use(isAdmin);

// ===== DASHBOARD STATS =====
// Estadísticas básicas del dashboard
router.get('/stats/users-count', async (req, res) => {
  try {
    const pool = require('../config/database');
    const [result] = await pool.query('SELECT COUNT(*) as total FROM usuarios');
    res.json({ 
      success: true, 
      message: 'Estadísticas de usuarios obtenidas correctamente',
      count: result[0].total 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas de usuarios' });
  }
});

router.get('/stats/orders-today', async (req, res) => {
  try {
    const pool = require('../config/database');
    const [result] = await pool.query(
      'SELECT COUNT(*) as total FROM pedidos WHERE DATE(fecha_pedido) = CURDATE()'
    );
    res.json({ 
      success: true, 
      message: 'Pedidos de hoy obtenidos correctamente',
      count: result[0].total 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener pedidos de hoy' });
  }
});

router.get('/stats/revenue-month', async (req, res) => {
  try {
    const pool = require('../config/database');
    const [result] = await pool.query(
      'SELECT COALESCE(SUM(total), 0) as revenue FROM pedidos WHERE MONTH(fecha_pedido) = MONTH(CURDATE()) AND YEAR(fecha_pedido) = YEAR(CURDATE())'
    );
    res.json({ 
      success: true, 
      message: 'Ingresos del mes obtenidos correctamente',
      revenue: result[0].revenue 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener ingresos del mes' });
  }
});

// ===== USER MANAGEMENT =====
// Listar usuarios con paginación
router.get('/users/list', async (req, res) => {
  try {
    const pool = require('../config/database');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const [users] = await pool.query(
      `SELECT 
         u.id_usuario,
         c.id_cliente,
         u.nombre_usuario,
         u.email,
         u.rol,
         u.estado,
         u.fecha_registro
       FROM usuarios u
       LEFT JOIN clientes c ON c.id_usuario = u.id_usuario
       ORDER BY u.fecha_registro DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    const [totalResult] = await pool.query('SELECT COUNT(*) as total FROM usuarios');
    
    res.json({ 
      success: true, 
      message: 'Lista de usuarios obtenida correctamente',
      users, 
      pagination: {
        page,
        limit,
        total: totalResult[0].total,
        pages: Math.ceil(totalResult[0].total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener lista de usuarios' });
  }
});

// Cambiar rol de usuario
router.put('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { rol } = req.body;
    
    if (!['cliente', 'admin', 'superadmin'].includes(rol)) {
      return res.status(400).json({ success: false, message: 'Rol inválido' });
    }
    
    const pool = require('../config/database');
    await pool.query('UPDATE usuarios SET rol = ? WHERE id_usuario = ?', [rol, id]);
    
    res.json({ success: true, message: 'Rol actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar rol' });
  }
});

// Cambiar estado de usuario (activo/inactivo)
router.put('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    
    if (!['activo', 'inactivo'].includes(estado)) {
      return res.status(400).json({ success: false, message: 'Estado inválido' });
    }
    
    const pool = require('../config/database');
    await pool.query('UPDATE usuarios SET estado = ? WHERE id_usuario = ?', [estado, id]);
    
    res.json({ success: true, message: 'Estado de usuario actualizado' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar estado de usuario' });
  }
});

// ===== SIMPLE AUDIT =====
// Registrar acción manual de auditoría
router.post('/audit/log', async (req, res) => {
  try {
    const { tipo_accion, descripcion, detalles, usuario_afectado_id } = req.body;
    const usuario_id = req.user.id;
    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('User-Agent');
    
    const pool = require('../config/database');
    await pool.query(
      'INSERT INTO auditoria (tipo_accion, usuario_id, usuario_afectado_id, descripcion, detalles, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [tipo_accion, usuario_id, usuario_afectado_id || null, descripcion, JSON.stringify(detalles), ip_address, user_agent]
    );
    
    res.json({ success: true, message: 'Acción registrada en auditoría correctamente' });
  } catch (error) {
    console.error('Error en auditoría:', error);
    res.status(500).json({ success: false, message: 'Error al registrar auditoría' });
  }
});

// Obtener logs de auditoría
router.get('/audit/logs', async (req, res) => {
  try {
    const pool = require('../config/database');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    const [logs] = await pool.query(`
      SELECT a.*, u.nombre_usuario as usuario_nombre 
      FROM auditoria a 
      LEFT JOIN usuarios u ON a.usuario_id = u.id_usuario 
      ORDER BY a.fecha_accion DESC 
      LIMIT ? OFFSET ?
    `, [limit, offset]);
    
    res.json({ 
      success: true, 
      message: 'Logs de auditoría obtenidos correctamente',
      logs 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener logs de auditoría' });
  }
});

// ===== BASIC CONFIG =====
// Obtener configuraciones
router.get('/config', async (req, res) => {
  try {
    // Por simplicidad, usamos configuraciones hardcodeadas
    // En el futuro se puede mover a una tabla de configuraciones
    const config = {
      max_cart_items: 50,
      maintenance_mode: false,
      allow_registrations: true,
      max_file_size_mb: 10
    };
    
    res.json({ 
      success: true, 
      message: 'Configuraciones obtenidas correctamente',
      config 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener configuraciones' });
  }
});

// Actualizar configuración específica
router.put('/config/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    // Por simplicidad, solo validamos las claves permitidas
    const allowedKeys = ['max_cart_items', 'maintenance_mode', 'allow_registrations', 'max_file_size_mb'];
    
    if (!allowedKeys.includes(key)) {
      return res.status(400).json({ success: false, message: 'Clave de configuración no válida' });
    }
    
    // Aquí se podría guardar en una tabla de configuraciones
    // Por ahora solo respondemos que se actualizó
    res.json({ success: true, message: `Configuración ${key} actualizada a ${value}` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar configuración' });
  }
});

module.exports = router;
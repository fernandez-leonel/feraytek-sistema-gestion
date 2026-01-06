const db = require("../config/database"); // Conexión a MySQL

// Función temporal para verificar datos en historial_pedidos
const verificarDatosHistorial = async () => {
  const [rows] = await db.query(`
    SELECT COUNT(*) as total_registros,
           MIN(id_historial) as primer_id,
           MAX(id_historial) as ultimo_id
    FROM historial_pedidos
  `);
  return rows[0];
};

// Función temporal para crear historial automáticamente para pedidos existentes
const crearHistorialParaPedidosExistentes = async () => {
  try {
    // Obtener todos los pedidos que no tienen historial
    const [pedidosSinHistorial] = await db.query(`
      SELECT p.id_pedido, p.estado, p.fecha_pedido, p.id_usuario
      FROM pedidos p
      LEFT JOIN historial_pedidos hp ON p.id_pedido = hp.id_pedido
      WHERE hp.id_pedido IS NULL
    `);

    const resultados = [];
    
    // Crear registro de historial inicial para cada pedido
    for (const pedido of pedidosSinHistorial) {
      const [result] = await db.query(`
        INSERT INTO historial_pedidos 
        (id_pedido, estado_anterior, estado_nuevo, id_usuario, fecha_cambio)
        VALUES (?, NULL, ?, ?, ?)
      `, [
        pedido.id_pedido,
        pedido.estado,
        pedido.id_usuario || 1, // Usuario por defecto si no hay
        pedido.fecha_pedido
      ]);
      
      resultados.push({
        id_pedido: pedido.id_pedido,
        estado: pedido.estado,
        id_historial: result.insertId
      });
    }

    return {
      pedidos_procesados: pedidosSinHistorial.length,
      resultados
    };
  } catch (error) {
    throw new Error(`Error al crear historial para pedidos existentes: ${error.message}`);
  }
};

// Función temporal para obtener algunos registros de ejemplo
const obtenerEjemplosHistorial = async () => {
  const [rows] = await db.query(`
    SELECT id_historial, id_pedido, estado_anterior, estado_nuevo, fecha_cambio, id_usuario
    FROM historial_pedidos 
    ORDER BY fecha_cambio DESC 
    LIMIT 5
  `);
  return rows;
};

// Objeto que contiene las operaciones relacionadas con la tabla historial_pedidos
const HistorialPedidos = {
  // Obtener todos los registros del historial con información detallada
  getAll: async () => {
    const [rows] = await db.query(`
      SELECT 
        hp.*,
        p.id_pedido as numero_pedido,
        p.total,
        p.fecha_pedido,
        CASE 
          WHEN c.nombre IS NOT NULL THEN CONCAT(c.nombre, ' ', c.apellido)
          WHEN a.nombre IS NOT NULL THEN CONCAT(a.nombre, ' ', a.apellido)
          ELSE 'Sistema'
        END as nombre_cliente,
        CASE 
          WHEN u_cambio.nombre_usuario IS NOT NULL THEN u_cambio.nombre_usuario
          ELSE 'Sistema'
        END as usuario_cambio,
        u_cambio.rol as rol_usuario_cambio
      FROM historial_pedidos hp
      LEFT JOIN pedidos p ON hp.id_pedido = p.id_pedido
      LEFT JOIN usuarios u_pedido ON p.id_usuario = u_pedido.id_usuario
      LEFT JOIN clientes c ON u_pedido.id_usuario = c.id_usuario
      LEFT JOIN administradores a ON u_pedido.id_usuario = a.id_usuario
      LEFT JOIN usuarios u_cambio ON hp.id_usuario = u_cambio.id_usuario
      ORDER BY hp.fecha_cambio DESC
    `);
    return rows;
  },

  // Obtener historial por ID de pedido con información detallada
  getByPedido: async (id_pedido) => {
    const [rows] = await db.query(`
      SELECT 
        hp.*,
        p.id_pedido as numero_pedido,
        p.total,
        p.fecha_pedido,
        CASE 
          WHEN u_cambio.nombre_usuario IS NOT NULL THEN u_cambio.nombre_usuario
          ELSE 'Sistema'
        END as usuario_cambio,
        u_cambio.rol as rol_usuario_cambio
      FROM historial_pedidos hp
      LEFT JOIN pedidos p ON hp.id_pedido = p.id_pedido
      LEFT JOIN usuarios u_cambio ON hp.id_usuario = u_cambio.id_usuario
      WHERE hp.id_pedido = ? 
      ORDER BY hp.fecha_cambio DESC
    `, [id_pedido]);
    return rows;
  },

  // Crear un nuevo registro en el historial
  create: async (id_pedido, estado_anterior, estado_nuevo, id_usuario) => {
    const [result] = await db.query(
      `INSERT INTO historial_pedidos 
       (id_pedido, estado_anterior, estado_nuevo, id_usuario)
       VALUES (?, ?, ?, ?)`,
      [id_pedido, estado_anterior, estado_nuevo, id_usuario]
    );
    return { id_historial: result.insertId };
  },
};

module.exports = {
  ...HistorialPedidos,
  verificarDatosHistorial,
  obtenerEjemplosHistorial,
  crearHistorialParaPedidosExistentes,
};

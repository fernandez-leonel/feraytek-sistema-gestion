// Este módulo gestiona las operaciones SQL relacionadas con la tabla `pagos`,
// incluyendo la creación de nuevos pagos, la obtención de registros y la
// actualización del estado de un pago existente.

const pool = require("../config/database");

// Crear un nuevo pago (inicialmente en estado "pendiente"):
// Recibe los datos del pedido y el monto total, junto con la preferencia
// generada por Mercado Pago (sandbox_init_point y preference_id).
// Se inserta un registro en la tabla `pagos` asociado al `id_pedido`.
// ----------------------------------------------------------------------
async function crearPago({
  id_pedido,
  metodo_pago,
  monto,
  id_transaccion,
  raw_gateway_json,
}) {
  const [result] = await pool.query(
    `INSERT INTO pagos (id_pedido, metodo_pago, monto, id_transaccion, raw_gateway_json)
     VALUES (?, ?, ?, ?, ?)`,
    [
      id_pedido,
      metodo_pago,
      monto,
      id_transaccion,
      JSON.stringify(raw_gateway_json),
    ]
  );

  return result.insertId; // Devuelve el ID del nuevo pago
}

// Listar todos los pagos registrados:
// Retorna un listado con información básica:
async function listarPagos() {
  const [rows] = await pool.query(
    `SELECT id_pago, id_pedido, metodo_pago, monto, estado_pago, fecha_pago
     FROM pagos ORDER BY created_at DESC`
  );
  return rows;
}

// Obtener el detalle completo de un pago específico
// Incluye el JSON completo del gateway para auditoría.
async function obtenerPagoPorId(id_pago) {
  const [rows] = await pool.query(`SELECT * FROM pagos WHERE id_pago = ?`, [
    id_pago,
  ]);
  return rows[0];
}

// Actualizar el estado de un pago
// Cambia el campo `estado_pago` según la respuesta del gateway.
// También actualiza la fecha de pago si el estado es "aprobado".
async function actualizarEstadoPago(id_pago, nuevoEstado) {
  const fechaPago = nuevoEstado === "aprobado" ? new Date() : null;

  await pool.query(
    `UPDATE pagos
     SET estado_pago = ?, fecha_pago = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id_pago = ?`,
    [nuevoEstado, fechaPago, id_pago]
  );

  return { id_pago, estado_pago: nuevoEstado };
}

// Buscar un pago por su ID de transacción de Mercado Pago
// Permite encontrar el pago específico cuando llega un webhook.
async function obtenerPagoPorTransaccion(id_transaccion) {
  const [rows] = await pool.query(`SELECT * FROM pagos WHERE id_transaccion = ?`, [
    id_transaccion,
  ]);
  return rows[0];
}

// Buscar un pago por su ID de pedido
// Permite verificar si un pedido ya tiene un pago asociado (1:1).
async function obtenerPagoPorPedido(id_pedido) {
  const [rows] = await pool.query(`SELECT * FROM pagos WHERE id_pedido = ?`, [
    id_pedido,
  ]);
  return rows[0];
}

// Actualizar datos crudos del gateway (webhook callback)
// Guarda la respuesta completa del webhook de Mercado Pago en formato JSON.
async function registrarWebhook(id_pago, raw_gateway_json) {
  await pool.query(
    `UPDATE pagos
     SET raw_gateway_json = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id_pago = ?`,
    [JSON.stringify(raw_gateway_json), id_pago]
  );
  return true;
}

// Consultar pagos con filtros y paginación
async function consultarPagosConFiltros(filtros) {
  console.log('=== MODELO consultarPagosConFiltros ===');
  console.log('Filtros recibidos:', filtros);
  
  let sql = `
    SELECT 
      p.*,
      pe.fecha_pedido,
      pe.total as total_pedido,
      pe.estado as estado_pedido,
      u.nombre_usuario as nombre_usuario,
      u.email as email_usuario
    FROM pagos p
    LEFT JOIN pedidos pe ON p.id_pedido = pe.id_pedido
    LEFT JOIN usuarios u ON pe.id_usuario = u.id_usuario
    WHERE 1=1
  `;
  
  const params = [];

  console.log('SQL inicial:', sql);

  // Aplicar filtros
  if (filtros.estado) {
    sql += ` AND p.estado_pago = ?`;
    params.push(filtros.estado);
  }

  if (filtros.fecha_desde) {
    sql += ` AND DATE(p.created_at) >= ?`;
    params.push(filtros.fecha_desde);
  }

  if (filtros.fecha_hasta) {
    sql += ` AND DATE(p.created_at) <= ?`;
    params.push(filtros.fecha_hasta);
  }

  if (filtros.id_pedido) {
    sql += ` AND p.id_pedido = ?`;
    params.push(filtros.id_pedido);
  }

  if (filtros.id_usuario) {
    sql += ` AND pe.id_usuario = ?`;
    params.push(filtros.id_usuario);
  }

  if (filtros.monto_min) {
    sql += ` AND p.monto >= ?`;
    params.push(filtros.monto_min);
  }

  if (filtros.monto_max) {
    sql += ` AND p.monto <= ?`;
    params.push(filtros.monto_max);
  }

  // Contar total de registros (construir query separada)
  let countSql = `
    SELECT COUNT(*) as total 
    FROM pagos p
    LEFT JOIN pedidos pe ON p.id_pedido = pe.id_pedido
    LEFT JOIN usuarios u ON pe.id_usuario = u.id_usuario
    WHERE 1=1
  `;
  
  // Agregar los mismos filtros que en la consulta principal
  if (filtros.estado_pago) {
    countSql += ` AND p.estado_pago = ?`;
  }
  
  if (filtros.metodo_pago) {
    countSql += ` AND p.metodo_pago = ?`;
  }
  
  if (filtros.id_pedido) {
    countSql += ` AND p.id_pedido = ?`;
  }

  if (filtros.id_usuario) {
    countSql += ` AND pe.id_usuario = ?`;
  }

  if (filtros.monto_min) {
    countSql += ` AND p.monto >= ?`;
  }

  if (filtros.monto_max) {
    countSql += ` AND p.monto <= ?`;
  }

  if (filtros.fecha_desde) {
    countSql += ` AND DATE(p.created_at) >= ?`;
  }
  
  if (filtros.fecha_hasta) {
    countSql += ` AND DATE(p.created_at) <= ?`;
  }
  
  console.log('Count SQL:', countSql);
  const [countRows] = await pool.query(countSql, params);
  const total = countRows[0].total;

  // Agregar ordenamiento y paginación
  sql += ` ORDER BY p.created_at DESC`;
  
  if (filtros.limit) {
    sql += ` LIMIT ?`;
    params.push(parseInt(filtros.limit));
    
    if (filtros.offset) {
      sql += ` OFFSET ?`;
      params.push(parseInt(filtros.offset));
    }
  }

  const [rows] = await pool.query(sql, params);
  
  console.log('Consulta ejecutada exitosamente. Filas encontradas:', rows.length);
  console.log('Total de registros:', total);
  
  return {
    pagos: rows,
    total: total,
    pagina: filtros.page || 1,
    limite: filtros.limit || 10,
    totalPaginas: Math.ceil(total / (filtros.limit || 10))
  };
}

module.exports = {
  crearPago,
  listarPagos,
  obtenerPagoPorId,
  actualizarEstadoPago,
  obtenerPagoPorTransaccion,
  obtenerPagoPorPedido,
  registrarWebhook,
  consultarPagosConFiltros,
};

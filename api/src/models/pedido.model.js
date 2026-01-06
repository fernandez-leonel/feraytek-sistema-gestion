// ======================================================================
// Responsable de las operaciones SQL sobre las tablas:
// - pedidos
// - pedido_detalle
// Se comunica con la base de datos MySQL mediante 'pool'.
// ======================================================================

const pool = require("../config/database");

// Crear nuevo pedido
// Recibe los datos del usuario, subtotal, descuentos, costo de envío, total
// y devuelve el ID del nuevo pedido creado.

async function crearPedido({
  id_usuario,
  subtotal,
  descuento_total,
  costo_envio,
  total,
  metodo_entrega,
  notas,
}) {
  const connection = await pool.getConnection();

  try {
    // Iniciar transacción para asegurar consistencia
    await connection.beginTransaction();

    // Ejecuta una consulta SQL para insertar un nuevo registro en la tabla "pedidos"
    const [result] = await connection.query(
      `INSERT INTO pedidos (id_usuario, subtotal, descuento_total, costo_envio, total, metodo_entrega, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id_usuario,
        subtotal,
        descuento_total,
        costo_envio,
        total,
        metodo_entrega,
        notas || null, // Observaciones opcionales (se guarda null si no hay)
      ]
    );

    const nuevoPedidoId = result.insertId;

    // AUTOMÁTICO: Crear registro inicial en historial_pedidos
    await connection.query(
      `INSERT INTO historial_pedidos (id_pedido, estado_anterior, estado_nuevo, id_usuario, fecha_cambio)
       VALUES (?, NULL, 'pendiente', ?, NOW())`,
      [nuevoPedidoId, id_usuario]
    );

    // Confirmar transacción
    await connection.commit();

    return nuevoPedidoId;
  } catch (error) {
    // Revertir transacción en caso de error
    await connection.rollback();
    throw error;
  } finally {
    // Liberar conexión
    connection.release();
  }
}

// Insertar detalle del pedido
// Registra cada línea del pedido (producto, cantidad, precios, IVA).

// Función asíncrona para agregar los ítems (detalles) de un pedido con manejo de errores
async function agregarDetalle(id_pedido, items) {
  try {
    // Recorre cada producto dentro del array "items"
    for (const item of items) {
      // Inserta cada detalle en la tabla "pedido_detalle"
      await pool.query(
        `INSERT INTO pedido_detalle 
         (id_pedido, id_producto, id_variante, cantidad, precio_unitario, iva_porcentaje, iva_monto)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id_pedido,
          item.id_producto,
          item.id_variante,
          item.cantidad,
          item.precio_unitario,
          item.iva_porcentaje,
          item.iva_monto,
        ]
      );
    }

    // Si todo se ejecutó correctamente, devuelve true
    return true;
  } catch (error) {
    // Muestra el error en consola para depuración
    console.error("Error al insertar detalle del pedido:", error);

    // Lanza el error para que pueda ser manejado por el controlador superior
    throw new Error("No se pudo agregar el detalle del pedido.");
  }
}

// Obtener listado de pedidos por usuario
// Incluye datos básicos: id, total, estado, fecha.

// Función asíncrona para listar los pedidos de un usuario con sus detalles
async function listarPedidosPorUsuario(id_usuario) {
  try {
    // Consulta principal: obtiene todos los pedidos del usuario
    const [pedidos] = await pool.query(
      `SELECT 
         p.id_pedido,
         p.fecha_pedido,
         p.total,
         p.estado,
         p.metodo_entrega
       FROM pedidos AS p
       WHERE p.id_usuario = ?
       ORDER BY p.fecha_pedido DESC`,
      [id_usuario]
    );

    // Para cada pedido, obtener sus productos asociados
    for (const pedido of pedidos) {
      const [detalles] = await pool.query(
        `SELECT 
           d.id_detalle,
           d.id_producto,
           pr.nombre AS nombre_producto,
           d.cantidad,
           d.precio_unitario,
           d.iva_porcentaje,
           d.iva_monto
         FROM pedido_detalle AS d
         JOIN productos AS pr ON d.id_producto = pr.id_producto
         WHERE d.id_pedido = ?`,
        [pedido.id_pedido]
      );

      // Agrega el array de detalles a cada pedido
      pedido.detalles = detalles;
    }

    // Devuelve todos los pedidos con sus detalles incluidos
    return pedidos;
  } catch (error) {
    console.error("Error al listar pedidos del usuario:", error);
    throw new Error("No se pudieron obtener los pedidos del usuario.");
  }
}

// Obtener detalle completo de un pedido específico
// Devuelve los ítems asociados, con nombres de productos y variantes.
async function obtenerDetallePedido(id_pedido) {
  // Consulta SQL que une los detalles del pedido con los nombres de productos y variantes
  const [rows] = await pool.query(
    `SELECT pd.*, p.nombre AS producto, v.valor AS variante, v.atributo
     FROM pedido_detalle pd
     INNER JOIN productos p ON pd.id_producto = p.id_producto
     LEFT JOIN variantes_producto v ON pd.id_variante = v.id_variante
     WHERE pd.id_pedido = ?`,
    [id_pedido]
  );
  // Devuelve un arreglo con los ítems del pedido
  return rows;
}

//lista de todo los pedidos
async function listarTodosPedidos() {
  try {
    const [pedidos] = await pool.query(
      `SELECT 
         p.id_pedido,
         p.id_usuario,
         p.fecha_pedido,
         p.total,
         p.estado,
         p.metodo_entrega
       FROM pedidos AS p
       ORDER BY p.fecha_pedido DESC`
    );

    for (const pedido of pedidos) {
      const [detalles] = await pool.query(
        `SELECT 
           d.id_detalle,
           d.id_producto,
           pr.nombre AS nombre_producto,
           d.cantidad,
           d.precio_unitario,
           d.iva_porcentaje,
           d.iva_monto
         FROM pedido_detalle AS d
         JOIN productos AS pr ON d.id_producto = pr.id_producto
         WHERE d.id_pedido = ?`,
        [pedido.id_pedido]
      );
      pedido.detalles = detalles;
    }

    return pedidos;
  } catch (error) {
    console.error("Error al listar todos los pedidos:", error);
    throw new Error("No se pudieron obtener los pedidos.");
  }
}

// Obtener el usuario propietario de un pedido (cabecera)
async function obtenerUsuarioDePedido(id_pedido) {
  const [rows] = await pool.query(
    `SELECT id_usuario FROM pedidos WHERE id_pedido = ?`,
    [id_pedido]
  );
  if (rows.length === 0) return null;
  return rows[0].id_usuario;
}

// Actualizar estado del pedido (por ejemplo: 'pagado', 'enviado', 'cancelado', etc.)
async function actualizarEstado(id_pedido, nuevoEstado, id_usuario = null) {
  const connection = await pool.getConnection();

  try {
    // Iniciar transacción para asegurar consistencia
    await connection.beginTransaction();

    // 🔍 Obtener el estado actual antes de actualizarlo
    const [pedidoActual] = await connection.query(
      `SELECT estado, id_usuario FROM pedidos WHERE id_pedido = ?`,
      [id_pedido]
    );

    if (pedidoActual.length === 0) {
      throw new Error(`Pedido con ID ${id_pedido} no encontrado`);
    }

    const estadoAnterior = pedidoActual[0].estado;
    const usuarioPedido = id_usuario || pedidoActual[0].id_usuario;

    // Solo actualizar si el estado es diferente
    if (estadoAnterior !== nuevoEstado) {
      // Ejecuta una consulta SQL para actualizar el estado del pedido
      await connection.query(
        `UPDATE pedidos 
         SET estado = ?
         WHERE id_pedido = ?`,
        [nuevoEstado, id_pedido]
      );

      //  AUTOMÁTICO: Crear registro en historial_pedidos
      await connection.query(
        `INSERT INTO historial_pedidos (id_pedido, estado_anterior, estado_nuevo, id_usuario, fecha_cambio)
         VALUES (?, ?, ?, ?, NOW())`,
        [id_pedido, estadoAnterior, nuevoEstado, usuarioPedido]
      );
    }

    // Confirmar transacción
    await connection.commit();

    // Devuelve true si la operación se realizó correctamente
    return true;
  } catch (error) {
    // Revertir transacción en caso de error
    await connection.rollback();
    throw error;
  } finally {
    // Liberar conexión
    connection.release();
  }
}

// Función temporal para verificar datos en la tabla pedidos
async function verificarDatosPedidos() {
  const [rows] = await pool.query(`
    SELECT COUNT(*) as total_pedidos,
           MIN(id_pedido) as primer_id,
           MAX(id_pedido) as ultimo_id
    FROM pedidos
  `);
  return rows[0];
}

// Función temporal para obtener algunos pedidos de ejemplo
async function obtenerPedidosEjemplo() {
  const [rows] = await pool.query(`
    SELECT id_pedido, id_usuario, fecha_pedido, total, estado, metodo_entrega
    FROM pedidos 
    ORDER BY fecha_pedido DESC 
    LIMIT 5
  `);
  return rows;
}

module.exports = {
  crearPedido,
  agregarDetalle,
  listarPedidosPorUsuario,
  listarTodosPedidos,
  obtenerDetallePedido,
  verificarDatosPedidos,
  obtenerPedidosEjemplo,
  actualizarEstado,
  obtenerUsuarioDePedido,
};

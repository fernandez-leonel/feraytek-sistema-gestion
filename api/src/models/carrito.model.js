// ======================================================================
// Se comunica directamente con la base de datos MySQL.
// Gestiona carritos, sus ítems y operaciones CRUD.
// ======================================================================

const pool = require("../config/database");

// ----------------------------------------------------------------------
// Obtener el carrito activo de un usuario
// ----------------------------------------------------------------------
// Con Async/Await para manejar operaciones asíncronas de forma más sencilla y legible
// realizamos la id del usuario y retornamos el carrito activo o undefined
async function getCarritoActivo(id_usuario) {
  // Consulta SQL para obtener el carrito activo del usuario
  const [rows] = await pool.query(
    "SELECT * FROM carrito WHERE id_usuario = ? AND estado = 'activo' LIMIT 1",
    [id_usuario]
  );
  return rows[0]; // Retorna el primer carrito activo o undefined si no existe
}

// ----------------------------------------------------------------------
// Crear un nuevo carrito activo para un usuario
// ----------------------------------------------------------------------
// Crear el Carrito del usuario si no tiene uno activo
async function crearCarrito(id_usuario) {
  // Insertar un nuevo carrito con estado 'activo' del usuario
  const [result] = await pool.query(
    "INSERT INTO carrito (id_usuario, estado) VALUES (?, 'activo')",
    [id_usuario]
  );
  return result.insertId; // Retorna el ID del nuevo carrito creado
}

// ----------------------------------------------------------------------
// Agregar o actualizar producto dentro del carrito
// ----------------------------------------------------------------------
// Si el producto ya existe en el carrito, se actualiza la cantidad o sus atributos
async function agregarProducto({
  id_carrito,
  id_producto,
  id_variante,
  cantidad,
  precio_unitario,
  iva_porcentaje,
  iva_monto,
}) {
  // Si el producto ya existe en el carrito, se actualiza la cantidad
  const [existe] = await pool.query(
    `SELECT * FROM carrito_detalle WHERE id_carrito = ? AND id_producto = ? AND (id_variante <=> ?)`,
    [id_carrito, id_producto, id_variante]
  );

  // Si es mayor a 0, el producto ya existe en el carrito, actualizamos la cantidad
  if (existe.length > 0) {
    // Actualizar la cantidad sumando la nueva cantidad a la existente con sql
    await pool.query(
      `UPDATE carrito_detalle 
       SET cantidad = cantidad + ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id_carrito = ? AND id_producto = ? AND (id_variante <=> ?)`,
      [cantidad, id_carrito, id_producto, id_variante]
    );
  } else {
    // Si no existe, se inserta como un nuevo ítem en el carrito
    // Insertar nuevo ítem en el carrito
    await pool.query(
      `INSERT INTO carrito_detalle
       (id_carrito, id_producto, id_variante, cantidad, precio_unitario, iva_porcentaje, iva_monto)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id_carrito,
        id_producto,
        id_variante,
        cantidad,
        precio_unitario,
        iva_porcentaje,
        iva_monto,
      ]
    );
  }
  return true; // Retorna true para indicar que la operación fue exitosa
}

// ----------------------------------------------------------------------
// Obtener los ítems del carrito activo
// ----------------------------------------------------------------------

// Retorna un array con los productos del carrito, incluyendo detalles del producto y variante si aplica
// id_carrito: ID del carrito activo
async function getItems(id_carrito) {
  // Consulta SQL para obtener los ítems del carrito junto con detalles del producto y variante
  const [rows] = await pool.query(
    `SELECT cd.*, p.nombre, p.precio_base, p.iva_porcentaje, v.valor AS variante, v.atributo
     FROM carrito_detalle cd
     INNER JOIN productos p ON cd.id_producto = p.id_producto
     LEFT JOIN variantes_producto v ON cd.id_variante = v.id_variante
     WHERE cd.id_carrito = ?`,
    [id_carrito] // Parámetro para la consulta segura (evita SQL Injection
  );
  return rows; // Retorna un array con los ítems del carrito
}

// ----------------------------------------------------------------------
// Eliminar producto del carrito
// ----------------------------------------------------------------------
// Elimina un ítem específico del carrito basado en id_carrito, id_producto e id_variante
// (si aplica)
async function eliminarItem(id_carrito, id_producto, id_variante) {
  // Eliminar el ítem del carrito
  const [result] = await pool.query(
    `DELETE FROM carrito_detalle
     WHERE id_carrito = ? AND id_producto = ? AND (id_variante <=> ?)`,
    [id_carrito, id_producto, id_variante] // Parámetros para la consulta segura (evita SQL Injection
  );
  return result.affectedRows > 0; // Si es restornoa es mayor a 0, se eliminó el ítem
}

// ----------------------------------------------------------------------
// Vaciar carrito completo
// ----------------------------------------------------------------------

// Elimina todos los ítems del carrito pero mantiene el carrito activo
async function vaciarCarrito(id_carrito) {
  // Eliminar todos los ítems del carrito
  await pool.query(`DELETE FROM carrito_detalle WHERE id_carrito = ?`, [
    id_carrito,
  ]); // Parámetro para la consulta segura (evita SQL Injection)
  
  // El carrito permanece activo y vacío, listo para nuevos productos
  return true; // Si llega aquí, se vació el carrito exitosamente
}

// ----------------------------------------------------------------------
// FUNCIONES ADMINISTRATIVAS
// ----------------------------------------------------------------------

// Obtener todos los carritos del sistema con información del usuario
async function getTodosLosCarritos() {
  const [rows] = await pool.query(
    `SELECT c.*, u.nombre_usuario, u.email, u.rol,
            COUNT(cd.id_detalle) as total_items,
            COALESCE(SUM(cd.cantidad * cd.precio_unitario), 0) as valor_total
     FROM carrito c
     INNER JOIN usuarios u ON c.id_usuario = u.id_usuario
     LEFT JOIN carrito_detalle cd ON c.id_carrito = cd.id_carrito
     GROUP BY c.id_carrito, u.id_usuario
     ORDER BY c.updated_at DESC`
  );
  return rows;
}

// Obtener carritos abandonados (sin actividad por X días)
async function getCarritosAbandonados(dias) {
  const [rows] = await pool.query(
    `SELECT c.*, u.nombre_usuario, u.email,
            COUNT(cd.id_detalle) as total_items,
            COALESCE(SUM(cd.cantidad * cd.precio_unitario), 0) as valor_total,
            DATEDIFF(NOW(), c.updated_at) as dias_inactivo
     FROM carrito c
     INNER JOIN usuarios u ON c.id_usuario = u.id_usuario
     LEFT JOIN carrito_detalle cd ON c.id_carrito = cd.id_carrito
     WHERE c.estado = 'activo' 
       AND DATEDIFF(NOW(), c.updated_at) > ?
       AND EXISTS (SELECT 1 FROM carrito_detalle WHERE id_carrito = c.id_carrito)
     GROUP BY c.id_carrito, u.id_usuario
     ORDER BY c.updated_at ASC`,
    [dias]
  );
  return rows;
}

// Eliminar carritos abandonados
async function eliminarCarritosAbandonados(dias) {
  // Primero eliminar los detalles de los carritos abandonados
  await pool.query(
    `DELETE cd FROM carrito_detalle cd
     INNER JOIN carrito c ON cd.id_carrito = c.id_carrito
     WHERE c.estado = 'activo' 
       AND DATEDIFF(NOW(), c.updated_at) > ?`,
    [dias]
  );

  // Luego eliminar los carritos abandonados
  const [result] = await pool.query(
    `DELETE FROM carrito 
     WHERE estado = 'activo' 
       AND DATEDIFF(NOW(), updated_at) > ?`,
    [dias]
  );

  return result.affectedRows;
}

// Obtener estadísticas de carritos
async function getEstadisticasCarritos() {
  // Estadísticas generales
  const [general] = await pool.query(
    `SELECT 
       COUNT(*) as total_carritos,
       COUNT(CASE WHEN estado = 'activo' THEN 1 END) as carritos_activos,
       COUNT(CASE WHEN estado = 'completado' THEN 1 END) as carritos_completados,
       COUNT(CASE WHEN estado = 'abandonado' THEN 1 END) as carritos_abandonados
     FROM carrito`
  );

  // Estadísticas de productos en carritos
  const [productos] = await pool.query(
    `SELECT 
       COUNT(DISTINCT cd.id_carrito) as carritos_con_productos,
       SUM(cd.cantidad) as total_productos_en_carritos,
       AVG(cd.cantidad) as promedio_productos_por_carrito,
       COALESCE(SUM(cd.cantidad * cd.precio_unitario), 0) as valor_total_carritos
     FROM carrito_detalle cd
     INNER JOIN carrito c ON cd.id_carrito = c.id_carrito
     WHERE c.estado = 'activo'`
  );

  // Carritos por fecha (últimos 30 días)
  const [porFecha] = await pool.query(
    `SELECT 
       DATE(created_at) as fecha,
       COUNT(*) as carritos_creados
     FROM carrito 
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
     GROUP BY DATE(created_at)
     ORDER BY fecha DESC
     LIMIT 30`
  );

  return {
    general: general[0],
    productos: productos[0],
    carritos_por_fecha: porFecha
  };
}

// Modulo exporta las funciones para ser usadas en otros archivos.
module.exports = {
  getCarritoActivo,
  crearCarrito,
  agregarProducto,
  getItems,
  eliminarItem,
  vaciarCarrito,
  // Funciones administrativas
  getTodosLosCarritos,
  getCarritosAbandonados,
  eliminarCarritosAbandonados,
  getEstadisticasCarritos,
};

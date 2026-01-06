const db = require("../config/database");

class Factura {
  // Obtener todas las facturas del sistema
  static async obtenerTodas() {
    const sql = `
      SELECT f.*, u.nombre_usuario, p.metodo_pago
      FROM facturas f
      JOIN usuarios u ON f.id_usuario = u.id_usuario
      LEFT JOIN pagos p ON f.id_pago = p.id_pago
      ORDER BY f.fecha_emision DESC
    `;
    const [rows] = await db.execute(sql);
    return rows;
  }

  // Obtener una factura por su ID
  static async obtenerPorId(id) {
    const sql = `
      SELECT f.*, u.nombre_usuario, u.email, p.metodo_pago
      FROM facturas f
      JOIN usuarios u ON f.id_usuario = u.id_usuario
      LEFT JOIN pagos p ON f.id_pago = p.id_pago
      WHERE f.id_factura = ?
    `;
    const [rows] = await db.execute(sql, [id]);
    return rows[0];
  }

  // Obtener facturas de un usuario específico
  static async obtenerPorUsuario(userId) {
    const sql = `
      SELECT f.*, p.metodo_pago
      FROM facturas f
      LEFT JOIN pagos p ON f.id_pago = p.id_pago
      WHERE f.id_usuario = ?
      ORDER BY f.fecha_emision DESC
    `;
    const [rows] = await db.execute(sql, [userId]);
    return rows;
  }

  // Obtener una factura específica de un usuario
  static async obtenerPorIdYUsuario(facturaId, userId) {
    const sql = `
      SELECT f.*, p.metodo_pago
      FROM facturas f
      LEFT JOIN pagos p ON f.id_pago = p.id_pago
      WHERE f.id_factura = ? AND f.id_usuario = ?
    `;
    const [rows] = await db.execute(sql, [facturaId, userId]);
    return rows[0];
  }

  // Obtener factura por número de factura
  static async obtenerPorNumero(numero_factura) {
    const sql = `
      SELECT f.*, u.nombre_usuario, u.email, p.metodo_pago
      FROM facturas f
      JOIN usuarios u ON f.id_usuario = u.id_usuario
      LEFT JOIN pagos p ON f.id_pago = p.id_pago
      WHERE f.numero_factura = ?
    `;
    const [rows] = await db.execute(sql, [numero_factura]);
    return rows[0];
  }

  // Obtener factura por ID de pedido
  static async obtenerPorPedido(id_pedido) {
    const sql = `
      SELECT f.*, u.nombre_usuario, u.email, p.metodo_pago
      FROM facturas f
      JOIN usuarios u ON f.id_usuario = u.id_usuario
      LEFT JOIN pagos p ON f.id_pago = p.id_pago
      WHERE f.id_pedido = ?
    `;
    const [rows] = await db.execute(sql, [id_pedido]);
    return rows[0];
  }

  // Crear una nueva factura
  static async crear(datos) {
    const {
      numero_factura,
      id_pedido,
      id_pago,
      id_usuario,
      tipo,
      subtotal,
      iva_total,
      impuesto, // Campo adicional que puede venir en lugar de iva_total
      total,
      pdf_url,
      fecha_vencimiento, // Campo adicional que puede venir
      notas // Campo adicional que puede venir
    } = datos;

    // Validar que los campos requeridos no sean undefined
    if (!numero_factura || !id_pedido || !id_usuario || !total) {
      throw new Error("Faltan campos requeridos: numero_factura, id_pedido, id_usuario, total");
    }

    // Mapear impuesto a iva_total si viene ese campo
    const ivaTotal = iva_total || impuesto || 0;

    const sql = `
      INSERT INTO facturas (
        numero_factura, id_pedido, id_pago, id_usuario,
        tipo, subtotal, iva_total, total, pdf_url
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(sql, [
      numero_factura,
      id_pedido,
      id_pago || null,
      id_usuario,
      tipo || 'B',
      subtotal || 0,
      ivaTotal,
      total,
      pdf_url || null,
    ]);

    return { id_factura: result.insertId, ...datos };
  }

  // Actualizar el estado de envío por correo
  static async marcarComoEnviado(id) {
    // Validar que el ID no sea undefined o null
    if (!id) {
      throw new Error("ID de factura es requerido");
    }

    const sql = `
      UPDATE facturas
      SET enviado_email = 1, updated_at = NOW()
      WHERE id_factura = ?
    `;
    const [result] = await db.execute(sql, [id]);
    
    if (result.affectedRows === 0) {
      throw new Error("Factura no encontrada o no se pudo actualizar");
    }
    
    return result.affectedRows > 0;
  }

  // Obtener la última factura del día para generar número secuencial
  static async obtenerUltimaDelDia(año, mes, dia) {
    const sql = `
      SELECT numero_factura,
             CAST(SUBSTRING_INDEX(numero_factura, '-', -1) AS UNSIGNED) as numero_secuencial
      FROM facturas
      WHERE DATE(fecha_emision) = ?
      ORDER BY numero_secuencial DESC
      LIMIT 1
    `;
    const fecha = `${año}-${mes}-${dia}`;
    const [rows] = await db.execute(sql, [fecha]);
    return rows[0];
  }

  // Obtener estadísticas de facturas
  // Obtener estadísticas completas del sistema
  static async obtenerEstadisticas() {
    const sql = `
      SELECT 
        COUNT(*) as total_facturas,
        SUM(total) as total_facturado,
        COUNT(CASE WHEN enviado_email = 1 THEN 1 END) as facturas_enviadas,
        COUNT(CASE WHEN enviado_email = 0 THEN 1 END) as facturas_pendientes
      FROM facturas
      WHERE MONTH(fecha_emision) = MONTH(CURRENT_DATE())
      AND YEAR(fecha_emision) = YEAR(CURRENT_DATE())
    `;
    const [rows] = await db.execute(sql);
    return rows[0];
  }

  // Contar todas las facturas
  static async contarTodas() {
    const sql = `SELECT COUNT(*) as total FROM facturas`;
    const [rows] = await db.execute(sql);
    return rows[0].total;
  }

  // Obtener monto total de todas las facturas
  static async obtenerMontoTotal() {
    const sql = `SELECT COALESCE(SUM(total), 0) as monto_total FROM facturas`;
    const [rows] = await db.execute(sql);
    return rows[0].monto_total;
  }

  // Obtener facturas por mes
  static async obtenerFacturasPorMes() {
    const sql = `
      SELECT 
        YEAR(fecha_emision) as año,
        MONTH(fecha_emision) as mes,
        COUNT(*) as cantidad,
        SUM(total) as monto_total
      FROM facturas
      GROUP BY YEAR(fecha_emision), MONTH(fecha_emision)
      ORDER BY año DESC, mes DESC
      LIMIT 12
    `;
    const [rows] = await db.execute(sql);
    return rows;
  }

  // Obtener facturas por estado
  static async obtenerFacturasPorEstado() {
    const sql = `
      SELECT 
        CASE 
          WHEN enviado_email = 1 THEN 'Enviada'
          ELSE 'Pendiente'
        END as estado,
        COUNT(*) as cantidad
      FROM facturas
      GROUP BY enviado_email
    `;
    const [rows] = await db.execute(sql);
    return rows;
  }

  // Buscar facturas con filtros (alias para compatibilidad)
  static async buscarConFiltros(filtros) {
    return await this.buscar({
      numero_factura: filtros.numero,
      id_usuario: filtros.usuario,
      fecha_desde: filtros.fecha_desde,
      fecha_hasta: filtros.fecha_hasta
    });
  }

  // Buscar facturas por criterios
  static async buscar(criterios) {
    let sql = `
      SELECT f.*, u.nombre_usuario, u.email, p.metodo_pago
      FROM facturas f
      JOIN usuarios u ON f.id_usuario = u.id_usuario
      LEFT JOIN pagos p ON f.id_pago = p.id_pago
      WHERE 1=1
    `;
    const params = [];

    if (criterios.numero_factura) {
      sql += ` AND f.numero_factura LIKE ?`;
      params.push(`%${criterios.numero_factura}%`);
    }

    if (criterios.id_usuario) {
      sql += ` AND f.id_usuario = ?`;
      params.push(criterios.id_usuario);
    }

    if (criterios.usuario) {
      sql += ` AND (u.nombre_usuario LIKE ? OR u.email LIKE ?)`;
      params.push(`%${criterios.usuario}%`, `%${criterios.usuario}%`);
    }

    if (criterios.fecha_desde) {
      sql += ` AND DATE(f.fecha_emision) >= ?`;
      params.push(criterios.fecha_desde);
    }

    if (criterios.fecha_hasta) {
      sql += ` AND DATE(f.fecha_emision) <= ?`;
      params.push(criterios.fecha_hasta);
    }

    if (criterios.enviado_email !== undefined) {
      sql += ` AND f.enviado_email = ?`;
      params.push(criterios.enviado_email);
    }

    sql += ` ORDER BY f.fecha_emision DESC`;

    // Usar query() en lugar de execute() para LIMIT con parámetros
    if (criterios.limit) {
      sql += ` LIMIT ${parseInt(criterios.limit)}`;
    }

    console.log('SQL Query:', sql);
    console.log('Parameters:', params);

    try {
      const [rows] = await db.execute(sql, params);
      return rows;
    } catch (error) {
      console.error('Error executing query:', error);
      console.error('SQL:', sql);
      console.error('Params:', params);
      throw error;
    }
  }
}

module.exports = Factura;

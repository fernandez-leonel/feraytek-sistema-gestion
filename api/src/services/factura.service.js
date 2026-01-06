const Factura = require("../models/factura.model");
const EmailService = require("./email.service");
const pool = require("../config/database");

class FacturaService {
  // ========== SERVICIOS PARA ADMINISTRADORES ==========
  
  // Obtener todas las facturas
  static async listarTodas() {
    return await Factura.obtenerTodas();
  }

  // Obtener factura por ID
  static async obtenerPorId(id) {
    const factura = await Factura.obtenerPorId(id);
    if (!factura) throw new Error("Factura no encontrada");
    return factura;
  }

  // Crear nueva factura
  static async crearFactura(data) {
    if (!data.id_pedido || !data.id_usuario || !data.total) {
      throw new Error("Datos insuficientes para generar la factura");
    }
    
    // Generar número de factura único
    const numeroFactura = await this.generarNumeroFactura();
    data.numero_factura = numeroFactura;
    
    // Mapear campos si vienen con nombres diferentes
    if (data.impuesto && !data.iva_total) {
      data.iva_total = data.impuesto;
    }
    
    // Asegurar que los campos opcionales tengan valores por defecto
    data.tipo = data.tipo || 'B';
    data.subtotal = data.subtotal || 0;
    data.iva_total = data.iva_total || 0;
    
    return await Factura.crear(data);
  }

  // Marcar factura como enviada por email
  static async marcarComoEnviada(id) {
    const actualizado = await Factura.marcarComoEnviado(id);
    if (!actualizado) throw new Error("No se pudo marcar como enviada");
    return { ok: true, message: "Factura marcada como enviada" };
  }

  // Enviar factura por email
  static async enviarFacturaPorEmail(id) {
    const factura = await this.obtenerPorId(id);
    if (!factura) throw new Error("Factura no encontrada");

    // Aquí integrarías con el servicio de email
    try {
      await EmailService.enviarFactura(factura);
      await this.marcarComoEnviada(id);
      return { ok: true, message: "Factura enviada por email exitosamente" };
    } catch (error) {
      throw new Error(`Error al enviar factura: ${error.message}`);
    }
  }

  // Generar PDF de factura
  static async generarPDFFactura(id) {
    const factura = await this.obtenerPorId(id);
    if (!factura) throw new Error("Factura no encontrada");

    // Aquí integrarías con un servicio de generación de PDF
    // Por ahora retornamos la estructura básica
    return {
      id_factura: factura.id_factura,
      numero_factura: factura.numero_factura,
      pdf_url: `/pdfs/factura-${factura.numero_factura}.pdf`,
      generado_en: new Date().toISOString()
    };
  }

  // ========== SERVICIOS PARA CLIENTES ==========

  // Obtener facturas de un usuario específico
  static async obtenerFacturasPorUsuario(userId) {
    return await Factura.obtenerPorUsuario(userId);
  }

  // Obtener una factura específica de un usuario
  static async obtenerFacturaDeUsuario(facturaId, userId) {
    const factura = await Factura.obtenerPorIdYUsuario(facturaId, userId);
    if (!factura) throw new Error("Factura no encontrada o no pertenece al usuario");
    return factura;
  }

  // Descargar PDF de factura para usuario
  static async descargarPDFFacturaUsuario(facturaId, userId) {
    const factura = await this.obtenerFacturaDeUsuario(facturaId, userId);
    return await this.generarPDFFactura(facturaId);
  }

  // Reenviar factura por email para cliente
  static async reenviarFacturaCliente(facturaId, userId) {
    const factura = await this.obtenerFacturaDeUsuario(facturaId, userId);
    
    try {
      await EmailService.enviarFactura(factura);
      return { ok: true, message: "Factura reenviada exitosamente" };
    } catch (error) {
      throw new Error(`Error al reenviar factura: ${error.message}`);
    }
  }

  // Obtener estadísticas de facturas
  static async obtenerEstadisticas() {
    try {
      const totalFacturas = await Factura.contarTodas();
      const totalMonto = await Factura.obtenerMontoTotal();
      const facturasPorMes = await Factura.obtenerFacturasPorMes();
      const facturasPorEstado = await Factura.obtenerFacturasPorEstado();
      
      return {
        total_facturas: totalFacturas,
        monto_total: totalMonto,
        facturas_por_mes: facturasPorMes,
        facturas_por_estado: facturasPorEstado,
        fecha_consulta: new Date()
      };
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  // Buscar facturas con filtros
  static async buscarFacturas(filtros) {
    try {
      // Mapear los filtros al formato esperado por el modelo
      const criterios = {};
      
      if (filtros.numero) criterios.numero_factura = filtros.numero;
      if (filtros.usuario) criterios.usuario = filtros.usuario;
      if (filtros.id_usuario) criterios.id_usuario = filtros.id_usuario;
      if (filtros.fecha_desde) criterios.fecha_desde = filtros.fecha_desde;
      if (filtros.fecha_hasta) criterios.fecha_hasta = filtros.fecha_hasta;
      if (filtros.email_enviado !== undefined) criterios.enviado_email = filtros.email_enviado ? 1 : 0;
      if (filtros.limite) criterios.limit = filtros.limite;
      
      return await Factura.buscar(criterios);
    } catch (error) {
      throw new Error(`Error al buscar facturas: ${error.message}`);
    }
  }

  // ========== MÉTODOS AUXILIARES ==========

  // Generar número de factura único
  static async generarNumeroFactura() {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    
    // Obtener el último número de factura del día
    try {
      const ultimaFactura = await Factura.obtenerUltimaDelDia(año, mes, dia);
      const numeroSecuencial = ultimaFactura ? ultimaFactura.numero_secuencial + 1 : 1;
      
      return `F-${año}${mes}${dia}-${String(numeroSecuencial).padStart(4, '0')}`;
    } catch (error) {
      // Si hay error, generar número con timestamp para evitar duplicados
      const timestamp = Date.now().toString().slice(-4);
      return `F-${año}${mes}${dia}-${timestamp}`;
    }
  }

  // Validar datos de factura
  static validarDatosFactura(data) {
    const errores = [];
    
    if (!data.id_pedido) errores.push("ID de pedido es requerido");
    if (!data.id_usuario) errores.push("ID de usuario es requerido");
    if (!data.total || data.total <= 0) errores.push("Total debe ser mayor a 0");
    if (!data.tipo) errores.push("Tipo de factura es requerido");
    
    if (errores.length > 0) {
      throw new Error(`Datos inválidos: ${errores.join(', ')}`);
    }
    
    return true;
  }

  // Verificar factura por diferentes criterios
  static async verificarFactura(criterios) {
    try {
      const { numero_factura, id_factura, id_pedido, userId } = criterios;
      
      let factura = null;

      // Buscar por número de factura
      if (numero_factura) {
        factura = await Factura.obtenerPorNumero(numero_factura);
      }
      // Buscar por ID de factura
      else if (id_factura) {
        factura = await Factura.obtenerPorId(id_factura);
      }
      // Buscar por ID de pedido
      else if (id_pedido) {
        factura = await Factura.obtenerPorPedido(id_pedido);
      }

      if (!factura) {
        return null;
      }

      // Si se especifica userId, verificar que el usuario tenga permisos
      if (userId) {
        // Obtener información del pedido para verificar el propietario
        const [pedidoRows] = await pool.query(
          'SELECT id_usuario FROM pedidos WHERE id_pedido = ?', 
          [factura.id_pedido]
        );
        
        if (!pedidoRows.length || pedidoRows[0].id_usuario !== userId) {
          return null; // No tiene permisos para ver esta factura
        }
      }

      // Obtener información adicional del pedido y usuario
      const [detalleRows] = await pool.query(`
        SELECT 
          f.*,
          p.fecha_pedido,
          p.total as total_pedido,
          p.estado as estado_pedido,
          u.nombre_usuario as nombre_cliente,
          u.email as email_cliente
        FROM facturas f
        LEFT JOIN pedidos p ON f.id_pedido = p.id_pedido
        LEFT JOIN usuarios u ON f.id_usuario = u.id_usuario
        WHERE f.id_factura = ?
      `, [factura.id_factura]);

      return detalleRows[0] || factura;

    } catch (error) {
      console.error('Error en verificarFactura:', error);
      throw error;
    }
  }
}

module.exports = FacturaService;

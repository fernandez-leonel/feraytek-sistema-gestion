const FacturaService = require("../services/factura.service");

class FacturaController {
  // ========== ENDPOINTS PARA ADMINISTRADORES ==========
  
  // Obtener todas las facturas (solo admin)
  static async obtenerTodas(req, res) {
    try {
      const facturas = await FacturaService.listarTodas();
      res.status(200).json({
        success: true,
        data: facturas,
        total: facturas.length
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // Obtener factura por ID (admin puede ver cualquiera)
  static async obtenerPorId(req, res) {
    try {
      const factura = await FacturaService.obtenerPorId(req.params.id);
      res.status(200).json({
        success: true,
        data: factura
      });
    } catch (error) {
      res.status(404).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // Crear nueva factura (solo admin)
  static async crear(req, res) {
    try {
      const nuevaFactura = await FacturaService.crearFactura(req.body);
      res.status(201).json({
        success: true,
        data: nuevaFactura,
        message: "Factura creada exitosamente"
      });
    } catch (error) {
      res.status(400).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // Marcar factura como enviada por email (solo admin)
  static async marcarEnviada(req, res) {
    try {
      const result = await FacturaService.marcarComoEnviada(req.params.id);
      res.status(200).json({
        success: true,
        data: result,
        message: "Factura marcada como enviada"
      });
    } catch (error) {
      res.status(400).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // Enviar factura por email (solo admin)
  static async enviarPorEmail(req, res) {
    try {
      const { id } = req.params;
      const result = await FacturaService.enviarFacturaPorEmail(id);
      res.status(200).json({
        success: true,
        data: result,
        message: "Factura enviada por email exitosamente"
      });
    } catch (error) {
      res.status(400).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // Generar PDF de factura (solo admin)
  static async generarPDF(req, res) {
    try {
      const { id } = req.params;
      const pdfData = await FacturaService.generarPDFFactura(id);
      res.status(200).json({
        success: true,
        data: pdfData,
        message: "PDF generado exitosamente"
      });
    } catch (error) {
      res.status(400).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // Obtener estadísticas de facturas (solo admin)
  static async obtenerEstadisticas(req, res) {
    try {
      const estadisticas = await FacturaService.obtenerEstadisticas();
      res.status(200).json({
        success: true,
        data: estadisticas
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // Buscar facturas (solo admin)
  static async buscarFacturas(req, res) {
    try {
      const { 
        numero, 
        usuario, 
        id_usuario, 
        'id-usuario': idUsuarioGuion,
        fecha_desde, 
        fecha_hasta,
        fecha_inicio,
        fecha_fin,
        email_enviado,
        limite 
      } = req.query;
      
      // Construir objeto de filtros
      const filtros = {};
      
      // Manejar búsqueda por número - puede venir como parámetro normal o como clave
      if (numero) {
        filtros.numero = numero;
      } else {
        // Buscar si alguna clave del query parece ser un número de factura
        const queryKeys = Object.keys(req.query);
        const facturaKey = queryKeys.find(key => 
          key.match(/^F-\d{8}-\d{4}$/) || // Formato completo F-YYYYMMDD-NNNN
          key.match(/^\d{4}$/) ||         // Solo los últimos 4 dígitos
          key.includes('F-')              // Cualquier cosa que contenga F-
        );
        if (facturaKey) {
          filtros.numero = facturaKey;
        }
      }
      
      if (usuario) filtros.usuario = usuario;
      
      // Aceptar tanto id_usuario como id-usuario
      const userId = id_usuario || idUsuarioGuion;
      if (userId) filtros.id_usuario = parseInt(userId);
      
      // Aceptar tanto fecha_desde/fecha_hasta como fecha_inicio/fecha_fin
      const fechaDesde = fecha_desde || fecha_inicio;
      const fechaHasta = fecha_hasta || fecha_fin;
      if (fechaDesde) filtros.fecha_desde = fechaDesde;
      if (fechaHasta) filtros.fecha_hasta = fechaHasta;
      
      if (email_enviado !== undefined) {
        filtros.email_enviado = email_enviado === 'true' || email_enviado === '1';
      }
      if (limite) filtros.limite = parseInt(limite);
      
      const facturas = await FacturaService.buscarFacturas(filtros);
      res.status(200).json({
        success: true,
        data: facturas,
        total: facturas.length
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // ========== ENDPOINTS PARA CLIENTES ==========

  // Obtener facturas del cliente autenticado
  static async obtenerMisFacturas(req, res) {
    try {
      const userId = req.user.id;
      const facturas = await FacturaService.obtenerFacturasPorUsuario(userId);
      res.status(200).json({
        success: true,
        data: facturas,
        total: facturas.length
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // Obtener una factura específica del cliente
  static async obtenerMiFactura(req, res) {
    try {
      const userId = req.user.id;
      const facturaId = req.params.id;
      const factura = await FacturaService.obtenerFacturaDeUsuario(facturaId, userId);
      res.status(200).json({
        success: true,
        data: factura
      });
    } catch (error) {
      res.status(404).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // Descargar PDF de factura del cliente
  static async descargarMiFacturaPDF(req, res) {
    try {
      const userId = req.user.id;
      const facturaId = req.params.id;
      const pdfData = await FacturaService.descargarPDFFacturaUsuario(facturaId, userId);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=factura-${facturaId}.pdf`);
      res.status(200).json({
        success: true,
        data: pdfData,
        message: "PDF de factura listo para descarga"
      });
    } catch (error) {
      res.status(404).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // Solicitar reenvío de factura por email (cliente)
  static async solicitarReenvio(req, res) {
    try {
      const userId = req.user.id;
      const facturaId = req.params.id;
      const result = await FacturaService.reenviarFacturaCliente(facturaId, userId);
      res.status(200).json({
        success: true,
        data: result,
        message: "Factura reenviada a tu email exitosamente"
      });
    } catch (error) {
      res.status(400).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // Verificar factura por número o ID (usuarios autenticados)
  static async verificarFactura(req, res) {
    try {
      const { numero_factura, id_factura, id_pedido } = req.query;
      const userId = req.user.id;
      const userRole = req.user.rol;

      // Validar que se proporcione al menos un parámetro de búsqueda
      if (!numero_factura && !id_factura && !id_pedido) {
        return res.status(400).json({
          success: false,
          message: "Debe proporcionar numero_factura, id_factura o id_pedido para verificar"
        });
      }

      // Llamar al servicio para verificar la factura
      const resultado = await FacturaService.verificarFactura({
        numero_factura,
        id_factura,
        id_pedido,
        userId: userRole === 'admin' || userRole === 'superadmin' ? null : userId // Admin puede ver todas
      });

      if (!resultado) {
        return res.status(404).json({
          success: false,
          message: "Factura no encontrada o no tienes permisos para verla"
        });
      }

      res.status(200).json({
        success: true,
        data: resultado,
        message: "Factura verificada exitosamente"
      });

    } catch (error) {
      console.error("Error en verificarFactura:", error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }
}

module.exports = FacturaController;

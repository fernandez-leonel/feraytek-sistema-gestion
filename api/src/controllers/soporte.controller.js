const SoporteService = require("../services/soporte.service");

class SoporteController {
  static async crear(req, res) {
    try {
      const { asunto, mensaje, canal, tipo, prioridad, id_factura } = req.body;
      const id_usuario = req.user.id; // Obtener del token JWT
      
      const datosTicket = {
        id_usuario,
        asunto,
        mensaje,
        canal,
        tipo,
        prioridad,
        id_factura
      };

      const id_soporte = await SoporteService.crear(datosTicket);
      res.status(201).json({
        mensaje: "Ticket de soporte creado exitosamente",
        id_soporte,
      });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  static async listarTodos(req, res) {
    try {
      const { estado, tipo, prioridad, compra_verificada } = req.query;
      
      // Si hay filtros, usar el método con filtros
      if (estado || tipo || prioridad || compra_verificada !== undefined) {
        const filtros = {};
        if (estado) filtros.estado = estado;
        if (tipo) filtros.tipo = tipo;
        if (prioridad) filtros.prioridad = prioridad;
        if (compra_verificada !== undefined) filtros.compra_verificada = compra_verificada === 'true';
        
        const tickets = await SoporteService.listarPorFiltros(filtros);
        res.status(200).json(tickets);
      } else {
        const tickets = await SoporteService.listarTodos();
        res.status(200).json(tickets);
      }
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  static async obtenerPorId(req, res) {
    try {
      const { id_soporte } = req.params;
      const id_usuario = req.user.id;
      const esAdmin = req.user.rol === 'admin';
      
      // Validar acceso al ticket
      const ticket = await SoporteService.validarAccesoTicket(id_soporte, id_usuario, esAdmin);
      res.status(200).json(ticket);
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  static async responder(req, res) {
    try {
      const { id_soporte } = req.params;
      const { respuesta, estado } = req.body;
      const id_admin = req.user.id; // ID del admin que responde
      
      const datosRespuesta = { respuesta, estado };
      await SoporteService.responder(id_soporte, datosRespuesta, id_admin);
      res.status(200).json({ mensaje: "Respuesta registrada correctamente" });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  static async actualizarPrioridad(req, res) {
    try {
      const { id_soporte } = req.params;
      const { prioridad } = req.body;
      const id_admin = req.user.id;
      
      await SoporteService.actualizarPrioridad(id_soporte, prioridad, id_admin);
      res.status(200).json({ mensaje: "Prioridad actualizada correctamente" });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  static async cerrar(req, res) {
    try {
      const { id_soporte } = req.params;
      const id_admin = req.user.id;
      
      await SoporteService.cerrar(id_soporte, id_admin);
      res.status(200).json({ mensaje: "Ticket cerrado correctamente" });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  static async obtenerEstadisticas(req, res) {
    try {
      const estadisticas = await SoporteService.obtenerEstadisticas();
      res.status(200).json(estadisticas);
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  // Endpoint para que los usuarios vean sus propios tickets
  static async misTickets(req, res) {
    try {
      const id_usuario = req.user.id;
      const { estado, tipo } = req.query;
      
      const filtros = { id_usuario };
      if (estado) filtros.estado = estado;
      if (tipo) filtros.tipo = tipo;
      
      const tickets = await SoporteService.listarPorFiltros(filtros);
      res.status(200).json(tickets);
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }
}

module.exports = SoporteController;

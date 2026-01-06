const SoporteModel = require("../models/soporte.model");
const createError = require("http-errors");

const SoporteService = {
  // Validar campos ENUM
  validarCamposEnum(datos) {
    const canalesValidos = ['email', 'whatsapp', 'web'];
    const tiposValidos = ['reclamo', 'consulta', 'sugerencia'];
    const prioridadesValidas = ['baja', 'media', 'alta'];
    const estadosValidos = ['pendiente', 'respondido', 'cerrado'];

    if (datos.canal && !canalesValidos.includes(datos.canal)) {
      throw createError(400, `Canal inválido. Valores permitidos: ${canalesValidos.join(', ')}`);
    }
    if (datos.tipo && !tiposValidos.includes(datos.tipo)) {
      throw createError(400, `Tipo inválido. Valores permitidos: ${tiposValidos.join(', ')}`);
    }
    if (datos.prioridad && !prioridadesValidas.includes(datos.prioridad)) {
      throw createError(400, `Prioridad inválida. Valores permitidos: ${prioridadesValidas.join(', ')}`);
    }
    if (datos.estado && !estadosValidos.includes(datos.estado)) {
      throw createError(400, `Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}`);
    }
  },

  async crear(datosTicket) {
    const { id_usuario, asunto, mensaje } = datosTicket;
    
    if (!id_usuario || !asunto || !mensaje) {
      throw createError(400, "Datos incompletos: id_usuario, asunto y mensaje son requeridos");
    }

    // Validar campos ENUM
    this.validarCamposEnum(datosTicket);

    // Validar longitud de campos
    if (asunto.length > 200) {
      throw createError(400, "El asunto no puede exceder 200 caracteres");
    }

    const id_soporte = await SoporteModel.crear(datosTicket);
    return id_soporte;
  },

  async listarTodos() {
    return await SoporteModel.obtenerTodos();
  },

  async listarPorFiltros(filtros) {
    // Validar filtros ENUM
    if (filtros) {
      this.validarCamposEnum(filtros);
    }
    return await SoporteModel.obtenerPorFiltros(filtros);
  },

  async obtenerPorId(id_soporte) {
    if (!id_soporte || isNaN(id_soporte)) {
      throw createError(400, "ID de soporte inválido");
    }

    const ticket = await SoporteModel.obtenerPorId(id_soporte);
    if (!ticket) {
      throw createError(404, "Ticket de soporte no encontrado");
    }
    return ticket;
  },

  async responder(id_soporte, datosRespuesta, id_admin) {
    const { respuesta, estado = "respondido" } = datosRespuesta;
    
    if (!respuesta || respuesta.trim() === "") {
      throw createError(400, "Debe proporcionar una respuesta válida");
    }
    if (!id_admin) {
      throw createError(400, "ID del administrador es requerido");
    }

    // Validar estado
    this.validarCamposEnum({ estado });

    const actualizado = await SoporteModel.responder(id_soporte, datosRespuesta, id_admin);
    if (!actualizado) {
      throw createError(404, "No se pudo actualizar el ticket de soporte");
    }
    return actualizado;
  },

  async actualizarPrioridad(id_soporte, prioridad, id_admin) {
    if (!prioridad) {
      throw createError(400, "Prioridad es requerida");
    }
    if (!id_admin) {
      throw createError(400, "ID del administrador es requerido");
    }

    // Validar prioridad
    this.validarCamposEnum({ prioridad });

    const actualizado = await SoporteModel.actualizarPrioridad(id_soporte, prioridad);
    if (!actualizado) {
      throw createError(404, "No se pudo actualizar la prioridad del ticket");
    }
    return actualizado;
  },

  async cerrar(id_soporte, id_admin) {
    if (!id_admin) {
      throw createError(400, "ID del administrador es requerido");
    }

    const actualizado = await SoporteModel.cerrar(id_soporte, id_admin);
    if (!actualizado) {
      throw createError(404, "No se pudo cerrar el ticket de soporte");
    }
    return actualizado;
  },

  async obtenerEstadisticas() {
    return await SoporteModel.obtenerEstadisticas();
  },

  // Validar si un usuario puede acceder a un ticket específico
  async validarAccesoTicket(id_soporte, id_usuario, esAdmin = false) {
    const ticket = await this.obtenerPorId(id_soporte);
    
    // Los admins pueden acceder a cualquier ticket
    if (esAdmin) {
      return ticket;
    }
    
    // Los usuarios solo pueden acceder a sus propios tickets
    if (ticket.id_usuario !== id_usuario) {
      throw createError(403, "No tienes permisos para acceder a este ticket");
    }
    
    return ticket;
  },
};

module.exports = SoporteService;

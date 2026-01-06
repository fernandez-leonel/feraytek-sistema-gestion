const ResenaModel = require("../models/resena.model");
const createError = require("http-errors");

const ResenaService = {
  // Crear una reseña validando campos obligatorios
  async crear(id_usuario, id_producto, calificacion, comentario) {
    if (!id_usuario || !id_producto || !calificacion) {
      throw createError(400, "Faltan datos obligatorios para crear reseña");
    }
    if (calificacion < 1 || calificacion > 5) {
      throw createError(400, "La calificación debe estar entre 1 y 5");
    }
    return await ResenaModel.crear(
      id_usuario,
      id_producto,
      calificacion,
      comentario
    );
  },

  // Listar reseñas de un producto
  async listarPorProducto(id_producto) {
    if (!id_producto) throw createError(400, "Debe indicar un producto válido");
    return await ResenaModel.obtenerPorProductoFiltrado(id_producto, 'aprobada');
  },

  // Listar todas las reseñas (solo admin)
  async listarTodas() {
    return await ResenaModel.obtenerTodas();
  },

  // Actualizar reseña (solo el autor puede hacerlo)
  async actualizar(id_reseña, id_usuario, calificacion, comentario) {
    if (!id_reseña || !id_usuario)
      throw createError(400, "Faltan datos obligatorios");
    if (calificacion < 1 || calificacion > 5)
      throw createError(400, "La calificación debe estar entre 1 y 5");
    const ok = await ResenaModel.actualizar(
      id_reseña,
      id_usuario,
      calificacion,
      comentario
    );
    if (!ok) throw createError(403, "No autorizado para modificar esta reseña");
    return ok;
  },

  async listarPorEstado(estado) {
    const permitidos = ["pendiente", "aprobada", "rechazada", "oculta"];
    if (estado && !permitidos.includes(estado)) {
      throw createError(400, "Estado inválido");
    }
    if (estado) return await ResenaModel.obtenerTodasPorEstado(estado);
    return await ResenaModel.obtenerTodas();
  },

  async actualizarEstado(id_resena, estado, motivo, id_admin) {
    const permitidos = ["pendiente", "aprobada", "rechazada", "oculta"];
    if (!permitidos.includes(estado)) {
      throw createError(400, "Estado inválido");
    }
    const actual = await ResenaModel.obtenerPorId(id_resena);
    if (!actual) throw createError(404, "Reseña no encontrada");

    const transiciones = {
      pendiente: ["aprobada", "rechazada", "oculta"],
      aprobada: ["oculta"],
      rechazada: ["pendiente"],
      oculta: ["aprobada", "rechazada", "pendiente"],
    };

    const posibles = transiciones[actual.estado] || [];
    if (!posibles.includes(estado)) {
      throw createError(400, "Transición de estado no permitida");
    }

    const ok = await ResenaModel.actualizarEstado(id_resena, estado, id_admin, motivo);
    if (!ok) throw createError(500, "No se pudo actualizar el estado");
    const actualizado = await ResenaModel.obtenerPorId(id_resena);
    return actualizado;
  },
};

module.exports = ResenaService;

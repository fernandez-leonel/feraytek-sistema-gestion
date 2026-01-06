const LogModel = require("../models/log.model");

const LogService = {
  async listarTodos(rol) {
    if (rol !== "admin" && rol !== "super_admin") {
      throw createError(
        403,
        "Acceso denegado: solo administradores pueden ver los logs"
      );
    }
    return await LogModel.obtenerTodos();
  },

  async listarPorUsuario(id_usuario, rol) {
    if (rol !== "admin" && rol !== "super_admin") {
      throw createError(403, "Acceso denegado");
    }
    return await LogModel.obtenerPorUsuario(id_usuario);
  },

  async obtenerDetalle(id_log, rol) {
    if (rol !== "admin" && rol !== "super_admin") {
      throw createError(403, "Acceso denegado");
    }
    const log = await LogModel.obtenerPorId(id_log);
    if (!log) throw createError(404, "Log no encontrado");
    return log;
  },
};

module.exports = LogService;

/**
 * ----------------------------------------------------------------------
 *  GIT TRACKING
 * ----------------------------------------------------------------------
 *  $
 *  $
 * ======================================================================
 */

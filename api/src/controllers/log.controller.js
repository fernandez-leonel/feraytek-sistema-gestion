// ======================================================================
// Controlador de Log
// Maneja las solicitudes HTTP relacionadas con logs del sistema
// ======================================================================

const logService = require('../services/log.service');

// ----------------------------------------------------------------------
// Listar todos los logs (solo para administradores)
// ----------------------------------------------------------------------
async function listarTodos(req, res, next) {
  try {
    const logs = await logService.listarTodos();
    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
}

// ----------------------------------------------------------------------
// Listar logs por usuario
// ----------------------------------------------------------------------
async function listarPorUsuario(req, res, next) {
  try {
    const { id_usuario } = req.params;
    const logs = await logService.listarPorUsuario(id_usuario);
    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
}

// ----------------------------------------------------------------------
// Obtener detalle de un log específico
// ----------------------------------------------------------------------
async function obtenerDetalle(req, res, next) {
  try {
    const { id_log } = req.params;
    const log = await logService.obtenerDetalle(id_log);
    res.json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listarTodos,
  listarPorUsuario,
  obtenerDetalle
};
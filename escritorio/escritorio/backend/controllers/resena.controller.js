// =====================================================================
// ResenaController
// Orquesta flujos para reseñas y delega lógica al servicio
// =====================================================================

const { ResenaModel } = require("../models/resena.model")
const { ResenaService } = require("../services/resena.service")

const ResenaController = {
  // Crear reseña
  async crear(req, res) {
    try { const data = ResenaModel.validateCreate(req.body); const r = await ResenaService.crear(req, data); return res.status(201).json({ ok:true, message:"Reseña creada", data: r?.data ?? r }) }
    catch (e) { return res.status(400).json({ ok:false, message: e.message }) }
  },
  // Listar todas (admin)
  async listarTodas(req, res) {
    try { const r = await ResenaService.listarTodas(req); return res.json({ ok:true, data: r?.data ?? r }) }
    catch (e) { return res.status(400).json({ ok:false, message: e.message }) }
  },
  // Listar por producto (público)
  async listarPorProducto(req, res) {
    try { const idp = Number(req.params.id_producto); if (!Number.isFinite(idp)||idp<=0) return res.status(400).json({ ok:false, message:"ID producto inválido" }); const r = await ResenaService.listarPorProducto(req, idp); return res.json({ ok:true, data: r?.data ?? r }) }
    catch (e) { return res.status(400).json({ ok:false, message: e.message }) }
  },
  // Obtener reseña
  async obtener(req, res) {
    try { const id = Number(req.query.id); if (!Number.isFinite(id)||id<=0) return res.status(400).json({ ok:false, message:"ID inválido" }); const r = await ResenaService.obtener(req, id); return res.json({ ok:true, data: r?.data ?? r }) }
    catch (e) { return res.status(404).json({ ok:false, message: e.message }) }
  },
  // Actualizar reseña (autor)
  async actualizar(req, res) {
    try { const id = Number(req.params.id); if (!Number.isFinite(id)||id<=0) return res.status(400).json({ ok:false, message:"ID inválido" }); const data = ResenaModel.validateUpdate(req.body); const r = await ResenaService.actualizar(req, id, data); return res.json({ ok:true, message:"Reseña actualizada", data: r?.data ?? r }) }
    catch (e) { return res.status(400).json({ ok:false, message: e.message }) }
  }
}

module.exports = ResenaController

// ----------------------------------------------------------------------
// Explicación
// Controlador de reseñas: valida IDs, orquesta servicio y retorna JSON.
// Mantiene ≤150 líneas con funciones pequeñas y comentarios claros.
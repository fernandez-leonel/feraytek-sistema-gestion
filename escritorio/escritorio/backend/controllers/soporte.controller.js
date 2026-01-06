// =====================================================================
// Controller Soporte
// Orquesta validaciones del modelo y llamadas al servicio
// =====================================================================

const { SoporteModel } = require('../models/soporte.model')
const { soporteService } = require('../services/soporte.service')

const SoporteController = {
  // Crear ticket
  async crear(req, res) {
    try { const data = SoporteModel.validateCreate(req.body); const r = await soporteService.crear(req, data); return res.status(201).json(r) }
    catch (e) { return res.status(400).json({ error: e.message }) }
  },
  // Listar todos con filtros (admin)
  async listarTodos(req, res) {
    try { const { estado, prioridad, page=1, limit=25 } = req.query; const r = await soporteService.listarTodos(req, { estado, prioridad, page:Number(page), limit:Number(limit) }); return res.json(r) }
    catch (e) { return res.status(400).json({ error: e.message }) }
  },
  // Mis tickets
  async misTickets(req, res) {
    try { const r = await soporteService.misTickets(req); return res.json(r) }
    catch (e) { return res.status(400).json({ error: e.message }) }
  },
  // Obtener por id
  async obtener(req, res) {
    try { const id = Number(req.params.id); if (!Number.isFinite(id) || id<=0) return res.status(400).json({ error: 'ID inválido' }); const r = await soporteService.obtener(req, id); return res.json(r) }
    catch (e) { return res.status(404).json({ error: e.message }) }
  },
  // Estadísticas
  async estadisticas(req, res) {
    try { const r = await soporteService.estadisticas(req); return res.json(r) }
    catch (e) { return res.status(400).json({ error: e.message }) }
  },
  // Responder
  async responder(req, res) {
    try { const id = Number(req.params.id); if (!Number.isFinite(id) || id<=0) return res.status(400).json({ error: 'ID inválido' }); const data = SoporteModel.validateResponder(req.body); const r = await soporteService.responder(req, id, data); return res.json(r) }
    catch (e) { return res.status(400).json({ error: e.message }) }
  },
  // Prioridad
  async prioridad(req, res) {
    try { const id = Number(req.params.id); if (!Number.isFinite(id) || id<=0) return res.status(400).json({ error: 'ID inválido' }); const data = SoporteModel.validatePrioridad(req.body); const r = await soporteService.prioridad(req, id, data); return res.json(r) }
    catch (e) { return res.status(400).json({ error: e.message }) }
  },
  // Cerrar
  async cerrar(req, res) {
    try { const id = Number(req.params.id); if (!Number.isFinite(id) || id<=0) return res.status(400).json({ error: 'ID inválido' }); const data = SoporteModel.validateCerrar(req.body); const r = await soporteService.cerrar(req, id, data); return res.json(r) }
    catch (e) { return res.status(400).json({ error: e.message }) }
  }
}

module.exports = SoporteController
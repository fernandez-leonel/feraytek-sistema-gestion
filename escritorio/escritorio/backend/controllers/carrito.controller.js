// =====================================================================
// Controller Carrito
// Gestiona el flujo: valida con el Modelo y delega al Servicio
// Respuestas JSON: { ok, message, data }
// =====================================================================

const { CarritoModel } = require("../models/carrito.model")
const { carritoService } = require("../services/carrito.service")

const CarritoController = {
  // ----------------------------------------------------------------------
  // listar(req,res) → Carrito del usuario autenticado
  // Parámetros: token JWT en Authorization
  // Retorna: data con items del carrito
  // Errores: token inválido, carrito no encontrado
  // ----------------------------------------------------------------------
  async listar(req, res) {
    try { const r = await carritoService.listar(req); return res.json({ ok: true, message: "Carrito del usuario", data: r?.data ?? r }) }
    catch (e) { return res.status(400).json({ ok: false, message: e.message }) }
  },
  // ----------------------------------------------------------------------
  // agregar(req,res) → Agrega producto
  async agregar(req, res) {
    try { const data = CarritoModel.validateAddItem(req.body); const r = await carritoService.agregar(req, data); return res.status(201).json({ ok: true, message: "Producto agregado", data: r?.data ?? r }) }
    catch (e) { return res.status(400).json({ ok: false, message: e.message }) }
  },
  // ----------------------------------------------------------------------
  // eliminar(req,res) → Elimina producto del carrito
  async eliminar(req, res) {
    try { const data = CarritoModel.validateRemoveItem(req.body); const r = await carritoService.eliminarItem(req, data); return res.json({ ok: true, message: "Producto eliminado", data: r?.data ?? r }) }
    catch (e) { return res.status(400).json({ ok: false, message: e.message }) }
  },
  // ----------------------------------------------------------------------
  // vaciar(req,res) → Vacía carrito
  async vaciar(req, res) {
    try { const r = await carritoService.vaciar(req); return res.json({ ok: true, message: "Carrito vaciado", data: r?.data ?? r }) }
    catch (e) { return res.status(400).json({ ok: false, message: e.message }) }
  },
  // ----------------------------------------------------------------------
  // listarTodos(req,res) → Admin: ver todos los carritos
  async listarTodos(req, res) {
    try { const r = await carritoService.adminTodos(req); return res.json({ ok: true, message: "Carritos del sistema", data: r?.data ?? r }) }
    catch (e) { return res.status(400).json({ ok: false, message: e.message }) }
  },
  // ----------------------------------------------------------------------
  // verCarritoUsuario(req,res) → Admin: por usuario
  async verCarritoUsuario(req, res) {
    try { const id = Number(req.params.id); if (!Number.isFinite(id)||id<=0) return res.status(400).json({ ok:false, message: "ID de usuario inválido" }); const r = await carritoService.adminUsuario(req, id); return res.json({ ok:true, message:"Carrito del usuario", data: r?.data ?? r }) }
    catch (e) { return res.status(400).json({ ok:false, message: e.message }) }
  },
  // ----------------------------------------------------------------------
  // carritosAbandonados(req,res) → Admin: detecta por días
  async carritosAbandonados(req, res) {
    try { const dias = CarritoModel.validateDias({ dias: req.query.dias }, 7); const r = await carritoService.abandonados(req, dias); return res.json({ ok:true, message:"Carritos abandonados", data: r?.data ?? r }) }
    catch (e) { return res.status(400).json({ ok:false, message: e.message }) }
  },
  // ----------------------------------------------------------------------
  // limpiarAbandonados(req,res) → Admin: limpia por días
  async limpiarAbandonados(req, res) {
    try { const dias = CarritoModel.validateDias(req.body, 30); const r = await carritoService.limpiarAbandonados(req, dias); return res.json({ ok:true, message:"Carritos abandonados limpiados", data: r?.data ?? r }) }
    catch (e) { return res.status(400).json({ ok:false, message: e.message }) }
  },
  // ----------------------------------------------------------------------
  // estadisticasCarritos(req,res) → Admin: métricas
  async estadisticasCarritos(req, res) {
    try { const r = await carritoService.estadisticas(req); return res.json({ ok:true, message:"Estadísticas de carritos", data: r?.data ?? r }) }
    catch (e) { return res.status(400).json({ ok:false, message: e.message }) }
  }
}

module.exports = CarritoController

// ----------------------------------------------------------------------
// Explicación
// Este controlador coordina validación y servicio, retornando JSON uniforme.
// Se conecta a rutas que mapean endpoints y roles, ≤150 líneas por claridad.
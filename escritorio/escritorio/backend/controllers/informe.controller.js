// Descripción:
// Controlador INFORME: organiza solicitudes y delega al servicio
// por submódulo. Respuestas unificadas y sin lógica adicional.
// ----------------------------------------------------------------------

const InformeService = require('../services/informe.service')

async function ventasGanancias(req, res) {
  try {
    const auth = req.headers.authorization
    const resultado = await InformeService.ventasGanancias(auth, req.query || {})
    return res.status(200).json(resultado)
  } catch (e) { return res.status(500).json({ ok:false, message:'Error en informe ventas', error:e?.message }) }
}

async function enviosLogistica(req, res) {
  try {
    const auth = req.headers.authorization
    const resultado = await InformeService.enviosLogistica(auth, req.query || {})
    return res.status(200).json(resultado)
  } catch (e) { return res.status(500).json({ ok:false, message:'Error en informe envíos', error:e?.message }) }
}

async function usuariosActividad(req, res) {
  try {
    const auth = req.headers.authorization
    const resultado = await InformeService.usuariosActividad(auth, req.query || {})
    return res.status(200).json(resultado)
  } catch (e) { return res.status(500).json({ ok:false, message:'Error en informe usuarios', error:e?.message }) }
}

async function productosStock(req, res) {
  try {
    const auth = req.headers.authorization
    const resultado = await InformeService.productosStock(auth, req.query || {})
    return res.status(200).json(resultado)
  } catch (e) { return res.status(500).json({ ok:false, message:'Error en informe productos', error:e?.message }) }
}

async function reseñasSoporte(req, res) {
  try {
    const auth = req.headers.authorization
    const resultado = await InformeService.reseñasSoporte(auth, req.query || {})
    return res.status(200).json(resultado)
  } catch (e) { return res.status(500).json({ ok:false, message:'Error en informe reseñas/soporte', error:e?.message }) }
}

module.exports = {
  ventasGanancias,
  enviosLogistica,
  usuariosActividad,
  productosStock,
  reseñasSoporte,
}

// ----------------------------------------------------------------------
// Nota: Funciones pequeñas, try/catch y delegación al servicio.
// ≤150 líneas garantizando uniformidad de respuestas.
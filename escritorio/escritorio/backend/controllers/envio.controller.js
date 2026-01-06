// Descripción:
// Controlador responsable de gestionar las solicitudes HTTP relacionadas
// con los envíos logísticos de los pedidos.
// ----------------------------------------------------------------------

const EnvioService = require("../services/envio.service")

// Lista de Todos los Envios
async function listarEnvios(req, res) {
  try {
    const auth = req.headers.authorization
    const resultado = await EnvioService.listarEnvios(auth)
    res.status(200).json(resultado)
  } catch (error) {
    res.status(500).json({ ok: false, message: "Error al obtener los envíos." })
  }
}

// Obtener Envío por ID
async function obtenerEnvio(req, res) {
  try {
    const auth = req.headers.authorization
    const id = req.params.id
    const resultado = await EnvioService.obtenerEnvio(auth, id)
    if (!resultado.ok) return res.status(404).json(resultado)
    res.status(200).json(resultado)
  } catch (error) {
    res.status(500).json({ ok: false, message: "Error al obtener el envío." })
  }
}

// Crear Nuevo Envío
async function crearEnvio(req, res) {
  try {
    const auth = req.headers.authorization
    const datos = req.body
    const resultado = await EnvioService.crearEnvio(auth, datos)
    if (!resultado.ok) return res.status(400).json(resultado)
    res.status(201).json(resultado)
  } catch (error) {
    res.status(500).json({ ok: false, message: "Error al crear el envío." })
  }
}

// Actualizar Datos del Envío
async function actualizarDatosEnvio(req, res) {
  try {
    const auth = req.headers.authorization
    const id_envio = req.params.id
    const nuevosDatos = req.body
    const resultado = await EnvioService.actualizarDatosEnvio(auth, id_envio, nuevosDatos)
    if (!resultado.ok) return res.status(404).json(resultado)
    res.status(200).json(resultado)
  } catch (error) {
    res.status(500).json({ ok: false, message: "Error al actualizar los datos del envío." })
  }
}

// Cambiar Estado de Envío
async function cambiarEstadoEnvio(req, res) {
  try {
    const auth = req.headers.authorization
    const id_envio = req.params.id
    const { estado_envio } = req.body
    const resultado = await EnvioService.cambiarEstadoEnvio(auth, id_envio, estado_envio)
    if (!resultado.ok) return res.status(400).json(resultado)
    res.status(200).json(resultado)
  } catch (error) {
    res.status(500).json({ ok: false, message: "Error al actualizar el estado del envío." })
  }
}

// Eliminar Envío (solo admin)
async function eliminarEnvio(req, res) {
  try {
    const auth = req.headers.authorization
    const id_envio = req.params.id
    const resultado = await EnvioService.eliminarEnvio(auth, id_envio)
    if (!resultado.ok) return res.status(404).json(resultado)
    res.status(200).json(resultado)
  } catch (error) {
    res.status(500).json({ ok: false, message: "Error al eliminar el envío." })
  }
}

// Crear envíos para pedidos existentes
async function crearEnviosParaPedidosExistentes(req, res) {
  try {
    const auth = req.headers.authorization
    const resultado = await EnvioService.crearEnviosParaPedidosExistentes(auth)
    // Devuelve 200 incluso si no se generaron envíos, para evitar errores 500 en UI
    res.status(200).json(resultado)
  } catch (error) {
    res.status(500).json({ ok: false, message: "Error interno del servidor." })
  }
}

module.exports = {
  listarEnvios,
  obtenerEnvio,
  crearEnvio,
  actualizarDatosEnvio,
  cambiarEstadoEnvio,
  eliminarEnvio,
  crearEnviosParaPedidosExistentes,
}

// ----------------------------------------------------------------------
// Nota: Este archivo orquesta solicitudes y delega en el servicio.
// Se mantiene ≤150 líneas con funciones pequeñas y documentación clara.
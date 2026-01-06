// ======================================================================
// Gestiona las peticiones HTTP de pedidos:
// - Crear pedido desde carrito
// - Listar pedidos
// - Consultar detalle
// - Actualizar estado
// ======================================================================

const PedidoService = require("../services/pedido.service");
const PedidoModel = require("../models/pedido.model");

// Función temporal para verificar datos
async function verificarDatos(req, res) {
  try {
    const estadisticas = await PedidoModel.verificarDatosPedidos();
    const ejemplos = await PedidoModel.obtenerPedidosEjemplo();
    
    res.json({
      estadisticas,
      ejemplos,
      mensaje: "Datos de verificación de la tabla pedidos"
    });
  } catch (error) {
    console.error("Error al verificar datos:", error);
    res.status(500).json({ error: error.message });
  }
}

// ----------------------------------------------------------------------
// POST /api/pedidos
// Crea un pedido a partir del carrito del usuario
// ----------------------------------------------------------------------
async function crearDesdeCarrito(req, res) {
  try {
    // Extrae datos de la solicitud
    const id_usuario = req.user.id || req.user.id_usuario; // ID del usuario desde el JWT token
    const { metodo_entrega, costo_envio, notas } = req.body;

    // Llama al servicio para generar el pedido completo
    const pedido = await PedidoService.crearPedidoDesdeCarrito(
      id_usuario,
      metodo_entrega,
      costo_envio,
      notas
    );

    // Devuelve respuesta con código 201 (creado)
    res
      .status(201)
      .json({ ok: true, message: "Pedido creado correctamente", data: pedido });
  } catch (error) {
    //Error controlado en caso por mala solicitud
    res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
}

// ----------------------------------------------------------------------
// GET /api/pedidos/usuario
// Obtiene todos los pedidos del usuario autenticado
// ----------------------------------------------------------------------
async function obtenerPedidosUsuario(req, res) {
  try {
    const id_usuario = req.user.id || req.user.id_usuario; // Obtiene el ID del usuario del token JWT
    const pedidos = await PedidoService.listarPedidos(id_usuario);
    res.status(200).json({ 
      ok: true, 
      data: pedidos,
      message: `Se encontraron ${pedidos.length} pedidos para el usuario.`
    });
  } catch (error) {
    res.status(400).json({ 
      ok: false, 
      message: error.message 
    });
  }
}

// ----------------------------------------------------------------------
// GET /api/pedidos
// Lista todos los pedidos de un usuario (solo para admins)
// ----------------------------------------------------------------------
async function listar(req, res) {
  try {
    const { id_usuario } = req.query;
    let pedidos;
    if (id_usuario) {
      pedidos = await PedidoService.listarPedidos(id_usuario);
    } else {
      pedidos = await PedidoModel.listarTodosPedidos();
    }res.status(200).json({ ok: true, data: pedidos });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
}

// ----------------------------------------------------------------------
// GET /api/pedidos/:id
// Devuelve detalle completo del pedido (con validación de permisos)
// ----------------------------------------------------------------------
async function detalle(req, res) {
  try {
    const id_pedido = req.params.id;
    const usuarioId = req.user.id || req.user.id_usuario;
    const esAdmin = req.user.rol === 'admin' || req.user.rol === 'superadmin';
    
    // Llama al servicio para obtener pedido + ítems
    const pedido = await PedidoService.obtenerPedidoCompleto(id_pedido);
    
    // Validar permisos: solo el propietario del pedido o un admin pueden verlo
    let propietarioId = pedido && pedido.id_usuario;
    if (!propietarioId) {
      propietarioId = await PedidoModel.obtenerUsuarioDePedido(id_pedido);
    }
    if (!esAdmin && propietarioId !== usuarioId) {
      return res.status(403).json({
        ok: false,
        message: "No tienes permisos para ver este pedido.",
      });
    }
    
    res.status(200).json({
      ok: true,
      data: pedido,
    });
  } catch (error) {
    // Error 404 si el pedido no existe
    res.status(404).json({
      ok: false,
      message: error.message,
    });
  }
}

// ----------------------------------------------------------------------
// PUT /api/pedidos/:id/estado
// Actualiza el estado del pedido (admin)
// ----------------------------------------------------------------------
async function actualizarEstado(req, res) {
  try {
    const id_pedido = req.params.id;
    const { estado } = req.body;
    const id_usuario_admin = req.user.id || req.user.id_usuario; // ID del admin que está cambiando el estado
    
    const resultado = await PedidoService.cambiarEstado(id_pedido, estado, id_usuario_admin);
    res.status(200).json({ ok: true, message: resultado.message });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
}

// Exporta las funciones del controlador para las rutas
module.exports = {
  crearDesdeCarrito,
  obtenerPedidosUsuario,
  listar,
  detalle,
  actualizarEstado,
  verificarDatos,
};

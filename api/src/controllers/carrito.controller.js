// ======================================================================
// Recibe las peticiones HTTP y responde en formato JSON.
// Utiliza los servicios de CarritoService.
// ======================================================================

const CarritoService = require("../services/carrito.service");

// ----------------------------------------------------------------------
// GET /api/carrito
// ----------------------------------------------------------------------

// Listar los items del carrito de un usuario
async function listar(req, res) {
  console.log('DEBUG - Controlador listar ejecutándose');
  console.log('DEBUG - Headers:', req.headers);
  
  // Capture el error si el servicio falla
  try {
    // Debug: Verificar qué contiene req.user
    console.log('DEBUG - req.user:', req.user);
    console.log('DEBUG - req.user.id:', req.user?.id);
    
    // Verificar si req.user existe
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        message: "Usuario no autenticado - req.user es undefined"
      });
    }
    
    // Usar el id del usuario autenticado desde el token JWT
    const id_usuario = req.user.id;

    // Llamar al servicio para listar los items del carrito
    const items = await CarritoService.listarItems(id_usuario);
    // Retornar la respuesta con los items de un 200 OK
    res.status(200).json({
      ok: true,
      data: items,
    });
  } catch (error) {
    // Retornar un error 400 Bad Request con el mensaje del error
    res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
}

// ----------------------------------------------------------------------
// POST /api/carrito
// ----------------------------------------------------------------------
// Capturamos los errores a la hora de agregar un producto al carrito
async function agregar(req, res) {
  try {
    // Usar el id del usuario autenticado desde el token JWT
    const id_usuario = req.user.id;

    // Llamar al servicio para agregar el producto al carrito
    //Medianre el req.body recibimos
    const resultado = await CarritoService.agregarProductoAlCarrito(
      id_usuario,
      req.body
    );

    // Retornar la respuesta con el resultado de la operación
    res
      // Reportar un 201 Created si se agregó correctamente
      .status(201)
      .json({
        ok: true,
        // Mensaje del servicio (producto agregado o cantidad actualizada)
        message: resultado.message,
        // Devolver el id del carrito
        carrito_id: resultado.carrito_id,
      });
  } catch (error) {
    // Retornar un error 400 Bad Request con el mensaje del error
    res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
}

// ----------------------------------------------------------------------
// DELETE /api/carrito/item
// ----------------------------------------------------------------------

// Capturamos los errores a la hora de eliminar un producto del carrito
async function eliminar(req, res) {
  try {
    // Usar el id del usuario autenticado desde el token JWT
    const id_usuario = req.user.id;
    // Recibir id_producto e id_variante desde el body
    const { id_producto, id_variante } = req.body;

    // Llamar al servicio para eliminar el producto del carrito
    await CarritoService.eliminarProducto(id_usuario, id_producto, id_variante);
    // Retornar la respuesta con un 200 OK
    res
      .status(200)
      .json({ ok: true, message: "Producto eliminado correctamente" });
  } catch (error) {
    // Error 400 Bad Request con el mensaje del error
    res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
}

// ----------------------------------------------------------------------
// DELETE /api/carrito
// ----------------------------------------------------------------------

// Capturamos los errores a la hora de vaciar el carrito
async function vaciar(req, res) {
  try {
    // Usar el id del usuario autenticado desde el token JWT
    const id_usuario = req.user.id;
    // Llamar al servicio para vaciar el carrito
    await CarritoService.vaciar(id_usuario);
    // Retornar la respuesta con un 200 OK
    res.status(200).json({
      ok: true,
      message: "Carrito vaciado correctamente",
    });
  } catch (error) {
    // Error 400 Bad Request con el mensaje del error
    res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
}

// ----------------------------------------------------------------------
// FUNCIONES ADMINISTRATIVAS
// ----------------------------------------------------------------------

// GET /api/carrito/admin/todos - Listar todos los carritos (solo admins)
async function listarTodos(req, res) {
  try {
    const carritos = await CarritoService.listarTodosLosCarritos();
    res.status(200).json({
      ok: true,
      data: carritos,
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
}

// GET /api/carrito/admin/usuario/:id - Ver carrito de un usuario específico (solo admins)
async function verCarritoUsuario(req, res) {
  try {
    const id_usuario = parseInt(req.params.id);
    const carrito = await CarritoService.listarItems(id_usuario);
    res.status(200).json({
      ok: true,
      data: carrito,
      usuario_id: id_usuario,
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
}

// GET /api/carrito/admin/abandonados - Ver carritos abandonados (solo admins)
async function carritosAbandonados(req, res) {
  try {
    const dias = parseInt(req.query.dias) || 7; // Por defecto 7 días
    const carritos = await CarritoService.obtenerCarritosAbandonados(dias);
    res.status(200).json({
      ok: true,
      data: carritos,
      criterio: `Carritos sin actividad por más de ${dias} días`,
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
}

// DELETE /api/carrito/admin/limpiar-abandonados - Limpiar carritos abandonados (solo admins)
async function limpiarAbandonados(req, res) {
  try {
    const dias = parseInt(req.body.dias) || 30; // Por defecto 30 días
    const resultado = await CarritoService.limpiarCarritosAbandonados(dias);
    res.status(200).json({
      ok: true,
      message: `Se eliminaron ${resultado.eliminados} carritos abandonados`,
      eliminados: resultado.eliminados,
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
}

// GET /api/carrito/admin/estadisticas - Estadísticas de carritos (solo admins)
async function estadisticasCarritos(req, res) {
  try {
    const estadisticas = await CarritoService.obtenerEstadisticas();
    res.status(200).json({
      ok: true,
      data: estadisticas,
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
}

// Exportar las funciones del controlador
module.exports = {
  listar,
  agregar,
  eliminar,
  vaciar,
  // Funciones administrativas
  listarTodos,
  verCarritoUsuario,
  carritosAbandonados,
  limpiarAbandonados,
  estadisticasCarritos,
};

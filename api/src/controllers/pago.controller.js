// Este módulo define las funciones que responden a las peticiones HTTP
// relacionadas con los pagos. Se conecta con el servicio PagoService,
// que a su vez interactúa con Mercado Pago y la base de datos MySQL.
// ======================================================================

const pagoService = require("../services/pago.service");

// POST /api/pagos
// Crea una nueva preferencia de pago en Mercado Pago (modo sandbox)
async function crearPago(req, res) {
  try {
    // Extrae los datos enviados desde el cliente
    const { id_pedido, descripcion, monto_total } = req.body;

    // Validación básica de datos
    if (!id_pedido || !monto_total) {
      return res.status(400).json({
        ok: false,
        message: "Debe proporcionar el id_pedido y el monto_total.",
      });
    }

    //Llama al servicio que gestiona la lógica con Mercado Pago
    // Este servicio se encarga de comunicarse con la API de Mercado Pago
    // y devolver el link (sandbox_init_point) junto con el preference_id.
    const resultado = await pagoService.crearPreferenciaPago({
      id_pedido,
      descripcion,
      monto_total,
    });

    //Si el servicio devuelve un resultado no exitoso
    if (!resultado.ok) {
      return res.status(400).json(resultado);
    }

    //  Si todo sale bien, responde con la preferencia creada
    // El resultado incluirá información como:
    // - preference_id
    // - sandbox_init_point (URL de pago de prueba)
    // - datos del pedido asociado

    return res.status(201).json(resultado);
  } catch (error) {
    //Manejo de errores inesperados del servidor
    console.error("Error en crearPago:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno al crear la preferencia de pago.",
    });
  }
}

// GET /api/pagos
// Devuelve la lista completa de pagos registrados en la base de datos.
async function listarPagos(req, res) {
  try {
    const pagos = await pagoService.obtenerTodosLosPagos();
    return res.status(200).json({
      ok: true,
      data: pagos,
    });
  } catch (error) {
    console.error("Error en listarPagos:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al obtener los pagos.",
    });
  }
}

// GET /api/pagos/:id
// Obtiene el detalle completo de un pago por su ID.
// Solo el propietario del pedido o un administrador pueden ver el pago
async function obtenerPago(req, res) {
  try {
    //Extrae el parámetro de la ruta
    const { id } = req.params; // ID del pago solicitado
    const usuarioId = req.user.id_usuario; // ID del usuario autenticado
    const rolUsuario = req.user.rol; // Rol del usuario autenticado
    
    const pago = await pagoService.obtenerDetallePago(id);

    //Si no se encontró el pago, devuelve 404 (no encontrado)
    if (!pago) {
      return res.status(404).json({
        ok: false,
        message: "Pago no encontrado.",
      });
    }

    // Verificar autorización: solo el propietario del pedido o administradores
    if (rolUsuario !== 'admin' && rolUsuario !== 'superadmin') {
      // Obtener el pedido asociado para verificar el propietario
      const pedido = await pagoService.obtenerPedidoPorId(pago.id_pedido);
      if (!pedido || pedido.id_usuario !== usuarioId) {
        return res.status(403).json({
          ok: false,
          message: "No tienes permisos para ver este pago.",
        });
      }
    }

    //Si se encuentra el pago y tiene permisos, responde con los datos completos
    return res.status(200).json({
      ok: true,
      data: pago,
    });
  } catch (error) {
    //Manejo de errores inesperados DB yconexión,
    console.error("Error en obtenerPago:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al obtener el pago solicitado.",
    });
  }
}

//PUT /api/pagos/:id/estado
// Permite actualizar manualmente el estado de un pago
async function actualizarEstadoPago(req, res) {
  try {
    const { id } = req.params; //  Obtiene el ID del pago desde los parámetros de la URL
    const { estado } = req.body; // Obtiene el nuevo estado enviado en el cuerpo de la solicitud

    // Validación: el campo "estado" es obligatorio
    if (!estado) {
      return res.status(400).json({
        ok: false,
        message: "Debe indicar el nuevo estado del pago.",
      });
    }

    // Validar que el estado sea válido (en español)
    const estadosValidos = ['pendiente', 'aprobado', 'rechazado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        ok: false,
        message: "Estado inválido. Estados válidos: pendiente, aprobado, rechazado, cancelado",
      });
    }

    //Llama al servicio encargado de actualizar el registro en la DB
    const resultado = await pagoService.actualizarEstadoPago(id, estado);

    //Respuesta exitosa: estado actualizado correctamente
    return res.status(200).json({
      ok: true,
      message: "Estado del pago actualizado correctamente.",
      data: resultado,
    });
  } catch (error) {
    //Manejo de errores inesperados
    console.error("Error en actualizarEstadoPago:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al actualizar el estado del pago.",
    });
  }
}

//POST /api/pagos/webhook
// Endpoint que recibe notificaciones automáticas desde Mercado Pago.
// Se ejecuta cuando cambia el estado de un pago en modo sandbox.
async function recibirWebhook(req, res) {
  try {
    //Contiene información del evento, ID de transacción, tipo de recurso,
    // y detalles del pago (según la configuración del webhook).
    const data = req.body;

    //El servicio "procesarWebhook" debe analizar el evento recibido,
    // consultar a la API de Mercado Pago
    // y actualizar el estado del pago en la base de datos.
    const resultado = await pagoService.procesarWebhook(data);

    // Mercado Pago espera siempre un status 200 aunque no se procese
    return res.status(200).json(resultado);
  } catch (error) {
    // Manejo de errores inesperados durante el procesamiento del webhook
    console.error("Error en recibirWebhook:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al procesar el webhook.",
    });
  }
}

// POST /api/pagos/simular-aprobacion/:id_transaccion
// Endpoint para simular la aprobación automática de un pago (para desarrollo/testing)
async function simularAprobacionPago(req, res) {
  try {
    const { id_transaccion } = req.params;
    
    if (!id_transaccion) {
      return res.status(400).json({
        ok: false,
        message: "Debe proporcionar el ID de transacción.",
      });
    }

    console.log(`🎯 Simulando aprobación automática para transacción: ${id_transaccion}`);

    // Simular el webhook que enviaría Mercado Pago cuando se aprueba un pago
    const webhookSimulado = {
      data: {
        id: id_transaccion
      },
      status: "aprobado",
      type: "payment"
    };

    // Procesar el webhook simulado
    const resultado = await pagoService.procesarWebhook(webhookSimulado);

    if (!resultado.ok) {
      return res.status(400).json(resultado);
    }

    return res.status(200).json({
      ok: true,
      message: "Pago aprobado automáticamente. Se ejecutó el flujo completo: factura + email + PDF.",
      data: resultado
    });

  } catch (error) {
    console.error("Error en simularAprobacionPago:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al simular la aprobación del pago.",
    });
  }
}

async function aprobarPagoPorReferencia(req, res) {
  try {
    const { id_pago, id_pedido } = req.body || {};
    if (!id_pago && !id_pedido) {
      return res.status(400).json({ ok: false, message: "Debe enviar id_pago o id_pedido" });
    }
    const resultado = await pagoService.aprobarPagoPorReferencia({ id_pago, id_pedido });
    return res.status(200).json({ ok: true, message: "Pago aprobado", data: resultado });
  } catch (error) {
    return res.status(400).json({ ok: false, message: error.message });
  }
}

// GET /api/pagos/consulta
// Consulta pagos con filtros para usuarios autenticados
async function consultarPagos(req, res) {
  console.log('=== INICIO consultarPagos ===');
  console.log('Usuario autenticado:', req.user);
  
  try {
    console.log('Usuario:', req.user);
    
    const usuarioId = req.user.id; // Cambio: usar 'id' en lugar de 'id_usuario'
    const rolUsuario = req.user.rol;
    
    console.log('Usuario ID:', usuarioId, 'Rol:', rolUsuario);
    
    // Extraer parámetros de consulta
    const { 
      estado, 
      fecha_desde, 
      fecha_hasta, 
      id_pedido,
      monto_min,
      monto_max,
      page = 1,
      limit = 10
    } = req.query;

    console.log('Parámetros de consulta:', req.query);

    // Construir filtros
    const filtros = {
      estado,
      fecha_desde,
      fecha_hasta,
      id_pedido,
      monto_min: monto_min ? parseFloat(monto_min) : undefined,
      monto_max: monto_max ? parseFloat(monto_max) : undefined,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    // Si no es admin, solo puede ver sus propios pagos
    if (rolUsuario !== 'admin' && rolUsuario !== 'superadmin') {
      filtros.id_usuario = usuarioId;
    }

    console.log('Filtros construidos:', filtros);

    // Llamar al servicio para consultar pagos
    console.log('Llamando al servicio...');
    const resultado = await pagoService.consultarPagosConFiltros(filtros);
    console.log('Resultado del servicio:', resultado);

    return res.status(200).json({
      ok: true,
      data: resultado.pagos,
      pagination: {
        page: filtros.page,
        limit: filtros.limit,
        total: resultado.total,
        totalPages: Math.ceil(resultado.total / filtros.limit)
      },
      message: `Se encontraron ${resultado.total} pagos.`
    });

  } catch (error) {
    console.error("=== ERROR EN consultarPagos ===");
    console.error("Error:", error);
    console.error("Stack trace:", error.stack);
    console.error("Error message:", error.message);
    console.error("=== FIN ERROR ===");
    return res.status(500).json({
      ok: false,
      message: "Error al consultar los pagos.",
      error: error.message // Agregamos el mensaje de error para debugging
    });
  }
}

module.exports = {
  crearPago,
  listarPagos,
  consultarPagos,
  obtenerPago,
  actualizarEstadoPago,
  recibirWebhook,
  simularAprobacionPago,
  aprobarPagoPorReferencia,
};

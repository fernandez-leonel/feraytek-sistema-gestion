// Contiene la lógica de negocio para la gestión de pagos,
// conectando la base de datos MySQL (modelo Pago) con la API de Mercado Pago.
// Se encarga de crear preferencias, procesar respuestas y actualizar estados.

const { MercadoPagoConfig, Preference } = require("mercadopago");
const {
  crearPago,
  listarPagos,
  obtenerPagoPorId,
  actualizarEstadoPago: actualizarEstadoPagoModel,
  obtenerPagoPorTransaccion,
  obtenerPagoPorPedido,
  registrarWebhook,
  consultarPagosConFiltros,
} = require("../models/pago.model");
const pedidoModel = require("../models/pedido.model");
const FacturaService = require("./factura.service");
const EmailService = require("./email.service");
const pool = require("../config/database");

require("dotenv").config();

// Configuración del SDK de Mercado Pago
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
  options: { timeout: 5000 },
});

// Crear preferencia de pago (modo sandbox)
// ----------------------------------------------------------------------
// Recibe la información del pedido y crea una preferencia (objeto de pago)
// en el entorno de prueba (sandbox). Devuelve el link simulado de pago.
async function crearPreferenciaPago({ id_pedido, descripcion, monto_total }) {
  try {
    // Validamos que no exista un pago previo
    const pagoExistente = await obtenerPagoPorPedido(id_pedido);
    if (pagoExistente) {
      throw new Error("Ya existe un pago asociado a este pedido.");
    }

    // Configuración de la preferencia para Mercado Pago
    const preference = {
      items: [
        {
          title: descripcion || `Pedido #${id_pedido}`,
          quantity: 1,
          currency_id: "ARS",
          unit_price: parseFloat(monto_total),
        },
      ],
      back_urls: {
        success: "http://localhost:3000/pago/success",
        failure: "http://localhost:3000/pago/failure", 
        pending: "http://localhost:3000/pago/pendiente",
      },
      notification_url: "https://57dd286a51d4.ngrok-free.app/api/pagos/webhook", // Webhook público via ngrok
      binary_mode: true, // El pago se aprueba o rechaza automáticamente
    };

    // Se crea la preferencia en Mercado Pago (SDK v2)
    const preferenceInstance = new Preference(mpClient);
    const response = await preferenceInstance.create({ body: preference });

    const id_transaccion = response.id;
    const raw_gateway_json = response;

    // Guardar el pago en la base de datos
    const id_pago = await crearPago({
      id_pedido,
      metodo_pago: "mercado_pago",
      monto: monto_total,
      id_transaccion,
      raw_gateway_json,
    });

    // Respuesta al cliente
    return {
      ok: true,
      message: "Preferencia de pago creada correctamente (sandbox).",
      data: {
        id_pago,
        id_pedido,
        id_transaccion,
        estado_pago: "pendiente",
        link_pago: response.init_point,
        link_sandbox: response.sandbox_init_point,
      },
    };
  } catch (error) {
    console.error("Error al crear la preferencia de pago:", error);
    return {
      ok: false,
      message: error.message,
    };
  }
}

// Procesar notificación del Webhook (callback de Mercado Pago)
// ----------------------------------------------------------------------
// Mercado Pago llama automáticamente a este endpoint cuando cambia el
// estado de un pago. Actualiza el registro en la tabla `pagos`.
async function procesarWebhook(data) {
  try {
    const { data: webhookData } = data;
    const id_transaccion = webhookData?.id || null;

    if (!id_transaccion)
      throw new Error("Webhook sin ID de transacción válido.");

    // Se busca el pago correspondiente en la base de datos usando el id_transaccion
    const pagoEncontrado = await obtenerPagoPorTransaccion(id_transaccion);

    if (!pagoEncontrado) {
      console.warn("Webhook recibido pero no se encontró el pago asociado.");
      return { ok: false, message: "Pago no encontrado en la base de datos." };
    }

    // Determinar nuevo estado - mapear estados de Mercado Pago a nuestros estados
    let nuevoEstado = "pendiente";
    const statusFromWebhook = data?.status || webhookData?.status;
    
    // Mapear estados de inglés a español (para compatibilidad con Mercado Pago)
    if (statusFromWebhook === "approved" || statusFromWebhook === "aprobado") {
      nuevoEstado = "aprobado";
    } else if (statusFromWebhook === "rejected" || statusFromWebhook === "rechazado") {
      nuevoEstado = "rechazado";
    } else if (statusFromWebhook === "cancelled" || statusFromWebhook === "cancelado") {
      nuevoEstado = "cancelado";
    } else if (statusFromWebhook === "pending" || statusFromWebhook === "pendiente") {
      nuevoEstado = "pendiente";
    }

    // Actualizar estado del pago usando la función del modelo
    await actualizarEstadoPagoModel(pagoEncontrado.id_pago, nuevoEstado);

    // Si el pago quedó aprobado, generar factura si aún no existe
    if (nuevoEstado === "aprobado") {
      const pedido = await obtenerPedidoPorId(pagoEncontrado.id_pedido);
      if (pedido) {
        // Verificar si ya existe factura por pedido
        const existente = await FacturaService.verificarFactura({ id_pedido: pedido.id_pedido });
        if (!existente) {
          const detalles = await pedidoModel.obtenerDetallePedido(pedido.id_pedido);
          const iva_total = (detalles || []).reduce((acc, d) => acc + parseFloat(d.iva_monto || 0), 0);
          const subtotal = parseFloat(pedido.subtotal || 0);
          const descuento_total = parseFloat(pedido.descuento_total || 0);
          const costo_envio = parseFloat(pedido.costo_envio || 0);
          const totalFactura = subtotal - descuento_total + costo_envio + iva_total;
          await FacturaService.crearFactura({
            id_pedido: pedido.id_pedido,
            id_usuario: pedido.id_usuario,
            id_pago: pagoEncontrado.id_pago,
            subtotal,
            iva_total,
            total: totalFactura,
          });
        }
      }
    }

    // Registrar datos crudos del webhook
    await registrarWebhook(pagoEncontrado.id_pago, data);

    return { ok: true, message: "Webhook procesado correctamente." };
  } catch (error) {
    console.error("Error procesando webhook:", error);
    return { ok: false, message: error.message };
  }
}

// Consultar pagos registrados
async function obtenerTodosLosPagos() {
  const pagos = await listarPagos();
  return pagos;
}

// Obtener detalle de un pago por ID
async function obtenerDetallePago(id_pago) {
  const pago = await obtenerPagoPorId(id_pago);
  if (!pago) throw new Error("Pago no encontrado.");
  return pago;
}

// Obtener información de un pedido por ID
// ----------------------------------------------------------------------
async function obtenerPedidoPorId(id_pedido) {
  try {
    const [rows] = await pool.query('SELECT * FROM pedidos WHERE id_pedido = ?', [id_pedido]);
    return rows[0];
  } catch (error) {
    console.error(`Error al obtener pedido ${id_pedido}:`, error);
    throw error;
  }
}

async function aprobarPagoPorReferencia({ id_pago, id_pedido }) {
  let pago = null;
  if (id_pago) {
    pago = await obtenerPagoPorId(id_pago);
  } else if (id_pedido) {
    pago = await obtenerPagoPorPedido(id_pedido);
  }

  if (!pago) {
    throw new Error("No se encontró el pago para aprobar");
  }

  await actualizarEstadoPagoModel(pago.id_pago, "aprobado");

  // Generar factura si aún no existe para el pedido
  const pedido = await obtenerPedidoPorId(pago.id_pedido);
  if (pedido) {
    const existente = await FacturaService.verificarFactura({ id_pedido: pedido.id_pedido });
    if (!existente) {
      const detalles = await pedidoModel.obtenerDetallePedido(pedido.id_pedido);
      const iva_total = (detalles || []).reduce((acc, d) => acc + parseFloat(d.iva_monto || 0), 0);
      const subtotal = parseFloat(pedido.subtotal || 0);
      const descuento_total = parseFloat(pedido.descuento_total || 0);
      const costo_envio = parseFloat(pedido.costo_envio || 0);
      const totalFactura = subtotal - descuento_total + costo_envio + iva_total;
      await FacturaService.crearFactura({
        id_pedido: pedido.id_pedido,
        id_usuario: pedido.id_usuario,
        id_pago: pago.id_pago,
        subtotal,
        iva_total,
        total: totalFactura,
      });
    }
  }
  await registrarWebhook(pago.id_pago, {
    source: "manual_admin",
    approved_by: id_pago ? "id_pago" : "id_pedido",
    ref: id_pago || id_pedido,
    status: "aprobado",
    at: new Date().toISOString(),
  });

  return { ok: true, id_pago: pago.id_pago, estado: "aprobado" };
}

// Actualizar estado del pago y, si corresponde, generar factura
async function actualizarEstadoPago(id_pago, nuevoEstado) {
  const resultado = await actualizarEstadoPagoModel(id_pago, nuevoEstado);

  if (nuevoEstado === "aprobado") {
    const pago = await obtenerPagoPorId(id_pago);
    if (pago && pago.id_pedido) {
      const pedido = await obtenerPedidoPorId(pago.id_pedido);
      if (pedido) {
        const existente = await FacturaService.verificarFactura({ id_pedido: pedido.id_pedido });
        if (!existente) {
          const detalles = await pedidoModel.obtenerDetallePedido(pedido.id_pedido);
          const iva_total = (detalles || []).reduce((acc, d) => acc + parseFloat(d.iva_monto || 0), 0);
          await FacturaService.crearFactura({
            id_pedido: pedido.id_pedido,
            id_usuario: pedido.id_usuario,
            id_pago: id_pago,
            subtotal: pedido.subtotal || 0,
            iva_total,
            total: pedido.total,
          });
        }
      }
    }
  }

  return resultado;
}

// Consultar pagos con filtros - wrapper del modelo
// ----------------------------------------------------------------------
async function consultarPagosConFiltrosService(filtros) {
  try {
    console.log('Consultando pagos con filtros:', filtros);
    const resultado = await consultarPagosConFiltros(filtros);
    console.log('Resultado de consulta:', resultado);
    return resultado;
  } catch (error) {
    console.error('Error en consultarPagosConFiltrosService:', error);
    throw error;
  }
}

// ======================================================================
// EXPORTACIÓN DE FUNCIONES
// ======================================================================
module.exports = {
  crearPreferenciaPago,
  procesarWebhook,
  obtenerTodosLosPagos,
  obtenerDetallePago,
  consultarPagosConFiltros: consultarPagosConFiltrosService,
  obtenerPedidoPorId,
  aprobarPagoPorReferencia,
  actualizarEstadoPago,
};

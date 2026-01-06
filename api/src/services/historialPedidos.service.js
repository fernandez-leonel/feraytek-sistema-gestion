const HistorialPedidos = require("../models/historialPedidos.model");

const HistorialPedidosService = {
  // Listar todos los registros del historial
  listar: async () => {
    return await HistorialPedidos.getAll();
  },

  // Listar historial por pedido
  listarPorPedido: async (id_pedido) => {
    if (!id_pedido) throw new Error("Debe indicar el ID del pedido.");
    return await HistorialPedidos.getByPedido(id_pedido);
  },

  // Registrar un nuevo cambio de estado
  registrarCambio: async (
    id_pedido,
    estado_anterior,
    estado_nuevo,
    id_usuario
  ) => {
    if (!id_pedido || !estado_nuevo)
      throw new Error("Faltan datos obligatorios para registrar el historial.");

    return await HistorialPedidos.create(
      id_pedido,
      estado_anterior || null,
      estado_nuevo,
      id_usuario || null
    );
  },
};

module.exports = HistorialPedidosService;

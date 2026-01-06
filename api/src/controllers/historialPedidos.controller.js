const HistorialPedidosService = require("../services/historialPedidos.service");
const HistorialPedidosModel = require("../models/historialPedidos.model");

// Función temporal para verificar datos en historial_pedidos
const verificarDatosHistorial = async (req, res) => {
  try {
    const estadisticas = await HistorialPedidosModel.verificarDatosHistorial();
    const ejemplos = await HistorialPedidosModel.obtenerEjemplosHistorial();
    
    res.status(200).json({
      success: true,
      message: 'Datos de historial_pedidos verificados',
      estadisticas,
      ejemplos
    });
  } catch (error) {
    console.error('Error al verificar datos del historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Función temporal para crear historial automáticamente para pedidos existentes
const crearHistorialAutomatico = async (req, res) => {
  try {
    const resultado = await HistorialPedidosModel.crearHistorialParaPedidosExistentes();
    
    res.status(200).json({
      success: true,
      message: 'Historial creado automáticamente para pedidos existentes',
      data: resultado
    });
  } catch (error) {
    console.error('Error al crear historial automático:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

const HistorialPedidosController = {
  // GET /api/historial_pedidos
  listar: async (req, res) => {
    try {
      const data = await HistorialPedidosService.listar();
      res.status(200).json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // GET /api/historial_pedidos/pedido/:id_pedido
  listarPorPedido: async (req, res) => {
    try {
      const { id_pedido } = req.params;
      const data = await HistorialPedidosService.listarPorPedido(id_pedido);
      res.status(200).json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // POST /api/historial_pedidos
  registrar: async (req, res) => {
    try {
      const { id_pedido, estado_anterior, estado_nuevo, id_usuario } = req.body;
      const result = await HistorialPedidosService.registrarCambio(
        id_pedido,
        estado_anterior,
        estado_nuevo,
        id_usuario
      );
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
};

module.exports = {
  ...HistorialPedidosController,
  verificarDatosHistorial,
  crearHistorialAutomatico,
};

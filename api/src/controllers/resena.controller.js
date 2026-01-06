const ResenaService = require("../services/resena.service");

class ResenaController {
  static async crear(req, res) {
    try {
      const { id_producto, calificacion, comentario } = req.body;
      const id_usuario = req.user.id; // JWT Middleware - corregido de id_usuario a id
      const id_reseña = await ResenaService.crear(
        id_usuario,
        id_producto,
        calificacion,
        comentario
      );
      res.status(201).json({
        mensaje: "Reseña creada exitosamente",
        id_reseña,
      });
    } catch (error) {
      res.status(error.status || 500).json({
        error: error.message,
      });
    }
  }

  static async listarTodas(req, res) {
    try {
      const { estado } = req.query;
      const reseñas = await ResenaService.listarPorEstado(estado);
      res.status(200).json(reseñas);
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  static async listarPorProducto(req, res) {
    try {
      const { id_producto } = req.params;
      const reseñas = await ResenaService.listarPorProducto(id_producto);
      res.status(200).json(reseñas);
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  static async actualizar(req, res) {
    try {
      const { id_reseña } = req.params;
      const { calificacion, comentario } = req.body;
      const id_usuario = req.user.id; // Corregido de id_usuario a id
      await ResenaService.actualizar(
        id_reseña,
        id_usuario,
        calificacion,
        comentario
      );
      res.status(200).json({ mensaje: "Reseña actualizada correctamente" });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  static async actualizarEstado(req, res) {
    try {
      const { id_reseña } = req.params;
      const { estado, motivo } = req.body;
      const id_admin = req.user.id;
      const data = await ResenaService.actualizarEstado(id_reseña, estado, motivo, id_admin);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, error: error.message });
    }
  }
}

module.exports = ResenaController;

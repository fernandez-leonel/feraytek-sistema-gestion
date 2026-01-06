const categoriaService = require('../services/categoria.service');

const categoriaController = {
  // GET /api/categorias - Obtener todas las categorías
  getAllCategorias: async (req, res) => {
    try {
      const result = await categoriaService.getAllCategorias();
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor',
        error: error.error
      });
    }
  },

  // GET /api/categorias/activas - Obtener solo categorías activas
  getActiveCategorias: async (req, res) => {
    try {
      const result = await categoriaService.getActiveCategorias();
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor',
        error: error.error
      });
    }
  },

  // GET /api/categorias/stats - Obtener estadísticas de categorías
  getCategoriaStats: async (req, res) => {
    try {
      const result = await categoriaService.getCategoriaStats();
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor',
        error: error.error
      });
    }
  },

  // GET /api/categorias/:id - Obtener categoría por ID
  getCategoriaById: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await categoriaService.getCategoriaById(id);
      
      if (!result.success) {
        return res.status(404).json(result);
      }
      
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor',
        error: error.error
      });
    }
  },

  // POST /api/categorias - Crear nueva categoría
  createCategoria: async (req, res) => {
    try {
      const categoriaData = req.body;
      const result = await categoriaService.createCategoria(categoriaData);
      
      res.status(201).json(result);
    } catch (error) {
      // Si es un error de validación o duplicado, devolver 400
      if (error.message && (
        error.message.includes('requerido') ||
        error.message.includes('exceder') ||
        error.message.includes('Ya existe') ||
        error.message.includes('debe ser')
      )) {
        return res.status(400).json({
          success: false,
          message: error.message,
          error: error.error
        });
      }
      
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor',
        error: error.error
      });
    }
  },

  // PUT /api/categorias/:id - Actualizar categoría
  updateCategoria: async (req, res) => {
    try {
      const { id } = req.params;
      const categoriaData = req.body;
      const result = await categoriaService.updateCategoria(id, categoriaData);
      
      if (!result.success) {
        return res.status(404).json(result);
      }
      
      res.status(200).json(result);
    } catch (error) {
      // Si es un error de validación o duplicado, devolver 400
      if (error.message && (
        error.message.includes('requerido') ||
        error.message.includes('exceder') ||
        error.message.includes('Ya existe') ||
        error.message.includes('debe ser') ||
        error.message.includes('inválido')
      )) {
        return res.status(400).json({
          success: false,
          message: error.message,
          error: error.error
        });
      }
      
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor',
        error: error.error
      });
    }
  },

  // DELETE /api/categorias/:id - Cambiar estado de categoría (toggle activa/inactiva)
  toggleCategoriaStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await categoriaService.toggleCategoriaStatus(id);
      
      if (!result.success) {
        return res.status(404).json(result);
      }
      
      res.status(200).json(result);
    } catch (error) {
      if (error.message && error.message.includes('inválido')) {
        return res.status(400).json({
          success: false,
          message: error.message,
          error: error.error
        });
      }
      
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor',
        error: error.error
      });
    }
  },

  // DELETE /api/categorias/:id/permanent - Eliminar categoría permanentemente
  deleteCategoria: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await categoriaService.deleteCategoria(id);
      
      if (!result.success) {
        // Si hay productos asociados o no se encuentra, devolver 400 o 404
        if (result.message.includes('no encontrada')) {
          return res.status(404).json(result);
        }
        return res.status(400).json(result);
      }
      
      res.status(200).json(result);
    } catch (error) {
      if (error.message && error.message.includes('inválido')) {
        return res.status(400).json({
          success: false,
          message: error.message,
          error: error.error
        });
      }
      
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor',
        error: error.error
      });
    }
  }
};

module.exports = categoriaController;
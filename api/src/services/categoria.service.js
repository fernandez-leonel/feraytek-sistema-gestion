const categoriaModel = require('../models/categoria.model');

const categoriaService = {
  // Obtener todas las categorías
  getAllCategorias: async () => {
    try {
      const categorias = await categoriaModel.getAll();
      return {
        success: true,
        data: categorias,
        message: 'Categorías obtenidas exitosamente'
      };
    } catch (error) {
      throw {
        success: false,
        message: 'Error al obtener las categorías',
        error: error.message
      };
    }
  },

  // Obtener solo categorías activas
  getActiveCategorias: async () => {
    try {
      const categorias = await categoriaModel.getAllActive();
      return {
        success: true,
        data: categorias,
        message: 'Categorías activas obtenidas exitosamente'
      };
    } catch (error) {
      throw {
        success: false,
        message: 'Error al obtener las categorías activas',
        error: error.message
      };
    }
  },

  // Obtener categoría por ID
  getCategoriaById: async (id) => {
    try {
      if (!id || isNaN(id)) {
        throw new Error('ID de categoría inválido');
      }

      const categoria = await categoriaModel.getById(id);
      
      if (!categoria) {
        return {
          success: false,
          message: 'Categoría no encontrada'
        };
      }

      return {
        success: true,
        data: categoria,
        message: 'Categoría obtenida exitosamente'
      };
    } catch (error) {
      throw {
        success: false,
        message: 'Error al obtener la categoría',
        error: error.message
      };
    }
  },

  // Crear nueva categoría
  createCategoria: async (categoriaData) => {
    try {
      const { nombre_categoria, descripcion, estado } = categoriaData;

      // Validaciones
      if (!nombre_categoria || nombre_categoria.trim() === '') {
        throw new Error('El nombre de la categoría es requerido');
      }

      if (nombre_categoria.length > 120) {
        throw new Error('El nombre de la categoría no puede exceder 120 caracteres');
      }

      if (descripcion && descripcion.length > 300) {
        throw new Error('La descripción no puede exceder 300 caracteres');
      }

      if (estado && !['activa', 'inactiva'].includes(estado)) {
        throw new Error('El estado debe ser "activa" o "inactiva"');
      }

      // Verificar si ya existe una categoría con el mismo nombre
      const existeCategoria = await categoriaModel.existsByName(nombre_categoria.trim());
      if (existeCategoria) {
        throw new Error('Ya existe una categoría con ese nombre');
      }

      const nuevaCategoria = await categoriaModel.create({
        nombre_categoria: nombre_categoria.trim(),
        descripcion: descripcion ? descripcion.trim() : null,
        estado: estado || 'activa'
      });

      return {
        success: true,
        data: nuevaCategoria,
        message: 'Categoría creada exitosamente'
      };
    } catch (error) {
      throw {
        success: false,
        message: error.message || 'Error al crear la categoría',
        error: error.message
      };
    }
  },

  // Actualizar categoría
  updateCategoria: async (id, categoriaData) => {
    try {
      if (!id || isNaN(id)) {
        throw new Error('ID de categoría inválido');
      }

      const { nombre_categoria, descripcion, estado } = categoriaData;

      // Validaciones
      if (!nombre_categoria || nombre_categoria.trim() === '') {
        throw new Error('El nombre de la categoría es requerido');
      }

      if (nombre_categoria.length > 120) {
        throw new Error('El nombre de la categoría no puede exceder 120 caracteres');
      }

      if (descripcion && descripcion.length > 300) {
        throw new Error('La descripción no puede exceder 300 caracteres');
      }

      if (estado && !['activa', 'inactiva'].includes(estado)) {
        throw new Error('El estado debe ser "activa" o "inactiva"');
      }

      // Verificar si la categoría existe
      const categoriaExistente = await categoriaModel.getById(id);
      if (!categoriaExistente) {
        return {
          success: false,
          message: 'Categoría no encontrada'
        };
      }

      // Verificar si ya existe otra categoría con el mismo nombre
      const existeCategoria = await categoriaModel.existsByName(nombre_categoria.trim(), id);
      if (existeCategoria) {
        throw new Error('Ya existe otra categoría con ese nombre');
      }

      const categoriaActualizada = await categoriaModel.update(id, {
        nombre_categoria: nombre_categoria.trim(),
        descripcion: descripcion ? descripcion.trim() : null,
        estado: estado || categoriaExistente.estado
      });

      return {
        success: true,
        data: categoriaActualizada,
        message: 'Categoría actualizada exitosamente'
      };
    } catch (error) {
      throw {
        success: false,
        message: error.message || 'Error al actualizar la categoría',
        error: error.message
      };
    }
  },

  // Cambiar estado de categoría (toggle activa/inactiva)
  toggleCategoriaStatus: async (id) => {
    try {
      if (!id || isNaN(id)) {
        throw new Error('ID de categoría inválido');
      }

      const result = await categoriaModel.toggleStatus(id);
      
      if (!result) {
        return {
          success: false,
          message: 'Categoría no encontrada'
        };
      }

      return {
        success: true,
        data: {
          id_categoria: result.id_categoria,
          estadoAnterior: result.estadoAnterior,
          nuevoEstado: result.nuevoEstado
        },
        message: result.message
      };
    } catch (error) {
      throw {
        success: false,
        message: 'Error al cambiar el estado de la categoría',
        error: error.message
      };
    }
  },

  // Eliminar categoría (con validación de productos asociados)
  deleteCategoria: async (id) => {
    try {
      if (!id || isNaN(id)) {
        throw new Error('ID de categoría inválido');
      }

      // Verificar si la categoría existe
      const categoria = await categoriaModel.getById(id);
      if (!categoria) {
        return {
          success: false,
          message: 'Categoría no encontrada'
        };
      }

      // Verificar si hay productos asociados a esta categoría
      const productosAsociados = await categoriaModel.countProductsByCategory(id);
      if (productosAsociados > 0) {
        return {
          success: false,
          message: `No se puede eliminar la categoría porque tiene ${productosAsociados} producto(s) asociado(s). Primero desactive la categoría o reasigne los productos.`
        };
      }

      const eliminada = await categoriaModel.delete(id);
      
      if (!eliminada) {
        throw new Error('No se pudo eliminar la categoría');
      }

      return {
        success: true,
        message: 'Categoría eliminada exitosamente'
      };
    } catch (error) {
      throw {
        success: false,
        message: error.message || 'Error al eliminar la categoría',
        error: error.message
      };
    }
  },

  // Obtener estadísticas de categorías
  getCategoriaStats: async () => {
    try {
      const todasCategorias = await categoriaModel.getAll();
      const categoriasActivas = await categoriaModel.getAllActive();
      
      const stats = {
        total: todasCategorias.length,
        activas: categoriasActivas.length,
        inactivas: todasCategorias.length - categoriasActivas.length
      };

      return {
        success: true,
        data: stats,
        message: 'Estadísticas de categorías obtenidas exitosamente'
      };
    } catch (error) {
      throw {
        success: false,
        message: 'Error al obtener las estadísticas de categorías',
        error: error.message
      };
    }
  }
};

module.exports = categoriaService;
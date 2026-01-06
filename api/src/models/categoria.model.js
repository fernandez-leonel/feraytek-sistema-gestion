const db = require('../config/database');

const categoriaModel = {
  // Obtener todas las categorías
  getAll: async () => {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM categorias ORDER BY nombre_categoria ASC'
      );
      return rows;
    } catch (error) {
      throw error;
    }
  },

  // Obtener todas las categorías activas
  getAllActive: async () => {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM categorias WHERE estado = "activa" ORDER BY nombre_categoria ASC'
      );
      return rows;
    } catch (error) {
      throw error;
    }
  },

  // Obtener categoría por ID
  getById: async (id) => {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM categorias WHERE id_categoria = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Obtener categoría por nombre
  getByName: async (nombre) => {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM categorias WHERE nombre_categoria = ?',
        [nombre]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Crear nueva categoría
  create: async (categoriaData) => {
    try {
      const { nombre_categoria, descripcion, estado = 'activa' } = categoriaData;
      
      const [result] = await db.execute(
        'INSERT INTO categorias (nombre_categoria, descripcion, estado) VALUES (?, ?, ?)',
        [nombre_categoria, descripcion, estado]
      );
      
      return {
        id_categoria: result.insertId,
        nombre_categoria,
        descripcion,
        estado
      };
    } catch (error) {
      throw error;
    }
  },

  // Actualizar categoría
  update: async (id, categoriaData) => {
    try {
      const { nombre_categoria, descripcion, estado } = categoriaData;
      
      const [result] = await db.execute(
        'UPDATE categorias SET nombre_categoria = ?, descripcion = ?, estado = ? WHERE id_categoria = ?',
        [nombre_categoria, descripcion, estado, id]
      );
      
      if (result.affectedRows === 0) {
        return null;
      }
      
      return await categoriaModel.getById(id);
    } catch (error) {
      throw error;
    }
  },

  // Cambiar estado de categoría (activa/inactiva)
  toggleStatus: async (id) => {
    try {
      // Primero obtenemos el estado actual
      const categoria = await categoriaModel.getById(id);
      if (!categoria) {
        return null;
      }

      const nuevoEstado = categoria.estado === 'activa' ? 'inactiva' : 'activa';
      
      const [result] = await db.execute(
        'UPDATE categorias SET estado = ? WHERE id_categoria = ?',
        [nuevoEstado, id]
      );

      if (result.affectedRows === 0) {
        return null;
      }

      return {
        id_categoria: id,
        estadoAnterior: categoria.estado,
        nuevoEstado: nuevoEstado,
        message: `Categoría ${nuevoEstado === 'activa' ? 'activada' : 'desactivada'} exitosamente`
      };
    } catch (error) {
      throw error;
    }
  },

  // Eliminar categoría (físicamente - usar con precaución)
  delete: async (id) => {
    try {
      const [result] = await db.execute(
        'DELETE FROM categorias WHERE id_categoria = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  },

  // Contar productos por categoría
  countProductsByCategory: async (id) => {
    try {
      const [rows] = await db.execute(
        'SELECT COUNT(*) as total FROM productos WHERE id_categoria = ?',
        [id]
      );
      return rows[0].total;
    } catch (error) {
      throw error;
    }
  },

  // Verificar si existe una categoría con el mismo nombre (para validaciones)
  existsByName: async (nombre, excludeId = null) => {
    try {
      let query = 'SELECT COUNT(*) as count FROM categorias WHERE nombre_categoria = ?';
      let params = [nombre];
      
      if (excludeId) {
        query += ' AND id_categoria != ?';
        params.push(excludeId);
      }
      
      const [rows] = await db.execute(query, params);
      return rows[0].count > 0;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = categoriaModel;
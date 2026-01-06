// Descripción:
// Este modelo gestiona la tabla `descuentos`, que contiene los cupones
// o reglas promocionales del sistema.

const db = require("../config/database");

// Define los métodos estáticos para interactuar con la tabla `descuentos`.
class DescuentoModel {
  // Obtener todos los descuentos
  static async obtenerTodos() {
    const sql = `SELECT * FROM descuentos ORDER BY fecha_inicio DESC`;
    const [rows] = await db.execute(sql);
    return rows;
  }

  // Obtener un descuento por ID
  static async obtenerPorId(id) {
    const sql = `SELECT * FROM descuentos WHERE id_descuento = ?`;
    const [rows] = await db.execute(sql, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  //  Obtener un descuento por código
  static async obtenerPorCodigo(codigo) {
    const sql = `SELECT * FROM descuentos WHERE codigo = ?`;
    const [rows] = await db.execute(sql, [codigo]);
    return rows.length > 0 ? rows[0] : null;
  }

  // Crear un nuevo descuento
  static async crear(descuento) {
    try {
      // Desestructurar datos del objeto descuento recibido
      const {
        codigo,
        descripcion,
        tipo,
        valor,
        fecha_inicio,
        fecha_fin,
        estado = "activo",
      } = descuento;

      // Validaciones básicas antes de insertar
      if (!codigo || !tipo || !fecha_inicio || !fecha_fin) {
        throw new Error(
          "Campos obligatorios faltantes (código, tipo o fechas)."
        );
      }

      if (new Date(fecha_fin) <= new Date(fecha_inicio)) {
        throw new Error(
          "La fecha de fin debe ser posterior a la fecha de inicio."
        );
      }

      const tiposPermitidos = ["porcentaje", "monto", "envio_gratis"];
      if (!tiposPermitidos.includes(tipo)) {
        throw new Error("Tipo de descuento no válido.");
      }

      // Sentencia SQL para insertar el nuevo descuento
      const sql = `
      INSERT INTO descuentos
        (codigo, descripcion, tipo, valor, fecha_inicio, fecha_fin, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

      //  Ejecutar la consulta utilizando parámetros preparados
      const [result] = await db.execute(sql, [
        codigo,
        descripcion || null,
        tipo,
        valor || 0,
        fecha_inicio,
        fecha_fin,
        estado,
      ]);

      //Devolver respuesta exitosa con el nuevo ID
      return { id_descuento: result.insertId, ...descuento };
    } catch (error) {
      // Manejo de errores inesperados
      console.error("Error al crear el descuento:", error);

      // Retornar un error controlado al servicio o controlador
      return {
        ok: false,
        message: "Error al crear el descuento.",
        error: error.message, // opcional: útil para depuración
      };
    }
  }

  // Actualizar un descuento existente
  static async actualizar(id, datos) {
    try {
      // Verificar si el descuento existe antes de actualizar
      const descuentoActual = await this.obtenerPorId(id);
      if (!descuentoActual) {
        throw new Error(`No se encontró el descuento con ID ${id}.`);
      }

      // Construir dinámicamente la lista de campos a actualizar
      const campos = [];
      const valores = [];

      for (const [campo, valor] of Object.entries(datos)) {
        if (valor !== undefined) {
          campos.push(`${campo} = ?`);
          valores.push(valor);
        }
      }

      // Validar que haya al menos un campo para actualizar
      if (campos.length === 0) {
        throw new Error("No se proporcionaron campos para actualizar.");
      }

      // Generar la consulta SQL dinámica
      const sql = `
      UPDATE descuentos 
      SET ${campos.join(", ")}, updated_at = NOW()
      WHERE id_descuento = ?
    `;
      valores.push(id);

      // Ejecutar la consulta en la base de datos
      await db.execute(sql, valores);

      // Respuesta exitosa
      return {
        ok: true,
        message: "Descuento actualizado correctamente.",
      };
    } catch (error) {
      //  Manejo de errores (validación, SQL o conexión)
      console.error("Error al actualizar el descuento:", error);

      return {
        ok: false,
        message: "Error al actualizar el descuento.",
        error: error.message, // útil para depuración
      };
    }
  }

  // Eliminar un descuento
  static async eliminar(id) {
    try {
      // Consulta SQL para eliminar el descuento por su ID
      const sql = `DELETE FROM descuentos WHERE id_descuento = ?`;

      // Ejecuta la consulta utilizando parámetros preparados
      const [result] = await db.execute(sql, [id]);

      // Verificar si se eliminó algún registro
      if (result.affectedRows === 0) {
        throw new Error("No se encontró el descuento para eliminar.");
      }

      // Respuesta exitosa
      return { ok: true, message: "Descuento eliminado correctamente." };
    } catch (error) {
      // Manejo de errores (registro inexistente, fallo SQL)
      console.error("Error al eliminar el descuento:", error);

      return {
        ok: false,
        message: "Error al eliminar el descuento.",
        error: error.message, // opcional: útil para depuración en desarrollo
      };
    }
  }

  // Activar / Desactivar descuento
  static async cambiarEstado(id, nuevoEstado) {
    try {
      // Validar el nuevo estado
      if (!["activo", "inactivo"].includes(nuevoEstado)) {
        throw new Error("Estado inválido. Debe ser 'activo' o 'inactivo'.");
      }

      // Consulta SQL para actualizar el estado y registrar la fecha de modificación
      const sql = `
      UPDATE descuentos
      SET estado = ?, updated_at = NOW()
      WHERE id_descuento = ?
    `;

      // Ejecutar la consulta con parámetros preparados
      const [result] = await db.execute(sql, [nuevoEstado, id]);

      // Verificar si se afectó algún registro (descuento existente)
      if (result.affectedRows === 0) {
        throw new Error(
          "No se encontró el descuento para actualizar su estado."
        );
      }

      // Respuesta exitosa
      return {
        ok: true,
        message: `Descuento ${nuevoEstado} correctamente.`,
      };
    } catch (error) {
      // Manejo de errores (validación o base de datos)
      console.error("Error al cambiar el estado del descuento:", error);

      return {
        ok: false,
        message: "Error al cambiar el estado del descuento.",
        error: error.message, // opcional: útil en desarrollo
      };
    }
  }

  //  Obtener descuentos vigentes (entre fecha_inicio y fecha_fin)
  static async obtenerVigentes() {
    try {
      // Consulta SQL: selecciona descuentos activos y vigentes en el tiempo
      const sql = `
      SELECT *
      FROM descuentos
      WHERE estado = 'activo'
        AND NOW() BETWEEN fecha_inicio AND fecha_fin
      ORDER BY fecha_inicio DESC
    `;

      // Ejecutar la consulta y obtener los resultados
      const [rows] = await db.execute(sql);

      // Retornar la lista de descuentos vigentes
      return {
        ok: true,
        data: rows,
        count: rows.length, // opcional: cantidad total de resultados
      };
    } catch (error) {
      // Manejo de errores (conexión, SQL, etc.)
      console.error("Error al obtener los descuentos vigentes:", error);

      return {
        ok: false,
        message: "Error al obtener los descuentos vigentes.",
        error: error.message, // opcional: útil en desarrollo
      };
    }
  }
}

module.exports = DescuentoModel;

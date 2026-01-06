const DescuentoModel = require("../models/descuento.model");

class DescuentoService {
  // Listar todos los descuentos
  static async listarDescuentos() {
    return await DescuentoModel.obtenerTodos();
  }

  // Obtener un descuento por ID
  static async obtenerPorId(id) {
    try {
      //  Llamar al modelo para buscar el descuento
      const descuento = await DescuentoModel.obtenerPorId(id);

      //  Validar existencia del registro
      if (!descuento) {
        throw new Error("No se encontró el descuento especificado.");
      }

      // Retornar el descuento encontrado
      return {
        ok: true,
        data: descuento,
      };
    } catch (error) {
      // Manejo de errores
      console.error("Error al obtener el descuento:", error);

      return {
        ok: false,
        message: "Error al obtener el descuento especificado.",
        error: error.message, // opcional: útil para depuración
      };
    }
  }

  // Buscar un descuento por código (case-insensitive)
  static async obtenerPorCodigo(codigo) {
    try {
      // Normalizar el código recibido
      //Se eliminan espacios y se convierte a mayúsculas para que
      const normalizado = codigo.trim().toUpperCase();

      // Consultar el modelo para buscar el descuento
      const descuento = await DescuentoModel.obtenerPorCodigo(normalizado);

      //  Validar existencia del descuento
      if (!descuento) {
        throw new Error("Código de descuento no encontrado o inválido.");
      }

      // Retornar el descuento encontrado
      return {
        ok: true,
        data: descuento,
      };
    } catch (error) {
      //Manejo de errores inesperados o de validación
      console.error("Error al obtener el descuento por código:", error);

      return {
        ok: false,
        message: "Error al buscar el descuento por código.",
        error: error.message, // opcional, útil en modo desarrollo
      };
    }
  }

  //Crear un nuevo descuento con validaciones de negocio
  static async crearDescuento(datos) {
    try {
      //  Desestructurar los campos esperados del objeto recibido
      const { codigo, tipo, valor, fecha_inicio, fecha_fin } = datos;

      // Validaciones básicas de presencia de datos
      if (!codigo || !tipo || !fecha_inicio || !fecha_fin) {
        throw new Error("Faltan campos obligatorios: código, tipo o fechas.");
      }

      // Validar coherencia temporal
      if (new Date(fecha_fin) <= new Date(fecha_inicio)) {
        throw new Error(
          "La fecha de fin debe ser posterior a la fecha de inicio."
        );
      }

      // Validar valor numérico
      if (valor < 0) {
        throw new Error("El valor del descuento no puede ser negativo.");
      }

      // Verificar código duplicado en la base de datos
      const existente = await DescuentoModel.obtenerPorCodigo(codigo);
      if (existente) {
        throw new Error(`El código "${codigo}" ya está registrado.`);
      }

      //Validar tipo permitido
      const tiposPermitidos = ["porcentaje", "monto", "envio_gratis"];
      if (!tiposPermitidos.includes(tipo)) {
        throw new Error(
          `Tipo de descuento inválido. Debe ser uno de: ${tiposPermitidos.join(
            ", "
          )}.`
        );
      }

      // Insertar el nuevo descuento en la base de datos
      const nuevo = await DescuentoModel.crear(datos);

      // Respuesta exitosa
      return {
        ok: true,
        message: "Descuento creado correctamente.",
        data: nuevo,
      };
    } catch (error) {
      //Manejo centralizado de errores (validación o BD)
      console.error("Error al crear el descuento:", error);

      return {
        ok: false,
        message: "Error al crear el descuento.",
        error: error.message, // opcional, útil para depuración
      };
    }
  }

  //Actualizar un descuento existente
  static async actualizarDescuento(id, datos) {
    try {
      //  Verificar existencia del descuento
      const descuento = await DescuentoModel.obtenerPorId(id);
      if (!descuento) {
        throw new Error("No se encontró el descuento.");
      }

      // Si se cambia el código, validar que no exista otro igual
      if (datos.codigo && datos.codigo !== descuento.codigo) {
        const duplicado = await DescuentoModel.obtenerPorCodigo(datos.codigo);
        if (duplicado) {
          throw new Error("Ya existe otro descuento con ese código.");
        }
      }

      // Actualizar los datos del descuento
      await DescuentoModel.actualizar(id, datos);

      // Respuesta exitosa
      return { ok: true, message: "Descuento actualizado correctamente." };
    } catch (error) {
      // Manejo centralizado de errores (validación o base de datos)
      console.error("Error al actualizar el descuento:", error);

      return {
        ok: false,
        message: "Error al actualizar el descuento.",
        error: error.message, // opcional: útil para depuración
      };
    }
  }

  // Cambiar estado (activar/desactivar)
  static async cambiarEstado(id, nuevoEstado) {
    return await DescuentoModel.cambiarEstado(id, nuevoEstado);
  }

  // Eliminar un descuento
  static async eliminarDescuento(id) {
    return await DescuentoModel.eliminar(id);
  }

  // Obtener descuentos vigentes
  static async obtenerVigentes() {
    const descuentos = await DescuentoModel.obtenerVigentes();
    if (descuentos.length === 0) {
      return {
        ok: true,
        message: "No hay descuentos vigentes actualmente.",
        data: [],
      };
    }
    return { ok: true, data: descuentos };
  }

  // Aplicar un descuento sobre un monto total
  static aplicarDescuento(descuento, monto) {
    if (!descuento || !descuento.tipo) {
      throw new Error("Descuento no válido o sin tipo definido.");
    }

    // Convertir a minúsculas para evitar errores por mayúsculas/minúsculas
    const tipo = descuento.tipo.toLowerCase();
    let montoFinal = monto;

    switch (tipo) {
      case "porcentaje":
        montoFinal = monto - monto * (descuento.valor / 100);
        break;
      case "monto":
        // Ejemplo: valor = 1000 → resta $1000 al total
        montoFinal = Math.max(0, monto - descuento.valor);
        break;
      case "envio_gratis":
        montoFinal = monto;
        break;
      default:
        throw new Error(
          "Tipo de descuento desconocido. Tipos válidos: porcentaje, monto, envio_gratis."
        );
    }

    // Redondear a 2 decimales
    return Number(montoFinal.toFixed(2));
  }
}

module.exports = DescuentoService;

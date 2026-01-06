const DescuentoService = require("../services/descuento.service");

class DescuentoController {
  //  Obtiene todos los descuentos existentes.
  static async obtenerTodos(req, res) {
    try {
      const descuentos = await DescuentoService.listarDescuentos();
      res.status(200).json({ ok: true, data: descuentos });
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  }

  // Obtiene solo los descuentos activos y dentro de su fecha de vigencia.
  static async obtenerVigentes(req, res) {
    try {
      const result = await DescuentoService.obtenerVigentes();
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  }

  // Obtiene un descuento por su ID.
  static async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const descuento = await DescuentoService.obtenerPorId(id);
      res.status(200).json({ ok: true, data: descuento });
    } catch (error) {
      res.status(404).json({ ok: false, message: error.message });
    }
  }

  // Obtiene un descuento por su código (case-insensitive).
  static async obtenerPorCodigo(req, res) {
    try {
      const { codigo } = req.params;
      const descuento = await DescuentoService.obtenerPorCodigo(codigo);
      res.status(200).json({ ok: true, data: descuento });
    } catch (error) {
      res.status(404).json({ ok: false, message: error.message });
    }
  }

  // Crea un nuevo descuento con validaciones automáticas.
  static async crear(req, res) {
    try {
      const result = await DescuentoService.crearDescuento(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ ok: false, message: error.message });
    }
  }

  // Actualiza los campos de un descuento existente.
  static async actualizar(req, res) {
    try {
      const { id } = req.params;
      const result = await DescuentoService.actualizarDescuento(id, req.body);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ ok: false, message: error.message });
    }
  }

  //  Cambia el estado de un descuento (activo/inactivo).
  static async cambiarEstado(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      const result = await DescuentoService.cambiarEstado(id, estado);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ ok: false, message: error.message });
    }
  }

  // Elimina un descuento por su ID solo Adm
  static async eliminar(req, res) {
    try {
      const { id } = req.params;
      const result = await DescuentoService.eliminarDescuento(id);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ ok: false, message: error.message });
    }
  }

  // Prueba de aplicación del descuento sobre un monto base.
  static async aplicar(req, res) {
    try {
      const { codigo, monto } = req.body;

      // Buscar el descuento en la base de datos
      const resultado = await DescuentoService.obtenerPorCodigo(codigo);

      // Validar si existe el descuento
      if (!resultado.ok || !resultado.data) {
        return res.status(404).json({
          ok: false,
          message: "Código de descuento no encontrado o inactivo.",
        });
      }

      // Extraer el registro real de la propiedad .data
      const descuento = resultado.data;

      // Aplicar el cálculo del descuento
      const montoFinal = DescuentoService.aplicarDescuento(descuento, monto);

      // Respuesta exitosa
      res.status(200).json({
        ok: true,
        codigo: descuento.codigo,
        descripcion: descuento.descripcion,
        tipo: descuento.tipo,
        valor: descuento.valor,
        monto_original: monto,
        monto_final: montoFinal,
      });
    } catch (error) {
      res.status(400).json({
        ok: false,
        message: error.message,
      });
    }
  }
}

module.exports = DescuentoController;

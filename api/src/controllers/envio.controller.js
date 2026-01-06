// Descripción:
// Controlador responsable de gestionar las solicitudes HTTP relacionadas
// con los envíos logísticos de los pedidos.

const EnvioService = require("../services/envio.service");

// Lista de Todos los Envios
async function listarEnvios(req, res) {
  try {
    //Llamar al servicio que obtiene la lista de envíos
    const resultado = await EnvioService.listarEnvios();
    // Envío exitoso de la respuesta al cliente
    res.status(200).json(resultado);
  } catch (error) {
    //Captura de Erroes
    console.error("Error al listar envíos:", error);
    res.status(500).json({
      ok: false,
      message: "Error al obtener los envíos.",
    });
  }
}

// Obtenr el id del envio
async function obtenerEnvio(req, res) {
  try {
    //Extraer el parámetro de ruta (ID del envío)
    const id = req.params.id;
    //Llamar al servicio que gestiona la búsqueda del envío
    const resultado = await EnvioService.obtenerEnvio(id);

    //Si no se encontró el envío, responder con 404 (Not Found)
    if (!resultado.ok) {
      return res.status(404).json(resultado);
    }

    res.status(200).json(resultado);
  } catch (error) {
    //Manejo de errores inesperados (problemas en DB, conexión, etc.)
    console.error("Error al obtener envío:", error);
    res.status(500).json({
      ok: false,
      message: "Error al obtener el envío.",
    });
  }
}

//Creación del Nuevo Envio
async function crearEnvio(req, res) {
  try {
    const datos = req.body;
    const resultado = await EnvioService.crearEnvio(datos);

    // Si la creación falla (por validación), devuelve 400 (Bad Request)
    if (!resultado.ok) {
      return res.status(400).json(resultado);
    }

    res.status(201).json(resultado);
  } catch (error) {
    //Manejo de errores inesperados (problemas en DB, conexión, etc.)
    console.error("Error al crear envío:", error);
    res.status(500).json({
      ok: false,
      message: "Error al crear el envío.",
    });
  }
}

// Actualizacioens de Datos de Envios
async function actualizarDatosEnvio(req, res) {
  try {
    const id_envio = req.params.id; // Obtener el ID del envío desde los parámetros de la URL
    const nuevosDatos = req.body; //Obtener los nuevos datos desde el cuerpo de la petición (JSON)

    //Llamar al servicio que gestiona la actualización
    const resultado = await EnvioService.actualizarDatosEnvio(
      id_envio,
      nuevosDatos
    );

    // Si no se pudo actualizar (envío no encontrado o sin cambios)
    if (!resultado.ok) {
      return res.status(404).json(resultado);
    }

    res.status(200).json(resultado); // Actualización exitosa → devolver respuesta con código 200
  } catch (error) {
    console.error("Error al actualizar datos del envío:", error);
    res.status(500).json({
      //Manejo de errores inesperados
      ok: false,
      message: "Error al actualizar los datos del envío.",
    });
  }
}

//Cambios de Estado en los Envios
async function cambiarEstadoEnvio(req, res) {
  try {
    const id_envio = req.params.id;
    const { estado_envio } = req.body; // Recibimos el nuevo estado en el cuerpo

    const resultado = await EnvioService.cambiarEstadoEnvio(
      id_envio,
      estado_envio
    );

    if (!resultado.ok) {
      return res.status(400).json(resultado);
    }

    res.status(200).json(resultado);
  } catch (error) {
    console.error("Error al cambiar el estado del envío:", error);
    res
      .status(500)
      .json({ ok: false, message: "Error al actualizar el estado del envío." });
  }
}

// Elimnar el Envio
// Permite eliminar un envío (solo en entorno administrativo)
async function eliminarEnvio(req, res) {
  try {
    const id_envio = req.params.id;
    const resultado = await EnvioService.eliminarEnvio(id_envio);

    if (!resultado.ok) {
      return res.status(404).json(resultado);
    }

    res.status(200).json(resultado);
  } catch (error) {
    console.error("Error al eliminar envío:", error);
    res.status(500).json({
      ok: false,
      message: "Error al eliminar el envío.",
    });
  }
}

// Crear envíos para pedidos existentes
async function crearEnviosParaPedidosExistentes(req, res) {
  try {
    const resultado = await EnvioService.crearEnviosParaPedidosExistentes();
    
    if (resultado.ok) {
      res.status(200).json(resultado);
    } else {
      res.status(500).json(resultado);
    }
  } catch (error) {
    console.error("Error en crearEnviosParaPedidosExistentes:", error);
    res.status(500).json({
      ok: false,
      message: "Error interno del servidor.",
      error: error.message,
    });
  }
}

module.exports = {
  listarEnvios,
  obtenerEnvio,
  crearEnvio,
  actualizarDatosEnvio,
  cambiarEstadoEnvio,
  eliminarEnvio,
  crearEnviosParaPedidosExistentes,
};

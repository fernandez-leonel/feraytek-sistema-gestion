// ======================================================================
// Se encarga de recibir las peticiones HTTP, invocar los servicios
// y devolver respuestas JSON al cliente (frontend).
// ======================================================================

const ProductoService = require("../services/producto.service");

// ----------------------------------------------------------------------
// GET /api/productos
// ----------------------------------------------------------------------
// ASYNC AWAIT CON TRY CATCH para manejo de errores pero podemos menejar en middleware que estan los errores generales
// Pensarlos despues Leo
async function getAll(req, res) {
  try {
    const estadoReq = (req.query.estado || 'activo').toLowerCase();
    const allowed = ['activo', 'inactivo', 'todos'];
    const estado = allowed.includes(estadoReq) ? estadoReq : 'activo';
    const productos = await ProductoService.listarProductos(estado);
    res.status(200).json({
      ok: true,
      data: productos,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: error.message,
    });
  }
}

// ----------------------------------------------------------------------
// GET /api/productos/:id
// ----------------------------------------------------------------------
// Async Await con Try Catch para manejo de errores para la busqueda por ID
async function getById(req, res) {
  try {
    // Capturamos el producto por ID desde el servicio, pasandole el ID por parametro.
    const producto = await ProductoService.obtenerProductoPorId(req.params.id);
    // Devolvemos la respuesta al cliente, ok 200 es correcto con los datos del proeducto
    res.status(200).json({
      ok: true,
      data: producto,
    });
  } catch (error) {
    // Error lado del Cliente, no se encontro el producto, con mensaje del error
    res.status(404).json({
      ok: false,
      message: error.message,
    });
  }
}

// ----------------------------------------------------------------------
// POST /api/productos
// ----------------------------------------------------------------------
// Async Await con Try Catch para manejo de errores para la creacion de productos
async function create(req, res) {
  try {
    // Invocamos al servicio de crear producto, pasandole el cuerpo de la peticion (req.body)
    // Creacion del producto con el id que nos devuelve el servicio
    const idNuevo = await ProductoService.crearProducto(req.body);

    // Devolvemos la respuesta al cliente, ok 201 es creado con el ID del nuevo producto
    res.status(201).json({
      ok: true,
      // Mensaje de exito
      message: "Producto creado correctamente",
      id: idNuevo, // ID del nuevo producto
    });
  } catch (error) {
    //Error lado del Cliente el 400 es error en la peticion, con mensaje del error.
    res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
}

// ----------------------------------------------------------------------
// PUT /api/productos/:id
// ----------------------------------------------------------------------
// Async Await con Try Catch para manejo de errores para la actualizacion de productos
async function update(req, res) {
  try {
    // Invocamos al servicio de actualizar producto, pasandole el ID por parametro y el cuerpo de la peticion (req.body)
    await ProductoService.actualizarProducto(req.params.id, req.body);
    // Devolvemos la respuesta al cliente, ok 200 es correcto con mensaje de exito
    res.status(200).json({
      ok: true,
      message: "Producto actualizado correctamente",
    });
  } catch (error) {
    // Error lado del Cliente el 400 es error en la peticion, con mensaje del error.
    res.status(400).json({ ok: false, message: error.message });
  }
}

// ----------------------------------------------------------------------
// DELETE /api/productos/:id
// ----------------------------------------------------------------------

// Async Await con Try Catch para manejo de errores para la eliminacion de productos
async function remove(req, res) {
  try {
    // Invocamos al servicio de eliminar producto, pasandole el ID por parametro
    await ProductoService.eliminarProducto(req.params.id);
    res
      // Devolvemos la respuesta al cliente, ok 200 es correcto con mensaje de exito
      .status(200)
      .json({
        ok: true,
        message: "Producto eliminado correctamente",
      });
  } catch (error) {
    // cAPTURAMOS EL ERROR
    // Error lado del Cliente el 400 es error en la peticion, con mensaje del error.
    res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};

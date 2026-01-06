// ======================================================================-
// Capa intermedia entre el controlador y el modelo.
// Se encarga de aplicar validaciones y reglas de negocio
// antes de interactuar con la base de datos.
// ======================================================================

const Producto = require("../models/producto.model");

// ----------------------------------------------------------------------
// Obtener todos los productos
// ----------------------------------------------------------------------
async function listarProductos(estado = 'activo') {
  return await Producto.getAll(estado);
}

// ----------------------------------------------------------------------
// Obtener un producto por ID con validación básica
// ----------------------------------------------------------------------
// Se aplica Async/Await para manejar operaciones asíncronas
async function obtenerProductoPorId(id) {
  // El if valida que el ID sea un número válido o lance un error
  if (!id || isNaN(id)) throw new Error("ID de producto inválido");
  // Busca el producto en la base de datos por su ID
  // Si no lo encuentra, lanza un error
  const producto = await Producto.getById(id);
  if (!producto) throw new Error("Producto no encontrado");
  return producto;
}

// ----------------------------------------------------------------------
// Crear un nuevo producto con validación de campos requeridos
// ----------------------------------------------------------------------
async function crearProducto(datos) {
  // Valida que los campos obligatorios estén presentes
  if (!datos.nombre || !datos.precio_base || !datos.id_categoria)
    // Si falta algún campo, lanza un error
    throw new Error("Faltan datos obligatorios");

  // Crea el producto en la base de datos si todo está correcto
  return await Producto.create(datos);
}

// ----------------------------------------------------------------------
// Actualizar un producto existente
// ----------------------------------------------------------------------
async function actualizarProducto(id, datos) {
  // Verifica que el producto exista antes de actualizar
  const existe = await Producto.getById(id);
  // Caso de Error si no existe
  if (!existe) throw new Error("Producto no encontrado para actualizar");

  // Actualiza el producto con los nuevos datos
  // Si la actualización falla, lanza un error
  const actualizado = await Producto.update(id, datos);
  if (!actualizado) throw new Error("No se pudo actualizar el producto");

  return true;
}

// ----------------------------------------------------------------------
// Eliminar un producto (baja lógica)
// ----------------------------------------------------------------------
async function eliminarProducto(id) {
  // Verifica que el producto exista antes de eliminar
  const existe = await Producto.getById(id);
  // Caso de Error si no existe
  if (!existe) throw new Error("Producto no encontrado para eliminar");

  // Elimina el producto (baja lógica)
  // Si la eliminación falla, lanza un error
  const eliminado = await Producto.remove(id);
  if (!eliminado) throw new Error("No se pudo eliminar el producto");

  return true;
}

// Modulos de exportación para usar en el controlador
module.exports = {
  listarProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
};

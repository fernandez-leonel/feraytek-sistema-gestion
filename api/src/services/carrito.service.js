// ======================================================================
// Capa intermedia entre el controlador y el modelo.
// Valida datos, aplica lógica de negocio y delega operaciones.
// ======================================================================

const Carrito = require("../models/carrito.model");

// ----------------------------------------------------------------------
// Obtener el carrito activo del usuario o crear uno nuevo
// ----------------------------------------------------------------------
// Si no existe un carrito activo, se crea uno nuevo y se devuelve se relaciona a un usuario.
async function obtenerOCrearCarrito(id_usuario) {
  // Retorna el carrito activo del usuario
  let carrito = await Carrito.getCarritoActivo(id_usuario);
  // Si no existe, crea uno nuevo
  if (!carrito) {
    // Crear relación del Id usuario con el carrito
    const nuevoId = await Carrito.crearCarrito(id_usuario);
    // Crear objeto carrito con la relción del carrito y el usuario
    carrito = { id_carrito: nuevoId, id_usuario, estado: "activo" };
  }
  return carrito; // Retorna el carrito activo o el nuevo carrito creado
}

// ----------------------------------------------------------------------
// Agregar producto al carrito
// ----------------------------------------------------------------------
// Si no existe un carrito activo, se crea uno nuevo y se agrega el producto.
async function agregarProductoAlCarrito(id_usuario, datosProducto) {
  // Obtener o crear carrito activo
  const carrito = await obtenerOCrearCarrito(id_usuario);

  // Se declara un consta con los datos del producto
  const {
    id_producto,
    id_variante,
    cantidad,
    precio_unitario,
    iva_porcentaje,
  } = datosProducto; // Datos gurados en la declaracio detosProducto

  //En la setencias del If se valida que los datos del producto sean válidos
  if (!id_producto || !cantidad || cantidad <= 0) {
    // Devolvemos un error en caso de que los datos no sean válidos
    throw new Error("Datos de producto inválidos o cantidad no válida");
  }

  // Validar que precio_unitario sea requerido y válido
  if (!precio_unitario || precio_unitario <= 0) {
    throw new Error("El precio_unitario es requerido y debe ser mayor a 0");
  }

  // Validar que iva_porcentaje sea requerido y válido
  if (iva_porcentaje === undefined || iva_porcentaje === null || iva_porcentaje < 0) {
    throw new Error("El iva_porcentaje es requerido y debe ser mayor o igual a 0");
  }

  // Cálculo del monto del IVA
  const iva_monto = (precio_unitario * (iva_porcentaje / 100)).toFixed(2);

  // Agregar producto al carrito con los datos del monto del IVA
  await Carrito.agregarProducto({
    id_carrito: carrito.id_carrito,
    id_producto,
    id_variante,
    cantidad,
    precio_unitario,
    iva_porcentaje,
    iva_monto,
  });

  // Retnammso un mensaje de éxito y el ID del carrito
  return {
    message: "Producto agregado correctamente",
    carrito_id: carrito.id_carrito,
  };
}

// ----------------------------------------------------------------------
// Listar ítems del carrito activo
// ----------------------------------------------------------------------
// Un lista de produtos en el carrito del usuario
async function listarItems(id_usuario) {
  // Obtener el carrito activo del usuario
  const carrito = await Carrito.getCarritoActivo(id_usuario);

  // Si el caarrito no existe, lanzar un error
  if (!carrito) throw new Error("No hay carrito activo");

  // Obtener los ítems del carrito
  const items = await Carrito.getItems(carrito.id_carrito);
  return items; // Retorna la lista de ítems del carrito
}

// ----------------------------------------------------------------------
// Eliminar producto del carrito
// ----------------------------------------------------------------------

// Elimina un producto específico del carrito activo del usuario
async function eliminarProducto(id_usuario, id_producto, id_variante) {
  // Obtener el carrito activo del usuario
  const carrito = await Carrito.getCarritoActivo(id_usuario);

  // Si el carrito no existe, lanzar un error
  if (!carrito) throw new Error("No hay carrito activo");

  // Intentar eliminar el ítem del carrito
  const ok = await Carrito.eliminarItem(
    carrito.id_carrito,
    id_producto,
    id_variante
  );
  // Si no se pudo eliminar, lanzar un error
  if (!ok) throw new Error("El producto no se encontró en el carrito");
  return true; // Retorna true si se eliminó correctamente
}

// ----------------------------------------------------------------------
// Vaciar carrito
// ----------------------------------------------------------------------

// Elimina todos los productos del carrito activo del usuario
async function vaciar(id_usuario) {
  // Obtener el carrito activo del usuario
  const carrito = await Carrito.getCarritoActivo(id_usuario);

  // Si el carrito no existe, lanzar un error
  if (!carrito) throw new Error("No hay carrito activo");

  // Vaciar el carrito
  await Carrito.vaciarCarrito(carrito.id_carrito);
  return true;
}

// ----------------------------------------------------------------------
// FUNCIONES ADMINISTRATIVAS
// ----------------------------------------------------------------------

// Listar todos los carritos del sistema (solo para admins)
async function listarTodosLosCarritos() {
  const carritos = await Carrito.getTodosLosCarritos();
  return carritos;
}

// Obtener carritos abandonados (sin actividad por X días)
async function obtenerCarritosAbandonados(dias = 7) {
  const carritos = await Carrito.getCarritosAbandonados(dias);
  return carritos;
}

// Limpiar carritos abandonados
async function limpiarCarritosAbandonados(dias = 30) {
  const eliminados = await Carrito.eliminarCarritosAbandonados(dias);
  return { eliminados };
}

// Obtener estadísticas de carritos
async function obtenerEstadisticas() {
  const estadisticas = await Carrito.getEstadisticasCarritos();
  return estadisticas;
}

// Exportar las funciones del servicio
module.exports = {
  obtenerOCrearCarrito,
  agregarProductoAlCarrito,
  listarItems,
  eliminarProducto,
  vaciar,
  // Funciones administrativas
  listarTodosLosCarritos,
  obtenerCarritosAbandonados,
  limpiarCarritosAbandonados,
  obtenerEstadisticas,
};

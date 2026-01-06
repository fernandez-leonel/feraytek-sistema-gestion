// ======================================================================
// APP PRINCIPAL - Configura middlewares globales y registra las rutas
// ---------------------------------------------------------------------

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

// Rutas principales de los módulos
const userRoutes = require("./routes/user.routes");
const superadminRoutes = require("./routes/superadmin.routes");
const productoRoutes = require("./routes/producto.routes");
const categoriaRoutes = require("./routes/categoria.routes");
const productoCategoriaRoutes = require("./routes/productoCategoria.routes");
const imagenesProductoRoutes = require("./routes/imagenesProducto.routes");
const resenaRoutes = require("./routes/resena.routes");
const carritoRoutes = require("./routes/carrito.routes");
const pedidoRoutes = require("./routes/pedido.routes");
const pagoRoutes = require("./routes/pago.routes");
const envioRoutes = require("./routes/envio.routes");
const historialPedidosRoutes = require("./routes/historialPedidos.routes");
const descuentoRoutes = require("./routes/descuento.routes");
const facturaRoutes = require("./routes/factura.routes");
const soporteRoutes = require("./routes/soporte.routes");
const logRoutes = require("./routes/log.routes");
const emailRoutes = require("./routes/email.routes");
const userManagementRoutes = require("./routes/userManagement.routes");
const auditRoutes = require("./routes/audit.routes");
const adminRoutes = require("./routes/admin.routes");
const passwordResetRoutes = require("./routes/passwordReset.routes");
const variantesProductoRoutes = require("./routes/variantesProducto.routes");

// Middleware de auditoría
const { auditMiddleware } = require("./middleware/audit");

// Inicialización de la aplicación principal
const app = express();

// Middlewares globales (se aplican a todas las rutas)
app.use(cors()); // Habilita CORS (permite solicitudes desde otros dominios)
app.use(express.json()); // Permite recibir y procesar JSON en el cuerpo de las peticiones
app.use(morgan("dev")); // Muestra logs de las solicitudes HTTP en consola (modo desarrollo)

// Middleware de auditoría (registra acciones importantes automáticamente)
// TEMPORALMENTE DESHABILITADO PARA DEBUGGING
// app.use(auditMiddleware);

// Registro de rutas principales del sistema
app.use("/api/users", userRoutes);
app.use("/api/superadmin", superadminRoutes);
app.use("/api/productos", productoRoutes);
app.use("/api/categorias", categoriaRoutes);
app.use("/api/productos-categorias", productoCategoriaRoutes);
app.use("/api/imagenes_productos", imagenesProductoRoutes);
app.use("/api/resenas", resenaRoutes);
app.use("/api/carrito", carritoRoutes);
app.use("/api/pedidos", pedidoRoutes);
app.use("/api/pagos", pagoRoutes);
app.use("/api/envios", envioRoutes);
app.use("/api/historial-pedidos", historialPedidosRoutes);
app.use("/api/descuentos", descuentoRoutes);
app.use("/api/facturas", facturaRoutes);
app.use("/api/soporte", soporteRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/user-management", userManagementRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", passwordResetRoutes);
app.use("/api/variantes", variantesProductoRoutes);

// Ruta raíz de prueba (para verificar que el servidor está activo)
app.get("/", (req, res) => {
  res.json({
    message: "8D API Feraytek - Servidor activo, Don Señor ARIELO 8P",
  });
});

module.exports = app;

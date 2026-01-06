// Feraytek Admin Desktop — Servidor Express modular
// Objetivo
// - Orquestar middlewares y routers
// - Dividir responsabilidades por dominio (pedidos, pagos, productos, variantes, imágenes)
// - Mantener este archivo entre 100–150 líneas con comentarios útiles
//
// Convenciones
// - Autenticación: los routers reenvían `Authorization` del request hacia el backend remoto
// - Respuestas: siempre JSON; errores con `error` legible
// - Estructura de carpetas: `routes/` para endpoints; `lib/` para clientes/utilidades
// - Archivos estáticos: `/uploads` sirve imágenes almacenadas localmente

const express = require('express')
const cors = require('cors')
const path = require('path')

// Instancia del servidor
const app = express()
const PORT = process.env.PORT || 4001
// Variables de entorno relevantes
// - `PORT`: puerto del servidor local (por defecto 4001)
// - `API_BASE`: base del backend remoto consumido por los routers (definido en lib/apiClient)

// Middlewares base
app.use(cors())
app.use(express.json())
// Nota: agregar aquí middlewares globales como rate-limits o logs si fuese necesario

// Archivos estáticos: acceso a imágenes subidas
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))
// Estructura de `/uploads`:
// - `/uploads/productos/{id_producto}/{archivo}` guardado por rutas de imágenes locales

// Routers por dominio funcional
const pedidosRouter = require('./routes/pedidos')
const productosRouter = require('./routes/productos')
const variantesRouter = require('./routes/variantes')
const localImagesRouter = require('./routes/localImages')
const pagosRouter = require('./routes/pagos')
const enviosRouter = require('./routes/envio.routes')
const informeRouter = require('./routes/informe.routes')
const facturasRouter = require('./routes/facturas')
const soporteRouter = require('./routes/soporte.routes')
const resenasRouter = require('./routes/resena.routes')
const carritoRouter = require('./routes/carrito')

// Endpoints expuestos por cada router
// - `pedidos`:
//   * GET `/pedidos`           → lista con filtros y paginación
//   * GET `/pedidos/:id`       → detalle normalizado
//   * GET `/pedidos/:id/historial` → historial compatible con distintas rutas de backend
//   * PUT `/pedidos/:id/estado`   → cambio de estado (texto o número)
// - `validator` (productos/variantes):
//   * POST `/validator/productos`        → crea producto con validaciones numéricas
//   * PUT  `/validator/productos/:id`    → actualiza producto
//   * POST `/validator/variantes`        → crea variante asociada a producto existente
//   * PUT  `/validator/variantes/:id`    → actualiza variante
// - `local-images`:
//   * POST `/local-images/upload`        → sube imagen única (o URL) con tope de 3
//   * POST `/local-images/upload-multiple` → sube varias imágenes respetando posiciones libres
//   * DELETE `/local-images/:id`         → elimina imagen y borra archivo local si corresponde
// - `pagos`:
//   * POST `/validator/pagos`        → crea pago validado con enlace a pedido
//   * GET  `/pagos/consulta`         → parámetros de búsqueda y paginación
//   * GET  `/pagos/admin`            → listado paginado ordenado por fecha
//   * POST `/pagos/simular-aprobacion` → crea y marca como aprobado (además actualiza pedido)

// Pedidos: listar, detalle, historial y cambios de estado
app.use('/pedidos', pedidosRouter)

// Validadores: creación/actualización de productos y variantes
app.use('/validator', productosRouter)
app.use('/validator', variantesRouter)

// Imágenes locales: subida, eliminación y subida múltiple
app.use('/local-images', localImagesRouter)

// Pagos: consulta, listado admin, simulación y validador
app.use(pagosRouter)

// Envios: administrativo
app.use(enviosRouter)

// Informe: endpoints agrupados bajo /api/informe
app.use(informeRouter)

// Facturas: admin estadísticas, listado, detalle, acciones y búsqueda
app.use(facturasRouter)

// Soporte: tickets de clientes y acciones de admin
app.use(soporteRouter)

// Reseñas: creación, listado, obtención y actualización
app.use(resenasRouter)

// Envios: administrativo completo (listar, obtener, crear, actualizar, estado, eliminar)
// (ya montado arriba)

// Carrito: operaciones de usuario y administración
app.use(carritoRouter)

// Utilidad simple de ejemplo: validación de números positivos
app.post('/validate/positive', (req, res) => {
  const { value } = req.body
  const num = Number(value)
  if (!Number.isFinite(num) || num < 0) return res.status(400).json({ error: 'Valor debe ser numérico positivo' })
  return res.json({ ok: true, value: num })
})

// Salud del servicio para diagnósticos rápidos
app.get('/health', (req, res) => {
  res.json({ ok: true, port: PORT, uptime: process.uptime() })
})

// 404 por defecto para rutas no montadas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

// Inicio del servidor HTTP
app.listen(PORT, () => {
  console.log(`Local backend running on http://localhost:${PORT}`)
})

module.exports = app

// Nota de extensión
// - Para agregar nuevos dominios, crear router en `routes/` y montar aquí.
// - Evitar lógica compleja en este archivo: mantenerlo como orquestador.
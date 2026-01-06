const axios = require('axios')

const LOCAL = process.env.REACT_APP_LOCAL_BACKEND_URL || 'http://localhost:4001'
const API_BASE = process.env.API_BASE || 'http://localhost:3001/api'
const token = process.env.TEST_BEARER || ''
const hdr = token ? { Authorization: `Bearer ${token}` } : {}

async function run() {
  console.log('Iniciando test de flujo de producto...')
  try {
    const productoValido = { nombre: 'Producto Test', descripcion: 'Prueba integral', precio_base: 100, stock: 10, iva_porcentaje: 21, stock_minimo: 2, id_categoria: 1, estado: 'activo' }
    const create = await axios.post(`${LOCAL}/validator/productos`, productoValido, { headers: { ...hdr } })
    const prod = create.data?.data || create.data
    const productoId = prod?.id || prod?.id_producto
    if (!productoId) throw new Error('No se obtuvo ID de producto creado')
    console.log('Producto creado ID=', productoId)

    let failed = false
    try { await axios.post(`${LOCAL}/validator/productos`, { ...productoValido, precio_base: -1 }, { headers: { ...hdr } }) } catch { failed = true }
    if (!failed) throw new Error('Backend NO rechazó precio negativo en producto')
    console.log('Validación de precio negativo en producto OK')

    const varianteValida = { id_producto: productoId, nombre_variante: 'Color', valor_variante: 'Rojo', precio_adicional: 10, stock: 5 }
    await axios.post(`${LOCAL}/validator/variantes`, varianteValida, { headers: { ...hdr } })
    console.log('Variante creada OK')

    failed = false
    try { await axios.post(`${LOCAL}/validator/variantes`, { ...varianteValida, precio_adicional: -3 }, { headers: { ...hdr } }) } catch { failed = true }
    if (!failed) throw new Error('Backend NO rechazó precio adicional negativo en variante')
    console.log('Validación de precio adicional negativo en variante OK')

    // Agregar 3 imágenes por URL (simples). Se asume que la API real las acepta.
    for (let i=1;i<=3;i++) {
      await axios.post(`${API_BASE}/imagenes_productos`, { id_producto: productoId, url_imagen: `http://example.com/img${i}.png`, posicion: i, alt_text: `Imagen ${i}` }, { headers: { ...hdr } })
    }
    console.log('3 imágenes agregadas OK')
    failed = false
    try { await axios.post(`${LOCAL}/local-images/upload`, { productoId, posicion: 4, alt_text: 'Cuarta', url: 'http://example.com/img4.png' }, { headers: { ...hdr } }) } catch { failed = true }
    if (!failed) throw new Error('Backend NO rechazó cuarta imagen')
    console.log('Restricción de máximo 3 imágenes OK')

    console.log('Flujo completo validado correctamente')
  } catch (e) {
    console.error('Fallo en test:', e.message)
    process.exit(1)
  }
}

run()
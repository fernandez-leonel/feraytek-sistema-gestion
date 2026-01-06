// Utilidades de normalización y estados para Pedidos

function estadoTextFromNumber(n) {
  const map = { 1: 'pendiente', 2: 'procesando', 3: 'enviado', 4: 'entregado', 5: 'cancelado' }
  return map[n] || String(n)
}

function estadoNumberFromText(s) {
  const m = { pendiente: 1, procesando: 2, enviado: 3, entregado: 4, cancelado: 5 }
  const k = String(s || '').toLowerCase()
  return m[k] || null
}

function uiEstadoFromBackendText(s) {
  const k = String(s || '').toLowerCase()
  if (k === 'pagado') return 'procesando'
  if (k === 'reembolsado') return 'cancelado'
  return k
}

function normalizePedido(x) {
  const id = x.id ?? x.id_pedido
  const estadoRaw = typeof x.estado === 'number' ? estadoTextFromNumber(x.estado) : String(x.estado || '')
  const estado = uiEstadoFromBackendText(estadoRaw)
  const metodo_pago = x.metodo_pago ?? x.payment_method
  const created_at = x.created_at ?? x.fecha_creacion ?? x.fecha ?? x.createdAt ?? x.fecha_pedido
  const total_final = x.total_final ?? x.total
  const cliente = x.cliente || { nombre: x.cliente_nombre }
  return { ...x, id, estado, metodo_pago, created_at, total_final, cliente }
}

module.exports = { estadoTextFromNumber, estadoNumberFromText, normalizePedido }
// Descripción:
// Modelo SQL de envíos: ejecuta consultas seguras con placeholders.
// Incluye SELECT con JOIN a pedidos y operaciones CRUD.
// ----------------------------------------------------------------------

const pool = require("../config/database")

module.exports = {
  // OBTENER TODOS LOS ENVÍOS
  async obtenerTodos() {
    const q = `
      SELECT e.*, p.id_usuario, p.estado AS estado_pedido
      FROM envios e
      INNER JOIN pedidos p ON e.id_pedido = p.id_pedido
      ORDER BY e.id_envio DESC
    `
    const [rows] = await pool.query(q)
    return rows
  },
  // OBTENER POR ID
  async obtenerPorId(id_envio) {
    const q = `
      SELECT e.*, p.id_usuario, p.estado AS estado_pedido
      FROM envios e
      INNER JOIN pedidos p ON e.id_pedido = p.id_pedido
      WHERE e.id_envio = ?
    `
    const [rows] = await pool.query(q, [id_envio])
    return rows[0]
  },
  // CREAR ENVÍO
  async crear(d) {
    const q = `
      INSERT INTO envios (
        id_pedido, destinatario, direccion_envio, ciudad, provincia, pais,
        codigo_postal, empresa_envio, numero_seguimiento, estado_envio, fecha_envio
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `
    const vals = [
      d.id_pedido, d.destinatario, d.direccion_envio, d.ciudad, d.provincia, d.pais,
      d.codigo_postal, d.empresa_envio, d.numero_seguimiento, d.estado_envio,
    ]
    const [res] = await pool.query(q, vals)
    return res.insertId
  },
  // ACTUALIZAR DATOS (NO ESTADO)
  async actualizar(id_envio, d) {
    const q = `
      UPDATE envios SET
        destinatario = ?, direccion_envio = ?, ciudad = ?, provincia = ?, pais = ?,
        codigo_postal = ?, empresa_envio = ?, numero_seguimiento = ?, updated_at = NOW()
      WHERE id_envio = ?
    `
    const vals = [
      d.destinatario, d.direccion_envio, d.ciudad, d.provincia, d.pais,
      d.codigo_postal, d.empresa_envio, d.numero_seguimiento, id_envio,
    ]
    const [res] = await pool.query(q, vals)
    return res.affectedRows > 0
  },
  // ACTUALIZAR ESTADO
  async actualizarEstado(id_envio, estado) {
    let extra = ""
    if (estado === "en_camino") extra = ", fecha_envio = NOW()"
    if (estado === "entregado") extra = ", fecha_entrega = NOW()"
    const q = `UPDATE envios SET estado_envio = ?, updated_at = NOW() ${extra} WHERE id_envio = ?`
    const [res] = await pool.query(q, [estado, id_envio])
    return res.affectedRows > 0
  },
  // ELIMINAR
  async eliminar(id_envio) {
    const [res] = await pool.query("DELETE FROM envios WHERE id_envio = ?", [id_envio])
    return res.affectedRows > 0
  },
  // GENERAR PARA PEDIDOS EXISTENTES SIN ENVÍO
  async crearParaPedidosExistentes() {
    const q = `
      INSERT INTO envios (id_pedido, direccion_envio, ciudad, provincia, pais, codigo_postal, estado_envio, fecha_envio)
      SELECT p.id_pedido, p.direccion, p.ciudad, p.provincia, 'Argentina', p.codigo_postal, 'preparando', NOW()
      FROM pedidos p
      LEFT JOIN envios e ON e.id_pedido = p.id_pedido
      WHERE e.id_envio IS NULL
    `
    const [res] = await pool.query(q)
    return res.affectedRows > 0
  },
}

// ----------------------------------------------------------------------
// Nota: Este modelo ejecuta SQL seguro con placeholders y JOIN a pedidos.
// Se mantiene ≤150 líneas concentrando únicamente operaciones de DB.
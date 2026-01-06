// Importamos la conexión del pool configurada en config/database.js
const pool = require("../config/database");

// Creamos un objeto literal que contendrá todas las funciones del modelo
const EnvioModel = {
  // OBTENER TODOS LOS ENVÍOS
  // Devuelve un listado completo de los registros de la tabla `envios`.
  async obtenerTodos() {
    const query = `
      SELECT e.*, p.id_usuario, p.estado AS estado_pedido
      FROM envios e
      INNER JOIN pedidos p ON e.id_pedido = p.id_pedido
      ORDER BY e.id_envio DESC;
    `;
    const [rows] = await pool.query(query);
    return rows;
  },

  // Devuelve un envío específico según su ID primario (id_envio).
  async obtenerPorId(id_envio) {
    const query = `
      SELECT e.*, p.id_usuario, p.estado AS estado_pedido
      FROM envios e
      INNER JOIN pedidos p ON e.id_pedido = p.id_pedido
      WHERE e.id_envio = ?;
    `;
    const [rows] = await pool.query(query, [id_envio]);
    // Si no existe, retorna undefined.
    return rows[0]; // Devuelve un único registro
  },

  //OBTENER ENVÍO POR ID DE PEDIDO
  async obtenerPorPedido(id_pedido) {
    // Consulta SQL: selecciona todos los campos de la tabla `envios`
    const query = "SELECT * FROM envios WHERE id_pedido = ?";
    // Ejecuta la consulta de manera segura usando parámetros preparados.
    const [rows] = await pool.query(query, [id_pedido]);
    return rows[0]; // Devuelve solo el primer resultado encontrado (o undefined si no hay coincidencia)
  },

  // Inserta un nuevo registro de envío vinculado a un pedido.
  async crear(datos) {
    const query = `
      INSERT INTO envios 
      (id_pedido, destinatario, direccion_envio, ciudad, provincia, pais, 
       codigo_postal, empresa_envio, numero_seguimiento, estado_envio, fecha_envio)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW());
    `;

    // Vector de valores que reemplazará los placeholders (?)
    const values = [
      datos.id_pedido,
      datos.destinatario || null,
      datos.direccion_envio,
      datos.ciudad,
      datos.provincia,
      datos.pais || "Argentina",
      datos.codigo_postal,
      datos.empresa_envio || null,
      datos.numero_seguimiento || null,
      datos.estado_envio || "preparando",
    ];

    // Ejecuta la consulta en la base de datos utilizando el pool de conexión
    const [result] = await pool.query(query, values);

    // Devuelve el ID del nuevo envío creado
    return result.insertId;
  },

  // Permite actualizar los datos de dirección, empresa o número de
  // seguimiento. No modifica el estado del envío.
  async actualizar(id_envio, datos) {
    // Consulta SQL preparada para actualizar campos específicos del envío.
    const query = `
      UPDATE envios
      SET 
        destinatario = ?, 
        direccion_envio = ?, 
        ciudad = ?, 
        provincia = ?, 
        pais = ?, 
        codigo_postal = ?, 
        empresa_envio = ?, 
        numero_seguimiento = ?, 
        updated_at = NOW()
      WHERE id_envio = ?;
    `;

    // Valores que reemplazan los placeholders (?) de la consulta.
    const values = [
      datos.destinatario || null,
      datos.direccion_envio,
      datos.ciudad,
      datos.provincia,
      datos.pais || "Argentina",
      datos.codigo_postal,
      datos.empresa_envio || null,
      datos.numero_seguimiento || null,
      id_envio,
    ];

    const [result] = await pool.query(query, values);

    // Devuelve true si se actualizó al menos un registro
    return result.affectedRows > 0;
  },

  // Cambia el valor del campo `estado_envio`.
  // Además, actualiza las fechas de envío o entrega según el nuevo estado.
  async actualizarEstado(id_envio, nuevoEstado) {
    let camposExtra = "";

    // Si el estado cambia a 'en_camino' → registrar fecha_envio actual
    if (nuevoEstado === "en_camino") camposExtra = ", fecha_envio = NOW()";
    // Si cambia a 'entregado' → registrar fecha_entrega actual
    if (nuevoEstado === "entregado") camposExtra = ", fecha_entrega = NOW()";

    const query = `
      UPDATE envios
      SET estado_envio = ? ${camposExtra}, updated_at = NOW()
      WHERE id_envio = ?;
    `;

    const [result] = await pool.query(query, [nuevoEstado, id_envio]);

    return result.affectedRows > 0;
  },

  // Elimina un registro de envío específico según su ID.
  // Solo se usa en casos administrativos (no en flujos normales).
  async eliminar(id_envio) {
    const query = "DELETE FROM envios WHERE id_envio = ?";
    const [result] = await pool.query(query, [id_envio]);
    return result.affectedRows > 0;
  },
};

// Exportamos el modelo para usarlo en los servicios
module.exports = EnvioModel;

// ======================================================================
// Modelo de Cliente
// Responsable de interactuar directamente con la base de datos MySQL.
// Contiene las operaciones CRUD sobre la tabla "clientes".
// ======================================================================

// Conexión al pool MySQL
const pool = require("../config/database");

// ----------------------------------------------------------------------
// Obtener todos los clientes
// ----------------------------------------------------------------------
async function getAll() {
  const [rows] = await pool.query(`
    SELECT c.*, u.email, u.nombre_usuario, u.estado
    FROM clientes c
    INNER JOIN usuarios u ON c.id_usuario = u.id_usuario
    ORDER BY c.id_cliente DESC
  `);
  return rows;
}

// ----------------------------------------------------------------------
// Obtener un cliente específico por su ID
// ----------------------------------------------------------------------
async function getById(id) {
  const [rows] = await pool.query(
    `
    SELECT c.*, u.email, u.nombre_usuario, u.estado
    FROM clientes c
    INNER JOIN usuarios u ON c.id_usuario = u.id_usuario
    WHERE c.id_cliente = ?
    `,
    [id]
  );
  return rows[0];
}

// ----------------------------------------------------------------------
// Obtener un cliente por ID de usuario
// ----------------------------------------------------------------------
async function getByUserId(userId) {
  const [rows] = await pool.query(
    `
    SELECT c.*, u.email, u.nombre_usuario, u.estado
    FROM clientes c
    INNER JOIN usuarios u ON c.id_usuario = u.id_usuario
    WHERE c.id_usuario = ?
    `,
    [userId]
  );
  return rows[0];
}

// ----------------------------------------------------------------------
// Crear un nuevo perfil de cliente
// ----------------------------------------------------------------------
async function create(clienteData) {
  const { 
    id_usuario, 
    dni, 
    nombre, 
    apellido, 
    telefono, 
    direccion, 
    ciudad, 
    provincia, 
    pais, 
    codigo_postal, 
    fecha_nacimiento 
  } = clienteData;
  
  const [result] = await pool.query(
    `
    INSERT INTO clientes (
      id_usuario, 
      dni, 
      nombre, 
      apellido, 
      telefono, 
      direccion, 
      ciudad, 
      provincia, 
      pais, 
      codigo_postal, 
      fecha_nacimiento
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      id_usuario, 
      dni, 
      nombre, 
      apellido, 
      telefono, 
      direccion, 
      ciudad, 
      provincia, 
      pais || 'Argentina', 
      codigo_postal, 
      fecha_nacimiento
    ]
  );
  
  return { id_cliente: result.insertId };
}

// ----------------------------------------------------------------------
// Actualizar un perfil de cliente existente
// ----------------------------------------------------------------------
async function update(id, clienteData) {
  const { 
    dni, 
    nombre, 
    apellido, 
    telefono, 
    direccion, 
    ciudad, 
    provincia, 
    pais, 
    codigo_postal, 
    fecha_nacimiento 
  } = clienteData;
  
  const [result] = await pool.query(
    `
    UPDATE clientes
    SET 
      dni = COALESCE(?, dni), 
      nombre = COALESCE(?, nombre), 
      apellido = COALESCE(?, apellido), 
      telefono = COALESCE(?, telefono), 
      direccion = COALESCE(?, direccion), 
      ciudad = COALESCE(?, ciudad), 
      provincia = COALESCE(?, provincia), 
      pais = COALESCE(?, pais), 
      codigo_postal = COALESCE(?, codigo_postal), 
      fecha_nacimiento = COALESCE(?, fecha_nacimiento)
    WHERE id_cliente = ?
    `,
    [
      dni ?? null, 
      nombre ?? null, 
      apellido ?? null, 
      telefono ?? null, 
      direccion ?? null, 
      ciudad ?? null, 
      provincia ?? null, 
      pais ?? null, 
      codigo_postal ?? null, 
      fecha_nacimiento ?? null,
      id
    ]
  );
  
  return result.affectedRows > 0;
}

// ----------------------------------------------------------------------
// Eliminar un perfil de cliente
// ----------------------------------------------------------------------
async function remove(id) {
  const [result] = await pool.query(
    `
    DELETE FROM clientes
    WHERE id_cliente = ?
    `,
    [id]
  );
  
  return result.affectedRows > 0;
}

module.exports = {
  getAll,
  getById,
  getByUserId,
  create,
  update,
  remove
};
// ======================================================================
// Modelo de Administrador
// Responsable de interactuar directamente con la base de datos MySQL.
// Contiene las operaciones CRUD sobre la tabla "administradores".
// ======================================================================

// Conexión al pool MySQL
const pool = require("../config/database");

async function ensureAdminExtendedSchema() {
  try {
    const [c1] = await pool.query("SHOW COLUMNS FROM administradores LIKE 'direccion'");
    if (c1.length === 0) {
      await pool.query("ALTER TABLE administradores ADD COLUMN direccion VARCHAR(255) NULL");
    }
    const [c2] = await pool.query("SHOW COLUMNS FROM administradores LIKE 'ciudad'");
    if (c2.length === 0) {
      await pool.query("ALTER TABLE administradores ADD COLUMN ciudad VARCHAR(100) NULL");
    }
    const [c3] = await pool.query("SHOW COLUMNS FROM administradores LIKE 'provincia'");
    if (c3.length === 0) {
      await pool.query("ALTER TABLE administradores ADD COLUMN provincia VARCHAR(100) NULL");
    }
    const [c4] = await pool.query("SHOW COLUMNS FROM administradores LIKE 'pais'");
    if (c4.length === 0) {
      await pool.query("ALTER TABLE administradores ADD COLUMN pais VARCHAR(100) NULL");
    }
    const [c5] = await pool.query("SHOW COLUMNS FROM administradores LIKE 'codigo_postal'");
    if (c5.length === 0) {
      await pool.query("ALTER TABLE administradores ADD COLUMN codigo_postal VARCHAR(20) NULL");
    }
    const [c6] = await pool.query("SHOW COLUMNS FROM administradores LIKE 'fecha_nacimiento'");
    if (c6.length === 0) {
      await pool.query("ALTER TABLE administradores ADD COLUMN fecha_nacimiento DATE NULL");
    }
  } catch (e) {
    console.error("Error asegurando esquema administradores:", e.message);
  }
}

ensureAdminExtendedSchema();

// ----------------------------------------------------------------------
// Obtener todos los administradores
// ----------------------------------------------------------------------
async function getAll() {
  const [rows] = await pool.query(`
    SELECT a.*, u.email, u.nombre_usuario, u.estado
    FROM administradores a
    INNER JOIN usuarios u ON a.id_usuario = u.id_usuario
    ORDER BY a.id_admin DESC
  `);
  return rows;
}

// ----------------------------------------------------------------------
// Obtener un administrador específico por su ID
// ----------------------------------------------------------------------
async function getById(id) {
  const [rows] = await pool.query(
    `
    SELECT a.*, u.email, u.nombre_usuario, u.estado
    FROM administradores a
    INNER JOIN usuarios u ON a.id_usuario = u.id_usuario
    WHERE a.id_admin = ?
    `,
    [id]
  );
  return rows[0];
}

// ----------------------------------------------------------------------
// Obtener un administrador por ID de usuario
// ----------------------------------------------------------------------
async function getByUserId(userId) {
  const [rows] = await pool.query(
    `
    SELECT a.*, u.email, u.nombre_usuario, u.estado
    FROM administradores a
    INNER JOIN usuarios u ON a.id_usuario = u.id_usuario
    WHERE a.id_usuario = ?
    `,
    [userId]
  );
  return rows[0];
}

// ----------------------------------------------------------------------
// Crear un nuevo perfil de administrador
// ----------------------------------------------------------------------
async function create(adminData) {
  const { 
    id_usuario, 
    dni, 
    nombre, 
    apellido, 
    telefono, 
    cargo,
    direccion,
    ciudad,
    provincia,
    pais,
    codigo_postal,
    fecha_nacimiento
  } = adminData;
  
  const [result] = await pool.query(
    `
    INSERT INTO administradores (
      id_usuario, 
      dni, 
      nombre, 
      apellido, 
      telefono, 
      cargo,
      direccion,
      ciudad,
      provincia,
      pais,
      codigo_postal,
      fecha_nacimiento
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      id_usuario, 
      dni, 
      nombre, 
      apellido, 
      telefono, 
      cargo,
      direccion ?? null,
      ciudad ?? null,
      provincia ?? null,
      pais ?? null,
      codigo_postal ?? null,
      fecha_nacimiento ?? null
    ]
  );
  
  return { id_admin: result.insertId };
}

// ----------------------------------------------------------------------
// Actualizar un perfil de administrador existente
// ----------------------------------------------------------------------
async function update(id, adminData) {
  const { 
    dni, 
    nombre, 
    apellido, 
    telefono, 
    cargo,
    direccion,
    ciudad,
    provincia,
    pais,
    codigo_postal,
    fecha_nacimiento
  } = adminData;
  
  const [result] = await pool.query(
    `
    UPDATE administradores
    SET 
      dni = COALESCE(?, dni), 
      nombre = COALESCE(?, nombre), 
      apellido = COALESCE(?, apellido), 
      telefono = COALESCE(?, telefono), 
      cargo = COALESCE(?, cargo),
      direccion = COALESCE(?, direccion),
      ciudad = COALESCE(?, ciudad),
      provincia = COALESCE(?, provincia),
      pais = COALESCE(?, pais),
      codigo_postal = COALESCE(?, codigo_postal),
      fecha_nacimiento = COALESCE(?, fecha_nacimiento)
    WHERE id_admin = ?
    `,
    [
      dni ?? null, 
      nombre ?? null, 
      apellido ?? null, 
      telefono ?? null, 
      cargo ?? null,
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
// Eliminar un perfil de administrador
// ----------------------------------------------------------------------
async function remove(id) {
  const [result] = await pool.query(
    `
    DELETE FROM administradores
    WHERE id_admin = ?
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
// ======================================================================
// Responsable de interactuar directamente con la base de datos MySQL.
// Contiene las operaciones CRUD sobre la tabla "productos".
// ======================================================================

// Conexión al pool MySQL
const pool = require("../config/database");

// ----------------------------------------------------------------------
// Obtener todos los productos activos del catálogo
// ----------------------------------------------------------------------
async function getAll(estado = 'activo') {
  const baseQuery = `
    SELECT p.*, c.nombre_categoria 
    FROM productos p
    INNER JOIN categorias c ON p.id_categoria = c.id_categoria
  `;
  const whereClause = estado === 'todos' ? '' : 'WHERE p.estado = ?';
  const orderClause = 'ORDER BY p.id_producto DESC';
  const query = `${baseQuery} ${whereClause} ${orderClause}`;
  const params = estado === 'todos' ? [] : [estado];
  const [rows] = await pool.query(query, params);
  return rows;
}

// ----------------------------------------------------------------------
// Obtener un producto específico por su ID
// ----------------------------------------------------------------------
async function getById(id) {
  // Consulta SQL para obtener un producto por su ID con su categoría
  const [rows] = await pool.query(
    `
    SELECT p.*, c.nombre_categoria 
    FROM productos p
    INNER JOIN categorias c ON p.id_categoria = c.id_categoria
    WHERE p.id_producto = ?
    `,
    [id]
  );
  return rows[0]; // Devuelve un solo producto
}

// ----------------------------------------------------------------------
// Crear un nuevo producto para el catálogo de la tienda
// ----------------------------------------------------------------------
async function create(data) {
  // Desestructuramos los datos del producto
  const {
    nombre,
    descripcion,
    precio_base,
    stock,
    iva_porcentaje,
    stock_minimo,
    id_categoria,
    estado, // Por defecto, 'estado' será 'activo'
  } = data; // Datos del nuevo producto

  // Consulta SQL para insertar un nuevo producto
  const [result] = await pool.query(
    // Usamos placeholders (?) para evitar inyecciones SQL y pasar los valores como un array
    `
    INSERT INTO productos 
    (nombre, descripcion, precio_base, stock, iva_porcentaje, stock_minimo, id_categoria, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      nombre,
      descripcion,
      precio_base,
      stock,
      iva_porcentaje,
      stock_minimo,
      id_categoria,
      estado,
    ]
  );
  return result.insertId; // Devuelve el ID del nuevo producto
}

// ----------------------------------------------------------------------
// Actualizar un producto existente
// ----------------------------------------------------------------------
async function update(id, data) {
  // Desestructuramos los datos del producto a actualizar
  const {
    nombre,
    descripcion,
    precio_base,
    stock,
    iva_porcentaje,
    stock_minimo,
    id_categoria,
    estado,
  } = data;

  // Consulta SQL para actualizar un producto por su ID
  const [result] = await pool.query(
    // Se aplican placeholders (?) para evitar inyecciones SQL y se pasan los valores como un array
    `
    UPDATE productos
    SET nombre = ?, descripcion = ?, precio_base = ?, stock = ?, iva_porcentaje = ?, 
        stock_minimo = ?, id_categoria = ?, estado = ?
    WHERE id_producto = ?
    `,
    // valores en el mismo orden que los placeholders en array
    [
      nombre,
      descripcion,
      precio_base,
      stock,
      iva_porcentaje,
      stock_minimo,
      id_categoria,
      estado,
      id,
    ]
  );
  return result.affectedRows > 0; // true si se modificó al menos una fila
}

// ----------------------------------------------------------------------
// Eliminar un producto (cambio de estado lógico)
// ----------------------------------------------------------------------

// Usuamos Async/Await para manejar operaciones asíncronas
async function remove(id) {
  const [result] = await pool.query(
    // Consulta SQL para eliminar un producto (cambio de estado lógico)
    `
    UPDATE productos 
    SET estado = 'inactivo'
    WHERE id_producto = ?
    `,
    [id]
  );
  // Devuelve true si se modificó al menos una fila o se eliminó el producto
  return result.affectedRows > 0;
}

module.exports = { getAll, getById, create, update, remove };

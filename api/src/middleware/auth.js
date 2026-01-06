const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'feraytek-secret-key';
const userModel = require("../models/user.model");

// Middleware para verificar token JWT
function verifyToken(req, res, next) {
  console.log('=== MIDDLEWARE AUTH ===');
  console.log('Headers recibidos:', req.headers);
  
  const authHeader = req.headers.authorization;
  console.log('Auth header:', authHeader);
  
  if (!authHeader) {
    console.log('No se encontró header de autorización');
    return res.status(401).json({
      ok: false,
      message: 'Token de acceso requerido'
    });
  }

  const token = authHeader.split(' ')[1]; // Bearer TOKEN
  console.log('Token extraído:', token);
  
  if (!token) {
    console.log('Token no encontrado después de split');
    return res.status(401).json({
      ok: false,
      message: 'Token de acceso requerido'
    });
  }

  try {
    console.log('Verificando token con JWT_SECRET...');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token decodificado exitosamente:', decoded);
    req.user = decoded;
    console.log('Usuario asignado a req.user:', req.user);
    console.log('=== FIN MIDDLEWARE AUTH - PASANDO AL SIGUIENTE ===');
    next();
  } catch (error) {
    console.error('Error al verificar token:', error);
    return res.status(401).json({
      ok: false,
      message: 'Token inválido o expirado'
    });
  }
}

// Verificar si es superadministrador
function isSuperAdmin(req, res, next) {
  if (req.user.rol !== "superadmin") {
    return res.status(403).json({
      success: false,
      message: "Acceso denegado. Se requiere rol de superadministrador",
    });
  }
  next();
}

// Verificar si es administrador (incluye superadmin)
function isAdmin(req, res, next) {
  if (req.user.rol !== "admin" && req.user.rol !== "superadmin") {
    return res.status(403).json({
      success: false,
      message: "Acceso denegado. Se requiere rol de administrador",
    });
  }
  next();
}

// Verificar si es el propietario del recurso o un administrador
async function isOwnerOrAdmin(req, res, next) {
  const userId = parseInt(req.params.id);

  // Si es administrador o superadmin, permitir acceso
  if (req.user.rol === "admin" || req.user.rol === "superadmin") {
    return next();
  }

  // Si es el propietario del recurso, permitir acceso
  if (req.user.id === userId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Acceso denegado. No tienes permisos para este recurso",
  });
}

module.exports = {
  verifyToken,
  isSuperAdmin,
  isAdmin,
  isOwnerOrAdmin,
};

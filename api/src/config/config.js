// ======================================================================
// Configuración global de la aplicación
// ======================================================================

require('dotenv').config();

module.exports = {
  // Configuración del servidor
  PORT: process.env.PORT || 3000,
  
  // Configuración de JWT
  JWT_SECRET: process.env.JWT_SECRET || 'feraytek-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  
  // Configuración de la base de datos
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  
  // Otras configuraciones
  NODE_ENV: process.env.NODE_ENV || 'development'
};
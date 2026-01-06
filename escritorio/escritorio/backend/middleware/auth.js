// =====================================================================
// Middleware de Autenticación
// Verifica presencia de token y rol (proxy: validación real en API remota)
// =====================================================================

module.exports = {
  // ----------------------------------------------------------------------
  // verifyToken(req,res,next)
  // Comprueba `Authorization` y continua; 401 si falta
  // ----------------------------------------------------------------------
  verifyToken(req, res, next) {
    const auth = req.headers.authorization
    if (!auth) return res.status(401).json({ ok:false, message: 'Token requerido' })
    next()
  },
  // ----------------------------------------------------------------------
  // isAdmin(req,res,next)
  // Proxy: asegura token presente; la API remota valida rol realmente
  // ----------------------------------------------------------------------
  isAdmin(req, res, next) {
    const auth = req.headers.authorization
    if (!auth) return res.status(401).json({ ok:false, message: 'Token requerido' })
    next()
  }
}

// ----------------------------------------------------------------------
// Explicación
// Middleware mínimo: asegura presencia de token antes de proxyear.
// El rol se verifica en el backend oficial; ≤150 líneas y claro.
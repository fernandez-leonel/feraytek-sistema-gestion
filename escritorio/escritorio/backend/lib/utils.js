// Utilidades genéricas

function extractArray(obj) {
  if (!obj || typeof obj !== 'object') return []
  if (Array.isArray(obj)) return obj
  const keys = ['data','result','results','items','rows','pedidos','orders','list','content']
  for (const k of keys) {
    const v = obj[k]
    if (Array.isArray(v)) return v
    if (v && typeof v === 'object') {
      for (const kk of keys) {
        const vv = v[kk]
        if (Array.isArray(vv)) return vv
      }
    }
  }
  return []
}

module.exports = { extractArray }
// Descripción:
// Servicio que contiene la lógica empresarial de envíos.
// Valida entradas, prepara datos y delega en el modelo SQL.
// ----------------------------------------------------------------------

const { apiClient } = require("../lib/apiClient")
const { extractArray } = require("../lib/utils")

const estadosValidos = ["preparando","en_camino","entregado","devuelto"]

module.exports = {
  async listarEnvios(auth) {
    const hdr = auth ? { Authorization: auth } : {}
    try {
      const r = await apiClient.get("/envios", { headers: hdr })
      const arr = Array.isArray(r.data?.data) ? r.data.data : (Array.isArray(r.data) ? r.data : [])
      return { ok: true, data: arr }
    } catch (e) {
      return { ok: false, message: e?.message || "Servicio de envíos no disponible" }
    }
  },
  async obtenerEnvio(auth, id) {
    const nid = Number(id)
    if (!Number.isFinite(nid) || nid <= 0) return { ok: false, message: "ID inválido" }
    const hdr = auth ? { Authorization: auth } : {}
    try {
      const r = await apiClient.get(`/envios/${nid}`, { headers: hdr })
      const obj = r.data?.data ?? r.data
      return obj ? { ok: true, data: obj } : { ok: false, message: "Envío no encontrado" }
    } catch (e) {
      return { ok: false, message: e?.message || "Envío no encontrado" }
    }
  },
  async crearEnvio(auth, datos) {
    const pid = Number(datos?.id_pedido)
    if (!Number.isFinite(pid) || pid <= 0) return { ok: false, message: "id_pedido inválido" }
    const payload = {
      id_pedido: pid,
      destinatario: String(datos?.destinatario || "").trim() || null,
      direccion_envio: String(datos?.direccion_envio || "").trim(),
      ciudad: String(datos?.ciudad || "").trim(),
      provincia: String(datos?.provincia || "").trim(),
      pais: String(datos?.pais || "Argentina").trim(),
      codigo_postal: String(datos?.codigo_postal || "").trim(),
      empresa_envio: String(datos?.empresa_envio || "").trim() || null,
      numero_seguimiento: String(datos?.numero_seguimiento || "").trim() || null,
      estado_envio: String(datos?.estado_envio || "preparando").trim(),
    }
    if (!payload.direccion_envio || !payload.ciudad || !payload.provincia || !payload.codigo_postal) {
      return { ok: false, message: "Datos de dirección incompletos" }
    }
    const hdr = auth ? { Authorization: auth } : {}
    try {
      const r = await apiClient.post("/envios", payload, { headers: hdr })
      return { ok: true, message: "Envío creado", data: r.data?.data ?? r.data }
    } catch (e) {
      return { ok: false, message: e?.message || "No se pudo crear el envío" }
    }
  },
  async actualizarDatosEnvio(auth, id_envio, datos) {
    const nid = Number(id_envio)
    if (!Number.isFinite(nid) || nid <= 0) return { ok: false, message: "ID inválido" }
    const payload = {
      destinatario: String(datos?.destinatario || "").trim() || null,
      direccion_envio: String(datos?.direccion_envio || "").trim(),
      ciudad: String(datos?.ciudad || "").trim(),
      provincia: String(datos?.provincia || "").trim(),
      pais: String(datos?.pais || "Argentina").trim(),
      codigo_postal: String(datos?.codigo_postal || "").trim(),
      empresa_envio: String(datos?.empresa_envio || "").trim() || null,
      numero_seguimiento: String(datos?.numero_seguimiento || "").trim() || null,
    }
    const hdr = auth ? { Authorization: auth } : {}
    try {
      const r = await apiClient.put(`/envios/${nid}`, payload, { headers: hdr })
      return { ok: true, message: "Datos actualizados", data: r.data?.data ?? r.data }
    } catch (e) {
      return { ok: false, message: e?.message || "Envío no encontrado o sin cambios" }
    }
  },
  async cambiarEstadoEnvio(auth, id_envio, estado_envio) {
    const nid = Number(id_envio)
    const estado = String(estado_envio || "").trim()
    if (!Number.isFinite(nid) || nid <= 0) return { ok: false, message: "ID inválido" }
    if (!estadosValidos.includes(estado)) return { ok: false, message: "Estado inválido" }
    const hdr = auth ? { Authorization: auth } : {}
    try {
      const r = await apiClient.put(`/envios/${nid}/estado`, { estado_envio: estado }, { headers: hdr })
      return { ok: true, message: "Estado actualizado", data: r.data?.data ?? r.data }
    } catch (e) {
      return { ok: false, message: e?.message || "No se pudo actualizar" }
    }
  },
  async eliminarEnvio(auth, id_envio) {
    const nid = Number(id_envio)
    if (!Number.isFinite(nid) || nid <= 0) return { ok: false, message: "ID inválido" }
    const hdr = auth ? { Authorization: auth } : {}
    try {
      const r = await apiClient.delete(`/envios/${nid}`, { headers: hdr })
      return { ok: true, message: "Envío eliminado", data: r.data?.data ?? r.data }
    } catch (e) {
      return { ok: false, message: e?.message || "Envío no encontrado" }
    }
  },
  async crearEnviosParaPedidosExistentes(auth) {
    const hdr = auth ? { Authorization: auth } : {}
    try {
      const pr = await apiClient.get("/pedidos", { headers: hdr })
      const er = await apiClient.get("/envios", { headers: hdr })
      const pedidos = extractArray(pr?.data)
      const envios = extractArray(er?.data)
      const conEnvio = new Set(envios.map(e => String(e.id_pedido ?? e.pedido_id)))
      let count = 0
      for (const p of pedidos) {
        const pid = p.id_pedido ?? p.id ?? p.pedido_id
        if (!pid || conEnvio.has(String(pid))) continue
        const payload = {
          id_pedido: Number(pid),
          destinatario: (p.cliente && p.cliente.nombre) ? p.cliente.nombre : (p.cliente_nombre || null),
          direccion_envio: p.direccion ?? p.direccion_envio ?? p.address ?? "",
          ciudad: p.ciudad ?? "",
          provincia: p.provincia ?? "",
          pais: "Argentina",
          codigo_postal: p.codigo_postal ?? p.postal_code ?? "",
          empresa_envio: null,
          numero_seguimiento: null,
          estado_envio: "preparando",
        }
        if (!payload.direccion_envio || !payload.ciudad || !payload.provincia || !payload.codigo_postal) continue
        await apiClient.post("/envios", payload, { headers: hdr }).catch(() => null)
        count++
      }
      return count > 0 ? { ok: true, message: "Envios generados", data: { generados: count } } : { ok: false, message: "Sin envíos generados" }
    } catch (e) {
      return { ok: false, message: e?.message || "No se pudo generar envíos" }
    }
  },
}

// ----------------------------------------------------------------------
// Nota: Este servicio aplica reglas de negocio y valida entradas.
// Se mantiene ≤150 líneas con retornos uniformes { ok, message, data }.
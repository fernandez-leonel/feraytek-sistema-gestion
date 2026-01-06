// Descripción:
// Servicio de INFORME: consolida, valida y estructura métricas
// en cinco submódulos para gráficos (líneas, barras, tortas, KPIs).
// ----------------------------------------------------------------------

const InformeModel = require("../models/informe.model");

function countBy(arr, key) {
  const m = {};
  for (const x of arr) {
    const k = String(x[key] ?? "").toLowerCase();
    m[k] = (m[k] || 0) + 1;
  }
  return m;
}
function sumBy(arr, key) {
  return arr.reduce((a, b) => a + Number(b[key] ?? 0), 0);
}
function groupByDate(arr, dateKey) {
  const m = {};
  for (const x of arr) {
    const d = new Date(x[dateKey] ?? 0);
    const k = d.toISOString().slice(0, 10);
    m[k] = (m[k] || 0) + Number(x.total_final ?? x.monto_total ?? x.total ?? 0);
  }
  return Object.entries(m)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, value]) => ({ date, value }));
}

module.exports = {
  async ventasGanancias(auth, params) {
    const headers = auth ? { Authorization: auth } : {};
    const { pedidos, facturasStats } = await InformeModel.ventasDatos(
      headers,
      params
    );
    const fi = params?.fecha_inicio ? new Date(params.fecha_inicio).getTime() : null;
    const ff = params?.fecha_fin ? new Date(params.fecha_fin).getTime() : null;
    const within = (d) => {
      const t = new Date(d ?? 0).getTime();
      if (fi && t < fi) return false;
      if (ff && t > ff) return false;
      return true;
    };
    const pedidosFiltrados = Array.isArray(pedidos)
      ? pedidos.filter((p) => within(p.created_at ?? p.fecha_creacion ?? p.fecha ?? p.fecha_pedido))
      : [];
    const ingresosDia = groupByDate(pedidosFiltrados, "created_at");
    const totalVentas = pedidosFiltrados.length;
    const montoTotal = sumBy(pedidosFiltrados, "total_final");
    const porMetodo = countBy(pedidos, "metodo_pago");
    return {
      ok: true,
      data: { ingresosDia, totalVentas, montoTotal, porMetodo, facturasStats },
    };
  },
  async enviosLogistica(auth, params) {
    const headers = auth ? { Authorization: auth } : {};
    const { envios } = await InformeModel.enviosDatos(headers);
    const fi = params?.fecha_inicio ? new Date(params.fecha_inicio).getTime() : null;
    const ff = params?.fecha_fin ? new Date(params.fecha_fin).getTime() : null;
    const within = (d) => {
      const t = new Date(d ?? 0).getTime();
      if (fi && t < fi) return false;
      if (ff && t > ff) return false;
      return true;
    };
    const enviosFiltrados = Array.isArray(envios)
      ? envios.filter((e) => within(e.fecha_envio ?? e.created_at ?? e.fecha))
      : [];
    const estados = countBy(enviosFiltrados, "estado_envio");
    let entregas = enviosFiltrados.filter((e) => e.fecha_envio && e.fecha_entrega);
    const tiempos = entregas
      .map(
        (e) => (new Date(e.fecha_entrega) - new Date(e.fecha_envio)) / 86400000
      )
      .filter((n) => Number.isFinite(n) && n >= 0);
    const promedioDias = tiempos.length
      ? Number((tiempos.reduce((a, b) => a + b, 0) / tiempos.length).toFixed(2))
      : 0;
    return {
      ok: true,
      data: {
        estados,
        promedioDias,
        en_curso: estados["en_camino"] || 0,
        entregados: estados["entregado"] || 0,
        demorados: estados["demorado"] || 0,
      },
    };
  },
  async usuariosActividad(auth, params) {
    const headers = auth ? { Authorization: auth } : {};
    const { usuarios, carritosStats, abandonados } =
      await InformeModel.usuariosDatos(headers);
    const fi = params?.fecha_inicio ? new Date(params.fecha_inicio).getTime() : null;
    const ff = params?.fecha_fin ? new Date(params.fecha_fin).getTime() : null;
    const within = (d) => {
      const t = new Date(d ?? 0).getTime();
      if (fi && t < fi) return false;
      if (ff && t > ff) return false;
      return true;
    };
    const roles = countBy(usuarios, "rol");
    const activos = usuarios.filter(
      (u) => String(u.estado || "").toLowerCase() === "activo"
    ).length;
    const inactivos = usuarios.filter(
      (u) => String(u.estado || "").toLowerCase() === "inactivo"
    ).length;
    const nuevosMes = usuarios.filter(
      (u) =>
        new Date(u.created_at ?? Date.now()).getMonth() ===
        new Date().getMonth()
    ).length;
    const nuevosRango = usuarios.filter((u) => within(u.created_at ?? u.fecha_creacion ?? u.fecha_registro)).length;
    return {
      ok: true,
      data: {
        roles,
        activos,
        inactivos,
        nuevosMes,
        nuevosRango,
        carritosStats,
        carritosAbandonados: abandonados.length,
      },
    };
  },
  async productosStock(auth, params) {
    const headers = auth ? { Authorization: auth } : {};
    const { productos } = await InformeModel.productosDatos(headers);
    const fi = params?.fecha_inicio ? new Date(params.fecha_inicio).getTime() : null;
    const ff = params?.fecha_fin ? new Date(params.fecha_fin).getTime() : null;
    const within = (d) => {
      const t = new Date(d ?? 0).getTime();
      if (fi && t < fi) return false;
      if (ff && t > ff) return false;
      return true;
    };
    const nuevosRango = productos.filter((p) => within(p.created_at ?? p.fecha_creacion ?? p.fecha_alta)).length;
    const bajos = productos
      .filter((p) => Number(p.stock ?? 0) <= Number(p.stock_minimo ?? 5))
      .map((p) => ({
        id: p.id ?? p.id_producto,
        nombre: p.nombre,
        stock: p.stock,
      }));
    // Rotación simple: ventas/stock (si disponible)
    const rotacion = productos.map((p) => ({
      id: p.id ?? p.id_producto,
      nombre: p.nombre,
      rotacion: Number(p.ventas ?? 0) / Math.max(1, Number(p.stock ?? 1)),
    }));
    rotacion.sort((a, b) => b.rotacion - a.rotacion);
    const top10 = rotacion.slice(0, 10);
    return { ok: true, data: { top10, bajos, rotacion, nuevosRango } };
  },
  async reseñasSoporte(auth, params) {
    const headers = auth ? { Authorization: auth } : {};
    const { reseñas, soporteStats } = await InformeModel.reseñasSoporteDatos(
      headers
    );
    const fi = params?.fecha_inicio ? new Date(params.fecha_inicio).getTime() : null;
    const ff = params?.fecha_fin ? new Date(params.fecha_fin).getTime() : null;
    const within = (d) => {
      const t = new Date(d ?? 0).getTime();
      if (fi && t < fi) return false;
      if (ff && t > ff) return false;
      return true;
    };
    const reseñasFiltradas = Array.isArray(reseñas)
      ? reseñas.filter((r) => within(r.created_at ?? r.fecha ?? r.fecha_resena))
      : [];
    const global = reseñasFiltradas.length
      ? Number(
          (
            reseñasFiltradas.reduce((a, b) => a + Number(b.calificacion ?? 0), 0) /
            reseñasFiltradas.length
          ).toFixed(2)
        )
      : 0;
    const porProducto = {};
    for (const r of reseñasFiltradas) {
      const pid = r.id_producto ?? r.producto_id;
      const c = Number(r.calificacion ?? 0);
      if (!pid) continue;
      porProducto[pid] = porProducto[pid] || { count: 0, sum: 0 };
      porProducto[pid].count++;
      porProducto[pid].sum += c;
    }
    const califPorProducto = Object.entries(porProducto).map(([id, v]) => ({
      id_producto: Number(id),
      promedio: Number((v.sum / v.count).toFixed(2)),
      cantidad: v.count,
    }));
    const pos = reseñasFiltradas.filter((r) => Number(r.calificacion ?? 0) >= 4).length;
    const neg = reseñasFiltradas.filter((r) => Number(r.calificacion ?? 0) <= 2).length;
    const porMes = {};
    for (const r of reseñasFiltradas) {
      const k = new Date(r.created_at ?? Date.now()).toISOString().slice(0, 7);
      porMes[k] = (porMes[k] || 0) + 1;
    }
    const reseñasPorMes = Object.entries(porMes)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count }));
    return {
      ok: true,
      data: {
        global,
        califPorProducto,
        positivas: pos,
        negativas: neg,
        reseñasPorMes,
        soporte: soporteStats,
      },
    };
  },
};

// ----------------------------------------------------------------------
// Nota: Este servicio consolida y normaliza métricas listas para UI.
// Se mantiene ≤150 líneas con validaciones mínimas y estructuras claras.

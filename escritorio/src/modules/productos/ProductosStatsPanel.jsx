import React from 'react'

// Panel de métricas del módulo Productos
export default function ProductosStatsPanel({ stats, categorias }) {
  const mapNombre = (id) => {
    const c = (categorias||[]).find(x => String(x.id ?? x.id_categoria) === String(id))
    return c?.nombre_categoria ?? c?.nombre ?? `#${id}`
  }
  return (
    <div className="stats-grid">
      <div className="stat-card"><h3>Activos</h3><div className="stat-number">{stats.activos}</div></div>
      <div className="stat-card"><h3>Inactivos</h3><div className="stat-number">{stats.inactivos}</div></div>
      <div className="stat-card"><h3>Stock crítico</h3><div className="stat-number">{stats.criticos}</div></div>
      <div className="stat-card"><h3>Categorías principales</h3><div>{(stats.categoriasTop||[]).map(c => (<span key={c.id} className="badge badge-neutral" style={{marginRight:6}}>{mapNombre(c.id)} · {c.count}</span>))}</div></div>
    </div>
  )
}
(function(){
  function getBase(){
    const cfg = (typeof window!=="undefined" && window.Feraytek && window.Feraytek.API) || {};
    const b = cfg.base || "/api";
    if(/^https?:\/\//.test(b)) return b;
    return b; // se resolverá en absBase
  }
  function absBase(){
    const b = getBase();
    if(/^https?:\/\//.test(b)) return b;
    try{
      const host = (window.location && window.location.hostname) || "";
      if(host==="localhost" || host==="127.0.0.1") return "http://localhost:3000/api"; // local como antes
      if(/ngrok/i.test(host)) { const origin = window.location.origin || ""; return origin + (b.startsWith("/")? b : ("/"+b)); }
      const origin = window.location.origin || ""; return origin + (b.startsWith("/")? b : ("/"+b));
    }catch{ return b; }
  }
  async function parse(r){
    const ct = (r.headers.get("content-type")||"").toLowerCase();
    if(ct.includes("application/json")){
      try { return await r.json(); } catch { return { message: "JSON inválido" }; }
    }
    const t = await r.text();
    try { return JSON.parse(t); } catch { return { message: t||"Respuesta no válida" }; }
  }
  function authInit(method){
    const headers = {};
    const tok = sessionStorage.getItem("token") || localStorage.getItem("token") || ""; if(tok) headers["Authorization"] = "Bearer "+tok;
    const init = { method, headers, credentials:"omit" };
    return init;
  }
  function authJsonInit(method,payload){
    const headers = { "Content-Type":"application/json" };
    const tok = sessionStorage.getItem("token") || localStorage.getItem("token") || ""; if(tok) headers["Authorization"] = "Bearer "+tok;
    const init = { method, headers, credentials:"omit", body: JSON.stringify(payload) };
    return init;
  }
  let cachedRole = null;
  async function getRole(){
    try{ const u0 = (window.Feraytek && window.Feraytek.usuario) || null; const r0 = u0 && (u0.rol||u0.role); if(r0){ cachedRole = r0; return r0; } }catch{}
    if(cachedRole) return cachedRole;
    const base = getBase(); const abs = absBase();
    const urls1 = [ `${base}/auth/me`, `${abs}/auth/me` ];
    const urls2 = [ `${base}/users/profile`, `${abs}/users/profile` ];
    try{ const r = await tryFetch(urls1, authInit("GET")); const u = r && (r.data||r.user||r.usuario||r) || r; const role=(u&&u.rol)||null; cachedRole=role; return role; }catch{}
    try{ const r = await tryFetch(urls2, authInit("GET")); const u = r && (r.data||r.user||r.usuario||r) || r; const role=(u&&u.rol)||null; cachedRole=role; return role; }catch{ return null; }
  }
  async function tryFetch(urls, init){
    let lastErr = null;
    for(const u of urls){
      const r = await fetch(u, init);
      const j = await parse(r);
      if(r.ok) return j;
      lastErr = { status:r.status, ...j };
      
    }
    throw lastErr || { status:404, message:"Endpoint no disponible" };
  }
  async function history({ page=1, limit=20, status, envio_status, sort }={}){
    const params = [];
    if(page) params.push(`page=${encodeURIComponent(page)}`);
    if(limit) params.push(`limit=${encodeURIComponent(limit)}`);
    if(status){ params.push(`status=${encodeURIComponent(status)}`); params.push(`estado=${encodeURIComponent(status)}`); }
    if(envio_status){ params.push(`envio_status=${encodeURIComponent(envio_status)}`); params.push(`estado_envio=${encodeURIComponent(envio_status)}`); }
    if(sort) params.push(`sort=${encodeURIComponent(sort)}`);
    const qs = params.length?`?${params.join("&")}`:"";
    const base = getBase();
    const abs = absBase();
    const role = await getRole();
    const urls = role&&(/admin|superadmin/.test(String(role)))
      ? [ `${base}/historial-pedidos${qs}`, `${base}/historial_pedidos${qs}`, `${abs}/historial-pedidos${qs}`, `${abs}/historial_pedidos${qs}` ]
      : [ `${base}/pedidos${qs}`, `${abs}/pedidos${qs}`, `${base}/pedidos/usuario${qs}`, `${abs}/pedidos/usuario${qs}` ];
    return await tryFetch(urls, authInit("GET"));
  }
  async function order(id){
    const base = getBase();
    const abs = absBase();
    const role = await getRole();
    const urls = role&&(/admin|superadmin/.test(String(role)))
      ? [ `${base}/historial-pedidos/pedido/${id}`, `${base}/historial_pedidos/pedido/${id}`, `${abs}/historial-pedidos/pedido/${id}`, `${abs}/historial_pedidos/pedido/${id}`, `${base}/pedidos/${id}`, `${abs}/pedidos/${id}` ]
      : [ `${base}/pedidos/${id}`, `${abs}/pedidos/${id}`, `${base}/historial-pedidos/pedido/${id}`, `${base}/historial_pedidos/pedido/${id}`, `${abs}/historial-pedidos/pedido/${id}`, `${abs}/historial_pedidos/pedido/${id}` ];
    const j = await tryFetch(urls, authInit("GET"));
    const data = j && (j.data||j) || j;
    const pedido = (data && (data.pedido||data.item||data.order)) || data;
    const items = (data && (data.items||data.detalle||data.order_items)) || [];
    const envio = (data && data.envio) || null;
    return { pedido, items, envio };
  }
  async function create(payload){
    const base = getBase();
    const urls = [ `${base}/pedidos`, `${base}/orders` ];
    let lastErr = null;
    for(const u of urls){
      const r = await fetch(u, authJsonInit("POST", payload));
      const j = await parse(r);
      if(r.ok) return j;
      lastErr = { status:r.status, ...j };
      if(r.status!==404) break;
    }
    throw lastErr || { status:404, message:"No se pudo crear el pedido" };
  }
  async function shipments(){
    const base = getBase();
    const urls = [ `${base}/envios`, `${base}/envios/metodos` ];
    let lastErr = null;
    for(const u of urls){
      const r = await fetch(u, authInit("GET"));
      const j = await parse(r);
      if(r.ok) return j;
      lastErr = { status:r.status, ...j };
    }
    throw lastErr || { status:404, message:"No se pudieron cargar envíos" };
  }
  async function shipment(id){
    const base = getBase();
    const r = await fetch(`${base}/envios/${id}`, authInit("GET"));
    const j = await parse(r); if(!r.ok) throw { status:r.status, ...j }; return j;
  }
  async function shippingCost(payload){
    const base = getBase();
    const r = await fetch(`${base}/envios/costo`, authJsonInit("POST", payload));
    const j = await parse(r); if(!r.ok) throw { status:r.status, ...j }; return j;
  }
  window.OrdersController = { history, order, create, shipments, shipment, shippingCost };
})();
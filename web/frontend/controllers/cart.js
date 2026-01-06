;(function(){
  function getBase(){
    const cfg = (typeof window!=="undefined" && window.Feraytek && window.Feraytek.API) || {};
    return cfg.base || "/api";
  }
  function buildPaths(){
    const cfg = (typeof window!=="undefined" && window.Feraytek && window.Feraytek.API) || {};
    const base = getBase();
    return {
      list: cfg.cartList || `${base}/carrito`,
      add: cfg.cartAdd || `${base}/carrito`,
      update: (id)=> (cfg.cartUpdate? cfg.cartUpdate.replace(":id",encodeURIComponent(id)) : `${base}/carrito/items/${encodeURIComponent(id)}`),
      updateItem: cfg.cartUpdateItem || `${base}/carrito/item`,
      removeItem: cfg.cartRemoveItem || `${base}/carrito/item`,
      clear: cfg.cartClear || `${base}/carrito`,
      shipping: cfg.shippingMethods || `${base}/envios/metodos`,
      checkout: cfg.checkout || `${base}/carrito/checkout`
    };
  }
  async function parse(r){
    const ct = (r.headers.get("content-type")||"").toLowerCase();
    if(ct.includes("application/json")) { try { return await r.json(); } catch{} }
    const t = await r.text(); try { return JSON.parse(t); } catch { return { message:t||"Respuesta no válida" }; }
  }
  function authHeaders(){
    const h={};
    try{
      const tok = (typeof sessionStorage!=='undefined' && sessionStorage.getItem('token')) || localStorage.getItem('token') || '';
      if(tok) h["Authorization"] = "Bearer "+tok;
    }catch{}
    return h;
  }
  async function tryFetch(urls, opts){
    const headers={ ...authHeaders(), ...(opts&&opts.headers||{}) };
    for(const u of urls){
      const r = await fetch(u,{ ...opts, headers });
      const j = await parse(r);
      if(r.ok) return j;
      if(r.status!==404) throw { status:r.status, ...j };
    }
    throw { status:404, message:"Endpoint no disponible" };
  }
  function qs(obj){
    const p = Object.entries(obj||{}).filter(([_,v])=>v!==undefined&&v!==null&&v!=="").map(([k,v])=>`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
    return p.length?`?${p.join("&")}`:"";
  }
  async function get(){
    const P = buildPaths();
    return await tryFetch([P.list],{ method:"GET" });
  }
  async function add(item, opts){
    const id_producto = item.id_producto||item.producto_id||item.id||item.productoId||null;
    let id_variante = (item.id_variante||item.variante_id||item.variant_id);
    if(id_variante===0 || id_variante==="0" || id_variante===undefined) id_variante = null;
    const cantidad = item.cantidad!=null? item.cantidad : 1;
    const precio_unitario = item.precio_unitario!=null? Number(item.precio_unitario) : Number(item.precio??item.price??0);
    const iva_porcentaje = item.iva_porcentaje!=null? Number(item.iva_porcentaje) : Number(item.iva??0);
    const payload = { id_producto, id_variante, cantidad, precio_unitario, iva_porcentaje };
    try{
      const u = (typeof window!=="undefined" && window.Feraytek && window.Feraytek.usuario) || null;
      const id_usuario = u && (u.id_usuario||u.id||u.user_id);
      if(id_usuario!=null) payload.id_usuario = id_usuario;
    }catch{}
    const body = JSON.stringify(payload);
    const P = buildPaths();
    const res = await tryFetch([P.add],{ method:"POST", body, headers:{"Content-Type":"application/json"} });
    if(!(opts&&opts.silent)){
      try{ const latest = await tryFetch([P.list],{ method:"GET" }); const detail = latest.items||latest.data||latest.carrito||latest; window.dispatchEvent(new CustomEvent("feraytek:cart-updated",{ detail })); }catch{}
    }
    return res;
  }
  async function update(itemOrId, cantidad, opts){
    const P = buildPaths();
    const headers = { "Content-Type":"application/json" };
    if(typeof itemOrId === "object" && itemOrId){
      const id_producto = itemOrId.id_producto||itemOrId.producto_id||itemOrId.id||itemOrId.idProducto;
      let id_variante = itemOrId.id_variante||itemOrId.variante_id||itemOrId.variant_id;
      if(id_variante===0||id_variante==="0"||id_variante===undefined) id_variante = null;
      const body1 = JSON.stringify({ id_producto, id_variante, cantidad });
      try{
        const res = await tryFetch([P.updateItem],{ method:"PUT", body: body1, headers });
        if(!(opts&&opts.silent)){
          try{ const latest = await tryFetch([P.list],{ method:"GET" }); const detail = latest.items||latest.data||latest.carrito||latest; window.dispatchEvent(new CustomEvent("feraytek:cart-updated",{ detail })); }catch{}
        }
        return res;
      }catch(e){
        if(e && e.status === 404){
          try{
            const id = itemOrId.id||id_producto;
            const body2 = JSON.stringify({ cantidad });
            const res = await tryFetch([P.update(id)],{ method:"PATCH", body: body2, headers });
            if(!(opts&&opts.silent)){
              try{ const latest = await tryFetch([P.list],{ method:"GET" }); const detail = latest.items||latest.data||latest.carrito||latest; window.dispatchEvent(new CustomEvent("feraytek:cart-updated",{ detail })); }catch{}
            }
            return res;
          }catch(e2){
            const current = Number(itemOrId.cantidad||itemOrId.qty||1);
            const target = Number(cantidad||current);
            if(target===current) return { ok:true };
            try{
              const rmBody = JSON.stringify({ id_producto, id_variante });
              await tryFetch([P.removeItem],{ method:"DELETE", body: rmBody, headers });
            }catch{}
            const addPayload = { producto_id:id_producto, cantidad:target, id_variante:id_variante, variante_id:id_variante, precio_unitario:itemOrId.precio_unitario, iva_porcentaje:itemOrId.iva_porcentaje };
            const res3 = await add(addPayload,{ silent:true });
            if(!(opts&&opts.silent)){
              try{ const latest = await tryFetch([P.list],{ method:"GET" }); const detail = latest.items||latest.data||latest.carrito||latest; window.dispatchEvent(new CustomEvent("feraytek:cart-updated",{ detail })); }catch{}
            }
            return res3;
          }
        }
        throw e;
      }
    } else {
      const id = itemOrId;
      const body = JSON.stringify({ cantidad });
      const res = await tryFetch([P.update(id)],{ method:"PATCH", body, headers });
      if(!(opts&&opts.silent)){
        try{ const latest = await tryFetch([P.list],{ method:"GET" }); const detail = latest.items||latest.data||latest.carrito||latest; window.dispatchEvent(new CustomEvent("feraytek:cart-updated",{ detail })); }catch{}
      }
      return res;
    }
  }
  async function remove(payload, opts){
    const P = buildPaths();
    const body = JSON.stringify({
      id_producto: payload.id_producto||payload.producto_id||payload.id,
      id_variante: (payload.id_variante===0||payload.id_variante==="0"||payload.id_variante===undefined)?null:payload.id_variante
    });
    const res = await tryFetch([P.removeItem],{ method:"DELETE", body, headers:{"Content-Type":"application/json"} });
    if(!(opts&&opts.silent)){
      try{ const latest = await tryFetch([P.list],{ method:"GET" }); const detail = latest.items||latest.data||latest.carrito||latest; window.dispatchEvent(new CustomEvent("feraytek:cart-updated",{ detail })); }catch{}
    }
    return res;
  }
  async function clear(){
    const P = buildPaths();
    const res = await tryFetch([P.clear],{ method:"DELETE" });
    try{ const latest = await tryFetch([P.list],{ method:"GET" }); const detail = latest.items||latest.data||latest.carrito||latest; window.dispatchEvent(new CustomEvent("feraytek:cart-updated",{ detail })); }catch{}
    return res;
  }
  async function configs(){
    const base = getBase();
    return await tryFetch([`${base}/config/carrito`],{ method:"GET" });
  }
  async function shippingMethods(){
    const P = buildPaths();
    return await tryFetch([P.shipping],{ method:"GET" });
  }
  async function checkout(payload){
    const body = JSON.stringify(payload);
    try{
      const P = buildPaths();
      return await tryFetch([P.checkout],{ method:"POST", body, headers:{"Content-Type":"application/json"} });
    }catch(e){ throw e; }
  }
  window.CartController = { get, add, update, remove, clear, configs, shippingMethods, checkout };
})();
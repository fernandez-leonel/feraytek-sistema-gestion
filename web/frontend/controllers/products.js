// Controlador de Productos (frontend)
// Responsabilidad: consumir API de productos (lista, detalle, búsqueda, filtros)
// Mantiene respuestas en JSON y evita CORS usando ruta relativa /api

(function(){
  function computeImage(prod){
    const id = prod.id || prod.id_producto || prod.producto_id || prod.idProducto;
    const baseImg = (window.Feraytek && window.Feraytek.IMAGES && window.Feraytek.IMAGES.base) || "";
    if(prod.url_imagen) return prod.url_imagen;
    if(prod.imagen) return prod.imagen;
    if(prod.imagen_url) return prod.imagen_url;
    if(prod.foto) return prod.foto;
    if(prod.foto_url) return prod.foto_url;
    if(prod.image) return prod.image;
    if(prod.img) return prod.img;
    if(baseImg && id!=null) return `${baseImg}/productos/${id}.jpg`;
    return "";
  }
  function getBase(){
    const cfg = (typeof window!=="undefined" && window.Feraytek && window.Feraytek.API) || {};
    return cfg.base || "/api";
  }
  function absBase(){
    const b = getBase();
    if(/^https?:\/\//.test(b)) return b;
    try{
      const host = (window.location && window.location.hostname) || "";
      if(host==="localhost" || host==="127.0.0.1") return "http://localhost:3000/api";
      const origin = window.location.origin || ""; return origin + (b.startsWith("/")? b : ("/"+b));
    }catch{ return b; }
  }
  function absRoot(){ try{ const a=absBase(); return a.replace(/\/api$/,""); }catch{ return ""; } }
  function cookieToken(){
    try{
      const s = document.cookie||"";
      const keys = ["token","auth","jwt","access_token","Authorization"];
      for(const k of keys){ const m = s.match(new RegExp(`(?:^|;\\s*)${k}=([^;]+)`,`i`)); if(m) return decodeURIComponent(m[1]); }
      return "";
    }catch{ return ""; }
  }
  function getToken(){ try{ return (sessionStorage.getItem("token")||localStorage.getItem("token")||cookieToken()||""); }catch{ return ""; } }
  function useCookies(){ try{ return !!(window.Feraytek && window.Feraytek.AUTH_MODE === "cookie") || !!cookieToken(); }catch{ return !!cookieToken(); } }
  function authInit(method){ const headers={}; const tok=getToken(); if(tok) headers["Authorization"]="Bearer "+tok; return { method:method||"GET", headers, credentials: useCookies()?"include":"omit", cache:"no-store" }; }
  async function tryFetch(urls, init){
    let last = null;
    for(const u of urls){ const r = await fetch(u, init); const j = await parse(r); if(r.ok) return j; last = { status:r.status, ...j }; }
    throw last || { status:404, message:"Endpoint no disponible" };
  }
  async function parse(r){
    const ct = (r.headers.get("content-type")||"").toLowerCase();
    if(ct.includes("application/json")){
      try { return await r.json(); } catch { return { message: "JSON inválido" }; }
    }
    const t = await r.text();
    try { return JSON.parse(t); } catch { return { message: t||"Respuesta no válida" }; }
  }
  async function fetchPrimaryImage(id){
    try{
      const base = getBase();
      const ts = Date.now();
      const urls = [ `${base}/imagenes_productos/producto/${id}?t=${ts}`, `${absBase()}/imagenes_productos/producto/${id}?t=${ts}` ];
      const r = await fetch(urls[0],{ cache:"no-store", credentials:"omit" });
      const j = await parse(r);
      const arr = Array.isArray(j)?j:(j.items||j.data||[]);
      const first = Array.isArray(arr)&&arr.length?arr[0]:null;
      const u = first && (first.url_imagen || first.imagen_url || first.foto_url) || "";
      if(typeof u==="string" && u.startsWith("/static/")){ const root = absRoot(); if(root) return root + u; }
      return u||"";
    }catch{ return ""; }
  }
  async function enrichWithImages(arr){
    const tasks = arr.map(async(p)=>{
      const has = p.url_imagen || p.imagen || p.imagen_url || p.foto || p.foto_url || p.image || p.img;
      if(has) return { ...p, imagen: computeImage(p) };
      const id = p.id || p.id_producto || p.producto_id || p.idProducto;
      const url = id!=null ? await fetchPrimaryImage(id) : "";
      return { ...p, url_imagen: url, imagen: url || computeImage(p) };
    });
    return await Promise.all(tasks);
  }
  function qs(obj){
    const p = Object.entries(obj).filter(([_,v])=>v!==undefined&&v!==null&&v!=="").map(([k,v])=>`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
    return p.length?`?${p.join("&")}`:"";
  }
  async function list({ page=1, limit=12, categoria, q }={}){
    const headers={};
    const tok=localStorage.getItem("token")||""; if(tok) headers["Authorization"]= "Bearer "+tok;
    const base = getBase(); const abs = absBase();
    const urls = [ `${base}/productos${qs({page,limit,categoria,q})}`, `${abs}/productos${qs({page,limit,categoria,q})}` ];
    const j = await tryFetch(urls,{ headers, credentials:"omit", cache:"no-store" });
    const arr = j.items||j.data||j.productos||j.results||j;
    if(Array.isArray(arr)){
      const mapped = await enrichWithImages(arr);
      const out = { ...(typeof j==='object'?j:{}), items: mapped, data: mapped };
      return out;
    }
    return j;
  }
  async function detail(id){
    const headers={}; const tok=sessionStorage.getItem("token")||""; if(tok) headers["Authorization"]="Bearer "+tok;
    const base = getBase(); const abs = absBase();
    const urls = [ `${base}/productos/${id}`, `${abs}/productos/${id}` ];
    const j = await tryFetch(urls,{ headers, credentials:"omit", cache:"no-store" });
    const data = j.data||j.item||j||{};
    let mapped = { ...data, imagen: computeImage(data) };
    if(!mapped.imagen){
      const id = mapped.id || mapped.id_producto || mapped.producto_id || mapped.idProducto;
      const url = id!=null ? await fetchPrimaryImage(id) : "";
      mapped = { ...mapped, url_imagen: url, imagen: url || mapped.imagen };
    }
    return { ...(typeof j==='object'?j:{}), data: mapped };
  }
  async function categories(){
    const headers={}; const tok=localStorage.getItem("token")||""; if(tok) headers["Authorization"]="Bearer "+tok;
    const base = getBase(); const abs = absBase();
    const urls = [ `${base}/categorias/activas`, `${base}/productos/categorias`, `${abs}/categorias/activas`, `${abs}/productos/categorias` ];
    return await tryFetch(urls,{ headers, credentials:"omit", cache:"no-store" });
  }
  async function reviews(id,{page=1,limit=10}={}){
    const base = getBase(); const abs = absBase();
    const urls = [ `${base}/resenas/producto/${id}${qs({page,limit})}`, `${abs}/resenas/producto/${id}${qs({page,limit})}` ];
    const j = await tryFetch(urls, { method:"GET", credentials:"omit", cache:"no-store" });
    try{
      const arr = Array.isArray(j)?j:(j.items||j.data||j.reviews||[]);
      if(!j.avg_rating){
        const vals = (arr||[]).map(x=> Number(x.calificacion||x.rating||x.estrellas||0) ).filter(v=>v>0);
        const avg = vals.length? Number((vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2)) : 0;
        if(typeof j==='object') j.avg_rating = avg;
      }
    }catch{}
    return j;
  }
  async function addReview(id,{ rating, comentario }){
    const base = getBase(); const abs = absBase();
    const payload = { id_producto: Number(id), calificacion: Number(rating), comentario };
    const urls = [ `${base}/resenas`, `${abs}/resenas` ];
    const init = authInit("POST"); init.headers = { ...(init.headers||{}), "Content-Type":"application/json", "Accept":"application/json" }; init.credentials = "omit"; init.body = JSON.stringify(payload);
    try{ return await tryFetch(urls, init); }catch(e){
      const msg = String((e && (e.message||e.error||e.msg))||"");
      if(/duplicate/i.test(msg)||/uq_resena_prod_user/i.test(msg)){
        try{
          const me = await (window.AuthController && window.AuthController.profile? window.AuthController.profile(): Promise.resolve({}));
          const u = me.user||me.usuario||me||{};
          const uid = u.id_usuario!=null?u.id_usuario:(u.user_id!=null?u.user_id:u.id);
          const lr = await reviews(id,{ page:1, limit:200 });
          const arr = lr.items||lr.data||lr.reviews||lr||[];
          const mine = (Array.isArray(arr)?arr:[]).find(x=>{ const owner = x.id_usuario!=null?x.id_usuario:(x.user_id!=null?x.user_id:(x.usuario_id!=null?x.usuario_id:null)); return uid!=null && owner==uid; });
          if(mine && mine.id!=null){
            const init2 = authInit("PUT"); init2.headers = { ...(init2.headers||{}), "Content-Type":"application/json", "Accept":"application/json" }; init2.credentials = "omit"; init2.body = JSON.stringify({ calificacion: Number(rating), comentario });
            const urls2 = [ `${base}/resenas/${mine.id}`, `${abs}/resenas/${mine.id}` ];
            return await tryFetch(urls2, init2);
          }
        }catch{}
      }
      throw e;
    }
  }
  window.ProductController = { list, detail, categories, reviews, addReview };
})();

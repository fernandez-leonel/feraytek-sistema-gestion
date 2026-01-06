(function(){
  function getBase(){
    const cfg = (typeof window!=="undefined" && window.Feraytek && window.Feraytek.API) || {};
    return cfg.base || "/api";
  }
  async function parse(r){
    const ct = (r.headers.get("content-type")||"").toLowerCase();
    if(ct.includes("application/json")){
      try { return await r.json(); } catch { return { message: "JSON inválido" }; }
    }
    const t = await r.text();
    try { return JSON.parse(t); } catch { return { message: t||"Respuesta no válida" }; }
  }
  function authInit(method, payload){
    const headers = { "Content-Type":"application/json" };
    const tok = sessionStorage.getItem("token") || localStorage.getItem("token") || ""; if(tok) headers["Authorization"] = "Bearer "+tok;
    const init = { method, headers, credentials:"omit" };
    if(payload) init.body = JSON.stringify(payload);
    return init;
  }
  async function create({ asunto, descripcion, prioridad }){
    const base = getBase();
    let uid = null;
    try{ const u = (window.Feraytek && window.Feraytek.usuario) || null; uid = u && (u.id_usuario||u.id||u.user_id||u.usuario_id) || null; }catch{}
    if(uid==null && window.AuthController && typeof window.AuthController.profile==="function"){
      try{ const me = await window.AuthController.profile(); const u = (me && (me.user||me.usuario||me.data)) || me; uid = u && (u.id_usuario||u.id||u.user_id||u.usuario_id) || null; }catch{}
    }
    const payload = { id_usuario: uid, asunto, mensaje: descripcion };
    const r = await fetch(`${base}/soporte`, authInit("POST", payload));
    const j = await parse(r); if(!r.ok) throw { status:r.status, ...j }; return j;
  }
  async function myTickets(){
    const base = getBase();
    const r = await fetch(`${base}/soporte/mis-tickets`, authInit("GET"));
    const j = await parse(r); if(!r.ok) throw { status:r.status, ...j }; return j;
  }
  async function detail(id){
    const base = getBase();
    const r = await fetch(`${base}/soporte/${id}`, authInit("GET"));
    const j = await parse(r); if(!r.ok) throw { status:r.status, ...j }; return j;
  }
  window.SupportController = { create, myTickets, detail };
})();

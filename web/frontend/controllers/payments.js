;(function(){
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
  async function pay({ id_pedido, descripcion, monto_total }){
    const payload = { id_pedido, descripcion, monto_total };
    const base = getBase();
    const r = await fetch(`${base}/pagos`, authJsonInit("POST", payload));
    const j = await parse(r); if(!r.ok) throw { status:r.status, ...j }; return j;
  }
  async function consult(){
    const base = getBase();
    const r = await fetch(`${base}/pagos/consulta`, authInit("GET"));
    const j = await parse(r); if(!r.ok) throw { status:r.status, ...j }; return j;
  }
  async function simulateApprove(id_transaccion){
    const base = getBase();
    const u = `${base}/pagos/simular-aprobacion/${encodeURIComponent(id_transaccion)}`;
    const r = await fetch(u, authJsonInit("POST", {}));
    const j = await parse(r); if(!r.ok) throw { status:r.status, ...j }; return j;
  }
  window.PaymentsController = { pay, consult, simulateApprove };
})();
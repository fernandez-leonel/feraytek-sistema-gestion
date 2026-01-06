window.AuthController = (function(){
  function getBase(){
    const cfg = (typeof window!=="undefined" && window.Feraytek && window.Feraytek.API) || {};
    return cfg.base || "/api";
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
  const useCookies = !!(window.Feraytek && window.Feraytek.AUTH_MODE === "cookie");
  async function parse(r){
    const ct = (r.headers.get("content-type")||"").toLowerCase();
    if(ct.includes("application/json")){
      try { return await r.json(); } catch { return { message: "JSON inválido" }; }
    }
    const t = await r.text();
    if(/<!doctype html>|<html/i.test(t)){
      const m = t.match(/<pre>([\s\S]*?)<\/pre>/i);
      let msg = m ? m[1] : t;
      msg = msg.replace(/<br\s*\/>/gi,"\n").replace(/<[^>]+>/g,"").trim();
      return { message: msg };
    }
    try { return JSON.parse(t); } catch { return { message: t || "Respuesta no válida" }; }
  }
  async function tryFetch(urls, init){
    let lastErr = null;
    for(const u of urls){
      const r = await fetch(u, init);
      const j = await parse(r);
      if(r.ok) return j;
      const err = { status:r.status, ...j };
      if(r.status !== 404) throw err; // priorizar errores reales (401/403/500) sobre 404
      lastErr = err;
    }
    throw lastErr || { status:404, message:"Endpoint no disponible" };
  }
  async function register(payload){
    const init = {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)};
    if(useCookies) init.credentials = "include"; else init.credentials = "omit";
    const base = getBase();
    const abs = absBase();
    const urls = [base+"/users/register", base+"/auth/register", abs+"/users/register", abs+"/auth/register"];
    const j = await tryFetch(urls, init);
    if(!useCookies && j && j.token){ try{ sessionStorage.setItem("token", j.token); }catch{} }
    return j;
  }
  async function login(payload){
    const init = {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)};
    if(useCookies) init.credentials = "include"; else init.credentials = "omit";
    const base = getBase();
    const abs = absBase();
    const urls = [base+"/users/login", base+"/auth/login", abs+"/users/login", abs+"/auth/login"];
    const j = await tryFetch(urls, init);
    if(!useCookies && j && j.token) {
      try { sessionStorage.setItem("token", j.token); } catch {}
    }
    return j;
  }
  async function profile(){
    let init = {};
    if(useCookies){
      init.credentials = "include";
    } else {
      const token = sessionStorage.getItem("token") || localStorage.getItem("token") || "";
      const headers = {};
      if(token) headers["Authorization"] = "Bearer "+token;
      init = { headers, credentials: "omit" };
    }
    const base = getBase();
    const abs = absBase();
    const urls = [base+"/users/profile", base+"/auth/me", abs+"/users/profile", abs+"/auth/me"];
    return await tryFetch(urls, init);
  }
  async function updateProfile(payload){
    const headers = {"Content-Type":"application/json"};
    if(!useCookies){
      const token = sessionStorage.getItem("token") || localStorage.getItem("token") || "";
      if(token) headers["Authorization"] = "Bearer "+token;
    }
    const init = {method:"PUT",headers,body:JSON.stringify(payload)};
    if(useCookies) init.credentials = "include"; else init.credentials = "omit";
    const base = getBase();
    const abs = absBase();
    const urls = [base+"/users/profile", base+"/auth/me", abs+"/users/profile", abs+"/auth/me"];
    return await tryFetch(urls, init);
  }
  async function updateClientProfile(id,payload){
    const headers = {"Content-Type":"application/json"};
    if(!useCookies){
      const token = sessionStorage.getItem("token") || localStorage.getItem("token") || "";
      if(token) headers["Authorization"] = "Bearer "+token;
    }
    const init = {method:"PUT",headers,body:JSON.stringify(payload)};
    if(useCookies) init.credentials = "include"; else init.credentials = "omit";
    const base = getBase();
    const abs = absBase();
    const urls = [base+"/users/profile/cliente/"+id, abs+"/users/profile/cliente/"+id];
    return await tryFetch(urls, init);
  }
  async function updateAdminProfile(id,payload){
    const headers = {"Content-Type":"application/json"};
    if(!useCookies){
      const token = sessionStorage.getItem("token") || localStorage.getItem("token") || "";
      if(token) headers["Authorization"] = "Bearer "+token;
    }
    const init = {method:"PUT",headers,body:JSON.stringify(payload)};
    if(useCookies) init.credentials = "include"; else init.credentials = "omit";
    const base = getBase();
    const abs = absBase();
    const urls = [base+"/users/profile/admin/"+id, abs+"/users/profile/admin/"+id];
    return await tryFetch(urls, init);
  }
  async function forgotPassword(payload){
    const init = {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)};
    if(useCookies) init.credentials = "include"; else init.credentials = "omit";
    const base = getBase();
    const abs = absBase();
    const urls = [base+"/auth/forgot-password", abs+"/auth/forgot-password"];
    return await tryFetch(urls, init);
  }
  async function resetPassword(payload){
    const init = {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)};
    if(useCookies) init.credentials = "include"; else init.credentials = "omit";
    const base = getBase();
    const abs = absBase();
    const urls = [base+"/auth/reset-password", abs+"/auth/reset-password"];
    return await tryFetch(urls, init);
  }
  async function changePassword(payload){
    const headers = {"Content-Type":"application/json"};
    if(!useCookies){
      const token = sessionStorage.getItem("token") || localStorage.getItem("token") || "";
      if(token) headers["Authorization"] = "Bearer "+token;
    }
    const init = {method:"PUT",headers,body:JSON.stringify(payload)};
    if(useCookies) init.credentials = "include"; else init.credentials = "omit";
    const base = getBase();
    const abs = absBase();
    const urls = [base+"/users/password", abs+"/users/password"];
    return await tryFetch(urls, init);
  }
  return {register,login,profile,updateProfile,updateClientProfile,updateAdminProfile,forgotPassword,resetPassword,changePassword};
})();

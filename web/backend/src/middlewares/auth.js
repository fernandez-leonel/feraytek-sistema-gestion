import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev-secret";

function parseCookie(header){
  try{
    const s = String(header||""); if(!s) return {};
    const out = {}; s.split(/;\s*/).forEach(pair=>{ const idx = pair.indexOf("="); if(idx>0){ const k = decodeURIComponent(pair.slice(0,idx).trim()); const v = decodeURIComponent(pair.slice(idx+1).trim()); out[k] = v; } });
    return out;
  }catch{ return {}; }
}

export function requireAuth(req, res, next) {
  const header = req.headers["authorization"] || "";
  const parts = header.split(" ");
  let token = parts.length === 2 && parts[0] === "Bearer" ? parts[1] : null;
  if(!token){
    const cookieHdr = req.headers["cookie"] || "";
    const cookies = parseCookie(cookieHdr);
    const keys = ["token","auth","jwt","access_token","Authorization"];
    for(const k of keys){ const v = cookies[k]; if(v){ token = v.startsWith("Bearer ")? v.slice(7) : v; break; } }
  }
  if (!token) return res.status(401).json({ message: "No autorizado" });
  try {
    const payload = jwt.verify(token, SECRET);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: "Token inválido" });
  }
}

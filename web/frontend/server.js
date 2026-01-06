const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;

const types = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".jsx": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

const server = http.createServer((req, res) => {
  if (req.url === "/live") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*"
    });
    res.write("retry: 500\n\n");
    clients.add(res);
    req.on("close", () => { try { clients.delete(res); } catch {} });
    return;
  }
  if (req.url === "/favicon.ico") {
    res.writeHead(200, { "Content-Type": "image/x-icon" });
    res.end("");
    return;
  }
  if (req.url.startsWith("/api/") || req.url.startsWith("/static")) {
    const headers = { ...req.headers, host: "localhost:3000" };
    delete headers["origin"]; delete headers["referer"]; delete headers["sec-fetch-site"]; delete headers["sec-fetch-mode"]; delete headers["sec-fetch-dest"]; 
    const options = {
      hostname: "localhost",
      port: Number(process.env.API_PORT || 3000),
      path: req.url,
      method: req.method,
      headers
    };
    const proxy = http.request(options, (pr) => {
      const respHeaders = { ...pr.headers };
      respHeaders["ngrok-skip-browser-warning"] = "true";
      res.writeHead(pr.statusCode || 500, respHeaders);
      pr.pipe(res);
    });
    req.pipe(proxy);
    proxy.on("error", () => {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Proxy error" }));
    });
    return;
  }
  const url = req.url === "/" ? "/index.html" : req.url;
  const file = path.join(root, url);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { "Content-Type": "text/plain" }); res.end("Not found"); return; }
    const ext = path.extname(file);
    res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream", "ngrok-skip-browser-warning":"true", "Cache-Control":"no-store" });
    res.end(data);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Frontend escuchando en http://localhost:${PORT}`);
});

// Live reload (SSE) - observa cambios y notifica a clientes conectados
const clients = new Set();
function notifyAll(msg){
  clients.forEach((res)=>{ try{ res.write(`data: ${msg}\n\n`); }catch{} });
}
const WATCH_EXT = new Set([".html",".css",".js",".jsx"]);
let reloadTimer = null;
function scheduleReload(){
  try{ if(reloadTimer) clearTimeout(reloadTimer); }catch{}
  reloadTimer = setTimeout(()=>{ notifyAll("reload"); }, 250);
}
function setupWatch(dir){
  try{
    fs.watch(dir,{ recursive:false },(event, file)=>{
      if(!file) return;
      const ext = path.extname(String(file));
      if(!WATCH_EXT.has(ext)) return;
      if(event!=="change" && event!=="rename") return;
      scheduleReload();
    });
  }catch{}
}
[
  root,
  path.join(root, "components"),
  path.join(root, "controllers"),
  path.join(root, "lib"),
  path.join(root, "img")
].forEach(setupWatch);
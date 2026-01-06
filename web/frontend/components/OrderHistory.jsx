(function(){
  const { useState, useEffect } = React;
  function OrderHistory(){
    const [items,setItems] = useState([]);
    const [rawItems,setRawItems] = useState([]);
    const [loading,setLoading] = useState(false);
    const [err,setErr] = useState(null);
    const [msg,setMsg] = useState(null);
    const [status,setStatus] = useState("Todos");
    const [statuses,setStatuses] = useState(["Todos"]);
    const [shipStatus,setShipStatus] = useState("Todos");
    const [shipStatuses,setShipStatuses] = useState(["Todos"]);
    const ORDER_ENUM = ["pendiente","pagado","enviado","entregado","cancelado","reembolsado"];
    const SHIP_ENUM  = ["preparando","en_camino","entregado","devuelto"];
    const [sort,setSort] = useState("fecha_desc");
    const [extra,setExtra] = useState({});
    function normStatus(s){ return String(s||"").toLowerCase().replace(/\s+/g,'').replace('enproceso','procesando'); }
    function normShip(s){ return String(s||"").toLowerCase().replace(/\s+/g,'').replace('encamino','en_camino'); }
    function labelForStatus(s){ const k=normStatus(s); const map={ pendiente:"Pendiente", pagado:"Pagado", procesando:"Procesando", enviado:"Enviado", entregado:"Entregado", cancelado:"Cancelado", reembolsado:"Reembolsado" }; return map[k]||((k.charAt(0).toUpperCase()+k.slice(1))||""); }
    function labelForShip(s){ const k=normShip(s); const map={ preparando:"Preparando", en_camino:"En camino", entregado:"Entregado", devuelto:"Devuelto" }; return map[k]||((k.charAt(0).toUpperCase()+k.slice(1))||""); }
    function codeForStatus(label){ const k=String(label||"").toLowerCase().replace(/\s+/g,''); const map={ todos:null, pendiente:"pendiente", pagado:"pagado", procesando:"procesando", enviado:"enviado", entregado:"entregado", cancelado:"cancelado", reembolsado:"reembolsado" }; return map[k]!==undefined?map[k]:normStatus(label); }
    function codeForShip(label){ const k=String(label||"").toLowerCase().replace(/\s+/g,''); const map={ todos:null, preparando:"preparando", en_camino:"en_camino", entregado:"entregado", devuelto:"devuelto" }; return map[k]!==undefined?map[k]:normShip(label); }
    async function load(){
      setLoading(true); setErr(null);
      try{
        const stCode = codeForStatus(status);
        const shCode = codeForShip(shipStatus);
        const res = await window.OrdersController.history({ page:1, limit:20, status:stCode, envio_status:shCode, sort });
        const data = res.items||res.data||res.pedidos||res.results||res;
        const arr = Array.isArray(data)?data:[];
        const allCodes = Array.from(new Set(arr.map(p=> normStatus(p.estado||p.status)).concat(ORDER_ENUM.map(normStatus)))).filter(Boolean);
        const shipCodes = Array.from(new Set(arr.map(p=> normShip(p.estado_envio||p.envio_estado||p.delivery_status)).concat(SHIP_ENUM.map(normShip)))).filter(Boolean);
        const labels = ["Todos", ...ORDER_ENUM.map(labelForStatus), ...allCodes.map(labelForStatus)].filter((v,i,a)=> a.indexOf(v)===i);
        const shipLabels = ["Todos", ...SHIP_ENUM.map(labelForShip), ...shipCodes.map(labelForShip)].filter((v,i,a)=> a.indexOf(v)===i);
        setStatuses(labels);
        setShipStatuses(shipLabels);
        setRawItems(arr);
        setItems(applyFilters(arr));
      }catch(e){ const m = e && (e.status===401?"Debes iniciar sesión":(e.status===403?"Acceso denegado":e.message)); setErr(m||"Error al cargar mis pedidos"); setItems([]); }
      finally{ setLoading(false); }
    }
    useEffect(()=>{ load(); },[status,shipStatus,sort]);
    useEffect(()=>{
      (async()=>{
        const list = Array.isArray(items)?items:[];
        const ids = list.map(p=> p.id||p.id_pedido||p.pedido_id ).filter(v=> v!=null);
        const misses = ids.filter(id=> !extra[id]);
        if(!misses.length) return;
        const results = await Promise.all(misses.map(async(id)=>{
          try{
            const r = await window.OrdersController.order(id);
            const ped = r.pedido||{}; const det = Array.isArray(r.items)?r.items:[]; const env = r.envio||null;
            const sub = ped.subtotal!=null? Number(ped.subtotal) : det.reduce((acc,it)=> acc + Number(it.precio_unitario||it.precio_base||0)*Number(it.cantidad||1),0);
            const envio_costo = ped.costo_envio!=null? Number(ped.costo_envio) : 0;
            const desc = ped.descuento_total!=null? Number(ped.descuento_total) : 0;
            const ivaSum = det.reduce((acc,it)=> acc + Number(it.iva_monto||0), 0);
            const ivaCalc = ivaSum>0? ivaSum : det.reduce((acc,it)=> acc + (Number(it.precio_unitario||it.precio_base||0)*Number(it.cantidad||1))*(Number(it.iva_porcentaje||0)/100),0);
            const total = ped.total!=null? Number(ped.total) : Number((sub + ivaCalc + envio_costo - desc).toFixed(2));
            const fecha = ped.fecha_pedido||ped.fecha||ped.created_at||ped.creado_en||"";
            const estado = ped.estado||ped.status||"";
            const estado_envio = env && env.estado_envio || "";
            const empresa_envio = env && env.empresa_envio || "";
            const numero_seguimiento = env && env.numero_seguimiento || "";
            const product_names = await Promise.all((det||[]).map(async(it)=>{
              const nm = it && (it.nombre||it.producto_nombre||it.name);
              if(nm) return nm;
              const pid = it && (it.producto_id!=null?it.producto_id:(it.id_producto!=null?it.id_producto:(it.productoId!=null?it.productoId:null)));
              if(pid==null) return "Producto";
              try{ const d = await window.ProductController.detail(pid); const p = d && (d.data||d.producto||d.item||d)||{}; const n = p.nombre||p.title||p.name; return n||(`Producto ${pid}`); }catch{ return `Producto ${pid}`; }
            }));
            return { id, subtotal:sub, iva:ivaCalc, envio_costo, descuento:desc, total, fecha, estado, estado_envio, empresa_envio, numero_seguimiento, product_names };
          }catch{ return null; }
        }));
        const map = {}; results.forEach(x=>{ if(x&&x.id!=null) map[x.id]=x; });
        if(Object.keys(map).length) { setExtra(prev=> ({ ...prev, ...map })); setItems(applyFilters(rawItems)); }
      })();
    },[items]);
    function fmtDate(x){ try{ const d=new Date(x); if(isNaN(d.getTime())) return String(x||""); return d.toLocaleString(); }catch{ return String(x||""); } }
    function totalOf(p){ const t = (p&& (p.total||p.monto_total||p.amount)) || 0; return Number(t)||0; }
    function money(n){ return `$${Number(n||0).toFixed(2)}`; }
    function ivaFrom(p){ const sub=Number((p&& (p.subtotal||p.monto_subtotal))||0); const tot=Number((p&& (p.total||p.monto_total))||0); const envio=Number((p&& p.costo_envio)||0); const desc=Number((p&& (p.descuento_total||0))||0); const iva=tot - sub - envio + desc; return Number(iva)||0; }
    function applyFilters(arr){
      const stCode = codeForStatus(status);
      const shCode = codeForShip(shipStatus);
      const a1 = stCode?arr.filter(p=> normStatus(p.estado||p.status)===normStatus(stCode)) : arr;
      const a2 = shCode?a1.filter(p=>{
        const id = p.id||p.id_pedido||p.pedido_id;
        const ex = extra[id]||{};
        const ship = ex.estado_envio!=null? ex.estado_envio : (p.estado_envio||"");
        return normShip(ship)===normShip(shCode);
      }):a1;
      return a2;
    }
    function statusChip(s){ const st = String(s||"Pendiente"); return React.createElement("span",{className:"chip"+(st.toLowerCase()==="entregado"?" active":"")},st); }
    function row(p){
      const id = p.id||p.id_pedido||p.pedido_id;
      const fecha = p.fecha_pedido||p.fecha||p.created_at||p.creado_en;
      const estado = p.estado||p.status||"Procesando";
      const ex = extra[id]||{};
      const estadoEnvio = ex.estado_envio!=null? ex.estado_envio : (p.estado_envio||"");
      const empresaEnvio = ex.empresa_envio||"";
      const numeroSeguimiento = ex.numero_seguimiento||"";
      const productNames = Array.isArray(ex.product_names)?ex.product_names:[];
      const info = extra[id]||{};
      const sub = info.subtotal!=null? Number(info.subtotal) : Number((p&& (p.subtotal||p.monto_subtotal))||0);
      const iva = info.iva!=null? Number(info.iva) : ivaFrom(p);
      const final = Number((sub + iva).toFixed(2));
      return React.createElement("div",{className:"card"},
        React.createElement("div",{className:"block-header"},
          React.createElement("h3",{className:"block-title"},`Pedido #${id}`)
        ),
        React.createElement("div",{className:"summary-grid"},
          (productNames.length?React.createElement("div",{className:"sum-label"},"Productos"):null),
          (productNames.length?React.createElement("div",{className:"sum-value"},productNames.join(", ")):null),
          React.createElement("div",{className:"sum-label"},"Precio"),React.createElement("div",{className:"sum-value"},money(sub)),
          React.createElement("div",{className:"sum-label"},"IVA"),React.createElement("div",{className:"sum-value"},money(iva)),
          React.createElement("div",{className:"sum-label tot-strong"},"Total (c/ IVA)"),React.createElement("div",{className:"sum-value tot-strong"},money(final)),
          React.createElement("div",{className:"sum-label"},"Estado pedido"),React.createElement("div",{className:"sum-value"},estado),
          React.createElement("div",{className:"sum-label"},"Estado envío"),React.createElement("div",{className:"sum-value"},labelForShip(estadoEnvio)),
          (empresaEnvio?React.createElement("div",{className:"sum-label"},"Empresa"):null), (empresaEnvio?React.createElement("div",{className:"sum-value"},empresaEnvio):null),
          (numeroSeguimiento?React.createElement("div",{className:"sum-label"},"Guía"):null), (numeroSeguimiento?React.createElement("div",{className:"sum-value"},numeroSeguimiento):null),
          React.createElement("div",{className:"sum-label"},"Fecha"),React.createElement("div",{className:"sum-value"},fmtDate(fecha))
        ),
        null
      );
    }
    return React.createElement("div",{className:"catalog"},
      React.createElement(window.Feraytek.Header,{}),
      React.createElement("h1",{className:"page-title"},"Mis pedidos"),
      msg?React.createElement("div",{className:`msg ${msg.type}`},msg.text):null,
      React.createElement("div",{className:"top-actions filters-row"},
        React.createElement("div",{className:"filter-group"},
          React.createElement("div",{className:"filter-label"},"Estado del pedido"),
          React.createElement("select",{className:"input",value:status,onChange:e=>setStatus(e.target.value)},
            ...statuses.map(s=> React.createElement("option",{key:s,value:s},s))
          )
        ),
        React.createElement("div",{className:"filter-group"},
          React.createElement("div",{className:"filter-label"},"Estado del envío"),
          React.createElement("select",{className:"input",value:shipStatus,onChange:e=>setShipStatus(e.target.value)},
            ...shipStatuses.map(s=> React.createElement("option",{key:s,value:s},s))
          )
        ),
        React.createElement("div",{className:"filter-group"},
          React.createElement("div",{className:"filter-label"},"Ordenar"),
          React.createElement("select",{className:"input",value:sort,onChange:e=>setSort(e.target.value)},
            React.createElement("option",{value:"fecha_desc"},"Fecha (recientes)"),
            React.createElement("option",{value:"fecha_asc"},"Fecha (antiguos)"),
            React.createElement("option",{value:"monto_desc"},"Monto (mayor)"),
            React.createElement("option",{value:"monto_asc"},"Monto (menor)")
          )
        )
      ),
      err?React.createElement("div",{className:"msg error"},err):null,
      loading?React.createElement("div",{className:"loading"},"Cargando..."):
      (items.length===0 && !err? React.createElement("div",{className:"empty-state"},
        React.createElement("div",{className:"msg"}, status==="Todos"?"No tenés pedidos aún":"No hay pedidos con ese estado"),
        React.createElement("div",{className:"actions"},
          React.createElement("button",{className:"btn primary",onClick:()=>{ if(window.Feraytek && typeof window.Feraytek.go==="function"){ window.Feraytek.go("catalog"); } }},"Ir a productos")
        )
      ) : React.createElement("div",{className:"catalog-grid"}, items.map((p,i)=>React.createElement("div",{key:(p.id||p.id_pedido||i)}, row(p))))),
      null,
      null
    );
  }
  window.Feraytek = window.Feraytek || {};
  window.Feraytek.OrderHistory = OrderHistory;
})();

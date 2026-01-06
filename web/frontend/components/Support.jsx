(function(){
  const { useState, useEffect, useRef } = React;
  function Support(){
    const [f,setF] = useState({ asunto:"", descripcion:"", prioridad:"media" });
    const [msg,setMsg] = useState(null);
    const msgTimer = useRef(null);
    function notify(m){
      setMsg(m);
      try{ if(msgTimer.current) clearTimeout(msgTimer.current); }catch{}
      msgTimer.current = setTimeout(()=>{ try{ setMsg(null); }catch{} }, 2200);
    }
    const [loading,setLoading] = useState(false);
    const [items,setItems] = useState([]);
    const [err,setErr] = useState(null);
    const [detail,setDetail] = useState(null);
    const [showList,setShowList] = useState(false);
    const [listPage,setListPage] = useState(1);
    const pageSize = 6;
    function set(k,v){ setF(prev=>({...prev,[k]:v})); }
    function isAdmin(){ try{ const r=(window.Feraytek && window.Feraytek.usuario && window.Feraytek.usuario.rol)||""; return /admin|superadmin/i.test(String(r)); }catch{ return false; } }
    function ensureLogin(orMsg){ try{ if(window.Feraytek && typeof window.Feraytek.requireLogin==="function"){ const ok = window.Feraytek.requireLogin(()=>{}); if(!ok){ setErr(orMsg||"Debes iniciar sesión"); return false; } } }catch{} return true; }
    async function submit(e){
      e&&e.preventDefault(); setMsg(null);
      if(!ensureLogin("Debes iniciar sesión para crear tickets")) return;
      const asunto = String(f.asunto||"").trim();
      const descripcion = String(f.descripcion||"").trim();
      const prioridad = String(f.prioridad||"media").toLowerCase();
      if(!asunto || !descripcion){ notify({type:"error",text:"Completa asunto y descripción"}); return; }
      try{
        await window.SupportController.create({ asunto, descripcion, prioridad });
        notify({type:"ok",text:"Ticket creado"});
        setF({ asunto:"", descripcion:"", prioridad });
        await load();
      }catch(e){
        const det = Array.isArray(e.detalles)? (" "+e.detalles.join(". ")) : "";
        const txt = e.message || e.error || "No se pudo crear";
        notify({type:"error",text: txt+det});
      }
    }
    async function load(){
      setLoading(true); setErr(null);
      if(!ensureLogin("Debes iniciar sesión")){ setLoading(false); return; }
      try{
        const res = await window.SupportController.myTickets();
        const data = res.items||res.data||res.tickets||res.results||res;
        const filtered = Array.isArray(data)? data.filter(t=>{ const s=String(t.asunto||t.subject||"").toLowerCase(); if(!isAdmin() && s.includes("problema con mi pedido")) return false; return true; }) : [];
        setItems(filtered);
        setListPage(1);
      }catch(e){ setErr(e.message||"Error al cargar reclamos"); setItems([]); }
      finally{ setLoading(false); }
    }
    
    useEffect(()=>{ load(); },[]);
    function badge(st){
      const s = String(st||"").toLowerCase();
      const cls = s.includes("cerrado")?"ok":(s.includes("pend")?"warning":"info");
      return React.createElement("span",{className:"chip"+ (cls==="ok"?" active":"")}, st||"Sin estado");
    }
    function row(t){
      const id = t.id||t.id_soporte||t.soporte_id;
      const asunto = t.asunto||t.subject||"(Sin asunto)";
      const estado = t.estado||t.status||"Pendiente";
      const prio = t.prioridad||t.priority||"media";
      const fecha = t.creado_en||t.created_at||t.fecha||"";
      const respuesta = t.respuesta||t.response||t.admin_respuesta||t.comentario_admin||t.reply||"";
      const hasRespuesta = !!String(respuesta||"").trim();
      const esperaMsg = "Tu reclamo será contestado a la brevedad";
      return React.createElement("div",{className:"product-card"},
        React.createElement("div",{className:"info"},
          React.createElement("div",{className:"name"},asunto),
          React.createElement("div",{className:"price"},`Prioridad: ${prio}`),
          React.createElement("div",null, `Estado: ${estado}`),
          React.createElement("div",{className:"desc"}, hasRespuesta? respuesta : esperaMsg)
        )
      );
    }
    function openList(){ setShowList(true); }
    function closeList(){ setShowList(false); }
    function totalPages(){ return Math.max(1, Math.ceil((items||[]).length / pageSize)); }
    function nextPage(){ setListPage(p=> Math.min(totalPages(), p+1)); }
    function prevPage(){ setListPage(p=> Math.max(1, p-1)); }
    const start = (listPage-1)*pageSize; const pageItems = items.slice(start, start+pageSize);
    return (
      React.createElement("div",{className:"catalog"},
        React.createElement(window.Feraytek.Header,{}),
        React.createElement("h1",{className:"page-title"},"Soporte y Reclamos"),
        msg?React.createElement("div",{className:`msg ${msg.type}`},msg.text):null,
        React.createElement("form",{className:"card",onSubmit:submit},
          React.createElement("div",{className:"grid one"},
            React.createElement("div",{className:"field"},React.createElement("label",null,"Asunto"),React.createElement("input",{className:"input",value:f.asunto,onChange:e=>set("asunto",e.target.value)})),
            React.createElement("div",{className:"field"},React.createElement("label",null,"Descripción"),React.createElement("textarea",{className:"input",rows:5,value:f.descripcion,onChange:e=>set("descripcion",e.target.value)})),
            React.createElement("div",{className:"field"},React.createElement("label",null,"Prioridad"),React.createElement("select",{className:"input",value:f.prioridad,onChange:e=>set("prioridad",e.target.value)},
              React.createElement("option",{value:"alta"},"Alta"),
              React.createElement("option",{value:"media"},"Media"),
              React.createElement("option",{value:"baja"},"Baja")
            ))
          ),
          React.createElement("div",{className:"action-bar"},
            React.createElement("button",{className:"btn secondary",type:"button",onClick:()=>setF({ asunto:"", descripcion:"", prioridad:"media" })},"Limpiar"),
            React.createElement("button",{className:"btn primary",type:"submit"},"Crear ticket"),
            React.createElement("button",{className:"btn secondary",type:"button",onClick:openList,style:{marginLeft:"8px"}},"Ver mis reclamos")
          )
        ),
        null,
        null,
        null,
        showList?React.createElement("div",{className:"modal-backdrop"},
          React.createElement("div",{className:"modal-card"},
            React.createElement("div",{className:"modal-title"},"Mis reclamos"),
            err?React.createElement("div",{className:"msg error"},err):null,
            loading?React.createElement("div",{className:"loading"},"Cargando..."):
            React.createElement("div",{className:"list"}, pageItems.map((t,i)=>React.createElement("div",{key:(t.id||t.id_soporte||i)}, row(t))) ),
            React.createElement("div",{className:"modal-actions"},
              React.createElement("div",{className:"row"},
                React.createElement("button",{className:"btn secondary",onClick:prevPage,disabled:listPage<=1},"Anterior"),
                React.createElement("div",{style:{padding:"8px 12px"}},`${listPage} / ${totalPages()}`),
                React.createElement("button",{className:"btn secondary",onClick:nextPage,disabled:listPage>=totalPages()},"Siguiente"),
                React.createElement("button",{className:"btn primary",onClick:closeList,style:{marginLeft:"12px"}},"Cerrar")
              )
            )
          )
        ):null
      )
    );
  }
  window.Feraytek = window.Feraytek || {};
  window.Feraytek.Support = Support;
})();

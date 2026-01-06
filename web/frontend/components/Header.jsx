(function(){
  const { useState, useEffect } = React;
  function Header({ onUserClick, onCartClick, onFavClick, onNavHome, onNavProducts, onNavOffers, onNavContact, onNavSupport, onNavOrders, onSearchChange, onSearchSubmit }){
    const [open,setOpen] = useState(false);
    const [q,setQ] = useState("");
    const [sugg,setSugg] = useState([]);
    const [showSugg,setShowSugg] = useState(false);
    const [deb,setDeb] = useState(null);
    const [selIdx,setSelIdx] = useState(-1);
    const [curr,setCurr] = useState((window.Feraytek && window.Feraytek.route) || "");
    const [logoOk,setLogoOk] = useState(true);
    const [cats,setCats] = useState(["Todos"]);
    const [cat,setCat] = useState((window.Feraytek && window.Feraytek.category) || "Todos");
    useEffect(()=>{ try{ document.body.style.overflow = open?"hidden":""; }catch{} return ()=>{ try{ document.body.style.overflow=""; }catch{} }; },[open]);
    useEffect(()=>{ function onRoute(ev){ const r=(ev&&ev.detail&&ev.detail.route)||""; setCurr(r); setShowSugg(false); } window.addEventListener("feraytek:route", onRoute); return ()=> window.removeEventListener("feraytek:route", onRoute); },[]);
    function goHome(){ if(onNavHome) onNavHome(); else if(window.Feraytek && typeof window.Feraytek.go==="function") window.Feraytek.go("landing"); setOpen(false); }
    function goProducts(){ if(onNavProducts) onNavProducts(); else if(window.Feraytek && typeof window.Feraytek.go==="function") window.Feraytek.go("catalog"); setOpen(false); }
    function goOffers(){ if(onNavOffers) onNavOffers(); else if(window.Feraytek && typeof window.Feraytek.go==="function") window.Feraytek.go("offers"); setOpen(false); }
    function goContact(){ if(onNavContact) onNavContact(); else if(window.Feraytek && typeof window.Feraytek.go==="function") window.Feraytek.go("contact"); setOpen(false); }
    function goSupport(){ if(onNavSupport) onNavSupport(); else if(window.Feraytek && typeof window.Feraytek.go==="function") window.Feraytek.go("support"); setOpen(false); }
    function goOrders(){
      if(onNavOrders){ onNavOrders(); setOpen(false); return; }
      try{
        if(window.Feraytek && typeof window.Feraytek.requireLogin === "function"){
          const ok = window.Feraytek.requireLogin(()=>window.Feraytek.go("orders"));
          if(!ok){ setOpen(false); return; }
        } else if(window.Feraytek && typeof window.Feraytek.go === "function") {
          window.Feraytek.go("orders");
        }
      } finally { setOpen(false); }
    }
    function goProfile(){
      if(onUserClick){ onUserClick(); setOpen(false); return; }
      try{
        if(window.Feraytek && typeof window.Feraytek.requireLogin === "function"){
          const ok = window.Feraytek.requireLogin(()=>window.Feraytek.go("profile"));
          if(!ok){ setOpen(false); return; }
        } else if(window.Feraytek && typeof window.Feraytek.go === "function"){
          window.Feraytek.go("profile");
        }
      } finally { setOpen(false); }
    }
    function goCart(){ if(onCartClick) onCartClick(); else if(window.Feraytek && typeof window.Feraytek.go==="function") window.Feraytek.go("cart"); setOpen(false); }
    function goFav(){
      if(onFavClick) { onFavClick(); setOpen(false); return; }
      try{
        if(window.Feraytek && typeof window.Feraytek.requireLogin === "function"){
          const ok = window.Feraytek.requireLogin(()=>window.Feraytek.go("favorites"));
          if(!ok){ setOpen(false); return; }
        } else if(window.Feraytek && typeof window.Feraytek.go === "function") {
          window.Feraytek.go("favorites");
        }
      }finally{ setOpen(false); }
    }
    function normCat(v){
      if(v==null) return "";
      const s = String(v||"").trim().toLowerCase();
      if(["smartphone","celular","celulares"].includes(s) || /phone/.test(s)) return "Celulares";
      if(s.includes("tablet")) return "Tablet";
      if(["audio","auriculares","parlantes"].includes(s)) return "Audio";
      if(["accesorios","accesorio","accessories"].includes(s)) return "Accesorios";
      if(["electronica","electrónica","electronics"].includes(s)) return "Electrónica";
      if(["ofertas","promo","promociones"].includes(s)) return "Ofertas";
      return s? s.charAt(0).toUpperCase()+s.slice(1) : "";
    }
    function catNameOf(item){
      if(item==null) return "";
      if(typeof item === "string") return item;
      if(typeof item === "number") return String(item);
      const raw = item.nombre||item.name||item.slug||item.categoria||item.categoria_nombre||item.nombre_categoria||item.title||item.titulo||item.tipo||item.seccion;
      return raw!=null?String(raw):"";
    }
    useEffect(()=>{
      (async()=>{
        try{
          const res = await window.ProductController.categories();
          const list = res.items||res.data||res||[];
          const uniq=[];
          (Array.isArray(list)?list:[]).forEach(it=>{
            const nm = catNameOf(it);
            const s = normCat(nm);
            if(s && !uniq.includes(s)) uniq.push(s);
          });
          const out=["Todos",...uniq];
          setCats(out);
          const g=(window.Feraytek&&window.Feraytek.category)||"Todos";
          if(out.includes(g)) setCat(g);
        }catch{}
      })();
    },[]);
    function onCatChange(v){
      setCat(v);
      try{ window.Feraytek.category = v; window.dispatchEvent(new CustomEvent("feraytek:category",{ detail:{ category:v } })); if(window.Feraytek && typeof window.Feraytek.go==="function") window.Feraytek.go("catalog"); }catch{}
    }
    function clean(s){ try{ return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,""); }catch{ return String(s||"").toLowerCase(); } }
    function score(name,q){ try{ const n=clean(name), qq=clean(q); if(!qq||!n) return 0; if(n.startsWith(qq)) return 100; if(n.includes(qq)) return 70; if(qq.length<=2){ let i=0; for(let c of qq){ const idx=n.indexOf(c,i); if(idx<0) return 0; i=idx+1; } return 50; } return 0; }catch{ return 0; } }
    const expansions = { ip:["iphone","ipad"], sams:["samsung"], sam:["samsung"], note:["notebook","note"], len:["lenovo"], mac:["mac","macbook"], vib:["vivobook"], nob:["noblex"] };
    async function lookup(term){
      try{
        const v = String(term||"").trim();
        if(v.length<2){ setSugg([]); setShowSugg(false); return; }
        const resA = await (window.ProductController && window.ProductController.list? window.ProductController.list({ page:1, limit:12, q:v }) : Promise.resolve([]));
        const dataA = resA.data||resA.items||resA.productos||resA.results||resA||[];
        let pool = Array.isArray(dataA)?dataA:[];
        if(pool.length<6){
          try{
            const resB = await window.ProductController.list({ page:1, limit:100 });
            const dataB = resB.data||resB.items||resB.productos||resB.results||resB||[];
            pool = [...pool, ...(Array.isArray(dataB)?dataB:[])];
          }catch{}
        }
        const toks = [v];
        const cv = clean(v);
        Object.keys(expansions).forEach(k=>{ if(cv.length<=2 && (cv.startsWith(k) || cv.includes(k))) expansions[k].forEach(w=> toks.push(w)); });
        const seen = new Set();
        const scored = (pool||[]).map(p=>{
          const id = p.id||p.id_producto||p.producto_id||p.idProducto; const name = p.nombre||p.title||p.name||"Producto"; const s = Math.max(...toks.map(t=> score(name,t)));
          return { id, name, s };
        }).filter(x=> x.id!=null && x.s>0 && !seen.has(x.id) && seen.add(x.id)).sort((a,b)=> b.s - a.s || String(a.name).localeCompare(String(b.name)));
        const strict = cv.length<=2;
        const filtered = strict? scored.filter(x=>{
          const n = clean(x.name);
          if(n.startsWith(cv)) return true;
          const okPref = toks.some(t=>{ const tt = clean(t); return tt && tt.startsWith(cv) && n.startsWith(tt); });
          if(okPref) return true;
          const words = String(x.name||"").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
          const qq = String(v).trim().toLowerCase();
          return words.some(w=> w.startsWith(qq));
        }) : scored;
        const top = filtered.slice(0,10);
        setSugg(top.map(x=>({ id:x.id, name:x.name }))); setSelIdx(top.length?0:-1); setShowSugg(true);
      }catch{ setSugg([]); setShowSugg(false); }
    }
    function onSearchInput(v){
      setQ(v);
      if(onSearchChange) onSearchChange(v);
      try{ if(deb) clearTimeout(deb); }catch{}
      const t = setTimeout(()=> lookup(v), 200);
      setDeb(t);
      if(!v || !v.trim()){ try{ window.Feraytek.searchQ = ""; window.dispatchEvent(new CustomEvent("feraytek:search",{ detail:{ q:"" } })); if(window.Feraytek && typeof window.Feraytek.go==="function") window.Feraytek.go("catalog"); }catch{} setShowSugg(false); }
    }
    function submit(){ if(onSearchSubmit) { onSearchSubmit(q); } else { try{ window.Feraytek.searchQ = q; window.dispatchEvent(new CustomEvent("feraytek:search",{ detail:{ q } })); if(window.Feraytek && typeof window.Feraytek.go==="function") window.Feraytek.go("catalog"); }catch{} setShowSugg(false); setSelIdx(-1); } }
    function pickSuggestion(id){ try{ if(window.Feraytek && typeof window.Feraytek.go==="function"){ window.Feraytek.go("product",{ id }); } }catch{} setShowSugg(false); }
    function highlight(name){ try{ const v=String(q||"").trim().toLowerCase(); const n=String(name||""); if(!v||!n.toLowerCase().includes(v)) return n; const i=n.toLowerCase().indexOf(v); return React.createElement(React.Fragment,null, n.slice(0,i), React.createElement("span",{className:"match"}, n.slice(i,i+v.length) ), n.slice(i+v.length) ); }catch{ return name; } }
    function link(label,fn){ return React.createElement("a",{className:"menu-link",onClick:fn},label); }
    function cls(name){ return "menu-item" + (name?" ":"") + (name&&((name==="landing"&&curr==="landing")||(name==="catalog"&&(curr==="catalog"||curr==="product"))||(name==="offers"&&curr==="offers")||(name==="orders"&&curr==="orders")||(name==="contact"&&curr==="contact")||(name==="support"&&curr==="support"))?"active":""); }
    return (
      React.createElement(React.Fragment,null,
        React.createElement("div",{className:"header" + (open?" open":"")},
          React.createElement("button",{className:"hamburger",onClick:()=>setOpen(o=>!o),title:"Menú","aria-label":"Abrir menú"},
            React.createElement("span",null),React.createElement("span",null),React.createElement("span",null)
          ),
          React.createElement("button",{className:"logo",onClick:goHome,title:"Feraytek"},
            logoOk?React.createElement("img",{className:"logo-pic",src:(window.Feraytek&&window.Feraytek.brandLogo)||"/img/logo1.jpeg",alt:"Feraytek",onError:()=>setLogoOk(false)}):null,
            React.createElement("span",{className:"logo-title"},"Feraytek")
          ),
          React.createElement("nav",{className:"menu"},
            React.createElement("a",{className:cls("landing"),onClick:goHome},"Inicio"),
            React.createElement("a",{className:cls("catalog"),onClick:goProducts},"Productos"),
            React.createElement("a",{className:cls("offers"),onClick:goOffers},"Ofertas"),
            React.createElement("a",{className:cls("orders"),onClick:goOrders},"Mis pedidos"),
            React.createElement("a",{className:cls("contact"),onClick:goContact},"Contacto"),
            React.createElement("a",{className:cls("support"),onClick:goSupport},"Soporte")
          ),
          React.createElement("div",{className:"tools"},
            React.createElement("div",{className:"search"},
              React.createElement("svg",{className:"ico",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M10 18a8 8 0 100-16 8 8 0 000 16zm8.7-1.3l-3.5-3.5-1.4 1.4 3.5 3.5 1.4-1.4z"})),
              React.createElement("input",{placeholder:"Buscar",className:"search-input",value:q,onChange:e=> onSearchInput(e.target.value),onKeyDown:e=>{ if(e.key==="Enter"){ if(showSugg && selIdx>=0 && sugg[selIdx]){ pickSuggestion(sugg[selIdx].id); } else { submit(); } } else if(e.key==="ArrowDown"){ if(showSugg){ setSelIdx(i=> Math.min((i<0?0:i+1), sugg.length-1)); } } else if(e.key==="ArrowUp"){ if(showSugg){ setSelIdx(i=> Math.max((i<=0?0:i-1), 0)); } } else if(e.key==="Escape"){ setShowSugg(false); setSelIdx(-1); } },onFocus:()=>{ if((sugg||[]).length) setShowSugg(true); },onBlur:()=>{ setTimeout(()=>setShowSugg(false),150); }}),
              (showSugg&&sugg.length? React.createElement("div",{className:"suggest-box"},
                sugg.map((s,idx)=> React.createElement("button",{key:(s.id||s.name),className:"suggest-item"+(idx===selIdx?" active":""),onMouseDown:(ev)=>{ev.preventDefault();pickSuggestion(s.id);} },
                  React.createElement("span",{className:"sugg-text"}, highlight(s.name) )
                ))
              ):null)
            ),
            React.createElement("select",{className:"search-cat",value:cat,onChange:e=>onCatChange(e.target.value)},
              cats.map(c=>React.createElement("option",{key:c,value:c},c))
            ),
            React.createElement("button",{className:"icon-btn",title:"Mi cuenta",onClick:goProfile},
              React.createElement("svg",{className:"ico",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M12 12a5 5 0 1 0-0.001-10.001A5 5 0 0 0 12 12zm0 2c-4.418 0-8 2.239-8 5v2h16v-2c0-2.761-3.582-5-8-5z"}))
            ),
            React.createElement("button",{className:"icon-btn",title:"Carrito",onClick:goCart},
              React.createElement("svg",{className:"ico",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M3 4h2l2 12h10l2-8H7"}))
            ),
            React.createElement("button",{className:"icon-btn",title:"Favoritos",onClick:goFav},
              React.createElement("svg",{className:"ico",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M12 21l-1.5-1.3C6 16 4 13.8 4 11a4 4 0 014-4c1.6 0 3 .8 4 2 1-1.2 2.4-2 4-2a4 4 0 014 4c0 2.8-2 5-6.5 8.7L12 21z"}))
            )
          )
        ),
        React.createElement("div",{className:"drawer-backdrop" + (open?" open":""),onClick:()=>setOpen(false)}),
        React.createElement("div",{className:"mobile-drawer" + (open?" open":""),role:"menu"},
          React.createElement("div",{className:"drawer-top"},
            React.createElement("button",{className:"drawer-close",onClick:()=>setOpen(false),"aria-label":"Cerrar menú"},
              React.createElement("svg",{className:"ico",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M6 6l12 12M18 6L6 18",stroke:"currentColor",strokeWidth:2,fill:"none",strokeLinecap:"round"}))
            )
          ),
          React.createElement("div",{className:"menu-list"},
            link("Inicio",goHome),
            link("Productos",goProducts),
            link("Ofertas",goOffers),
            link("Mis pedidos",goOrders),
            link("Contacto",goContact),
            link("Soporte",goSupport),
            link("Perfil",goProfile),
            link("Carrito",goCart),
            link("Favoritos",goFav)
          )
        )
      )
    );
  }
  window.Feraytek = window.Feraytek || {};
  window.Feraytek.Header = Header;
})();

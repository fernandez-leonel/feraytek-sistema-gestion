// Catálogo de productos (frontend)
// Responsabilidad: listar y filtrar productos consumiendo ProductController


(function(){
  const { useState, useEffect } = React;

  function Catalog({ onViewProduct, onGoCart, initialCategory }){
    const [items,setItems] = useState([]);
    const [all,setAll] = useState([]);
    const [cats,setCats] = useState(["Todos"]);
    const [cat,setCat] = useState(initialCategory||"Todos");
    const [q,setQ] = useState("");
    const [loading,setLoading] = useState(false);
    const [err,setErr] = useState(null);
    const [msg,setMsg] = useState(null);

    function normCat(v){
      if(v==null) return "";
      const s=String(v).trim().toLowerCase();
      if(["smartphone","celular","celulares"].includes(s) || /phone/.test(s)) return "Celulares";
      if(s.includes("tablet")) return "Tablet";
      if(["audio","auriculares","parlantes"].includes(s)) return "Audio";
      if(["accesorios","accesorio","accessories"].includes(s)) return "Accesorios";
      if(["electronica","electrónica","electronics"].includes(s)) return "Electrónica";
      if(["ofertas","promo","promociones"].includes(s)) return "Ofertas";
      return s? s.charAt(0).toUpperCase()+s.slice(1) : "";
    }
    function catOf(p){
      const raw = p?.categoria||p?.category||p?.categoria_nombre||p?.nombre_categoria||p?.tipo||p?.seccion;
      return normCat(raw);
    }
    function filterItems(list,catName,query){
      const qv = String(query||"").trim().toLowerCase();
      return (Array.isArray(list)?list:[]).filter(p=>{
        const c = catOf(p);
        const okCat = !catName || catName==="Todos" || c===catName;
        if(!okCat) return false;
        if(!qv) return true;
        const name = String(p?.nombre||p?.title||p?.name||"").toLowerCase();
        return name.includes(qv);
      });
    }

    async function load(){
      setLoading(true); setErr(null);
      try{
        const res = await window.ProductController.list({ page:1, limit:24, q:q||undefined });
        const data = res.data||res.items||res.productos||res.results||res;
        const arr = Array.isArray(data)?data:[];
        setAll(arr);
        setItems(filterItems(arr,cat,q));
      }catch(e){
        setErr(e.message||"Error al cargar productos");
        setAll([]); setItems([]);
      }finally{ setLoading(false); }
    }
    useEffect(()=>{ setItems(filterItems(all,cat,q)); },[cat]);
    useEffect(()=>{
      const q0 = (window.Feraytek && window.Feraytek.searchQ) || "";
      if(q0){ setQ(q0); load(); }
      function onSearch(ev){ const next = (ev && ev.detail && ev.detail.q) || ""; setQ(next); load(); }
      window.addEventListener("feraytek:search", onSearch);
      function onCat(ev){ const next = (ev && ev.detail && ev.detail.category) || "Todos"; setCat(next); }
      window.addEventListener("feraytek:category", onCat);
      return ()=> { window.removeEventListener("feraytek:search", onSearch); window.removeEventListener("feraytek:category", onCat); };
    },[]);
    useEffect(()=>{ load(); },[q]);
    useEffect(()=>{
      (async()=>{
        try{
          const res = await window.ProductController.categories();
          const list = res.items||res.data||res||[];
          const uniq=[];
          function add(v){ if(v!=null){ const s=normCat(v); if(s && !uniq.includes(s)) uniq.push(s); } }
          (Array.isArray(list)?list:[]).forEach(add);
          if(!uniq.includes("Tablet")) uniq.push("Tablet");
          setCats(["Todos",...uniq]);
          if(!uniq.includes(cat) && cat!=="Todos") setCat("Todos");
        }catch{}
      })();
    },[]);

    async function add(p){
      try{
        if(window.Feraytek && typeof window.Feraytek.requireLogin === "function"){
          const ok = window.Feraytek.requireLogin();
          if(!ok){ setMsg({type:"error",text:"Debes iniciar sesión para agregar al carrito"}); setTimeout(()=>setMsg(null),2000); return; }
        }
        const id = p.id_producto||p.idProducto||p.id||p.producto_id;
        let variante_id = p.variante_id||p.id_variante||p.variant_id;
        if((variante_id===undefined||variante_id===null) && Array.isArray(p.variantes) && p.variantes.length){
          const v0 = p.variantes[0];
          variante_id = v0?.id_variante||v0?.variante_id||v0?.id;
        }
        const precio_unitario = p.precio_base!=null? p.precio_base : (p.precio!=null? p.precio : (p.price!=null? p.price : 0));
        const iva_porcentaje = p.iva_porcentaje!=null? p.iva_porcentaje : (p.iva!=null? p.iva : 0);
        await window.CartController.add({ producto_id:id, cantidad:1, variante_id, precio:precio_unitario, precio_unitario, iva_porcentaje });
        setMsg({type:"ok",text:"Agregado al carrito"}); setTimeout(()=>setMsg(null),1600);
      }catch(e){ setMsg({type:"error",text:e.message||"No se pudo agregar"}); setTimeout(()=>setMsg(null),2000); }
    }
    function priceOf(p){
      if(p==null) return "";
      const base = p.precio_base!=null?p.precio_base:(p.precio!=null?p.precio:(p.price!=null?p.price:null));
      if(base!=null) return base;
      const vs = p.variantes||p.variations||p.opciones||p.skus||[];
      if(Array.isArray(vs)&&vs.length){
        const nums = vs.map(v=> (v.precio_base??v.precio??v.price) ).filter(x=> x!=null && !isNaN(Number(x)) ).map(Number);
        if(nums.length){ return Math.min(...nums); }
      }
      return "";
    }
    function Card({p}){
      const [frames,setFrames] = useState([]);
      const [idx,setIdx] = useState(0);
      const [hover,setHover] = useState(false);
      const [isMobile,setIsMobile] = useState( (typeof window!=="undefined" && window.innerWidth<=768) );
      const [fav,setFav] = useState(false);
      const base = (window.Feraytek && window.Feraytek.API && window.Feraytek.API.base) || "/api";
      function uniq(arr){ const u=[]; arr.forEach(s=>{ if(s && !u.includes(s)) u.push(s); }); return u; }
      useEffect(()=>{
        let mounted=true;
        (async()=>{
          const id = p.id||p.id_producto||p.idProducto||p.producto_id;
          let list=[]; try{ const r=await fetch(`${base}/imagenes_productos/producto/${id}?t=${Date.now()}`,{ cache:"no-store" }); const j=await r.json(); list = Array.isArray(j)?j:(j.items||j.data||[]); }catch{}
          const srv = list.map(x=> x?.url_imagen||x?.imagen_url||x?.foto_url).filter(Boolean);
          const main = p.url_imagen||p.imagen||p.image||p.img||"";
          const arr = uniq([main,...srv]).slice(0,3);
          if(mounted){ setFrames(arr); setIdx(0); }
        })();
        try{ if(window.FavoritesController){ const id0 = p.id||p.id_producto||p.idProducto||p.producto_id; setFav(window.FavoritesController.isFav(id0)); } }catch{}
        return ()=>{ mounted=false; };
      },[p]);
      useEffect(()=>{
        function onResize(){ setIsMobile( window.innerWidth<=768 ); }
        window.addEventListener("resize", onResize);
        return ()=> window.removeEventListener("resize", onResize);
      },[]);
      useEffect(()=>{
        if(!(hover || isMobile) || frames.length<=1) return;
        const period = isMobile?1600:900;
        const t = setInterval(()=> setIdx(i=> (i+1)%frames.length ), period);
        return ()=> clearInterval(t);
      },[hover,isMobile,frames]);
      const img = frames[idx] || p.url_imagen||p.imagen||p.image||p.img||"https://placehold.co/600x400?text=Producto";
      const name = p.nombre||p.title||p.name||"Producto";
      const price = priceOf(p);
      const vs = p.variantes||p.variations||p.opciones||p.skus||[];
      const chips = Array.isArray(vs)?vs.slice(0,3).map((v,i)=>{
        const nm = v?.nombre||v?.name||v?.descripcion||"Variante";
        const pr = v?.precio_base??v?.precio??v?.price;
        const txt = pr!=null?`${nm} · $${pr}`:nm;
        return React.createElement("span",{key:i,className:"var-chip"},txt);
      }):[];
      const extra = Array.isArray(vs)&&vs.length>3?React.createElement("span",{className:"var-chip more"},`+${vs.length-3}`):null;
      const pid = p.id||p.id_producto||p.idProducto||p.producto_id;
      const wrapClass = "img-wrap hoverable" + ((hover||isMobile)?" hovering":"");
      return React.createElement("div",{className:"product-card"},
        React.createElement("button",{className:"fav-btn"+(fav?" active":""),title:"Favorito",onClick:(ev)=>{ev.stopPropagation(); if(window.FavoritesController){ window.FavoritesController.toggle(p); setFav(window.FavoritesController.isFav(pid)); } else { setFav(v=>!v); } }},
          React.createElement("svg",{className:"ico",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M12 21l-1.5-1.3C6 16 4 13.8 4 11a4 4 0 014-4c1.6 0 3 .8 4 2 1-1.2 2.4-2 4-2a4 4 0 014 4c0 2.8-2 5-6.5 8.7L12 21z"}))
        ),
        React.createElement("div",{className:wrapClass,onMouseEnter:()=>setHover(true),onMouseLeave:()=>{setHover(false);setIdx(0);},onTouchStart:()=>setHover(true),onTouchEnd:()=>{setHover(false);setIdx(0);},onClick:()=>onViewProduct&&onViewProduct(pid)},
          React.createElement("img",{src:img,alt:name,onError:(e)=>{try{const u=new URL(e.target.src);if(u.pathname.endsWith(".jpg")){u.pathname=u.pathname.replace(/\.jpg$/,".png");e.target.src=u.toString();return;} }catch{} e.target.src="https://placehold.co/600x400?text=Producto";}}),
          (isMobile?React.createElement("div",{className:"img-overlay"},
            React.createElement("button",{className:"cart-overlay-btn",title:"Agregar al carrito",onClick:(ev)=>{ev.stopPropagation();add(p);}},
              React.createElement("svg",{viewBox:"0 0 24 24",width:30,height:30,fill:"currentColor"},
                React.createElement("path",{d:"M7 18a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4zM6 6h13l-1.2 6H8.3L7.6 9H4V7h2l.6-3H6zm2.8 7h9.3l1.4-7H7.6l-1 5h2.2z"})
              )
            )
          ):null)
        ),
        React.createElement("div",{className:"info"},
          React.createElement("div",{className:"name"},name),
          React.createElement("div",{className:"price"}, price!==""?`$${price}`:"")
        ),
        chips.length?React.createElement("div",{className:"var-chips"},[...chips,extra].filter(Boolean)):null,
        React.createElement("div",{className:"actions"},
          (!isMobile?React.createElement("button",{className:"btn secondary",onClick:()=>add(p)},"Agregar al carrito"):null),
          (!isMobile?React.createElement("button",{className:"btn primary",onClick:()=>onViewProduct&&onViewProduct(pid)},"Ver detalles"):null)
        )
      );
    }

    return (
      React.createElement("div",{className:"catalog"},
        React.createElement(window.Feraytek.Header,{onNavProducts:()=>{},onUserClick:()=>{ if(window.Feraytek && typeof window.Feraytek.requireLogin==="function"){ window.Feraytek.requireLogin(()=>window.Feraytek.go("profile")); } else if(window.Feraytek){ window.Feraytek.go("profile"); } },onCartClick:onGoCart,onFavClick:()=>{ if(window.Feraytek){ if(typeof window.Feraytek.requireLogin === "function"){ window.Feraytek.requireLogin(()=>window.Feraytek.go("favorites")); } else { window.Feraytek.go("favorites"); } } }}),
        React.createElement("div",{className:"catalog-top"},
          React.createElement("h1",{className:"page-title"},"Catálogo")
        ),
        err?React.createElement("div",{className:"msg error"},err):null,
        msg?React.createElement("div",{className:`msg ${msg.type}`},msg.text):null,
        loading?React.createElement("div",{className:"loading"},"Cargando..."):
        React.createElement("div",{className:"catalog-grid"},
          items.map(p=>React.createElement("div",{key:(p.id||p.id_producto||p.idProducto||p.nombre)},React.createElement(Card,{p})))
        )
      )
    );
  }

  window.Feraytek = window.Feraytek || {};
  window.Feraytek.Catalog = Catalog;
})();

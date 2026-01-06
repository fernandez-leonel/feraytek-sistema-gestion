;(function(){
  const { useState, useEffect } = React;
  function Cart({ onBack }){
    const [items,setItems]=useState([]);
    const [loading,setLoading]=useState(false);
    const [err,setErr]=useState(null);
    const [open,setOpen]=useState(false);
    const [ship,setShip]=useState({ direccion:"", ciudad:"", provincia:"", pais:"", codigo_postal:"", telefono:"", metodo:"" });
    const [metodos,setMetodos]=useState([]);

    useEffect(()=>{
      let mounted = true;
      (async()=>{
        setLoading(true); setErr(null);
        try{
          const res = await window.CartController.get();
          const data = res.items||res.data||res.carrito||res;
          const arr = Array.isArray(data)?data:(Array.isArray(data?.items)?data.items:[]);
          const enriched = await enrichItems(arr);
          if(mounted) setItems(enriched);
          try{ const cfg = await window.CartController.shippingMethods(); const list = cfg.data||cfg.metodos||cfg; if(mounted) setMetodos(Array.isArray(list)?list:[]); }catch{}
        }catch(e){ if(mounted){ setErr(e.message||"Error al cargar carrito"); setItems([]); } }
        if(mounted) setLoading(false);
      })();
      async function onUpdated(ev){ const data = ev.detail; const arr = Array.isArray(data)?data:(Array.isArray(data?.items)?data.items:[]); const enriched = await enrichItems(Array.isArray(arr)?arr:[]); setItems(enriched); }
      window.addEventListener("feraytek:cart-updated", onUpdated);
      return ()=>{ mounted=false; window.removeEventListener("feraytek:cart-updated", onUpdated); };
    },[]);

    function getApiBase(){ const cfg=(typeof window!=="undefined"&&window.Feraytek&&window.Feraytek.API)||{}; return cfg.base||"/api"; }
    function priceOf(it){ const p = it.precio_base??it.precio??it.price??0; return Number(p); }
    function ivaPct(it){ const v = it.iva_porcentaje??it.iva??0; return Number(v)||0; }
    const totals = items.reduce((acc,it)=>{ const q=Number(it.cantidad||1); const p=priceOf(it); const iva=ivaPct(it); const sub=p*q; const ivaVal=sub*(iva/100); acc.sub+=sub; acc.iva+=ivaVal; acc.total+=sub+ivaVal; return acc; },{sub:0,iva:0,total:0});

    async function setQty(it,q){
      const id_producto=it.id_producto||it.producto_id||it.id||it.idProducto;
      let id_variante=it.id_variante||it.variante_id||it.variant_id; if(id_variante===0||id_variante==="0"||id_variante===undefined) id_variante=null;
      const next=Math.max(1,q);
      const current=Number(it.cantidad||1);
      const precio_unitario = priceOf(it);
      const iva_porcentaje = ivaPct(it);
      try{
        await window.CartController.update({ id_producto, id_variante, precio_unitario, iva_porcentaje, cantidad: current }, next, { silent:true });
        setItems(prev=>prev.map(x=> (x===it? {...x,cantidad:next } : x)));
      }catch(e){ setErr(e.message||"No se pudo actualizar cantidad"); }
    }
    async function remove(it){ const id_producto=it.id_producto||it.producto_id||it.id||it.idProducto; let id_variante=it.id_variante||it.variante_id||it.variant_id; if(id_variante===0||id_variante==="0"||id_variante===undefined) id_variante=null; try{ await window.CartController.remove({ id_producto, id_variante }); setItems(prev=>prev.filter(x=>x!==it)); }catch(e){ setErr(e.message||"No se pudo eliminar"); } }
    async function confirm(){ const payload={ envio:{...ship}, items: items.map(x=>({ id:x.id_producto||x.producto_id||x.id, cantidad:x.cantidad })) }; try{ await window.CartController.checkout(payload); setOpen(false); }catch(e){ setErr(e.message||"No se pudo confirmar"); } }

    async function primaryImage(id){
      try{
        const base = getApiBase();
        const r = await fetch(`${base}/imagenes_productos/producto/${id}?t=${Date.now()}`,{ cache:"no-store" });
        const j = await r.json();
        const arr = Array.isArray(j)?j:(j.items||j.data||[]);
        const first = Array.isArray(arr)&&arr.length?arr[0]:null;
        return first && (first.url_imagen||first.imagen_url||first.foto_url) || "";
      }catch{ return ""; }
    }
    async function enrichItems(arr){
      const baseImg = (window.Feraytek && window.Feraytek.IMAGES && window.Feraytek.IMAGES.base) || "";
      const tasks = (Array.isArray(arr)?arr:[]).map(async it=>{
        const nested = it.producto||{};
        const id = it.id_producto||it.producto_id||it.id||it.idProducto||nested.id||nested.id_producto||nested.producto_id;
        const main = it.url_imagen||it.imagen||it.image||it.img||nested.url_imagen||nested.imagen||nested.image||nested.img||"";
        let img = main;
        if(!img && id!=null){
          img = await primaryImage(id);
          if(!img && baseImg){ img = `${baseImg}/productos/${id}.jpg`; }
        }
        return { ...it, imagen: img || it.imagen || it.image || it.img || "" };
      });
      return await Promise.all(tasks);
    }
    function itemRow(it){
      const img = it.imagen||it.image||it.img||"https://placehold.co/120x90?text=IMG";
      const name = it.nombre||it.title||it.name||"Producto";
      const varTxt = it.variante||it.variacion||it.variant||"";
      const p = priceOf(it); const iva = ivaPct(it);
      const q = Number(it.cantidad||1);
      const sub = p*q; const ivaVal = sub*(iva/100); const total = sub+ivaVal;
      return React.createElement("div",{className:"cart-item"},
        React.createElement("div",{className:"ci-img"},React.createElement("img",{src:img,alt:name,onError:(e)=>{ try{ const u=new URL(e.target.src); if(u.pathname.endsWith(".jpg")){ u.pathname=u.pathname.replace(/\.jpg$/,".png"); e.target.src=u.toString(); return; } }catch{} e.target.src="https://placehold.co/120x90?text=IMG"; }})),
        React.createElement("div",{className:"ci-info"},
          React.createElement("div",{className:"ci-name"},name),
          React.createElement("div",{className:"ci-var"},varTxt)
        ),
        React.createElement("div",{className:"ci-price"},`$${p}`),
        React.createElement("div",{className:"ci-iva"},`${iva}%`),
        React.createElement("div",{className:"ci-qty"},
          React.createElement("button",{className:"btn secondary",onClick:()=>setQty(it,q-1)},"-"),
          React.createElement("span",{className:"qty-num"},q),
          React.createElement("button",{className:"btn secondary",onClick:()=>setQty(it,q+1)},"+")
        ),
        React.createElement("div",{className:"ci-sub"},`$${total.toFixed(2)}`),
        React.createElement("div",{className:"ci-actions"},
          React.createElement("button",{className:"icon-btn",title:"Eliminar",onClick:()=>remove(it)},
            React.createElement("svg",{className:"ico",viewBox:"0 0 24 24",fill:"currentColor"},
              React.createElement("path",{d:"M6 7h12v2H6zm2 4h8v8H8z M10 2h4l1 2h4v2H5V4h4l1-2z"})
            )
          )
        )
      );
    }

    const header = React.createElement("div",{className:"cart-item cart-head"},
      React.createElement("div",{className:"ci-img"},"Imagen"),
      React.createElement("div",{className:"ci-info"},"Producto"),
      React.createElement("div",{className:"ci-price"},"Precio"),
      React.createElement("div",{className:"ci-iva"},"IVA"),
      React.createElement("div",{className:"ci-qty"},"Cantidad"),
      React.createElement("div",{className:"ci-sub"},"Total"),
      React.createElement("div",{className:"ci-actions"},"")
    );
    const list = React.createElement("div",{className:"cart-list"}, header, items.map((it,i)=>React.createElement("div",{key:i}, itemRow(it))));
    const summary = React.createElement("div",{className:"cart-summary"},
      React.createElement("div",{className:"row"},React.createElement("div",null,"Subtotal"),React.createElement("div",null,`$${totals.sub.toFixed(2)}`)),
      React.createElement("div",{className:"row"},React.createElement("div",null,"IVA"),React.createElement("div",null,`$${totals.iva.toFixed(2)}`)),
      React.createElement("div",{className:"row"},React.createElement("div",{style:{fontWeight:700}},"Total"),React.createElement("div",{style:{fontWeight:700}},`$${totals.total.toFixed(2)}`)),
      React.createElement("div",{className:"action-bar"},
        React.createElement("button",{className:"btn secondary",onClick:onBack},"Seguir comprando"),
        React.createElement("button",{className:"btn primary",onClick:()=>{ if(window.Feraytek) window.Feraytek.go("checkout"); }},"Finalizar compra")
      )
    );
    const content = items.length ? React.createElement("div",null,list,summary) : React.createElement("div",{className:"msg"},"Tu carrito está vacío");

    return React.createElement("div",{className:"cart-page"},
      React.createElement(window.Feraytek.Header,{onNavProducts:()=>{},onUserClick:()=>{ if(window.Feraytek && typeof window.Feraytek.requireLogin==="function"){ window.Feraytek.requireLogin(()=>window.Feraytek.go("profile")); } else if(window.Feraytek){ window.Feraytek.go("profile"); } },onCartClick:()=>{},onFavClick:()=>{ if(window.Feraytek){ if(typeof window.Feraytek.requireLogin === "function"){ window.Feraytek.requireLogin(()=>window.Feraytek.go("favorites")); } else { window.Feraytek.go("favorites"); } } }}),
      React.createElement("div",{className:"cart-wrap"},
        React.createElement("h1",{className:"page-title"},"Carrito"),
        err?React.createElement("div",{className:"msg error"},err):null,
        loading?React.createElement("div",{className:"loading"},"Cargando..."):content
      ),
      null
    );
  }
  window.Feraytek = window.Feraytek || {};
  window.Feraytek.Cart = Cart;
})();
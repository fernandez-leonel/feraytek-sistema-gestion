(function(){
  const { useState, useEffect, useRef } = React;
  function ProductCard({ product, onView, onAdd }){
    const name = product.nombre || product.title || product.name || "Producto";
    const price = product.precio != null ? product.precio : (product.price != null ? product.price : "");
    const id = product.id || product.id_producto || product.idProducto || product.producto_id;
    const [frames,setFrames] = useState([]);
    const [idx,setIdx] = useState(0);
    const timer = useRef(null);
    const base = (window.Feraytek && window.Feraytek.API && window.Feraytek.API.base) || "/api";
    function uniq(arr){ const u=[]; arr.forEach(s=>{ if(s && !u.includes(s)) u.push(s); }); return u; }
    async function load(){
      let list=[]; try{ const r=await fetch(`${base}/imagenes_productos/producto/${id}?t=${Date.now()}`,{ cache:"no-store" }); const j=await r.json(); list = Array.isArray(j)?j:(j.items||j.data||[]); }catch{}
      const srv = list.map(x=> x?.url_imagen||x?.imagen_url||x?.foto_url).filter(Boolean);
      const main = product.url_imagen || product.imagen || product.image || product.img || "";
      const arr = uniq([main,...srv]).slice(0,3);
      setFrames(arr);
      setIdx(0);
    }
    useEffect(()=>{ load(); },[id]);
    function start(){ if(timer.current||frames.length<=1) return; timer.current = setInterval(()=>{ setIdx(i=> (i+1)%frames.length ); }, 900); }
    function stop(){ if(timer.current){ clearInterval(timer.current); timer.current=null; } setIdx(0); }
    const img = frames[idx] || product.url_imagen || product.imagen || product.image || product.img || "https://placehold.co/600x400?text=Producto";
    return React.createElement("div",{className:"product-card"},
      React.createElement("div",{className:"img-wrap hoverable",onMouseEnter:start,onMouseLeave:stop,onTouchStart:start,onTouchEnd:stop},
        React.createElement("img",{className:"zooming",src:img,alt:name,onError:(e)=>{try{const u=new URL(e.target.src);if(u.pathname.endsWith(".jpg")){u.pathname=u.pathname.replace(/\.jpg$/,".png");e.target.src=u.toString();return;} }catch{} e.target.src="https://placehold.co/600x400?text=Producto";}})
      ),
      React.createElement("div",{className:"info"},
        React.createElement("div",{className:"name"},name),
        React.createElement("div",{className:"price"}, price!==""?`$${price}`:"")
      ),
      React.createElement("div",{className:"actions"},
        React.createElement("button",{className:"btn secondary",onClick:()=>onAdd&&onAdd(product)},"Agregar"),
        React.createElement("button",{className:"btn primary",onClick:()=>onView&&onView(id)},"Ver detalles")
      )
    );
  }
  window.Feraytek = window.Feraytek || {};
  window.Feraytek.ProductCard = ProductCard;
})();
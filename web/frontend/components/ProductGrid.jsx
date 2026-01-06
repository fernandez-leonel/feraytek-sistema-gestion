(function(){
  const { useState, useEffect } = React;
  function ProductGrid({ onViewProduct }){
    const [items,setItems] = useState([]);
    const [cats,setCats] = useState([]);
    const [cat,setCat] = useState("Todos");
    const [loading,setLoading] = useState(true);
    const [err,setErr] = useState(null);
    async function load(){
      setLoading(true); setErr(null);
      try{
        const params = { page:1, limit:12 }; if(cat!=="Todos") params.categoria = cat;
        const res = await window.ProductController.list(params);
        const data = res.items||res.data||res.productos||res.results||res;
        setItems(Array.isArray(data)?data:[]);
      }catch(e){ setErr(e.message||"Error al cargar productos"); setItems([]); }
      finally{ setLoading(false); }
    }
    async function loadCats(){
      try{
        const r = await fetch("/api/categorias/activas");
        const j = await r.json();
        const arr = (j.items||j.data||[]).map(c=>c.nombre||c.slug);
        setCats(["Todos",...arr]);
      }catch{}
    }
    useEffect(()=>{ loadCats(); load(); },[]);
    useEffect(()=>{ load(); },[cat]);
    function add(p){
      try{
        const id = p.id||p.id_producto||p.producto_id;
        const precio_unitario = p.precio_base!=null? p.precio_base : (p.precio!=null? p.precio : (p.price!=null? p.price : 0));
        const iva_porcentaje = p.iva_porcentaje!=null? p.iva_porcentaje : (p.iva!=null? p.iva : 0);
        window.CartController.add({ producto_id:id, cantidad:1, precio_unitario, iva_porcentaje });
      }catch{}
    }
    return (
      React.createElement("section",{className:"catalog"},
        React.createElement("div",{className:"catalog-top"},
          React.createElement("h2",{className:"page-title"},"Catálogo de productos"),
          React.createElement("div",{className:"top-actions"},
            React.createElement("div",{className:"search"},
              React.createElement("svg",{className:"ico",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M10 18a8 8 0 100-16 8 8 0 000 16zm8.7-1.3l-3.5-3.5-1.4 1.4 3.5 3.5 1.4-1.4z"})),
              React.createElement("span",{className:"search-input"},"Productos en tiempo real")
            )
          )
        ),
        React.createElement("div",{className:"category-bar"},
          cats.map(c=>React.createElement("button",{key:c,className:"chip"+(c===cat?" active":""),onClick:()=>setCat(c)},c))
        ),
        err?React.createElement("div",{className:"msg error"},err):null,
        loading?React.createElement("div",{className:"msg"},"Cargando..."):
        items.length===0?React.createElement("div",{className:"msg"},"No hay productos"):
        React.createElement("div",{className:"catalog-grid"},
          items.map(p=>React.createElement(window.Feraytek.ProductCard,{key:(p.id||p.nombre),product:p,onView:onViewProduct,onAdd:add}))
        )
      )
    );
  }
  window.Feraytek = window.Feraytek || {};
  window.Feraytek.ProductGrid = ProductGrid;
})();
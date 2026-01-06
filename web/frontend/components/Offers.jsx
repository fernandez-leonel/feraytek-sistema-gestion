(function(){
  const { useState, useEffect } = React;
  function Offers(){
    const [items,setItems] = useState([]);
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
      if(["ofertas","oferta","promo","promociones"].includes(s)) return "Ofertas";
      return s? s.charAt(0).toUpperCase()+s.slice(1) : "";
    }
    function hasVariantOffer(vs){
      const arr = Array.isArray(vs)?vs:[];
      const toS = (x)=> String(x||"").toLowerCase();
      return arr.some(v=>{
        const n = toS(v?.nombre_variante||v?.atributo||v?.nombre||v?.name||v?.tipo);
        const val = toS(v?.valor_variante||v?.valor||v?.value);
        return n.includes("oferta") || val.includes("oferta");
      });
    }
    function isOffer(p){
      const cat = normCat(p?.categoria||p?.category||p?.categoria_nombre||p?.nombre_categoria||p?.tipo||p?.seccion);
      const flags = [p?.oferta,p?.en_oferta,p?.promo,p?.promocion,p?.is_offer,p?.on_sale];
      if(cat==="Ofertas" || flags.some(x=>!!x)) return true;
      if(hasVariantOffer(p?.variantes||p?.variations||p?.opciones||p?.skus)) return true;
      return false;
    }

    async function load(){
      setLoading(true); setErr(null);
      try{
        const res = await window.ProductController.list({ page:1, limit:48 });
        const data = res.data||res.items||res.productos||res.results||res;
        const arr = Array.isArray(data)?data:[];
        const enriched = await Promise.all(arr.map(async(p)=>{
          if(isOffer(p)) return p;
          try{
            const id = p.id||p.id_producto||p.producto_id||p.idProducto;
            if(id==null) return p;
            const det = await window.ProductController.detail(id);
            const d = det.data||det||{};
            const vs = d.variantes||d.variations||d.opciones||d.skus||[];
            if(hasVariantOffer(vs)) return { ...p, variantes: vs };
          }catch{}
          return null;
        }));
        setItems(enriched.filter(Boolean));
      }catch(e){ setErr(e.message||"Error al cargar ofertas"); setItems([]); }
      finally{ setLoading(false); }
    }
    useEffect(()=>{ load(); },[]);

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
      const id = p.id||p.id_producto||p.idProducto||p.producto_id;
      const img = p.url_imagen||p.imagen||p.image||p.img||"https://placehold.co/600x400?text=Oferta";
      const name = p.nombre||p.title||p.name||"Producto";
      const price = priceOf(p);
      return React.createElement("div",{className:"product-card"},
        React.createElement("div",{className:"img-wrap hoverable",onClick:()=>{ if(window.Feraytek) window.Feraytek.go("product",{ id }); }},
          React.createElement("img",{src:img,alt:name,onError:(e)=>{try{const u=new URL(e.target.src);if(u.pathname.endsWith(".jpg")){u.pathname=u.pathname.replace(/\.jpg$/,".png");e.target.src=u.toString();return;} }catch{} e.target.src="https://placehold.co/600x400?text=Oferta";}})
        ),
        React.createElement("div",{className:"info"},
          React.createElement("div",{className:"name"},name),
          React.createElement("div",{className:"price"}, price!==""?`$${price}`:"")
        ),
        React.createElement("div",{className:"actions"},
          React.createElement("button",{className:"btn primary",onClick:()=>{ if(window.Feraytek) window.Feraytek.go("product",{ id }); }},"Ver detalles")
        )
      );
    }

    return (
      React.createElement("div",{className:"catalog"},
        React.createElement(window.Feraytek.Header,{}),
        React.createElement("div",{className:"catalog-top"},
          React.createElement("h1",{className:"page-title"},"Ofertas")
        ),
        err?React.createElement("div",{className:"msg error"},err):null,
        msg?React.createElement("div",{className:`msg ${msg.type}`},msg.text):null,
        loading?React.createElement("div",{className:"loading"},"Cargando..."):
        React.createElement("div",{className:"catalog-grid"}, items.map(p=>React.createElement("div",{key:(p.id||p.id_producto||p.idProducto||p.nombre)},React.createElement(Card,{p}))))
      )
    );
  }
  window.Feraytek = window.Feraytek || {};
  window.Feraytek.Offers = Offers;
})();
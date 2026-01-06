// Feraytek UI - Componente Landing
// Responsabilidad: pantalla principal post‑autenticación con header full‑width,
// hero dominante, slider simple y estética premium oscura acorde a la marca.

(function(){
  const { useState, useEffect } = React;

  function Landing({ usuario, onGoProfile, onGoCatalog, onGoCart }){
    const items=[
      {title:"Todo en Tecnología",subtitle:"Smartphones, audio, accesorios y mucho más — la mejor calidad y lo último en tecnología."}
    ];
    const [i,setI]=useState(0);
    const [frames,setFrames]=useState([]);
    const [fi,setFi]=useState(0);
    const [featured,setFeatured]=useState([]);
    useEffect(()=>{
      (async()=>{
        try{
          const res = await window.ProductController.list({ page:1, limit:12 });
          const data = res.data||res.items||[];
          const imgs = (Array.isArray(data)?data:[]).map(p=> p.url_imagen||p.imagen||p.image||p.img ).filter(Boolean);
          const fallback=[
            "https://images.unsplash.com/photo-1517705008128-1c66f59a6db1?auto=format&fit=crop&w=1600&q=60",
            "https://images.unsplash.com/photo-1517336714731-4898a7bb3be8?auto=format&fit=crop&w=1600&q=60",
            "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=60",
            "https://images.unsplash.com/photo-1512499617640-c2f99909892c?auto=format&fit=crop&w=1600&q=60"
          ];
          setFrames(imgs.length?imgs:fallback);
          const picks = (Array.isArray(data)?data:[]).filter(p=> (p.url_imagen||p.imagen||p.image||p.img) ).slice(0,4);
          setFeatured(picks);
        }catch{
          setFrames([
            "https://images.unsplash.com/photo-1517705008128-1c66f59a6db1?auto=format&fit=crop&w=1600&q=60",
            "https://images.unsplash.com/photo-1517336714731-4898a7bb3be8?auto=format&fit=crop&w=1600&q=60",
            "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=60",
            "https://images.unsplash.com/photo-1512499617640-c2f99909892c?auto=format&fit=crop&w=1600&q=60"
          ]);
          setFeatured([]);
        }
      })();
    },[]);
    useEffect(()=>{
      if(!frames.length) return;
      const t = setInterval(()=> setFi(v=> (v+1)%frames.length ), 1800);
      return ()=> clearInterval(t);
    },[frames]);
    function prev(){setI(v=> (v-1+items.length)%items.length)}
    function next(){setI(v=> (v+1)%items.length)}
    const it=items[i];

    return (
      React.createElement("div",{className:"landing"},
        React.createElement(window.Feraytek.Header,{onUserClick:onGoProfile,onCartClick:onGoCart,onFavClick:()=>{ if(window.Feraytek){ if(typeof window.Feraytek.requireLogin === "function"){ window.Feraytek.requireLogin(()=>window.Feraytek.go("favorites")); } else { window.Feraytek.go("favorites"); } } },onNavProducts:onGoCatalog}),
        React.createElement("div",{className:"hero"},
          React.createElement("div",{className:"banner"},
            React.createElement("div",{className:"hero-left"},
              React.createElement("div",{className:"eyebrow"},"Bienvenido"),
              React.createElement("h1",{className:"hero-title"},it.title),
              React.createElement("p",{className:"hero-sub"},it.subtitle),
              React.createElement("div",{className:"hero-actions"},
                React.createElement("button",{className:"btn primary",onClick:onGoCatalog},"Explorar ahora")
              )
          ),
            React.createElement("div",{className:"hero-right"},
              React.createElement("div",{className:"image-wrap"},
                React.createElement("img",{src:frames[fi]||"https://images.unsplash.com/photo-1517705008128-1c66f59a6db1?auto=format&fit=crop&w=1600&q=60",alt:"Destacado"})
              )
            )
          ),
          React.createElement("div",{className:"featured"},
            React.createElement("div",{className:"featured-top"},
              React.createElement("h2",{className:"featured-title"},"Productos destacados"),
              React.createElement("div",{className:"featured-actions"},
                React.createElement("button",{className:"btn secondary",onClick:onGoCatalog},"Ver catálogo")
              )
            ),
            React.createElement("div",{className:"featured-grid"},
              (featured.length?featured:Array.from({length:4},(_,k)=>({nombre:"Producto",precio:"",url_imagen:frames[k%frames.length]})) ).map((p,idx)=>{
                const id = p.id||p.id_producto||p.idProducto||p.producto_id||idx;
                const img = p.url_imagen||p.imagen||p.image||p.img||frames[fi];
                const name = p.nombre||p.title||p.name||"Producto";
                const price = p.precio!=null?p.precio:(p.price!=null?p.price:"");
                return React.createElement("button",{key:id,className:"feat-card",onClick:()=> window.Feraytek && typeof window.Feraytek.go==="function" && window.Feraytek.go("product",{id})},
                  React.createElement("div",{className:"feat-img"},React.createElement("img",{src:img,alt:name})),
                  React.createElement("div",{className:"feat-info"},
                    React.createElement("div",{className:"feat-name"},name),
                    React.createElement("div",{className:"feat-price"}, price!==""?`$${price}`:"")
                  )
                );
              })
            )
          ),
          React.createElement("div",{className:"about"},
            React.createElement("h3",{className:"about-title"},"Sobre Feraytek"),
            React.createElement("div",{className:"about-grid"},
              React.createElement("div",{className:"about-card"},
                React.createElement("div",{className:"about-head"},"Calidad garantizada"),
                React.createElement("p",{className:"about-text"},"Productos originales con garantía oficial y soporte dedicado.")),
              React.createElement("div",{className:"about-card"},
                React.createElement("div",{className:"about-head"},"Envíos a todo el país"),
                React.createElement("p",{className:"about-text"},"Logística confiable y seguimiento en tiempo real.")),
              React.createElement("div",{className:"about-card"},
                React.createElement("div",{className:"about-head"},"Atención especializada"),
                React.createElement("p",{className:"about-text"},"Asesoría en elección y posventa por expertos."))
            )
          )
        )
      )
    );
  }

  window.Feraytek = window.Feraytek || {};
  window.Feraytek.Landing = Landing;
})();

// Comentarios:
// - Header y hero amplificados para presencia visual y full‑width.
// - Slider simple con flechas grandes (incremental) y 3 ítems destacados.
// - CTA visible y coherente con paleta azul/celeste de Feraytek.

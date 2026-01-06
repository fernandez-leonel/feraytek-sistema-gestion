(function(){
  const { useState, useEffect } = React;
  function Favorites(){
    const [items,setItems] = useState([]);
    const [loading,setLoading] = useState(false);
    const [err,setErr] = useState(null);
    useEffect(()=>{
      setLoading(true); setErr(null);
      try{ const list = (window.FavoritesController?window.FavoritesController.list():[]); setItems(Array.isArray(list)?list:[]); }
      catch(e){ setErr("No se pudieron cargar favoritos"); }
      finally{ setLoading(false); }
      function onFav(ev){ try{ const list = (ev && ev.detail && ev.detail.list) || (window.FavoritesController?window.FavoritesController.list():[]); setItems(Array.isArray(list)?list:[]); }catch{} }
      window.addEventListener("feraytek:fav-updated", onFav);
      return ()=> window.removeEventListener("feraytek:fav-updated", onFav);
    },[]);
    return (
      React.createElement("div",{className:"catalog"},
        React.createElement(window.Feraytek.Header,{}),
        React.createElement("div",{className:"catalog-top"},
          React.createElement("h1",{className:"page-title"},"Favoritos"),
          React.createElement("div",{className:"top-actions"},
            React.createElement("button",{className:"btn secondary",onClick:()=>{ if(window.Feraytek) window.Feraytek.go("catalog"); }},"Ver catálogo")
          )
        ),
        loading?React.createElement("div",{className:"loading"},"Cargando..."):
        items.length?React.createElement("div",{className:"catalog-grid"},items.map((p,i)=>{
          const pid = p?.id;
          return React.createElement("div",{key:(pid||i),className:"product-card",onClick:()=>{ if(window.Feraytek) window.Feraytek.go("product",{id:pid}); }},
            React.createElement("div",{className:"img-wrap"},React.createElement("img",{src:(p?.imagen||p?.image||"https://placehold.co/600x400?text=Producto"),alt:(p?.nombre||"Producto")})),
            React.createElement("div",{className:"info"},React.createElement("div",{className:"name"},p?.nombre||"Producto"))
          );
        })):React.createElement("div",{className:"msg"},"Aún no tienes favoritos")
      )
    );
  }
  window.Feraytek = window.Feraytek || {};
  window.Feraytek.Favorites = Favorites;
})();
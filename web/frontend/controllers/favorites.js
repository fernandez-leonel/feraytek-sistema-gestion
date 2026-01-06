(function(){
  function read(){
    try{ const raw = localStorage.getItem("favProducts")||"[]"; const arr = JSON.parse(raw); return Array.isArray(arr)?arr:[]; }catch{ return []; }
  }
  function write(list){
    try{ localStorage.setItem("favProducts", JSON.stringify(list)); window.dispatchEvent(new CustomEvent("feraytek:fav-updated",{ detail:{ list } })); }catch{}
  }
  function normalize(p){
    if(!p) return null;
    const id = p.id||p.id_producto||p.idProducto||p.producto_id;
    if(id==null) return null;
    return {
      id,
      nombre: p.nombre||p.title||p.name||"Producto",
      imagen: p.url_imagen||p.imagen||p.image||p.img||"https://placehold.co/600x400?text=Producto"
    };
  }
  function list(){ return read(); }
  function isFav(id){ const list = read(); id = Number(id); return list.some(x=> Number(x.id)===id); }
  function add(p){ const list = read(); const o = normalize(p); if(!o) return list; if(!list.some(x=> Number(x.id)===Number(o.id))){ list.push(o); write(list); } return list; }
  function remove(id){ let list = read(); id = Number(id); list = list.filter(x=> Number(x.id)!==id); write(list); return list; }
  function toggle(p){ const id = (p && (p.id||p.id_producto||p.idProducto||p.producto_id)); if(id==null) return read(); return isFav(id)? remove(id) : add(p); }
  window.FavoritesController = { list, isFav, add, remove, toggle };
})();
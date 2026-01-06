;(function(){
  const { useState, useEffect } = React;
  function Checkout(){
    const [step,setStep] = useState(0);
    const [items,setItems] = useState([]);
    const [loading,setLoading] = useState(false);
    const [msg,setMsg] = useState(null);
    const [ship,setShip] = useState({ nombre:"", direccion:"", ciudad:"", provincia:"", pais:"", codigo_postal:"", telefono:"", metodo_entrega:"" });
    const [pedidoId,setPedidoId] = useState(null);
    const [pagoDesc,setPagoDesc] = useState("");
    const [pagoMonto,setPagoMonto] = useState(0);
    const [pagos,setPagos] = useState([]);
    const [metodos,setMetodos] = useState([]);

    useEffect(()=>{
      let mounted = true;
      (async()=>{
        setLoading(true); setMsg(null);
        try{
          const c = await window.CartController.get();
          const arr = c.items||c.data||c.carrito||c;
          const list = Array.isArray(arr)?arr:(Array.isArray(arr?.items)?arr.items:[]);
          if(mounted) setItems(Array.isArray(list)?list:[]);
          try{
            const me = await window.AuthController.profile();
            const u = me.user||me.usuario||me||{};
            const pre = {
              nombre: (u.nombre||""),
              direccion: (u.direccion||""),
              ciudad: (u.ciudad||""),
              provincia: (u.provincia||""),
              pais: (u.pais||""),
              codigo_postal: (u.codigo_postal||""),
              telefono: (u.telefono||"")
            };
            if(mounted) setShip(s=>({ ...s, ...pre }));
          }catch{}
          try{
            const sm = await window.OrdersController.shipments();
            const data = sm.data||sm.envios||sm.items||sm.results||sm;
            const list2 = Array.isArray(data)?data:[];
            if(mounted){
              setMetodos(list2);
              if(list2.length){
                const first = list2[0];
                const nombre = first?.metodo_entrega||first?.nombre||first?.name||"";
                setShip(s=>({ ...s, metodo_entrega: s.metodo_entrega || nombre }));
              }
            }
          }catch{}
        }catch(e){ if(mounted) setMsg({type:"error",text:e.message||"No se pudo cargar el carrito"}); }
        if(mounted) setLoading(false);
      })();
    },[]);

    function priceOf(it){ const p = it.precio_base??it.precio??it.price??0; return Number(p); }
    function ivaPct(it){ const v = it.iva_porcentaje??it.iva??0; return Number(v)||0; }
    const totals = items.reduce((acc,it)=>{ const q=Number(it.cantidad||1); const p=priceOf(it); const iva=ivaPct(it); const sub=p*q; const ivaVal=sub*(iva/100); acc.sub+=sub; acc.iva+=ivaVal; acc.total+=sub+ivaVal; return acc; },{sub:0,iva:0,total:0});
    const [envio,setEnvio] = useState({ distancia_km:0, costo_envio:0, tarifa_base:0, tarifa_por_km:0, monto_por_distancia:0 });
    useEffect(()=>{ if(!String(ship.metodo_entrega||"").trim()) setShip(s=>({ ...s, metodo_entrega: "Estándar" })); },[metodos,ship.metodo_entrega]);
    useEffect(()=>{ const t=setTimeout(async()=>{ try{ const nombre = ship.metodo_entrega||"Estándar"; const j = await window.OrdersController.shippingCost({ direccion: ship.direccion, codigo_postal: ship.codigo_postal, ciudad: ship.ciudad, provincia: ship.provincia, pais: ship.pais, metodo_entrega: nombre }); setEnvio({ distancia_km:Number(j.distancia_km||0), costo_envio:Number(j.costo_envio||0), tarifa_base:Number(j.tarifa_base||0), tarifa_por_km:Number(j.tarifa_por_km||0), monto_por_distancia:Number(j.monto_por_distancia||0) }); }catch{} },400); return ()=>clearTimeout(t); },[ship.direccion,ship.codigo_postal,ship.ciudad,ship.provincia,ship.pais,ship.metodo_entrega]);

    function validateShipping(){
      const req = ["nombre","direccion","ciudad","provincia","pais","codigo_postal","telefono"].concat(metodos.length? ["metodo_entrega"] : []);
      for(const k of req){ const v = String(ship[k]||"").trim(); if(!v) { setMsg({type:"error",text:`${k} es requerido`}); return false; } }
      setMsg(null); return true;
    }

    async function confirmarPedido(){
      setMsg(null);
      try{
        if(!items || !items.length){ setMsg({type:"error",text:"Carrito vacío"}); return; }
        const payload = {
          envio: { ...ship },
          items: items.map(x=>{
            const id_producto = x.id_producto||x.producto_id||x.id;
            let id_variante = x.id_variante||x.variante_id||x.variant_id;
            if(id_variante===0||id_variante==="0"||id_variante===undefined) id_variante = null;
            const cantidad = x.cantidad||1;
            const precio_unitario = priceOf(x);
            const iva_porcentaje = ivaPct(x);
            return { id_producto, id_variante, cantidad, precio_unitario, iva_porcentaje };
          }),
          costo_envio: envio.costo_envio,
          monto_total: totals.total + envio.costo_envio
        };
        const r = await window.OrdersController.create(payload);
        const d = r.pedido||r.data||r.item||r;
        const id = d.id||d.id_pedido||d.pedido_id||r.id||r.id_pedido||null;
        if(!id) throw { message:"Pedido creado sin id" };
        setPedidoId(id);
        setPagoDesc(`Pago pedido #${id}`);
        const tFinal = d && d.monto_total!=null? Number(d.monto_total) : Number((totals.total+envio.costo_envio));
        setPagoMonto(Number(Number(tFinal||0).toFixed(2)));
        setStep(2);
      }catch(e){ const t = Array.isArray(e.detalles)? e.detalles.join(" • ") : (e.message||"No se pudo crear el pedido"); setMsg({type:"error",text:t}); }
    }

    async function realizarPago(){
      setMsg(null);
      try{
        await window.PaymentsController.pay({ id_pedido:pedidoId, descripcion:pagoDesc, monto_total:Number(pagoMonto||0) });
        setMsg({type:"ok",text:"Pago aprobado"});
        setTimeout(()=>{ try{ if(window.Feraytek && typeof window.Feraytek.go==="function"){ window.Feraytek.go("landing"); } }catch{} }, 1200);
      }catch(e){ setMsg({type:"error",text:e.message||"No se pudo procesar el pago"}); }
    }

    function field(label,iconPath,key,props){
      return React.createElement("div",{className:"form-field"},
        React.createElement("label",null,label),
        React.createElement("div",{className:"input-shell"},
          React.createElement("svg",{className:"ico icon-left",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:iconPath})),
          React.createElement("input",{className:"input",value:ship[key]||"",onChange:e=>setShip(s=>({...s,[key]:e.target.value})),...props})
        )
      );
    }

    function paso1(){
      return React.createElement("div",{className:"checkout-card"},
        React.createElement("div",{className:"block-header"},
          React.createElement("h2",{className:"block-title"},"Datos de envío"),
          React.createElement("p",{className:"block-sub"},"Completa tu información para la entrega")
        ),
        React.createElement("div",{className:"form-grid two"},
          field("Nombre","M12 12a5 5 0 1 0-0.001-10.001A5 5 0 0 0 12 12zm0 2c-4.418 0-8 2.239-8 5v2h16v-2c0-2.761-3.582-5-8-5z","nombre"),
          field("Dirección","M12 3l9 8-1 1-2-2v9H6V10L4 12 3 11l9-8z","direccion"),
          field("Ciudad","M5 3h6v6H5V3zm8 0h6v10h-6V3zM5 11h6v10H5V11zm8 12h6v-2h-6v2z","ciudad"),
          field("Provincia","M12 2l7 6-7 6-7-6 7-6zm0 16l7 4-7-2-7 2 7-4z","provincia"),
          field("País","M12 2a10 10 0 100 20 10 10 0 000-20zm0 2a8 8 0 017.8 6H12V4zM4.2 12A8 8 0 0012 20v-8H4.2z","pais"),
          field("Código Postal","M4 6h16v12H4zm4 3h8v2H8V9zm0 4h6v2H8v-2z","codigo_postal"),
          field("Teléfono","M6 2l4 2-1 3-2 2a12 12 0 006 6l2-2 3 1-2 4c-6 1-14-7-14-14z","telefono") ,
          null
        ),
        React.createElement("div",{className:"action-bar"},
          React.createElement("button",{className:"btn primary",onClick:()=>{ if(validateShipping()) setStep(1); }},"Continuar")
        )
      );
    }

    function paso2(){
      return React.createElement("div",{className:"checkout-card"},
        React.createElement("div",{className:"block-header"},
          React.createElement("h2",{className:"block-title"},"Resumen y confirmación"),
          React.createElement("p",{className:"block-sub"},"Revisa tu pedido antes de confirmar")
        ),
        React.createElement("div",{className:"checkout-section"},
          React.createElement("div",{className:"summary-grid"},
            React.createElement("div",{className:"sum-label"},"Nombre"),React.createElement("div",{className:"sum-value"},ship.nombre||""),
            React.createElement("div",{className:"sum-label"},"Dirección"),React.createElement("div",{className:"sum-value"},ship.direccion||""),
            React.createElement("div",{className:"sum-label"},"Ciudad"),React.createElement("div",{className:"sum-value"},ship.ciudad||""),
            React.createElement("div",{className:"sum-label"},"Provincia"),React.createElement("div",{className:"sum-value"},ship.provincia||""),
            React.createElement("div",{className:"sum-label"},"País"),React.createElement("div",{className:"sum-value"},ship.pais||""),
            React.createElement("div",{className:"sum-label"},"Código Postal"),React.createElement("div",{className:"sum-value"},ship.codigo_postal||""),
            React.createElement("div",{className:"sum-label"},"Teléfono"),React.createElement("div",{className:"sum-value"},ship.telefono||""),
            React.createElement("div",{className:"sum-label"},"Distancia (km)"),React.createElement("div",{className:"sum-value"},String(envio.distancia_km||""))
          )
        ),
        React.createElement("div",{className:"checkout-section"},
          React.createElement("div",{className:"item-panel"}, items.map((it,i)=>React.createElement("div",{key:i,className:"item-row"},
            React.createElement("div",{className:"item-name"},it.nombre||it.title||it.name||"Producto"),
            React.createElement("div",{className:"item-qty"},`× ${Number(it.cantidad||1)}`),
            React.createElement("div",{className:"item-price"},`$${(function(){ const q=Number(it.cantidad||1); const p=priceOf(it); const iva=ivaPct(it); const sub=p*q; const ivaVal=sub*(iva/100); return (sub+ivaVal).toFixed(2); })()}`)
          )))
        ),
        React.createElement("div",{className:"checkout-section"},
          React.createElement("div",{className:"totals-panel"},
            React.createElement("div",{className:"row"},React.createElement("div",{className:"tot-label"},"Subtotal"),React.createElement("div",{className:"tot-value"},`$${totals.sub.toFixed(2)}`)),
            React.createElement("div",{className:"row"},React.createElement("div",{className:"tot-label"},"IVA"),React.createElement("div",{className:"tot-value"},`$${totals.iva.toFixed(2)}`)),
            React.createElement("div",{className:"row"},React.createElement("div",{className:"tot-label"},"Envío base"),React.createElement("div",{className:"tot-value"},`$${envio.tarifa_base.toFixed(2)}`)),
            React.createElement("div",{className:"row"},React.createElement("div",{className:"tot-label"},"Por distancia"),React.createElement("div",{className:"tot-value"},`$${envio.monto_por_distancia.toFixed(2)}`)),
            React.createElement("div",{className:"row"},React.createElement("div",{className:"tot-label"},"Costo de envío"),React.createElement("div",{className:"tot-value"},`$${envio.costo_envio.toFixed(2)}`)),
            React.createElement("div",{className:"row"},React.createElement("div",{className:"tot-label tot-strong"},"Total"),React.createElement("div",{className:"tot-value tot-strong"},`$${(totals.total+envio.costo_envio).toFixed(2)}`))
          )
        ),
        React.createElement("div",{className:"action-bar"},
          React.createElement("button",{className:"btn secondary",onClick:()=>setStep(0)},"Atrás"),
          React.createElement("button",{className:"btn primary",onClick:confirmarPedido},"Confirmar pedido")
        )
      );
    }

  function pagoItem(p){
    const id = p.id||p.id_pago||p.payment_id;
    const des = p.descripcion||p.description||"Pago";
    const m = Number(p.monto_total||p.amount||0);
    const f = p.fecha||p.created_at||p.creado_en||"";
    const tx = p.id_transaccion||p.transaction_id||p.tx||"";
    const estado = p.estado_pago||p.estado||p.status||"";
    return React.createElement("div",{className:"row"},
      React.createElement("div",null,`${des}`),
      React.createElement("div",null,`$${m.toFixed(2)}`),
      React.createElement("div",null,String(f||"")),
      React.createElement("div",null,String(estado||"")),
      tx?React.createElement("button",{className:"btn secondary",onClick:async()=>{
        try{ await window.PaymentsController.simulateApprove(tx); const pr = await window.PaymentsController.consult(); const list = pr.items||pr.data||pr.pagos||pr.results||pr; setPagos(Array.isArray(list)?list:[]); }
        catch(e){ setMsg({type:"error",text:e.message||"No se pudo simular aprobación"}); }
      }},"Simular aprobación"):null
    );
  }

    function paso3(){
      return React.createElement("div",{className:"card"},
        React.createElement("h2",null,"Pago"),
        React.createElement("div",{className:"grid one"},
          React.createElement("div",{className:"field"},React.createElement("label",null,"Pedido"),React.createElement("div",null,`#${pedidoId||""}`)),
          React.createElement("div",{className:"field"},React.createElement("label",null,"Descripción"),React.createElement("input",{className:"input",value:pagoDesc,readOnly:true})),
          React.createElement("div",{className:"field"},React.createElement("label",null,"Monto"),React.createElement("input",{className:"input",inputMode:"decimal",value:String(pagoMonto),readOnly:true}))
        ),
        React.createElement("div",{className:"step-actions"},
          React.createElement("button",{className:"btn secondary",onClick:()=>setStep(1)},"Atrás"),
          React.createElement("button",{className:"btn primary",onClick:realizarPago},"Pagar")
        ),
        null
      );
    }

    const titles = ["Datos de envío","Resumen","Pago"];
    return React.createElement("div",{className:"checkout-page"},
      React.createElement(window.Feraytek.Header,{}),
      React.createElement("div",{className:"checkout-wrap"},
      React.createElement("h1",{className:"page-title"},"Checkout"),
      React.createElement("div",{className:"stepper"},
        React.createElement("div",{className:"bullets"},
          React.createElement("div",{className:"bullet "+(step===0?"active":"")},"1"),
          React.createElement("div",{className:"bullet "+(step===1?"active":"")},"2"),
          React.createElement("div",{className:"bullet "+(step===2?"active":"")},"3")
        ),
        React.createElement("div",{className:"step-title"},`Paso ${step+1} de 3: ${titles[step]}`)
      ),
      msg?React.createElement("div",{className:`msg ${msg.type}`},msg.text):null,
      loading?React.createElement("div",{className:"loading"},"Cargando..."):
      step===0?paso1(): step===1?paso2(): paso3()
      ),
      null
    );
  }
  window.Feraytek = window.Feraytek || {};
  window.Feraytek.Checkout = Checkout;
})();
(function(){
  const { useState } = React;
  function Contact(){
    const [f,setF] = useState({ nombre:"", email:"", mensaje:"" });
    const [msg,setMsg] = useState(null);
    function set(k,v){ setF(prev=>({...prev,[k]:v})); }
    function submit(e){ e&&e.preventDefault(); const ok = String(f.nombre).trim() && String(f.email).trim() && String(f.mensaje).trim(); if(!ok){ setMsg({type:"error",text:"Completa todos los campos"}); return; } setMsg({type:"ok",text:"Mensaje enviado"}); }
    return (
      React.createElement("div",{className:"catalog"},
        React.createElement(window.Feraytek.Header,{}),
        React.createElement("h1",{className:"page-title"},"Contacto"),
        msg?React.createElement("div",{className:`msg ${msg.type}`},msg.text):null,
        React.createElement("form",{className:"card",onSubmit:submit},
          React.createElement("div",{className:"grid one"},
            React.createElement("div",{className:"field"},React.createElement("label",null,"Nombre"),React.createElement("input",{className:"input",value:f.nombre,onChange:e=>set("nombre",e.target.value)})),
            React.createElement("div",{className:"field"},React.createElement("label",null,"Email"),React.createElement("input",{className:"input",type:"email",value:f.email,onChange:e=>set("email",e.target.value)})),
            React.createElement("div",{className:"field"},React.createElement("label",null,"Mensaje"),React.createElement("textarea",{className:"input",value:f.mensaje,onChange:e=>set("mensaje",e.target.value),rows:6}))
          ),
          React.createElement("div",{className:"action-bar"},
            React.createElement("button",{className:"btn secondary",type:"button",onClick:()=>{ setF({nombre:"",email:"",mensaje:""}); setMsg(null); }},"Limpiar"),
            React.createElement("button",{className:"btn primary",type:"submit"},"Enviar")
          )
        )
      )
    );
  }
  window.Feraytek = window.Feraytek || {};
  window.Feraytek.Contact = Contact;
})();
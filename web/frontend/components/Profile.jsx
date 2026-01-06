(function(){
  const { useState, useEffect, useRef } = React;
  const { useForm, allowOnlyDigitsKeyDown } = window.Feraytek;
  function Profile({ usuario, onBackHome, onGoCart }){
    function toDateValue(x){
      if(!x) return "";
      const s=String(x).trim();
      const m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if(m) return `${m[1]}-${m[2]}-${m[3]}`;
      const d=new Date(s);
      if(isNaN(d.getTime())) return "";
      const y=d.getFullYear();
      const mm=String(d.getMonth()+1).padStart(2,"0");
      const dd=String(d.getDate()).padStart(2,"0");
      return `${y}-${mm}-${dd}`;
    }
    function getFecha(u){
      const c = (u&& (u.cliente||u.profile||u.perfil)) || {};
      const arr = [u&&u.fecha_nacimiento,u&&u.fechaNacimiento,u&&u.fechaNac,u&&u.birth_date,u&&u.birthDate,u&&u.nacimiento,c.fecha_nacimiento,c.fechaNacimiento,c.birth_date,c.birthDate];
      for(let i=0;i<arr.length;i++){ if(arr[i]) return toDateValue(arr[i]); }
      return "";
    }
    const initial={
      nombre: usuario?.nombre||"",
      apellido: usuario?.apellido||"",
      email: usuario?.email||"",
      nombre_usuario: usuario?.nombre_usuario||usuario?.username||"",
      dni: usuario?.dni||"",
      telefono: usuario?.telefono||"",
      direccion: usuario?.direccion||"",
      ciudad: usuario?.ciudad||"",
      provincia: usuario?.provincia||"",
      pais: usuario?.pais||"",
      codigo_postal: usuario?.codigo_postal||"",
      fecha_nacimiento: getFecha(usuario),
      bio: usuario?.bio||"",
      sitio_web: usuario?.sitio_web||""
    };
    const f=useForm(initial);
    const p=useForm({ current:"", new1:"", new2:"" });
    const msgTimer = useRef(null);
    const [base,setBase]=useState(initial);
    const [msg,setMsg]=useState(null);
    const [toast,setToast]=useState(null);
    const [confirm,setConfirm]=useState(false);
    const [booting,setBooting]=useState(false);
    useEffect(()=>{
      (async()=>{
        try{
          try{
            const s = localStorage.getItem("usuario");
            if(false){ const u = JSON.parse(s||"{}"); const nb={...base}; Object.keys(nb).forEach(k=> f.set(k, u[k]||"")); setBase(nb); }
          }catch{}
          const me = await window.AuthController.profile();
          const u0 = me.data||me.user||me.usuario||me;
          const flat = {
            ...u0,
            ...(u0&&u0.cliente||{}),
            ...(u0&&u0.profile||{}),
            ...(u0&&u0.perfil||{}),
            ...(u0&&u0.admin||{})
          };
          const nextBase={...base};
          Object.keys(nextBase).forEach(k=>{
            let val = flat[k];
            if(val===undefined){
              if(k==="nombre_usuario") val = flat.username;
              if(k==="codigo_postal") val = flat.codigoPostal||flat.postal_code||flat.zip;
            }
            if(k==="fecha_nacimiento"){
              nextBase[k] = getFecha(flat);
            } else {
              nextBase[k] = val!=null?String(val):"";
            }
          });
          if(nextBase.email) nextBase.email = String(nextBase.email).toLowerCase();
          setBase(nextBase);
          Object.keys(nextBase).forEach(k=> f.set(k,nextBase[k]||""));
          try{}catch{}
        }catch{}
      })();
    },[]);
    function cancel(){ onBackHome && onBackHome(); }
    function openConfirm(){ setConfirm(true); }
    function notify(m){
      setMsg(m);
      try{ if(msgTimer.current) clearTimeout(msgTimer.current); }catch{}
      msgTimer.current = setTimeout(()=>{ try{ setMsg(null); }catch{} }, 2200);
    }
    async function doSave(){
      setConfirm(false);
      try{
        const campos=["nombre_usuario","email","dni","nombre","apellido","telefono","direccion","ciudad","provincia","pais","codigo_postal","fecha_nacimiento"];
        const payload={};
        campos.forEach(k=>{
          let v=typeof f.data[k]==="string"?f.data[k].trim():f.data[k];
          let b=typeof base[k]==="string"?base[k].trim():base[k];
          if(k==="fecha_nacimiento"){ v=toDateValue(v); b=toDateValue(b); }
          if(v!==b){
            let val = v===""?null:v;
            if(k==="email" && typeof val==="string") val = val.toLowerCase();
            payload[k]=val;
          }
        });
        if(Object.keys(payload).length===0){
          const v = String(f.data.nombre_usuario||"").trim();
          const b = String(base.nombre_usuario||"").trim();
          if(v && v!==b){ payload.nombre_usuario = v; }
        }
        if(Object.keys(payload).length===0){ notify({type:"ok",text:"No hay cambios para guardar"}); return; }

        const userId = (usuario && (usuario.id_usuario||usuario.id)) || null;
        if(userId && payload.nombre_usuario){
          await window.AuthController.updateClientProfile(userId,{ nombre_usuario: payload.nombre_usuario });
          const { nombre_usuario, ...rest } = payload;
          if(Object.keys(rest).length){ await window.AuthController.updateProfile(rest); }
        } else {
          await window.AuthController.updateProfile(payload);
        }
        try{
          const me = await window.AuthController.profile();
          const u = me.user||me.usuario||me;
          const keys=Object.keys(f.data);
          keys.forEach(k=>{ if(u && u[k]!==undefined) f.set(k,u[k]); });
          const nextBase={...base}; keys.forEach(k=>{ if(u && u[k]!==undefined) nextBase[k]=u[k]; }); setBase(nextBase);
        }catch{}
        notify({type:"ok",text:"Cambios guardados"});
        setToast({type:"ok",text:"Perfil actualizado"});
        setTimeout(()=>setToast(null),1800);
      }catch(e){
        const tx = e && (e.message||e.error||e.msg) || "Error al guardar";
        notify({type:"error",text:tx});
        setToast({type:"error",text:tx});
        setTimeout(()=>setToast(null),2200);
      }
    }
    async function doChangePwd(){
      const ok = p.validate({ current:{required:true}, new1:{required:true}, new2:{required:true} });
      if(!ok) return;
      if(p.data.new1 !== p.data.new2){ notify({type:"error",text:"Las contraseñas no coinciden"}); return; }
      try{
        await window.AuthController.changePassword({ currentPassword: p.data.current, newPassword: p.data.new1, confirmPassword: p.data.new2 });
        notify({type:"ok",text:"Contraseña actualizada"});
        setToast({type:"ok",text:"Contraseña actualizada"});
        setTimeout(()=>setToast(null),1800);
        p.set("current",""); p.set("new1",""); p.set("new2","");
      }catch(e){
        const tx = e && (e.message||e.error||e.msg) || "Error al cambiar contraseña";
        notify({type:"error",text:tx});
        setToast({type:"error",text:tx});
        setTimeout(()=>setToast(null),2200);
      }
    }
    function field(label,iconPath,key,props){
      return React.createElement("div",{className:"field"},
        React.createElement("label",null,label),
        React.createElement("div",{className:"input-shell"},
          React.createElement("svg",{className:"ico icon-left",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:iconPath})),
          React.createElement("input",{className:"input",value:f.data[key]||"",onChange:e=>f.set(key,e.target.value),...props})
        )
      );
    }
    if(booting){
      return (
        React.createElement("div",{className:"profile"},
          React.createElement(window.Feraytek.Header,{onUserClick:()=>{},onCartClick:onGoCart,onFavClick:()=>{ if(window.Feraytek){ if(typeof window.Feraytek.requireLogin === "function"){ window.Feraytek.requireLogin(()=>window.Feraytek.go("favorites")); } else { window.Feraytek.go("favorites"); } } }}),
          React.createElement("div",{className:"profile-wrap"},
            React.createElement("div",{className:"profile-card"},
              React.createElement("h2",{className:"page-title"},"Editar perfil"),
              React.createElement("div",{className:"card-block"},
                React.createElement("div",{className:"block-header"},
                  React.createElement("div",{className:"skeleton-line thick wide"}),
                  React.createElement("div",{className:"skeleton-gap"}),
                  React.createElement("div",{className:"skeleton-line wide"})
                ),
                React.createElement("div",{className:"block-divider"}),
                React.createElement("div",{className:"profile-grid grid two"},
                  React.createElement("div",{className:"skeleton-line wide"}),React.createElement("div",{className:"skeleton-line wide"}),
                  React.createElement("div",{className:"skeleton-line wide"}),React.createElement("div",{className:"skeleton-line wide"})
                )
              ),
              React.createElement("div",{className:"card-block"},
                React.createElement("div",{className:"skeleton-line thick half"}),
                React.createElement("div",{className:"block-divider"}),
                React.createElement("div",{className:"profile-grid grid two"},
                  React.createElement("div",{className:"skeleton-line wide"}),React.createElement("div",{className:"skeleton-line wide"}),
                  React.createElement("div",{className:"skeleton-line wide"}),React.createElement("div",{className:"skeleton-line wide"}),
                  React.createElement("div",{className:"skeleton-line wide"}),React.createElement("div",{className:"skeleton-line wide"}),
                  React.createElement("div",{className:"skeleton-line wide"})
                )
              ),
              React.createElement("div",{className:"card-block"},
                React.createElement("div",{className:"skeleton-line thick half"}),
                React.createElement("div",{className:"block-divider"}),
                React.createElement("div",{className:"profile-grid grid two"},
                  React.createElement("div",{className:"skeleton-line wide"}),React.createElement("div",{className:"skeleton-line wide"})
                )
              )
            )
          )
        )
      );
    }
    return (
      React.createElement("div",{className:"profile"},
        React.createElement(window.Feraytek.Header,{onUserClick:()=>{},onCartClick:onGoCart,onFavClick:()=>{ if(window.Feraytek){ if(typeof window.Feraytek.requireLogin === "function"){ window.Feraytek.requireLogin(()=>window.Feraytek.go("favorites")); } else { window.Feraytek.go("favorites"); } } }}),
        React.createElement("div",{className:"profile-wrap"},
          React.createElement("div",{className:"profile-card"},
            React.createElement("h2",{className:"page-title"},"Editar perfil"),
            msg?React.createElement("div",{className:`msg ${msg.type}`},msg.text):null,
            React.createElement("div",{className:"card-block"},
              React.createElement("div",{className:"block-header"},
                React.createElement("h3",{className:"block-title"},"Datos personales"),
                React.createElement("p",{className:"block-sub"},"Tu identidad básica para la cuenta.")
              ),
              React.createElement("div",{className:"block-divider"}),
              React.createElement("div",{className:"profile-grid grid two"},
                field("Nombre","M12 12a5 5 0 1 0-0.001-10.001A5 5 0 0 0 12 12zm0 2c-4.418 0-8 2.239-8 5v2h16v-2c0-2.761-3.582-5-8-5z","nombre"),
                field("Apellido","M12 12a5 5 0 1 0-0.001-10.001A5 5 0 0 0 12 12zm0 2c-4.418 0-8 2.239-8 5v2h16v-2c0-2.761-3.582-5-8-5z","apellido"),
                field("Email","M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm-1.4 4L12 12.5 5.4 8H18.6zM4 18V8l8 5 8-5v10H4z","email",{type:"email"}),
                field("Usuario","M12 12a5 5 0 1 0-0.001-10.001A5 5 0 0 0 12 12zm0 2c-4.418 0-8 2.239-8 5v2h16v-2c0-2.761-3.582-5-8-5z","nombre_usuario")
              )
            ),
            React.createElement("div",{className:"card-block"},
              React.createElement("div",{className:"block-header"},
                React.createElement("h3",{className:"block-title"},"Información de contacto"),
                React.createElement("p",{className:"block-sub"},"Cómo podemos comunicarnos contigo.")
              ),
              React.createElement("div",{className:"block-divider"}),
              React.createElement("div",{className:"profile-grid grid two"},
                field("Teléfono","M6 2l4 2-1 3-2 2a12 12 0 006 6l2-2 3 1-2 4c-6 1-14-7-14-14z","telefono",{inputMode:"numeric"}),
                field("Dirección","M12 3l9 8-1 1-2-2v9H6V10L4 12 3 11l9-8z","direccion"),
                field("Ciudad","M5 3h6v6H5V3zm8 0h6v10h-6V3zM5 11h6v10H5V11zm8 12h6v-2h-6v2z","ciudad"),
                field("Provincia","M12 2l7 6-7 6-7-6 7-6zm0 16l7 4-7-2-7 2 7-4z","provincia"),
                field("País","M12 2a10 10 0 100 20 10 10 0 000-20zm0 2a8 8 0 017.8 6H12V4zM4.2 12A8 8 0 0012 20v-8H4.2z","pais"),
                field("Código Postal","M4 6h16v12H4zm4 3h8v2H8V9zm0 4h6v2H8v-2z","codigo_postal",{inputMode:"numeric"}),
                      field("DNI","M3 6h18v12H3zm3 3a2 2 0 104 0 2 2 0 10-4 0zm10 3H8v2h8v-2z","dni",{inputMode:"numeric",onKeyDown:allowOnlyDigitsKeyDown}),
                field("Fecha de Nacimiento","M19 4H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM5 8h14v10H5V8zm2-4v2h2V4H7zm8 0v2h2V4h-2z","fecha_nacimiento",{type:"date"})
              )
            ),
            
            React.createElement("div",{className:"card-block"},
              React.createElement("div",{className:"block-header"},
                React.createElement("h3",{className:"block-title"},"Seguridad"),
                React.createElement("p",{className:"block-sub"},"Cambiar contraseña de tu cuenta.")
              ),
              React.createElement("div",{className:"block-divider"}),
              React.createElement("div",{className:"profile-grid grid two"},
                React.createElement("div",{className:"field"},
                  React.createElement("label",null,"Contraseña actual"),
                  React.createElement("div",{className:"input-shell"},
                    React.createElement("svg",{className:"ico icon-left",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M12 17a2 2 0 110-4 2 2 0 010 4zm6-7h-1V7a5 5 0 00-10 0v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2zm-9-3a3 3 0 016 0v3H9V7z"})),
                    React.createElement("input",{className:"input",type:"password",value:p.data.current,onChange:e=>p.set("current",e.target.value)})
                  )
                ),
                React.createElement("div",{className:"field"},
                  React.createElement("label",null,"Nueva contraseña"),
                  React.createElement("div",{className:"input-shell"},
                    React.createElement("svg",{className:"ico icon-left",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M12 17a2 2 0 110-4 2 2 0 010 4zm6-7h-1V7a5 5 0 00-10 0v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2zm-9-3a3 3 0 016 0v3H9V7z"})),
                    React.createElement("input",{className:"input",type:"password",value:p.data.new1,onChange:e=>p.set("new1",e.target.value)})
                  )
                ),
                React.createElement("div",{className:"field"},
                  React.createElement("label",null,"Repetir contraseña"),
                  React.createElement("div",{className:"input-shell"},
                    React.createElement("svg",{className:"ico icon-left",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M12 17a2 2 0 110-4 2 2 0 010 4zm6-7h-1V7a5 5 0 00-10 0v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2zm-9-3a3 3 0 016 0v3H9V7z"})),
                    React.createElement("input",{className:"input",type:"password",value:p.data.new2,onChange:e=>p.set("new2",e.target.value)})
                  )
                )
              ),
              React.createElement("div",{className:"action-bar"},
                React.createElement("button",{className:"btn primary",onClick:doChangePwd},"Cambiar contraseña")
              )
            ),
            React.createElement("div",{className:"action-bar"},
              React.createElement("button",{className:"btn secondary",onClick:cancel},"Cancelar"),
              React.createElement("button",{className:"btn primary",onClick:openConfirm},"Guardar cambios"),
              React.createElement("button",{className:"btn secondary",onClick:()=>{ try{ window.Feraytek && typeof window.Feraytek.logout==="function"? window.Feraytek.logout() : (sessionStorage.removeItem("token"), localStorage.removeItem("session_exp"), window.Feraytek && window.Feraytek.go && window.Feraytek.go("landing")); }catch{} }},"Cerrar sesión")
            ),
            null
          ),
          null
        ),
        confirm?React.createElement("div",{className:"modal-backdrop"},
          React.createElement("div",{className:"modal-card"},
            React.createElement("div",{className:"modal-title"},"¿Confirmar cambios?"),
            React.createElement("div",{className:"modal-text"},"Los datos modificados serán actualizados."),
            React.createElement("div",{className:"modal-actions"},
              React.createElement("button",{className:"btn secondary",onClick:()=>setConfirm(false)},"Cancelar"),
              React.createElement("button",{className:"btn primary",onClick:doSave},"Guardar")
            )
          )
        ):null,
        toast?React.createElement("div",{className:"modal-backdrop"},
          React.createElement("div",{className:"modal-card"},
            React.createElement("div",{className:"modal-title"},toast.type==="ok"?"Cambios guardados":"Error"),
            React.createElement("div",{className:"modal-text"},toast.text)
          )
        ):null
      )
    );
  }
  window.Feraytek = window.Feraytek || {};
  window.Feraytek.Profile = Profile;
})();

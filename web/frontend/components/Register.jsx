// Feraytek UI - Componente Registro por pasos
// Responsabilidad: presentar un registro dividido en 3 pasos lógicos para reducir
// saturación visual, con validación progresiva, íconos integrados y acciones claras.

(function(){
  const { useState } = React;
  const { useForm, allowOnlyDigitsKeyDown } = window.Feraytek;

  function Register({ onLogged, onBackToLogin }){
    const f = useForm({
      nombre_usuario:"",
      email:"",
      password:"",
      confirmPassword:"",
      nombre:"",
      apellido:"",
      dni:"",
      telefono:"",
      direccion:"",
      ciudad:"",
      provincia:"",
      pais:"",
      codigo_postal:"",
      fecha_nacimiento:""
    });
    const [msg,setMsg] = useState(null);
    const [showA,setShowA] = useState(false);
    const [showB,setShowB] = useState(false);
    const [step,setStep] = useState(0);
    const titles = ["Información de la cuenta","Datos personales","Datos de contacto"];

    function validateStep(){
      if(step===0){
        return f.validate({
          nombre_usuario:{required:true,min:3,max:32},
          email:{required:true,type:"email",domain:"gmail.com"},
          password:{required:true,type:"password"},
          confirmPassword:{required:true,equals:"password"}
        });
      }
      if(step===1){
        return f.validate({
          nombre:{required:true,min:2,max:64},
          apellido:{required:true,min:2,max:64},
          dni:{type:"digits",min:6,max:12},
          fecha_nacimiento:{}
        });
      }
      return f.validate({
        telefono:{type:"digits",min:7,max:15},
        direccion:{min:3,max:128},
        ciudad:{min:2,max:64},
        provincia:{min:2,max:64},
        pais:{min:2,max:64},
        codigo_postal:{type:"digits",min:3,max:10}
      });
    }
    function next(){ if(validateStep()) setStep(s=>Math.min(2,s+1)); }
    function prev(){ setStep(s=>Math.max(0,s-1)); }

    async function submit(){
      const ok = f.validate({
        nombre_usuario:{required:true,min:3,max:32},
        email:{required:true,type:"email",domain:"gmail.com"},
        password:{required:true,type:"password"},
        confirmPassword:{required:true,equals:"password"},
        nombre:{required:true,min:2,max:64},
        apellido:{required:true,min:2,max:64},
        dni:{type:"digits",min:6,max:12},
        telefono:{type:"digits",min:7,max:15},
        direccion:{min:3,max:128},
        ciudad:{min:2,max:64},
        provincia:{min:2,max:64},
        pais:{min:2,max:64},
        codigo_postal:{type:"digits",min:3,max:10}
      });
      if(!ok) return;
      try{
        const payload = { ...f.data, email: String(f.data.email).trim().toLowerCase() };
        Object.keys(payload).forEach(k=>{ if(typeof payload[k]==="string") payload[k]=payload[k].trim(); });
        const res = await window.AuthController.register(payload);
        let u = res.usuario || res.user || null;
        if(!u){ try{ const me = await window.AuthController.profile(); u = me.user || me.usuario || me || null; }catch{} }
        onLogged(u);
        setMsg({type:"ok",text:"Registro exitoso"});
      }catch(e){
        const m = String(e.message||"");
        if(e.status===409){
          if(/email/i.test(m)) setMsg({type:"error",text:"Email ya registrado"});
          else if(/usuario/i.test(m)) setMsg({type:"error",text:"Nombre de usuario ya registrado"});
          else setMsg({type:"error",text:"Datos duplicados"});
        } else if(e.status===400){
          setMsg({type:"error",text:"Datos inválidos. Verifica los campos."});
        } else {
          setMsg({type:"error",text:e.message||"Error en el servidor"});
        }
      }
    }

    return React.createElement("form",{className:"card",id:"registerForm",onSubmit:(e)=>{e.preventDefault();submit();}},
      React.createElement("div",{className:"stepper"},
        React.createElement("div",{className:"bullets"},
          React.createElement("div",{className:"bullet "+(step===0?"active":"")},"1"),
          React.createElement("div",{className:"bullet "+(step===1?"active":"")},"2"),
          React.createElement("div",{className:"bullet "+(step===2?"active":"")},"3")
        ),
        React.createElement("div",{className:"step-title"},`Paso ${step+1} de 3: ${titles[step]}`)
      ),
      React.createElement("div",{className:"step"},
        step===0?
          React.createElement("div",{className:"grid one"},
            React.createElement("div",{className:"field"},React.createElement("label",null,"Usuario"),React.createElement("div",{className:"input-shell"},React.createElement("svg",{className:"ico icon-left",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M12 12a5 5 0 1 0-0.001-10.001A5 5 0 0 0 12 12zm0 2c-4.418 0-8 2.239-8 5v2h16v-2c0-2.761-3.582-5-8-5z"})),React.createElement("input",{className:"input",autoComplete:"username",value:f.data.nombre_usuario,onChange:e=>f.set("nombre_usuario",e.target.value)})),f.errors.nombre_usuario?React.createElement("div",{className:"msg error"},f.errors.nombre_usuario):null),
            React.createElement("div",{className:"field"},React.createElement("label",null,"Email"),React.createElement("div",{className:"input-shell"},React.createElement("svg",{className:"ico icon-left",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm-1.4 4L12 12.5 5.4 8H18.6zM4 18V8l8 5 8-5v10H4z"})),React.createElement("input",{className:"input",type:"email",autoComplete:"email",value:f.data.email,onChange:e=>f.set("email",e.target.value)})),f.errors.email?React.createElement("div",{className:"msg error"},f.errors.email):null),
            React.createElement("div",{className:"field"},React.createElement("label",null,"Contraseña"),React.createElement("div",{className:"input-shell"},React.createElement("svg",{className:"ico icon-left",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M12 17a2 2 0 110-4 2 2 0 010 4zm6-7h-1V7a5 5 0 00-10 0v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2zm-9-3a3 3 0 016 0v3H9V7z"})),React.createElement("div",{className:"input-wrap"},React.createElement("input",{className:"input",type:showA?"text":"password",autoComplete:"new-password",value:f.data.password,onChange:e=>f.set("password",e.target.value)}),React.createElement("button",{type:"button",className:"toggle-eye",onMouseDown:()=>setShowA(true),onMouseUp:()=>setShowA(false),onMouseLeave:()=>setShowA(false),onTouchStart:()=>setShowA(true),onTouchEnd:()=>setShowA(false),onTouchCancel:()=>setShowA(false)},React.createElement("svg",{className:"ico",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M12 5C7 5 3.6 8.2 2 12c1.6 3.8 5 7 10 7s8.4-3.2 10-7c-1.6-3.8-5-7-10-7zm0 11a4 4 0 110-8 4 4 0 010 8z"}))))),f.errors.password?React.createElement("div",{className:"msg error"},f.errors.password):null),
            React.createElement("div",{className:"field"},React.createElement("label",null,"Confirmar"),React.createElement("div",{className:"input-shell"},React.createElement("svg",{className:"ico icon-left",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M12 17a2 2 0 110-4 2 2 0 010 4zm6-7h-1V7a5 5 0 00-10 0v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2zm-9-3a3 3 0 016 0v3H9V7z"})),React.createElement("div",{className:"input-wrap"},React.createElement("input",{className:"input",type:showB?"text":"password",autoComplete:"new-password",value:f.data.confirmPassword,onChange:e=>f.set("confirmPassword",e.target.value)}),React.createElement("button",{type:"button",className:"toggle-eye",onMouseDown:()=>setShowB(true),onMouseUp:()=>setShowB(false),onMouseLeave:()=>setShowB(false),onTouchStart:()=>setShowB(true),onTouchEnd:()=>setShowB(false),onTouchCancel:()=>setShowB(false)},React.createElement("svg",{className:"ico",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M12 5C7 5 3.6 8.2 2 12c1.6 3.8 5 7 10 7s8.4-3.2 10-7c-1.6-3.8-5-7-10-7zm0 11a4 4 0 110-8 4 4 0 010 8z"}))))),f.errors.confirmPassword?React.createElement("div",{className:"msg error"},f.errors.confirmPassword):null)
          )
        : step===1?
          React.createElement("div",{className:"grid one"},
            React.createElement("div",{className:"field"},React.createElement("label",null,"Nombre"),React.createElement("div",{className:"input-shell"},React.createElement("svg",{className:"ico icon-left",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M12 12a5 5 0 1 0-0.001-10.001A5 5 0 0 0 12 12zm0 2c-4.418 0-8 2.239-8 5v2h16v-2c0-2.761-3.582-5-8-5z"})),React.createElement("input",{className:"input",value:f.data.nombre,onChange:e=>f.set("nombre",e.target.value)})),f.errors.nombre?React.createElement("div",{className:"msg error"},f.errors.nombre):null),
            React.createElement("div",{className:"field"},React.createElement("label",null,"Apellido"),React.createElement("div",{className:"input-shell"},React.createElement("svg",{className:"ico icon-left",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M12 12a5 5 0 1 0-0.001-10.001A5 5 0 0 0 12 12zm0 2c-4.418 0-8 2.239-8 5v2h16v-2c0-2.761-3.582-5-8-5z"})),React.createElement("input",{className:"input",value:f.data.apellido,onChange:e=>f.set("apellido",e.target.value)})),f.errors.apellido?React.createElement("div",{className:"msg error"},f.errors.apellido):null),
            React.createElement("div",{className:"field"},React.createElement("label",null,"DNI"),React.createElement("div",{className:"input-shell"},React.createElement("svg",{className:"ico icon-left",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M3 6h18v12H3zm3 3a2 2 0 104 0 2 2 0 10-4 0zm10 3H8v2h8v-2z"})),React.createElement("input",{className:"input",inputMode:"numeric",autoComplete:"off",value:f.data.dni,onKeyDown:allowOnlyDigitsKeyDown,onChange:e=>f.set("dni",e.target.value)})),f.errors.dni?React.createElement("div",{className:"msg error"},f.errors.dni):null),
            React.createElement("div",{className:"field"},React.createElement("label",null,"Fecha de Nacimiento"),React.createElement("div",{className:"input-shell"},React.createElement("svg",{className:"ico icon-left",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M19 4H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM5 8h14v10H5V8zm2-4v2h2V4H7zm8 0v2h2V4h-2z"})),React.createElement("input",{className:"input",type:"date",autoComplete:"bday",value:f.data.fecha_nacimiento,onChange:e=>f.set("fecha_nacimiento",e.target.value)})),f.errors.fecha_nacimiento?React.createElement("div",{className:"msg error"},f.errors.fecha_nacimiento):null)
          )
        :
          React.createElement("div",{className:"grid one"},
            React.createElement("div",{className:"field"},React.createElement("label",null,"Teléfono"),React.createElement("div",{className:"input-shell"},React.createElement("svg",{className:"ico icon-left",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M6 2l4 2-1 3-2 2a12 12 0 006 6l2-2 3 1-2 4c-6 1-14-7-14-14z"})),React.createElement("input",{className:"input",inputMode:"numeric",autoComplete:"tel",value:f.data.telefono,onKeyDown:allowOnlyDigitsKeyDown,onChange:e=>f.set("telefono",e.target.value)})),f.errors.telefono?React.createElement("div",{className:"msg error"},f.errors.telefono):null),
            React.createElement("div",{className:"field"},React.createElement("label",null,"Dirección"),React.createElement("div",{className:"input-shell"},React.createElement("svg",{className:"ico icon-left",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M12 3l9 8-1 1-2-2v9H6V10L4 12 3 11l9-8z"})),React.createElement("input",{className:"input",autoComplete:"street-address",value:f.data.direccion,onChange:e=>f.set("direccion",e.target.value)})),f.errors.direccion?React.createElement("div",{className:"msg error"},f.errors.direccion):null),
            React.createElement("div",{className:"field"},React.createElement("label",null,"Ciudad"),React.createElement("div",{className:"input-shell"},React.createElement("svg",{className:"ico icon-left",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M5 3h6v6H5V3zm8 0h6v10h-6V3zM5 11h6v10H5V11zm8 12h6v-2h-6v2z"})),React.createElement("input",{className:"input",autoComplete:"address-level2",value:f.data.ciudad,onChange:e=>f.set("ciudad",e.target.value)})),f.errors.ciudad?React.createElement("div",{className:"msg error"},f.errors.ciudad):null),
            React.createElement("div",{className:"field"},React.createElement("label",null,"Provincia"),React.createElement("div",{className:"input-shell"},React.createElement("svg",{className:"ico icon-left",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M12 2l7 6-7 6-7-6 7-6zm0 16l7 4-7-2-7 2 7-4z"})),React.createElement("input",{className:"input",autoComplete:"address-level1",value:f.data.provincia,onChange:e=>f.set("provincia",e.target.value)})),f.errors.provincia?React.createElement("div",{className:"msg error"},f.errors.provincia):null),
            React.createElement("div",{className:"field"},React.createElement("label",null,"País"),React.createElement("div",{className:"input-shell"},React.createElement("svg",{className:"ico icon-left",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M12 2a10 10 0 100 20 10 10 0 000-20zm0 2a8 8 0 017.8 6H12V4zM4.2 12A8 8 0 0012 20v-8H4.2z"})),React.createElement("input",{className:"input",autoComplete:"country-name",value:f.data.pais,onChange:e=>f.set("pais",e.target.value)})),f.errors.pais?React.createElement("div",{className:"msg error"},f.errors.pais):null),
            React.createElement("div",{className:"field"},React.createElement("label",null,"Código Postal"),React.createElement("div",{className:"input-shell"},React.createElement("svg",{className:"ico icon-left",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M4 6h16v12H4zm4 3h8v2H8V9zm0 4h6v2H8v-2z"})),React.createElement("input",{className:"input",inputMode:"numeric",autoComplete:"postal-code",value:f.data.codigo_postal,onKeyDown:allowOnlyDigitsKeyDown,onChange:e=>f.set("codigo_postal",e.target.value)})),f.errors.codigo_postal?React.createElement("div",{className:"msg error"},f.errors.codigo_postal):null)
          )
      ),
      React.createElement("div",{className:"step-actions"},
        React.createElement("button",{type:"button",className:"btn secondary",onClick:()=>onBackToLogin&&onBackToLogin()},"Iniciar sesión"),
        React.createElement("div",{className:"row"},
          step>0?React.createElement("button",{type:"button",className:"btn secondary",onClick:prev},"Atrás"):null,
          step<2?React.createElement("button",{type:"button",className:"btn primary",onClick:next},"Siguiente"):React.createElement("button",{type:"button",className:"btn primary",onClick:submit},"Crear cuenta")
        )
      ),
      Object.values(f.errors).length?React.createElement("div",{className:"msg error"},Object.values(f.errors).join(" • ")):null,
      msg?React.createElement("div",{className:`msg ${msg.type}`},msg.text):null
    );
  }

  window.Feraytek = window.Feraytek || {};
  window.Feraytek.Register = Register;
})();

// Comentarios:
// - Tres pasos separados reducen la carga cognitiva del usuario.
// - Validación progresiva evita errores acumulados y mejora la guía.
// - Íconos dentro de inputs y contenedor `.step` con efecto glass mejoran estética.
// - Botón secundario permite volver a inicio de sesión sin perder progreso.
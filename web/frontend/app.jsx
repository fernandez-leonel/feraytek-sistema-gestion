const {useState} = React;
const labels={
  nombre_usuario:"Usuario",
  email:"Email",
  password:"Contraseña",
  confirmPassword:"Confirmar",
  nombre:"Nombre",
  apellido:"Apellido",
  dni:"DNI",
  telefono:"Teléfono",
  direccion:"Dirección",
  ciudad:"Ciudad",
  provincia:"Provincia",
  pais:"País",
  codigo_postal:"Código Postal",
  fecha_nacimiento:"Fecha de Nacimiento"
};

function useForm(initial){
  const [data,setData]=useState(initial);
  const [errors,setErrors]=useState({});
  function set(k,v){setData(d=>({...d,[k]:v}))}
  function validate(schema){
    const e={};
    Object.keys(schema).forEach(k=>{
      const v=data[k];
      const rule=schema[k];
      if(rule.required&&(!v&&v!==0)) e[k]=`${labels[k]} es requerido`;
      if(!e[k]&&rule.type==="email"&&v){
        const val=String(v).toLowerCase();
        if(rule.domain){
          const must=`@${rule.domain}`;
          if(!val.endsWith(must)) e[k]=`${labels[k]} debe terminar en ${must}`;
        } else if(!/^\S+@\S+\.\S+$/.test(val)) {
          e[k]=`${labels[k]} tiene formato inválido`;
        }
      }
      if(!e[k]&&rule.type==="password"&&v&&!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(v)) e[k]=`${labels[k]} debe tener al menos 8 caracteres con letras y números`;
      if(!e[k]&&rule.type==="digits"&&v&&!/^\d+$/.test(String(v))) e[k]=`${labels[k]} debe contener solo números`;
      if(!e[k]&&rule.equals&&v!==data[rule.equals]) e[k]=`${labels[k]} no coincide con ${labels[rule.equals]}`;
      if(!e[k]&&rule.min&&String(v||"").length<rule.min) e[k]=`${labels[k]} debe tener al menos ${rule.min} caracteres`;
      if(!e[k]&&rule.max&&String(v||"").length>rule.max) e[k]=`${labels[k]} debe tener como máximo ${rule.max} caracteres`;
    });
    setErrors(e);return Object.keys(e).length===0;
  }
  return {data,set,errors,validate};
}

function Login({onLogged}){
  const f=useForm({identifier:"",password:""});
  const [msg,setMsg]=useState(null);
  const [show,setShow]=useState(false);
  async function submit(){
    const ok=f.validate({identifier:{required:true},password:{required:true}});
    if(!ok)return;
    try{
      const id=String(f.data.identifier).trim();
      const isEmail=id.includes("@");
      const body=isEmail?{email:id.toLowerCase(),password:f.data.password}:{nombre_usuario:id,password:f.data.password};
      const res=await window.AuthController.login(body);
      try{ sessionStorage.setItem("token",res.token||""); }catch{}
      let u=res.usuario||res.user||null;
      if(!u){
        try{const me=await window.AuthController.profile();u=me.user||me.usuario||me||null;}catch{}
      }
      onLogged(u);
      setMsg({type:"ok",text:"Sesión iniciada"});
    }catch(e){
      if(e.status===401){
        setMsg({type:"error",text:"Usuario/Email o contraseña incorrectos"});
      } else {
        setMsg({type:"error",text:e.message||"Error"});
      }
    }
  }
  return React.createElement("form",{className:"card narrow",id:"loginForm",onSubmit:(e)=>{e.preventDefault();submit();}},
      React.createElement("div",{className:"grid one"},
        React.createElement("div",{className:"field"},React.createElement("label",null,"Usuario o Email"),React.createElement("div",{className:"input-shell"},React.createElement("svg",{className:"ico icon-left",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M12 12a5 5 0 1 0-0.001-10.001A5 5 0 0 0 12 12zm0 2c-4.418 0-8 2.239-8 5v2h16v-2c0-2.761-3.582-5-8-5z"})),React.createElement("input",{className:"input",autoComplete:"username",value:f.data.identifier,onChange:e=>f.set("identifier",e.target.value)})),f.errors.identifier?React.createElement("div",{className:"msg error"},f.errors.identifier):null),
        React.createElement("div",{className:"field"},React.createElement("label",null,"Contraseña"),React.createElement("div",{className:"input-shell"},React.createElement("svg",{className:"ico icon-left",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M12 17a2 2 0 110-4 2 2 0 010 4zm6-7h-1V7a5 5 0 00-10 0v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2zm-9-3a3 3 0 016 0v3H9V7z"})),React.createElement("div",{className:"input-wrap"},React.createElement("input",{className:"input",type:show?"text":"password",autoComplete:"current-password",value:f.data.password,onChange:e=>f.set("password",e.target.value)}),React.createElement("button",{type:"button",className:"toggle-eye",onMouseDown:()=>setShow(true),onMouseUp:()=>setShow(false),onMouseLeave:()=>setShow(false),onTouchStart:()=>setShow(true),onTouchEnd:()=>setShow(false),onTouchCancel:()=>setShow(false)},React.createElement("svg",{className:"ico",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M12 5C7 5 3.6 8.2 2 12c1.6 3.8 5 7 10 7s8.4-3.2 10-7c-1.6-3.8-5-7-10-7zm0 11a4 4 0 110-8 4 4 0 010 8z"}))))))
      ),
      f.errors.identifier?React.createElement("div",{className:"msg error"},f.errors.identifier):null,
      f.errors.password?React.createElement("div",{className:"msg error"},f.errors.password):null,
      msg?React.createElement("div",{className:`msg ${msg.type}`},msg.text):null
  );
}

function Register({onLogged,onBackToLogin}){
  const f=useForm({
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
  const [msg,setMsg]=useState(null);
  const [showA,setShowA]=useState(false);
  const [showB,setShowB]=useState(false);
  const [step,setStep]=useState(0);
  const titles=["Información de la cuenta","Datos personales","Datos de contacto"];
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
    const ok=f.validate({
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
    if(!ok)return;
    try{
      const payload={...f.data,email:String(f.data.email).trim().toLowerCase()};
      Object.keys(payload).forEach(k=>{if(typeof payload[k]==="string") payload[k]=payload[k].trim()});
      const res=await window.AuthController.register(payload);
      try{ sessionStorage.setItem("token",res.token||""); }catch{}
      let u=res.usuario||res.user||null;
      if(!u){
        try{const me=await window.AuthController.profile();u=me.user||me.usuario||me||null;}catch{}
      }
      onLogged(u);
      setMsg({type:"ok",text:"Registro exitoso"});
    }catch(e){
      const msg = String(e.message||"");
      if(e.status===409){
        if(/email/i.test(msg)) setMsg({type:"error",text:"Email ya registrado"});
        else if(/usuario/i.test(msg)) setMsg({type:"error",text:"Nombre de usuario ya registrado"});
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
      ):
      step===1?
      React.createElement("div",{className:"grid one"},
        React.createElement("div",{className:"field"},React.createElement("label",null,"Nombre"),React.createElement("div",{className:"input-shell"},React.createElement("svg",{className:"ico icon-left",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M12 12a5 5 0 1 0-0.001-10.001A5 5 0 0 0 12 12zm0 2c-4.418 0-8 2.239-8 5v2h16v-2c0-2.761-3.582-5-8-5z"})),React.createElement("input",{className:"input",value:f.data.nombre,onChange:e=>f.set("nombre",e.target.value)})),f.errors.nombre?React.createElement("div",{className:"msg error"},f.errors.nombre):null),
        React.createElement("div",{className:"field"},React.createElement("label",null,"Apellido"),React.createElement("div",{className:"input-shell"},React.createElement("svg",{className:"ico icon-left",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M12 12a5 5 0 1 0-0.001-10.001A5 5 0 0 0 12 12zm0 2c-4.418 0-8 2.239-8 5v2h16v-2c0-2.761-3.582-5-8-5z"})),React.createElement("input",{className:"input",value:f.data.apellido,onChange:e=>f.set("apellido",e.target.value)})),f.errors.apellido?React.createElement("div",{className:"msg error"},f.errors.apellido):null),
        React.createElement("div",{className:"field"},React.createElement("label",null,"DNI"),React.createElement("div",{className:"input-shell"},React.createElement("svg",{className:"ico icon-left",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M3 6h18v12H3zm3 3a2 2 0 104 0 2 2 0 10-4 0zm10 3H8v2h8v-2z"})),React.createElement("input",{className:"input",inputMode:"numeric",autoComplete:"off",value:f.data.dni,onKeyDown:e=>{/^\d$/.test(e.key)||["Backspace","Delete","ArrowLeft","ArrowRight","Tab"].includes(e.key)||e.preventDefault()},onChange:e=>f.set("dni",e.target.value)})),f.errors.dni?React.createElement("div",{className:"msg error"},f.errors.dni):null),
        React.createElement("div",{className:"field"},React.createElement("label",null,"Fecha de Nacimiento"),React.createElement("div",{className:"input-shell"},React.createElement("svg",{className:"ico icon-left",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M19 4H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM5 8h14v10H5V8zm2-4v2h2V4H7zm8 0v2h2V4h-2z"})),React.createElement("input",{className:"input",type:"date",autoComplete:"bday",value:f.data.fecha_nacimiento,onChange:e=>f.set("fecha_nacimiento",e.target.value)})),f.errors.fecha_nacimiento?React.createElement("div",{className:"msg error"},f.errors.fecha_nacimiento):null)
      ):
      React.createElement("div",{className:"grid one"},
        React.createElement("div",{className:"field"},React.createElement("label",null,"Teléfono"),React.createElement("div",{className:"input-shell"},React.createElement("svg",{className:"ico icon-left",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M6 2l4 2-1 3-2 2a12 12 0 006 6l2-2 3 1-2 4c-6 1-14-7-14-14z"})),React.createElement("input",{className:"input",inputMode:"numeric",autoComplete:"tel",value:f.data.telefono,onKeyDown:e=>{/^\d$/.test(e.key)||["Backspace","Delete","ArrowLeft","ArrowRight","Tab"].includes(e.key)||e.preventDefault()},onChange:e=>f.set("telefono",e.target.value)})),f.errors.telefono?React.createElement("div",{className:"msg error"},f.errors.telefono):null),
        React.createElement("div",{className:"field"},React.createElement("label",null,"Dirección"),React.createElement("div",{className:"input-shell"},React.createElement("svg",{className:"ico icon-left",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M12 3l9 8-1 1-2-2v9H6V10L4 12 3 11l9-8z"})),React.createElement("input",{className:"input",autoComplete:"street-address",value:f.data.direccion,onChange:e=>f.set("direccion",e.target.value)})),f.errors.direccion?React.createElement("div",{className:"msg error"},f.errors.direccion):null),
        React.createElement("div",{className:"field"},React.createElement("label",null,"Ciudad"),React.createElement("div",{className:"input-shell"},React.createElement("svg",{className:"ico icon-left",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M5 3h6v6H5V3zm8 0h6v10h-6V3zM5 11h6v10H5V11zm8 12h6v-2h-6v2z"})),React.createElement("input",{className:"input",autoComplete:"address-level2",value:f.data.ciudad,onChange:e=>f.set("ciudad",e.target.value)})),f.errors.ciudad?React.createElement("div",{className:"msg error"},f.errors.ciudad):null),
        React.createElement("div",{className:"field"},React.createElement("label",null,"Provincia"),React.createElement("div",{className:"input-shell"},React.createElement("svg",{className:"ico icon-left",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M12 2l7 6-7 6-7-6 7-6zm0 16l7 4-7-2-7 2 7-4z"})),React.createElement("input",{className:"input",autoComplete:"address-level1",value:f.data.provincia,onChange:e=>f.set("provincia",e.target.value)})),f.errors.provincia?React.createElement("div",{className:"msg error"},f.errors.provincia):null),
        React.createElement("div",{className:"field"},React.createElement("label",null,"País"),React.createElement("div",{className:"input-shell"},React.createElement("svg",{className:"ico icon-left",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M12 2a10 10 0 100 20 10 10 0 000-20zm0 2a8 8 0 017.8 6H12V4zM4.2 12A8 8 0 0012 20v-8H4.2z"})),React.createElement("input",{className:"input",autoComplete:"country-name",value:f.data.pais,onChange:e=>f.set("pais",e.target.value)})),f.errors.pais?React.createElement("div",{className:"msg error"},f.errors.pais):null),
        React.createElement("div",{className:"field"},React.createElement("label",null,"Código Postal"),React.createElement("div",{className:"input-shell"},React.createElement("svg",{className:"ico icon-left",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M4 6h16v12H4zm4 3h8v2H8V9zm0 4h6v2H8v-2z"})),React.createElement("input",{className:"input",inputMode:"numeric",autoComplete:"postal-code",value:f.data.codigo_postal,onKeyDown:e=>{/^\d$/.test(e.key)||["Backspace","Delete","ArrowLeft","ArrowRight","Tab"].includes(e.key)||e.preventDefault()},onChange:e=>f.set("codigo_postal",e.target.value)})),f.errors.codigo_postal?React.createElement("div",{className:"msg error"},f.errors.codigo_postal):null)
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

function App(){
  const [tab,setTab]=useState("");
  const [usuario,setUsuario]=useState(null);
  const [route,setRoute]=useState("landing");
  const [productId,setProductId]=useState(null);
  function logout(){try{sessionStorage.removeItem("token");localStorage.removeItem("token");}catch{} setUsuario(null)}
  window.Feraytek = window.Feraytek || {};
  window.Feraytek.API = window.Feraytek.API || { base:"/api" };
  window.Feraytek.IMAGES = window.Feraytek.IMAGES || { base:"/static" };
  
  try{ window.Feraytek.usuario = usuario; }catch{}
  React.useEffect(()=>{
    try{
      async function probe(u){ return await new Promise(r=>{ try{ const img=new Image(); img.onload=()=>r(true); img.onerror=()=>r(false); img.src=u; }catch{ r(false); } }); }
      (async()=>{
        const cand=[];
        try{ const stored=localStorage.getItem("brandLogoUrl"); if(stored) cand.push(stored); }catch{}
        cand.push("/img/logo1.jpeg");
        cand.push("/img/logo2.jpeg");
        for(let i=0;i<cand.length;i++){ const ok=await probe(cand[i]); if(ok){ window.Feraytek.brandLogo=cand[i]; break; } }
      })();
    }catch{}
  },[]);
  window.Feraytek.go = (r,params)=>{
    try{
      const idRaw = params && (params.id||params.productId);
      const id = idRaw!=null? Number(idRaw) : null;
      const hash = r==="product" && id!=null? `#product:${id}` : `#${r}`;
      if(r!=="product") setProductId(null);
      if(r==="product" && id!=null) setProductId(id);
      if(window.location.hash!==hash){ window.location.hash = hash; }
      setRoute(r);
    }catch{}
  };
  React.useEffect(()=>{
    function applyHash(){
      try{
        const h = String(window.location.hash||"").replace(/^#/,'');
        if(!h){ window.location.hash = "#landing"; return; }
        if(/^product:/.test(h)){
          const id = Number(h.split(":")[1]||"0");
          setProductId(id||null); setRoute("product");
        } else { setRoute(h); }
      }catch{}
    }
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return ()=> window.removeEventListener("hashchange", applyHash);
  },[]);
  React.useEffect(()=>{ try{ window.Feraytek.route = route; window.dispatchEvent(new CustomEvent("feraytek:route",{ detail:{ route } })); }catch{} },[route]);
  const [authBooting,setAuthBooting] = useState(true);
  React.useEffect(()=>{ try{ const s=localStorage.getItem("usuario"); if(s){ const u=JSON.parse(s); if(u && Object.keys(u).length) setUsuario(u); } }catch{} },[]);
  React.useEffect(()=>{
    (async()=>{
      try{
        const tok = sessionStorage.getItem("token")||localStorage.getItem("token")||"";
        if(tok){
          try{
            const me = await window.AuthController.profile();
            const u = (me && (me.data||me.user||me.usuario)) || me;
            setUsuario(u||null);
            try{ localStorage.setItem("usuario", JSON.stringify(u||{})); }catch{}
          } catch(e){
            if(e && (e.status===401 || e.status===403)){
              try{ sessionStorage.removeItem("token"); localStorage.removeItem("token"); }catch{}
              setUsuario(null);
            }
          }
        }
      }catch{}
      finally{ setAuthBooting(false); }
    })();
  },[]);
  function handleLogged(u){ setUsuario(u); try{ localStorage.setItem("usuario", JSON.stringify(u||{})); }catch{} setTab(""); }
  function isSessionActive(){ try{ const tok=(sessionStorage.getItem("token")||localStorage.getItem("token")||""); return !!tok; }catch{ return false; } }
  function requireLogin(fn){ if(usuario && isSessionActive()){ if(typeof fn==="function") fn(); return true; } setTab("login"); return false; }
  window.Feraytek.requireLogin = requireLogin;
  window.Feraytek.logout = function(){ try{ localStorage.removeItem("token"); sessionStorage.removeItem("token"); }catch{} setUsuario(null); if(window.Feraytek && typeof window.Feraytek.go==="function"){ window.Feraytek.go("landing"); } else { setRoute("landing"); } };
  return (
    React.createElement("div",{className:"wrap full"},
      tab==="login"?
        React.createElement("div",{className:"auth"},
          React.createElement("div",{className:"auth-grid"},
            React.createElement("div",{className:"auth-hero"},
              React.createElement("div",{className:"brand-xl"},"Feraytek"),
              React.createElement("h2",{className:"auth-title"},"Bienvenido"),
              React.createElement("p",{className:"auth-sub"},"Accede para continuar con tus compras")
            ),
            (window.Feraytek && window.Feraytek.Login?React.createElement(window.Feraytek.Login,{onLogged:handleLogged,onGoRegister:()=>setTab("register")}):React.createElement("div",{className:"msg error"},"No se pudo cargar Login"))
          )
        )
      : tab==="register"?
        (window.Feraytek && window.Feraytek.Register?React.createElement(window.Feraytek.Register,{onLogged:handleLogged,onBackToLogin:()=>setTab("login")}):React.createElement("div",{className:"msg error"},"No se pudo cargar Registro"))
      :
      (route==="landing"?
        React.createElement(window.Feraytek.Landing,{usuario,onGoProfile:()=>requireLogin(()=>window.Feraytek.go("profile")),onGoCatalog:()=>window.Feraytek.go("catalog"),onGoCart:()=>requireLogin(()=>window.Feraytek.go("cart"))})
        : route==="offers"?
          (window.Feraytek && window.Feraytek.Offers?React.createElement(window.Feraytek.Offers,{}):React.createElement("div",{className:"msg error"},"No se pudo cargar Ofertas"))
        : route==="contact"?
          (window.Feraytek && window.Feraytek.Contact?React.createElement(window.Feraytek.Contact,{}):React.createElement("div",{className:"msg error"},"No se pudo cargar Contacto"))
        : route==="favorites"?
          (window.Feraytek && window.Feraytek.Favorites? (usuario?React.createElement(window.Feraytek.Favorites,{}):(setTab("login"),React.createElement("div",null)) ) : React.createElement("div",{className:"msg error"},"No se pudo cargar Favoritos"))
        : route==="profile"?
          (window.Feraytek && window.Feraytek.Profile? React.createElement(window.Feraytek.Profile,{usuario,onBackHome:()=>{ if(window.Feraytek && typeof window.Feraytek.go==="function"){ window.Feraytek.go("landing"); } else { setRoute("landing"); } },onGoCart:()=>{ if(window.Feraytek && typeof window.Feraytek.go==="function"){ window.Feraytek.go("cart"); } else { setRoute("cart"); } }}) : React.createElement("div",{className:"msg error"},"No se pudo cargar Perfil"))
        : route==="catalog"?
          (window.Feraytek && window.Feraytek.Catalog?React.createElement(window.Feraytek.Catalog,{onViewProduct:(id)=>window.Feraytek.go("product",{id}),onGoCart:()=>requireLogin(()=>window.Feraytek.go("cart"))}):React.createElement("div",{className:"msg error"},"No se pudo cargar Catálogo"))
        : route==="cart"?
          (window.Feraytek && window.Feraytek.Cart? (usuario?React.createElement(window.Feraytek.Cart,{onBack:()=>window.Feraytek.go("catalog")}) : (setTab("login"), React.createElement("div",null)) ) : React.createElement("div",{className:"msg error"},"No se pudo cargar Carrito"))
        : route==="checkout"?
          (window.Feraytek && window.Feraytek.Checkout? (usuario?React.createElement(window.Feraytek.Checkout,{}) : (setTab("login"), React.createElement("div",null)) ) : React.createElement("div",{className:"msg error"},"No se pudo cargar Checkout"))
        : route==="support"?
          (window.Feraytek && window.Feraytek.Support?React.createElement(window.Feraytek.Support,{}):React.createElement("div",{className:"msg error"},"No se pudo cargar Soporte"))
          : route==="orders"?
            (window.Feraytek && window.Feraytek.OrderHistory? (usuario?React.createElement(window.Feraytek.OrderHistory,{}) : (setTab("login"), React.createElement("div",null)) ) : React.createElement("div",{className:"msg error"},"No se pudo cargar Pedidos"))
      : (window.Feraytek && window.Feraytek.ProductDetail?React.createElement(window.Feraytek.ProductDetail,{productId,onBack:()=>window.Feraytek.go("catalog"),onGoCart:()=>requireLogin(()=>window.Feraytek.go("cart"))}):React.createElement("div",{className:"msg error"},"No se pudo cargar Detalle"))
      ),
      ((tab!=="login" && tab!=="register")? (window.Feraytek && window.Feraytek.Footer?React.createElement(window.Feraytek.Footer,{}):null) : null)
    )
  );
}

function Landing({usuario,onLogout,onGoCatalog,onGoProfile}){
  const items=[
    {title:"Tecnología de Vanguardia",subtitle:"Smartphones, audio y accesorios seleccionados para vos.",image:"https://images.unsplash.com/photo-1517705008128-1c66f59a6db1?auto=format&fit=crop&w=1200&q=60"},
    {title:"Ofertas Destacadas",subtitle:"Descubre promociones en productos premium.",image:"https://images.unsplash.com/photo-1520975596571-37c1dd3e3e77?auto=format&fit=crop&w=1200&q=60"},
    {title:"Tendencias",subtitle:"Lo último en colecciones para esta temporada.",image:"https://images.unsplash.com/photo-1511981839932-9ed141221f53?auto=format&fit=crop&w=1200&q=60"}
  ];
  const [i,setI]=useState(0);
  function prev(){setI(v=> (v-1+items.length)%items.length)}
  function next(){setI(v=> (v+1)%items.length)}
  const it=items[i];
  return (
    React.createElement("div",{className:"landing"},
      React.createElement("div",{className:"header"},
        React.createElement("div",{className:"logo"},"Feraytek"),
        React.createElement("nav",{className:"menu"},
          React.createElement("a",{className:"menu-item active"},"Inicio"),
          React.createElement("a",{className:"menu-item",onClick:onGoCatalog},"Productos"),
          React.createElement("a",{className:"menu-item"},"Ofertas"),
          React.createElement("a",{className:"menu-item"},"Contacto")
        ),
          React.createElement("div",{className:"tools"},
            React.createElement("div",{className:"search"},
            React.createElement("svg",{className:"ico",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M10 18a8 8 0 100-16 8 8 0 000 16zm8.7-1.3l-3.5-3.5-1.4 1.4 3.5 3.5 1.4-1.4z"})),
            React.createElement("input",{placeholder:"Buscar",className:"search-input"})
          ),
          React.createElement("button",{className:"icon-btn",title:"Mi cuenta",onClick:onLogout},
            React.createElement("svg",{className:"ico",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M12 12a5 5 0 1 0-0.001-10.001A5 5 0 0 0 12 12zm0 2c-4.418 0-8 2.239-8 5v2h16v-2c0-2.761-3.582-5-8-5z"}))
          ),
          React.createElement("button",{className:"icon-btn",title:"Carrito",onClick:()=>{ if(window.Feraytek && typeof window.Feraytek.go==="function"){ window.Feraytek.go("cart"); } }},
            React.createElement("svg",{className:"ico",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M3 4h2l2 12h10l2-8H7"}))
          ),
          React.createElement("button",{className:"icon-btn",title:"Favoritos"},
            React.createElement("svg",{className:"ico",viewBox:"0 0 24 24",fill:"currentColor"},React.createElement("path",{d:"M12 21l-1.5-1.3C6 16 4 13.8 4 11a4 4 0 014-4c1.6 0 3 .8 4 2 1-1.2 2.4-2 4-2a4 4 0 014 4c0 2.8-2 5-6.5 8.7L12 21z"}))
          )
        )
      ),
      React.createElement("div",{className:"hero"},
        React.createElement("button",{className:"arrow left",onClick:prev},
          React.createElement("svg",{className:"ico",viewBox:"0 0 24 24"},
            React.createElement("path",{d:"M15 6l-6 6 6 6",stroke:"currentColor",fill:"none",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"})
          )
        ),
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
              React.createElement("img",{src:it.image,alt:"Destacado"})
            )
          )
        ),
        React.createElement("button",{className:"arrow right",onClick:next},
          React.createElement("svg",{className:"ico",viewBox:"0 0 24 24"},
            React.createElement("path",{d:"M9 6l6 6-6 6",stroke:"currentColor",fill:"none",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"})
          )
        )
      )
    )
  );
}

if(window.React && window.ReactDOM){
  const rootEl = document.getElementById("root");
  ReactDOM.createRoot(rootEl).render(React.createElement(App));
  try{ setTimeout(()=>{ rootEl.style.opacity = "1"; }, 0); }catch{}
} else {
  const el=document.getElementById("root");
  if(el){ el.innerHTML = "<div class='msg error'>No se pudo cargar la UI. Verifica conexión y recarga.</div>"; try{ el.style.opacity = "1"; }catch{} }
}

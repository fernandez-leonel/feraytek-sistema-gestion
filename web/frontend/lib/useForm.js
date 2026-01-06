// Feraytek UI - Módulo de formularios y etiquetas
// Responsabilidad: proveer utilidades de manejo de estado de formularios, validación
// y etiquetas legibles para los distintos campos utilizados en Login y Registro.
// Este archivo expone una API en el espacio global `window.Feraytek` para ser
// consumida por componentes declarados en archivos separados sin usar bundlers.

(function(){
  const { useState } = window.React || {};

  // Etiquetas legibles para los campos
  const labels = {
    nombre_usuario: "Usuario",
    email: "Email",
    password: "Contraseña",
    confirmPassword: "Confirmar",
    nombre: "Nombre",
    apellido: "Apellido",
    dni: "DNI",
    telefono: "Teléfono",
    direccion: "Dirección",
    ciudad: "Ciudad",
    provincia: "Provincia",
    pais: "País",
    codigo_postal: "Código Postal",
    fecha_nacimiento: "Fecha de Nacimiento",
    identifier: "Usuario o Email"
  };

  // Hook sencillo para formularios
  function useForm(initial){
    const [data,setData] = useState(initial);
    const [errors,setErrors] = useState({});

    function set(k,v){ setData(d => ({...d,[k]:v})); }

    // Validador declarativo por esquema
    function validate(schema){
      const e = {};
      Object.keys(schema).forEach(k => {
        const v = data[k];
        const rule = schema[k];
        if(rule.required && (!v && v!==0)) e[k] = `${labels[k]} es requerido`;
        if(!e[k] && rule.type === "email" && v){
          const val = String(v).toLowerCase();
          if(rule.domain){
            const must = `@${rule.domain}`;
            if(!val.endsWith(must)) e[k] = `${labels[k]} debe terminar en ${must}`;
          } else if(!/^\S+@\S+\.\S+$/.test(val)) {
            e[k] = `${labels[k]} tiene formato inválido`;
          }
        }
        if(!e[k] && rule.type === "password" && v && !/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(v)){
          e[k] = `${labels[k]} debe tener al menos 8 caracteres con letras y números`;
        }
        if(!e[k] && rule.type === "digits" && v && !/^\d+$/.test(String(v))){
          e[k] = `${labels[k]} debe contener solo números`;
        }
        if(!e[k] && rule.equals && v !== data[rule.equals]){
          e[k] = `${labels[k]} no coincide con ${labels[rule.equals]}`;
        }
        if(!e[k] && rule.min && String(v||"").length < rule.min){
          e[k] = `${labels[k]} debe tener al menos ${rule.min} caracteres`;
        }
        if(!e[k] && rule.max && String(v||"").length > rule.max){
          e[k] = `${labels[k]} debe tener como máximo ${rule.max} caracteres`;
        }
      });
      setErrors(e);
      return Object.keys(e).length === 0;
    }

    return { data, set, errors, validate };
  }


  // Utilidad: restricciones de entrada numérica (tecla)
  function allowOnlyDigitsKeyDown(e){
    const ok = /^\d$/.test(e.key) || [
      "Backspace","Delete","ArrowLeft","ArrowRight","Tab"
    ].includes(e.key);
    if(!ok) e.preventDefault();
  }

  // Exponer API global
  window.Feraytek = window.Feraytek || {};
  window.Feraytek.labels = labels;
  window.Feraytek.useForm = useForm;
  window.Feraytek.allowOnlyDigitsKeyDown = allowOnlyDigitsKeyDown;
})();

// Comentarios adicionales:
// - Este módulo evita duplicación de lógica de formularios entre Login y Registro.
// - Se utiliza React en modo UMD (sin import/export) y se monta en window.
// - Las funciones aquí son puras y no dependen de CSS ni de otros módulos.
// - La validación por esquema permite extender reglas sin modificar componentes.
// - `allowOnlyDigitsKeyDown` centraliza la restricción de entradas numéricas.
// - `labels` ayuda a construir mensajes de error consistentes y legibles.
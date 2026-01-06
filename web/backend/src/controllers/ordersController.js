import Joi from "joi";
import { sequelize } from "../config/database.js";
import { Order, OrderItem } from "../models/Order.js";

const itemSchema = Joi.object({
  id_producto: Joi.any().required(),
  id_variante: Joi.any().allow(null).optional(),
  cantidad: Joi.number().integer().min(1).required(),
  precio_unitario: Joi.number().min(0).required(),
  iva_porcentaje: Joi.number().min(0).max(100).default(0),
  nombre: Joi.string().allow("").optional()
});
const createSchema = Joi.object({
  envio: Joi.object({
    nombre: Joi.string().allow(""),
    direccion: Joi.string().allow(""),
    ciudad: Joi.string().allow(""),
    provincia: Joi.string().allow(""),
    pais: Joi.string().allow(""),
    codigo_postal: Joi.string().allow(""),
    telefono: Joi.string().allow(""),
    metodo_entrega: Joi.string().allow("")
  }).unknown(true).required(),
  items: Joi.array().items(itemSchema).min(1).required(),
  costo_envio: Joi.number().min(0).default(0),
  monto_total: Joi.number().min(0).required()
});

export async function create(req,res){
  const { value, error } = createSchema.validate(req.body||{}, { abortEarly:false });
  let payload = value;
  if(error){
    const b = req.body||{};
    const arr = Array.isArray(b.items)?b.items:[];
    if(arr.length){
      const envio = b.envio||{};
      const costo_envio = Number(b.costo_envio||0);
      const normItems = arr.map(it=>({
        id_producto: it.id_producto||it.producto_id||it.id,
        id_variante: it.id_variante!==undefined? it.id_variante : (it.variante_id!==undefined? it.variante_id : null),
        cantidad: Number(it.cantidad||1),
        precio_unitario: Number(it.precio_unitario!=null? it.precio_unitario : (it.precio_base||it.precio||0)),
        iva_porcentaje: Number(it.iva_porcentaje!=null? it.iva_porcentaje : (it.iva||0)),
        nombre: it.nombre||it.title||it.name||""
      })).filter(x=>x.id_producto!=null);
      const sub = normItems.reduce((acc,x)=> acc + x.precio_unitario*x.cantidad, 0);
      const iva = normItems.reduce((acc,x)=> acc + (x.precio_unitario*x.cantidad)*(Number(x.iva_porcentaje||0)/100), 0);
      const monto_total = Number((sub+iva+costo_envio).toFixed(2));
      payload = { envio, items:normItems, costo_envio, monto_total };
    } else {
      return res.status(400).json({ message:"Datos inválidos", detalles: error.details?.map(d=>d.message)||[] });
    }
  }
  const { envio, items, costo_envio } = payload;
  const subTotal = items.reduce((acc,x)=> acc + Number(x.precio_unitario||0)*Number(x.cantidad||1), 0);
  const ivaTotal = items.reduce((acc,x)=> acc + (Number(x.precio_unitario||0)*Number(x.cantidad||1))*(Number(x.iva_porcentaje||0)/100), 0);
  const monto_total = Number((subTotal + ivaTotal + Number(costo_envio||0)).toFixed(2));
  const userId = req.user && req.user.id;
  if(!userId) return res.status(401).json({ message:"No autorizado" });
  try{
    let pedido = null;
    await sequelize.transaction(async(t)=>{
      pedido = await Order.create({
        user_id: userId,
        monto_total: Number(monto_total||0),
        costo_envio: Number(costo_envio||0),
        nombre: envio.nombre||"",
        direccion: envio.direccion||"",
        ciudad: envio.ciudad||"",
        provincia: envio.provincia||"",
        pais: envio.pais||"",
        codigo_postal: envio.codigo_postal||"",
        telefono: envio.telefono||"",
        metodo_entrega: envio.metodo_entrega||""
      },{ transaction:t });
      for(const it of items){
        const payload = {
          pedido_id: pedido.id,
          producto_id: String(it.id_producto),
          variante_id: it.id_variante!=null? String(it.id_variante) : null,
          cantidad: Number(it.cantidad||1),
          precio_unitario: Number(it.precio_unitario||0),
          iva_porcentaje: Number(it.iva_porcentaje||0),
          nombre: it.nombre||""
        };
        await OrderItem.create(payload,{ transaction:t });
      }
    });
    res.status(201).json({ pedido: { id: pedido.id, monto_total: pedido.monto_total } });
  }catch(e){
    const detalles = Array.isArray(e?.errors)? e.errors.map(x=>x.message) : undefined;
    res.status(500).json({ message:"No se pudo agregar el detalle del pedido", detalles });
  }
}

export async function history(req,res){
  const userId = req.user && req.user.id;
  const status = String(req.query.status||"").trim();
  const sort = String(req.query.sort||"fecha_desc").trim();
  const where = { user_id:userId };
  if(status) where.estado = status.toLowerCase();
  const order = [];
  if(sort==="fecha_asc") order.push(["createdAt","ASC"]);
  else if(sort==="monto_desc") order.push(["monto_total","DESC"]);
  else if(sort==="monto_asc") order.push(["monto_total","ASC"]);
  else order.push(["createdAt","DESC"]);
  const items = await Order.findAll({ where, order });
  res.json({ items });
}

export async function order(req,res){
  const id = Number(req.params.id);
  const userId = req.user && req.user.id;
  const ped = await Order.findOne({ where:{ id, user_id:userId } });
  if(!ped) return res.status(404).json({ message:"Pedido no encontrado" });
  const detalle = await OrderItem.findAll({ where:{ pedido_id: ped.id } });
  res.json({ pedido: ped, items: detalle });
}
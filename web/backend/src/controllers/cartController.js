import Joi from "joi";
import fetch from "node-fetch";
import https from "https";
import { Cart, CartItem } from "../models/Cart.js";
import { sequelize } from "../config/database.js";

async function getActiveCart(userId){
  let cart = await Cart.findOne({ where:{ user_id:userId, estado:"activo" } });
  if(!cart) cart = await Cart.create({ user_id:userId, estado:"activo" });
  return cart;
}

export async function get(req,res){
  const cart = await getActiveCart(req.user.id);
  const items = await CartItem.findAll({ where:{ cart_id:cart.id }, order:[["id","ASC"]] });
  res.json(items);
}

const addSchema = Joi.object({ producto_id:Joi.any().required(), cantidad:Joi.number().integer().min(1).default(1), variante_id:Joi.any().optional(), precio_unitario:Joi.number().min(0).optional(), iva_porcentaje:Joi.number().min(0).max(100).optional() });

export async function add(req,res){
  const { value, error } = addSchema.validate(req.body||{});
  if(error) return res.status(400).json({ message:"Datos inválidos" });
  const { producto_id, cantidad, variante_id } = value;
  const cart = await getActiveCart(req.user.id);
  const where = { cart_id:cart.id, producto_id:String(producto_id), variante_id: variante_id?String(variante_id):null };
  let item = await CartItem.findOne({ where });
  if(item){
    item.cantidad = item.cantidad + cantidad;
    await item.save();
  } else {
    const precio_base = Number(value.precio_unitario!=null? value.precio_unitario : 0);
    const iva_porcentaje = Number(value.iva_porcentaje!=null? value.iva_porcentaje : 21);
    item = await CartItem.create({ ...where, cantidad, precio_base, iva_porcentaje });
  }
  const items = await CartItem.findAll({ where:{ cart_id:cart.id }, order:[["id","ASC"]] });
  res.status(201).json({ items });
}

export async function update(req,res){
  const id = Number(req.params.id);
  const qty = Number(req.body && req.body.cantidad);
  if(!id || !qty || qty<1) return res.status(400).json({ message:"Cantidad inválida" });
  const cart = await getActiveCart(req.user.id);
  const item = await CartItem.findOne({ where:{ id, cart_id:cart.id } });
  if(!item) return res.status(404).json({ message:"Item no encontrado" });
  item.cantidad = qty; await item.save();
  res.json(item);
}

const updateByPayloadSchema = Joi.object({ id_producto:Joi.any().required(), id_variante:Joi.any().allow(null).optional(), cantidad:Joi.number().integer().min(1).required() });
export async function updateItemByPayload(req,res){
  const { value, error } = updateByPayloadSchema.validate(req.body||{});
  if(error) return res.status(400).json({ message:"Datos inválidos" });
  const { id_producto, id_variante, cantidad } = value;
  const cart = await getActiveCart(req.user.id);
  const vId = id_variante!=null? String(id_variante) : null;
  const item = await CartItem.findOne({ where:{ cart_id:cart.id, producto_id:String(id_producto), variante_id:vId } });
  if(!item) return res.status(404).json({ message:"Item no encontrado" });
  item.cantidad = Number(cantidad); await item.save();
  res.json(item);
}

export async function remove(req,res){
  const id = Number(req.params.id);
  const cart = await getActiveCart(req.user.id);
  const item = await CartItem.findOne({ where:{ id, cart_id:cart.id } });
  if(!item) return res.status(404).json({ message:"Item no encontrado" });
  await item.destroy();
  res.json({ ok:true });
}

const removeByPayloadSchema = Joi.object({ id_producto:Joi.any().required(), id_variante:Joi.any().allow(null).optional() });
export async function removeItemByPayload(req,res){
  const { value, error } = removeByPayloadSchema.validate(req.body||{});
  if(error) return res.status(400).json({ message:"Datos inválidos" });
  const { id_producto, id_variante } = value;
  const cart = await getActiveCart(req.user.id);
  const vId = id_variante!=null? String(id_variante) : null;
  const item = await CartItem.findOne({ where:{ cart_id:cart.id, producto_id:String(id_producto), variante_id:vId } });
  if(!item) return res.status(404).json({ message:"Item no encontrado" });
  await item.destroy();
  res.json({ ok:true });
}

export async function clear(req,res){
  const cart = await getActiveCart(req.user.id);
  await CartItem.destroy({ where:{ cart_id:cart.id } });
  res.json({ ok:true });
}

export async function shippingMethods(req,res){
  res.json([{ id:"standard", nombre:"Estándar" },{ id:"express", nombre:"Express" }]);
}

const ORIGIN = { lat: -29.140, lon: -59.265 }; // Goya, Corrientes (fallback)
const ORIGIN_ADDR = "España 831, Goya, Corrientes, Argentina";
let ORIGIN_CACHE = null;
const PROV_CENTERS = {
  "buenos aires":{lat:-36.3,lon:-60},"caba":{lat:-34.6037,lon:-58.3816},"capital federal":{lat:-34.6037,lon:-58.3816},
  "catamarca":{lat:-28.5,lon:-65.8},"chaco":{lat:-26.5,lon:-60.75},"chubut":{lat:-43.3,lon:-67.5},"cordoba":{lat:-31.4,lon:-64.18},"corrientes":{lat:-27.48,lon:-58.83},
  "entre rios":{lat:-31.73,lon:-60.5},"formosa":{lat:-26.18,lon:-58.15},"jujuy":{lat:-24.18,lon:-65.33},"la pampa":{lat:-36.62,lon:-64.29},"la rioja":{lat:-29.41,lon:-66.86},
  "mendoza":{lat:-32.89,lon:-68.83},"misiones":{lat:-27.37,lon:-55.89},"neuquen":{lat:-38.95,lon:-68.06},"rio negro":{lat:-40.8,lon:-67.8},"salta":{lat:-24.78,lon:-65.41},
  "san juan":{lat:-31.54,lon:-68.52},"san luis":{lat:-33.3,lon:-66.34},"santa cruz":{lat:-46.59,lon:-68.3},"santa fe":{lat:-31.64,lon:-60.7},"santiago del estero":{lat:-27.79,lon:-64.26},
  "tierra del fuego":{lat:-54.8,lon:-68.3},"tucuman":{lat:-26.82,lon:-65.22}
};
function norm(s){ return String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim(); }
function haversineKm(a,b){ const R=6371; const dLat=(b.lat-a.lat)*Math.PI/180; const dLon=(b.lon-a.lon)*Math.PI/180; const la1=a.lat*Math.PI/180; const la2=b.lat*Math.PI/180; const x=Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2; return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x)); }
async function geocodeAR({ ciudad, provincia, pais, address }){
  const q = address || [ciudad,provincia,pais||"Argentina"].filter(Boolean).join(", ");
  if(!q) return null;
  const url=`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ar&q=${encodeURIComponent(q)}`;
  const arr = await fetchJSON(url);
  const p = Array.isArray(arr)&&arr.length?arr[0]:null;
  if(!p) return null;
  return { lat:Number(p.lat), lon:Number(p.lon) };
}
async function originCoords(){
  if(ORIGIN_CACHE) return ORIGIN_CACHE;
  try{ const o = await geocodeAR({ address: ORIGIN_ADDR }); if(o){ ORIGIN_CACHE = o; return o; } }catch{}
  ORIGIN_CACHE = ORIGIN; return ORIGIN;
}
function methodRates(nombre){
  const n = norm(nombre);
  if(n.includes("express")) return { base:1500, porKm:80 };
  if(n.includes("estandar")||n.includes("standard")) return { base:1000, porKm:50 };
  if(n.includes("moto")) return { base:1200, porKm:70 };
  if(n.includes("retiro")||n.includes("tienda")||n.includes("local")) return { base:0, porKm:0 };
  return { base:800, porKm:40 };
}
const costSchema = Joi.object({ ciudad:Joi.string().allow("").optional(), provincia:Joi.string().allow("").optional(), pais:Joi.string().allow("").optional(), direccion:Joi.string().allow("").optional(), metodo_entrega:Joi.string().optional() });
export async function shippingCost(req,res){
  const { value, error } = costSchema.validate(req.body||{});
  if(error) return res.status(400).json({ message:"Datos inválidos" });
  const { ciudad, provincia, pais, direccion, metodo_entrega } = value;
  let dest = null;
  try{
    const query = [direccion, ciudad, provincia, pais||"Argentina"].filter(Boolean).join(", ");
    dest = await geocodeAR({ address: query });
  }catch{}
  if(!dest){ const key = norm(provincia); dest = PROV_CENTERS[key] || null; }
  if(!dest) return res.status(400).json({ message:"Ubicación no válida" });
  const orig = await originCoords();
  const km = Math.round(haversineKm(orig, dest));
  const { base, porKm } = methodRates(metodo_entrega||"estandar");
  const montoDist = porKm>0? porKm*km : 0;
  const costo = base + montoDist;
  res.json({ distancia_km: km, costo_envio: Number(costo.toFixed(2)), tarifa_base: base, tarifa_por_km: porKm, monto_por_distancia: Number(montoDist.toFixed(2)) });
}

export async function checkout(req,res){
  const cart = await getActiveCart(req.user.id);
  await sequelize.transaction(async(t)=>{
    await Cart.update({ estado:"cerrado" },{ where:{ id:cart.id }, transaction:t });
  });
  res.status(201).json({ ok:true });
}
function httpsGetJSON(url){
  return new Promise((resolve,reject)=>{
    const req = https.get(url,{ headers:{ "Accept":"application/json", "User-Agent":"Feraytek/1.0" } },res=>{
      let data=""; res.on("data",chunk=>data+=chunk);
      res.on("end",()=>{ try{ resolve(JSON.parse(data)); }catch(e){ reject(e); } });
    });
    req.on("error",reject);
  });
}
async function fetchJSON(url){
  if(typeof fetch === "function"){
    const r = await fetch(url,{ headers:{ "Accept":"application/json", "User-Agent":"Feraytek/1.0" } });
    return await r.json();
  }
  return await httpsGetJSON(url);
}
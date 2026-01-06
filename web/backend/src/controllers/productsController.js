import Joi from "joi";
import { Op } from "sequelize";
import { Product } from "../models/Product.js";
import { ProductReview } from "../models/ProductReview.js";
import fs from "fs";
import path from "path";

const listSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(12),
  categoria: Joi.any().optional(),
  q: Joi.string().allow("").optional(),
  estado: Joi.string().valid("activo","inactivo","todos").default("activo")
});

export async function list(req,res){
  const { value, error } = listSchema.validate(req.query||{});
  if(error) return res.status(400).json({ message:"Parámetros inválidos" });
  const { page, limit, categoria, q, estado } = value;
  const where = {};
  if(estado !== "todos") where.estado = estado;
  if(categoria != null && categoria !== "Todos") where.id_categoria = categoria;
  if(q) where[Op.or] = [
    { nombre:{[Op.like]:`%${q}%`} },
    { descripcion:{[Op.like]:`%${q}%`} }
  ];
  const offset = (page-1)*limit;
  const { rows, count } = await Product.findAndCountAll({ where, limit, offset, order:[["id","ASC"]] });
  res.json({ items: rows, total: count, page, limit });
}

export async function detail(req,res){
  const id = Number(req.params.id);
  if(!id) return res.status(400).json({ message:"ID inválido" });
  const p = await Product.findByPk(id);
  if(!p) return res.status(404).json({ message:"Producto no encontrado" });
  res.json(p);
}

const upsertSchema = Joi.object({
  nombre: Joi.string().min(2).max(128).required(),
  descripcion: Joi.string().allow("").optional(),
  precio_base: Joi.number().min(0).required(),
  stock: Joi.number().integer().min(0).required(),
  iva_porcentaje: Joi.number().min(0).max(100).default(21),
  stock_minimo: Joi.number().integer().min(0).default(0),
  id_categoria: Joi.number().integer().optional(),
  estado: Joi.string().valid("activo","inactivo").default("activo"),
  imagen: Joi.string().uri().allow("").optional()
});

export async function create(req,res){
  const { value, error } = upsertSchema.validate(req.body||{});
  if(error) return res.status(400).json({ message:"Datos inválidos" });
  const p = await Product.create(value);
  res.status(201).json(p);
}

export async function update(req,res){
  const id = Number(req.params.id);
  if(!id) return res.status(400).json({ message:"ID inválido" });
  const { value, error } = upsertSchema.validate(req.body||{});
  if(error) return res.status(400).json({ message:"Datos inválidos" });
  const p = await Product.findByPk(id);
  if(!p) return res.status(404).json({ message:"Producto no encontrado" });
  await p.update(value);
  res.json(p);
}

export async function remove(req,res){
  const id = Number(req.params.id);
  if(!id) return res.status(400).json({ message:"ID inválido" });
  const p = await Product.findByPk(id);
  if(!p) return res.status(404).json({ message:"Producto no encontrado" });
  await p.update({ estado:"inactivo" });
  res.json({ ok:true });
}

export async function activeCategories(req,res){
  const rows = await Product.findAll({ attributes:["id_categoria"], where:{ estado:"activo" } });
  const set = new Set(rows.map(r=>r.id_categoria).filter(v=>v!=null));
  const items = Array.from(set).map(id=>({ id, nombre:String(id) }));
  res.json({ items });
}

export async function categoryDetail(req,res){
  const id = Number(req.params.id);
  if(!id) return res.status(400).json({ message:"ID inválido" });
  const rows = await Product.findAll({ where:{ id_categoria:id, estado:"activo" }, order:[["id","ASC"]] });
  res.json({ id, items: rows });
}

export async function categoryStats(req,res){
  const rows = await Product.findAll();
  const stats = {};
  rows.forEach(p=>{
    const c = p.id_categoria || 0;
    stats[c] = stats[c] || { id_categoria:c, activos:0, inactivos:0, total:0 };
    stats[c].total++;
    if(p.estado === "activo") stats[c].activos++; else stats[c].inactivos++;
  });
  res.json({ items: Object.values(stats) });
}

export async function productImages(req,res){
  try{
    const id = Number(req.params.id);
    if(!id) return res.json({ items: [] });
    const baseDir = path.join(process.cwd(), "backend", "static", "productos");
    let files = [];
    try{ files = fs.readdirSync(baseDir); }catch{ files = []; }
    const matches = (files||[]).filter(f=> new RegExp(`^${id}(?:[_-].*)?\.(jpg|jpeg|png|svg)$`,`i`).test(f) );
    const items = matches.map(f=> ({ url_imagen: `/static/productos/${f}` }) );
    res.json({ items });
  }catch{ res.json({ items: [] }); }
}

const reviewCreateSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comentario: Joi.string().allow("").max(2000).optional()
});

export async function addReview(req,res){
  const producto_id = Number(req.params.id || (req.body && (req.body.id_producto||req.body.producto_id)));
  if(!producto_id) return res.status(400).json({ message:"ID inválido" });
  const incoming = req.body||{};
  const payload = { rating: incoming.calificacion!=null? Number(incoming.calificacion) : incoming.rating, comentario: incoming.comentario };
  const { value, error } = reviewCreateSchema.validate(payload);
  if(error) return res.status(400).json({ message:"Datos inválidos", detalles:error.details?.map(d=>d.message)||[] });
  const p = await Product.findByPk(producto_id);
  if(!p) return res.status(404).json({ message:"Producto no encontrado" });
  const row = await ProductReview.create({ producto_id, user_id:req.user.id, rating:value.rating, comentario:value.comentario||"", estado:"inactivo" });
  res.status(201).json({ id: row.id, rating: row.rating, comentario: row.comentario, estado: row.estado });
}

export async function approveReview(req,res){
  const id = Number(req.params.id);
  if(!id) return res.status(400).json({ message:"ID inválido" });
  const role = String((req.user && req.user.rol)||"").toLowerCase();
  if(!(/admin|superadmin/.test(role))) return res.status(403).json({ message:"No autorizado" });
  const row = await ProductReview.findByPk(id);
  if(!row) return res.status(404).json({ message:"Reseña no encontrada" });
  row.estado = "activo";
  await row.save();
  res.json({ ok:true });
}

const reviewListSchema = Joi.object({ page:Joi.number().integer().min(1).default(1), limit:Joi.number().integer().min(1).max(100).default(10) });
export async function listReviews(req,res){
  const producto_id = Number(req.params.id);
  if(!producto_id) return res.status(400).json({ message:"ID inválido" });
  const { value, error } = reviewListSchema.validate(req.query||{});
  if(error) return res.status(400).json({ message:"Parámetros inválidos" });
  const { page, limit } = value;
  const offset = (page-1)*limit;
  const { rows, count } = await ProductReview.findAndCountAll({ where:{ producto_id, estado:"activo" }, limit, offset, order:[ ["id","DESC"] ] });
  const avg = await ProductReview.findAll({ where:{ producto_id, estado:"activo" }, attributes:["rating"] });
  const ratings = avg.map(r=> Number(r.rating)||0);
  const avgRating = ratings.length? Number((ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(2)) : 0;
  res.json({ items: rows, total: count, page, limit, avg_rating: avgRating });
}

import Joi from "joi";
import { SupportTicket } from "../models/SupportTicket.js";

const createSchema = Joi.object({
  asunto: Joi.string().trim().min(2).max(128).required(),
  descripcion: Joi.string().trim().min(2).max(4000).required(),
  prioridad: Joi.string().trim().lowercase().optional()
});

export async function create(req, res){
  const { asunto, descripcion, prioridad } = req.body;
  let pr = String(prioridad||"media").toLowerCase();
  if(!["alta","media","baja"].includes(pr)) pr = "media";
  const t = await SupportTicket.create({ userId: req.user.id, asunto, descripcion, prioridad: pr });
  res.status(201).json({ id: t.id, asunto: t.asunto, descripcion: t.descripcion, prioridad: t.prioridad, estado: t.estado });
}

export async function myTickets(req, res){
  const items = await SupportTicket.findAll({ where: { userId: req.user.id }, order: [["id","DESC"]] });
  res.json({ items });
}

export async function detail(req, res){
  const id = Number(req.params.id || 0);
  const t = await SupportTicket.findByPk(id);
  if(!t) return res.status(404).json({ message: "No encontrado" });
  const isOwner = t.userId === req.user.id;
  const role = String((req.user && req.user.rol) || "").toLowerCase();
  const isAdmin = role.includes("admin") || role.includes("superadmin");
  if(!isOwner && !isAdmin) return res.status(403).json({ message: "No permitido" });
  res.json({ item: t });
}

export const schemas = { createSchema };

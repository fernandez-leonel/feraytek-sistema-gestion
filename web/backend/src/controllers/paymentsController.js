import Joi from "joi";
import { Payment, Order } from "../models/Order.js";

const paySchema = Joi.object({
  id_pedido: Joi.number().integer().required(),
  descripcion: Joi.string().allow(""),
  monto_total: Joi.number().min(0).required()
});

function genTx(){
  const s = Math.random().toString(36).slice(2)+Date.now().toString(36);
  return s.slice(0,24);
}

export async function pay(req,res){
  const { value, error } = paySchema.validate(req.body||{});
  if(error) return res.status(400).json({ message:"Datos inválidos" });
  const { id_pedido, descripcion, monto_total } = value;
  const userId = req.user && req.user.id;
  const ped = await Order.findOne({ where:{ id:id_pedido, user_id:userId } });
  if(!ped) return res.status(404).json({ message:"Pedido no encontrado" });
  const tx = genTx();
  const pago = await Payment.create({ user_id:userId, pedido_id:id_pedido, descripcion, monto_total:Number(monto_total||0), id_transaccion:tx, estado_pago:"pendiente" });
  res.status(201).json({ pago });
}

export async function consult(req,res){
  const userId = req.user && req.user.id;
  const pagos = await Payment.findAll({ where:{ user_id:userId }, order:[ ["fecha","DESC"] ] });
  res.json({ pagos });
}

export async function simulateApprove(req,res){
  const tx = String(req.params.id_transaccion||"");
  const pago = await Payment.findOne({ where:{ id_transaccion: tx } });
  if(!pago) return res.status(404).json({ message:"Transacción no encontrada" });
  pago.estado_pago = "aprobado";
  await pago.save();
  res.json({ ok:true });
}
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Joi from "joi";
import { User } from "../models/User.js";
import { PasswordReset } from "../models/PasswordReset.js";
import { onlyDigits, passwordStrong } from "../utils/patterns.js";
import { sendResetEmail } from "../utils/email.js";
import { sendPasswordUpdatedEmail } from "../utils/email.js";

const SECRET = process.env.JWT_SECRET || "dev-secret";

const registerSchema = Joi.object({
  nombre_usuario: Joi.string().min(3).max(32).required(),
  email: Joi.string().email().required(),
  password: Joi.string().pattern(passwordStrong).required(),
  confirmPassword: Joi.any().valid(Joi.ref("password")).required(),
  dni: Joi.string().pattern(onlyDigits).min(6).max(12).optional(),
  nombre: Joi.string().max(64).optional(),
  apellido: Joi.string().max(64).optional(),
  telefono: Joi.string().pattern(onlyDigits).min(7).max(15).optional(),
  direccion: Joi.string().max(128).optional(),
  ciudad: Joi.string().max(64).optional(),
  provincia: Joi.string().max(64).optional(),
  pais: Joi.string().max(64).optional(),
  codigo_postal: Joi.string().pattern(onlyDigits).min(3).max(10).optional(),
  fecha_nacimiento: Joi.date().optional()
});

const loginSchema = Joi.alternatives().try(
  Joi.object({ email: Joi.string().email().required(), password: Joi.string().required() }),
  Joi.object({ nombre_usuario: Joi.string().min(3).max(32).required(), password: Joi.string().required() }),
  Joi.object({ identificador: Joi.string().min(3).max(128).required(), password: Joi.string().required() })
);

export async function register(req, res) {
  const { nombre_usuario, email, password, dni, nombre, apellido, telefono, direccion, ciudad, provincia, pais, codigo_postal, fecha_nacimiento } = req.body;
  const existing = await User.findOne({ where: { email } });
  if (existing) return res.status(409).json({ message: "Email ya registrado" });
  const existingUser = await User.findOne({ where: { nombre_usuario } });
  if (existingUser) return res.status(409).json({ message: "Nombre de usuario ya existe" });
  const password_hash = await bcrypt.hash(password, 10);
  const user = await User.create({ nombre_usuario, email, password_hash, dni, nombre, apellido, telefono, direccion, ciudad, provincia, pais, codigo_postal, fecha_nacimiento, rol: "cliente" });
  const token = jwt.sign({ id: user.id, rol: user.rol }, SECRET, { expiresIn: "7d" });
  res.status(201).json({ token, usuario: { id: user.id, nombre_usuario: user.nombre_usuario, email: user.email, rol: user.rol } });
}

export async function login(req, res) {
  const { email, nombre_usuario, identificador, password } = req.body;
  let user = null;
  if (email) {
    user = await User.findOne({ where: { email } });
  } else {
    const uname = nombre_usuario || identificador;
    if (!uname) return res.status(400).json({ message: "Datos inválidos" });
    user = await User.findOne({ where: { nombre_usuario: uname } });
  }
  if (!user) return res.status(401).json({ message: "Credenciales inválidas" });
  if (user.estado !== "activo") return res.status(403).json({ message: "Usuario inhabilitado" });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ message: "Credenciales inválidas" });
  const token = jwt.sign({ id: user.id, rol: user.rol }, SECRET, { expiresIn: "7d" });
  res.json({ token, usuario: { id: user.id, nombre_usuario: user.nombre_usuario, email: user.email, rol: user.rol } });
}

export async function me(req, res) {
  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ message: "No encontrado" });
  res.json({ id: user.id, nombre_usuario: user.nombre_usuario, email: user.email, rol: user.rol });
}

export const schemas = { registerSchema, loginSchema };

const forgotSchema = Joi.object({
  email: Joi.string().email().required()
});

const resetSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().min(4).max(12).required(),
  newPassword: Joi.string().pattern(passwordStrong).required(),
  confirmPassword: Joi.any().valid(Joi.ref("newPassword")).required()
});

function makeCode(){
  return String(Math.floor(100000 + Math.random()*900000));
}

export async function forgotPassword(req, res){
  const { email } = req.body;
  const user = await User.findOne({ where: { email } });
  if(!user) return res.status(404).json({ message: "Email no encontrado" });
  const code = makeCode();
  const expires_at = new Date(Date.now() + 1000*60*10);
  await PasswordReset.create({ userId: user.id, code, expires_at, used: false });
  await sendResetEmail(email, code);
  res.json({ message: "Código enviado" });
}

export async function resetPassword(req, res){
  const { email, code, newPassword } = req.body;
  const user = await User.findOne({ where: { email } });
  if(!user) return res.status(404).json({ message: "Email no encontrado" });
  const pr = await PasswordReset.findOne({ where: { userId: user.id, code }, order: [["id","DESC"]] });
  if(!pr) return res.status(400).json({ message: "Código inválido" });
  if(pr.used) return res.status(400).json({ message: "Código ya utilizado" });
  if(pr.expires_at < new Date()) return res.status(400).json({ message: "Código expirado" });
  const password_hash = await bcrypt.hash(newPassword, 10);
  await user.update({ password_hash });
  await pr.update({ used: true });
  res.json({ message: "Contraseña actualizada" });
}

export const resetSchemas = { forgotSchema, resetSchema };

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().pattern(passwordStrong).required(),
  confirmPassword: Joi.any().valid(Joi.ref("newPassword")).required()
});

export async function changePassword(req, res){
  const { currentPassword, newPassword } = req.body;
  const user = await User.findByPk(req.user.id);
  if(!user) return res.status(404).json({ message: "No encontrado" });
  const ok = await bcrypt.compare(currentPassword, user.password_hash);
  if(!ok) return res.status(401).json({ message: "Contraseña actual incorrecta" });
  const password_hash = await bcrypt.hash(newPassword, 10);
  await user.update({ password_hash });
  try{ await sendPasswordUpdatedEmail(user.email); }catch{}
  res.json({ message: "Contraseña actualizada" });
}

export const passwordSchemas = { changePasswordSchema };
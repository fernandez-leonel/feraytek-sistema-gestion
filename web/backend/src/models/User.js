import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const User = sequelize.define("User", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre_usuario: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING, allowNull: false },
  rol: { type: DataTypes.ENUM("cliente", "admin", "superadmin"), defaultValue: "cliente" },
  estado: { type: DataTypes.ENUM("activo", "inactivo"), defaultValue: "activo" },
  dni: { type: DataTypes.STRING },
  nombre: { type: DataTypes.STRING },
  apellido: { type: DataTypes.STRING },
  telefono: { type: DataTypes.STRING },
  direccion: { type: DataTypes.STRING },
  ciudad: { type: DataTypes.STRING },
  provincia: { type: DataTypes.STRING },
  pais: { type: DataTypes.STRING },
  codigo_postal: { type: DataTypes.STRING },
  fecha_nacimiento: { type: DataTypes.DATE }
});
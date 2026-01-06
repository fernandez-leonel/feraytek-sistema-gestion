import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const SupportTicket = sequelize.define("SupportTicket", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  asunto: { type: DataTypes.STRING, allowNull: false },
  descripcion: { type: DataTypes.TEXT, allowNull: false },
  prioridad: { type: DataTypes.ENUM("alta","media","baja"), defaultValue: "media" },
  estado: { type: DataTypes.ENUM("nuevo","pendiente","en_proceso","resuelto","cerrado"), defaultValue: "pendiente" }
});


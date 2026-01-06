import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const PasswordReset = sequelize.define("PasswordReset", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  code: { type: DataTypes.STRING(12), allowNull: false },
  expires_at: { type: DataTypes.DATE, allowNull: false },
  used: { type: DataTypes.BOOLEAN, defaultValue: false }
});
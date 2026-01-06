import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Product = sequelize.define("Product", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING, allowNull: false },
  descripcion: { type: DataTypes.TEXT },
  precio_base: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  iva_porcentaje: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 21 },
  stock_minimo: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  id_categoria: { type: DataTypes.INTEGER },
  estado: { type: DataTypes.ENUM("activo","inactivo"), defaultValue: "activo" },
  imagen: { type: DataTypes.STRING }
});
import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Cart = sequelize.define("Cart", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  estado: { type: DataTypes.ENUM("activo","cerrado"), defaultValue: "activo" }
});

export const CartItem = sequelize.define("CartItem", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  cart_id: { type: DataTypes.INTEGER, allowNull: false },
  producto_id: { type: DataTypes.STRING, allowNull: false },
  variante_id: { type: DataTypes.STRING },
  cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  precio_base: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  iva_porcentaje: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 21 },
  nombre: { type: DataTypes.STRING }
});

Cart.hasMany(CartItem, { foreignKey: "cart_id" });
CartItem.belongsTo(Cart, { foreignKey: "cart_id" });
import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const ProductReview = sequelize.define("ProductReview", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  producto_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  rating: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
  comentario: { type: DataTypes.TEXT },
  estado: { type: DataTypes.ENUM("activo","inactivo"), defaultValue: "activo" }
});

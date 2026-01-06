import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Order = sequelize.define("Order", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  estado: { type: DataTypes.ENUM("procesando","enviado","entregado","cancelado"), defaultValue: "procesando" },
  monto_total: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  costo_envio: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  nombre: { type: DataTypes.STRING },
  direccion: { type: DataTypes.STRING },
  ciudad: { type: DataTypes.STRING },
  provincia: { type: DataTypes.STRING },
  pais: { type: DataTypes.STRING },
  codigo_postal: { type: DataTypes.STRING },
  telefono: { type: DataTypes.STRING },
  metodo_entrega: { type: DataTypes.STRING }
}, { tableName: "pedidos", freezeTableName: true });

export const OrderItem = sequelize.define("OrderItem", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  pedido_id: { type: DataTypes.INTEGER, allowNull: false },
  producto_id: { type: DataTypes.STRING, allowNull: false },
  variante_id: { type: DataTypes.STRING },
  cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  precio_unitario: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  iva_porcentaje: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  nombre: { type: DataTypes.STRING }
}, { tableName: "pedido_detalle", freezeTableName: true });

Order.hasMany(OrderItem, { foreignKey: "pedido_id" });
OrderItem.belongsTo(Order, { foreignKey: "pedido_id" });

export const Payment = sequelize.define("Payment", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  pedido_id: { type: DataTypes.INTEGER, allowNull: false },
  descripcion: { type: DataTypes.STRING },
  monto_total: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  id_transaccion: { type: DataTypes.STRING, allowNull: false, unique: true },
  estado_pago: { type: DataTypes.ENUM("pendiente","aprobado","rechazado"), defaultValue: "pendiente" },
  fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: "pagos", freezeTableName: true });
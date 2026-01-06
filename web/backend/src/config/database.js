import { Sequelize } from "sequelize";

export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: process.env.DB_FILE || "backend/dev.sqlite",
  logging: false
});
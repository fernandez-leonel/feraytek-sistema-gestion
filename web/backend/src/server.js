import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { sequelize } from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import ordersRoutes from "./routes/ordersRoutes.js";
import paymentsRoutes from "./routes/paymentsRoutes.js";
import productsRoutes from "./routes/productsRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import { shippingMethods, shippingCost, checkout } from "./controllers/cartController.js";
import { requireAuth } from "./middlewares/auth.js";

dotenv.config();

const app = express();
const corsOpts = {
  origin: [
    "http://localhost:5173",
    "http://localhost:3001",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3000"
  ],
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
};
app.use(cors(corsOpts));
app.options("*", cors(corsOpts));
app.use(express.json());
app.use(morgan("dev"));
app.use("/static", express.static(path.join(process.cwd(), "backend", "static")));

app.use("/api/auth", authRoutes);
app.use("/api/carrito", cartRoutes);
app.use("/api", ordersRoutes);
app.use("/api", paymentsRoutes);
app.use("/api", productsRoutes);
app.use("/api", supportRoutes);
app.get("/api/envios", shippingMethods);
app.get("/api/envios/metodos", shippingMethods);
app.post("/api/envios/costo", shippingCost);
app.post("/api/carrito/checkout", requireAuth, checkout);

const PORT = process.env.PORT || 3000;

async function start() {
  await sequelize.sync();
  app.listen(PORT, () => {
    console.log(`API escuchando en http://localhost:${PORT}`);
  });
}

start();

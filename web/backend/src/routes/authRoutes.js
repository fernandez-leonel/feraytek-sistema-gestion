import { Router } from "express";
import { register, login, me, schemas, forgotPassword, resetPassword, resetSchemas, changePassword, passwordSchemas } from "../controllers/authController.js";
import { validate } from "../middlewares/validate.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.post("/register", validate(schemas.registerSchema), register);
router.post("/login", validate(schemas.loginSchema), login);
router.get("/me", requireAuth, me);

// Compatibilidad con rutas documentadas en /users/*
router.post("/users/register", validate(schemas.registerSchema), register);
router.post("/users/login", validate(schemas.loginSchema), login);
router.get("/users/profile", requireAuth, me);
router.put("/users/password", requireAuth, validate(passwordSchemas.changePasswordSchema), changePassword);

router.post("/auth/forgot-password", validate(resetSchemas.forgotSchema), forgotPassword);
router.post("/auth/reset-password", validate(resetSchemas.resetSchema), resetPassword);

export default router;
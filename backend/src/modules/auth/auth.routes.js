import { Router } from "express";
import * as authController from "./auth.controller.js";
import { validate } from "../../middlewares/validateRequest.js";
import { loginSchema, refreshTokenSchema, forgotPasswordSchema, resetPasswordSchema } from "./auth.validator.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

// Public routes (no auth required)
// Registration is handled by admin in /api/v1/users
router.post("/login", validate(loginSchema), authController.login);
router.post("/refresh-token", validate(refreshTokenSchema), authController.refreshToken);
router.post("/forgot-password", validate(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), authController.resetPassword);

// Protected routes
router.post("/logout", authenticate, authController.logout);
router.get("/me", authenticate, authController.getMe);

export default router;

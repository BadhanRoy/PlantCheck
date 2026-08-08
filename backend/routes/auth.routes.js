import express from "express";
import {
    signup,
    verifyEmail,
    login,
    googleLogin,
    googleSignup,
    logout,
    forgotPassword,
    resetPassword,
    checkAuth,
    resendVerificationCode  // ← ADD THIS
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// ===== AUTH ROUTES =====
router.post("/signup", signup);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", verifyToken, resendVerificationCode);  // ← ADD THIS
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/google-signup", googleSignup);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/check-auth", verifyToken, checkAuth);

export default router;
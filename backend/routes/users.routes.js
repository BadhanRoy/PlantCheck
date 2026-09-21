import express from "express";
import { updateProfile } from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.put("/profile", verifyToken, upload.single("profileImage"), updateProfile);

export default router;
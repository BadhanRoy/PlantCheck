import express from "express";
import { createDiagnosis, getDiagnosisImage, getRecentDiagnoses } from "../controllers/diagnosis.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { memoryUpload } from "../middleware/upload.js";

const router = express.Router();

router.use(verifyToken);
router.post("/", memoryUpload.single("image"), createDiagnosis);
router.get("/recent", getRecentDiagnoses);
router.get("/images/:id", getDiagnosisImage);

export default router;
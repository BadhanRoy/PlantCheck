import express from "express";
import cropCareController from "../controllers/cropCareController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.use(verifyToken);

router.get("/crops", cropCareController.getCrops);
router.post("/crops", cropCareController.createCrop);
router.get("/crops/:id", cropCareController.getCrop);
router.put("/crops/:id", cropCareController.updateCrop);
router.delete("/crops/:id", cropCareController.deleteCrop);
router.get("/crops/:id/weather", cropCareController.getCropWeather);
router.get("/crops/:id/recommendation", cropCareController.getRecommendation);
router.post("/crops/:id/water", cropCareController.markWatered);
router.get("/crops/:id/journal", cropCareController.getJournalEntries);
router.post("/crops/:id/journal", cropCareController.createJournalEntry);
router.get("/watering-reminders/stream", cropCareController.streamWateringReminders);

export default router;
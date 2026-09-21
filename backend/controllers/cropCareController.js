import Crop from "../models/Crop.js";
import CropJournalEntry from "../models/CropJournalEntry.js";
import { getWeather } from "../services/weatherService.js";
import { calculateWateringRecommendation } from "../services/cropCareService.js";

const wateringReminderClients = new Map();

const publishWateringReminder = (crop, recommendation) => {
  const clients = wateringReminderClients.get(crop.userId.toString());
  if (!clients) return;

  const payload = JSON.stringify({
    id: `${crop._id}-${crop.updatedAt?.getTime?.() || "due"}`,
    cropId: crop._id,
    cropName: crop.cropName,
    title: `💧 ${crop.cropName} needs watering`,
    message: recommendation.message,
  });

  for (const client of clients) {
    client.write(`data: ${payload}\n\n`);
  }
};

const serializeCrop = (crop) => {
  if (!crop) return null;

  const data = crop.toObject ? crop.toObject() : crop;

  return {
    id: data._id?.toString?.() ?? data.id,
    user_id: data.userId ? data.userId.toString() : null,
    crop_name: data.cropName || "",
    planting_date: data.plantingDate
      ? new Date(data.plantingDate).toISOString().split("T")[0]
      : "",
    growth_stage: data.growthStage || "Seedling",
    soil_type: data.soilType || "Loamy",
    location_name: data.locationName || "",
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    last_watered: data.lastWatered
      ? new Date(data.lastWatered).toISOString().split("T")[0]
      : null,
    next_watering: data.nextWatering
      ? new Date(data.nextWatering).toISOString().split("T")[0]
      : null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};

const normalizeCropBody = (body = {}) => {
  const cropName = body.crop_name ?? body.cropName ?? "";
  const plantingDate = body.planting_date ?? body.plantingDate ?? "";
  const growthStage = body.growth_stage ?? body.growthStage ?? "Seedling";
  const soilType = body.soil_type ?? body.soilType ?? "Loamy";
  const locationName = body.location_name ?? body.locationName ?? "";
  const latitude = body.latitude ?? null;
  const longitude = body.longitude ?? null;
  const lastWateredRaw = body.last_watered ?? body.lastWatered ?? "";

  return {
    cropName,
    plantingDate,
    growthStage,
    soilType,
    locationName,
    latitude: latitude === "" || latitude === null ? null : Number(latitude),
    longitude: longitude === "" || longitude === null ? null : Number(longitude),
    lastWatered: lastWateredRaw === "" ? null : new Date(lastWateredRaw),
  };
};

export const getCrops = async (req, res) => {
  try {
    const userId = req.user.id;
    const crops = await Crop.findByUser(userId);

    res.json({
      success: true,
      crops: crops.map(serializeCrop),
    });
  } catch (error) {
    console.error("Get crops error:", error);
    res.status(500).json({ success: false, message: "Failed to load crops" });
  }
};

export const createCrop = async (req, res) => {
  try {
    const userId = req.user.id;
    const payload = normalizeCropBody(req.body);

    if (!payload.cropName || !payload.plantingDate) {
      return res.status(400).json({
        success: false,
        message: "Crop name and planting date are required",
      });
    }

    if (payload.latitude === null || payload.longitude === null) {
      return res.status(400).json({
        success: false,
        message: "Please provide your crop location.",
      });
    }

    const createdCrop = await Crop.create({
      userId,
      ...payload,
    });

    res.status(201).json({
      success: true,
      message: "Crop added successfully",
      crop: serializeCrop(createdCrop),
    });
  } catch (error) {
    console.error("Create crop error:", error);
    res.status(500).json({ success: false, message: "Failed to add crop" });
  }
};

export const getCrop = async (req, res) => {
  try {
    const userId = req.user.id;
    const cropId = req.params.id;
    const crop = await Crop.findById(cropId, userId);

    if (!crop) {
      return res.status(404).json({ success: false, message: "Crop not found" });
    }

    res.json({ success: true, crop: serializeCrop(crop) });
  } catch (error) {
    console.error("Get crop error:", error);
    res.status(500).json({ success: false, message: "Failed to load crop" });
  }
};

export const updateCrop = async (req, res) => {
  try {
    const userId = req.user.id;
    const cropId = req.params.id;
    const existingCrop = await Crop.findById(cropId, userId);

    if (!existingCrop) {
      return res.status(404).json({ success: false, message: "Crop not found" });
    }

    const updates = normalizeCropBody({ ...existingCrop.toObject(), ...req.body });
    const updatedCrop = await Crop.update(cropId, userId, {
      ...updates,
      userId,
    });

    res.json({
      success: true,
      message: "Crop updated successfully",
      crop: serializeCrop(updatedCrop),
    });
  } catch (error) {
    console.error("Update crop error:", error);
    res.status(500).json({ success: false, message: "Failed to update crop" });
  }
};

export const deleteCrop = async (req, res) => {
  try {
    const userId = req.user.id;
    const cropId = req.params.id;
    const deleted = await Crop.delete(cropId, userId);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Crop not found" });
    }

    res.json({ success: true, message: "Crop deleted successfully" });
  } catch (error) {
    console.error("Delete crop error:", error);
    res.status(500).json({ success: false, message: "Failed to delete crop" });
  }
};

export const getCropWeather = async (req, res) => {
  try {
    const userId = req.user.id;
    const cropId = req.params.id;
    const crop = await Crop.findById(cropId, userId);

    if (!crop) {
      return res.status(404).json({ success: false, message: "Crop not found" });
    }

    if (!crop.latitude || !crop.longitude) {
      return res.status(400).json({ success: false, message: "This crop does not have a location" });
    }

    const weather = await getWeather(crop.latitude, crop.longitude);

    res.json({ success: true, weather });
  } catch (error) {
    console.error("Weather error:", error);
    res.status(500).json({ success: false, message: "Failed to get weather" });
  }
};

export const getRecommendation = async (req, res) => {
  try {
    const userId = req.user.id;
    const cropId = req.params.id;
    const crop = await Crop.findById(cropId, userId);

    if (!crop) {
      return res.status(404).json({ success: false, message: "Crop not found" });
    }

    if (!crop.latitude || !crop.longitude) {
      return res.status(400).json({ success: false, message: "Crop location is required" });
    }

    const weather = await getWeather(crop.latitude, crop.longitude);
    const recommendation = calculateWateringRecommendation(crop, weather);

    res.json({
      success: true,
      crop: serializeCrop(crop),
      weather,
      recommendation,
    });
  } catch (error) {
    console.error("Recommendation error:", error);
    res.status(500).json({ success: false, message: "Failed to generate recommendation" });
  }
};

export const markWatered = async (req, res) => {
  try {
    const userId = req.user.id;
    const cropId = req.params.id;
    const crop = await Crop.findById(cropId, userId);

    if (!crop) {
      return res.status(404).json({ success: false, message: "Crop not found" });
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 2);

    await Crop.markWatered(cropId, userId, nextDate.toISOString());
    await CropJournalEntry.create({
      userId,
      cropId,
      type: "watering",
      title: "Crop watered",
      details: "Watering recorded from Crop Care.",
    });
    const updatedCrop = await Crop.findById(cropId, userId);
    const cropName = crop.cropName || crop.crop_name || "Crop";

    res.json({
      success: true,
      message: `${cropName} marked as watered`,
      crop: serializeCrop(updatedCrop),
    });
  } catch (error) {
    console.error("Mark watered error:", error);
    res.status(500).json({ success: false, message: "Failed to mark crop as watered" });
  }
};

export const streamWateringReminders = (req, res) => {
  const userId = req.user.id.toString();
  const clients = wateringReminderClients.get(userId) || new Set();

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  res.write("retry: 10000\n\n");
  clients.add(res);
  wateringReminderClients.set(userId, clients);

  const heartbeat = setInterval(() => res.write(": keep-alive\n\n"), 30000);
  req.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(res);
    if (!clients.size) wateringReminderClients.delete(userId);
  });
};

export const checkDueWateringReminders = async () => {
  const crops = await Crop.find({
    latitude: { $ne: null },
    longitude: { $ne: null },
  });

  for (const crop of crops) {
    try {
      const weather = await getWeather(crop.latitude, crop.longitude);
      const recommendation = calculateWateringRecommendation(crop, weather);
      if (recommendation?.needsWater) {
        publishWateringReminder(crop, recommendation);
      }
    } catch (error) {
      console.error(`Watering reminder check failed for crop ${crop._id}:`, error);
    }
  }
};

export const getJournalEntries = async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id, req.user.id);
    if (!crop) {
      return res.status(404).json({ success: false, message: "Crop not found" });
    }

    const entries = await CropJournalEntry.find({
      cropId: crop._id,
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    return res.json({ success: true, entries });
  } catch (error) {
    console.error("Get journal entries error:", error);
    return res.status(500).json({ success: false, message: "Failed to load crop journal" });
  }
};

export const createJournalEntry = async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id, req.user.id);
    if (!crop) {
      return res.status(404).json({ success: false, message: "Crop not found" });
    }

    const title = String(req.body.title || "").trim();
    const details = String(req.body.details || "").trim();
    const type = ["observation", "treatment", "diagnosis"].includes(req.body.type)
      ? req.body.type
      : "observation";

    if (!title) {
      return res.status(400).json({ success: false, message: "Journal title is required" });
    }

    const entry = await CropJournalEntry.create({
      userId: req.user.id,
      cropId: crop._id,
      type,
      title,
      details,
    });

    return res.status(201).json({ success: true, entry });
  } catch (error) {
    console.error("Create journal entry error:", error);
    return res.status(500).json({ success: false, message: "Failed to save journal entry" });
  }
};

export default {
  getCrops,
  createCrop,
  getCrop,
  updateCrop,
  deleteCrop,
  getCropWeather,
  getRecommendation,
  markWatered,
  getJournalEntries,
  createJournalEntry,
  streamWateringReminders,
};
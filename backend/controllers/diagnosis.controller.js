import Diagnosis from "../models/Diagnosis.js";
import mongoose from "mongoose";

const uploadDiagnosisImage = (file) => new Promise((resolve, reject) => {
  if (!file) {
    resolve(null);
    return;
  }

  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "diagnosisImages",
  });
  const uploadStream = bucket.openUploadStream(file.originalname, {
    contentType: file.mimetype,
    metadata: { userId: file.userId },
  });

  uploadStream.on("error", reject);
  uploadStream.on("finish", () => resolve({
    fileId: uploadStream.id,
    contentType: file.mimetype,
    filename: file.originalname,
  }));
  uploadStream.end(file.buffer);
});

const parseJsonField = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const createDiagnosis = async (req, res) => {
  try {
    const { plantName, diagnosis, status, confidence, issues, recommendations, treatment, explainability } = req.body;

    if (!plantName || !diagnosis || !status) {
      return res.status(400).json({ success: false, message: "Diagnosis details are required" });
    }

    const image = await uploadDiagnosisImage(req.file);
    const entry = await Diagnosis.create({
      userId: req.user.id,
      plantName,
      diagnosis,
      status,
      confidence: Number(confidence) || 0,
      issues: Array.isArray(parseJsonField(issues, [])) ? parseJsonField(issues, []) : [],
      recommendations: Array.isArray(parseJsonField(recommendations, [])) ? parseJsonField(recommendations, []) : [],
      treatment: parseJsonField(treatment, null),
      explainability: parseJsonField(explainability, null),
      image,
    });

    return res.status(201).json({ success: true, diagnosis: entry });
  } catch (error) {
    console.error("Save diagnosis error:", error);
    return res.status(500).json({ success: false, message: "Failed to save diagnosis" });
  }
};

export const getDiagnosisImage = async (req, res) => {
  try {
    const diagnosis = await Diagnosis.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).select("image");

    if (!diagnosis?.image?.fileId) {
      return res.status(404).json({ success: false, message: "Diagnosis image not found" });
    }

    res.type(diagnosis.image.contentType || "application/octet-stream");
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "diagnosisImages",
    });
    const downloadStream = bucket.openDownloadStream(diagnosis.image.fileId);
    downloadStream.on("error", () => res.status(404).end());
    downloadStream.pipe(res);
  } catch (error) {
    console.error("Get diagnosis image error:", error);
    return res.status(500).json({ success: false, message: "Failed to load diagnosis image" });
  }
};

export const getRecentDiagnoses = async (req, res) => {
  try {
    const diagnoses = await Diagnosis.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5);

    return res.json({ success: true, diagnoses });
  } catch (error) {
    console.error("Get diagnoses error:", error);
    return res.status(500).json({ success: false, message: "Failed to load diagnosis history" });
  }
};

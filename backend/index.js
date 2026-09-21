import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import multer from "multer";
import path from "path";
import { existsSync } from "fs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { spawn } from 'child_process';

import { connectDB } from "./db/connectDB.js";
import authRoutes from "./routes/auth.routes.js";
import communityRoutes from "./routes/community.routes.js";
import cropCareRoutes from "./routes/cropCareRoutes.js";
import usersRoutes from "./routes/users.routes.js";
import diagnosisRoutes from "./routes/diagnosis.routes.js";
import { checkDueWateringReminders } from "./controllers/cropCareController.js";

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the backend folder and project root.
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";
let predictionProcess;
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
        if (file.mimetype?.startsWith("image/")) {
            callback(null, true);
            return;
        }
        callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "file"));
    },
});

const waitForPredictionService = async (timeoutMs = 15000) => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try {
            const response = await fetch(`${PYTHON_API_URL}/health`);
            if (response.ok) {
                return true;
            }
        } catch {
            // The service may still be starting.
        }
        await new Promise((resolve) => setTimeout(resolve, 250));
    }
    return false;
};

const ensurePredictionService = async () => {
    if (await waitForPredictionService(500)) {
        console.log(`🧠 Prediction service is ready at ${PYTHON_API_URL}`);
        return;
    }

    const virtualEnvironmentPython = process.platform === "win32"
        ? path.resolve(__dirname, "../.venv/Scripts/python.exe")
        : path.resolve(__dirname, "../.venv/bin/python");
    const pythonCommand = process.env.PYTHON_COMMAND
        || (existsSync(virtualEnvironmentPython) ? virtualEnvironmentPython : "python");
    predictionProcess = spawn(
        pythonCommand,
        ["-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"],
        { cwd: __dirname, stdio: "inherit" },
    );
    predictionProcess.on("error", (error) => {
        console.error("Unable to start the Python prediction service:", error.message);
    });

    if (await waitForPredictionService()) {
        console.log(`🧠 Prediction service started at ${PYTHON_API_URL}`);
    } else {
        console.error(`Python prediction service did not become ready at ${PYTHON_API_URL}.`);
    }
};

const isApiAlreadyRunning = async () => {
    try {
        const response = await fetch(`http://127.0.0.1:${PORT}/api/health`);
        if (!response.ok) {
            return false;
        }
        const data = await response.json();
        return data?.status === "online" && data?.database === "MongoDB Atlas";
    } catch {
        return false;
    }
};

// ===== MIDDLEWARE =====
app.use(cors({ 
    origin: process.env.CLIENT_URL || "http://localhost:5173", 
    credentials: true 
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===== ROUTES =====
// Root route - FIXED
app.get("/", (req, res) => {
    res.json({
        message: "🌱 Welcome to PlantCheck API!",
        status: "online",
        endpoints: {
            health: "/api/health",
            auth: {
                signup: "POST /api/auth/signup",
                login: "POST /api/auth/login",
                logout: "POST /api/auth/logout",
                verifyEmail: "POST /api/auth/verify-email",
                forgotPassword: "POST /api/auth/forgot-password",
                resetPassword: "POST /api/auth/reset-password/:token",
                checkAuth: "GET /api/auth/check-auth"
            }
        },
        documentation: "https://github.com/your-repo/plantcheck",
        timestamp: new Date().toISOString()
    });
});

app.post("/predict", upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ detail: "No image file uploaded." });
    }

    try {
        const formData = new FormData();
        const blob = new Blob([req.file.buffer], { type: req.file.mimetype || "image/jpeg" });
        formData.append("file", blob, req.file.originalname || "image.jpg");

        const pythonResponse = await fetch(`${PYTHON_API_URL}/predict`, {
            method: "POST",
            body: formData,
        });

        const responseText = await pythonResponse.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch {
            data = { detail: responseText || "The prediction service returned an invalid response." };
        }
        return res.status(pythonResponse.status).json(data);
    } catch (error) {
        console.error("Prediction proxy error:", error);
        return res.status(502).json({
            detail: `Plant prediction service is unavailable at ${PYTHON_API_URL}. Start it with: python -m uvicorn main:app --reload --port 8000`,
        });
    }
});

// Auth routes
app.use("/api/auth", authRoutes);

// Community routes
app.use("/api/community", communityRoutes);

// Crop care routes
app.use("/api/crop-care", cropCareRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/diagnoses", diagnosisRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({
        status: "online",
        database: "MongoDB Atlas",
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ===== PRODUCTION =====
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/dist")));
    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "../frontend", "dist", "index.html"));
    });
}

// ===== START SERVER =====
const startWateringReminderLoop = () => {
    const checkReminders = () => checkDueWateringReminders().catch((error) => {
        console.error("Watering reminder check failed:", error);
    });

    checkReminders();
    setInterval(checkReminders, 60 * 60 * 1000);
};

const start = async () => {
    if (await isApiAlreadyRunning()) {
        console.log(`PlantCheck API is already running on http://localhost:${PORT}`);
        return;
    }

    await ensurePredictionService();
    app.listen(PORT, () => {
        connectDB();
        startWateringReminderLoop();
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
        console.log(`🌱 API Root: http://localhost:${PORT}`);
    });
};

start();
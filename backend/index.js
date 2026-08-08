import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { connectDB } from "./db/connectDB.js";
import authRoutes from "./routes/auth.routes.js";

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
app.use(cors({ 
    origin: process.env.CLIENT_URL || "http://localhost:5173", 
    credentials: true 
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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

// Auth routes
app.use("/api/auth", authRoutes);

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
app.listen(PORT, () => {
    connectDB();
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🌱 API Root: http://localhost:${PORT}`);
});
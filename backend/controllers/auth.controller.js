import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { OAuth2Client } from 'google-auth-library';

import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import {
    sendVerificationEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendResetSuccessEmail,
} from "../mailtrap/emails.js";
import { User } from "../models/user.model.js";

// ===== GOOGLE CLIENT =====
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ===== SIGNUP =====
export const signup = async (req, res) => {
    const { email, password, name } = req.body;

    try {
        if (!email || !password || !name) {
            return res.status(400).json({ 
                success: false, 
                message: "All fields are required" 
            });
        }

        const userAlreadyExists = await User.findOne({ email });

        if (userAlreadyExists) {
            return res.status(400).json({ 
                success: false, 
                message: "User already exists" 
            });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

        const user = new User({
            email,
            password: hashedPassword,
            name,
            verificationToken,
            verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        });

        await user.save();

        // Generate JWT token and set cookie
        const token = generateTokenAndSetCookie(res, user._id);

        // Send verification email
        await sendVerificationEmail(user.email, verificationToken);

        res.status(201).json({
            success: true,
            message: "User created successfully. Please check your email for verification code.",
            token,
            user: {
                ...user._doc,
                password: undefined,
            },
        });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(400).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ===== VERIFY EMAIL =====
export const verifyEmail = async (req, res) => {
    const { code } = req.body;

    try {
        if (!code) {
            return res.status(400).json({
                success: false,
                message: "Verification code is required"
            });
        }

        const user = await User.findOne({
            verificationToken: code,
            verificationTokenExpiresAt: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification code"
            });
        }

        // Mark user as verified
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiresAt = undefined;
        await user.save();

        // Send welcome email
        await sendWelcomeEmail(user.email, user.name);

        res.status(200).json({
            success: true,
            message: "Email verified successfully! Welcome to PlantCheck! 🎉",
            user: {
                ...user._doc,
                password: undefined,
            },
        });
    } catch (error) {
        console.error("Verify email error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// ===== RESEND VERIFICATION CODE =====
export const resendVerificationCode = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Email already verified"
            });
        }

        // Generate new verification token
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationToken = verificationToken;
        user.verificationTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
        await user.save();

        // Send verification email
        await sendVerificationEmail(user.email, verificationToken);

        res.status(200).json({
            success: true,
            message: "Verification code resent successfully"
        });
    } catch (error) {
        console.error("Resend verification error:", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ===== LOGIN =====
export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const isPasswordValid = await bcryptjs.compare(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // Check if email is verified
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email before logging in"
            });
        }

        const token = generateTokenAndSetCookie(res, user._id);

        user.lastLogin = new Date();
        await user.save();

        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            token,
            user: {
                ...user._doc,
                password: undefined,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ===== GOOGLE LOGIN =====
export const googleLogin = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Google token is required"
            });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name, picture, sub: googleId } = payload;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email not found in Google account"
            });
        }

        let user = await User.findOne({ email });

        if (!user) {
            user = new User({
                email,
                name: name || email.split('@')[0],
                googleId,
                isVerified: true,
                password: await bcryptjs.hash(Math.random().toString(36), 10),
            });
            await user.save();
            await sendWelcomeEmail(user.email, user.name);
        } else {
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }
        }

        const jwtToken = generateTokenAndSetCookie(res, user._id);

        user.lastLogin = new Date();
        await user.save();

        res.status(200).json({
            success: true,
            message: "Google login successful",
            token: jwtToken,
            user: {
                ...user._doc,
                password: undefined,
            },
        });
    } catch (error) {
        console.error("Google login error:", error);
        res.status(400).json({
            success: false,
            message: "Google login failed. Please try again.",
        });
    }
};

// ===== GOOGLE SIGNUP =====
export const googleSignup = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Google token is required"
            });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name, picture, sub: googleId } = payload;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email not found in Google account"
            });
        }

        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({
                success: false,
                message: "User already exists. Please login instead.",
            });
        }

        user = new User({
            email,
            name: name || email.split('@')[0],
            googleId,
            isVerified: true,
            password: await bcryptjs.hash(Math.random().toString(36), 10),
        });
        await user.save();

        await sendWelcomeEmail(user.email, user.name);

        const jwtToken = generateTokenAndSetCookie(res, user._id);

        res.status(201).json({
            success: true,
            message: "Google signup successful",
            token: jwtToken,
            user: {
                ...user._doc,
                password: undefined,
            },
        });
    } catch (error) {
        console.error("Google signup error:", error);
        res.status(400).json({
            success: false,
            message: "Google signup failed. Please try again.",
        });
    }
};

// ===== LOGOUT =====
export const logout = async (req, res) => {
    res.clearCookie("token");
    res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });
};

// ===== FORGOT PASSWORD =====
export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found"
            });
        }

        const resetToken = crypto.randomBytes(20).toString("hex");
        const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpiresAt = resetTokenExpiresAt;
        await user.save();

        const resetURL = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
        await sendPasswordResetEmail(user.email, resetURL);

        res.status(200).json({
            success: true,
            message: "Password reset link sent to your email"
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ===== RESET PASSWORD =====
export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpiresAt: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token"
            });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);

        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiresAt = undefined;
        await user.save();

        await sendResetSuccessEmail(user.email);

        res.status(200).json({
            success: true,
            message: "Password reset successful"
        });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ===== CHECK AUTH =====
export const checkAuth = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password");
        
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            user: {
                ...user._doc,
                password: undefined,
            }
        });
    } catch (error) {
        console.error("Check auth error:", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
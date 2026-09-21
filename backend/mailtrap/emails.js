import nodemailer from "nodemailer";
import dotenv from 'dotenv';
import {
    VERIFICATION_EMAIL_TEMPLATE,
    WELCOME_EMAIL_TEMPLATE,
    PASSWORD_RESET_REQUEST_TEMPLATE,
    PASSWORD_RESET_SUCCESS_TEMPLATE,
} from "./emailTemplates.js";

dotenv.config();

// ===== GMAIL SMTP TRANSPORTER =====
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER || "badhanroy2204@gmail.com",
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

// Verify transporter connection
transporter.verify((error, success) => {
    if (error) {
        console.error("❌ Email transporter error:", error.message);
    } else {
        console.log("✅ Email transporter ready! (Gmail)");
    }
});

// ===== SEND VERIFICATION EMAIL =====
export const sendVerificationEmail = async (email, verificationToken) => {
    try {
        const info = await transporter.sendMail({
            from: `"🌱 PlantCheck" <${process.env.GMAIL_USER || "badhanroy2204@gmail.com"}>`,
            to: email,
            subject: "🔐 Verify Your Email - PlantCheck",
            html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
        });

        console.log(`✅ Verification email sent to ${email}`);
        console.log(`🔑 Verification code: ${verificationToken}`);
        return info;
    } catch (error) {
        console.error(`❌ Error sending verification email:`, error.message);
        throw new Error(`Error sending verification email: ${error.message}`);
    }
};

// ===== SEND WELCOME EMAIL =====
export const sendWelcomeEmail = async (email, name) => {
    try {
        const info = await transporter.sendMail({
            from: `"🌱 PlantCheck" <${process.env.GMAIL_USER || "badhanroy2204@gmail.com"}>`,
            to: email,
            subject: "🎉 Welcome to PlantCheck!",
            html: WELCOME_EMAIL_TEMPLATE.replace("{name}", name),
        });

        console.log(`✅ Welcome email sent to ${email}`);
        return info;
    } catch (error) {
        console.error(`❌ Error sending welcome email:`, error.message);
        throw new Error(`Error sending welcome email: ${error.message}`);
    }
};

// ===== SEND PASSWORD RESET EMAIL =====
export const sendPasswordResetEmail = async (email, resetURL) => {
    try {
        const info = await transporter.sendMail({
            from: `"🌱 PlantCheck" <${process.env.GMAIL_USER || "badhanroy2204@gmail.com"}>`,
            to: email,
            subject: "🔑 Reset Your Password - PlantCheck",
            html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
        });

        console.log(`✅ Password reset email sent to ${email}`);
        return info;
    } catch (error) {
        console.error(`❌ Error sending password reset email:`, error.message);
        throw new Error(`Error sending password reset email: ${error.message}`);
    }
};

// ===== SEND RESET SUCCESS EMAIL =====
export const sendResetSuccessEmail = async (email) => {
    try {
        const info = await transporter.sendMail({
            from: `"🌱 PlantCheck" <${process.env.GMAIL_USER || "badhanroy2204@gmail.com"}>`,
            to: email,
            subject: "✅ Password Reset Successful - PlantCheck",
            html: PASSWORD_RESET_SUCCESS_TEMPLATE,
        });

        console.log(`✅ Password reset success email sent to ${email}`);
        return info;
    } catch (error) {
        console.error(`❌ Error sending password reset success email:`, error.message);
        throw new Error(`Error sending password reset success email: ${error.message}`);
    }
};
import dotenv from 'dotenv';
import { sendVerificationEmail } from './emails.js';

dotenv.config();

console.log("=".repeat(50));
console.log("📧 Testing Single Email");
console.log("=".repeat(50));

async function testSingleEmail() {
    try {
        console.log("\n📧 Sending verification email...");
        await sendVerificationEmail("test@example.com", "123456");
        console.log("✅ Verification email sent!");
        console.log("📬 Check your Mailtrap inbox!");
    } catch (error) {
        console.error("❌ Failed:", error.message);
    }
}

testSingleEmail();
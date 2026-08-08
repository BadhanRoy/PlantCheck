import dotenv from 'dotenv';
import { 
    sendVerificationEmail, 
    sendWelcomeEmail, 
    sendPasswordResetEmail, 
    sendResetSuccessEmail 
} from './emails.js';

dotenv.config();

// Helper function to delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

console.log("=".repeat(50));
console.log("📧 Testing Mailtrap SMTP");
console.log("=".repeat(50));

console.log("📋 SMTP Configuration:");
console.log("🔧 Host: sandbox.smtp.mailtrap.io");
console.log("🔧 Port: 2525");
console.log("👤 User: 953544fc6769b6");
console.log("🔑 Pass: 8e689d690bfa76");
console.log("=".repeat(50));

async function testEmails() {
    try {
        // Test 1: Verification Email
        console.log("\n1️⃣ Testing Verification Email...");
        await sendVerificationEmail("test@example.com", "123456");
        console.log("✅ Verification email test passed\n");
        
        // Wait 2 seconds before next email
        console.log("⏳ Waiting 2 seconds before next email...");
        await delay(2000);

        // Test 2: Welcome Email
        console.log("2️⃣ Testing Welcome Email...");
        await sendWelcomeEmail("test@example.com", "John Doe");
        console.log("✅ Welcome email test passed\n");
        
        // Wait 2 seconds before next email
        console.log("⏳ Waiting 2 seconds before next email...");
        await delay(2000);

        // Test 3: Password Reset Email
        console.log("3️⃣ Testing Password Reset Email...");
        await sendPasswordResetEmail("test@example.com", "https://example.com/reset/123");
        console.log("✅ Password reset email test passed\n");
        
        // Wait 2 seconds before next email
        console.log("⏳ Waiting 2 seconds before next email...");
        await delay(2000);

        // Test 4: Reset Success Email
        console.log("4️⃣ Testing Reset Success Email...");
        await sendResetSuccessEmail("test@example.com");
        console.log("✅ Reset success email test passed\n");

        console.log("\n🎉 All email tests passed!");
        console.log("📬 Check your Mailtrap Sandbox inbox to see the emails.");
        console.log("🔗 https://mailtrap.io/inboxes");
        
    } catch (error) {
        console.error("\n❌ Test failed:", error.message);
        process.exit(1);
    }
}

testEmails();
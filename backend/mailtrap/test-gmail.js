import nodemailer from "nodemailer";
import dotenv from 'dotenv';

dotenv.config();

console.log("=".repeat(60));
console.log("📧 TESTING GMAIL SMTP");
console.log("=".repeat(60));

console.log("📧 From:", process.env.GMAIL_USER);
console.log("📧 To:", process.env.GMAIL_USER);
console.log("🔑 Password:", process.env.GMAIL_APP_PASSWORD ? "✅ Set" : "❌ Not set");
console.log("=".repeat(60));

async function sendTestEmail() {
    try {
        // Create transporter with Gmail
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });

        console.log("\n📧 Sending test email to your Gmail...");

        // Send email
        const info = await transporter.sendMail({
            from: `"🌱 PlantCheck" <${process.env.GMAIL_USER}>`,
            to: process.env.GMAIL_USER,
            subject: "🌱 PlantCheck - Test Email",
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 15px; }
                        .header { background: linear-gradient(135deg, #4CAF50, #2E7D32); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .header h1 { color: white; margin: 0; font-size: 32px; }
                        .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        .success-box { background: #E8F5E9; padding: 20px; border-radius: 8px; border-left: 4px solid #4CAF50; margin: 20px 0; }
                        .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
                        .emoji { font-size: 24px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🌱 PlantCheck</h1>
                        </div>
                        <div class="content">
                            <h2 style="color: #2E7D32;">✅ Test Email Successful!</h2>
                            
                            <div class="success-box">
                                <p style="margin: 0; color: #2E7D32; font-size: 16px;">
                                    <span class="emoji">🎉</span> 
                                    <strong>Congratulations!</strong> Your email configuration is working perfectly!
                                </p>
                            </div>
                            
                            <p style="font-size: 16px; color: #555;">
                                You're now ready to send real emails to your users from PlantCheck.
                            </p>
                            
                            <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p style="margin: 0; color: #333; font-size: 14px;">
                                    📬 <strong>Message Details:</strong><br>
                                    From: ${process.env.GMAIL_USER}<br>
                                    To: ${process.env.GMAIL_USER}<br>
                                    Time: ${new Date().toLocaleString()}
                                </p>
                            </div>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" 
                                   style="background: linear-gradient(135deg, #4CAF50, #2E7D32); 
                                          color: white; padding: 12px 30px; 
                                          text-decoration: none; border-radius: 8px; 
                                          font-weight: bold; display: inline-block;">
                                    🚀 Visit PlantCheck
                                </a>
                            </div>
                            
                            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
                            
                            <p style="color: #666; font-size: 14px;">
                                Best regards,<br>
                                <strong style="color: #2E7D32;">PlantCheck Team</strong>
                            </p>
                        </div>
                        <div class="footer">
                            <p>© 2026 PlantCheck. All rights reserved.</p>
                            <p>This is a test email from your PlantCheck application.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });

        console.log("\n✅ TEST EMAIL SENT SUCCESSFULLY!");
        console.log("📬 Message ID:", info.messageId);
        console.log(`📧 Check your Gmail inbox: ${process.env.GMAIL_USER}`);
        console.log("=".repeat(60));
        console.log("🎉 You're ready to send real emails!");

    } catch (error) {
        console.error("\n❌ TEST FAILED!");
        console.error("Error:", error.message);
        console.log("\n💡 Troubleshooting Tips:");
        console.log("   1. Make sure GMAIL_APP_PASSWORD is correct (no spaces)");
        console.log("   2. Enable 'Less secure app access' or use App Password");
        console.log("   3. Check your Gmail account security settings");
        console.log("   4. Try regenerating the App Password");
        process.exit(1);
    }
}

sendTestEmail();
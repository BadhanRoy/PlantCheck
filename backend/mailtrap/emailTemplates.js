export const VERIFICATION_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4CAF50, #2E7D32); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 32px; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .code-box { background: white; padding: 20px; text-align: center; border-radius: 10px; border: 2px dashed #4CAF50; margin: 20px 0; }
        .code { font-size: 40px; font-weight: bold; letter-spacing: 8px; color: #2E7D32; }
        .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
        .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .expiry { color: #ff6b35; font-weight: bold; }
    </style>
</head>
<body>
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div class="header">
            <h1>🌱 PlantCheck</h1>
        </div>
        <div class="content">
            <h2 style="color: #2E7D32; margin-top: 0;">Verify Your Email</h2>
            <p>Hello,</p>
            <p>Thank you for signing up for <strong>PlantCheck</strong>! Please verify your email address to get started.</p>
            
            <div class="code-box">
                <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your verification code is:</p>
                <div class="code">{verificationCode}</div>
            </div>
            
            <p style="text-align: center; color: #666; font-size: 14px;">
                ⏰ This code will expire in <span class="expiry">24 hours</span>
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email" 
                   style="background: linear-gradient(135deg, #4CAF50, #2E7D32); color: white; 
                          padding: 14px 32px; text-decoration: none; border-radius: 8px; 
                          font-weight: bold; display: inline-block;">
                    🔐 Verify Email Now
                </a>
            </div>
            
            <div style="background: #fff3e0; padding: 15px; border-radius: 8px; border-left: 4px solid #ff6b35; margin: 20px 0;">
                <p style="margin: 0; color: #e65100; font-size: 14px;">
                    💡 <strong>Tip:</strong> If you didn't create an account with PlantCheck, please ignore this email.
                </p>
            </div>
            
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
            
            <p style="color: #666; font-size: 14px;">
                Best regards,<br>
                <strong style="color: #2E7D32;">PlantCheck Team</strong>
            </p>
        </div>
        <div class="footer">
            <p>© 2026 PlantCheck. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
        </div>
    </div>
</body>
</html>
`;

export const WELCOME_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to PlantCheck</title>
</head>
<body style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
    <div style="background: linear-gradient(135deg, #4CAF50, #2E7D32); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 32px;">🌱 PlantCheck</h1>
    </div>
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #2E7D32; margin-top: 0;">🎉 Welcome {name}!</h2>
        
        <p style="font-size: 16px; color: #555;">Your email has been successfully verified!</p>
        <p style="font-size: 16px; color: #555;">You're now ready to start using <strong>PlantCheck</strong>.</p>
        
        <div style="background: #E8F5E9; padding: 20px; border-radius: 8px; border-left: 4px solid #4CAF50; margin: 20px 0;">
            <p style="margin: 0; color: #2E7D32; font-size: 15px;">
                🌱 <strong>What's next?</strong><br>
                • Add your first plant<br>
                • Set up care schedules<br>
                • Track growth and health
            </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" 
               style="background: linear-gradient(135deg, #4CAF50, #2E7D32); color: white; 
                      padding: 14px 32px; text-decoration: none; border-radius: 8px; 
                      font-weight: bold; display: inline-block;">
                🚀 Go to Dashboard
            </a>
        </div>
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
        
        <p style="color: #666; font-size: 14px;">
            Best regards,<br>
            <strong style="color: #2E7D32;">PlantCheck Team</strong>
        </p>
        <p style="color: #999; font-size: 12px; text-align: center;">© 2026 PlantCheck. All rights reserved.</p>
    </div>
</body>
</html>
`;

export const PASSWORD_RESET_REQUEST_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
</head>
<body style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
    <div style="background: linear-gradient(135deg, #FF6B35, #E65100); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 32px;">🔐 Reset Password</h1>
    </div>
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <p>Hello,</p>
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{resetURL}" 
               style="background: linear-gradient(135deg, #FF6B35, #E65100); color: white; 
                      padding: 14px 32px; text-decoration: none; border-radius: 8px; 
                      font-weight: bold; display: inline-block;">
                🔑 Reset Password
            </a>
        </div>
        
        <p style="text-align: center; color: #666; font-size: 14px;">
            ⏰ This link will expire in <strong>1 hour</strong>
        </p>
        
        <div style="background: #fff3e0; padding: 15px; border-radius: 8px; border-left: 4px solid #FF6B35; margin: 20px 0;">
            <p style="margin: 0; color: #e65100; font-size: 14px;">
                💡 If you didn't request this, please ignore this email. Your password will remain unchanged.
            </p>
        </div>
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
        
        <p style="color: #666; font-size: 14px;">
            Best regards,<br>
            <strong style="color: #2E7D32;">PlantCheck Team</strong>
        </p>
    </div>
</body>
</html>
`;

export const PASSWORD_RESET_SUCCESS_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Successful</title>
</head>
<body style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
    <div style="background: linear-gradient(135deg, #4CAF50, #2E7D32); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 32px;">✅ Password Reset</h1>
    </div>
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <p>Hello,</p>
        <p>Your password has been successfully reset.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <div style="background: #4CAF50; color: white; width: 60px; height: 60px; line-height: 60px; border-radius: 50%; display: inline-block; font-size: 30px;">
                ✓
            </div>
        </div>
        
        <div style="background: #E8F5E9; padding: 15px; border-radius: 8px; border-left: 4px solid #4CAF50; margin: 20px 0;">
            <p style="margin: 0; color: #2E7D32; font-size: 14px;">
                🔒 <strong>Security Tip:</strong> Use a strong, unique password and enable 2FA if available.
            </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" 
               style="background: linear-gradient(135deg, #4CAF50, #2E7D32); color: white; 
                      padding: 14px 32px; text-decoration: none; border-radius: 8px; 
                      font-weight: bold; display: inline-block;">
                🔐 Login to PlantCheck
            </a>
        </div>
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
        
        <p style="color: #666; font-size: 14px;">
            Best regards,<br>
            <strong style="color: #2E7D32;">PlantCheck Team</strong>
        </p>
    </div>
</body>
</html>
`;
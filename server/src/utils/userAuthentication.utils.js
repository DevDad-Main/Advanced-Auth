import crypto from "crypto";
import redisClient from "../lib/redis.lib.js";
import { sendMail } from "./sendMail.utils.js";
import { AppError, logger } from "devdad-express-utils";

//#region Generate OTP Email HTML
const generateOTPEmailHTML = (name, otp) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px 30px;
          text-align: center;
          color: white;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 20px;
          margin-bottom: 20px;
          color: #333;
        }
        .message {
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 30px;
          color: #666;
        }
        .otp-container {
          background: #f8f9fa;
          border: 2px dashed #667eea;
          border-radius: 8px;
          padding: 30px;
          text-align: center;
          margin: 30px 0;
        }
        .otp-label {
          font-size: 14px;
          color: #666;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .otp-code {
          font-size: 36px;
          font-weight: bold;
          color: #667eea;
          letter-spacing: 8px;
          margin: 0;
          font-family: 'Courier New', monospace;
        }
        .expiry {
          font-size: 14px;
          color: #999;
          margin-top: 15px;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px 30px;
          text-align: center;
          font-size: 14px;
          color: #999;
          border-top: 1px solid #eee;
        }
        .security-tip {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
          font-size: 14px;
          color: #856404;
        }
        @media only screen and (max-width: 600px) {
          .container {
            margin: 20px auto;
          }
          .header, .content, .footer {
            padding: 20px;
          }
          .otp-code {
            font-size: 28px;
            letter-spacing: 6px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Verify Your Email</h1>
        </div>
        <div class="content">
          <p class="greeting">Hi ${name},</p>
          <p class="message">
            Thank you for signing up! To complete your registration and secure your account, 
            please use the verification code below.
          </p>
          
          <div class="otp-container">
            <div class="otp-label">Your Verification Code</div>
            <div class="otp-code">${otp}</div>
            <div class="expiry">This code will expire in 5 minutes</div>
          </div>
          
          <div class="security-tip">
            <strong>🛡️ Security Tip:</strong> Never share this code with anyone. 
            Our team will never ask for your verification code.
          </div>
          
          <p class="message">
            If you didn't request this code, you can safely ignore this email.
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Social Media App. All rights reserved.</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
//#endregion

//#region Generate Welcome Email HTML
const generateWelcomeEmailHTML = (name) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Knect!</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 50px 30px;
          text-align: center;
          color: white;
        }
        .header h1 {
          margin: 0;
          font-size: 32px;
          font-weight: 600;
        }
        .header .emoji {
          font-size: 48px;
          margin-bottom: 15px;
          display: block;
        }
        .content {
          padding: 50px 30px;
        }
        .greeting {
          font-size: 24px;
          margin-bottom: 25px;
          color: #333;
          font-weight: 500;
        }
        .message {
          font-size: 16px;
          line-height: 1.8;
          margin-bottom: 30px;
          color: #555;
        }
        .success-box {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
          padding: 25px;
          border-radius: 12px;
          text-align: center;
          margin: 30px 0;
        }
        .success-box .checkmark {
          font-size: 48px;
          margin-bottom: 15px;
          display: block;
        }
        .success-box h3 {
          margin: 0 0 10px 0;
          font-size: 20px;
          font-weight: 600;
        }
        .next-steps {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 30px;
          margin: 30px 0;
        }
        .next-steps h3 {
          margin: 0 0 20px 0;
          color: #333;
          font-size: 18px;
        }
        .next-steps ul {
          margin: 0;
          padding-left: 20px;
        }
        .next-steps li {
          margin-bottom: 12px;
          color: #555;
          line-height: 1.6;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px 30px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          margin: 20px 0;
          transition: transform 0.2s ease;
        }
        .cta-button:hover {
          transform: translateY(-2px);
        }
        .footer {
          background: #f8f9fa;
          padding: 30px;
          text-align: center;
          font-size: 14px;
          color: #999;
          border-top: 1px solid #eee;
        }
        .footer p {
          margin: 5px 0;
        }
        .social-links {
          margin: 20px 0;
        }
        .social-links a {
          margin: 0 10px;
          font-size: 20px;
          color: #667eea;
          text-decoration: none;
        }
        @media only screen and (max-width: 600px) {
          .container {
            margin: 20px auto;
          }
          .header, .content, .footer {
            padding: 30px 20px;
          }
          .header h1 {
            font-size: 28px;
          }
          .greeting {
            font-size: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="emoji">🎉</span>
          <h1>Welcome to the Knect Community!</h1>
        </div>
        <div class="content">
          <p class="greeting">Hi ${name},</p>
          
          <p class="message">
            Congratulations! Your account has been successfully created and verified. 
            We're thrilled to have you join our platform!
          </p>
          
          <div class="success-box">
            <span class="checkmark">✓</span>
            <h3>Account Successfully Created</h3>
            <p>Your email has been verified and you're all set to get started.</p>
          </div>
          
          <div class="next-steps">
            <h3>What's Next?</h3>
            <ul>
              <li>Complete your profile to help others get to know you</li>
              <li>Connect with friends and discover new connections</li>
              <li>Share your first post and start engaging with the community</li>
              <li>Explore our features and make the platform your own</li>
            </ul>
          </div>
          
          <p class="message">
            Ready to dive in? Click the button below to access your account and start your journey!
          </p>
          
          <a href="#" class="cta-button">Go to Your Account</a>
          
          <p class="message">
            If you have any questions or need help getting started, our support team is here for you. 
            Just reply to this email and we'll be happy to assist you.
          </p>
        </div>
        
        <div class="footer">
          <p>Thank you for joining us!</p>
          <p>The Team @ Knect</p>
          <div class="social-links">
            <a href="#">📧</a>
            <a href="#">🐦</a>
            <a href="#">📘</a>
            <a href="#">📷</a>
          </div>
          <p>© 2026 Social Media Platform. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
//#endregion

//#region Send Welcome Email
export const sendWelcomeEmail = async (name, email) => {
  try {
    const htmlContent = generateWelcomeEmailHTML(name);

    await sendMail(email, "Welcome to Knect! 🎉", htmlContent);

    logger.info("Welcome email sent successfully", { email });
  } catch (error) {
    logger.error("Failed to send welcome email", {
      email,
      error: error.message,
    });
    // Don't throw error - welcome email failure shouldn't break registration
  }
};
//#endregion

//#region Helper Functions
const isEmailLocked = async (email) =>
  await redisClient.get(`otp_locked:${email}`);
const isSpamLocked = async (email) =>
  await redisClient.get(`otp_spam_locked:${email}`);
const isOnCooldown = async (email) =>
  await redisClient.get(`otp_cooldown:${email}`);
//#endregion

//#region Check OTP Restrictions
export const checkOTPRestrictions = async (email, next) => {
  logger.info("Checking OTP restrictions for email", { email });
  //NOTE: Potentially lock the email if it fails too many times due to user error

  if (await isEmailLocked(email)) {
    return next(
      new AppError(
        "Account is locked due to multiple failed attempts. Please Try Again After 30 Minutes.",
        400,
      ),
    );
  }
  if (await isSpamLocked(email)) {
    return next(
      new AppError(
        "Too many failed attempts. Please try again after 30 minutes.",
        400,
      ),
    );
  }
  if (await isOnCooldown(email)) {
    return next(
      new AppError(
        "Please wait 1 minute before requesting a new OTP code.",
        400,
      ),
    );
  }
};
//#endregion

//#region Track OTP Requests
export const trackOTPRequests = async (email, next) => {
  const otpRequestKey = `otp_request_count:${email}`;
  let optRequests = parseInt((await redisClient.get(otpRequestKey)) || "0");

  if (optRequests >= 2) {
    await redisClient.set(`otp_spam_locked:${email}`, "locked", "EX", 3600);
    return next(
      new AppError(
        "Too many failed attempts. Please try again after 1 hour.",
        400,
      ),
    );
  }

  await redisClient.set(otpRequestKey, optRequests + 1, "EX", 3600);
};
//#endregion

//#region Send OTP
export const sendOTP = async (name, email) => {
  const otp = crypto.randomInt(1000, 9999).toString();
  logger.info("Sending OTP for email", { email, otp });

  const htmlContent = generateOTPEmailHTML(name, otp);
  await sendMail(email, "Verify Your Email - OTP Code", htmlContent);

  //NOTE: Cache the OTP for 5 minutes
  await redisClient.set(`otp:${email}`, otp, "EX", 300);
  //NOTE: Set cooldown for 1 min between each request
  await redisClient.set(`otp_cooldown:${email}`, "true", "EX", 60);
};
//#endregion

//#region Verify OTP
export const verifyOTP = async (email, otp) => {
  try {
    const storedOTP = await redisClient.get(`otp:${email}`);
    console.log("DEBUG: storedOTP = ", storedOTP);

    if (!storedOTP) {
      throw new AppError("Invalid or expired OTP", 400);
    }

    const failedAttemptsKey = `otp_request_count:${email}`;
    const failedAttempts = parseInt(
      (await redisClient.get(failedAttemptsKey)) || "0",
    );

    console.log("DEBUG: storedOTP & otp = ", storedOTP, otp);

    if (parseInt(storedOTP) !== parseInt(otp)) {
      if (failedAttempts >= 2) {
        await redisClient.set(`otp_locked:${email}`, "locked", "EX", 1800);
        await redisClient.unlink(`otp:${email}`, failedAttemptsKey);
        throw new AppError(
          "Too many failed attempts, Your account has been locked for 30 minutes.",
          400,
        );
      }

      await redisClient.set(failedAttemptsKey, failedAttempts + 1, "EX", 300);
      throw new AppError(
        `Incorrect OTP - ${2 - failedAttempts} attempt(s) left`,
        400,
      );
    }

    // Success - clean up and return true
    await redisClient.unlink(`otp:${email}`, failedAttemptsKey);
    return true;
  } catch (error) {
    logger.error("Failed to verify OTP", { error });
    throw error;
  }
};
//#endregion

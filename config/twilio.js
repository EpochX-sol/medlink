import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_SECRET;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Twilio REST client (for room info, etc.)
const twilioClient = twilio(accountSid, authToken);

export { twilioClient, accountSid, apiKey, apiSecret };

//VA7def494dfaf9dc430e71b4d8aed710f4
import { configDotenv } from 'dotenv';
import twilio from 'twilio';
configDotenv();

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

export const sendOtpViaSms = async (phone, otp) => {
    try {
        await client.messages.create({
            body: `Your Verification Code is ${otp}. Valid for 5 minutes.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone
        });
        console.log(`SMS sent to ${phone}`);
        return true;
    } catch (error) {
        console.error("Twilio SMS Error:", error);
        throw new Error("Failed to send SMS");
    }
};

export const sendOtpViaCall = async (phone, otp) => {
    try {
        // Add spaces so the robot speaks clearly: "4 8 2 1"
        const spacedOtp = otp.split('').join(' ');

        const twiml = `
      <Response>
        <Pause length="1"/>
        <Say>Hello. Your verification code is ${spacedOtp}.</Say>
        <Pause length="1"/>
        <Say>I repeat, your code is ${spacedOtp}.</Say>
        <Say>Goodbye.</Say>
      </Response>
    `;

        await client.calls.create({
            twiml: twiml,
            to: phone,
            from: process.env.TWILIO_PHONE_NUMBER
        });

        console.log(`Voice Call initiated to ${phone}`);
        return true;
    } catch (error) {
        console.error("Twilio Call Error:", error.message);
        throw new Error("Failed to make Voice Call");
    }
};


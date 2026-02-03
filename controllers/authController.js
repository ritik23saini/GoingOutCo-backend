import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendOtpViaCall, sendOtpViaSms } from '../utils/twilioService.js';

/* export const signup = async (req, res) => {
  try {
    const { phone, username, gender, dob, city, countryCode = "+91" } = req.body;

   
    if (!phone || phone.length < 10 || !username || !gender || !dob || !city) {
      return res.status(401).json({
        msg: "All fields required && phone too",

      });
    }
    const existinguser = await User.findOne({ phone });
    if (existinguser) {
      return res.status(400).json({
        success: false,
        error: "Phone number already registered"
      });
    }
  
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const now = new Date();

    user.otp = otp;
    user.otpExpiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 mins
    user.lastOtpSentAt = now; 

    await user.save();

    const fullPhoneNumber = user.countryCode + user.phone;
    await sendOtpViaSms(fullPhoneNumber, otp);


    const user = new User({
      phone,
      countryCode,
      name: username,
      gender,
      dob,
      city
    });


    return res.status(201).json({
      success: true,
      msg: "User created & OTP sent",
      otp, // Remove in production
      userId: user._id
    });



  } catch (error) {
    console.error(error.message)
    res.status(500).json({
      success: false,
      msg: "user creation failed"
    });
  }
}; */

// resent otp  /login
export const sendOtp = async (req, res) => {
  try {
    const { phone, countryCode = "+91", deliveryMethod = "sms" } = req.body; // 'sms' or 'call'

    if (!phone || phone.length < 10) {
      return res.status(400).json({ success: false, msg: "Valid phone required" });
    }

    const fullPhoneNumber = countryCode + phone;
    let user = await User.findOneAndUpdate(
      { phone: phone },
      {
        $setOnInsert: { // Only sets these if creating NEW user
          phone: phone,
          countryCode: countryCode,
          isSignupComplete: false,
        }
      },
      { new: true, upsert: true } // Returns the new/updated doc
    );

    // 2. Rate Limiting (Prevent Spam)
    const now = new Date();
    if (user.lastOtpSentAt) {
      const timeDiff = now - user.lastOtpSentAt;
      if (timeDiff < 30 * 1000) { // 30 seconds cooldown
        return res.status(429).json({ success: false, msg: "Wait 30s before resending." });
      }
    }
    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Set expiry (5 minutes)
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Save OTP to user
    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    user.lastOtpSentAt = now;
    await user.save();

    //Send OTP
    try {
      if (deliveryMethod === "call") {
        // await sendOtpViaCall(fullPhoneNumber, otp);   remove comments to enable delivery
      } else {
        // await sendOtpViaSms(fullPhoneNumber, otp);
      }
    }
    catch (smsError) {
      // If it's a new user and SMS failed, delete them so they can try again cleanly
      if (!user.isSignupComplete) await User.findByIdAndDelete(user._id);
      console.error("SMS/Call Error:", smsError.message);
      return res.status(500).json({ success: false, msg: "SMS Failed. Try again." });
    }

    return res.status(200).json({
      success: true,
      msg: `OTP sent via ${deliveryMethod}`,
      otp, // REMOVE THIS IN PRODUCTION
      data: { phone: user.phone }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      msg: error.message
    });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        msg: "Phone and OTP required"
      });
    }

    const user = await User.findOne({
      phone,
      otp,
      otpExpiresAt: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        msg: "Invalid or expired OTP"
      });
    }

    // Clear OTP after successful verification
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id,/*role: user.roles[0] */ },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      msg: user.isSignupComplete ? "Login successful" : "Please complete your profile setup",
      token,
      user: {
        _id: user._id,
        phone: user.phone,
        name: user.name,
        //isSignupComplete: user.isSignupComplete,
        //countryCode: user.countryCode,
        //roles: user.roles
      }
    });

    //update fcm after login

  } catch (error) {
    res.status(500).json({
      success: false,
      msg: error.message
    });
  }
};

export const completeSignup = async (req, res) => {
  try {

    const { name, gender, dob, city } = req.body;
    const currentUserId = req.user._id;
    console.log(req.user)
    if (!name || !gender /* || !dob */ || !city) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const user = await User.findById(currentUserId);
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.isSignupComplete) return res.status(400).json({ msg: "User already completed signup" });

    user.name = name;
    user.gender = gender;
    user.dob = dob || new Date(); //remove default later
    user.city = city;
    user.isSignupComplete = true; // <--- Mark as Done!

    await user.save();

    return res.status(200).json({ success: true, msg: "Profile Setup Complete ,Welcome!" });

  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
}
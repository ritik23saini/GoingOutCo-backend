
import express from 'express';
import { completeSignup, sendOtp, verifyOtp } from '../controllers/authController.js';
import { otpLimiter } from '../middlewares/optlimiter.js';
import { ensureAuth } from '../middlewares/ensureAuth.js';



const authRouter = express.Router();

// (Public) 
authRouter.post("/send-otp", otpLimiter, sendOtp); // Login/Resend
authRouter.post("/verify-otp", verifyOtp);

//Protected Route
authRouter.post("/complete-signup", ensureAuth, completeSignup);

export default authRouter;
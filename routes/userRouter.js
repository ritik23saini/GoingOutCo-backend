
import express from 'express';
import {  getOtherProfileDetails, sendOtp, signup, updateProfile, verifyOtp, } from '../controllers/userController.js';
import { ensureAuth } from '../middlewares/ensureAuth.js';
import { updateFCMToken } from '../controllers/fcmToken.js';
const userRouter = express.Router();

userRouter.post("/signup", signup) //first user
userRouter.post("/send-otp", sendOtp); //existing user
userRouter.post("/verify-otp", verifyOtp);
userRouter.post('/fcm-token', ensureAuth, updateFCMToken);

//profile created at time of signup
userRouter.put('/update-profile', ensureAuth, updateProfile);
userRouter.get('/profile/:userId', ensureAuth, getOtherProfileDetails);

//event route


//dashboard apis
//userRouter.get("/dashboard", ensureAuth, getUserEvents); //home


//userRouter.get("/notifications", searchDates); //notifications



export default userRouter;
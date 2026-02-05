import express from 'express';

import { getMyProfile, updateProfile, getOtherProfileDetails } from '../controllers/profileController.js';


import { updateFCMToken } from '../controllers/fcmToken.js';
import { ensureAuth } from '../middlewares/ensureAuth.js';
import { SupportMessage } from '../controllers/authController.js';
import { getDashboardEvents } from '../controllers/dashboardController.js';

const userRouter = express.Router();


// (Protected) 
userRouter.get('/myprofile', ensureAuth, getMyProfile);
userRouter.put('/update-profile', ensureAuth, updateProfile);
userRouter.get('/otherprofile/:userId', ensureAuth, getOtherProfileDetails);



// --- NOTIFICATIONS ---
userRouter.post('/fcm-token', ensureAuth, updateFCMToken);


userRouter.get('/dashboard', /* ensureAuth ,*/ getDashboardEvents);
userRouter.post('/support', ensureAuth, SupportMessage);

export default userRouter;
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import DatingProfile from '../models/DatingProfile.js';

export const signup = async (req, res) => {
  try {
    const { phone, username, gender, dob, city, countryCode = "+91" } = req.body;

    // Check if user exists
    if (!phone || phone.length < 10 || !username || !gender /* || !dob */ || !city) {
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



    const user = await User.create({
      phone,
      countryCode,
      name: username,
      gender,
      dob,
      city
      // Other required fields will use defaults or be optional for now
    })


    if (user)
      return res.status(201).json({
        success: true,
        msg: "User created successfully",

        user: {
          //id: user._id,
          phone: user.phone,
          countryCode: user.countryCode,
          role: user.role
        },
      });



  } catch (error) {
    console.error(error.message)
    res.status(500).json({
      success: false,
      msg: "user creation failed"
    });
  }
};

export const sendOtp = async (req, res) => {
  try {
    const { phone, countryCode } = req.body;

    if (!phone || phone.length < 10) {
      return res.status(400).json({
        success: false,
        msg: "Valid phone number required"
      });
    }
    let user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ success: false, msg: "User not registerd" })
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Set expiry (5 minutes)
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);


    // Save OTP to user
    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    // TODO: Send SMS using your SMS provider (Fast2SMS, Twilio, etc.)
    // Example with Fast2SMS (India):
    /*
    constmsg = `Your login OTP is ${otp}. Valid for 5 minutes.`;
    await fetch(`https://www.fast2sms.in/sms.php?authorization=YOUR_API_KEY&sender_id=TXTIND&message=${message}&numbers=${phone}&route=qt&language=english`);
    */

    // For now, return OTP in response (remove in production!)
    return res.status(200).json({
      success: true,
      msg: "OTP sent successfully",
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
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      msg: "Login successful",

      user: {
        // id: user._id,
        phone: user.phone,
        countryCode: user.countryCode
      },
      token

    });

    //update fcm after login

  } catch (error) {
    res.status(500).json({
      success: false,
      msg: error.message
    });
  }
};

export const getMyProfile = async (req, res) => {
  const currentUserId = req.user._id;

  try {
    const [user, datingProfile] = await Promise.all([
      User.findById(currentUserId),
      DatingProfile.findOne({ userId: currentUserId })
    ]);

    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    res.json({
      success: true,
      user,
      datingProfile: datingProfile || null,
      completeness: user.profileCompleteness,
      isDatingActive: datingProfile.isDating || false
    });

  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};


export const updateProfile = async (req, res) => {
  const currentUserId = req.user._id;
  const { basicInfo, datingInfo } = req.body;
  console.log(currentUserId, basicInfo, datingInfo)
  try {
    // 1. Get current data for accurate calculation
    const currentUser = await User.findById(currentUserId);
    const currentDatingProfile = await DatingProfile.findOne({ userId: currentUserId });

    if (!currentUser) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    // 2. Update User (basic info)
    let updatedUser = currentUser;
    if (basicInfo) {
      updatedUser = await User.findByIdAndUpdate(
        currentUserId,
        { $set: basicInfo },
        { new: true, runValidators: true }
      );
    }

    // 3. Update DatingProfile
    let updatedDatingProfile = currentDatingProfile;
    if (datingInfo) {
      updatedDatingProfile = await DatingProfile.findOneAndUpdate(
        { userId: currentUserId },
        { $set: datingInfo },
        { new: true, upsert: true, runValidators: true }
      );
    }

    // Always calculate + update completeness
    const completeness = calculateCompletion(
      updatedUser.toObject(),
      updatedDatingProfile?.toObject()
    );

    // 5. Save final completeness to User
    await User.findByIdAndUpdate(
      currentUserId,
      { $set: { profileCompleteness: completeness } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      msg: "Profile updated successfully",
      user: updatedUser,
      datingProfile: updatedDatingProfile,
      completeness: completeness  // Show exact score
    });

  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ success: false, msg: error.message });
  }
};
export const getOtherProfileDetails = async (req, res) => {
  const currentUserId = req.user._id;  // Viewer
  const targetUserId = req.params.userId;  // Profile being viewed

  try {
    //  Get viewer, target user, and target dating profile
    const [viewerUser, targetUser, targetDatingProfile] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId),
      DatingProfile.findOne({ userId: targetUserId })
    ]);

    if (!targetUser) {
      return res.status(404).json({ success: false, msg: "Profile not found" });
    }

    if (!viewerUser) {
      return res.status(404).json({ success: false, msg: "Viewer not found" });
    }

    //  Apply visibility rules based on VIEWER'S completeness
    const visibleProfile = applyVisibilityRules(
      targetUser,
      targetDatingProfile,
      viewerUser.profileCompleteness
    );

    res.json({
      success: true,
      profile: visibleProfile,
      viewerCompleteness: viewerUser.profileCompleteness,  // How much they can see
      targetCompleteness: targetUser.profileCompleteness   // Target's actual %
    });

  } catch (error) {
    console.error("Get other profile error:", error);
    res.status(500).json({ success: false, msg: error.message });
  }
};

// Visibility rules function
const applyVisibilityRules = (targetUser, targetDatingProfile, viewerCompleteness) => {
  const profile = {
    //_id: targetUser._id,
    name: targetUser.name,
    city: targetUser.city,
    profileCompleteness: targetUser.profileCompleteness,
    isDatingActive: !!targetDatingProfile
  };

  // Progressive visibility based on VIEWER'S completeness
  if (viewerCompleteness >= 20) {
    // Show 2 photos + basic aboutMe
    profile.photos = targetUser.photos?.slice(0, 2) || [];
    profile.aboutMe = targetUser.aboutMe;
  }

  if (viewerCompleteness >= 50) {
    // Show 4 photos + interests
    profile.photos = targetUser.photos?.slice(0, 4) || [];
    profile.interests = targetDatingProfile?.interests || [];
  }

  if (viewerCompleteness >= 80) {
    // Show FULL profile
    profile.photos = targetUser.photos || [];
    profile.bio = targetDatingProfile?.bio;
    profile.height = targetDatingProfile?.height;
    profile.hobbies = targetDatingProfile?.hobbies;
    profile.lifestyle = targetDatingProfile?.lifestyle;
  }

  return profile;
};

//Helper function below
function calculateCompletion(basicInfo, datingInfo) {
  let score = 0;

  // Basic info (50 pts total)
  if (basicInfo?.photos?.length >= 2) score += 30;
  if (basicInfo?.photos?.length >= 5) score += 10;
  if (basicInfo?.aboutMe?.trim().length > 10) score += 20;
  if (basicInfo?.city?.trim()) score += 10;  // Total: 70

  // Dating info (30 pts total)  
  if (datingInfo?.bio?.trim()) score += 10;
  if (datingInfo?.interests?.length >= 3) score += 10;
  if (datingInfo?.height) score += 5;
  if (datingInfo?.hobbies?.length >= 2) score += 5;

  return Math.min(100, score);
};





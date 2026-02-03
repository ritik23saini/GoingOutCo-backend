import User from "../models/User.js";
import UserSubscription from "../models/userSubscription.js";
import { getFreePlanId } from "../utils/planHelper.js";
import DatingProfile from "../models/DatingProfile.js";
export const getMyProfile = async (req, res) => {
  const currentUserId = req.user._id;

  try {
    const [user, datingProfile] = await Promise.all([
      User.findById(currentUserId),
      DatingProfile.findOne({ userId: currentUserId })
    ]);
    console.log(user, datingProfile);
    if (!user) {
      return res.status(200).json({ success: false, msg: "User not found" });
    }

    res.json({
      success: true,
      user,
      datingProfile: datingProfile || null,
      completeness: user.profileCompleteness,
      isDatingActive: datingProfile?.isDating || false
    });

  } catch (error) {
    console.error("Get my profile error:", error.message);
    res.status(500).json({ success: false, msg: "Failed to fetch profile. Please try again later." });
  }
};


/* export const updateProfile = async (req, res) => {
  const currentUserId = req.user._id;
  const { basicInfo, datingInfo } = req.body;
  console.log(currentUserId, basicInfo, datingInfo)
  try {
    // 1. Get current data for accurate calculation
    const currentUser = await User.findById(currentUserId);
    const currentDatingProfile = await DatingProfile.findOne({ userId: currentUserId });

    if (!currentUser) {
      return res.status(200).json({ success: false, msg: "User not found" });
    }

    // 2. Update User (basic info)
    let updatedUser = currentUser;
    if (basicInfo) {
      updatedUser = await User.findByIdAndUpdate(
        currentUserId,
        { $set: basicInfo },
        { new: true, runValidators: true }
      ).select("-profileCompleteness -isVerified -hostMonthlyMeetups -hostUsedThisMonth -isDatingActive -status -createdAt -updatedAt -__v");
    }

    // 3. Update DatingProfile
    let updatedDatingProfile = currentDatingProfile;
    if (datingInfo) {
      updatedDatingProfile = await DatingProfile.findOneAndUpdate(
        { userId: currentUserId },
        { $set: datingInfo },
        { new: true, upsert: true, runValidators: true }
      ).select("-isDating -likesReceived -matchesCount -updatedAt -likesUsedToday -isDatingActive -dailyLikeLimit");
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
}; */

export const updateProfile = async (req, res) => {
  const currentUserId = req.user._id;
  const { basicInfo, datingInfo } = req.body;

  try {
    // 1. FETCH CURRENT DATA (Parallel)
    const [currentUser, currentDatingProfile] = await Promise.all([
      User.findById(currentUserId),
      DatingProfile.findOne({ userId: currentUserId })
    ]);

    if (!currentUser) {
      return res.status(200).json({ success: false, msg: "User not found" });
    }

    // 2. UPDATE USER BASIC INFO (If provided)
    if (basicInfo) {
      Object.keys(basicInfo).forEach((key) => {
        // Security: Prevent updating protected fields
        if (!['roles', 'wallet', 'currentSubscription', 'isVerified', 'status'].includes(key)) {
          currentUser[key] = basicInfo[key];
        }
      });
    }

    // 3. UPDATE DATING PROFILE (Only if provided)
    let datingProfileToSave = currentDatingProfile;

    if (datingInfo) {
      if (!currentDatingProfile) {
        // CASE A: Create New Dating Profile
        datingProfileToSave = new DatingProfile({
          userId: currentUserId,
          ...datingInfo
        });
      } else {
        // CASE B: Update Existing Dating Profile
        Object.keys(datingInfo).forEach((key) => {
          datingProfileToSave[key] = datingInfo[key];
        });
      }
    }

    // 4. CALCULATE SCORE 
    // We pass datingProfileToSave (which might be null if user never created one)
    const newCompleteness = calculateCompletion(currentUser, datingProfileToSave);
    currentUser.profileCompleteness = newCompleteness;

    // 5. LAZY SUBSCRIPTION LOGIC (Free Tier)
    // Grant Free Tier if they don't have it yet
    let subscriptionStatus = "no_change";

    if (!currentUser.currentSubscription) {
      const freePlanId = await getFreePlanId();

      const newSub = new UserSubscription({
        userId: currentUser._id,
        planId: freePlanId,
        status: 'active',
      });

      await newSub.save();

      currentUser.currentSubscription = newSub._id;
      subscriptionStatus = "free_tier";
    }

    // 6. SAVE CHANGES (Conditional)
    const savePromises = [currentUser.save()];

    // Only save dating profile if we actually touched it or created it
    if (datingProfileToSave && datingInfo) {
      savePromises.push(datingProfileToSave.save());
    }

    await Promise.all(savePromises);

    // 7. RESPONSE
    return res.status(200).json({
      success: true,
      msg: "Profile updated successfully",
      //completeness: newCompleteness,
      subscriptionStatus,
      user: {
        _id: currentUser._id,
        name: currentUser.name,
        profileCompleteness: `${currentUser.profileCompleteness}%`,
        photos: currentUser.photos || [],
        aboutMe: currentUser.aboutMe || "",
        currentSubscription: currentUser.currentSubscription
      },
      datingProfile: datingProfileToSave || null
    });

  } catch (error) {
    console.error("Profile Update Error:", error);
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
      return res.status(200).json({ success: false, msg: "Profile not found" });
    }

    if (!viewerUser) {
      return res.status(200).json({ success: false, msg: "Viewer not found" });
    }

    //  Apply visibility rules based on VIEWER'S completeness
    const visibleProfile = applyVisibilityRules(
      targetUser,
      targetDatingProfile,
      viewerUser.profileCompleteness
    );


    let viewerCompleteness = viewerUser.profileCompleteness;
    let targetCompleteness = targetUser.profileCompleteness;
    let msg = null
    if (targetUser.profileCompleteness > viewerUser.profileCompleteness) {
      msg = 'Complete your profile to see more details';
    }
    res.json({
      success: true,
      profile: visibleProfile,
      msg,
      viewerCompleteness,  // How much they can see
      targetCompleteness   // Target's actual %
    });

  } catch (error) {
    console.error("Get other profile error:", error);
    res.status(500).json({ success: false, msg: error.message });
  }
};

// Visibility rules function
const applyVisibilityRules = (targetUser, targetDatingProfile, viewerCompleteness) => {
  let profile = {
    _id: targetUser._id,
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
const calculateCompletion = (user, datingProfile) => {
  let score = 0;


  if (user.photos && user.photos.length >= 2) score += 30;
  else if (user.photos && user.photos.length >= 5) score += 10;

  if (user.aboutMe && user.aboutMe.trim().length > 10) score += 20;
  if (user.city && user.city.trim()) score += 10;

  //  Dating Info (Max 30 pts) - Only calculate if profile exists!
  if (datingProfile) {
    if (datingProfile.bio && datingProfile.bio.trim()) score += 10;

    // Safety check for arrays (User might have created profile but left arrays empty)
    if (datingProfile.interests && datingProfile.interests.length >= 3) score += 10;
    if (datingProfile.height) score += 5;
    if (datingProfile.hobbies && datingProfile.hobbies.length >= 2) score += 5;
  }

  return Math.min(100, score);
};
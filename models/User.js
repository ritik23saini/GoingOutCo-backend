import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    phone: { type: String, required: true, unique: true },
    countryCode: { type: String, default: "+91" },
    name: { type: String, trim: true, },
    dob: { type: Date},

    city: { type: String,  },
    gender: { type: String, enum: ["Male", "Female", "Other"],  },

    roles: {
        type: [String],
        enum: ["user"], //user can be attendee/dating/host and admin is separate 
        default: ["user"]
    },
    /*   profileId: {
          type: mongoose.Types.ObjectId,
          ref: "Profile",
          unique: true,
          sparse: true
      }, */
    //--- SUBSCRIPTION POINTER-- -
    // Critical: This is assigned immediately upon registration (Free Tier)
    currentSubscription: {
        type: mongoose.Types.ObjectId,
        ref: 'UserSubscription',
        default: null
    },

    // --- WALLET (Consumables) ---
    // These are "Extra" items bought separately from the subscription
    wallet: {
        eventBoosts: { type: Number, default: 0 },
        profileBoosts: { type: Number, default: 0 }
    },

    isDatingActive: { type: Boolean, default: false },
    //after login
    aboutMe: String,
    photos: [String],
    profileCompleteness: { type: Number, default: 0 }, //current user completion 
    //email: { type: String, lowercase: true, sparse: true },
    Job: String,
    Education: String,
    Language: String,

    isVerified: { type: Boolean, default: false },
    verificationBadge: Boolean,

    //


    // --- PROFILE DETAILS (After Login) ---
    aboutMe: String,
    photos: [String],
    profileCompleteness: { type: Number, default: 0 },
    Job: String,
    Education: String,
    Language: String,
    isSignupComplete: { type: Boolean, default: false },
    // --- VERIFICATION & SECURITY ---
    isVerified: { type: Boolean, default: false },
    verificationBadge: Boolean,

    otp: String,
    otpExpiresAt: Date,
    lastOtpSentAt: { type: Date, default: null },
    fcmToken: String,
    lastFCMUpdate: Date,

    // --- ACCOUNT STATUS ---
    status: {
        type: String,
        enum: ["active", "suspended", "deleted", "paused"],
        default: "active"
    }
}, { timestamps: true });

// Geo-spatial or specific lookup indexes
userSchema.index({ city: 1 });
userSchema.index({ gender: 1 });

export default mongoose.model("User", userSchema);


/* hostMonthlyLimit: { type: Number, default: 3 },
   hostUsedThisMonth: { type: Number, default: 0 },
   lastMonthReset: { type: Date, default: Date.now() },

   //  FREE TIER DATING 
   dailySwipeLimit: { type: Number, default: 10 },      // Free = 10/day
   dailySwipesUsed: { type: Number, default: 0 },
   lastSwipeReset: { type: Date, default: Date.now() },  // Daily reset

   currentSubscription: {
       type: mongoose.Types.ObjectId,
       ref: 'UserSubscription',
       default: null  // Free users = null
       }, */

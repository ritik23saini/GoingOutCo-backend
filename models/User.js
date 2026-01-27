import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    phone: { type: String, required: true, unique: true },
    countryCode: { type: String, default: "+91" },
    name: { type: String, trim: true, required: true },
    dob: { type: Date, required: true, default: Date.now() },

    city: { type: String, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },

    roles: {
        type: [String],
        enum: ["user", "admin"], //user can be attendee/dating/host and admin is separate 
        default: ["user"]
    },
    /*   profileId: {
          type: mongoose.Types.ObjectId,
          ref: "Profile",
          unique: true,
          sparse: true
      }, */

    //after login
    aboutMe: String,
    photos: [String],
    profileCompleteness: { type: Number, default: 0 }, //current uses completeion
    //email: { type: String, lowercase: true, sparse: true },
    jobTitle: String,
    Education: String,

    isVerified: { type: Boolean, default: false },
    verificationBadge: Boolean,

    hostMonthlyMeetups: { type: Number, default: 3 },
    hostUsedThisMonth: { type: Number, default: 0 },
    lastMonthReset: Date,

    isDatingActive: { type: Boolean, default: false },
    datingSubscription: {
        active: Boolean,
        plan: String,
        expiresAt: Date
    },

    otp: String,
    otpExpiresAt: Date,

    fcmToken: String,
    lastFCMUpdate: Date,

    //account status
    status: {
        type: String,
        enum: ["active", "suspended", "deleted", "paused"],
        default: "active"
    }
}, { timestamps: true });

userSchema.index({ city: 1 });
userSchema.index({ gender: 1 });

export default mongoose.models.User || mongoose.model("User", userSchema);

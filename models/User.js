import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

    //required
    phone: { type: String, required: true, unique: true, index: true, required: true },  // +91XXXXXXXXXX
    countryCode: { type: String, default: "+91", required: true },
    name: { type: String, trim: true, required: true },
    dob: { type: Date, required: true },
    city: { type: String, required: true },
    gender: { type: String, enum: ["male", "female", "other"], required: true },

    // after login/profile setup
    profilePic: String,
    email: { type: String, lowercase: true, sparse: true },

    // Role system
    role: { type: String, enum: ["attendee", "host", "admin", "sub-admin"], default: "attendee" },
    isVerified: { type: Boolean, default: false },  // photo/ID verification
    verificationBadge: Boolean,

    // Progressive profile
    profileCompleteness: { type: Number, default: 0 },  // 0-100%
    photosUploaded: { type: Number, default: 0 },      // for photo visibility rule

    // Host limits
    hostMonthlyMeetups: { type: Number, default: 3 },  // free limit
    hostUsedThisMonth: { type: Number, default: 0 },
    lastMonthReset: Date,

    // Dating
    datingMode: { type: Boolean, default: false },
    datingSubscription: {
        active: Boolean,
        plan: String,  // "basic", "premium"
        expiresAt: Date
    }

    // OTP & Sessions
    /*  
    lastOtp: String,
     lastOtpExpiresAt: Date,
     lastLoginAt: Date,
     fcmToken: String // push notifications
     */
}, { timestamps: true });

userSchema.index({ phone: 1 }, { unique: true });
userSchema.index({ city: 1 });
userSchema.index({ gender: 1 });

const User = mongoose.model("User", userSchema) || mongoose.models.User;

export default User;

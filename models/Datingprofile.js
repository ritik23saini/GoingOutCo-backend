import mongoose from "mongoose";

const datingProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    /*  profileId: {
         type: mongoose.Types.ObjectId,
         ref: "Profile",
         required: true,
         unique: true
     }, */
    bio: String,
    height: Number,
    interests: [String],
    hobbies: [String],

    lifestyle: {
        smoking: { type: String, enum: ["yes", "no", "occasional"] },
        drinking: { type: String, enum: ["yes", "no", "occasional"] },
        workout: String
    },

    city: { type: String },
    distancePreference: Number,
    seeking: {
        type: [String], enum: ["male", "female", "other"]
    },

    isDating: { type: Boolean, default: true },
    lastActiveAt: Date,

    dailyLikeLimit: { type: Number, default: 10 },
    likesUsedToday: { type: Number, default: 0 },
    lastLikeReset: Date,

    likesReceived: { type: Number, default: 0 },
    matchesCount: { type: Number, default: 0 }
}, { timestamps: true });

datingProfileSchema.index({ isActive: 1, lastActiveAt: -1 });
datingProfileSchema.index({ interests: 1 });

export default mongoose.model("DatingProfile", datingProfileSchema);

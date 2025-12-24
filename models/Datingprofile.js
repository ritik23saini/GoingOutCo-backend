import mongoose from "mongoose";

const datingProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "users",
        required: true,
        unique: true,     // one dating profile per user
        index: true
    },

    // Profile details (optional - progressive completion)
    bio: String,
    height: Number,           // cm
    ageRange: [Number],       // [min, max] for preferences
    //seeking: { type: String, enum: ["male", "female", "both"] },

    // Interests & Lifestyle
    interests: [String],
    hobbies: [String],
    lifestyle: {
        smoking: { type: String, enum: ["yes", "no", "occasional"] },
        drinking: { type: String, enum: ["yes", "no", "occasional"] },
        workout: String
    },

    // Photos (separate from main profilePic)
    photos: [{
        url: String,
        isPrimary: Boolean,
        uploadedAt: Date
    }],
    photosCount: { type: Number, default: 0 },

    // Location for dating (more precise than city)
    location: {
        type: { type: String, default: "Point" },
        coordinates: [Number],  // [lng, lat]
        city: String,
        distancePreference: Number  // km
    },

    // Visibility & Status
    isActive: { type: Boolean, default: true },
    visibility: { type: String, enum: ["public", "meetup-only"], default: "public" },
    lastActiveAt: Date,

    // Stats
    likesReceived: { type: Number, default: 0 },
    matchesCount: { type: Number, default: 0 }
}, { timestamps: true });

// Indexes for dating discovery
datingProfileSchema.index({ "location.coordinates": "2dsphere" });
datingProfileSchema.index({ isActive: 1, lastActiveAt: -1 });
datingProfileSchema.index({ interests: 1 });


const DatingProfile = mongoose.model("DatingProfile", datingProfileSchema) || mongoose.models.DatingProfile;

export default DatingProfile;
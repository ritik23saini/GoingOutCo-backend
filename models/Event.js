import mongoose, { Schema } from "mongoose";

const eventsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  hostId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  description: { type: String, required: true },
  category: { type: String, required: true },

  coverimage: { type: String, required: true },
  imageUrls: [{ type: String }],

  location: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], required: true }, // [lng, lat]
    name: String,
    city: String
  },

  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },

  currentAttendee: { type: Number, default: 0 },
  maxAttendee: { type: Number }, // Optional limit

  entryType: {
    type: String,
    enum: ["payment-mode", "invite-only"],
    default: "invite-only"
  },

  price: { type: Number, default: 0 }, // 0 if free 
  isExclusive: { type: Boolean, default: false }, // Admin approval trigger if high capacity

  status: {
    type: String,
    enum: ["draft", "pending", "approved", "live", "cancelled", "completed"],
    default: "draft"
  },

  // --- BOOST & FEATURED SYSTEM ---
  // Note: These are NOT required because a new event is not boosted by default.

  isBoosted: { type: Boolean, default: false }, // Helper for quick filtering

  boostTier: {
    type: String,
    enum: ['basic', 'premium', 'featured', 'none'],
    default: 'none'
  },

  boostMultiplier: { type: Number, default: 1 },
  boostExpiresAt: Date,

}, { timestamps: true });

// --- INDEXES ---

// 1. TTL Index: This effectively "expires" the boost logic, 
// but note: MongoDB TTL deletes DOCUMENTS. 
// If you just want to query "Active Boosts", use a standard index on boostExpiresAt.
// DO NOT use { expireAfterSeconds: 0 } unless you want the EVENT deleted when boost expires.
// We use a standard index here for filtering:
eventsSchema.index({ boostExpiresAt: 1 });

// Geospatial Index for "Events Near Me"
eventsSchema.index({ location: "2dsphere" });

// Sorting Indexes (Featured/Boosted events first)
// Sort by Boost Multiplier (Desc) then Start Date (Asc)
eventsSchema.index({ boostMultiplier: -1, startAt: 1 });

const Event = mongoose.model("Event", eventsSchema);
export default Event;
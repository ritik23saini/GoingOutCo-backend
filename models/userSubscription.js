import mongoose from "mongoose";

const userSubscriptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true, unique: true },
    planId: { type: mongoose.Types.ObjectId, ref: 'SubscriptionPlan', required: true },

    status: { type: String, enum: ['active', 'paused', 'expired', 'cancelled'], default: 'active' },

    // Billing Info
    billingCycle: { type: String, enum: ['monthly', 'yearly'] },
    paymentMethod: String,
    pricePaid: Number,

    startsAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null }, // Null/Far future for Free Tier

    // --- EVENT USAGE (Resets Monthly) ---
    // Compares against plan.features.event.monthlyHostLimit
    hostUsedThisMonth: { type: Number, default: 0 },

    // Compares against plan.features.event.monthlyBoostCredits
    boostsUsed: { type: Number, default: 0 },

    // Compares against plan.features.event.monthlyFeaturedCredits
    featuredEvents: { type: Number, default: 0 },

    // --- DATING USAGE (Resets Daily) ---
    // Compares against plan.features.dating.dailySwipeLimit
    dailySwipesUsed: { type: Number, default: 0 },
    whoLikedYouViewed: { type: Number, default: 0 },

    // --- RESET TRACKERS ---
    // Middleware checks these dates
    lastDailyReset: { type: Date, default: Date.now },
    lastMonthlyReset: { type: Date, default: Date.now }

}, { timestamps: true });

userSubscriptionSchema.index({ userId: 1, status: 1 });

export const UserSubscription = mongoose.model("UserSubscription", userSubscriptionSchema);
export default UserSubscription;
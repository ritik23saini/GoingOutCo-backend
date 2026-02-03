import mongoose from "mongoose";

const subscriptionPlanSchema = new mongoose.Schema({
    // Internal name (e.g., "plus", "elite", "free_tier")
    name: { type: String, required: true, unique: true },

    /*   // Display name (e.g., "Gold Membership")
      displayName: { type: String, required: true }, */

    type: {
        type: String,
        enum: ["dating", "event", "unified"],
        required: true,
        default: "unified"
    },

    billingCycle: { type: String, enum: ["monthly", "yearly"], default: "monthly" },
    price: { type: Number, required: true }, // 0 for Free Tier
    currency: { type: String, default: "INR" },

    // FEATURES & LIMITS ---
    features: {
        event: {
            // Hosting Limit: Set -1 for "Unlimited"
            monthlyHostLimit: { type: Number, required: true, default: 3 },

            // "Renewable" Monthly Credits (use these before wallet)
            monthlyBoostCredits: { type: Number, default: 0 },
            monthlyFeaturedCredits: { type: Number, default: 0 }
        },
        dating: {
            // Swipe Limit: Set -1 for "Unlimited"
            dailySwipeLimit: { type: Number, required: true, default: 10 },

            // Boolean Perks
            seeWhoLikedYou: { type: Boolean, default: false },
            undoLastSwipe: { type: Boolean, default: false }
        }
    },

    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Index for fetching active plans quickly
subscriptionPlanSchema.index({ type: 1, isActive: 1 });

const SubscriptionPlan = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
export default SubscriptionPlan;
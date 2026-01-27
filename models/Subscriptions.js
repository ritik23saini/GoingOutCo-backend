import mongoose from "mongoose";

const subscriptionPlanSchema = new mongoose.Schema({
    name: {
        type: String, required: true // "Dating Plus", "Organizer Pro"
    },

    type: { type: String, enum: ["dating", "event"], required: true },

    billingCycle: { type: String, enum: ["monthly", "yearly"], default: "monthly" },

    price: { type: Number, required: true },

    currency: { type: String, default: "INR" },

    features: {
        // Dating features
        seeWhoLikedYou: Boolean,
        dailySwipeLimit: Number,

        // Event organizer features
        unlimitedEventHosting: Boolean,
        evnetBoostsPerMonth: Number,
        featuredEventsPerMonth: Number,
    },

    isActive: { type: Boolean, default: true }

}, { timestamps: true });

subscriptionPlanSchema.index({ type: 1, billingCycle: 1 });

const SubscriptionPlan = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);

export default SubscriptionPlan;

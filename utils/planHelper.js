import SubscriptionPlan from "../models/SubscriptionPlan.js";

export const getFreePlanId = async () => {
    let freePlan = await SubscriptionPlan.findOne({ name: "free_tier" });
    if (!freePlan) {
        freePlan = await SubscriptionPlan.create({
            name: "free_tier",
            displayName: "Free Starter",
            type: "unified",
            price: 0,
            features: { event: { monthlyHostLimit: 3 }, dating: { dailySwipeLimit: 10 } }
        });
    }
    return freePlan._id;
};
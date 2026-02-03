import UserSubscription from "../models/userSubscription.js";

export const checkHostingLimit = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const sub = await UserSubscription.findOne({ userId }).populate('planId');
        // console.log("sub:", sub);

        if (!sub) {
            return res.status(403).json({
                success: false,
                msg: "No active subscription found. Please complete profile."
            });
        }

        const plan = sub.planId;
        //console.log("User Plan:", plan);
        const now = new Date();

        // 2. LAZY RESET (Check if new month)
        const lastReset = new Date(sub.lastMonthlyReset);
        const isNewMonth =
            now.getMonth() !== lastReset.getMonth() ||
            now.getFullYear() !== lastReset.getFullYear();
        // console.log("lastReset:", lastReset);

        if (isNewMonth) {
            // Reset counters in memory (and DB)
            sub.hostUsedThisMonth = 0;
            sub.boostsUsed = 0;
            sub.featuredEvents = 0;
            sub.lastMonthlyReset = now;
            await sub.save();
        }

        // 3. CHECK LIMIT
        // -1 means "Unlimited"
        const limit = plan.features.event.monthlyHostLimit;
        const usage = sub.hostUsedThisMonth;

       /*  req.userSubscription = sub;
        console.log("sub:", sub) */;

        if (limit !== -1 && usage >= limit) {
            return res.status(403).json({
                success: false,
                msg: `Monthly ${limit} limit reached. Try next month or upgrade your plan.`,
                limit,
                usage,
                upgradeRequired: true
            });
        }

        req.userSubscription = sub;
        console.log("sub:", sub);
        next();

    } catch (error) {
        console.error("Limit Check Error:", error);
        res.status(500).json({ success: false, msg: "Server Error" });
    }
};
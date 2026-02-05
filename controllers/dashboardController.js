import Event from "../models/Event.js";

// Utility: Fisher-Yates Shuffle to randomize arrays
const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

export const getDashboardEvents = async (req, res) => {
    try {
        const { lat, long } = req.query;
        const today = new Date();

        const liveFilter = { status: "live", endAt: { $gt: today } };

        const [highTierCandidates, lowTierCandidates, trending, upcoming, nearMe] = await Promise.all([

            // --- A. FEATURED (High Tier POOL) ---
            // Fetch Top 10 High Spenders
            // We will pick 3 random winners from this pool.
            Event.find({ ...liveFilter, isBoosted: true, boostMultiplier: { $gte: 20 } })
                .sort({ boostMultiplier: -1, startAt: 1 })
                .limit(10) // <--- The Pool Size
                .select("title coverimage startAt location price hostId").populate('hostId', '-_id name'),

            // --- B. FEATURED (Low Tier POOL) ---
            // Fetch Top 10 Economy Spenders
            // We will pick 2 random winners from this pool.
            Event.find({ ...liveFilter, isBoosted: true, boostMultiplier: { $lt: 20 } })
                .sort({ startAt: 1 })
                .limit(10) // <--- The Pool Size
                .select("title coverimage startAt location price hostId").populate('hostId', 'name'),

            // --- C. TRENDING ---
            // No rotation needed here, users want to see what is ACTUALLY popular
            Event.find({ ...liveFilter })
                .sort({ currentAttendee: -1 })
                .limit(6)
                .select("title coverimage startAt location price hostId").populate('hostId', 'name'),

            // --- D. UPCOMING ---
            Event.find({ ...liveFilter })
                .sort({ startAt: 1 })
                .limit(10)
                .select("title coverimage startAt location price hostId").populate('hostId', 'name'),

            // --- E. NEAR ME ---
            (lat && long)
                ? Event.find({
                    ...liveFilter,
                    location: {
                        $near: {
                            $geometry: { type: "Point", coordinates: [parseFloat(long), parseFloat(lat)] },
                            $maxDistance: 15000
                        }
                    }
                }).limit(5).select("title coverimage startAt location price hostId").populate('hostId', 'name')
                : Promise.resolve([])
        ]);

        // --- LOGIC: PICK RANDOM WINNERS ---

        // 1. Shuffle the candidates so it's different every request
        const randomHigh = shuffle(highTierCandidates).slice(0, 3); // Pick 3
        const randomLow = shuffle(lowTierCandidates).slice(0, 2);   // Pick 2

        // 2. Mix them nicely (Interleave logic)
        const featuredMixed = [];
        const maxLen = Math.max(randomHigh.length, randomLow.length);

        for (let i = 0; i < maxLen; i++) {
            if (randomHigh[i]) featuredMixed.push(randomHigh[i]);
            if (randomLow[i]) featuredMixed.push(randomLow[i]);
        }

        res.status(200).json({
            success: true,
            data: {
                featured: featuredMixed,
                trending,
                upcoming,
                nearMe
            }
        });

    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ success: false, msg: error.message });
    }
};
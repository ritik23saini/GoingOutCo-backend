
export const searchDates = async (req, res) => {
    const { eventId } = req.params;
    const currentUserId = req.user._id;
    console.log(currentUserId)
    try {

        const withdraw = await JoinRequest.findOneAndDelete({ eventId, users: { $in: [currentUserId] } }).lean();
        if (!withdraw) {
            return res.status(200).json({ success: false, msg: "no join request found" });
        }
        return res.status(200).json({ success: true, msg: "You have Withdrawn from event" });

    } catch (error) {
        console.error("withdraw event error:", error.message)
        return res.status(500).json({ success: false, msg: "ERROR IN withdrawEvent" });
    }
};
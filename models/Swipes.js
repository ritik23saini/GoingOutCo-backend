import mongoose from "mongoose";

const swipeSchema = new mongoose.Schema({
    swiperId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    swipedId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: {
        type: String,
        enum: ["like", "pass", "superlike"],
        required: true
    },
    // context: { type: String, enum: ["global", "meetup"], required: true },
    eventId: {
        type: Schema.Types.ObjectId,
        ref: "Event",
        default: null
    },
    createdAt: { type: Date, default: Date.now }
});
swipeSchema.index({ swiperId: 1, swipedId: 1 }, { unique: true });
swipeSchema.index({ swipedId: 1, action: 1 });

const Swipe = mongoose.model("Swipe", swipeSchema)
export default Swipe; 
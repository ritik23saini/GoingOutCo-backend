import { model, Schema } from "mongoose";

const swipeSchema = new Schema({
    swiperId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    swipedId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["like", "pass"], required: true },
    // context: { type: String, enum: ["global", "meetup"], required: true },
    meetupId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: false },
    createdAt: { type: Date, default: Date.now }
});

const Swipe = model("Swipe", swipeSchema) || mongoose.models.Swipe;
export default Swipe;
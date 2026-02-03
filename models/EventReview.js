import mongoose, { Schema } from "mongoose";

const eventReviewSchema = new Schema({

    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    hostId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true }
}, { timestamps: true });

// Prevent multiple reviews for same event by same user
eventReviewSchema.index({ eventId: 1, reviewerId: 1 }, { unique: true });

// Fast host profile lookup
eventReviewSchema.index({ hostId: 1, createdAt: -1 });

export default mongoose.model("EventReview", eventReviewSchema);

import mongoose, { Schema } from "mongoose";


const favoriteSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    },
    { timestamps: true }
);

// prevent duplicates
favoriteSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export default mongoose.model("Favorite", favoriteSchema);
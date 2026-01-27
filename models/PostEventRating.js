import mongoose from "mongoose";

//rating  after attending event.
const postEventRatingSchema = new mongoose.Schema({
    eventId: { type: Schema.Types.ObjectId, required: true, ref: 'Event' },
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    comment: String
}, { timestamps: true });

const PostEventRating = mongoose.model("PostEventRating", postEventRatingSchema) || mongoose.models.PostEventRating;
export default PostEventRating;
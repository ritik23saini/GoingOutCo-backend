import { model, Schema } from "mongoose";

const HostRatingSchema = new Schema({
    hostId: { type: Schema.Types.ObjectId, ref: "User", unique: true },
    ratingAvg: { type: Number, default: 0 ,},
    ratingCount: { type: Number, default: 0 }
});

const HostRating = model("HostRating", HostRatingSchema)
export default HostRating;

/* 
const hostRating = await HostRating.findOneAndUpdate(
  { hostId },
  {
    $inc: { ratingCount: 1 },
    $set: {
      ratingAvg:
        ((oldAvg * oldCount) + newRating) / (oldCount + 1)
    }
  },
  { upsert: true, new: true }
);
*/
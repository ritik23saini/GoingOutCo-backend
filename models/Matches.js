import { model, Schema } from "mongoose";

const matchedSchema = new Schema({

    user1Id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    user2Id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    matchedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
});
const Match = model("Match", matchedSchema) || mongoose.models.Match;

export default Match;

import mongoose, { Schema } from "mongoose";

const querySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    status: {
        type: String,
        enum: ["open", "in_progress", "resolved", "closed"],
        default: "open"
    },
}, { timestamps: true });

const SupportQuery = mongoose.model("SupportQuery", querySchema);
export default SupportQuery;

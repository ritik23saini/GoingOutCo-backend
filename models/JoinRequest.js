import mongoose from "mongoose";

//accept and withdraw join requests for events
const joinRequestsSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
    requestedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const JoinRequest = mongoose.model("JoinRequest", joinRequestsSchema) || mongoose.models.EventRequest;
export default JoinRequest;
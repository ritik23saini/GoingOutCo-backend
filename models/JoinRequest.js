import { Schema, model } from "mongoose";

//accept and withdraw join requests for events 

// Before confirmaton
const joinRequestsSchema = new Schema({
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    users: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],//max 2 
    joinedAs: {
        type: String,
        enum: ["single", "couple"],
        required: true
    },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
   // requestedAt: { type: Date, default: Date.now }
}, { timestamps: true });

joinRequestsSchema.index({ eventId: 1, users: 1 }, { unique: true }); //For a given event, the same user(s) cannot appear twice

const JoinRequest = model("JoinRequest", joinRequestsSchema);
export default JoinRequest;
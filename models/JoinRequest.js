import { Schema, model } from "mongoose";

//accept and withdraw join requests for events 

const joinRequestsSchema = new Schema({
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    users: {
        type: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
        validate: [arrayLimit, '{PATH} must have 1 or 2 users']
    }, joinedAs: {
        type: String,
        enum: ["single", "couple"],
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected", "payment_pending", "payment_failed"],
        required: true,
        default: "pending"
    },
    // requestedAt: { type: Date, default: Date.now }
}, { timestamps: true });

joinRequestsSchema.index({ eventId: 1, users: 1 }, { unique: true }); //For a given event, the same user(s) cannot appear twice

function arrayLimit(val) {
    return val.length >= 1 && val.length <= 2;
}
const JoinRequest = model("JoinRequest", joinRequestsSchema);
export default JoinRequest;
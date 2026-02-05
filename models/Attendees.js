// After confirmaton

import { model, Schema } from "mongoose";

const attendeeSchema = new Schema({

    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    users: {
        type: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
        validate: [arrayLimit, '{PATH} must have 1 or 2 users']
    },
    joinedAs: { type: String, enum: ["single", "couple"], required: true },
    status: {
        type: String,
        enum: ["going", "checked_in", "cancelled", "refunded"],
        default: "going"
    },
    paymentStatus: { type: String, enum: ["free", "paid"], default: "free" },
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment" },
    joinedAt: { type: Date, default: Date.now },
    ticketCode: { type: String, unique: true, required: true },

}, { timestamps: true });

function arrayLimit(val) {
    return val.length >= 1 && val.length <= 2;
}
attendeeSchema.index({ eventId: 1, users: 1 }, { unique: true }); //For a given event, the same user(s) cannot appear twice
const Attendees = model("Attendee", attendeeSchema)
export default Attendees; 
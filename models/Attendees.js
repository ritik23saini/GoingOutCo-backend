import mongoose from "mongoose";
// After confirmaton

const attendeeSchema = new mongoose.Schema({

    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    users: [{ type: Schema.Types.ObjectId, ref: "User", required: true }], //1 or 2 user only
    joinedAs: { type: String, enum: ["single", "couple"], required: true, default: "single" },
    paymentStatus: { type: String, enum: ["free", "paid"], default: "free" },
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment" },
    // paidBy: { type: Schema.Types.ObjectId, ref: "User" },
    joinedAt: { type: Date, default: Date.now }


}, { timestamps: true });
attendeeSchema.index({ eventId: 1, users: 1 }, { unique: true }); //For a given event, the same user(s) cannot appear twice
const Attendee = mongoose.model("Attendee", attendeeSchema) || mongoose.models.Attendee;
export default Attendee; 
import { model, Schema } from "mongoose";

const attendeeSchema = new Schema({

    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    userId: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    joinedAs: { type: String, enum: ["single", "couple"], required: true },
    partnerId: { type: Schema.Types.ObjectId, ref: "User", optional: true },
    paymentStatus: { type: String, enum: ["free", "paid"], default: "free" },
    joinedAt: { type: Date, default: Date.now }


}, { timestamps: true });
const Attendee = model("Attendee", attendeeSchema) || mongoose.models.Attendee;
export default Attendee; 
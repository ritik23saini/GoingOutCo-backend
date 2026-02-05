import mongoose, { Schema } from "mongoose";

const paymentSchema = new mongoose.Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // What are they paying for?
    type: {
        type: String,
        enum: ["subscription", "boost", "event"],
        required: true
    },

    // Polymorphic Reference (The "Link")
    refId: { type: Schema.Types.ObjectId, required: true, index: true },
    refType: {
        type: String,
        enum: ["Event", "SubscriptionPlan", "Boost"], // Ensure these match your Model names exactly
        required: true
    },

    // Money
    amount: { type: Number, required: true }, // Store in PAISE (₹100 = 10000)
    currency: { type: String, default: "INR" },

    // Razorpay Specifics
    gateway: { type: String, enum: ["razorpay"], default: "razorpay" },
    gatewayOrderId: { type: String, required: true },
    gatewayPaymentId: { type: String },
    gatewaySignature: { type: String }, // Good to keep for security audits

    status: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },

    // Meta is useful! Store extra info here.
    // Example for Event: { quantity: 2, ticketType: "couple" }
    // Example for Sub: { months: 12, discountApplied: "NEWUSER" }
    meta: { type: Schema.Types.Mixed },

    paidAt: Date,
    refundedAt: Date

}, { timestamps: true });

// Index for fast lookup: "Show me all paid event tickets for User X"
paymentSchema.index({ userId: 1, type: 1, status: 1 });

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
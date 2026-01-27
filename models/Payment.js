import mongoose, { Schema } from "mongoose";

const paymentSchema = new mongoose.Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["subscription", "boost", "event"], required: true },
    refId: { type: Schema.Types.ObjectId, index: true },
    refType: {
        type: String,
        enum: ["Event", "Subscription", "Boost"], //which model name
        required: true
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    gateway: { type: String, enum: ["razorpay"], required: true },
    gatewayOrderId: String,
    gatewayPaymentId: String,
    status: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
    meta: { type: Object },
    paidAt: Date,
    refundedAt: Date

}, { timestamps: true });

paymentSchema.index({ userId: 1, type: 1, status: 1 });


const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;

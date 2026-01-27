import mongoose, { Schema } from "mongoose";


const eventsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    hostId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    description: { type: String, required: true },
    category: { type: String, required: true },
    coverimage: { type: String, required: true },
    imageUrls: [{ type: String }],

    location: {
        type: { type: String, default: "Point" },
        coordinates: { type: [Number], required: true },// [lng, lat]
        name: String,
        city: String
    },

    startAt: { type: Date, required: true }, //start-time date
    endAt: { type: Date, required: true }, //end-time date
    currentAttendee: { type: Number, default: 0 },
    entryType: {
        type: String,
        enum: ["payment-mode", "invite-only"],
        default: "invite-only"
    },

    price: { type: Number, default: 0 }, // 0 if free 
    isExclusive: { type: Boolean, default: false }, // if  maxattendee > 15 contact  admin he will approve
    status: { type: String, enum: ["draft", "pending", "approved", "live", "cancelled", "completed"], default: "draft" },
    // isBoosted: Boolean,

    //optional
    /*     
    country: { type: String }, // "India", "USA"
    currency: { type: String }, // "INR", "USD"
    currencySymbol: { type: String }, // "₹", "$"" 
    */

    //isDeleted: { type: Boolean, default: false },
}, { timestamps: true });


eventsSchema.index({ hostId: 1, createdAt: -1 });

eventsSchema.index({ location: "2dsphere" });
eventsSchema.index({ startAt: 1, status: 1 });
eventsSchema.index({ createdAt: 1 });
//eventsSchema.index({ visibility: 1, startAt: 1 });


const Event = mongoose.model("Event", eventsSchema) || mongoose.models.Event;

export default Event;

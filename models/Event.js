import mongoose from "mongoose";


const eventsSchema = new mongoose.Schema({
    Images: { type: [String], default: [] },
    title: { type: String, required: true },
    description: { type: String, required: true },
    hostId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    startAt: { type: Date, required: true }, //start date
    EndAt: { type: Date, required: true }, //end date
    time: { type: String },
    //category: [{ type: String, required: true }],

    city: { type: String, default: 'NA' },
    location: {
        type: { type: String, default: "Point" },
        coordinates: [Number],  // [lng, lat]
        //city: String,
    },
    address: { type: String, required: true },

    price: { type: Number, default: 0 }, // 0 if free
    country: { type: String }, // "India", "USA"
    currency: { type: String }, // "INR", "USD"
    currencySymbol: { type: String }, // "₹", "$""

    isExclusive: { type: Boolean, default: false }, // True if >15
    status: { type: String, enum: ["draft", "pending", "approved", "live", "cancelled", "completed"], default: "draft" },
    //isDeleted: { type: Boolean, default: false },
    isEventCompleted: { type: Boolean, default: false },
    isBoosted: Boolean,
    requestMode: { type: Boolean, default: false },
    chatEnabled: { type: Boolean, default: false },
    currentAttendee: { type: Number, default: 0 },
    maxAttendees: { type: Number, default: 15 }
}, { timestamps: true });



eventsSchema.index({ location: '2dsphere' });
eventsSchema.index({ startAt: 1, isEventCompleted: 1 });
eventsSchema.index({ createdAt: 1 });
eventsSchema.index({ isDeleted: 1 });

module.exports = mongoose.model("Event", eventsSchema); 
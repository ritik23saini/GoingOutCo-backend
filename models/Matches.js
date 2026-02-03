import mongoose from "mongoose";

const matchedSchema = new mongoose.Schema({
    user1Id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    user2Id: { type: Schema.Types.ObjectId, ref: "User", required: true },

    matchedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }

}, { timestamps: true });

matchedSchema.pre("save", function (next) {
    if (this.user1Id.toString() > this.user2Id.toString()) {
        [this.user1Id, this.user2Id] = [this.user2Id, this.user1Id];
    }
    next();
});

/*  without pre hook (must enforce uniqueness).
Duplicate matches

Without normalization, these two documents are DIFFERENT to MongoDB:

{ user1Id: A, user2Id: B }
{ user1Id: B, user2Id: A }
*/

matchedSchema.index({ user1Id: 1, user2Id: 1 }, { unique: true }); //This guarantees 1 match document per pair.
const Matches = mongoose.model("Matches", matchedSchema)
export default Matches;
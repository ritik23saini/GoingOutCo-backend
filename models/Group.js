const { Schema, model } = require("mongoose");

const groupSchema = new Schema(
  {
    groupName: { type: String, required: true },
    groupDescription: { type: String, required: true },
    groupImage: { type: String, default: "NA" },
    name: { type: String, required: true },
    email: { type: String, default: null },
    phoneNumber: { type: String, default: null },
    hostId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    roomId: { type: String, default: null },
    totalMembers: { type: Number, default: 0 },
    status: String
  },
  { timestamps: true }
);

module.exports = model("Group", groupSchema);

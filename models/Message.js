
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: String,
    isRead: { type: Boolean, default: false }
    // sentAt: Date
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema) || mongoose.models.Message;

export default Message;
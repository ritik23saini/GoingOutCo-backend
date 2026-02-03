
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    senderId: { type: Schema.Types.ObjectId, ref: "User" },
    receiverId: { type: Schema.Types.ObjectId, ref: "User" },
    content: String,
    isRead: { type: Boolean, default: false },
    //sentAt: Date
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema)
export default Message;
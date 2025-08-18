
const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  senderId: { type: String, required: true },
  receiverId: { type: String },
  message: { type: String, required: true },
  username: { type: String },
  timestamp: { type: Date, default: Date.now },
  type: { type: String, enum: ["text", "voice", "document", "image"], default: "text" },
  filePath: { type: String },
});

const Message = mongoose.model("Message", MessageSchema);

module.exports = Message;
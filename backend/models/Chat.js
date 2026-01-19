const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  userMessage: { type: String, required: true },
  aiReply: { type: String, required: true },
  sessionId: { type: String, required: true }, // Isolates chat per refresh
  timestamp: { type: Date, default: Date.now },
  context: { type: Object },
});

module.exports = mongoose.model("Chat", chatSchema);

const dialogflow = require("@google-cloud/dialogflow");
const path = require("path");
const Message = require("../models/chatModel");
const User = require("../models/userModel");
require("dotenv").config();
const fs = require("fs");
const { default: mongoose } = require("mongoose");

class DialogflowService {
  constructor() {
    // Validate environment variables
    this.projectId = process.env.DIALOGFLOW_PROJECT_ID;
    if (!this.projectId) {
      throw new Error("DIALOGFLOW_PROJECT_ID environment variable is not set");
    }

    // Use environment variable for credentials path
    const keyFilename = path.join(__dirname, "../talkrio-eqxn-67cf52cc8f1a.json");
    if (!fs.existsSync(keyFilename)) {
      throw new Error(`Credentials file not found at: ${keyFilename}`);
    }

    this.sessionClient = new dialogflow.SessionsClient({ keyFilename });
  }

  async sendMessageToDialogflow(message, sessionId, roomId, senderId) {
    try {
      // Validate inputs
      if (!message || !sessionId || !roomId || !senderId) {
        throw new Error("Missing required parameters");
      }

      const sessionPath = this.sessionClient.projectAgentSessionPath(this.projectId, sessionId);

      const request = {
        session: sessionPath,
        queryInput: {
          text: {
            text: message,
            languageCode: "en-US", // Match your Dialogflow agent's language
          },
        },
      };

      // Save user message to MongoDB
      let username = "Guest";
      if (mongoose.Types.ObjectId.isValid(senderId)) {
        const user = await User.findById(senderId).select("username");
        if (user) username = user.username;
      }
      const userMessage = new Message({
        roomId,
        senderId,
        receiverId: "bot",
        message,
        username,
        timestamp: Date.now(),
      });
      await userMessage.save();

      // Call Dialogflow
      const [response] = await this.sessionClient.detectIntent(request);
      const result = response.queryResult;

      // Save bot response to MongoDB
      const botMessage = new Message({
        roomId,
        senderId: "bot",
        receiverId: senderId,
        message: result.fulfillmentText || "Sorry, I didn’t understand that.",
        username: "Talkrio AI",
        timestamp: Date.now(),
      });
      await botMessage.save();

      return {
        text: result.fulfillmentText || "Sorry, I didn’t understand that.",
        intent: result.intent?.displayName || "UNKNOWN",
        confidence: result.intentDetectionConfidence || 0,
        payload: result.fulfillmentMessages?.find((m) => m.payload)?.payload || {},
        messageId: botMessage._id,
      };
    } catch (error) {
      console.error("Dialogflow Error:", error.message);

      // Save error message to MongoDB
      let errorMessage = "Sorry, I'm having trouble understanding. Please try again.";
      if (error.code === 7) {
        errorMessage = "Permission denied. Please contact the administrator.";
      } else if (error.code === 5) {
        errorMessage = "Resource not found. Check the project configuration.";
      } else if (error.message.includes("credentials")) {
        errorMessage = "Authentication error. Please check server configuration.";
      }

      const botMessage = new Message({
        roomId,
        senderId: "bot",
        receiverId: senderId,
        message: errorMessage,
        username: "Talkrio AI",
        timestamp: Date.now(),
      });
      await botMessage.save();

      return {
        text: errorMessage,
        intent: "ERROR",
        confidence: 0,
        messageId: botMessage._id,
      };
    }
  }
}

module.exports = new DialogflowService();
const { Server } = require("socket.io");
const Message = require("./models/chatModel");
const User = require("./models/userModel");
const dialogflowService = require("./middlewares/dialogflowService");
const fs = require("fs").promises;
const path = require("path");
const Joi = require("joi");
require("dotenv").config();

let io;

const messageSchema = Joi.object({
  message: Joi.string().required(),
  sessionId: Joi.string().required(),
  roomId: Joi.string().required(),
  senderId: Joi.string().required(),
});

const fileSchema = Joi.object({
  filename: Joi.string().required(),
  file: Joi.string().required(),
  sessionId: Joi.string().required(),
  roomId: Joi.string(),
  senderId: Joi.string(),
});

const voiceSchema = Joi.object({
  audio: Joi.string().required(),
  sessionId: Joi.string().required(),
  roomId: Joi.string(),
  senderId: Joi.string(),
});

const initializeSocket = (server) => {
  const corsOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
  io = new Server(server, {
    cors: {
      origin: corsOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on("join_room", (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room: ${roomId}`);
    });

    socket.on("send_message", async (data, callback) => {
      try {
        const user = await User.findById(data.senderId).select("name");
        if (!user) throw new Error("User not found");

        const newMessage = new Message({
          roomId: data.roomId,
          senderId: data.senderId,
          receiverId: data.receiverId,
          message: data.message,
          timestamp: data.timestamp || Date.now(),
          username: user.name,
        });

        await newMessage.save();
        io.in(data.roomId).emit("receive_message", newMessage);
        if (typeof callback === "function") {
          callback();
        }
      } catch (error) {
        console.error("Error saving message:", error);
        socket.emit("messageResponse", {
          text: "Failed to send message",
          sender: "bot",
          intent: "ERROR",
          confidence: 0,
        });
        if (typeof callback === "function") {
          callback({ error: "Failed to send message" });
        }
      }
    });

    socket.on("bot_message", async (data, callback) => {
      try {
        await messageSchema.validateAsync(data);
        const { message, sessionId, roomId, senderId } = data;
        socket.join(roomId);
        const response = await dialogflowService.sendMessageToDialogflow(
          message,
          sessionId || socket.id,
          roomId,
          senderId
        );
        if (!response.text) throw new Error("Invalid Dialogflow response");

        const messageData = {
          text: response.text,
          sender: "bot",
          intent: response.intent || "UNKNOWN",
          confidence: response.confidence || 0,
          payload: response.payload || {},
        };
        io.in(roomId).emit("messageResponse", messageData);

        // Save bot response to database
        const newMessage = new Message({
          roomId,
          senderId: "bot",
          message: response.text,
          type: "text",
          timestamp: Date.now(),
          username: "Talkrio AI",
        });
        await newMessage.save();

        if (typeof callback === "function") {
          callback();
        }
      } catch (error) {
        console.error("Bot message error:", error);
        socket.emit("messageResponse", {
          text: "Sorry, I encountered an error. Please try again.",
          sender: "bot",
          intent: "ERROR",
          confidence: 0,
        });
        if (typeof callback === "function") {
          callback({ error: "Failed to process bot message" });
        }
      }
    });

    socket.on("voice_message", async (data, callback) => {
      try {
        await voiceSchema.validateAsync(data);
        const { audio, sessionId, roomId, senderId } = data;
        const buffer = Buffer.from(audio.split(",")[1], "base64");
        const filename = `voice_${Date.now()}.webm`;
        const filePath = path.join(__dirname, "Uploads/voice", filename);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, buffer);

        const newMessage = new Message({
          roomId,
          senderId,
          message: "Voice message",
          type: "voice",
          filePath,
          timestamp: Date.now(),
        });
        await newMessage.save();

        socket.emit("messageResponse", {
          text: "Voice message received and saved!",
          sender: "bot",
          intent: "VOICE_MESSAGE",
          confidence: 1,
        });
        if (typeof callback === "function") {
          callback();
        }
      } catch (error) {
        console.error("Voice message error:", error);
        socket.emit("messageResponse", {
          text: "Sorry, I couldn't process your voice message.",
          sender: "bot",
          intent: "ERROR",
          confidence: 0,
        });
        if (typeof callback === "function") {
          callback({ error: "Failed to process voice message" });
        }
      }
    });

    socket.on("document", async (data, callback) => {
      try {
        await fileSchema.validateAsync(data);
        const { filename, file, sessionId, roomId, senderId } = data;
        const buffer = Buffer.from(file.split(",")[1], "base64");
        const filePath = path.join(__dirname, "Uploads/documents", `${Date.now()}_${filename}`);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, buffer);

        const newMessage = new Message({
          roomId,
          senderId,
          message: `Document: ${filename}`,
          type: "document",
          filePath,
          timestamp: Date.now(),
        });
        await newMessage.save();

        socket.emit("messageResponse", {
          text: `Document received: ${filename}`,
          sender: "bot",
          intent: "DOCUMENT",
          confidence: 1,
        });
        if (typeof callback === "function") {
          callback();
        }
      } catch (error) {
        console.error("Document error:", error);
        socket.emit("messageResponse", {
          text: "Sorry, I couldn't process the document.",
          sender: "bot",
          intent: "ERROR",
          confidence: 0,
        });
        if (typeof callback === "function") {
          callback({ error: "Failed to process document" });
        }
      }
    });

    socket.on("image", async (data, callback) => {
      try {
        await fileSchema.validateAsync(data);
        const { filename, file, sessionId, roomId, senderId } = data;
        const buffer = Buffer.from(file.split(",")[1], "base64");
        const filePath = path.join(__dirname, "Uploads/images", `${Date.now()}_${filename}`);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, buffer);

        const newMessage = new Message({
          roomId,
          senderId,
          message: `Image: ${filename}`,
          type: "image",
          filePath,
          timestamp: Date.now(),
        });
        await newMessage.save();

        socket.emit("messageResponse", {
          text: `Image received: ${filename}`,
          sender: "bot",
          intent: "IMAGE",
          confidence: 1,
        });
        if (typeof callback === "function") {
          callback();
        }
      } catch (error) {
        console.error("Image error:", error);
        socket.emit("messageResponse", {
          text: "Sorry, I couldn't process the image.",
          sender: "bot",
          intent: "ERROR",
          confidence: 0,
        });
        if (typeof callback === "function") {
          callback({ error: "Failed to process image" });
        }
      }
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized!");
  }
  return io;
};

module.exports = { initializeSocket, getIO };
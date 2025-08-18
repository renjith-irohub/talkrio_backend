// const express = require("express");
// const userAuthentication = require("../middlewares/userAuthentication");
// const Message = require("../models/chatModel");
// const chatRoutes = express.Router();

// chatRoutes.get("/:roomId", userAuthentication,async (req, res) => {
//   try {
//     const { roomId } = req.params;
//     const messages = await Message.find({ roomId }).sort({ timestamp: 1 });
//     res.json(messages);
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching messages", error });
//   }
// });
  
//   // Save a new message
// chatRoutes.post("/", userAuthentication,async (req, res) => {
//   try {
  
//     const { roomId, senderId, receiverId, message, timestamp } = req.body;

//     const newMessage = new Message({
//       roomId,
//       senderId,
//       receiverId,
//       message,
//       timestamp,
//     });
// console.log(newMessage)
//     await newMessage.save();
//     res.status(201).json(newMessage);
//   } catch (error) {
//     res.status(500).json({ message: "Error saving message", error });
//   }
// });

// module.exports = chatRoutes;

const express = require("express");
const userAuthentication = require("../middlewares/userAuthentication");
const Message = require("../models/chatModel");
const chatRoutes = express.Router();

// Get messages for a room
chatRoutes.get("/:roomId", userAuthentication, async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await Message.find({ roomId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching messages", error });
  }
});

// Save a new message
chatRoutes.post("/", userAuthentication, async (req, res) => {
  try {
    const { roomId, senderId, receiverId, message, timestamp } = req.body;

    const newMessage = new Message({
      roomId,
      senderId,
      receiverId,
      message,
      timestamp: timestamp || Date.now(),
    });

    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: "Error saving message", error });
  }
});

// Delete all messages for a room
chatRoutes.delete("/:roomId", userAuthentication, async (req, res) => {
  try {
    const { roomId } = req.params;
    await Message.deleteMany({ roomId });
    res.json({ message: "Chat history cleared" });
  } catch (error) {
    res.status(500).json({ message: "Error clearing chat history", error });
  }
});

module.exports = chatRoutes;
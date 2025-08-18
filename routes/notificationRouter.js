const express = require("express");
const userAuthentication = require("../middlewares/userAuthentication");
const notificationController = require("../controllers/notificationController");
const notificationRouter = express.Router();

notificationRouter.get("/viewall",userAuthentication,notificationController.getUserNotifications);
notificationRouter.put("/update",userAuthentication,notificationController.markNotificationAsRead);
notificationRouter.delete("/delete",userAuthentication,notificationController.deleteNotification);

module.exports = notificationRouter;

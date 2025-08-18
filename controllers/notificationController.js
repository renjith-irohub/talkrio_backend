const asyncHandler = require("express-async-handler");
const Notification = require("../models/notificationModel");

const notificationController = {
    getUserNotifications: asyncHandler(async (req, res) => {
        const notifications = await Notification.find({ user: req.user.id }).sort({ date: -1 });
        res.send(notifications);
    }),

    markNotificationAsRead: asyncHandler(async (req, res) => {
        const { id } = req.body;
        const notification = await Notification.findById(id);

        if (!notification) {
            throw new Error("Notification not found.");
        }

        notification.read = true;
        await notification.save();
        await notification.deleteOne();
        res.send("Notification marked as read.");
    }),

    deleteNotification: asyncHandler(async (req, res) => {
        const { id } = req.body;
        const notification = await Notification.findById(id);

        if (!notification) {
            throw new Error("Notification not found.");
        }

        await notification.deleteOne();
        res.send("Notification deleted successfully.");
    }),

    
};

module.exports = notificationController;

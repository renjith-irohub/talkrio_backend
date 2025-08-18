const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" ,
        require:true
    },
    message: { 
        type: String,
    },
    read: { 
        type: Boolean, 
        default: false 
    },
    date: { 
        type: Date, 
        default: Date.now 
    }
});

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
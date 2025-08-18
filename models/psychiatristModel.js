const mongoose = require("mongoose");

const PsychiatristSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    name: {
        type: String,
    },
    specialization: {
        type: String,
    },
    availability: [
        {
            day: String, // e.g., "Monday"
            start: String, // e.g., "09:00"
            end: String, // e.g., "17:00"
        },
    ],
    contact: {
        type: String,
    },
    googleMeetLink: {
        type: String, // e.g., "https://meet.google.com/abc-defg-hij"
        trim: true,
        match: /^https:\/\/meet\.google\.com\/[a-zA-Z0-9-]+$/ // Optional: Basic URL validation
    },
});

const Psychiatrist = mongoose.model("Psychiatrist", PsychiatristSchema);
module.exports = Psychiatrist;
const mongoose = require("mongoose");

const ConsultationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  psychiatristId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Psychiatrist",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["Scheduled", "Completed", "Canceled"],
    default: "Scheduled",
  },
  notes: {
    type: String, // User's reason for booking
  },
  prescriptionNotes: {
    type: String, // Doctor's prescription notes
  },
}, { timestamps: true });



const Consultation = mongoose.model("Consultation", ConsultationSchema);
module.exports = Consultation;
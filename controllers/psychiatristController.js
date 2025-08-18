const Psychiatrist = require("../models/psychiatristModel");
const Consultation = require("../models/ConsultationModel");
const asyncHandler = require("express-async-handler");
const Payment = require("../models/paymentModel");
const User = require("../models/userModel");

const psychiatristController = {
  addPsychiatrist: asyncHandler(async (req, res) => {
    const { name, specialization, availability, contact } = req.body;
    const existingPsychiatrist = await Psychiatrist.findOne({ name, specialization });
    if (existingPsychiatrist) {
      throw new Error("Psychiatrist already exists");
    }
    const psychiatrist = new Psychiatrist({
      user: req.user.id,
      name,
      specialization,
      availability,
      contact,
    });
    await psychiatrist.save();
    res.send({
      message: "Psychiatrist added successfully",
      psychiatrist,
    });
  }),

  editPsychiatrist: asyncHandler(async (req, res) => {
    const { username, specialization, availability, contact, googleMeetLink } = req.body;
    const user = await User.findById(req.user.id);
    const psychiatrist = await Psychiatrist.findOne({ user: req.user.id });

    if (!psychiatrist) {
      throw new Error("Psychiatrist not found");
    }
    if (!user) {
      throw new Error("User not found");
    }

    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser._id.toString() !== req.user.id) {
        return res.status(400).json({ message: "This username is already taken." });
      }
      user.username = username;
    }

    if (specialization) psychiatrist.specialization = specialization;
    if (availability) psychiatrist.availability = availability;
    if (contact) psychiatrist.contact = contact;
    if (googleMeetLink) psychiatrist.googleMeetLink = googleMeetLink;

    await psychiatrist.save();
    await user.save();

    res.status(200).json({
      message: "Psychiatrist updated successfully",
      psychiatrist,
    });
  }),

  deletePsychiatrist: asyncHandler(async (req, res) => {
    const { name } = req.body;
    const psychiatrist = await Psychiatrist.findOne({ name });
    if (!psychiatrist) {
      throw new Error("Psychiatrist not found");
    }

    const hasScheduledConsultations = await Consultation.exists({
      psychiatristId: psychiatrist._id,
      status: "Scheduled",
    });

    if (hasScheduledConsultations) {
      throw new Error("Cannot delete psychiatrist with scheduled consultations");
    }

    await psychiatrist.deleteOne();

    res.send("Psychiatrist deleted successfully");
  }),

  getPsychiatrists: asyncHandler(async (req, res) => {
    const psychiatrists = await Psychiatrist.find().populate("user");
    if (!psychiatrists) {
      res.send("No Psychiatrist found");
    }
    res.send(psychiatrists);
  }),

  scheduleConsultation: asyncHandler(async (req, res) => {
    console.log(req.body);
    const { psychiatristId, date, reason } = req.body;
    const userId = req.user.id;

    // Input validation
    if (!psychiatristId || !date) {
      return res.status(400).json({ message: "Psychiatrist ID and date are required" });
    }

    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    // Normalize date to start of the hour
    selectedDate.setMinutes(0, 0, 0);

    // Check user existence
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check psychiatrist existence
    const psychiatrist = await Psychiatrist.findById(psychiatristId);
    if (!psychiatrist) {
      throw new Error("Psychiatrist not found");
    }

    // Check psychiatrist availability
    const dayOfWeek = selectedDate.toLocaleString("en-US", { weekday: "long" });
    const availableSlotsForDay = psychiatrist.availability.find((entry) => entry.day === dayOfWeek);
    if (!availableSlotsForDay) {
      throw new Error("Psychiatrist is unavailable on this day");
    }

    const startHour = parseInt(availableSlotsForDay.start.split(":")[0], 10);
    const endHour = parseInt(availableSlotsForDay.end.split(":")[0], 10);
    const slotHour = selectedDate.getHours();
    if (slotHour < startHour || slotHour >= endHour) {
      throw new Error("Selected time is outside psychiatrist's availability");
    }

    // Check subscription and consultation limits
    const consultationCount = await Consultation.countDocuments({ userId, status: "Scheduled" });
    const activeSubscription = await Payment.findOne({
      user: userId,
      paymentType: "subscription",
      paymentStatus: "completed",
      subscriptionExpiry: { $gte: new Date() },
    });

    if (!activeSubscription) {
      if (consultationCount >= 2) {
        return res.status(403).json({
          message: "Basic plan allows up to 2 consultations. Please subscribe for more sessions.",
        });
      }
    } else {
      const plan = user?.plan;

      if (plan === "basic" && consultationCount >= 2) {
        return res.status(403).json({
          message: "Basic plan allows up to 2 consultations. Upgrade your plan to schedule more.",
        });
      }

      if (plan === "standard" && consultationCount >= 5) {
        return res.status(403).json({
          message: "Standard plan allows up to 5 consultations. Upgrade to premium for unlimited access.",
        });
      }
    }

    // Check for existing consultation
    const existingPsychiatristConsultation = await Consultation.findOne({
      psychiatristId,
      date: selectedDate,
      status: "Scheduled",
    });

    if (existingPsychiatristConsultation) {
      throw new Error("The psychiatrist is not available at this time.");
    }

    // Create consultation
    const consultation = new Consultation({
      userId,
      psychiatristId,
      date: selectedDate,
      status: "Scheduled",
      notes: reason, // Store reason as notes
    });
    await consultation.save();

    res.status(201).json({ message: "Consultation scheduled successfully", consultation });
  }),

  deleteConsultation: asyncHandler(async (req, res) => {
    const { id } = req.body;
    const consultation = await Consultation.findById(id);
    if (!consultation) {
      throw new Error("Consultation not found");
    }

    // Authorize: Only the user who booked or the psychiatrist can cancel
    const psychiatrist = await Psychiatrist.findOne({ user: req.user.id });
    const isPsychiatrist = psychiatrist && consultation.psychiatristId.toString() === psychiatrist._id.toString();
    const isUser = consultation.userId.toString() === req.user.id;

    if (!isUser && !isPsychiatrist) {
      throw new Error("Unauthorized to cancel this consultation");
    }

    // Only Scheduled consultations can be canceled
    if (consultation.status !== "Scheduled") {
      throw new Error("Only scheduled consultations can be canceled");
    }

    // Update status to Canceled instead of deleting
    consultation.status = "Canceled";
    await consultation.save();

    res.send({ message: "Consultation canceled successfully" });
  }),

  completeConsultation: asyncHandler(async (req, res) => {
    const { id, prescriptionNotes } = req.body;
    const userId = req.user.id;

    // Input validation
    if (!id) {
      return res.status(400).json({ message: "Consultation ID is required" });
    }

    const consultation = await Consultation.findById(id);
    if (!consultation) {
      throw new Error("Consultation not found");
    }

    // Authorize: Only the psychiatrist associated with the consultation can complete it
    const psychiatrist = await Psychiatrist.findOne({ user: userId });
    if (!psychiatrist || consultation.psychiatristId.toString() !== psychiatrist._id.toString()) {
      throw new Error("Unauthorized to complete this consultation");
    }

    // Only Scheduled consultations can be completed
    if (consultation.status !== "Scheduled") {
      throw new Error("Only scheduled consultations can be completed");
    }

    // Update status and add prescription notes
    consultation.status = "Completed";
    consultation.prescriptionNotes = prescriptionNotes || "";
    await consultation.save();

    res.status(200).json({ message: "Consultation completed successfully", consultation });
  }),

  getConsultationHistory: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    let consultations;

    if (userRole === 'psychiatrist') {
      const psychiatrist = await Psychiatrist.findOne({ user: userId });
      if (!psychiatrist) {
        return res.status(404).json({ message: 'Psychiatrist profile not found' });
      }
      consultations = await Consultation.find({ psychiatristId: psychiatrist._id })
        .populate('userId', 'username email')
        .populate({
          path: 'psychiatristId',
          populate: { path: 'user', select: 'username' },
        });
    } else {
      consultations = await Consultation.find({ userId })
        .populate({
          path: 'psychiatristId',
          populate: { path: 'user', select: 'username' },
        })
        .populate('userId', 'username email');
    }

    res.status(200).json(consultations);
  }),

  getAvailableTimeSlots: asyncHandler(async (req, res) => {
    const { id, date } = req.body;

    if (!id || !date) {
      return res.status(400).json({ message: "Psychiatrist ID and date are required" });
    }

    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }
    selectedDate.setHours(0, 0, 0, 0);

    const psychiatrist = await Psychiatrist.findById(id);
    if (!psychiatrist) {
      return res.status(404).json({ message: "Psychiatrist not found" });
    }

    const dayOfWeek = selectedDate.toLocaleString("en-US", { weekday: "long" });
    const availableSlotsForDay = psychiatrist.availability.find((entry) => entry.day === dayOfWeek);

    if (!availableSlotsForDay) {
      return res.status(200).json({ message: "Psychiatrist is unavailable on this day", availableSlots: [] });
    }

    const startHour = parseInt(availableSlotsForDay.start.split(":")[0], 10);
    const endHour = parseInt(availableSlotsForDay.end.split(":")[0], 10);
    const slotDuration = 60 * 60 * 1000;

    let allSlots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      let slot = new Date(selectedDate);
      slot.setHours(hour, 0, 0, 0);
      allSlots.push(slot);
    }

    const existingConsultations = await Consultation.find({
      psychiatristId: id,
      date: {
        $gte: selectedDate,
        $lt: new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000),
      },
      status: "Scheduled",
    });

    const bookedSlots = existingConsultations.map((consultation) => new Date(consultation.date).getTime());
    const availableSlots = allSlots.filter((slot) => !bookedSlots.includes(slot.getTime()));

    res.status(200).json({ availableSlots });
  }),

  getPsychiatristProfile: asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('username email');
    if (!user) {
      throw new Error('User not found');
    }

    const psychiatrist = await Psychiatrist.findOne({ user: req.user.id });
    if (!psychiatrist) {
      throw new Error('Psychiatrist not found');
    }

    res.status(200).json({
      user: { username: user.username, email: user.email },
      psychiatrist: {
        specialization: psychiatrist.specialization,
        availability: psychiatrist.availability,
        contact: psychiatrist.contact,
        googleMeetLink: psychiatrist.googleMeetLink,
      },
    });
  }),
};

module.exports = psychiatristController;
const express = require("express");
const userAuthentication = require("../middlewares/userAuthentication");
const psychiatristController = require("../controllers/psychiatristController");
const psychiatristRoutes = express.Router();

psychiatristRoutes.post("/add", userAuthentication,psychiatristController.addPsychiatrist);
psychiatristRoutes.post("/slots", userAuthentication,psychiatristController.getAvailableTimeSlots);
psychiatristRoutes.put("/edit", userAuthentication,psychiatristController.editPsychiatrist);
psychiatristRoutes.get("/viewall", userAuthentication,psychiatristController.getPsychiatrists);
psychiatristRoutes.delete("/delete", userAuthentication,psychiatristController.deletePsychiatrist);
psychiatristRoutes.post('/complete', userAuthentication , psychiatristController.completeConsultation); // New route
psychiatristRoutes.put("/schedule", userAuthentication,psychiatristController.scheduleConsultation);
psychiatristRoutes.get("/history", userAuthentication,psychiatristController.getConsultationHistory);
psychiatristRoutes.delete("/remove", userAuthentication,psychiatristController.deleteConsultation);
psychiatristRoutes.get("/profile", userAuthentication, psychiatristController.getPsychiatristProfile);

module.exports = psychiatristRoutes;
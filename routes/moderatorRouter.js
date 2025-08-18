const express = require("express");
const userAuthentication = require("../middlewares/userAuthentication");
const moderatorController = require("../controllers/moderatorController");
const moderatorRoutes = express.Router();

moderatorRoutes.get("/viewpsy", userAuthentication,moderatorController.viewallPsy);
moderatorRoutes.put("/verify/:id", userAuthentication,moderatorController.verifyPsy);

module.exports = moderatorRoutes;
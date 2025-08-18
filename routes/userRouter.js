const express = require("express");
const userController = require("../controllers/userController");
const userAuthentication = require("../middlewares/userAuthentication");
const upload = require("../middlewares/cloudinary");
const userRoutes = express.Router();

userRoutes.post("/register",upload.single("resume"), userController.register);
userRoutes.post("/login", userController.login);
userRoutes.put("/edit", userAuthentication,userController.profile);
userRoutes.delete("/logout", userController.logout);
userRoutes.get("/view", userAuthentication,userController.getUserProfile);
userRoutes.post("/forgot", userController.forgotPassword);
userRoutes.post("/reset", userController.resetPassword);

module.exports = userRoutes;
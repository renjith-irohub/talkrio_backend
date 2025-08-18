const express = require("express");
const userAuthentication = require("../middlewares/userAuthentication");
const resourceController = require("../controllers/resourceController");
const  upload  = require("../middlewares/cloudinary");
const resourceRoutes = express.Router();

resourceRoutes.post("/add", userAuthentication,upload.single("link"),resourceController.addResource);
resourceRoutes.get("/view", userAuthentication,resourceController.getResources);
resourceRoutes.get("/search", userAuthentication,resourceController.searchResources);
resourceRoutes.delete("/delete", userAuthentication,resourceController.deleteResource);

module.exports = resourceRoutes;
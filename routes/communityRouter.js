const express = require("express");
const userAuthentication = require("../middlewares/userAuthentication");
const communityController = require("../controllers/communityController");
const communityRoutes = express.Router();

communityRoutes.post("/add", userAuthentication,communityController.createCommunity);
communityRoutes.get("/viewall", userAuthentication,communityController.getAllCommunities);
communityRoutes.get("/search", userAuthentication,communityController.getCommunityById);
communityRoutes.post("/join", userAuthentication,communityController.joinCommunity);
communityRoutes.delete("/delete", userAuthentication,communityController.deleteCommunity);
communityRoutes.delete("/leave", userAuthentication,communityController.leaveCommunity);

module.exports = communityRoutes;
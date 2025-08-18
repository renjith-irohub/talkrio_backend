const express = require("express");
const userAuthentication = require("../middlewares/userAuthentication");
const reportController = require("../controllers/reportController");
const moderatorController = require("../controllers/moderatorController");
const reportRoutes = express.Router();

reportRoutes.post("/post", userAuthentication, reportController.reportPost);
reportRoutes.post("/comment", userAuthentication, reportController.reportComment);
reportRoutes.get("/viewpost", userAuthentication, reportController.getReportsByPost);
reportRoutes.get("/viewcomment", userAuthentication, reportController.getReportsByComment);
reportRoutes.delete("/delete", userAuthentication, reportController.deleteReport);

reportRoutes.get("/viewall", userAuthentication, moderatorController.reviewReports);
reportRoutes.put("/actions", userAuthentication, moderatorController.takeActionOnReport);
reportRoutes.delete("/delete-post/:postId", userAuthentication, moderatorController.deletePost);

module.exports = reportRoutes;
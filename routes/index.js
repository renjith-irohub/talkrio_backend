const express=require("express");
const userRoutes = require("./userRouter");
const postRoutes = require("./postRouter");
const commentRoutes = require("./commentRouter");
const reportRoutes = require("./reportRouter");
const chatRouter = require("./chatRouter");
const psychiatristRoutes = require("./psychiatristRouter");
const resourceRoutes = require("./resourceRouter");
const communityRoutes = require("./communityRouter");
const notificationRouter = require("./notificationRouter");
const paymentRouter = require("./paymentRouter");
const moderatorRoutes = require("./moderatorRouter");
const router=express()

router.use("/payment", paymentRouter);
router.use(express.json())
router.use("/users", userRoutes);
router.use("/post", postRoutes);
router.use("/moderator", moderatorRoutes);
router.use("/comment", commentRoutes);
router.use("/report", reportRoutes);
router.use("/bot", chatRouter);
router.use("/psychiatrist", psychiatristRoutes);
router.use("/resource", resourceRoutes);
router.use("/community", communityRoutes);
router.use("/notification", notificationRouter);



module.exports=router
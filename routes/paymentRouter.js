const express = require("express");
const userAuthentication = require("../middlewares/userAuthentication");
const paymentController = require("../controllers/paymentController");

const paymentRouter = express.Router();

paymentRouter.post("/webhook", express.raw({ type: "application/json" }), paymentController.webhook);
paymentRouter.post("/checkout",express.json(), userAuthentication, paymentController.processPayment);
paymentRouter.put("/update",express.json(), userAuthentication, paymentController.updatePaymentStatus);
paymentRouter.get("/all",express.json(), userAuthentication, paymentController.getPayments);
paymentRouter.get("/:id",express.json(), userAuthentication, paymentController.getPaymentById);

module.exports = paymentRouter;
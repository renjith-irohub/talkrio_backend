const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Assuming agents are stored in the User model
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["credit_card", "debit_card", "paypal", "bank_transfer", "cash"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    transactionId: {
      type: String,
      unique: true, // Ensures no duplicate transactions
      sparse: true, // Allows null values
    },
    paymentType: {
      type: String,
      enum: ["per_listing", "subscription"],
      required: true,
    },
    plan: {
      type: String,
      enum: ["basic", "standard","vip"],
      required: function () {
        return this.paymentType === "subscription";
      },
    },
    subscriptionExpiry: {
      type: Date,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    receiptUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;
// models/PayUser.js
const mongoose = require("mongoose");

const payUserSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  amount: Number,
  paymentMethod: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("PayUser", payUserSchema);
